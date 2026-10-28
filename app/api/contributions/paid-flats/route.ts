import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    // Any verified contribution means the flat has contributed.
    // Return each flat only once even when it has multiple payments.
    const { data, error } = await supabaseAdmin
      .from("contributions")
      .select("block, flat_no, status")
      .eq("status", "verified")
      .not("block", "is", null)
      .not("flat_no", "is", null);

    if (error) {
      console.error("PAID FLATS ERROR:", error);

      return NextResponse.json(
        { error: "Unable to load paid flats." },
        { status: 500 }
      );
    }

    const uniqueFlats = new Map<
      string,
      {
        key: string;
        block: string;
        flat_no: string;
        status: string;
      }
    >();

    for (const item of data ?? []) {
      if (!item.block || !item.flat_no) continue;

      const block = String(item.block).trim();
      const flatNo = String(item.flat_no).trim();
      const key = `${block}-${flatNo}`;

      if (!uniqueFlats.has(key)) {
        uniqueFlats.set(key, {
          key,
          block,
          flat_no: flatNo,
          status: item.status,
        });
      }
    }

    return NextResponse.json(Array.from(uniqueFlats.values()));
  } catch (error) {
    console.error("PAID FLATS ROUTE ERROR:", error);

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
