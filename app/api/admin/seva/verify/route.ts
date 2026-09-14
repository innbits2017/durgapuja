import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSevaConfirmedWhatsApp } from "@/lib/whatsapp";

const ALLOWED_STATUSES = [
  "contacted",
  "confirmed",
  "completed",
  "rejected",
] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

type MaterialItem = {
  type?: string;
  title?: string;
  quantity?: number | null;
  unit?: string | null;
};

function sanitizeWhatsAppParameter(value: string) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

function formatSevaDetails(
  materials: unknown,
  volunteerRoleNames: unknown,
  volunteerNote: unknown
) {
  const parts: string[] = [];

  // ---------------------------------------------------------
  // Material Seva
  // ---------------------------------------------------------

  if (Array.isArray(materials) && materials.length > 0) {
    const materialDetails = materials
      .filter(
        (item): item is MaterialItem =>
          item !== null && typeof item === "object"
      )
      .map((item) => {
        const title = String(item.title || "").trim();
        const type = String(item.type || "").trim();

        if (
          type === "full_prasad" ||
          type === "cylinder"
        ) {
          return title || type;
        }

        if (
          item.quantity !== null &&
          item.quantity !== undefined &&
          Number.isFinite(Number(item.quantity))
        ) {
          return `${title || type}: ${item.quantity}${
            item.unit ? ` ${item.unit}` : ""
          }`;
        }

        return title || type;
      })
      .filter(Boolean);

    if (materialDetails.length > 0) {
      parts.push(
        `Material Seva: ${materialDetails.join(", ")}`
      );
    }
  }

  // ---------------------------------------------------------
  // Volunteer Seva
  // ---------------------------------------------------------

  if (
    Array.isArray(volunteerRoleNames) &&
    volunteerRoleNames.length > 0
  ) {
    const roles = volunteerRoleNames
      .filter((role): role is string => typeof role === "string")
      .map((role) => role.trim())
      .filter(Boolean);

    if (roles.length > 0) {
      parts.push(
        `Volunteer Seva: ${roles.join(", ")}`
      );
    }
  }

  // ---------------------------------------------------------
  // Volunteer note
  // ---------------------------------------------------------

  if (
    typeof volunteerNote === "string" &&
    volunteerNote.trim()
  ) {
    parts.push(`Note: ${volunteerNote.trim()}`);
  }

  return sanitizeWhatsAppParameter(
    parts.join(" | ")
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    const status = body.status as AllowedStatus;

    // ---------------------------------------------------------
    // Validate ID
    // ---------------------------------------------------------

    if (!id) {
      return NextResponse.json(
        {
          error: "Seva registration ID is required.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Validate status
    // ---------------------------------------------------------

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid Seva status.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Get existing Seva
    //
    // We need the complete record because WhatsApp confirmation
    // requires the Seva details.
    // ---------------------------------------------------------

    const { data: existing, error: lookupError } =
      await supabaseAdmin
        .from("seva_registrations")
        .select(
          `
          id,
          seva_no,
          name,
          block,
          flat_no,
          mobile,
          materials,
          volunteer_roles,
          volunteer_role_names,
          volunteer_note,
          status,
          admin_note,
          created_at,
          updated_at
          `
        )
        .eq("id", id)
        .maybeSingle();

    if (lookupError) {
      console.error(
        "Seva lookup error:",
        lookupError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find Seva registration.",
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Seva registration not found.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // Prevent rejected → active
    // ---------------------------------------------------------

    if (
      existing.status === "rejected" &&
      status !== "rejected"
    ) {
      return NextResponse.json(
        {
          error:
            "A rejected Seva registration cannot be moved back to an active status.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Remember previous status
    //
    // WhatsApp confirmation should be sent only when the Seva
    // actually changes to "confirmed".
    //
    // This prevents sending duplicate WhatsApp messages if the
    // admin clicks Confirm again.
    // ---------------------------------------------------------

    const wasAlreadyConfirmed =
      existing.status === "confirmed";

    // ---------------------------------------------------------
    // Update status
    // ---------------------------------------------------------

    const { data, error } = await supabaseAdmin
      .from("seva_registrations")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        id,
        seva_no,
        name,
        block,
        flat_no,
        mobile,
        materials,
        volunteer_roles,
        volunteer_role_names,
        volunteer_note,
        status,
        admin_note,
        created_at,
        updated_at
        `
      )
      .single();

    if (error) {
      console.error(
        "Seva status update error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to update Seva registration.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // WhatsApp confirmation
    //
    // Only send when:
    //
    // previous status != confirmed
    // AND
    // new status == confirmed
    // ---------------------------------------------------------

    let whatsappSent = false;
    let whatsappMessageId: string | null = null;
    let whatsappError: string | null = null;

    if (
      status === "confirmed" &&
      !wasAlreadyConfirmed
    ) {
      try {
        const sevaDetails = formatSevaDetails(
          data.materials,
          data.volunteer_role_names,
          data.volunteer_note
        );

        console.log(
          "Sending Seva confirmation WhatsApp:",
          {
            sevaNo: data.seva_no,
            mobile: data.mobile,
            name: data.name,
            details: sevaDetails,
          }
        );

        const whatsappResult =
          await sendSevaConfirmedWhatsApp({
            mobile: data.mobile,
            name: data.name,
            sevaNo: data.seva_no,
            sevaDetails,
          });

        whatsappSent = Boolean(
          whatsappResult?.sent
        );

        whatsappMessageId =
          whatsappResult?.messageId || null;

        if (
          !whatsappSent &&
          whatsappResult?.error
        ) {
          whatsappError =
            whatsappResult.error;
        }

        console.log(
          "Seva confirmation WhatsApp result:",
          {
            sevaNo: data.seva_no,
            mobile: data.mobile,
            sent: whatsappSent,
            messageId: whatsappMessageId,
            error: whatsappError,
          }
        );
      } catch (error) {
        whatsappError =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          "Seva confirmation WhatsApp failed:",
          error
        );

        // IMPORTANT:
        // Do not fail the admin status update just
        // because WhatsApp failed.
      }
    }

    // ---------------------------------------------------------
    // Response
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      seva: data,
      whatsappSent,
      whatsappMessageId,
      whatsappError,
    });
  } catch (error) {
    console.error(
      "Admin Seva API error:",
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