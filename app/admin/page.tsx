import { redirect } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

import DashboardClient from "./DashboardClient";

export default async function DurgaPujaDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [
    contributionsResult,
    donationsResult,
    expensesResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("contributions")
      .select("*")
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (contributionsResult.error) {
    console.error(
      "Unable to fetch contributions:",
      contributionsResult.error
    );
  }

  if (donationsResult.error) {
    console.error(
      "Unable to fetch donations:",
      donationsResult.error
    );
  }

  if (expensesResult.error) {
    console.error(
      "Unable to fetch expenses:",
      expensesResult.error
    );
  }

  return (
    <DashboardClient
      initialContributions={contributionsResult.data ?? []}
      initialDonations={donationsResult.data ?? []}
      initialExpenses={expensesResult.data ?? []}
    />
  );
}