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

function sanitizeWhatsAppParameter(value: unknown) {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

function formatSevaDetails(seva: {
  materials?: unknown;
  volunteer_role_names?: unknown;
  amount?: number | string | null;
  payment_method?: string | null;
  utr?: string | null;
}) {
  const parts: string[] = [];

  const materials = Array.isArray(seva.materials)
    ? seva.materials
    : [];

  for (const raw of materials) {
    if (!raw || typeof raw !== "object") continue;

    const item = raw as Record<string, unknown>;
    const title = String(item.title || item.type || "").trim();
    const pkg = String(item.package || "").trim();
    const day = String(item.day || "").trim();
    const price = Number(item.price || 0);

    if (!title) continue;

    const detailParts = [
      title,
      pkg,
      day,
      price > 0
        ? `Rs.${price.toLocaleString("en-IN")}`
        : "",
    ].filter(Boolean);

    parts.push(detailParts.join(": ").replace(": " + day, `, ${day}`));
  }

  const volunteerRoles = Array.isArray(seva.volunteer_role_names)
    ? seva.volunteer_role_names
    : [];

  for (const role of volunteerRoles) {
    const name = String(role || "").trim();
    if (name) parts.push(`${name}: Volunteer`);
  }

  const amount = Number(seva.amount || 0);

  if (amount > 0) {
    parts.push(
      `Total Sponsorship: Rs.${amount.toLocaleString("en-IN")}`
    );

    if (seva.payment_method) {
      parts.push(`Payment: ${String(seva.payment_method).toUpperCase()}`);
    }

    if (seva.utr) {
      parts.push(`UTR: ${String(seva.utr).trim()}`);
    }
  }

  return sanitizeWhatsAppParameter(
    parts.join("; ") || "Seva registration confirmed."
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

    if (!id) {
      return NextResponse.json(
        { error: "Seva registration ID is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid Seva status." },
        { status: 400 }
      );
    }

    // Fetch the complete existing record first.
    // We need the previous status so the confirmation WhatsApp
    // is sent only when the registration moves INTO confirmed.
    const { data: existing, error: lookupError } =
      await supabaseAdmin
        .from("seva_registrations")
        .select(
          "id, seva_no, name, mobile, status, materials, volunteer_role_names, amount, payment_method, utr"
        )
        .eq("id", id)
        .maybeSingle();

    if (lookupError) {
      console.error("Seva lookup error:", lookupError);

      return NextResponse.json(
        { error: "Unable to find Seva registration." },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Seva registration not found." },
        { status: 404 }
      );
    }

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

    const wasConfirmed = existing.status === "confirmed";
    const isBeingConfirmed = status === "confirmed";
    const shouldSendConfirmationWhatsApp =
      isBeingConfirmed && !wasConfirmed;

    const { data, error } = await supabaseAdmin
      .from("seva_registrations")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "id, seva_no, name, block, flat_no, mobile, materials, volunteer_roles, volunteer_role_names, volunteer_note, amount, payment_method, utr, payment_status, status, admin_note, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("Seva status update error:", error);

      return NextResponse.json(
        { error: "Unable to update Seva registration." },
        { status: 500 }
      );
    }

    let whatsappSent = false;
    let whatsappSkipped = false;
    let whatsappMessageId: string | null = null;
    let whatsappError: string | null = null;

    if (shouldSendConfirmationWhatsApp) {
      try {
        const sevaDetails = formatSevaDetails(data);

        const result =
          await sendSevaConfirmedWhatsApp({
            mobile: data.mobile,
            name: sanitizeWhatsAppParameter(data.name),
            sevaNo: sanitizeWhatsAppParameter(data.seva_no),
            sevaDetails,
          });

        whatsappSent = Boolean(result.sent);
        whatsappSkipped = Boolean(result.skipped);
        whatsappMessageId = result.messageId || null;
        whatsappError = result.sent
          ? null
          : result.error || null;

        if (result.sent) {
          console.log(
            "Seva confirmation WhatsApp sent:",
            {
              sevaNo: data.seva_no,
              recipient: data.mobile,
              messageId: result.messageId,
            }
          );
        } else {
          console.error(
            "Seva confirmation WhatsApp was not sent:",
            result.error
          );
        }
      } catch (whatsappErrorValue) {
        whatsappError =
          whatsappErrorValue instanceof Error
            ? whatsappErrorValue.message
            : "Seva confirmation WhatsApp failed.";

        console.error(
          "Seva confirmation WhatsApp error:",
          whatsappErrorValue
        );
      }
    }

    return NextResponse.json({
      success: true,
      seva: data,
      whatsappSent,
      whatsappSkipped,
      whatsappMessageId,
      whatsappError,
    });
  } catch (error) {
    console.error("Admin Seva API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
