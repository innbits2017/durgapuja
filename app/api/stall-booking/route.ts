import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const VALID_BLOCKS = ["P1", "P2", "Villa"] as const;
const VALID_STALL_TYPES = ["Food", "Product", "Brand"] as const;

const FOOD_CATEGORIES = [
  "Snacks",
  "Sweets",
  "Bakery",
  "Beverages",
  "North Indian",
  "South Indian",
  "Bengali",
  "Odia",
  "Chinese",
  "Other",
] as const;

const PRODUCT_CATEGORIES = [
  "Clothing",
  "Jewellery",
  "Handicrafts",
  "Home Decor",
  "Cosmetics & Beauty",
  "Toys & Kids",
  "Art & Craft",
  "Books & Stationery",
  "Plants & Gardening",
  "Other",
] as const;

const BRAND_CATEGORIES = [
  "Fashion",
  "Food & Beverage",
  "Beauty & Wellness",
  "Automobile",
  "Electronics",
  "Education",
  "Real Estate",
  "Finance",
  "Other",
] as const;

function isValidCategory(
  stallType: string,
  category: string
) {
  if (stallType === "Food") {
    return FOOD_CATEGORIES.includes(
      category as (typeof FOOD_CATEGORIES)[number]
    );
  }

  if (stallType === "Product") {
    return PRODUCT_CATEGORIES.includes(
      category as (typeof PRODUCT_CATEGORIES)[number]
    );
  }

  if (stallType === "Brand") {
    return BRAND_CATEGORIES.includes(
      category as (typeof BRAND_CATEGORIES)[number]
    );
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body?.name || "").trim();
    const mobile = String(body?.mobile || "")
      .replace(/\D/g, "")
      .trim();

    const block = String(body?.block || "").trim();
    const flatNo = String(body?.flatNo || "").trim();

    const stallType = String(body?.stallType || "").trim();
    const category = String(body?.category || "").trim();
    const description = String(body?.description || "").trim();

    /* ==========================================================
       VALIDATION
    ========================================================== */

    if (!name) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Name is too long." },
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

    if (
      !VALID_BLOCKS.includes(
        block as (typeof VALID_BLOCKS)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Please select a valid block." },
        { status: 400 }
      );
    }

    if (!flatNo) {
      return NextResponse.json(
        { error: "Flat number is required." },
        { status: 400 }
      );
    }

    if (flatNo.length > 20) {
      return NextResponse.json(
        { error: "Invalid flat number." },
        { status: 400 }
      );
    }

    if (
      !VALID_STALL_TYPES.includes(
        stallType as (typeof VALID_STALL_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Please select a valid stall type." },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Please select a stall category." },
        { status: 400 }
      );
    }

    if (!isValidCategory(stallType, category)) {
      return NextResponse.json(
        {
          error:
            "The selected category is not valid for this stall type.",
        },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          error:
            "Please provide a brief description of your stall.",
        },
        { status: 400 }
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        {
          error:
            "Stall description cannot exceed 500 characters.",
        },
        { status: 400 }
      );
    }

    /* ==========================================================
       SAVE STALL ENQUIRY

       IMPORTANT:
       status is always set server-side to "pending".
       The public form cannot submit an approved/rejected status.
    ========================================================== */

    const { data, error } = await supabaseAdmin
      .from("stall_enquiries")
      .insert({
        name,
        mobile,
        block,
        flat_no: flatNo,
        stall_type: stallType,
        category,
        description,
        status: "pending",
      })
      .select(
        "id, name, mobile, block, flat_no, stall_type, category, description, status, created_at"
      )
      .single();

    if (error) {
      console.error("Stall enquiry insert error:", error);

      return NextResponse.json(
        {
          error:
            "Unable to submit the stall request. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        bookingNo: data.id,
        enquiry: data,
        message:
          "Your stall request has been submitted successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Stall booking API error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
