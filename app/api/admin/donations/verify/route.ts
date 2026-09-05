import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    // Check admin authentication
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { id, status } = body;

    if (!id || !["verified", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid donation or status." },
        { status: 400 }
      );
    }

    const updateData: {
      status: string;
      verified_at?: string | null;
    } = {
      status,
    };

    if (status === "verified") {
      updateData.verified_at = new Date().toISOString();
    } else {
      updateData.verified_at = null;
    }

    const { data, error } = await supabaseAdmin
      .from("donations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Donation status update error:", error);

      return NextResponse.json(
        { error: "Unable to update donation status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      donation: data,
    });
  } catch (error) {
    console.error("Donation verification API error:", error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}