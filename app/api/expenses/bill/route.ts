import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expense-bills";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DOCUMENTS_PER_EXPENSE = 10;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

function safeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "bill";
}

async function getExpenseDocuments(expenseId: string) {
  const { data, error } = await supabaseAdmin
    .from("expense_documents")
    .select("id, expense_id, file_name, file_path, file_type, file_size, created_at")
    .eq("expense_id", expenseId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function POST(request: Request) {
  try {
    const user = await checkAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const formData = await request.formData();
    const expenseId = String(formData.get("expenseId") || "").trim();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);

    // Backward compatibility with the previous single-file field.
    const legacyFile = formData.get("file");
    if (!files.length && legacyFile instanceof File) files.push(legacyFile);

    if (!expenseId) return NextResponse.json({ error: "Expense ID is required." }, { status: 400 });
    if (!files.length) return NextResponse.json({ error: "Please select at least one bill file." }, { status: 400 });

    const { data: expense, error: expenseError } = await supabaseAdmin
      .from("expenses")
      .select("id, bill_path")
      .eq("id", expenseId)
      .single();

    if (expenseError || !expense) return NextResponse.json({ error: "Expense not found." }, { status: 404 });

    const existingDocuments = await getExpenseDocuments(expenseId);
    if (existingDocuments.length + files.length > MAX_DOCUMENTS_PER_EXPENSE) {
      return NextResponse.json(
        { error: `An expense can have a maximum of ${MAX_DOCUMENTS_PER_EXPENSE} bills.` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json({ error: `Unsupported bill format: ${file.name}` }, { status: 400 });
      }
      if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `Bill file must be 10 MB or smaller: ${file.name}` }, { status: 400 });
      }
    }

    const uploadedPaths: string[] = [];
    const insertedDocuments: any[] = [];

    try {
      for (const file of files) {
        const extension = safeFileName(file.name).split(".").pop()?.toLowerCase() || "bin";
        const path = `expenses/${expenseId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(path, buffer, { contentType: file.type, upsert: false });

        if (uploadError) throw uploadError;
        uploadedPaths.push(path);

        const { data: document, error: documentError } = await supabaseAdmin
          .from("expense_documents")
          .insert({
            expense_id: expenseId,
            file_name: safeFileName(file.name),
            file_path: path,
            file_type: file.type,
            file_size: file.size,
          })
          .select("id, expense_id, file_name, file_path, file_type, file_size, created_at")
          .single();

        if (documentError || !document) throw documentError || new Error("Unable to save bill record.");
        insertedDocuments.push(document);
      }

      // Keep legacy bill_path populated for compatibility with older data/code.
      if (!expense.bill_path && insertedDocuments[0]?.file_path) {
        await supabaseAdmin
          .from("expenses")
          .update({ bill_path: insertedDocuments[0].file_path, updated_at: new Date().toISOString() })
          .eq("id", expenseId);
      }
    } catch (error) {
      if (uploadedPaths.length) await supabaseAdmin.storage.from(BUCKET).remove(uploadedPaths);
      // Remove any document rows created in this failed batch.
      if (insertedDocuments.length) {
        await supabaseAdmin.from("expense_documents").delete().in("id", insertedDocuments.map((doc) => doc.id));
      }
      console.error("Expense bills upload error:", error);
      return NextResponse.json({ error: "Unable to upload all selected bills." }, { status: 500 });
    }

    const { data: updatedExpense, error: updatedExpenseError } = await supabaseAdmin
      .from("expenses")
      .select("id, title, category, paid_to, paid_by, amount, expense_date, payment_mode, reference_no, notes, refund_id, bill_path, created_at, updated_at")
      .eq("id", expenseId)
      .single();

    if (updatedExpenseError || !updatedExpense) {
      return NextResponse.json({ error: "Bills uploaded, but the expense could not be refreshed." }, { status: 500 });
    }

    const documents = await getExpenseDocuments(expenseId);

    return NextResponse.json({
      success: true,
      expense: { ...updatedExpense, documents },
    });
  } catch (error) {
    console.error("Expense bills upload API error:", error);
    return NextResponse.json({ error: "Something went wrong while uploading the bills." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await checkAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get("id")?.trim();
    const documentId = searchParams.get("documentId")?.trim();

    if (!expenseId) return NextResponse.json({ error: "Expense ID is required." }, { status: 400 });

    if (documentId) {
      const { data: document, error } = await supabaseAdmin
        .from("expense_documents")
        .select("id, expense_id, file_name, file_path, file_type")
        .eq("id", documentId)
        .eq("expense_id", expenseId)
        .single();

      if (error || !document) return NextResponse.json({ error: "Bill not found." }, { status: 404 });

      const { data: file, error: downloadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .download(document.file_path);

      if (downloadError || !file) return NextResponse.json({ error: "Unable to download the bill." }, { status: 500 });

      return new Response(file, {
        status: 200,
        headers: {
          "Content-Type": document.file_type || file.type || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${safeFileName(document.file_name)}"`,
          "Cache-Control": "private, no-store",
        },
      });
    }

    // Legacy fallback for bills uploaded before multiple-document support.
    const { data: expense, error } = await supabaseAdmin
      .from("expenses")
      .select("id, title, bill_path")
      .eq("id", expenseId)
      .single();

    if (error || !expense?.bill_path) return NextResponse.json({ error: "No bill is attached to this expense." }, { status: 404 });

    const { data: file, error: downloadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(expense.bill_path);

    if (downloadError || !file) return NextResponse.json({ error: "Unable to download the bill." }, { status: 500 });

    const originalName = safeFileName(expense.bill_path.split("/").pop() || "bill");
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${originalName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Expense bill download API error:", error);
    return NextResponse.json({ error: "Something went wrong while downloading the bill." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await checkAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const body = await request.json();
    const expenseId = String(body.expenseId || "").trim();
    const documentId = String(body.documentId || "").trim();

    if (!expenseId || !documentId) {
      return NextResponse.json({ error: "Expense ID and document ID are required." }, { status: 400 });
    }

    const { data: document, error } = await supabaseAdmin
      .from("expense_documents")
      .select("id, expense_id, file_path")
      .eq("id", documentId)
      .eq("expense_id", expenseId)
      .single();

    if (error || !document) return NextResponse.json({ error: "Bill not found." }, { status: 404 });

    const { error: deleteRowError } = await supabaseAdmin
      .from("expense_documents")
      .delete()
      .eq("id", documentId)
      .eq("expense_id", expenseId);

    if (deleteRowError) return NextResponse.json({ error: deleteRowError.message }, { status: 500 });

    const { data: remaining } = await supabaseAdmin
      .from("expense_documents")
      .select("id, file_path")
      .eq("expense_id", expenseId)
      .order("created_at", { ascending: true });

    await supabaseAdmin.storage.from(BUCKET).remove([document.file_path]);

    // Keep legacy bill_path aligned with the first remaining document, or clear it.
    await supabaseAdmin
      .from("expenses")
      .update({
        bill_path: remaining?.[0]?.file_path || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Expense bill delete API error:", error);
    return NextResponse.json({ error: "Something went wrong while removing the bill." }, { status: 500 });
  }
}
