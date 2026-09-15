import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendExternalDonationConfirmedWhatsApp } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    // =========================================================
    // ADMIN AUTHENTICATION
    // =========================================================

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

    // =========================================================
    // REQUEST
    // =========================================================

    const body = await request.json();

    const id = String(body?.id || "").trim();
    const status = String(body?.status || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Donation ID is required." },
        { status: 400 }
      );
    }

    if (status !== "verified" && status !== "rejected") {
      return NextResponse.json(
        { error: "Invalid donation status." },
        { status: 400 }
      );
    }

    // =========================================================
    // FETCH EXISTING DONATION
    // =========================================================

    const { data: existingDonation, error: fetchError } =
      await supabaseAdmin
        .from("donations")
        .select(
          `
          id,
          donor_name,
          organisation_name,
          donor_type,
          mobile,
          email,
          location,
          amount,
          utr,
          donation_type,
          status,
          created_at,
          verified_at
          `
        )
        .eq("id", id)
        .single();

    if (fetchError || !existingDonation) {
      console.error(
        "Donation fetch error:",
        fetchError
      );

      return NextResponse.json(
        { error: "Donation not found." },
        { status: 404 }
      );
    }

    const previousStatus = existingDonation.status;

    // =========================================================
    // UPDATE DONATION STATUS
    // =========================================================

    const verifiedAt =
      status === "verified"
        ? new Date().toISOString()
        : null;

    const { data: donation, error: updateError } =
      await supabaseAdmin
        .from("donations")
        .update({
          status,
          verified_at: verifiedAt,
        })
        .eq("id", id)
        .select()
        .single();

    if (updateError) {
      console.error(
        "Donation status update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            updateError.message ||
            "Unable to update donation status.",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // WHATSAPP
    //
    // IMPORTANT:
    // Send ONLY when the donation changes TO verified.
    //
    // Pending  -> Verified = SEND
    // Rejected -> Verified = SEND
    // Verified -> Verified = DO NOT SEND AGAIN
    // Pending  -> Rejected = NO MESSAGE
    // =========================================================

    let whatsappSent = false;
    let whatsappSkipped = false;
    let whatsappError: string | null = null;
    let whatsappMessageId: string | null = null;

    const shouldSendWhatsApp =
      status === "verified" &&
      previousStatus !== "verified";

    if (shouldSendWhatsApp) {
      try {
        const result =
          await sendExternalDonationConfirmedWhatsApp({
            mobile: donation.mobile,
            contactName: donation.donor_name,

            // If organisation is available, use it.
            // Otherwise use the donor/contact name.
            donorName:
              donation.organisation_name?.trim() ||
              donation.donor_name,

            amount: Number(donation.amount),

            // External Support page currently accepts
            // UPI payments only.
            paymentMode: "UPI",

            // UTR is the payment ID for the external
            // support payment.
            paymentId:
              donation.utr?.trim() || "N/A",
          });

        whatsappSent = Boolean(result.sent);
        whatsappSkipped = Boolean(result.skipped);
        whatsappMessageId =
          result.messageId || null;

        if (!result.sent) {
          whatsappError =
            result.error ||
            null;

          console.warn(
            "External Support WhatsApp was not sent:",
            whatsappError
          );
        } else {
          console.log(
            "External Support WhatsApp sent successfully:",
            {
              donationId: donation.id,
              mobile: donation.mobile,
              messageId: result.messageId,
            }
          );
        }
      } catch (error) {
        whatsappError =
          error instanceof Error
            ? error.message
            : "WhatsApp confirmation message failed.";

        console.error(
          "External Support WhatsApp error:",
          whatsappError
        );

        // IMPORTANT:
        // Do NOT undo the verified donation just because
        // WhatsApp failed.
      }
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    return NextResponse.json({
      success: true,

      donation,

      whatsappSent,
      whatsappSkipped,
      whatsappMessageId,
      whatsappError,
    });
  } catch (error) {
    console.error(
      "Donation verification API error:",
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