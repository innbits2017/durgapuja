import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSevaSubmittedWhatsApp } from "@/lib/whatsapp";

const VALID_BLOCKS = ["P1", "P2", "Villa"];

const MATERIAL_IDS = [
  "rice",
  "grocery",
  "vegetables",
  "full_prasad",
  "cylinder",
  "water_cans",
  "sukha_prasad",
];

const VOLUNTEER_IDS = [
  "cooking_management",
  "grocery_purchase",
  "deity_keeper",
  "idol_help",
  "decoration",
  "chanda_collection",
  "tent_puja_place",
  "idol_transportation",
  "puja_material",
  "flower",
  "daily_prasad",
  "fruits_vegetables",
  "prasad_meals",
  "cultural_program",
  "devotee_management",
  "cleanliness",
];

function generateSevaNo() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SEVA-2026-${random}`;
}

/**
 * Creates the text that will be inserted into:
 *
 * {{3}} Selected Seva Details
 *
 * Example:
 *
 * Rice - 10 kg
 * Full One-Time Prasad
 * Volunteer: Decoration
 * Volunteer: Cooking Management
 */
function buildSevaDetails(
  materials: Array<{
    type?: string;
    title?: string;
    quantity?: number | null;
    unit?: string | null;
  }>,
  volunteerRoleNames: string[]
) {
  const details: string[] = [];

  for (const item of materials) {
    const title = String(item.title || "").trim();

    if (!title) continue;

    if (
      item.type !== "full_prasad" &&
      item.type !== "cylinder" &&
      item.quantity !== null &&
      item.quantity !== undefined &&
      item.quantity !== ""
    ) {
      const quantity = Number(item.quantity);

      if (Number.isFinite(quantity)) {
        details.push(
          `${title} - ${quantity}${item.unit ? ` ${item.unit}` : ""}`
        );
        continue;
      }
    }

    details.push(title);
  }

  for (const role of volunteerRoleNames) {
    const cleanRole = String(role || "").trim();

    if (cleanRole) {
      details.push(`Volunteer: ${cleanRole}`);
    }
  }

  return details.join("\n") || "Seva";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      block,
      flatNo,
      mobile,
      materials,
      volunteerRoles,
      volunteerRoleNames,
      volunteerNote,
    } = body;

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required." },
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

    const cleanMobile = String(mobile || "").replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json(
        {
          error: "Please enter a valid 10-digit mobile number.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(materials)) {
      return NextResponse.json(
        { error: "Invalid material Seva data." },
        { status: 400 }
      );
    }

    if (!Array.isArray(volunteerRoles)) {
      return NextResponse.json(
        { error: "Invalid volunteer Seva data." },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       CLEAN MATERIAL SEVA
    ------------------------------------------------------- */

    const cleanMaterials = materials
      .filter(
        (item) =>
          item &&
          typeof item.type === "string" &&
          MATERIAL_IDS.includes(item.type)
      )
      .map((item) => ({
        type: item.type,
        title: String(item.title || "").trim(),
        quantity:
          item.quantity === null ||
          item.quantity === undefined ||
          item.quantity === ""
            ? null
            : Number(item.quantity),
        unit: String(item.unit || "").trim() || null,
      }));

    /* -------------------------------------------------------
       VALIDATE QUANTITIES
    ------------------------------------------------------- */

    for (const item of cleanMaterials) {
      if (
        item.type !== "full_prasad" &&
        item.type !== "cylinder"
      ) {
        if (
          !Number.isFinite(item.quantity) ||
          Number(item.quantity) <= 0
        ) {
          return NextResponse.json(
            {
              error: `Please provide a valid quantity for ${
                item.title || item.type
              }.`,
            },
            { status: 400 }
          );
        }
      }
    }

    /* -------------------------------------------------------
       CLEAN VOLUNTEER ROLES
    ------------------------------------------------------- */

    const cleanVolunteerRoles = volunteerRoles.filter(
      (id: unknown) =>
        typeof id === "string" &&
        VOLUNTEER_IDS.includes(id)
    );

    if (
      !cleanMaterials.length &&
      !cleanVolunteerRoles.length
    ) {
      return NextResponse.json(
        {
          error: "Please select at least one Seva.",
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       CLEAN VOLUNTEER ROLE NAMES
    ------------------------------------------------------- */

    const cleanVolunteerRoleNames =
      Array.isArray(volunteerRoleNames)
        ? volunteerRoleNames
            .filter(
              (item: unknown) =>
                typeof item === "string"
            )
            .map((item: string) => item.trim())
            .filter(Boolean)
        : [];

    /* -------------------------------------------------------
       GENERATE SEVA NUMBER
    ------------------------------------------------------- */

    const sevaNo = generateSevaNo();

    /* -------------------------------------------------------
       SAVE TO SUPABASE
    ------------------------------------------------------- */

    const { data, error } = await supabaseAdmin
      .from("seva_registrations")
      .insert({
        seva_no: sevaNo,
        name: name.trim(),
        block,
        flat_no: flatNo.trim(),
        mobile: cleanMobile,
        materials: cleanMaterials,
        volunteer_roles: cleanVolunteerRoles,
        volunteer_role_names: cleanVolunteerRoleNames,
        volunteer_note:
          volunteerNote?.trim() || null,
        status: "pending",
      })
      .select("id, seva_no")
      .single();

    if (error) {
      console.error(
        "Seva insert error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to submit Seva registration. Please try again.",
        },
        { status: 500 }
      );
    }

    /* -------------------------------------------------------
       BUILD WHATSAPP SEVA DETAILS
    ------------------------------------------------------- */

    const sevaDetails = buildSevaDetails(
      cleanMaterials,
      cleanVolunteerRoleNames
    );

    console.log(
      "Seva registration created:",
      {
        id: data.id,
        sevaNo: data.seva_no,
        name: name.trim(),
        mobile: cleanMobile,
        sevaDetails,
      }
    );

    /* -------------------------------------------------------
       SEND WHATSAPP SUBMISSION MESSAGE
       
       IMPORTANT:
       WhatsApp failure must NOT delete or invalidate
       the Seva registration.
    ------------------------------------------------------- */

    let whatsappSent = false;
    let whatsappMessageId: string | null = null;
    let whatsappError: string | null = null;

    try {
      const whatsappResult =
        await sendSevaSubmittedWhatsApp({
          mobile: cleanMobile,
          name: name.trim(),
          sevaNo: data.seva_no,
          sevaDetails,
        });

      whatsappSent = Boolean(
        whatsappResult?.sent
      );

      whatsappMessageId =
        whatsappResult?.messageId || null;

      whatsappError =
        whatsappResult?.error || null;

      console.log(
        "Seva WhatsApp result:",
        {
          sevaNo: data.seva_no,
          mobile: cleanMobile,
          sent: whatsappSent,
          messageId: whatsappMessageId,
          error: whatsappError,
        }
      );
    } catch (whatsappException) {
      whatsappError =
        whatsappException instanceof Error
          ? whatsappException.message
          : "Unknown WhatsApp error.";

      console.error(
        "Seva WhatsApp send failed:",
        {
          sevaNo: data.seva_no,
          mobile: cleanMobile,
          error: whatsappException,
        }
      );
    }

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        id: data.id,
        sevaNo: data.seva_no,

        // Useful for debugging.
        // The frontend does not need to use these.
        whatsappSent,
        whatsappMessageId,
        whatsappError,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Seva API error:",
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