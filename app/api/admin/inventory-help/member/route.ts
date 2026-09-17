import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

function generateRequestNo() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `INV-2026-${random}`;
}

export async function POST(request: Request) {
  try {
    const user = await checkAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const inventoryItemId = String(
      body?.inventoryItemId || ""
    ).trim();
    const name = String(body?.name || "").trim();
    const block = String(body?.block || "").trim();
    const flatNo = String(body?.flatNo || "").trim();
    const mobile = String(body?.mobile || "").replace(/\D/g, "");
    const quantity = Number(body?.quantity);

    if (!inventoryItemId) {
      return NextResponse.json(
        { error: "Inventory item is required." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Member name is required." },
        { status: 400 }
      );
    }

    if (!["P1", "P2", "Villa"].includes(block)) {
      return NextResponse.json(
        { error: "Invalid block." },
        { status: 400 }
      );
    }

    if (!flatNo) {
      return NextResponse.json(
        { error: "Flat number is required." },
        { status: 400 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be a positive integer." },
        { status: 400 }
      );
    }

    const { data: item, error: itemError } = await supabaseAdmin
      .from("inventory_items")
      .select("id, item_name, required_quantity, active")
      .eq("id", inventoryItemId)
      .maybeSingle();

    if (itemError) {
      console.error("Inventory item lookup error:", itemError);
      return NextResponse.json(
        { error: "Unable to find the inventory item." },
        { status: 500 }
      );
    }

    if (!item || item.active === false) {
      return NextResponse.json(
        { error: "Inventory item not found." },
        { status: 404 }
      );
    }

    const { data: verifiedRequests, error: requestsError } =
      await supabaseAdmin
        .from("inventory_help_requests")
        .select("quantity")
        .eq("inventory_item_id", inventoryItemId)
        .eq("status", "verified");

    if (requestsError) {
      console.error("Inventory requests lookup error:", requestsError);
      return NextResponse.json(
        { error: "Unable to check current inventory received quantity." },
        { status: 500 }
      );
    }

    const received = (verifiedRequests || []).reduce(
      (sum, request) => sum + Number(request.quantity || 0),
      0
    );
    const remaining = Math.max(
      Number(item.required_quantity || 0) - received,
      0
    );

    if (quantity > remaining) {
      return NextResponse.json(
        {
          error: `Only ${remaining} item${remaining === 1 ? "" : "s"} still required for ${item.item_name}.`,
        },
        { status: 400 }
      );
    }

    const requestNo = generateRequestNo();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("inventory_help_requests")
      .insert({
        request_no: requestNo,
        inventory_item_id: inventoryItemId,
        name,
        block,
        flat_no: flatNo,
        mobile,
        brand: null,
        quantity,
        status: "verified",
        admin_note: "Added manually by Puja Committee.",
        verified_at: now,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Manual inventory help insert error:", error);
      return NextResponse.json(
        { error: error.message || "Unable to add member help." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        request: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Manual inventory help API error:", error);

    return NextResponse.json(
      { error: "Unable to add member help." },
      { status: 500 }
    );
  }
}
