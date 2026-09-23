import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const VALID_BLOCKS = ["P1", "P2", "Villa"] as const;
const VALID_STALL_TYPES = ["Food", "Product", "Brand"] as const;
const VALID_STATUSES = ["pending", "approved", "rejected"] as const;

const STALL_CATEGORIES: Record<
  (typeof VALID_STALL_TYPES)[number],
  string[]
> = {
  Food: [
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
  ],
  Product: [
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
  ],
  Brand: [
    "Fashion",
    "Food & Beverage",
    "Beauty & Wellness",
    "Automobile",
    "Electronics",
    "Education",
    "Real Estate",
    "Finance",
    "Other",
  ],
};

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return user;
}

function validateStallData(body: any) {
  const name = String(body?.name || "").trim();

  const mobile = String(body?.mobile || "")
    .replace(/\D/g, "")
    .trim();

  const block = String(body?.block || "").trim();
  const flatNo = String(body?.flatNo || "").trim();
  const stallType = String(body?.stallType || "").trim();
  const category = String(body?.category || "").trim();
  const description = String(
    body?.description || ""
  ).trim();

  if (!name) {
    return {
      error: "Name is required.",
    };
  }

  if (name.length > 100) {
    return {
      error: "Name is too long.",
    };
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return {
      error:
        "Please enter a valid 10-digit mobile number.",
    };
  }

  if (
    !VALID_BLOCKS.includes(
      block as (typeof VALID_BLOCKS)[number]
    )
  ) {
    return {
      error: "Please select a valid block.",
    };
  }

  if (!flatNo) {
    return {
      error: "Flat number is required.",
    };
  }

  if (
    !VALID_STALL_TYPES.includes(
      stallType as (typeof VALID_STALL_TYPES)[number]
    )
  ) {
    return {
      error: "Please select a valid stall type.",
    };
  }

  if (!category) {
    return {
      error: "Please select a category.",
    };
  }

  const validCategories =
    STALL_CATEGORIES[
      stallType as (typeof VALID_STALL_TYPES)[number]
    ];

  if (!validCategories?.includes(category)) {
    return {
      error:
        "The selected category is not valid for this stall type.",
    };
  }

  if (!description) {
    return {
      error:
        "Please provide a brief description of the stall.",
    };
  }

  if (description.length > 500) {
    return {
      error:
        "Stall description cannot exceed 500 characters.",
    };
  }

  return {
    values: {
      name,
      mobile,
      block,
      flat_no: flatNo,
      stall_type: stallType,
      category,
      description,
    },
  };
}

/* ============================================================
   GET - ADMIN LIST
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

    const { data, error } = await supabaseAdmin
      .from("stall_enquiries")
      .select(
        "id, name, mobile, block, flat_no, stall_type, category, description, status, admin_notes, created_at, updated_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Stall enquiries fetch error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to load stall enquiries.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enquiries: data || [],
    });
  } catch (error) {
    console.error(
      "Admin stall GET error:",
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

/* ============================================================
   POST - ADMIN ADD STALL
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

    const validation =
      validateStallData(body);

    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const requestedStatus = String(
      body?.status || "pending"
    ).trim();

    if (
      !VALID_STATUSES.includes(
        requestedStatus as (typeof VALID_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid stall enquiry status.",
        },
        { status: 400 }
      );
    }

    const adminNotes =
      body?.adminNotes === null ||
      body?.adminNotes === undefined
        ? null
        : String(body.adminNotes).trim() || null;

    const { data, error } = await supabaseAdmin
      .from("stall_enquiries")
      .insert({
        ...validation.values,
        status: requestedStatus,
        admin_notes: adminNotes,
      })
      .select(
        "id, name, mobile, block, flat_no, stall_type, category, description, status, admin_notes, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error(
        "Admin stall insert error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to add stall enquiry.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        enquiry: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Admin stall POST error:",
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

/* ============================================================
   PATCH - ADMIN UPDATE STATUS / NOTE
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

    const id = String(
      body?.id || ""
    ).trim();

    const status = String(
      body?.status || ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Stall enquiry ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      !VALID_STATUSES.includes(
        status as (typeof VALID_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid stall enquiry status.",
        },
        { status: 400 }
      );
    }

    const adminNotes =
      body?.adminNotes === null ||
      body?.adminNotes === undefined
        ? null
        : String(body.adminNotes).trim() || null;

    const { data: existing, error: lookupError } =
      await supabaseAdmin
        .from("stall_enquiries")
        .select("id, status")
        .eq("id", id)
        .maybeSingle();

    if (lookupError) {
      console.error(
        "Stall enquiry lookup error:",
        lookupError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find stall enquiry.",
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Stall enquiry not found.",
        },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("stall_enquiries")
      .update({
        status,
        admin_notes: adminNotes,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "id, name, mobile, block, flat_no, stall_type, category, description, status, admin_notes, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error(
        "Stall enquiry update error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to update stall enquiry.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enquiry: data,
    });
  } catch (error) {
    console.error(
      "Admin stall PATCH error:",
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

/* ============================================================
   DELETE - ADMIN DELETE STALL
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

    const body = await request.json();

    const id = String(
      body?.id || ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Stall enquiry ID is required.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("stall_enquiries")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Stall enquiry delete error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to delete stall enquiry.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Stall enquiry deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Admin stall DELETE error:",
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
