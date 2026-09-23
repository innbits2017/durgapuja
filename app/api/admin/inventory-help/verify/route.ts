import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendInventoryHelpVerifiedWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/* =========================================================
   ADMIN AUTH
========================================================= */

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

/* =========================================================
   VERIFY / REJECT INVENTORY HELP
========================================================= */

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
        {
          error:
            "Request ID is required.",
        },
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

    /* =======================================================
       GET EXISTING REQUEST
    ======================================================= */

    const {
      data: existing,
      error: fetchError,
    } = await supabaseAdmin
      .from("inventory_help_requests")
      .select(
        `
          id,
          request_no,
          inventory_item_id,
          name,
          block,
          flat_no,
          mobile,
          quantity,
          status,
          admin_note,
          verified_at
        `
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

    /* =======================================================
       PREVENT DOUBLE PROCESSING
    ======================================================= */

    if (existing.status !== "pending") {
      return NextResponse.json(
        {
          error:
            "This request has already been processed.",
        },
        { status: 400 }
      );
    }

    let inventoryItem: {
      id: string;
      item_name: string;
      required_quantity: number;
      unit: string | null;
      active: boolean;
    } | null = null;

    /* =======================================================
       VERIFICATION CHECK
    ======================================================= */

    if (status === "verified") {
      const {
        data: item,
        error: itemError,
      } = await supabaseAdmin
        .from("inventory_items")
        .select(
          "id, item_name, required_quantity, unit, active"
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

      inventoryItem = item;

      if (!item.active) {
        return NextResponse.json(
          {
            error:
              "This inventory item is no longer active.",
          },
          { status: 400 }
        );
      }

      /* -----------------------------------------------------
         Calculate currently verified quantity
      ----------------------------------------------------- */

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
          Number(
            request.quantity || 0
          ),
        0
      );

      const remaining = Math.max(
        Number(
          item.required_quantity || 0
        ) - received,
        0
      );

      if (
        Number(existing.quantity) >
        remaining
      ) {
        return NextResponse.json(
          {
            error:
              `Only ${remaining} ${
                item.unit || "unit"
              } remaining for ${
                item.item_name
              }.`,
          },
          { status: 400 }
        );
      }
    }

    /* =======================================================
       UPDATE REQUEST
    ======================================================= */

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

    /* =======================================================
       WHATSAPP - VERIFIED ONLY
    ======================================================= */

    let whatsappSent = false;

    let whatsappError:
      | string
      | null = null;

    if (status === "verified") {
      try {
        /*
         * inventoryItem should already be available
         * because the verification checks above run
         * before this point.
         */

        if (!inventoryItem) {
          throw new Error(
            "Inventory item details are unavailable."
          );
        }

        const result =
          await sendInventoryHelpVerifiedWhatsApp({
            mobile: data.mobile,
            name: data.name,
            itemName:
              inventoryItem.item_name,
            quantity: Number(
              data.quantity || 0
            ),
            unit:
              inventoryItem.unit ||
              "unit",
            block: data.block,
            flatNo: data.flat_no,
          });

        whatsappSent =
          result.sent;

        whatsappError =
          result.sent
            ? null
            : result.error || null;

        console.log(
          "Inventory Help WhatsApp result:",
          {
            requestId: data.id,
            requestNo:
              data.request_no,
            whatsappSent,
            whatsappError,
            result,
          }
        );
      } catch (error) {
        whatsappError =
          error instanceof Error
            ? error.message
            : "WhatsApp message failed.";

        console.error(
          "Inventory Help WhatsApp error:",
          error
        );

        /*
         * IMPORTANT:
         * Do not fail the inventory verification
         * because WhatsApp failed.
         */
      }
    }

    /* =======================================================
       RESPONSE
    ======================================================= */

    return NextResponse.json({
      success: true,

      request: data,

      whatsappSent,

      whatsappError,
    });
  } catch (error) {
    console.error(
      "Inventory verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update inventory help request.",
      },
      { status: 500 }
    );
  }
}