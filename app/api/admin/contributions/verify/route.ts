import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

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
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Contribution ID is missing." },
        { status: 400 }
      );
    }

    if (status !== "verified" && status !== "rejected") {
      return NextResponse.json(
        { error: "Invalid status." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("contributions")
      .update({
        status,
        verified_at:
          status === "verified"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(
        "SUPABASE UPDATE ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to update contribution.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contribution: data,
    });
  } catch (error) {
    console.error("VERIFY ROUTE ERROR:", error);

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
