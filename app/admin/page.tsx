import { redirect } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

import DashboardClient from "./DashboardClient";

export default async function DurgaPujaDashboardPage() {
  /*
   * ---------------------------------------------------------
   * ADMIN AUTHENTICATION
   * ---------------------------------------------------------
   *
   * This is an additional server-side protection layer.
   * Even if someone directly opens:
   *
   * /admin/durga-puja
   *
   * they must have a valid Supabase session.
   */

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  /*
   * ---------------------------------------------------------
   * FETCH RESIDENT CONTRIBUTIONS
   * ---------------------------------------------------------
   */

  const {
    data: contributions,
    error: contributionsError,
  } = await supabaseAdmin
    .from("contributions")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (contributionsError) {
    console.error(
      "Unable to fetch contributions:",
      contributionsError
    );
  }

  /*
   * ---------------------------------------------------------
   * FETCH EXTERNAL DONATIONS / SPONSORSHIPS
   * ---------------------------------------------------------
   */

  const {
    data: donations,
    error: donationsError,
  } = await supabaseAdmin
    .from("donations")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (donationsError) {
    console.error(
      "Unable to fetch donations:",
      donationsError
    );
  }

  /*
   * ---------------------------------------------------------
   * PASS DATA TO DASHBOARD
   * ---------------------------------------------------------
   */

  return (
    <DashboardClient
      initialContributions={contributions ?? []}
      initialDonations={donations ?? []}
    />
  );
}