import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const PENDING_STATUSES = [
  "Door Lock",
  "Follow-up",
  "Collect Later",
] as const;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("contributions")
      .select(
        `
        id,
        name,
        block,
        flat_no,
        collection_status,
        collection_channel,
        created_at,
        status
        `
      )
      .in("collection_status", PENDING_STATUSES)
      .neq("status", "verified")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "PENDING CONTRIBUTIONS ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to load pending collections.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error(
      "PENDING CONTRIBUTIONS ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}