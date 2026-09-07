import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

// GET — Fetch all expenses
export async function GET() {
  try {
    const user = await requireAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Expense fetch error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expenses: data ?? [],
    });
  } catch (error) {
    console.error("Expense GET error:", error);

    return NextResponse.json(
      { error: "Unable to fetch expenses." },
      { status: 500 }
    );
  }
}

// POST — Add expense
export async function POST(request: Request) {
  try {
    const user = await requireAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      category,
      paidTo,
      amount,
      expenseDate,
      paymentMode,
      referenceNo,
      notes,
    } = body;

    if (!title || !category || !amount || !expenseDate) {
      return NextResponse.json(
        {
          error:
            "Title, category, amount and expense date are required.",
        },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid expense amount." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("expenses")
      .insert({
        title: String(title).trim(),
        category: String(category).trim(),
        paid_to: paidTo?.trim() || null,
        amount: numericAmount,
        expense_date: expenseDate,
        payment_mode: paymentMode || "cash",
        reference_no: referenceNo?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Expense insert error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expense added successfully.",
      expense: data,
    });
  } catch (error) {
    console.error("Expense POST error:", error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// PATCH — Update expense
export async function PATCH(request: Request) {
  try {
    const user = await requireAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      id,
      title,
      category,
      paidTo,
      amount,
      expenseDate,
      paymentMode,
      referenceNo,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required." },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid expense amount." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("expenses")
      .update({
        title: String(title).trim(),
        category: String(category).trim(),
        paid_to: paidTo?.trim() || null,
        amount: numericAmount,
        expense_date: expenseDate,
        payment_mode: paymentMode || "cash",
        reference_no: referenceNo?.trim() || null,
        notes: notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Expense update error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expense updated successfully.",
      expense: data,
    });
  } catch (error) {
    console.error("Expense PATCH error:", error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// DELETE — Delete expense
export async function DELETE(request: Request) {
  try {
    const user = await requireAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Expense delete error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully.",
    });
  } catch (error) {
    console.error("Expense DELETE error:", error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}