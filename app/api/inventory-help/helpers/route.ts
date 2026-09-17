import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("inventory_help_requests")
      .select(
        "inventory_item_id, name, block, flat_no, created_at"
      )
      .eq("status", "verified")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Inventory helpers error:", error);
      return NextResponse.json(
        { error: "Unable to load inventory helpers." },
        { status: 500 }
      );
    }

    const helpersByItem: Record<
      string,
      Array<{
        name: string;
        block: string;
        flat_no: string;
      }>
    > = {};

    const seen = new Set<string>();

    for (const request of data || []) {
      const itemId = String(request.inventory_item_id || "");
      const block = String(request.block || "");
      const flatNo = String(request.flat_no || "");

      if (!itemId || !block || !flatNo) continue;

      // Show each member/flat only once for a particular inventory item.
      const key = `${itemId}-${block}-${flatNo}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (!helpersByItem[itemId]) {
        helpersByItem[itemId] = [];
      }

      helpersByItem[itemId].push({
        name: String(request.name || "Member"),
        block,
        flat_no: flatNo,
      });
    }

    return NextResponse.json(
      { helpersByItem },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Inventory helpers GET error:", error);

    return NextResponse.json(
      { error: "Unable to load inventory helpers." },
      { status: 500 }
    );
  }
}
