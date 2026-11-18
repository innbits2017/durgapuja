
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSuperAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ARCHIVE_KEY = "all-expense-bills";
const ARCHIVE_BUCKET = "expense-archives";
const DOWNLOAD_FILE_NAME = "all-expense-bills.zip";

export async function GET() {
  try {
    // 1. Verify Super Admin access
    await requireSuperAdmin();

    // 2. Fetch archive record
    const { data: archive, error: archiveError } =
      await supabaseAdmin
        .from("expense_archives")
        .select(
          "archive_key, storage_path, status, bill_count, generated_at, error_message"
        )
        .eq("archive_key", ARCHIVE_KEY)
        .maybeSingle();

    if (archiveError) {
      console.error("Archive database error:", archiveError);

      return NextResponse.json(
        { error: "Unable to retrieve expense archive." },
        { status: 500 }
      );
    }

    if (!archive) {
      return NextResponse.json(
        {
          error: "Expense archive has not been generated yet.",
          status: "not_found",
        },
        { status: 404 }
      );
    }

    // 3. Verify archive is ready
    if (archive.status !== "ready" || !archive.storage_path) {
      return NextResponse.json(
        {
          error: "Expense archive is not ready yet.",
          status: archive.status,
          billCount: archive.bill_count,
          message: archive.error_message,
        },
        { status: 409 }
      );
    }

    // 4. Generate signed URL
    const { data, error: signedUrlError } =
      await supabaseAdmin.storage
        .from(ARCHIVE_BUCKET)
        .createSignedUrl(
          archive.storage_path,
          60,
          {
            download: DOWNLOAD_FILE_NAME,
          }
        );

    if (signedUrlError || !data?.signedUrl) {
      console.error("Signed URL error:", signedUrlError);

      return NextResponse.json(
        { error: "Unable to generate archive download link." },
        { status: 500 }
      );
    }

    // 5. Redirect browser to ZIP download
    return NextResponse.redirect(data.signedUrl, 302);

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

    console.error("Download all bills error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to download expense archive.",
      },
      { status: 500 }
    );
  }
}
