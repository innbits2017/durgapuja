import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      flatNo,
      mobile,
      amount,
      utr,
    } = body;

    // Validate required fields
    if (!name || !flatNo || !mobile || !amount || !utr) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid contribution amount." },
        { status: 400 }
      );
    }

    const cleanUtr = utr.trim();

    // Check duplicate UTR
    const { data: existing, error: checkError } =
      await supabaseAdmin
        .from("contributions")
        .select("id")
        .eq("utr", cleanUtr)
        .maybeSingle();

    if (checkError) {
      console.error("UTR check error:", checkError);

      return NextResponse.json(
        { error: "Unable to check UTR." },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        {
          error: "This UTR has already been submitted.",
        },
        { status: 409 }
      );
    }

    // Insert contribution
    const { data, error } = await supabaseAdmin
      .from("contributions")
      .insert({
        name: name.trim(),
        flat_no: flatNo.trim(),
        mobile: mobile.trim(),
        amount: numericAmount,
        utr: cleanUtr,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);

      return NextResponse.json(
        {
          error: "Unable to save contribution.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contribution submitted successfully.",
      contribution: data,
    });

  } catch (error) {
    console.error("API error:", error);

    return NextResponse.json(
      {
        error: "Invalid request.",
      },
      { status: 500 }
    );
  }
}