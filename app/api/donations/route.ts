import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      donorName,
      organisationName,
      donorType,
      mobile,
      email,
      location,
      amount,
      utr,
      donationType,
    } = body;

    if (!donorName || !donorType || !mobile || !amount || !utr) {
      return NextResponse.json(
        {
          error: "Please fill all required fields.",
        },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          error: "Please enter a valid donation amount.",
        },
        { status: 400 }
      );
    }

    const cleanUtr = String(utr).trim();

    // Check whether this UTR has already been submitted
    const { data: existing, error: checkError } =
      await supabaseAdmin
        .from("donations")
        .select("id")
        .eq("utr", cleanUtr)
        .maybeSingle();

    if (checkError) {
      console.error("Donation UTR check error:", checkError);

      return NextResponse.json(
        {
          error: checkError.message,
        },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        {
          error:
            "This UTR / Transaction ID has already been submitted.",
        },
        { status: 409 }
      );
    }

    // Insert donation
    const { data, error } = await supabaseAdmin
      .from("donations")
      .insert({
        donor_name: String(donorName).trim(),
        organisation_name:
          organisationName?.trim() || null,
        donor_type: donorType,
        mobile: String(mobile).trim(),
        email: email?.trim() || null,
        location: location?.trim() || null,
        amount: numericAmount,
        utr: cleanUtr,
        donation_type: donationType || "donation",
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Donation insert error:", error);

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Donation submitted successfully.",
      donation: data,
    });
  } catch (error) {
    console.error("Donation API error:", error);

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