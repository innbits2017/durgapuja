
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expense-bills";
const DOWNLOAD_BATCH_SIZE = 8;

// -----------------------------------------------------
// HELPERS
// -----------------------------------------------------

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

// -----------------------------------------------------
// GET: INDIVIDUAL BILL DOWNLOAD
// -----------------------------------------------------

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

    // New attachment system.
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

    // Legacy attachment system.
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
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to download the bill.",
      },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------
// POST: BULK ZIP DOWNLOAD
// No 100-expense restriction.
// Accepts native HTML form submissions.
// -----------------------------------------------------

export async function POST(request: Request) {
  try {
    // Read form submission.
    const formData = await request.formData();

    const rawIds = formData
      .getAll("expenseIds")
      .filter((id): id is string => typeof id === "string");

    // Validate UUIDs and remove duplicates.
    const expenseIds = [
      ...new Set(
        rawIds.filter((id) =>
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

    // Fetch selected expenses.
    const { data: expenses, error: expensesError } =
      await supabaseAdmin
        .from("expenses")
        .select("id, title, bill_path")
        .in("id", expenseIds);

    if (expensesError) {
      throw expensesError;
    }

    if (!expenses?.length) {
      return NextResponse.json(
        { error: "No matching expenses were found." },
        { status: 404 }
      );
    }

    // Fetch all attached documents.
    const { data: documents, error: documentsError } =
      await supabaseAdmin
        .from("expense_documents")
        .select("id, expense_id, file_name, file_path")
        .in("expense_id", expenseIds)
        .order("created_at", { ascending: true });

    if (documentsError) {
      throw documentsError;
    }

    // Group documents by expense.
    const documentsByExpense = new Map<
      string,
      NonNullable<typeof documents>
    >();

    for (const document of documents || []) {
      const current =
        documentsByExpense.get(document.expense_id) || [];

      current.push(document);
      documentsByExpense.set(document.expense_id, current);
    }

    // Prepare a list of bills to download.
    const billTasks: {
      folderName: string;
      fileName: string;
      filePath: string;
    }[] = [];

    for (const expense of expenses) {
      const folderName = `${safeFileName(
        expense.title || "Expense"
      )}-${expense.id.slice(0, 8)}`;

      const attached =
        documentsByExpense.get(expense.id) || [];

      if (attached.length > 0) {
        for (const document of attached) {
          billTasks.push({
            folderName,
            fileName: safeFileName(document.file_name),
            filePath: document.file_path,
          });
        }
      } else if (expense.bill_path) {
        billTasks.push({
          folderName,
          fileName: safeFileName(
            expense.bill_path.split("/").pop() || "Bill-Receipt"
          ),
          filePath: expense.bill_path,
        });
      }
    }

    if (!billTasks.length) {
      return NextResponse.json(
        { error: "No bills were found for the selected expenses." },
        { status: 404 }
      );
    }

    // Create ZIP.
    const zip = new JSZip();

    let downloadedCount = 0;

    // Download files in small parallel batches.
    for (
      let i = 0;
      i < billTasks.length;
      i += DOWNLOAD_BATCH_SIZE
    ) {
      const batch = billTasks.slice(
        i,
        i + DOWNLOAD_BATCH_SIZE
      );

      const results = await Promise.all(
        batch.map(async (task) => {
          const file = await downloadStoredFile(task.filePath);

          return {
            ...task,
            data: await file.arrayBuffer(),
          };
        })
      );

      for (const result of results) {
        const folder = zip.folder(result.folderName);

        if (!folder) {
          throw new Error(
            `Unable to create ZIP folder: ${result.folderName}`
          );
        }

        folder.file(result.fileName, result.data);

        downloadedCount++;
      }
    }

    if (!downloadedCount) {
      return NextResponse.json(
        { error: "No bills could be added to the ZIP." },
        { status: 404 }
      );
    }

    // Generate ZIP archive.
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 3,
      },
    });

    // Return ZIP to browser.
    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(zipBuffer.length),
        "Content-Disposition":
          'attachment; filename="BUH-Expense-Bills.zip"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Bulk financial bill download error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to prepare the expense bills ZIP file.",
      },
      { status: 500 }
    );
  }
}
