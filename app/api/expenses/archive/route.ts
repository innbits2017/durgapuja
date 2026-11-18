import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { generateExpenseArchive } from "@/lib/expense-archive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireSuperAdmin();
    await generateExpenseArchive();

    return NextResponse.json({
      success: true,
      message: "Bills archive regenerated successfully.",
    });
  } catch (error) {
    console.error("Archive regeneration error:", error);

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Only Super Admin can regenerate the archive." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Unable to regenerate bills archive.",
      },
      { status: 500 }
    );
  }
}
