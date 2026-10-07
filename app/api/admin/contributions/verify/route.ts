import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSuperAdmin } from "@/lib/admin-auth";

import {
  sendContributionVerifiedWhatsApp,
  sendContributionRejectedWhatsApp,
} from "@/lib/whatsapp";

/* ============================================================
   TYPES
============================================================ */

const COLLECTION_STATUSES = [
  "Door Lock",
  "Follow-up",
  "Not Interested",
  "Collect Later",
] as const;

type CollectionStatus =
  (typeof COLLECTION_STATUSES)[number];

type PaymentStatus =
  | "verified"
  | "rejected";

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
    // SUPER ADMIN AUTHORIZATION
    // =========================================================
    // Only Super Admin can verify, reject, or update
    // contribution collection status.

    try {
      await requireSuperAdmin();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "FORBIDDEN"
      ) {
        return NextResponse.json(
          {
            error:
              "Forbidden. Only Super Admin can perform this action.",
          },
          {
            status: 403,
          }
        );
      }

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

    const requestedStatus = body.status;

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

    const isPaymentStatus =
      requestedStatus === "verified" ||
      requestedStatus === "rejected";

    const isCollectionStatus =
      COLLECTION_STATUSES.includes(
        requestedStatus as CollectionStatus
      );

    if (
      !isPaymentStatus &&
      !isCollectionStatus
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
        collection_status,
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
    // PREVENT RE-PROCESSING FINAL PAYMENT STATUS
    //
    // A verified/rejected payment should not be converted into
    // a collection-status record.
    // =========================================================

    if (
      isCollectionStatus &&
      existing.status === "verified"
    ) {
      return NextResponse.json(
        {
          error:
            "A verified contribution cannot be changed to a collection status.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      isPaymentStatus &&
      existing.status === requestedStatus
    ) {
      return NextResponse.json(
        {
          success: true,

          contribution:
            existing,

          whatsappSent: false,

          whatsappError: null,

          message:
            `Contribution is already ${requestedStatus}.`,
        }
      );
    }

    if (
      isCollectionStatus &&
      existing.collection_status === requestedStatus
    ) {
      return NextResponse.json(
        {
          success: true,

          contribution:
            existing,

          whatsappSent: false,

          whatsappError: null,

          message:
            `Collection status is already ${requestedStatus}.`,
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
    // COLLECTION STATUS UPDATE
    //
    // Door Lock / Follow-up / Not Interested / Collect Later
    // are collection decisions, not payments.
    //
    // Therefore:
    // - status remains pending
    // - verified_at remains null
    // - payment details are not created
    // - collection_status is updated
    // =========================================================

    if (isCollectionStatus) {
      const {
        data: contribution,
        error: updateError,
      } = await supabaseAdmin
        .from("contributions")
        .update({
          collection_status:
            requestedStatus,
          status: "pending",
          verified_at: null,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error(
          "COLLECTION STATUS UPDATE ERROR:",
          updateError
        );

        return NextResponse.json(
          {
            error:
              updateError.message ||
              "Unable to update collection status.",
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({
        success: true,

        contribution,

        whatsappSent: false,

        whatsappError: null,

        message:
          `Collection status updated to ${requestedStatus}.`,
      });
    }

    // =========================================================
    // PAYMENT STATUS UPDATE
    //
    // Existing Verify / Reject behavior remains unchanged.
    // =========================================================

    const status =
      requestedStatus as PaymentStatus;

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