import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

import {
  sendContributionSubmittedWhatsApp,
  sendCommitteeContributionConfirmedWhatsApp,
} from "@/lib/whatsapp";

type CollectionChannel = "committee" | "online";
type PaymentMethod = "upi" | "cash";

export async function POST(request: Request) {
  try {
    // =========================================================
    // READ REQUEST
    // =========================================================

    const body = await request.json();

    const {
      name,
      block,
      flatNo,
      residentType,
      mobile,
      amount,
      collectionStatus,
      paymentMethod,
      utr,
      paidTo,
      collectionChannel,
      collectedBy,
    } = body;

    // =========================================================
    // BASIC VALIDATION
    // =========================================================

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          error: "Name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof block !== "string" ||
      !block.trim()
    ) {
      return NextResponse.json(
        {
          error: "Block is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof flatNo !== "string" ||
      !flatNo.trim()
    ) {
      return NextResponse.json(
        {
          error: "Flat number is required.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // RESIDENT TYPE
    // =========================================================

    if (
      residentType !== "Owner" &&
      residentType !== "Tenant"
    ) {
      return NextResponse.json(
        {
          error:
            "Please select Owner or Tenant.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // MOBILE
    // =========================================================

    const cleanMobile =
      typeof mobile === "string"
        ? mobile.trim()
        : "";

    if (
      !/^[6-9]\d{9}$/.test(
        cleanMobile
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid 10-digit mobile number.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // AMOUNT
    // =========================================================

    const numericAmount = Number(
      amount
    );

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid contribution amount.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // COLLECTION CHANNEL
    // =========================================================

    if (
      collectionChannel !==
        "committee" &&
      collectionChannel !== "online"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid collection channel.",
        },
        {
          status: 400,
        }
      );
    }

    const channel =
      collectionChannel as CollectionChannel;

    // =========================================================
    // CLEAN PAYMENT VALUES
    // =========================================================

    const cleanUtr =
      typeof utr === "string"
        ? utr.trim()
        : "";

    const cleanPaidTo =
      typeof paidTo === "string"
        ? paidTo.trim()
        : "";

    const cleanCollectedBy =
      typeof collectedBy === "string"
        ? collectedBy.trim()
        : "";

    // =========================================================
    // PUBLIC ONLINE CONTRIBUTION
    //
    // UPI ONLY
    // UTR REQUIRED
    // STATUS = PENDING
    // =========================================================

    if (channel === "online") {
      if (
        paymentMethod !== "upi"
      ) {
        return NextResponse.json(
          {
            error:
              "Online contributions can only be made through UPI.",
          },
          {
            status: 400,
          }
        );
      }

      if (!cleanUtr) {
        return NextResponse.json(
          {
            error:
              "UTR / Transaction ID is mandatory for online contributions.",
          },
          {
            status: 400,
          }
        );
      }

      if (cleanPaidTo) {
        return NextResponse.json(
          {
            error:
              "Paid To must not be provided for online contributions.",
          },
          {
            status: 400,
          }
        );
      }

      if (cleanCollectedBy) {
        return NextResponse.json(
          {
            error:
              "Collected By must not be provided for online contributions.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // =========================================================
    // COMMITTEE CONTRIBUTION
    //
    // CASH or UPI
    // UPI -> UTR REQUIRED
    // CASH -> PAID TO REQUIRED
    // COLLECTED BY REQUIRED
    // STATUS = VERIFIED
    // =========================================================

    if (
      channel === "committee"
    ) {
      if (
        paymentMethod !== "cash" &&
        paymentMethod !== "upi"
      ) {
        return NextResponse.json(
          {
            error:
              "Committee collection must use Cash or UPI.",
          },
          {
            status: 400,
          }
        );
      }

      if (!cleanCollectedBy) {
        return NextResponse.json(
          {
            error:
              "Committee member name is required.",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // COMMITTEE UPI
      // -------------------------------------------------------

      if (
        paymentMethod === "upi"
      ) {
        if (!cleanUtr) {
          return NextResponse.json(
            {
              error:
                "UTR / Transaction ID is mandatory for UPI.",
            },
            {
              status: 400,
            }
          );
        }

        if (cleanPaidTo) {
          return NextResponse.json(
            {
              error:
                "Paid To must not be provided for UPI.",
            },
            {
              status: 400,
            }
          );
        }
      }

      // -------------------------------------------------------
      // COMMITTEE CASH
      // -------------------------------------------------------

      if (
        paymentMethod === "cash"
      ) {
        if (!cleanPaidTo) {
          return NextResponse.json(
            {
              error:
                "Please select who received the cash.",
            },
            {
              status: 400,
            }
          );
        }

        if (cleanUtr) {
          return NextResponse.json(
            {
              error:
                "UTR must not be provided for cash payments.",
            },
            {
              status: 400,
            }
          );
        }
      }
    }

    // =========================================================
    // DUPLICATE ACTIVE CONTRIBUTION
    //
    // One active contribution per Block + Flat.
    //
    // Rejected records are ignored.
    // =========================================================

    const {
      data: existingContribution,
      error: duplicateError,
    } = await supabaseAdmin
      .from("contributions")
      .select(
        `
        id,
        payment_id,
        status,
        block,
        flat_no
        `
      )
      .eq(
        "block",
        block.trim()
      )
      .eq(
        "flat_no",
        flatNo.trim()
      )
      .neq(
        "status",
        "rejected"
      )
      .limit(1)
      .maybeSingle();

    if (duplicateError) {
      console.error(
        "DUPLICATE CHECK ERROR:",
        duplicateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check existing contribution.",
        },
        {
          status: 500,
        }
      );
    }

    if (existingContribution) {
      return NextResponse.json(
        {
          error:
            "This flat already has a contribution record.",

          paymentId:
            existingContribution.payment_id ||
            null,
        },
        {
          status: 409,
        }
      );
    }

    // =========================================================
    // DUPLICATE UTR
    //
    // Applies to all UPI contributions.
    // =========================================================

    if (
      paymentMethod === "upi" &&
      cleanUtr
    ) {
      const {
        data: existingUtr,
        error: utrError,
      } = await supabaseAdmin
        .from("contributions")
        .select(
          `
          id,
          payment_id,
          status
          `
        )
        .eq(
          "utr",
          cleanUtr
        )
        .limit(1)
        .maybeSingle();

      if (utrError) {
        console.error(
          "UTR CHECK ERROR:",
          utrError
        );

        return NextResponse.json(
          {
            error:
              "Unable to validate UTR.",
          },
          {
            status: 500,
          }
        );
      }

      if (existingUtr) {
        return NextResponse.json(
          {
            error:
              "This UTR / Transaction ID has already been submitted.",

            paymentId:
              existingUtr.payment_id ||
              null,
          },
          {
            status: 409,
          }
        );
      }
    }

    // =========================================================
    // SERVER-SIDE STATUS
    //
    // IMPORTANT:
    // Never trust status from frontend.
    //
    // Committee:
    //     verified immediately
    //
    // Online:
    //     pending
    // =========================================================

    const initialStatus =
      channel === "committee"
        ? "verified"
        : "pending";

    const verifiedAt =
      channel === "committee"
        ? new Date().toISOString()
        : null;

    // =========================================================
    // INSERT CONTRIBUTION
    // =========================================================

    const {
      data: contribution,
      error: insertError,
    } = await supabaseAdmin
      .from("contributions")
      .insert({
        name:
          name.trim(),

        block:
          block.trim(),

        flat_no:
          flatNo.trim(),

        resident_type:
          residentType,

        mobile:
          cleanMobile,

        amount:
          numericAmount,

        // Collection status is relevant
        // only for public online collection.
        collection_status:
          channel === "online"
            ? collectionStatus || null
            : null,

        payment_method:
          paymentMethod,

        utr:
          paymentMethod === "upi"
            ? cleanUtr
            : null,

        paid_to:
          paymentMethod === "cash"
            ? cleanPaidTo
            : null,

        collection_channel:
          channel,

        collected_by:
          channel === "committee"
            ? cleanCollectedBy
            : null,

        // Kept true for compatibility
        // with the existing database structure.
        whatsapp_opt_in:
          true,

        status:
          initialStatus,

        verified_at:
          verifiedAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        "CONTRIBUTION INSERT ERROR:",
        insertError
      );

      // -------------------------------------------------------
      // Handle duplicate database constraint
      // -------------------------------------------------------

      if (
        insertError.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            error:
              "This contribution or transaction ID has already been submitted.",
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          error:
            insertError.message ||
            "Unable to submit contribution.",
        },
        {
          status: 500,
        }
      );
    }

    // =========================================================
    // WHATSAPP
    // =========================================================

    let whatsappSent = false;
    let whatsappError:
      | string
      | null = null;

    try {
      // =======================================================
      // COMMITTEE CONTRIBUTION
      //
      // Template:
      // buh_committee_contribution_confirmed
      //
      // Currently waiting for Meta approval.
      //
      // Once approved, this will automatically send.
      // =======================================================

      if (
        channel === "committee"
      ) {
        const paymentId =
          contribution.payment_id ||
          contribution.id;

        const result =
          await sendCommitteeContributionConfirmedWhatsApp(
            {
              mobile:
                contribution.mobile,

              name:
                contribution.name,

              paymentId:
                paymentId,

              amount:
                Number(
                  contribution.amount
                ),

              block:
                contribution.block,

              flatNo:
                contribution.flat_no,

              paymentMode:
                contribution.payment_method ===
                "cash"
                  ? "Cash"
                  : "UPI",
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
      // PUBLIC ONLINE CONTRIBUTION
      //
      // Template:
      // buh_contribution_verification
      //
      // {{1}} Name
      // {{2}} Amount
      // {{3}} Block-Flat
      // {{4}} UTR
      // =======================================================

      if (
        channel === "online"
      ) {
        const result =
          await sendContributionSubmittedWhatsApp({
            mobile: contribution.mobile,
            name: contribution.name,
            amount: Number(contribution.amount),
            block: contribution.block,
            flatNo: contribution.flat_no,
            utr: contribution.utr || "",
          });

        whatsappSent =
          result.sent;

        await supabaseAdmin
          .from("contributions")
          .update({
            whatsapp_submitted_at:
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
    } catch (error) {
      whatsappError =
        error instanceof Error
          ? error.message
          : "WhatsApp message failed.";

      console.error(
        "WHATSAPP ERROR:",
        whatsappError
      );

      // -------------------------------------------------------
      // Do NOT fail the contribution just because
      // WhatsApp failed.
      //
      // Contribution is already safely stored.
      // -------------------------------------------------------

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
    // RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        contribution: {
          id:
            contribution.id,

          paymentId:
            contribution.payment_id,

          status:
            contribution.status,

          collectionChannel:
            contribution.collection_channel,

          paymentMethod:
            contribution.payment_method,

          amount:
            contribution.amount,

          block:
            contribution.block,

          flatNo:
            contribution.flat_no,
        },

        whatsappSent,

        whatsappError,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    // =========================================================
    // GLOBAL ERROR
    // =========================================================

    console.error(
      "CONTRIBUTION ROUTE ERROR:",
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