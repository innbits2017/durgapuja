import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function checkAdmin() {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function POST(
  request: Request
) {
  try {
    const user = await checkAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(
      body.id || ""
    ).trim();

    const status = String(
      body.status || ""
    ).trim();

    const adminNote =
      body.adminNote
        ? String(body.adminNote).trim()
        : null;

    if (!id) {
      return NextResponse.json(
        { error: "Request ID is required." },
        { status: 400 }
      );
    }

    if (
      !["verified", "rejected"].includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Status must be verified or rejected.",
        },
        { status: 400 }
      );
    }

    const {
      data: existing,
      error: fetchError,
    } = await supabaseAdmin
      .from("inventory_help_requests")
      .select(
        "id, inventory_item_id, quantity, status"
      )
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        {
          error:
            "Inventory help request not found.",
        },
        { status: 404 }
      );
    }

    if (existing.status !== "pending") {
      return NextResponse.json(
        {
          error:
            "This request has already been processed.",
        },
        { status: 400 }
      );
    }

    /*
      Before verification, check the latest
      verified quantity so the requirement
      cannot be exceeded.
    */

    if (status === "verified") {
      const {
        data: item,
        error: itemError,
      } = await supabaseAdmin
        .from("inventory_items")
        .select(
          "id, item_name, required_quantity, active"
        )
        .eq(
          "id",
          existing.inventory_item_id
        )
        .single();

      if (itemError || !item) {
        return NextResponse.json(
          {
            error:
              "Inventory item not found.",
          },
          { status: 404 }
        );
      }

      if (!item.active) {
        return NextResponse.json(
          {
            error:
              "This inventory item is no longer active.",
          },
          { status: 400 }
        );
      }

      const {
        data: verifiedRequests,
        error: verifiedError,
      } = await supabaseAdmin
        .from("inventory_help_requests")
        .select("quantity")
        .eq(
          "inventory_item_id",
          existing.inventory_item_id
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

      if (
        Number(existing.quantity) >
        remaining
      ) {
        return NextResponse.json(
          {
            error:
              `Only ${remaining} ${item.unit || "unit"} remaining for ${item.item_name}.`,
          },
          { status: 400 }
        );
      }
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("inventory_help_requests")
      .update({
        status,
        admin_note: adminNote,
        verified_at:
          status === "verified"
            ? new Date().toISOString()
            : null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      request: data,
    });
  } catch (error) {
    console.error(
      "Inventory verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update inventory help request.",
      },
      { status: 500 }
    );
  }
}