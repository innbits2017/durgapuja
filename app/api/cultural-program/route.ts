import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!participantName?.trim()) {
      return NextResponse.json(
        {
          error: "Participant name is required.",
        },
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
        {
          error: "Please enter a valid age.",
        },
        { status: 400 }
      );
    }

    if (!VALID_BLOCKS.includes(block)) {
      return NextResponse.json(
        {
          error: "Invalid block.",
        },
        { status: 400 }
      );
    }

    if (!flatNo?.trim()) {
      return NextResponse.json(
        {
          error: "Flat number is required.",
        },
        { status: 400 }
      );
    }

    if (!VALID_PARTICIPANT_TYPES.includes(participantType)) {
      return NextResponse.json(
        {
          error: "Invalid participant type.",
        },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile || "").replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json(
        {
          error: "Please enter a valid 10-digit mobile number.",
        },
        { status: 400 }
      );
    }

    if (!VALID_PERFORMANCE_TYPES.includes(performanceType)) {
      return NextResponse.json(
        {
          error: "Invalid performance type.",
        },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          error: "Invalid program category.",
        },
        { status: 400 }
      );
    }

    if (!performanceTitle?.trim()) {
      return NextResponse.json(
        {
          error: "Performance title is required.",
        },
        { status: 400 }
      );
    }

    if (!VALID_DURATIONS.includes(duration)) {
      return NextResponse.json(
        {
          error: "Invalid expected duration.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // REGISTRATION NUMBER
    // -----------------------------------------

    const registrationNo = generateRegistrationNo();

    // -----------------------------------------
    // INSERT REGISTRATION
    //
    // IMPORTANT:
    // slot_number is intentionally NOT included.
    //
    // Supabase/PostgreSQL will automatically assign
    // the next slot using:
    //
    // cultural_program_slot_seq
    // -----------------------------------------

    const { data, error } = await supabaseAdmin
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

        // Registration starts as pending.
        // Slot is assigned automatically by the database.
        status: "pending",
      })
      .select(
        "id, registration_no, slot_number"
      )
      .single();

    // -----------------------------------------
    // INSERT ERROR
    // -----------------------------------------

    if (error) {
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

    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    return NextResponse.json(
      {
        success: true,
        id: data.id,
        registrationNo: data.registration_no,

        // This is the slot automatically generated
        // by PostgreSQL.
        slotNumber: data.slot_number,
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