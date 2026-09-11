import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";


type CollectionChannel = "committee" | "online";
type PaymentMethod = "upi" | "cash";

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

    // =========================================================
    // BASIC VALIDATION
    // =========================================================

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (!block) {
      return NextResponse.json(
        { error: "Block is required." },
        { status: 400 }
      );
    }

    if (!flatNo) {
      return NextResponse.json(
        { error: "Flat number is required." },
        { status: 400 }
      );
    }

    if (
      residentType !== "Owner" &&
      residentType !== "Tenant"
    ) {
      return NextResponse.json(
        { error: "Please select Owner or Tenant." },
        { status: 400 }
      );
    }

    if (
      typeof mobile !== "string" ||
      !/^[6-9]\d{9}$/.test(mobile)
    ) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Please enter a valid contribution amount." },
        { status: 400 }
      );
    }

    // =========================================================
    // COLLECTION CHANNEL
    // =========================================================

    if (
      collectionChannel !== "committee" &&
      collectionChannel !== "online"
    ) {
      return NextResponse.json(
        { error: "Invalid collection channel." },
        { status: 400 }
      );
    }

    // =========================================================
    // ONLINE CONTRIBUTION
    //
    // Public website:
    // UPI ONLY
    // UTR REQUIRED
    // ALWAYS PENDING
    // =========================================================

    if (collectionChannel === "online") {
      if (paymentMethod !== "upi") {
        return NextResponse.json(
          {
            error:
              "Online contributions can only be made through UPI.",
          },
          { status: 400 }
        );
      }

      if (!utr || !utr.trim()) {
        return NextResponse.json(
          {
            error:
              "UTR / Transaction ID is mandatory for online contributions.",
          },
          { status: 400 }
        );
      }

      if (paidTo) {
        return NextResponse.json(
          {
            error:
              "Paid To must not be provided for online contributions.",
          },
          { status: 400 }
        );
      }

      // Public contribution must always start as pending.
      // The admin will verify it later.
    }

    // =========================================================
    // COMMITTEE CONTRIBUTION
    //
    // Door-to-door:
    // CASH or UPI
    // UTR required for UPI
    // Paid To required for CASH
    // IMMEDIATELY VERIFIED
    // =========================================================

    if (collectionChannel === "committee") {
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

      if (!collectedBy || !collectedBy.trim()) {
        return NextResponse.json(
          {
            error:
              "Committee member name is required.",
          },
          { status: 400 }
        );
      }

      if (paymentMethod === "upi") {
        if (!utr || !utr.trim()) {
          return NextResponse.json(
            {
              error:
                "UTR / Transaction ID is mandatory for UPI.",
            },
            { status: 400 }
          );
        }

        if (paidTo) {
          return NextResponse.json(
            {
              error:
                "Paid To must not be provided for UPI.",
            },
            { status: 400 }
          );
        }
      }

      if (paymentMethod === "cash") {
        if (!paidTo || !paidTo.trim()) {
          return NextResponse.json(
            {
              error:
                "Please select who received the cash.",
            },
            { status: 400 }
          );
        }

        if (utr) {
          return NextResponse.json(
            {
              error:
                "UTR must not be provided for cash payments.",
            },
            { status: 400 }
          );
        }
      }
    }

    // =========================================================
    // COLLECTION STATUS
    //
    // This field is only relevant to the committee workflow
    // if you still want to record it.
    //
    // Public online contribution doesn't need it.
    // =========================================================

    if (
      collectionChannel === "online"
    ) {
      // Ignore anything accidentally sent from public UI.
      // We do not allow the browser to influence the
      // verification workflow.
    }


    // =========================================================
    // DUPLICATE ACTIVE CONTRIBUTION
    // =========================================================

    const { data: existingContribution, error: duplicateError } =
      await supabaseAdmin
        .from("contributions")
        .select("id, payment_id, status")
        .eq("block", block)
        .eq("flat_no", flatNo)
        .neq("status", "rejected")
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

    if (existingContribution) {
      return NextResponse.json(
        {
          error:
            "This flat already has a contribution record.",
          paymentId:
            existingContribution.payment_id || null,
        },
        { status: 409 }
      );
    }

    // =========================================================
    // DUPLICATE UTR
    // =========================================================

    if (paymentMethod === "upi" && utr?.trim()) {
      const { data: existingUtr, error: utrError } =
        await supabaseAdmin
          .from("contributions")
          .select("id, payment_id")
          .eq("utr", utr.trim())
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
          },
          { status: 409 }
        );
      }
    }

    // =========================================================
    // SERVER-SIDE STATUS
    // =========================================================
    //
    // NEVER trust status from frontend.
    //
    // Committee:
    //     immediately verified
    //
    // Online:
    //     pending
    // =========================================================

    const initialStatus =
      collectionChannel === "committee"
        ? "verified"
        : "pending";

    const verifiedAt =
      collectionChannel === "committee"
        ? new Date().toISOString()
        : null;

    // =========================================================
    // INSERT CONTRIBUTION
    // =========================================================

    const { data: contribution, error: insertError } =
      await supabaseAdmin
        .from("contributions")
        .insert({
          name: name.trim(),
          block,
          flat_no: flatNo,
          resident_type: residentType,
          mobile,
          amount: numericAmount,

          collection_status:
            collectionChannel === "committee"
              ? null
              : collectionStatus || null,

          payment_method: paymentMethod,

          utr:
            paymentMethod === "upi"
              ? utr.trim()
              : null,

          paid_to:
            paymentMethod === "cash"
              ? paidTo.trim()
              : null,

          collection_channel: collectionChannel,

          collected_by:
            collectionChannel === "committee"
              ? collectedBy.trim()
              : null,

          status: initialStatus,

          verified_at: verifiedAt,
        })
        .select()
        .single();

    if (insertError) {
      console.error(
        "CONTRIBUTION INSERT ERROR:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            insertError.message ||
            "Unable to submit contribution.",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        contribution: {
          id: contribution.id,
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
        },
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