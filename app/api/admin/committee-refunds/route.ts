import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireSuperAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const TABLE = "committee_refunds";
const REFUND_TYPES = ["Leftover Grocery", "Wrong Payment Refund", "Other Refund"];
const PAYMENT_MODES = ["UPI", "Cash", "Bank Transfer", "Cheque"];

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error || !user ? null : user;
}

async function requireSuperAdminResponse() {
  try {
    await requireSuperAdmin();
    return null;
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden. Only Super Admin can manage refunds." }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}

export async function GET() {
  try {
    const user = await checkAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("id, title, refund_type, amount, received_from, refund_date, payment_mode, reference_no, notes, created_at, updated_at")
      .order("refund_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ refunds: data ?? [] });
  } catch (error) {
    console.error("Committee refunds GET error:", error);
    return NextResponse.json({ error: "Unable to load committee refunds." }, { status: 500 });
  }
}

function validate(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const refund_type = String(body.refund_type ?? "");
  const amount = Number(body.amount);
  const received_from = String(body.received_from ?? "").trim();
  const refund_date = String(body.refund_date ?? "");
  const payment_mode = String(body.payment_mode ?? "UPI");
  const reference_no = body.reference_no ? String(body.reference_no).trim() : null;
  const notes = body.notes ? String(body.notes).trim() : null;

  if (!title) return { error: "Refund title is required." };
  if (!REFUND_TYPES.includes(refund_type)) return { error: "Invalid refund category." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid refund amount." };
  if (!received_from) return { error: "Received-from name is required." };
  // HTML date inputs submit dates as YYYY-MM-DD. Validate both the format
  // and the actual calendar date (e.g. reject 2026-02-31).
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(refund_date);
  const validDate = dateMatch
    ? (() => {
        const year = Number(dateMatch[1]);
        const month = Number(dateMatch[2]);
        const day = Number(dateMatch[3]);
        const parsed = new Date(Date.UTC(year, month - 1, day));
        return parsed.getUTCFullYear() === year &&
          parsed.getUTCMonth() === month - 1 &&
          parsed.getUTCDate() === day;
      })()
    : false;
  if (!validDate) return { error: "Please select a valid date received." };
  if (!PAYMENT_MODES.includes(payment_mode)) return { error: "Invalid payment mode." };

  return { value: { title, refund_type, amount, received_from, refund_date, payment_mode, reference_no, notes } };
}

export async function POST(request: Request) {
  const authError = await requireSuperAdminResponse();
  if (authError) return authError;

  try {
    const body = await request.json();
    const validated = validate(body);
    if (validated.error || !validated.value) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert(validated.value)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ refund: data }, { status: 201 });
  } catch (error) {
    console.error("Committee refunds POST error:", error);
    return NextResponse.json({ error: "Unable to save refund." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authError = await requireSuperAdminResponse();
  if (authError) return authError;

  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "Refund ID is required." }, { status: 400 });

    const validated = validate(body);
    if (validated.error || !validated.value) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ ...validated.value, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ refund: data });
  } catch (error) {
    console.error("Committee refunds PATCH error:", error);
    return NextResponse.json({ error: "Unable to update refund." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = await requireSuperAdminResponse();
  if (authError) return authError;

  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ error: "Refund ID is required." }, { status: 400 });

    const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Committee refunds DELETE error:", error);
    return NextResponse.json({ error: "Unable to delete refund." }, { status: 500 });
  }
}
