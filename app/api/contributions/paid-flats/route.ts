import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("contributions")
      .select(
        "block, flat_no, status"
      )
      .neq("status", "rejected");

    if (error) {
      console.error(
        "Unable to fetch paid flats:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    const flats = (data ?? []).map(
      (item) => ({
        key: `${item.block}-${item.flat_no}`,
        block: item.block,
        flat_no: item.flat_no,
        status: item.status,
      })
    );

    return NextResponse.json(flats);
  } catch (error) {
    console.error(
      "Paid flats API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load paid flats.",
      },
      { status: 500 }
    );
  }
}