import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("last_year_paid")
      .select("id, block, flat_no, resident_type, amount")
      .order("block", { ascending: true })
      .order("flat_no", { ascending: true });

    if (error) {
      console.error("Unable to fetch last year paid data:", error);
      return NextResponse.json(
        { error: "Unable to load last year payment data." },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Last year paid API error:", error);
    return NextResponse.json(
      { error: "Unable to load last year payment data." },
      { status: 500 }
    );
  }
}
