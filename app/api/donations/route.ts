import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendExternalDonationConfirmedWhatsApp } from "@/lib/whatsapp";

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
        { error: "Please fill all required fields." },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid donation amount." },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile).trim();

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const cleanUtr = String(utr).trim();

    // Check duplicate UTR
    const { data: existing, error: checkError } =
      await supabaseAdmin
        .from("donations")
        .select("id")
        .eq("utr", cleanUtr)
        .maybeSingle();

    if (checkError) {
      console.error("Donation UTR check error:", checkError);

      return NextResponse.json(
        { error: checkError.message },
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

    // Save donation
    const { data, error } = await supabaseAdmin
      .from("donations")
      .insert({
        donor_name: String(donorName).trim(),
        organisation_name: organisationName?.trim() || null,
        donor_type: donorType,
        mobile: cleanMobile,
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
        { error: error.message },
        { status: 500 }
      );
    }

    /*
     * WhatsApp confirmation
     *
     * This uses the existing helper from lib/whatsapp.ts.
     * The approved template expects:
     * {{1}} Contact Person
     * {{2}} Organisation / Donor
     * {{3}} Amount
     * {{4}} Payment Mode
     * {{5}} Payment ID / UTR
     */
    const whatsappName =
      organisationName?.trim() || String(donorName).trim();

    try {
      const whatsappResult =
        await sendExternalDonationConfirmedWhatsApp({
          mobile: cleanMobile,
          contactName: String(donorName).trim(),
          donorName: whatsappName,
          amount: numericAmount,
          paymentMode: "UPI",
          paymentId: cleanUtr,
        });

      console.log(
        "Donation WhatsApp result:",
        whatsappResult
      );
    } catch (whatsappError) {
      /*
       * IMPORTANT:
       * Do not fail the donation just because WhatsApp failed.
       */
      console.error(
        "Donation WhatsApp notification failed:",
        whatsappError
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
