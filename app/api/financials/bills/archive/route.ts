
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { generateExpenseArchive } from "@/lib/expense-archive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireSuperAdmin();

    const result = await generateExpenseArchive();

    return NextResponse.json({
      success: true,
      message:
        "Expense archive generated successfully.",
      billCount: result.billCount,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    console.error(
      "Manual expense archive generation failed:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to generate expense archive.",
      },
      { status: 500 }
    );
  }
}
