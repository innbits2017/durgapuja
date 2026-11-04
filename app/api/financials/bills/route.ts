import { NextResponse } from "next/server";
import JSZip from "jszip";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expense-bills";
const MAX_EXPENSES_PER_ZIP = 100;

function safeFileName(name: string) {
  return (
    name
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120) || "bill"
  );
}

async function downloadStoredFile(path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(path);

  if (error || !data) {
    throw new Error(`Unable to retrieve bill: ${path}`);
  }

  return data;
}

// Individual bill download
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const expenseId = searchParams.get("expenseId")?.trim();
    const documentId = searchParams.get("documentId")?.trim();

    if (!expenseId) {
      return NextResponse.json(
        { error: "Expense ID is required." },
        { status: 400 }
      );
    }

    // Download from expense_documents table
    if (documentId) {
      const { data: document, error } = await supabaseAdmin
        .from("expense_documents")
        .select("id, expense_id, file_name, file_path, file_type")
        .eq("id", documentId)
        .eq("expense_id", expenseId)
        .single();

      if (error || !document) {
        return NextResponse.json(
          { error: "Bill not found." },
          { status: 404 }
        );
      }

      const file = await downloadStoredFile(document.file_path);
      const fileName = safeFileName(document.file_name);

      return new Response(file, {
        status: 200,
        headers: {
          "Content-Type":
            document.file_type ||
            file.type ||
            "application/octet-stream",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Compatibility with older expenses using expenses.bill_path
    const { data: expense, error } = await supabaseAdmin
      .from("expenses")
      .select("id, bill_path")
      .eq("id", expenseId)
      .single();

    if (error || !expense?.bill_path) {
      return NextResponse.json(
        { error: "No bill is attached to this expense." },
        { status: 404 }
      );
    }

    const file = await downloadStoredFile(expense.bill_path);

    const fileName = safeFileName(
      expense.bill_path.split("/").pop() || "bill"
    );

    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Financial bill download error:", error);

    return NextResponse.json(
      { error: "Unable to download the bill." },
      { status: 500 }
    );
  }
}

// Bulk ZIP download for selected expense IDs
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rawIds: unknown[] = Array.isArray(body.expenseIds)
      ? body.expenseIds
      : [];

    // Validate and remove duplicate UUIDs
    const expenseIds = [
      ...new Set(
        rawIds.filter(
          (id): id is string =>
            typeof id === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              id
            )
        )
      ),
    ];

    if (!expenseIds.length) {
      return NextResponse.json(
        { error: "Select at least one expense." },
        { status: 400 }
      );
    }

    if (expenseIds.length > MAX_EXPENSES_PER_ZIP) {
      return NextResponse.json(
        {
          error: `Select no more than ${MAX_EXPENSES_PER_ZIP} expenses at a time.`,
        },
        { status: 400 }
      );
    }

    // Fetch expenses
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from("expenses")
      .select("id, title, bill_path")
      .in("id", expenseIds);

    if (expensesError) {
      throw expensesError;
    }

    // Fetch all attached documents
    const { data: documents, error: documentsError } = await supabaseAdmin
      .from("expense_documents")
      .select("id, expense_id, file_name, file_path")
      .in("expense_id", expenseIds)
      .order("created_at", { ascending: true });

    if (documentsError) {
      throw documentsError;
    }

    const zip = new JSZip();
    let fileCount = 0;

    // Add bills to ZIP
    for (const expense of expenses || []) {
      const folderName = `${safeFileName(
        expense.title || "Expense"
      )}-${expense.id.slice(0, 8)}`;

      const folder = zip.folder(folderName);

      if (!folder) continue;

      const attached = (documents || []).filter(
        (doc) => doc.expense_id === expense.id
      );

      // New attachment system
      if (attached.length > 0) {
        for (const document of attached) {
          const file = await downloadStoredFile(document.file_path);

          folder.file(
            safeFileName(document.file_name),
            await file.arrayBuffer()
          );

          fileCount++;
        }
      }
      // Legacy attachment system
      else if (expense.bill_path) {
        const file = await downloadStoredFile(expense.bill_path);

        folder.file(
          safeFileName(
            expense.bill_path.split("/").pop() || "Bill-Receipt"
          ),
          await file.arrayBuffer()
        );

        fileCount++;
      }
    }

    if (!fileCount) {
      return NextResponse.json(
        { error: "No bills were found for the selected expenses." },
        { status: 404 }
      );
    }

    // Generate ZIP
    const zipBytes = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: {
        level: 5,
      },
    });

    // Convert Uint8Array into ArrayBuffer for Response compatibility
    const zipArrayBuffer = new ArrayBuffer(zipBytes.byteLength);

    new Uint8Array(zipArrayBuffer).set(zipBytes);

    return new Response(zipArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="BUH-Expense-Bills.zip"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Bulk financial bill download error:", error);

    return NextResponse.json(
      { error: "Unable to prepare the expense bills ZIP file." },
      { status: 500 }
    );
  }
}