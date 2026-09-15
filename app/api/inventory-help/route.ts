import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function cleanMobile(value: unknown) {
  return String(value || "")
    .replace(/\D/g, "")
    .replace(/^91/, "");
}

function makeRequestNo() {
  const random = Math.floor(
    100000 + Math.random() * 900000
  );

  return `IH-2026-${random}`;
}

/* ============================================================
   GET PUBLIC INVENTORY
============================================================ */

export async function GET() {
  try {
    const {
      data: items,
      error: itemsError,
    } = await supabaseAdmin
      .from("inventory_items")
      .select("*")
      .eq("active", true)
      .order("display_order", {
        ascending: true,
      });

    if (itemsError) {
      console.error(
        "Public inventory items error:",
        itemsError
      );

      return NextResponse.json(
        {
          error:
            itemsError.message ||
            "Unable to load inventory.",
        },
        { status: 500 }
      );
    }

    const {
      data: requests,
      error: requestsError,
    } = await supabaseAdmin
      .from("inventory_help_requests")
      .select(
        "inventory_item_id, quantity, status"
      )
      .eq("status", "verified");

    if (requestsError) {
      console.error(
        "Public inventory requests error:",
        requestsError
      );

      return NextResponse.json(
        {
          error:
            requestsError.message ||
            "Unable to load received quantities.",
        },
        { status: 500 }
      );
    }

    const receivedMap: Record<string, number> = {};

    for (const request of requests || []) {
      receivedMap[
        request.inventory_item_id
      ] =
        (receivedMap[
          request.inventory_item_id
        ] || 0) +
        Number(request.quantity || 0);
    }

    const result = (items || []).map(
      (item) => {
        const required = Number(
          item.required_quantity || 0
        );

        const received =
          receivedMap[item.id] || 0;

        const remaining = Math.max(
          required - received,
          0
        );

        return {
          id: item.id,
          item_key: item.item_key,
          item_name: item.item_name,
          description: item.description,
          required_quantity: required,
          unit: item.unit,
          icon: item.icon,
          received_quantity: received,
          remaining_quantity: remaining,
          completed: remaining <= 0,
        };
      }
    );

    return NextResponse.json({
      items: result,
    });
  } catch (error) {
    console.error(
      "Public inventory GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load inventory data.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUBLIC HELP REQUEST
============================================================ */

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const name = String(
      body.name || ""
    ).trim();

    const block = String(
      body.block || ""
    ).trim();

    const flatNo = String(
      body.flatNo || ""
    ).trim();

    const mobile = cleanMobile(
      body.mobile
    );

    const inventoryItemId = String(
      body.inventoryItemId || ""
    ).trim();

    const brand =
      body.brand
        ? String(body.brand).trim()
        : null;

    const quantity = Number(
      body.quantity
    );

    if (!name) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (
      !["P1", "P2", "Villa"].includes(
        block
      )
    ) {
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
        {
          error:
            "Please enter a valid 10-digit mobile number.",
        },
        { status: 400 }
      );
    }

    if (!inventoryItemId) {
      return NextResponse.json(
        { error: "Please select an item." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid quantity.",
        },
        { status: 400 }
      );
    }

    const {
      data: item,
      error: itemError,
    } = await supabaseAdmin
      .from("inventory_items")
      .select(
        "id, item_name, item_key, required_quantity, unit, active"
      )
      .eq("id", inventoryItemId)
      .eq("active", true)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        {
          error:
            "Selected inventory item is not available.",
        },
        { status: 400 }
      );
    }

    if (
      item.item_key === "gas_cylinder" &&
      !brand
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter the gas cylinder brand.",
        },
        { status: 400 }
      );
    }

    /*
      Calculate currently verified quantity.
    */

    const {
      data: verifiedRequests,
      error: verifiedError,
    } = await supabaseAdmin
      .from("inventory_help_requests")
      .select("quantity")
      .eq(
        "inventory_item_id",
        item.id
      )
      .eq("status", "verified");

    if (verifiedError) {
      throw verifiedError;
    }

    const received = (
      verifiedRequests || []
    ).reduce(
      (sum, request) =>
        sum +
        Number(request.quantity || 0),
      0
    );

    const remaining = Math.max(
      Number(item.required_quantity || 0) -
        received,
      0
    );

    if (remaining <= 0) {
      return NextResponse.json(
        {
          error:
            "This inventory requirement has already been completed.",
        },
        { status: 400 }
      );
    }

    if (quantity > remaining) {
      return NextResponse.json(
        {
          error:
            `Only ${remaining} ${item.unit || "unit"} still needed.`,
        },
        { status: 400 }
      );
    }

    const requestNo = makeRequestNo();

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("inventory_help_requests")
      .insert({
        request_no: requestNo,
        inventory_item_id:
          inventoryItemId,
        name,
        block,
        flat_no: flatNo,
        mobile,
        brand:
          item.item_key ===
          "gas_cylinder"
            ? brand
            : null,
        quantity,
        status: "pending",
      })
      .select(
        "id, request_no, inventory_item_id, quantity"
      )
      .single();

    if (error) {
      console.error(
        "Inventory help insert error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to submit your help request.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        requestNo: data.request_no,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Inventory help POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}