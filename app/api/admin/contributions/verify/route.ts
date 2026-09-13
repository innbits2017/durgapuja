import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

import {
  sendContributionVerifiedWhatsApp,
  sendContributionRejectedWhatsApp,
} from "@/lib/whatsapp";

/* ============================================================
   POST
============================================================ */

export async function POST(request: Request) {
  try {
    // =========================================================
    // ADMIN AUTHENTICATION
    // =========================================================

    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================================
    // REQUEST BODY
    // =========================================================

    const body = await request.json();

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    const status = body.status;

    // =========================================================
    // VALIDATION
    // =========================================================

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Contribution ID is missing.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      status !== "verified" &&
      status !== "rejected"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid contribution status.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // GET EXISTING CONTRIBUTION
    // =========================================================

    const {
      data: existing,
      error: lookupError,
    } = await supabaseAdmin
      .from("contributions")
      .select(
        `
        id,
        name,
        block,
        flat_no,
        mobile,
        amount,
        utr,
        payment_method,
        collection_channel,
        status,
        verified_at,
        whatsapp_submitted_at,
        whatsapp_verified_at,
        whatsapp_last_error
        `
      )
      .eq("id", id)
      .maybeSingle();

    if (lookupError) {
      console.error(
        "CONTRIBUTION LOOKUP ERROR:",
        lookupError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find contribution.",
        },
        {
          status: 500,
        }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Contribution not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =========================================================
    // PREVENT RE-PROCESSING FINAL STATUS
    //
    // If a contribution is already verified/rejected,
    // don't send another WhatsApp message accidentally.
    // =========================================================

    if (
      existing.status === status
    ) {
      return NextResponse.json(
        {
          success: true,

          contribution:
            existing,

          whatsappSent: false,

          whatsappError: null,

          message:
            `Contribution is already ${status}.`,
        }
      );
    }

    // =========================================================
    // COMMITTEE CONTRIBUTION
    //
    // Committee contributions are already verified when
    // they are created.
    //
    // Therefore this endpoint should not normally receive
    // a committee contribution.
    // =========================================================

    if (
      existing.collection_channel ===
        "committee"
    ) {
      return NextResponse.json(
        {
          error:
            "Committee contributions are automatically verified and should not be processed through this endpoint.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // UPDATE STATUS
    // =========================================================

    const verifiedAt =
      status === "verified"
        ? new Date().toISOString()
        : null;

    const {
      data: contribution,
      error: updateError,
    } = await supabaseAdmin
      .from("contributions")
      .update({
        status,
        verified_at:
          verifiedAt,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error(
        "CONTRIBUTION UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            updateError.message ||
            "Unable to update contribution.",
        },
        {
          status: 500,
        }
      );
    }

    // =========================================================
    // WHATSAPP
    // =========================================================

    let whatsappSent =
      false;

    let whatsappError:
      | string
      | null = null;

    try {
      // =======================================================
      // VERIFIED
      //
      // Template:
      // buh_contribution_confirmed
      //
      // {{1}} Name
      // {{2}} Amount
      // {{3}} Block-Flat
      // =======================================================

      if (
        status === "verified"
      ) {
        const result =
          await sendContributionVerifiedWhatsApp(
            {
              mobile:
                contribution.mobile,

              name:
                contribution.name,

              amount:
                Number(
                  contribution.amount
                ),

              block:
                contribution.block,

              flatNo:
                contribution.flat_no,
            }
          );

        whatsappSent =
          result.sent;

        await supabaseAdmin
          .from("contributions")
          .update({
            whatsapp_verified_at:
              result.sent
                ? new Date().toISOString()
                : null,

            whatsapp_last_error:
              result.sent
                ? null
                : result.error ||
                  null,
          })
          .eq(
            "id",
            contribution.id
          );
      }

      // =======================================================
      // REJECTED
      //
      // Template:
      // buh_contribution_rejected
      //
      // {{1}} Name
      // {{2}} Amount
      // {{3}} Block-Flat
      // {{4}} UTR
      // =======================================================

      if (
        status === "rejected"
      ) {
        const result =
          await sendContributionRejectedWhatsApp(
            {
              mobile:
                contribution.mobile,

              name:
                contribution.name,

              amount:
                Number(
                  contribution.amount
                ),

              block:
                contribution.block,

              flatNo:
                contribution.flat_no,

              utr:
                contribution.utr ||
                "",
            }
          );

        whatsappSent =
          result.sent;

        await supabaseAdmin
          .from("contributions")
          .update({
            whatsapp_last_error:
              result.sent
                ? null
                : result.error ||
                  null,
          })
          .eq(
            "id",
            contribution.id
          );
      }
    } catch (error) {
      // =======================================================
      // WHATSAPP ERROR
      //
      // IMPORTANT:
      // Contribution status has already been updated.
      //
      // WhatsApp failure must NOT roll back the contribution.
      // =======================================================

      whatsappError =
        error instanceof Error
          ? error.message
          : "WhatsApp message failed.";

      console.error(
        "CONTRIBUTION WHATSAPP ERROR:",
        whatsappError
      );

      await supabaseAdmin
        .from("contributions")
        .update({
          whatsapp_last_error:
            whatsappError,
        })
        .eq(
          "id",
          contribution.id
        );
    }

    // =========================================================
    // FINAL RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        contribution,

        whatsappSent,

        whatsappError,
      }
    );
  } catch (error) {
    // =========================================================
    // UNEXPECTED ERROR
    // =========================================================

    console.error(
      "VERIFY CONTRIBUTION ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}