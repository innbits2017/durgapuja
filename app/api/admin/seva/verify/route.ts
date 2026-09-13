import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_STATUSES = [
  "contacted",
  "confirmed",
  "completed",
  "rejected",
] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status = body.status as AllowedStatus;

    if (!id) {
      return NextResponse.json(
        { error: "Seva registration ID is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid Seva status." },
        { status: 400 }
      );
    }

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("seva_registrations")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) {
      console.error("Seva lookup error:", lookupError);
      return NextResponse.json(
        { error: "Unable to find Seva registration." },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Seva registration not found." },
        { status: 404 }
      );
    }

    if (existing.status === "rejected" && status !== "rejected") {
      return NextResponse.json(
        { error: "A rejected Seva registration cannot be moved back to an active status." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("seva_registrations")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "id, seva_no, name, block, flat_no, mobile, materials, volunteer_roles, volunteer_role_names, volunteer_note, status, admin_note, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("Seva status update error:", error);
      return NextResponse.json(
        { error: "Unable to update Seva registration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      seva: data,
    });
  } catch (error) {
    console.error("Admin Seva API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
