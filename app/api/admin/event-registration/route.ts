
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Verify admin session
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    // Only allow configured admin roles
    const role = session.role;

    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "You do not have permission to view registrations." },
        { status: 403 }
      );
    }

    // Fetch event registrations
    const { data, error } = await supabaseAdmin
      .from("event_registrations")
      .select(
        `
          id,
          registration_no,
          participant_name,
          age,
          gender,
          block,
          flat_no,
          mobile,
          email,
          competition,
          games,
          notes,
          event_date,
          status,
          created_at
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Event registrations query failed:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to fetch event registrations.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        registrations: data ?? [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Event registrations API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while fetching registrations.",
      },
      { status: 500 }
    );
  }
}
