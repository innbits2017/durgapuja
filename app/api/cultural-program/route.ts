import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendCulturalProgramSubmittedWhatsApp } from "@/lib/whatsapp";

const VALID_BLOCKS = ["P1", "P2", "Villa"];

const VALID_PARTICIPANT_TYPES = [
  "Child",
  "Adult",
  "Senior Citizen",
];

const VALID_PERFORMANCE_TYPES = ["Individual", "Group"];

const VALID_CATEGORIES = [
  "Dance",
  "Singing",
  "Drama / Skit",
  "Instrumental",
  "Recitation",
  "Other",
];

const VALID_DURATIONS = [
  "Up to 3 minutes",
  "3–5 minutes",
  "5–10 minutes",
  "More than 10 minutes",
];

function generateRegistrationNo() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CP-2026-${random}`;
}

function sanitizeWhatsAppParameter(value: string) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

/*
  Find the lowest available cultural-program slot.

  Example:

  Existing slots:
  [8]

  Returns:
  1

  If existing slots are:
  [1, 2, 4, 8]

  Returns:
  3

  If existing slots are:
  [1, 2, 3, 4, 5, 6, 7, 8]

  Returns:
  9
*/
async function getNextAvailableSlot() {
  const { data, error } = await supabaseAdmin
    .from("cultural_program_registrations")
    .select("slot_number")
    .not("slot_number", "is", null)
    .order("slot_number", { ascending: true });

  if (error) {
    console.error(
      "Cultural program slot lookup error:",
      error
    );

    throw new Error(
      "Unable to determine the next cultural program slot."
    );
  }

  const usedSlots = new Set(
    (data ?? [])
      .map((item) => Number(item.slot_number))
      .filter(
        (slot) =>
          Number.isInteger(slot) &&
          slot > 0
      )
  );

  let slot = 1;

  while (usedSlots.has(slot)) {
    slot += 1;
  }

  return slot;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      participantName,
      age,
      block,
      flatNo,
      participantType,
      mobile,
      email,
      performanceType,
      groupName,
      category,
      performanceTitle,
      description,
      duration,
    } = body;

    /* ==========================================================
       VALIDATION
    ========================================================== */

    if (!participantName?.trim()) {
      return NextResponse.json(
        { error: "Participant name is required." },
        { status: 400 }
      );
    }

    const numericAge = Number(age);

    if (
      !Number.isInteger(numericAge) ||
      numericAge < 1 ||
      numericAge > 100
    ) {
      return NextResponse.json(
        { error: "Please enter a valid age." },
        { status: 400 }
      );
    }

    if (!VALID_BLOCKS.includes(block)) {
      return NextResponse.json(
        { error: "Invalid block." },
        { status: 400 }
      );
    }

    if (!flatNo?.trim()) {
      return NextResponse.json(
        { error: "Flat number is required." },
        { status: 400 }
      );
    }

    if (!VALID_PARTICIPANT_TYPES.includes(participantType)) {
      return NextResponse.json(
        { error: "Invalid participant type." },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile || "").replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (!VALID_PERFORMANCE_TYPES.includes(performanceType)) {
      return NextResponse.json(
        { error: "Invalid performance type." },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Invalid program category." },
        { status: 400 }
      );
    }

    if (!performanceTitle?.trim()) {
      return NextResponse.json(
        { error: "Performance title is required." },
        { status: 400 }
      );
    }

    if (!VALID_DURATIONS.includes(duration)) {
      return NextResponse.json(
        { error: "Invalid expected duration." },
        { status: 400 }
      );
    }

    const registrationNo = generateRegistrationNo();

    /* ==========================================================
       SLOT ALLOCATION

       We no longer depend on the PostgreSQL sequence.

       The system finds the LOWEST AVAILABLE slot.

       Example:

       Existing:
       Amaira -> Slot 8

       New registration:
       -> Slot 1

       Then:
       -> Slot 2
       -> Slot 3
       -> etc.

       Existing registrations are never changed.
    ========================================================== */

    let data: any = null;
    let error: any = null;

    /*
      Retry a few times in case two people submit at almost
      exactly the same time and attempt to take the same slot.

      The database should have a UNIQUE constraint on slot_number.
    */
    for (let attempt = 1; attempt <= 3; attempt++) {
      const slotNumber = await getNextAvailableSlot();

      const result = await supabaseAdmin
        .from("cultural_program_registrations")
        .insert({
          registration_no: registrationNo,
          participant_name: participantName.trim(),
          age: numericAge,
          block,
          flat_no: flatNo.trim(),
          participant_type: participantType,
          mobile: cleanMobile,
          email: email?.trim() || null,
          performance_type: performanceType,
          group_name:
            performanceType === "Group"
              ? groupName?.trim() || null
              : null,
          category,
          performance_title: performanceTitle.trim(),
          description: description?.trim() || null,
          duration,
          status: "pending",

          // IMPORTANT:
          // We explicitly assign the calculated slot.
          slot_number: slotNumber,
        })
        .select(
          "id, registration_no, participant_name, performance_title, slot_number"
        )
        .single();

      data = result.data;
      error = result.error;

      /*
        PostgreSQL unique violation.

        This can happen if two people register at exactly
        the same time and both calculated the same slot.

        Retry and calculate the next available slot again.
      */
      if (error?.code === "23505") {
        console.warn(
          `Slot ${slotNumber} was taken during registration. Retrying...`
        );

        continue;
      }

      break;
    }

    if (error || !data) {
      console.error(
        "Cultural program insert error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to submit registration. Please try again.",
        },
        { status: 500 }
      );
    }

    /* ==========================================================
       WHATSAPP SUBMISSION CONFIRMATION
    ========================================================== */

    let whatsappSent = false;
    let whatsappSkipped = false;
    let whatsappError: string | null = null;
    let whatsappMessageId: string | null = null;

    try {
      const result =
        await sendCulturalProgramSubmittedWhatsApp({
          mobile: cleanMobile,

          participantName:
            sanitizeWhatsAppParameter(
              data.participant_name ??
                participantName.trim()
            ),

          registrationNo:
            sanitizeWhatsAppParameter(
              data.registration_no ??
                registrationNo
            ),

          performanceTitle:
            sanitizeWhatsAppParameter(
              data.performance_title ??
                performanceTitle.trim()
            ),
        });

      whatsappSent = Boolean(result.sent);
      whatsappSkipped = Boolean(result.skipped);

      whatsappError = result.sent
        ? null
        : result.error || null;

      whatsappMessageId =
        result.messageId || null;

      if (!result.sent && result.error) {
        console.error(
          "Cultural program submitted WhatsApp notification failed:",
          result.error
        );
      }
    } catch (error) {
      whatsappError =
        error instanceof Error
          ? error.message
          : "WhatsApp submission message failed.";

      console.error(
        "Cultural program WhatsApp error:",
        error
      );
    }

    /* ==========================================================
       RESPONSE
    ========================================================== */

    return NextResponse.json(
      {
        success: true,
        id: data.id,
        registrationNo: data.registration_no,
        slotNumber: data.slot_number,
        whatsappSent,
        whatsappSkipped,
        whatsappMessageId,
        whatsappError,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Cultural program API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}