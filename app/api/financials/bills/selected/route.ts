
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expense-bills";

function safeFileName(value: string) {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 150);
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Read selected expense IDs
    const formData = await request.formData();

    const expenseIds = [
      ...new Set(
        formData
          .getAll("expenseIds")
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
      ),
    ];

    if (!expenseIds.length) {
      return NextResponse.json(
        { error: "Please select at least one expense." },
        { status: 400 }
      );
    }

    if (expenseIds.length > 200) {
      return NextResponse.json(
        { error: "You can select a maximum of 200 expenses at once." },
        { status: 400 }
      );
    }

    // 3. Fetch selected expenses
    const { data: expenses, error: expenseError } =
      await supabaseAdmin
        .from("expenses")
        .select("id, title, bill_path")
        .in("id", expenseIds);

    if (expenseError) {
      throw expenseError;
    }

    if (!expenses?.length) {
      return NextResponse.json(
        { error: "No matching expenses found." },
        { status: 404 }
      );
    }

    const foundIds = new Set(expenses.map((expense) => expense.id));

    if (foundIds.size !== expenseIds.length) {
      return NextResponse.json(
        { error: "One or more selected expenses could not be found." },
        { status: 400 }
      );
    }

    // 4. Fetch attached bill documents
    const { data: documents, error: documentError } =
      await supabaseAdmin
        .from("expense_documents")
        .select("id, expense_id, file_name, file_path")
        .in("expense_id", expenseIds);

    if (documentError) {
      throw documentError;
    }

    // 5. Prepare ZIP
    const zip = new JSZip();
    const usedNames = new Set<string>();

    let addedCount = 0;

    function uniqueName(name: string) {
      const safeName = safeFileName(name || "bill");

      if (!usedNames.has(safeName)) {
        usedNames.add(safeName);
        return safeName;
      }

      const dotIndex = safeName.lastIndexOf(".");
      const base = dotIndex > 0
        ? safeName.slice(0, dotIndex)
        : safeName;
      const extension = dotIndex > 0
        ? safeName.slice(dotIndex)
        : "";

      let counter = 2;
      let candidate = `${base}_${counter}${extension}`;

      while (usedNames.has(candidate)) {
        counter++;
        candidate = `${base}_${counter}${extension}`;
      }

      usedNames.add(candidate);
      return candidate;
    }

    async function addBill(path: string, fileName: string) {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .download(path);

      if (error || !data) {
        throw new Error(
          `Unable to download bill: ${fileName}`
        );
      }

      zip.file(uniqueName(fileName), await data.arrayBuffer());
      addedCount++;
    }

    // 6. Add all document records
    for (const document of documents || []) {
      await addBill(
        document.file_path,
        document.file_name || `bill-${document.id}`
      );
    }

    // 7. Add legacy bills not already represented in expense_documents
    for (const expense of expenses) {
      if (!expense.bill_path) continue;

      const alreadyAdded = (documents || []).some(
        (document) =>
          document.expense_id === expense.id &&
          document.file_path === expense.bill_path
      );

      if (alreadyAdded) continue;

      const fallbackName = `${expense.title || "expense"}-${expense.id}-bill`;

      await addBill(
        expense.bill_path,
        fallbackName
      );
    }

    if (!addedCount) {
      return NextResponse.json(
        { error: "No bills were found for the selected expenses." },
        { status: 404 }
      );
    }

    // 8. Generate ZIP
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 5,
      },
    });

    // 9. Return ZIP download
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="selected-expense-bills.zip"',
        "Content-Length": String(zipBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Selected bills ZIP error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate selected bills ZIP.",
      },
      { status: 500 }
    );
  }
}
