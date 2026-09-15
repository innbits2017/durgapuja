import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/* ============================================================
   ADMIN AUTH
============================================================ */

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/* ============================================================
   HELPERS
============================================================ */

function makeItemKey(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/* ============================================================
   GET
============================================================ */

export async function GET() {
  try {
    const user = await checkAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const [
      { data: items, error: itemsError },
      { data: requests, error: requestsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("inventory_items")
        .select("*")
        .order("display_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        }),

      supabaseAdmin
        .from("inventory_help_requests")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (itemsError) {
      console.error("Inventory items error:", itemsError);

      return NextResponse.json(
        {
          error:
            itemsError.message ||
            "Unable to load inventory items.",
        },
        { status: 500 }
      );
    }

    if (requestsError) {
      console.error(
        "Inventory requests error:",
        requestsError
      );

      return NextResponse.json(
        {
          error:
            requestsError.message ||
            "Unable to load inventory requests.",
        },
        { status: 500 }
      );
    }

    const safeItems = (items || []).filter(
      (item) => item.active !== false
    );

    const receivedMap: Record<string, number> = {};

    for (const request of requests || []) {
      if (request.status !== "verified") {
        continue;
      }

      const itemId = request.inventory_item_id;

      receivedMap[itemId] =
        (receivedMap[itemId] || 0) +
        Number(request.quantity || 0);
    }

    const enrichedItems = safeItems.map((item) => {
      const received =
        receivedMap[item.id] || 0;

      const required = Number(
        item.required_quantity || 0
      );

      const remaining = Math.max(
        required - received,
        0
      );

      return {
        ...item,
        required_quantity: required,
        received_quantity: received,
        remaining_quantity: remaining,
        completed: remaining <= 0,
      };
    });

    const itemMap = new Map(
      safeItems.map((item) => [item.id, item])
    );

    const enrichedRequests = (requests || []).map(
      (request) => {
        const item = itemMap.get(
          request.inventory_item_id
        );

        return {
          ...request,
          inventory_item: item
            ? {
                item_name: item.item_name,
                unit: item.unit,
              }
            : null,
        };
      }
    );

    return NextResponse.json({
      items: enrichedItems,
      requests: enrichedRequests,
    });
  } catch (error) {
    console.error(
      "Admin inventory GET error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load inventory data.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST - ADD INVENTORY
============================================================ */

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

    const itemName = String(
      body.itemName ||
        body.item_name ||
        ""
    ).trim();

    const description = body.description
      ? String(body.description).trim()
      : null;

    const requiredQuantity = Number(
      body.requiredQuantity ??
        body.required_quantity
    );

    const unit = String(
      body.unit || ""
    ).trim();

    const icon = String(
      body.icon || "fa-box"
    ).trim();

    if (!itemName) {
      return NextResponse.json(
        { error: "Item name is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(requiredQuantity) ||
      requiredQuantity < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Required quantity must be a positive integer.",
        },
        { status: 400 }
      );
    }

    if (!unit) {
      return NextResponse.json(
        { error: "Unit is required." },
        { status: 400 }
      );
    }

    const itemKey = makeItemKey(itemName);

    if (!itemKey) {
      return NextResponse.json(
        { error: "Invalid item name." },
        { status: 400 }
      );
    }

    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from("inventory_items")
      .select("id, active")
      .eq("item_key", itemKey)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return NextResponse.json(
        {
          error:
            "An inventory item with this name already exists.",
        },
        { status: 409 }
      );
    }

    const {
      data: maxOrder,
      error: orderError,
    } = await supabaseAdmin
      .from("inventory_items")
      .select("display_order")
      .order("display_order", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }

    const displayOrder =
      Number(maxOrder?.display_order || 0) + 1;

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("inventory_items")
      .insert({
        item_key: itemKey,
        item_name: itemName,
        description,
        required_quantity: requiredQuantity,
        unit,
        icon,
        display_order: displayOrder,
        active: true,
      })
      .select("*")
      .single();

    if (error) {
      console.error(
        "Inventory insert error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to add inventory.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        item: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Admin inventory POST error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to add inventory.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH - EDIT INVENTORY
============================================================ */

export async function PATCH(request: Request) {
  try {
    const user = await checkAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    /*
     * Accept both camelCase and snake_case.
     */
    const id = String(
      body.id ||
        body.inventoryId ||
        body.inventory_id ||
        ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          error: "Inventory ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * First fetch the existing item.
     * This allows partial updates.
     */
    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from("inventory_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Inventory fetch before update:",
        existingError
      );

      return NextResponse.json(
        {
          error:
            existingError.message ||
            "Unable to find inventory item.",
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          error: "Inventory item not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Support all editable fields.
     */
    const itemName =
      body.itemName !== undefined ||
      body.item_name !== undefined
        ? String(
            body.itemName ??
              body.item_name ??
              ""
          ).trim()
        : existing.item_name;

    const description =
      body.description !== undefined
        ? body.description
          ? String(body.description).trim()
          : null
        : existing.description;

    const requiredQuantity =
      body.requiredQuantity !== undefined ||
      body.required_quantity !== undefined
        ? Number(
            body.requiredQuantity ??
              body.required_quantity
          )
        : Number(existing.required_quantity);

    const unit =
      body.unit !== undefined
        ? String(body.unit).trim()
        : existing.unit;

    const icon =
      body.icon !== undefined
        ? String(body.icon).trim()
        : existing.icon || "fa-box";

    if (!itemName) {
      return NextResponse.json(
        {
          error: "Item name is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(requiredQuantity) ||
      requiredQuantity < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Required quantity must be a positive integer.",
        },
        { status: 400 }
      );
    }

    if (!unit) {
      return NextResponse.json(
        {
          error: "Unit is required.",
        },
        { status: 400 }
      );
    }

    const newItemKey = makeItemKey(itemName);

    if (!newItemKey) {
      return NextResponse.json(
        {
          error: "Invalid item name.",
        },
        { status: 400 }
      );
    }

    /*
     * If name changed, make sure another item
     * doesn't already use that item key.
     */
    if (newItemKey !== existing.item_key) {
      const {
        data: duplicate,
        error: duplicateError,
      } = await supabaseAdmin
        .from("inventory_items")
        .select("id")
        .eq("item_key", newItemKey)
        .neq("id", id)
        .maybeSingle();

      if (duplicateError) {
        throw duplicateError;
      }

      if (duplicate) {
        return NextResponse.json(
          {
            error:
              "Another inventory item with this name already exists.",
          },
          { status: 409 }
        );
      }
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("inventory_items")
      .update({
        item_key: newItemKey,
        item_name: itemName,
        description,
        required_quantity: requiredQuantity,
        unit,
        icon,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(
        "Inventory update error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to update inventory.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully.",
      item: data,
    });
  } catch (error) {
    console.error(
      "Admin inventory PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to update inventory.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE - REMOVE INVENTORY
============================================================ */

export async function DELETE(request: Request) {
  try {
    const user = await checkAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    /*
     * Accept ID in either:
     *
     * DELETE /api/admin/inventory-help?id=UUID
     *
     * OR
     *
     * body: { id: UUID }
     */
    const { searchParams } =
      new URL(request.url);

    let id =
      searchParams.get("id") ||
      searchParams.get("inventoryId") ||
      searchParams.get("inventory_id");

    /*
     * If no query parameter exists,
     * try reading JSON body.
     */
    if (!id) {
      try {
        const body = await request.json();

        id =
          body.id ||
          body.inventoryId ||
          body.inventory_id ||
          null;
      } catch {
        // No JSON body.
      }
    }

    id = id ? String(id).trim() : "";

    if (!id) {
      return NextResponse.json(
        {
          error: "Inventory ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * We intentionally DO NOT physically delete
     * the inventory item because help requests may
     * already reference it.
     *
     * Instead, mark it inactive.
     */
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("inventory_items")
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, item_name, active")
      .single();

    if (error) {
      console.error(
        "Inventory remove error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to remove inventory.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inventory removed successfully.",
      item: data,
    });
  } catch (error) {
    console.error(
      "Admin inventory DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to remove inventory.",
      },
      { status: 500 }
    );
  }
}