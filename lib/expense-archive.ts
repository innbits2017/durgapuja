
import JSZip from "jszip";
import { supabaseAdmin } from "@/lib/supabase";

const BILL_BUCKET = "expense-bills";
const ARCHIVE_BUCKET = "expense-archives";
const ARCHIVE_KEY = "all-expense-bills";
const ARCHIVE_PATH = "archives/all-expense-bills.zip";

function safeName(value: string) {
  return (
    value
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100) || "expense"
  );
}

function fileNameFromPath(path: string) {
  return path.split("/").pop() || "bill";
}

async function updateArchive(values: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from("expense_archives")
    .upsert(
      {
        archive_key: ARCHIVE_KEY,
        ...values,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "archive_key" }
    );

  if (error) throw error;
}

export async function generateExpenseArchive() {
  let billCount = 0;

  try {
    console.log("[Archive] Starting generation");

    await updateArchive({
      status: "generating",
      bill_count: 0,
      error_message: null,
    });

    // STEP 1: Fetch expenses
    console.log("[Archive] Fetching expenses");

    const { data: expenses, error: expensesError } =
      await supabaseAdmin
        .from("expenses")
        .select("id, title, bill_path")
        .order("created_at", { ascending: true });

    if (expensesError) throw expensesError;

    const rows = expenses ?? [];
    const ids = rows.map((row) => row.id);

    console.log(`[Archive] Found ${rows.length} expenses`);

    // STEP 2: Fetch documents
    let documents: any[] = [];

    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);

      console.log(
        `[Archive] Fetching documents batch ${Math.floor(i / 500) + 1}`
      );

      const { data, error } = await supabaseAdmin
        .from("expense_documents")
        .select("id, expense_id, file_name, file_path, file_type")
        .in("expense_id", batch)
        .order("created_at", { ascending: true });

      if (error) throw error;

      documents.push(...(data ?? []));
    }

    console.log(`[Archive] Found ${documents.length} document records`);

    const byExpense = new Map<string, any[]>();

    for (const doc of documents) {
      const current = byExpense.get(doc.expense_id) ?? [];
      current.push(doc);
      byExpense.set(doc.expense_id, current);
    }

    const zip = new JSZip();

    // STEP 3: Download bills
    for (const expense of rows) {
      const folder = `${safeName(
        expense.title || "expense"
      )}-${expense.id}`;

      const docs = byExpense.get(expense.id) ?? [];

      const files = docs.length
        ? docs.map((doc) => ({
            path: doc.file_path as string,
            name:
              (doc.file_name as string) ||
              fileNameFromPath(doc.file_path),
          }))
        : expense.bill_path
          ? [
              {
                path: expense.bill_path as string,
                name: fileNameFromPath(expense.bill_path),
              },
            ]
          : [];

      const usedNames = new Set<string>();

      for (const item of files) {
        console.log(
          `[Archive] Downloading bill ${billCount + 1}: ${item.path}`
        );

        const { data: file, error } =
          await supabaseAdmin.storage
            .from(BILL_BUCKET)
            .download(item.path);

        if (error || !file) {
          throw new Error(
            `Could not read bill "${item.path}": ${
              error?.message || "File unavailable"
            }`
          );
        }

        const rawName = safeName(item.name || "bill");

        let finalName = rawName;
        let suffix = 1;

        while (usedNames.has(finalName)) {
          const dot = rawName.lastIndexOf(".");

          finalName =
            dot > 0
              ? `${rawName.slice(0, dot)}-${suffix}${rawName.slice(dot)}`
              : `${rawName}-${suffix}`;

          suffix++;
        }

        usedNames.add(finalName);

        zip.folder(folder)!.file(
          finalName,
          Buffer.from(await file.arrayBuffer())
        );

        billCount++;

        // Update progress after every 5 bills.
        if (billCount % 5 === 0) {
          await updateArchive({
            status: "generating",
            bill_count: billCount,
          });

          console.log(`[Archive] Progress: ${billCount} bills`);
        }
      }
    }

    console.log(`[Archive] Downloaded ${billCount} bills`);

    if (billCount === 0) {
      throw new Error("No expense bills were found.");
    }

    // STEP 4: Generate ZIP
    console.log("[Archive] Generating ZIP");

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 5,
      },
    });

    console.log(
      `[Archive] ZIP generated. Size: ${zipBuffer.length} bytes`
    );

    // STEP 5: Upload ZIP
    console.log("[Archive] Uploading ZIP to Supabase");

    const { error: uploadError } =
      await supabaseAdmin.storage
        .from(ARCHIVE_BUCKET)
        .upload(ARCHIVE_PATH, zipBuffer, {
          contentType: "application/zip",
          upsert: true,
        });

    if (uploadError) throw uploadError;

    console.log("[Archive] ZIP uploaded successfully");

    // STEP 6: Mark archive ready
    await updateArchive({
      status: "ready",
      storage_path: ARCHIVE_PATH,
      bill_count: billCount,
      generated_at: new Date().toISOString(),
      error_message: null,
    });

    console.log("[Archive] Generation completed successfully");

    return {
      success: true,
      billCount,
    };
  } catch (error) {
    console.error("[Archive] Generation failed:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown archive error";

    try {
      await updateArchive({
        status: "failed",
        bill_count: billCount,
        error_message: errorMessage,
      });
    } catch (updateError) {
      console.error(
        "[Archive] Could not update failure status:",
        updateError
      );
    }

    throw error;
  }
}
