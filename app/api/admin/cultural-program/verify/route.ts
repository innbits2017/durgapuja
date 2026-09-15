import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendCulturalProgramConfirmedWhatsApp } from "@/lib/whatsapp";

const VALID_STATUSES = ["approved", "rejected"] as const;

export async function POST(request: Request) {
  try {
    /* ==========================================================
       ADMIN AUTHENTICATION
    ========================================================== */
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    /* ==========================================================
       REQUEST VALIDATION
    ========================================================== */
    const body = await request.json();

    const id = String(body?.id || "").trim();
    const status = String(body?.status || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }

    if (
      !VALID_STATUSES.includes(
        status as (typeof VALID_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Invalid registration status." },
        { status: 400 }
      );
    }

    /* ==========================================================
       FETCH CURRENT REGISTRATION

       IMPORTANT:
       slot_number is read from the database.
       It is NEVER accepted from the admin/client request.
    ========================================================== */
    const { data: existing, error: fetchError } =
      await supabaseAdmin
        .from("cultural_program_registrations")
        .select(
          "id, registration_no, participant_name, mobile, performance_title, slot_number, status"
        )
        .eq("id", id)
        .single();

    if (fetchError || !existing) {
      console.error(
        "Cultural program fetch error:",
        fetchError
      );

      return NextResponse.json(
        { error: "Cultural program registration not found." },
        { status: 404 }
      );
    }

    const previousStatus = existing.status;

    /* ==========================================================
       SLOT VALIDATION

       Every registration should receive a slot at creation time
       from the PostgreSQL sequence/default.

       Approval cannot proceed without a stored slot.
    ========================================================== */
    if (
      status === "approved" &&
      (existing.slot_number === null ||
        existing.slot_number === undefined)
    ) {
      console.error(
        "Cultural program has no slot number:",
        id
      );

      return NextResponse.json(
        {
          error:
            "This registration does not have an assigned slot. Please check the cultural program database before approving it.",
        },
        { status: 409 }
      );
    }

    /* ==========================================================
       UPDATE STATUS

       Only status and updated_at are changed.
       slot_number is deliberately NOT changed.

       Rejected slots are NOT released or reused.
    ========================================================== */
    const { data, error } = await supabaseAdmin
      .from("cultural_program_registrations")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(
        "Cultural program status update error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to update registration.",
        },
        { status: 500 }
      );
    }

    /* ==========================================================
       WHATSAPP CONFIRMATION

       Send only when the registration actually transitions
       from pending -> approved.

       This prevents duplicate confirmation messages if the
       endpoint is called again for an already-approved record.

       The stored slot_number is used.
    ========================================================== */
    let whatsappSent = false;
    let whatsappSkipped = false;
    let whatsappError: string | null = null;
    let whatsappMessageId: string | null = null;

    if (
      previousStatus !== "approved" &&
      status === "approved"
    ) {
      try {
        const result =
          await sendCulturalProgramConfirmedWhatsApp({
            mobile: data.mobile,
            participantName: data.participant_name,
            registrationNo: data.registration_no,
            performanceTitle: data.performance_title,
            slotNumber: data.slot_number,
          });

        whatsappSent = Boolean(result.sent);
        whatsappSkipped = Boolean(result.skipped);
        whatsappError = result.sent
          ? null
          : result.error || null;
        whatsappMessageId = result.messageId || null;

        if (!result.sent && result.error) {
          console.error(
            "Cultural program WhatsApp notification failed:",
            result.error
          );
        }
      } catch (error) {
        whatsappError =
          error instanceof Error
            ? error.message
            : "WhatsApp confirmation message failed.";

        console.error(
          "Cultural program confirmation WhatsApp error:",
          error
        );
      }
    }

    /* ==========================================================
       RESPONSE
    ========================================================== */
    return NextResponse.json({
      success: true,
      registration: data,
      whatsappSent,
      whatsappSkipped,
      whatsappMessageId,
      whatsappError,
    });
  } catch (error) {
    console.error(
      "Cultural program admin API error:",
      error
    );

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
