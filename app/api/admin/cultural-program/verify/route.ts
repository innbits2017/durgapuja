import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

const VALID_STATUSES = ["approved", "rejected"] as const;

export async function POST(request: Request) {
  try {
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

    const body = await request.json();

    const id = String(body?.id || "").trim();
    const status = String(body?.status || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: "Invalid registration status." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("cultural_program_registrations")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(
        "Cultural program status update error:",
        error
      );

      return NextResponse.json(
        { error: "Unable to update registration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registration: data,
    });
  } catch (error) {
    console.error(
      "Cultural program admin API error:",
      error
    );

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
