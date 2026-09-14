import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSevaSubmittedWhatsApp } from "@/lib/whatsapp";

const VALID_BLOCKS = ["P1", "P2", "Villa"] as const;

const MATERIAL_IDS = [
  "rice",
  "dal",
  "vegetables",
  "full_prasad",
  "cylinder",
  "water_cans",
  "sukha_prasad",
] as const;

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
] as const;

type MaterialInput = {
  type?: unknown;
  title?: unknown;
  quantity?: unknown;
  unit?: unknown;
};

function generateSevaNo() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SEVA-2026-${random}`;
}

/**
 * WhatsApp template variables must be plain text.
 *
 * Remove:
 * - new lines
 * - tabs
 * - excessive spaces
 *
 * Also keep the parameter comfortably below the WhatsApp
 * variable length limit.
 */
function sanitizeWhatsAppParameter(value: string) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{5,}/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

/**
 * Create a WhatsApp-safe, single-line Seva description.
 */
function formatSevaDetails(
  materials: Array<{
    type: string;
    title: string;
    quantity: number | null;
    unit: string | null;
  }>,
  volunteerRoleNames: string[],
  volunteerNote: string | null
) {
  const parts: string[] = [];

  // Material Seva
  if (materials.length > 0) {
    const materialDetails = materials.map((item) => {
      if (
        item.type === "full_prasad" ||
        item.type === "cylinder"
      ) {
        return item.title;
      }

      if (item.quantity !== null) {
        return `${item.title}: ${item.quantity}${
          item.unit ? ` ${item.unit}` : ""
        }`;
      }

      return item.title;
    });

    parts.push(
      `Material Seva: ${materialDetails.join(", ")}`
    );
  }

  // Volunteer Seva
  if (volunteerRoleNames.length > 0) {
    parts.push(
      `Volunteer Seva: ${volunteerRoleNames.join(", ")}`
    );
  }

  // Volunteer note
  if (volunteerNote) {
    parts.push(`Note: ${volunteerNote}`);
  }

  return sanitizeWhatsAppParameter(parts.join(" | "));
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

    // ---------------------------------------------------------
    // Basic validation
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // Mobile validation
    // ---------------------------------------------------------

    const cleanMobile = String(mobile || "").replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json(
        {
          error: "Please enter a valid 10-digit mobile number.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Materials validation
    // ---------------------------------------------------------

    if (!Array.isArray(materials)) {
      return NextResponse.json(
        {
          error: "Invalid material Seva data.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(volunteerRoles)) {
      return NextResponse.json(
        {
          error: "Invalid volunteer Seva data.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Clean materials
    // ---------------------------------------------------------

    const cleanMaterials = materials
      .filter((item: unknown): item is MaterialInput => {
        if (!item || typeof item !== "object") {
          return false;
        }

        const material = item as MaterialInput;

        const type = String(material.type || "").trim();

        return MATERIAL_IDS.includes(
          type as (typeof MATERIAL_IDS)[number]
        );
      })
      .map((item: MaterialInput) => {
        const materialType = String(item.type || "").trim();

        const quantity =
          item.quantity === null ||
          item.quantity === undefined ||
          item.quantity === ""
            ? null
            : Number(item.quantity);

        return {
          type: materialType,
          title: String(item.title || "").trim(),
          quantity,
          unit: String(item.unit || "").trim() || null,
        };
      });

    // ---------------------------------------------------------
    // Quantity validation
    //
    // Quantity NOT required for:
    // - Full One-Time Prasad
    // - Gas Cylinder
    // ---------------------------------------------------------

    for (const item of cleanMaterials) {
      const materialType = String(item.type);

      const quantityNotRequired =
        materialType === "full_prasad" ||
        materialType === "cylinder";

      if (!quantityNotRequired) {
        if (
          item.quantity === null ||
          !Number.isFinite(Number(item.quantity)) ||
          Number(item.quantity) <= 0
        ) {
          return NextResponse.json(
            {
              error: `Please provide a valid quantity for ${
                item.title || materialType
              }.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // ---------------------------------------------------------
    // Clean volunteer roles
    // ---------------------------------------------------------

    const cleanVolunteerRoles = volunteerRoles.filter(
      (id: unknown): id is string => {
        if (typeof id !== "string") {
          return false;
        }

        return VOLUNTEER_IDS.includes(
          id as (typeof VOLUNTEER_IDS)[number]
        );
      }
    );

    // ---------------------------------------------------------
    // Clean volunteer role names
    // ---------------------------------------------------------

    const cleanVolunteerRoleNames = Array.isArray(
      volunteerRoleNames
    )
      ? volunteerRoleNames
          .filter((item: unknown) => typeof item === "string")
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];

    // ---------------------------------------------------------
    // At least one Seva required
    // ---------------------------------------------------------

    if (
      cleanMaterials.length === 0 &&
      cleanVolunteerRoles.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Please select at least one Seva.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Volunteer note
    // ---------------------------------------------------------

    const cleanVolunteerNote =
      typeof volunteerNote === "string"
        ? volunteerNote.trim()
        : "";

    // ---------------------------------------------------------
    // Generate Seva number
    // ---------------------------------------------------------

    const sevaNo = generateSevaNo();

    // ---------------------------------------------------------
    // Insert into Supabase
    // ---------------------------------------------------------

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
        volunteer_note: cleanVolunteerNote || null,
        status: "pending",
      })
      .select("id, seva_no")
      .single();

    if (error) {
      console.error("Seva insert error:", error);

      return NextResponse.json(
        {
          error:
            "Unable to submit Seva registration. Please try again.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // WhatsApp notification
    // ---------------------------------------------------------

    let whatsappSent = false;
    let whatsappMessageId: string | null = null;
    let whatsappError: string | null = null;

    try {
      const sevaDetails = formatSevaDetails(
        cleanMaterials,
        cleanVolunteerRoleNames,
        cleanVolunteerNote || null
      );

      console.log("Seva WhatsApp details:", {
        sevaNo: data.seva_no,
        details: sevaDetails,
      });

      const whatsappResult =
        await sendSevaSubmittedWhatsApp({
          mobile: cleanMobile,
          name: name.trim(),
          sevaNo: data.seva_no,
          sevaDetails,
        });

      whatsappSent = Boolean(whatsappResult?.sent);

      whatsappMessageId =
        whatsappResult?.messageId || null;

      if (!whatsappSent && whatsappResult?.error) {
        whatsappError = whatsappResult.error;
      }

      console.log("Seva WhatsApp result:", {
        sevaNo: data.seva_no,
        mobile: cleanMobile,
        sent: whatsappSent,
        messageId: whatsappMessageId,
        error: whatsappError,
      });
    } catch (whatsappErrorValue) {
      whatsappError =
        whatsappErrorValue instanceof Error
          ? whatsappErrorValue.message
          : String(whatsappErrorValue);

      console.error(
        "Seva WhatsApp notification failed:",
        whatsappErrorValue
      );
    }

    // ---------------------------------------------------------
    // Success
    // ---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        id: data.id,
        sevaNo: data.seva_no,
        whatsappSent,
        whatsappMessageId,
        whatsappError,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seva API error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}