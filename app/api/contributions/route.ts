import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

import {
  sendContributionSubmittedWhatsApp,
  sendCommitteeContributionConfirmedWhatsApp,
} from "@/lib/whatsapp";

type CollectionChannel = "committee" | "online";
type PaymentMethod = "upi" | "cash";

type SavedContribution = {
  id: string;
  payment_id: string | null;
  name: string;
  block: string;
  flat_no: string;
  mobile: string;
  amount: number | string;
  payment_method: PaymentMethod | string | null;
  collection_status: string | null;
  collection_channel: string | null;
  status: string;
};

const COMMITTEE_COLLECTION_STATUSES = [
  "Pay Now",
  "Door Lock",
  "Follow-up",
  "Collect Later",
  "Not Interested",
] as const;

type CommitteeCollectionStatus =
  (typeof COMMITTEE_COLLECTION_STATUSES)[number];

const NON_PAYMENT_STATUSES = [
  "Door Lock",
  "Follow-up",
  "Collect Later",
  "Not Interested",
] as const;

/* ============================================================
   POST
============================================================ */

export async function POST(request: Request) {
  try {
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

    const channel =
      collectionChannel === "committee" ||
      collectionChannel === "online"
        ? (collectionChannel as CollectionChannel)
        : null;

    if (!channel) {
      return NextResponse.json(
        { error: "Invalid collection channel." },
        { status: 400 }
      );
    }

    if (
      typeof block !== "string" ||
      !block.trim()
    ) {
      return NextResponse.json(
        { error: "Block is required." },
        { status: 400 }
      );
    }

    if (
      typeof flatNo !== "string" ||
      !flatNo.trim()
    ) {
      return NextResponse.json(
        { error: "Flat number is required." },
        { status: 400 }
      );
    }

    const cleanBlock = block.trim();
    const cleanFlatNo = flatNo.trim();

    const cleanCollectionStatus =
      typeof collectionStatus === "string" &&
      collectionStatus.trim()
        ? collectionStatus.trim()
        : null;

    // =========================================================
    // COMMITTEE COLLECTION STATUS FLOW
    //
    // Non-payment statuses need only Block + Flat No.
    // Pay Now uses the existing payment flow.
    // =========================================================

    const isCommittee =
      channel === "committee";

    const isNonPaymentStatus =
      isCommittee &&
      NON_PAYMENT_STATUSES.includes(
        cleanCollectionStatus as
          (typeof NON_PAYMENT_STATUSES)[number]
      );

    const isCommitteePayNow =
      isCommittee &&
      cleanCollectionStatus === "Pay Now";

    if (isCommittee) {
      if (
        !COMMITTEE_COLLECTION_STATUSES.includes(
          cleanCollectionStatus as CommitteeCollectionStatus
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Please select a valid collection status.",
          },
          { status: 400 }
        );
      }
    }

    // =========================================================
    // FIND EXISTING RECORD FOR THIS FLAT
    //
    // Rejected records are ignored.
    //
    // A tracking record (Door Lock / Follow-up /
    // Collect Later / Not Interested) can later be changed
    // to Pay Now and reused for the actual payment.
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
        name,
        block,
        flat_no,
        resident_type,
        mobile,
        amount,
        utr,
        payment_method,
        paid_to,
        collected_by,
        collection_channel,
        collection_status,
        status,
        verified_at
        `
      )
      .eq("block", cleanBlock)
      .eq("flat_no", cleanFlatNo)
      .neq("status", "rejected")
      .order("created_at", {
        ascending: false,
      })
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
        { status: 500 }
      );
    }

    // =========================================================
    // NON-PAYMENT COLLECTION STATUS
    //
    // Create or update a tracking record.
    // No name/mobile/payment details are required.
    // =========================================================

    if (isNonPaymentStatus) {
      if (
        existingContribution &&
        existingContribution.status === "verified"
      ) {
        return NextResponse.json(
          {
            error:
              "This flat has already completed its contribution.",
          },
          { status: 409 }
        );
      }

      const trackingName =
        existingContribution?.name?.trim() ||
        `Collection - ${cleanBlock}-${cleanFlatNo}`;

      const trackingPayload = {
        name: trackingName,
        block: cleanBlock,
        flat_no: cleanFlatNo,
        resident_type: null,
        mobile: null,
        amount: 0,
        collection_status:
          cleanCollectionStatus,
        payment_method: null,
        utr: null,
        paid_to: null,
        collection_channel: "committee",
        collected_by: null,
        status: "pending",
        verified_at: null,
      };

      let contribution:
        | Record<string, unknown>
        | null = null;

      if (existingContribution) {
        const { data, error } =
          await supabaseAdmin
            .from("contributions")
            .update(trackingPayload)
            .eq(
              "id",
              existingContribution.id
            )
            .select()
            .single();

        if (error) {
          console.error(
            "COLLECTION STATUS UPDATE ERROR:",
            error
          );

          return NextResponse.json(
            {
              error:
                error.message ||
                "Unable to update collection status.",
            },
            { status: 500 }
          );
        }

        contribution = data;
      } else {
        const { data, error } =
          await supabaseAdmin
            .from("contributions")
            .insert(trackingPayload)
            .select()
            .single();

        if (error) {
          console.error(
            "COLLECTION STATUS INSERT ERROR:",
            error
          );

          if (error.code === "23505") {
            return NextResponse.json(
              {
                error:
                  "This flat was updated by another committee member. Please refresh and try again.",
              },
              { status: 409 }
            );
          }

          return NextResponse.json(
            {
              error:
                error.message ||
                "Unable to save collection status.",
            },
            { status: 500 }
          );
        }

        contribution = data;
      }

      return NextResponse.json(
        {
          success: true,
          contribution: {
            id: contribution?.id,
            paymentId:
              contribution?.payment_id || null,
            status:
              contribution?.status,
            collectionStatus:
              contribution?.collection_status,
            collectionChannel:
              contribution?.collection_channel,
            paymentMethod:
              contribution?.payment_method,
            amount:
              contribution?.amount,
            block:
              contribution?.block,
            flatNo:
              contribution?.flat_no,
          },
          whatsappSent: false,
          whatsappError: null,
        },
        { status: 200 }
      );
    }

    // =========================================================
    // PAY NOW / EXISTING PAYMENT FLOW
    // =========================================================

    if (isCommitteePayNow) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return NextResponse.json(
          { error: "Name is required." },
          { status: 400 }
        );
      }

      if (
        residentType !== "Owner" &&
        residentType !== "Tenant"
      ) {
        return NextResponse.json(
          {
            error:
              "Please select Owner or Tenant.",
          },
          { status: 400 }
        );
      }

      const cleanMobile =
        typeof mobile === "string"
          ? mobile.trim()
          : "";

      if (
        !/^[6-9]\d{9}$/.test(cleanMobile)
      ) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid 10-digit mobile number.",
          },
          { status: 400 }
        );
      }

      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid contribution amount.",
          },
          { status: 400 }
        );
      }

      if (
        paymentMethod !== "cash" &&
        paymentMethod !== "upi"
      ) {
        return NextResponse.json(
          {
            error:
              "Committee collection must use Cash or UPI.",
          },
          { status: 400 }
        );
      }

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

      if (
        paymentMethod === "upi" &&
        !cleanUtr
      ) {
        return NextResponse.json(
          {
            error:
              "UTR / Transaction ID is mandatory for UPI.",
          },
          { status: 400 }
        );
      }

      if (
        paymentMethod === "upi" &&
        cleanPaidTo
      ) {
        return NextResponse.json(
          {
            error:
              "Paid To must not be provided for UPI.",
          },
          { status: 400 }
        );
      }

      if (
        paymentMethod === "cash" &&
        !cleanPaidTo
      ) {
        return NextResponse.json(
          {
            error:
              "Please select who received the cash.",
          },
          { status: 400 }
        );
      }

      if (
        paymentMethod === "cash" &&
        (cleanUtr || !cleanCollectedBy)
      ) {
        return NextResponse.json(
          {
            error:
              cleanUtr
                ? "UTR must not be provided for cash payments."
                : "Committee member name is required for cash payments.",
          },
          { status: 400 }
        );
      }

      // A verified payment means the flat is genuinely paid.
      // It cannot be submitted again.
      if (
        existingContribution &&
        existingContribution.status ===
          "verified"
      ) {
        return NextResponse.json(
          {
            error:
              "This flat has already completed its contribution.",
            paymentId:
              existingContribution.payment_id ||
              existingContribution.id ||
              null,
          },
          { status: 409 }
        );
      }

      // Check duplicate UTR.
      if (cleanUtr) {
        const {
          data: existingUtr,
          error: utrError,
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
          .eq("utr", cleanUtr)
          .neq("status", "rejected")
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
            { status: 500 }
          );
        }

        if (existingUtr) {
          return NextResponse.json(
            {
              error:
                "This UTR / Transaction ID has already been submitted.",
              paymentId:
                existingUtr.payment_id ||
                existingUtr.id ||
                null,
            },
            { status: 409 }
          );
        }
      }

      const paymentPayload = {
        name: name.trim(),
        block: cleanBlock,
        flat_no: cleanFlatNo,
        resident_type: residentType,
        mobile: cleanMobile,
        amount: numericAmount,
        collection_status: "Pay Now",
        payment_method: paymentMethod,
        utr:
          paymentMethod === "upi"
            ? cleanUtr
            : null,
        paid_to:
          paymentMethod === "cash"
            ? cleanPaidTo
            : null,
        collection_channel: "committee",
        collected_by:
          paymentMethod === "cash"
            ? cleanCollectedBy
            : null,
        status: "verified",
        verified_at:
          new Date().toISOString(),
      };

      let contribution:
        | SavedContribution
        | null = null;

      let saveError:
        | { message?: string; code?: string }
        | null = null;

      // If the flat previously had a collection tracking
      // record, convert that same record into the actual payment.
      if (
        existingContribution &&
        existingContribution.status !==
          "verified" &&
        existingContribution.collection_channel ===
          "committee"
      ) {
        const { data, error } =
          await supabaseAdmin
            .from("contributions")
            .update(paymentPayload)
            .eq(
              "id",
              existingContribution.id
            )
            .select()
            .single();

        contribution = data
          ? (data as SavedContribution)
          : null;
        saveError = error;
      } else if (!existingContribution) {
        const { data, error } =
          await supabaseAdmin
            .from("contributions")
            .insert({
              ...paymentPayload,
              whatsapp_opt_in: true,
            })
            .select()
            .single();

        contribution = data
          ? (data as SavedContribution)
          : null;
        saveError = error;
      } else {
        return NextResponse.json(
          {
            error:
              "This flat already has an active contribution record.",
          },
          { status: 409 }
        );
      }

      if (saveError || !contribution) {
        console.error(
          "COMMITTEE CONTRIBUTION SAVE ERROR:",
          saveError
        );

        if (
          saveError?.code === "23505"
        ) {
          return NextResponse.json(
            {
              error:
                "This contribution or transaction ID has already been submitted.",
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          {
            error:
              saveError?.message ||
              "Unable to submit contribution.",
          },
          { status: 500 }
        );
      }

      // =======================================================
      // COMMITTEE PAYMENT WHATSAPP
      // =======================================================

      let whatsappSent = false;
      let whatsappError:
        | string
        | null = null;

      try {
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
      } catch (error) {
        whatsappError =
          error instanceof Error
            ? error.message
            : "WhatsApp message failed.";

        console.error(
          "COMMITTEE WHATSAPP ERROR:",
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
            collectionStatus:
              contribution.collection_status,
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
        { status: 201 }
      );
    }

    // =========================================================
    // PUBLIC ONLINE CONTRIBUTION
    //
    // Existing online flow remains unchanged.
    // =========================================================

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (
      residentType !== "Owner" &&
      residentType !== "Tenant"
    ) {
      return NextResponse.json(
        {
          error:
            "Please select Owner or Tenant.",
        },
        { status: 400 }
      );
    }

    const cleanMobile =
      typeof mobile === "string"
        ? mobile.trim()
        : "";

    if (
      !/^[6-9]\d{9}$/.test(cleanMobile)
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid 10-digit mobile number.",
        },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid contribution amount.",
        },
        { status: 400 }
      );
    }

    if (paymentMethod !== "upi") {
      return NextResponse.json(
        {
          error:
            "Online contributions can only be made through UPI.",
        },
        { status: 400 }
      );
    }

    const cleanUtr =
      typeof utr === "string"
        ? utr.trim()
        : "";

    if (!cleanUtr) {
      return NextResponse.json(
        {
          error:
            "UTR / Transaction ID is mandatory for online contributions.",
        },
        { status: 400 }
      );
    }

    if (paidTo || collectedBy) {
      return NextResponse.json(
        {
          error:
            "Paid To / Collected By must not be provided for online contributions.",
        },
        { status: 400 }
      );
    }

    if (existingContribution) {
      return NextResponse.json(
        {
          error:
            "This flat already has an active contribution record.",
          paymentId:
            existingContribution.payment_id ||
            existingContribution.id ||
            null,
        },
        { status: 409 }
      );
    }

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
      .eq("utr", cleanUtr)
      .neq("status", "rejected")
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
        { status: 500 }
      );
    }

    if (existingUtr) {
      return NextResponse.json(
        {
          error:
            "This UTR / Transaction ID has already been submitted.",
          paymentId:
            existingUtr.payment_id ||
            existingUtr.id ||
            null,
        },
        { status: 409 }
      );
    }

    const {
      data: contribution,
      error: insertError,
    } = await supabaseAdmin
      .from("contributions")
      .insert({
        name: name.trim(),
        block: cleanBlock,
        flat_no: cleanFlatNo,
        resident_type: residentType,
        mobile: cleanMobile,
        amount: numericAmount,
        collection_status:
          cleanCollectionStatus,
        payment_method: "upi",
        utr: cleanUtr,
        paid_to: null,
        collection_channel: "online",
        collected_by: null,
        whatsapp_opt_in: true,
        status: "pending",
        verified_at: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        "ONLINE CONTRIBUTION INSERT ERROR:",
        insertError
      );

      if (
        insertError.code === "23505"
      ) {
        return NextResponse.json(
          {
            error:
              "This contribution or transaction ID has already been submitted.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            insertError.message ||
            "Unable to submit contribution.",
        },
        { status: 500 }
      );
    }

    let whatsappSent = false;
    let whatsappError:
      | string
      | null = null;

    try {
      const result =
        await sendContributionSubmittedWhatsApp({
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
            contribution.utr || "",
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
    } catch (error) {
      whatsappError =
        error instanceof Error
          ? error.message
          : "WhatsApp message failed.";

      console.error(
        "ONLINE WHATSAPP ERROR:",
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
          collectionStatus:
            contribution.collection_status,
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
      { status: 201 }
    );
  } catch (error) {
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
      { status: 500 }
    );
  }
}

