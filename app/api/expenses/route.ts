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

// POST — Add expense OR confirm refund
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

    /* ==========================================================
       CONFIRM REFUND
    ========================================================== */

    if (body.action === "refund") {
      const paidBy = String(body.paidBy || "").trim();
      const paymentMode = String(
        body.paymentMode || ""
      ).trim();
      const referenceNo = String(
        body.referenceNo || ""
      ).trim();

      if (!paidBy) {
        return NextResponse.json(
          {
            error:
              "Paid By name is required.",
          },
          { status: 400 }
        );
      }

      if (!paymentMode) {
        return NextResponse.json(
          {
            error:
              "Mode of payment is required.",
          },
          { status: 400 }
        );
      }

      if (!referenceNo) {
        return NextResponse.json(
          {
            error:
              "UTR / Transaction ID is required.",
          },
          { status: 400 }
        );
      }

      /*
       * Find all expenses paid personally by this person
       * which have NOT been refunded yet.
       */
      const {
        data: pendingExpenses,
        error: expenseFetchError,
      } = await supabaseAdmin
        .from("expenses")
        .select(
          "id, title, amount, paid_by, refund_id"
        )
        .eq("paid_by", paidBy)
        .is("refund_id", null);

      if (expenseFetchError) {
        console.error(
          "Pending refund expense fetch error:",
          expenseFetchError
        );

        return NextResponse.json(
          {
            error:
              expenseFetchError.message,
          },
          { status: 500 }
        );
      }

      if (
        !pendingExpenses ||
        pendingExpenses.length === 0
      ) {
        return NextResponse.json(
          {
            error:
              "There are no pending expenses to refund for this person.",
          },
          { status: 400 }
        );
      }

      const totalAmount =
        pendingExpenses.reduce(
          (total, expense) =>
            total +
            Number(expense.amount || 0),
          0
        );

      if (
        !Number.isFinite(totalAmount) ||
        totalAmount <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid refund amount.",
          },
          { status: 400 }
        );
      }

      /*
       * Create the refund record.
       */
      const {
        data: refund,
        error: refundError,
      } = await supabaseAdmin
        .from("expense_refunds")
        .insert({
          paid_by: paidBy,
          amount: totalAmount,
          payment_mode: paymentMode,
          reference_no: referenceNo,
        })
        .select()
        .single();

      if (refundError) {
        console.error(
          "Expense refund insert error:",
          refundError
        );

        return NextResponse.json(
          {
            error:
              refundError.message,
          },
          { status: 500 }
        );
      }

      /*
       * Attach the refund ID to all pending expenses
       * belonging to this person.
       */
      const expenseIds =
        pendingExpenses.map(
          (expense) => expense.id
        );

      const {
        data: updatedExpenses,
        error: updateError,
      } = await supabaseAdmin
        .from("expenses")
        .update({
          refund_id: refund.id,
          updated_at:
            new Date().toISOString(),
        })
        .in("id", expenseIds)
        .is("refund_id", null)
        .select();

      if (updateError) {
        console.error(
          "Expense refund update error:",
          updateError
        );

        /*
         * Best-effort cleanup so that an orphan refund
         * record is not left behind.
         */
        await supabaseAdmin
          .from("expense_refunds")
          .delete()
          .eq("id", refund.id);

        return NextResponse.json(
          {
            error:
              updateError.message,
          },
          { status: 500 }
        );
      }

      /*
       * Safety check — make sure every expense we intended
       * to refund was actually updated.
       */
      if (
        !updatedExpenses ||
        updatedExpenses.length !==
          pendingExpenses.length
      ) {
        await supabaseAdmin
          .from("expenses")
          .update({
            refund_id: null,
            updated_at:
              new Date().toISOString(),
          })
          .eq("refund_id", refund.id);

        await supabaseAdmin
          .from("expense_refunds")
          .delete()
          .eq("id", refund.id);

        return NextResponse.json(
          {
            error:
              "Refund could not be completed safely. Please try again.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Refund confirmed successfully.",
        refund,
        expenses:
          updatedExpenses ?? [],
      });
    }

    /* ==========================================================
       ADD EXPENSE
    ========================================================== */

    const {
      title,
      category,
      paidTo,
      paidBy,
      amount,
      expenseDate,
      paymentMode,
      referenceNo,
      notes,
    } = body;

    if (
      !title ||
      !category ||
      !amount ||
      !expenseDate
    ) {
      return NextResponse.json(
        {
          error:
            "Title, category, amount and expense date are required.",
        },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid expense amount.",
        },
        { status: 400 }
      );
    }

    const cleanPaidBy =
      paidBy !== undefined &&
      paidBy !== null
        ? String(paidBy).trim()
        : "";

    const { data, error } =
      await supabaseAdmin
        .from("expenses")
        .insert({
          title: String(title).trim(),
          category:
            String(category).trim(),
          paid_to:
            paidTo?.trim() || null,

          /*
           * Optional.
           *
           * NULL means the committee paid the expense
           * directly.
           *
           * A name means a person paid it personally
           * and it is pending reimbursement.
           */
          paid_by:
            cleanPaidBy || null,

          amount: numericAmount,
          expense_date: expenseDate,
          payment_mode:
            paymentMode || "cash",
          reference_no:
            referenceNo?.trim() || null,
          notes:
            notes?.trim() || null,

          /*
           * Every newly created expense starts without
           * a refund. If paid_by is present, it remains
           * outside the actual committee expense total
           * until this becomes non-null.
           */
          refund_id: null,
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Expense insert error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Expense added successfully.",
      expense: data,
    });
  } catch (error) {
    console.error(
      "Expense POST error:",
      error
    );

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
      paidBy,
      amount,
      expenseDate,
      paymentMode,
      referenceNo,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Expense ID is required.",
        },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid expense amount.",
        },
        { status: 400 }
      );
    }

    /*
     * Check the existing expense first.
     */
    const {
      data: existingExpense,
      error: existingError,
    } = await supabaseAdmin
      .from("expenses")
      .select(
        "refund_id, paid_by, amount"
      )
      .eq("id", id)
      .single();

    if (existingError) {
      console.error(
        "Existing expense fetch error:",
        existingError
      );

      return NextResponse.json(
        {
          error:
            existingError.message,
        },
        { status: 500 }
      );
    }

    const cleanPaidBy =
      paidBy !== undefined &&
      paidBy !== null
        ? String(paidBy).trim()
        : "";

    /*
     * Once an expense has already been refunded,
     * don't allow the Paid By or amount to be changed.
     *
     * Otherwise the refund history could become
     * financially inconsistent.
     */
    if (existingExpense?.refund_id) {
      const oldPaidBy =
        existingExpense.paid_by || null;

      if (
        oldPaidBy !==
        (cleanPaidBy || null)
      ) {
        return NextResponse.json(
          {
            error:
              "This expense has already been refunded, so Paid By cannot be changed.",
          },
          { status: 400 }
        );
      }

      if (
        Number(existingExpense.amount) !==
        numericAmount
      ) {
        return NextResponse.json(
          {
            error:
              "This expense has already been refunded, so the amount cannot be changed.",
          },
          { status: 400 }
        );
      }
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("expenses")
      .update({
        title: String(title).trim(),
        category:
          String(category).trim(),
        paid_to:
          paidTo?.trim() || null,
        paid_by:
          cleanPaidBy || null,
        amount: numericAmount,
        expense_date: expenseDate,
        payment_mode:
          paymentMode || "cash",
        reference_no:
          referenceNo?.trim() || null,
        notes:
          notes?.trim() || null,

        /*
         * Preserve the refund status of an already
         * refunded expense.
         */
        refund_id:
          existingExpense?.refund_id ||
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(
        "Expense update error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Expense updated successfully.",
      expense: data,
    });
  } catch (error) {
    console.error(
      "Expense PATCH error:",
      error
    );

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

// DELETE — Delete expense
export async function DELETE(
  request: Request
) {
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
        {
          error:
            "Expense ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Check whether this expense has already
     * been included in a refund.
     */
    const {
      data: existingExpense,
      error: existingError,
    } = await supabaseAdmin
      .from("expenses")
      .select("refund_id")
      .eq("id", id)
      .single();

    if (existingError) {
      console.error(
        "Existing expense fetch error:",
        existingError
      );

      return NextResponse.json(
        {
          error:
            existingError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Don't allow deletion of an expense that has
     * already been refunded because that would make
     * the refund record inconsistent.
     */
    if (existingExpense?.refund_id) {
      return NextResponse.json(
        {
          error:
            "This expense has already been refunded and cannot be deleted.",
        },
        { status: 400 }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("expenses")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "Expense delete error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Expense deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Expense DELETE error:",
      error
    );

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}