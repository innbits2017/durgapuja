import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const BLOCKS = ["P1", "P2", "Villa"];

const RESIDENT_TYPES = ["Owner", "Tenant"];

const COLLECTION_STATUSES = [
  "Pay Now",
  "Door Lock",
  "Follow-up",
  "Not Interested",
];

const PAYMENT_METHODS = ["upi", "cash"];

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
    } = body;

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          error: "Name is required.",
        },
        { status: 400 }
      );
    }

    if (
      !block ||
      !BLOCKS.includes(block)
    ) {
      return NextResponse.json(
        {
          error: "Please select a valid block.",
        },
        { status: 400 }
      );
    }

    if (
      !flatNo ||
      typeof flatNo !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Flat number is required.",
        },
        { status: 400 }
      );
    }

    if (
      !residentType ||
      !RESIDENT_TYPES.includes(
        residentType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please select Owner or Tenant.",
        },
        { status: 400 }
      );
    }

    if (
      !mobile ||
      !/^[6-9]\d{9}$/.test(mobile)
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
      !collectionStatus ||
      !COLLECTION_STATUSES.includes(
        collectionStatus
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

    if (
      !paymentMethod ||
      !PAYMENT_METHODS.includes(
        paymentMethod
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a valid payment method.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       PAYMENT VALIDATION
    ===================================================== */

    const cleanUtr =
      typeof utr === "string"
        ? utr.trim()
        : "";

    const cleanPaidTo =
      typeof paidTo === "string"
        ? paidTo.trim()
        : "";

    if (paymentMethod === "upi") {
      if (!cleanUtr) {
        return NextResponse.json(
          {
            error:
              "UTR / Transaction ID is required for UPI payment.",
          },
          { status: 400 }
        );
      }

      if (cleanPaidTo) {
        return NextResponse.json(
          {
            error:
              "Paid To should not be provided for UPI payment.",
          },
          { status: 400 }
        );
      }
    }

    if (paymentMethod === "cash") {
      if (!cleanPaidTo) {
        return NextResponse.json(
          {
            error:
              "Please select who received the cash.",
          },
          { status: 400 }
        );
      }

      if (cleanUtr) {
        return NextResponse.json(
          {
            error:
              "UTR should not be provided for cash payment.",
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       CHECK WHETHER FLAT ALREADY HAS A RECORD
       
       Pending + verified = occupied/paid for collection
       Rejected = can be submitted again
    ===================================================== */

    const {
      data: existingContribution,
      error: existingContributionError,
    } = await supabaseAdmin
      .from("contributions")
      .select(
        "id, status, block, flat_no"
      )
      .eq("block", block)
      .eq("flat_no", flatNo)
      .neq("status", "rejected")
      .limit(1)
      .maybeSingle();

    if (existingContributionError) {
      console.error(
        "Existing contribution lookup error:",
        existingContributionError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check flat availability.",
        },
        { status: 500 }
      );
    }

    if (existingContribution) {
      return NextResponse.json(
        {
          error:
            "This flat already has a contribution record.",
        },
        { status: 409 }
      );
    }

    /* =====================================================
       DUPLICATE UTR CHECK
    ===================================================== */

    if (paymentMethod === "upi") {
      const {
        data: existingUtr,
        error: utrLookupError,
      } = await supabaseAdmin
        .from("contributions")
        .select("id, status")
        .eq("utr", cleanUtr)
        .limit(1)
        .maybeSingle();

      if (utrLookupError) {
        console.error(
          "UTR lookup error:",
          utrLookupError
        );

        return NextResponse.json(
          {
            error:
              "Unable to validate the transaction ID.",
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

    /* =====================================================
       INSERT CONTRIBUTION
    ===================================================== */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("contributions")
      .insert({
        name: name.trim(),
        block,
        flat_no: flatNo.trim(),
        resident_type: residentType,
        mobile: mobile.trim(),
        amount: numericAmount,
        collection_status: collectionStatus,
        payment_method: paymentMethod,
        utr:
          paymentMethod === "upi"
            ? cleanUtr
            : null,
        paid_to:
          paymentMethod === "cash"
            ? cleanPaidTo
            : null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Contribution insert error:",
        error
      );

      /*
       * Handles duplicate UTR / database constraints
       * even if two requests arrive simultaneously.
       */
      if (error.code === "23505") {
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
            error.message ||
            "Unable to submit contribution.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        contribution: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Contribution API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid request.",
      },
      { status: 400 }
    );
  }
}