import { supabaseAdmin } from "@/lib/supabase";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DurgaPujaDashboard() {
  const [
    { data: contributions, error: contributionsError },
    { data: donations, error: donationsError },
    { data: expenses, error: expensesError },
    { data: lastYearPaid, error: lastYearPaidError },
    { data: culturalPrograms, error: culturalProgramsError },
    { data: sevaRegistrations, error: sevaRegistrationsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("contributions")
      .select(
        "id, name, block, flat_no, resident_type, mobile, amount, collection_status, payment_method, utr, paid_to, status, created_at, verified_at, receipt_token"
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("donations")
      .select(
        "id, donor_name, organisation_name, donor_type, mobile, email, location, amount, utr, donation_type, status, created_at, verified_at"
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("expenses")
      .select(
        "id, title, category, paid_to, amount, expense_date, payment_mode, reference_no, notes, created_at, updated_at"
      )
      .order("expense_date", { ascending: false }),
    supabaseAdmin
      .from("last_year_paid")
      .select("block, flat_no, resident_type, amount")
      .order("block", { ascending: true })
      .order("flat_no", { ascending: true }),
    supabaseAdmin
      .from("cultural_program_registrations")
      .select(
        "id, registration_no, participant_name, age, block, flat_no, participant_type, mobile, email, performance_type, group_name, category, performance_title, description, duration, status, created_at, updated_at"
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("seva_registrations")
      .select(
        "id, seva_no, name, block, flat_no, mobile, materials, volunteer_roles, volunteer_role_names, volunteer_note, status, admin_note, created_at, updated_at"
      )
      .order("created_at", { ascending: false }),
  ]);

  const error =
    contributionsError ||
    donationsError ||
    expensesError ||
    lastYearPaidError ||
    culturalProgramsError ||
    sevaRegistrationsError;

  if (error) {
    console.error("Dashboard data fetch error:", error);

    return (
      <main className="min-h-screen bg-[#f8f1e7] p-5">
        <div className="mx-auto max-w-7xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <i className="fa-solid fa-circle-exclamation mb-3 text-3xl text-[#a70e18]" />
          <h1 className="text-xl font-semibold text-[#292929]">
            Unable to load dashboard
          </h1>
          <p className="mt-2 text-sm text-[#737373]">
            Please check your Supabase configuration and database tables.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
      />
      <DashboardClient
        initialContributions={contributions ?? []}
        initialDonations={donations ?? []}
        initialExpenses={expenses ?? []}
        initialLastYearPaid={(lastYearPaid ?? []).map((item) => ({
          block: item.block,
          flat_no: String(item.flat_no).padStart(3, "0"),
          resident_type: item.resident_type ?? null,
          amount: Number(item.amount),
        }))}
        initialCulturalPrograms={(culturalPrograms ?? []).map((item) => ({
          id: item.id,
          registration_no: item.registration_no,
          participant_name: item.participant_name,
          age: Number(item.age),
          block: item.block,
          flat_no: String(item.flat_no),
          participant_type: item.participant_type,
          mobile: item.mobile,
          email: item.email ?? null,
          performance_type: item.performance_type,
          group_name: item.group_name ?? null,
          category: item.category,
          performance_title: item.performance_title,
          description: item.description ?? null,
          duration: item.duration,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at ?? null,
        }))}
        initialSevaRegistrations={(sevaRegistrations ?? []).map((item) => ({
          id: item.id,
          seva_no: item.seva_no,
          name: item.name,
          block: item.block,
          flat_no: String(item.flat_no),
          mobile: item.mobile,
          materials: Array.isArray(item.materials) ? item.materials : [],
          volunteer_roles: Array.isArray(item.volunteer_roles) ? item.volunteer_roles : [],
          volunteer_role_names: Array.isArray(item.volunteer_role_names) ? item.volunteer_role_names : [],
          volunteer_note: item.volunteer_note ?? null,
          status: item.status,
          admin_note: item.admin_note ?? null,
          created_at: item.created_at,
          updated_at: item.updated_at ?? null,
        }))}
      />
    </>
  );
}
