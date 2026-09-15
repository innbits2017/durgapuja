import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Contribution = {
  id: string;
  name: string;
  block: string | null;
  flat_no: string | null;
  amount: number | string | null;
  status: string;
  created_at: string;
  verified_at: string | null;
};

type Donation = {
  id: string;
  donor_name: string;
  organisation_name: string | null;
  donor_type: string | null;
  amount: number | string | null;
  status: string;
  created_at: string;
  verified_at: string | null;
};

type Expense = {
  id: string;
  title: string;
  category: string | null;
  paid_to: string | null;
  amount: number | string | null;
  expense_date: string | null;
};

type Seva = {
  id: string;
  seva_no: string;
  name: string;
  block: string | null;
  flat_no: string | null;
  materials: unknown;
  volunteer_role_names: string[] | null;
  amount: number | string | null;
  status: string;
  created_at: string;
};

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sevaDetails(seva: Seva) {
  const parts: string[] = [];

  if (Array.isArray(seva.materials)) {
    for (const raw of seva.materials) {
      if (!raw || typeof raw !== "object") continue;

      const item = raw as Record<string, unknown>;
      const title = String(item.title || item.type || "").trim();
      const pkg = String(item.package || "").trim();
      const day = String(item.day || "").trim();

      if (title) {
        parts.push(
          [title, pkg, day].filter(Boolean).join(" • ")
        );
      }
    }
  }

  if (Array.isArray(seva.volunteer_role_names)) {
    for (const role of seva.volunteer_role_names) {
      const value = String(role || "").trim();
      if (value) parts.push(value);
    }
  }

  return parts.length ? parts.join(" • ") : "Seva";
}

export default async function PublicFinancialsPage() {
  const [
    { data: contributions, error: contributionsError },
    { data: donations, error: donationsError },
    { data: expenses, error: expensesError },
    { data: sevaRegistrations, error: sevaError },
  ] = await Promise.all([
    supabaseAdmin
      .from("contributions")
      .select(
        "id, name, block, flat_no, amount, status, created_at, verified_at"
      )
      .eq("status", "verified")
      .order("verified_at", { ascending: false }),

    supabaseAdmin
      .from("donations")
      .select(
        "id, donor_name, organisation_name, donor_type, amount, status, created_at, verified_at"
      )
      .eq("status", "verified")
      .order("verified_at", { ascending: false }),

    supabaseAdmin
      .from("expenses")
      .select(
        "id, title, category, paid_to, amount, expense_date"
      )
      .order("expense_date", { ascending: false }),

    supabaseAdmin
      .from("seva_registrations")
      .select(
        "id, seva_no, name, block, flat_no, materials, volunteer_role_names, amount, status, created_at"
      )
      .eq("status", "confirmed")
      .order("created_at", { ascending: false }),
  ]);

  const error =
    contributionsError ||
    donationsError ||
    expensesError ||
    sevaError;

  if (error) {
    console.error("Public financial page error:", error);

    return (
      <main className="min-h-screen bg-[#f8f1e7] px-5 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#ead9c7] bg-white p-8 text-center shadow-sm">
          <i className="fa-solid fa-circle-exclamation text-3xl text-[#a70e18]" />
          <h1 className="mt-4 text-2xl font-bold text-[#761019]">
            Unable to load financial information
          </h1>
          <p className="mt-2 text-sm text-[#766457]">
            Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const memberContributions = (contributions ?? []) as Contribution[];
  const externalContributions = (donations ?? []) as Donation[];
  const expenseList = (expenses ?? []) as Expense[];
  const sevaList = (sevaRegistrations ?? []) as Seva[];

  const memberTotal = memberContributions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const externalTotal = externalContributions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalCollection = memberTotal + externalTotal;

  const totalExpenses = expenseList.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const moneyLeft = totalCollection - totalExpenses;

  const spentPercent =
    totalCollection > 0
      ? Math.min(100, Math.round((totalExpenses / totalCollection) * 100))
      : 0;

  const balancePercent =
    totalCollection > 0
      ? Math.max(0, Math.round((Math.max(moneyLeft, 0) / totalCollection) * 100))
      : 0;

  const memberPercent =
    totalCollection > 0
      ? Math.round((memberTotal / totalCollection) * 100)
      : 0;

  const externalPercent =
    totalCollection > 0
      ? Math.round((externalTotal / totalCollection) * 100)
      : 0;

  const collectionSourceGradient =
    totalCollection > 0
      ? `conic-gradient(#a70e18 0 ${memberPercent}%, #d09a32 ${memberPercent}% 100%)`
      : "#ead9c7";

  const allocationGradient =
    totalCollection > 0
      ? `conic-gradient(#a70e18 0 ${spentPercent}%, #d09a32 ${spentPercent}% 100%)`
      : "#ead9c7";

  const expenseByCategory = expenseList.reduce<Record<string, number>>(
    (acc, item) => {
      const category = item.category?.trim() || "Other";
      acc[category] = (acc[category] || 0) + Number(item.amount || 0);
      return acc;
    },
    {}
  );

  const expenseCategories = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      // Repeating a restrained palette keeps the dashboard aligned with the Puja theme.
      className:
        [
          "bg-[#a70e18]",
          "bg-[#d09a32]",
          "bg-[#761019]",
          "bg-[#b96d3b]",
          "bg-[#8d5a4b]",
          "bg-[#c9a76a]",
        ][index % 6],
    }));

  const expenseChartTotal = expenseCategories.reduce(
    (sum, item) => sum + item.value,
    0
  );

  let expenseCursor = 0;
  const expenseStops = expenseCategories.map((item) => {
    const start = expenseChartTotal
      ? (expenseCursor / expenseChartTotal) * 100
      : 0;
    expenseCursor += item.value;
    const end = expenseChartTotal
      ? (expenseCursor / expenseChartTotal) * 100
      : 0;

    return `${item.className.replace("bg-", "").replace("[", "").replace("]", "")} ${start}% ${end}%`;
  });

  // CSS conic-gradient cannot directly use Tailwind class names, so build the
  // category colors separately as fixed values.
  const expenseColors = [
    "#a70e18",
    "#d09a32",
    "#761019",
    "#b96d3b",
    "#8d5a4b",
    "#c9a76a",
  ];

  let expenseOffset = 0;
  const expenseGradientParts = expenseCategories.map((item, index) => {
    const start = expenseChartTotal
      ? (expenseOffset / expenseChartTotal) * 100
      : 0;
    expenseOffset += item.value;
    const end = expenseChartTotal
      ? (expenseOffset / expenseChartTotal) * 100
      : 0;

    return `${expenseColors[index % expenseColors.length]} ${start}% ${end}%`;
  });

  const expenseGradient =
    expenseCategories.length && expenseChartTotal > 0
      ? `conic-gradient(${expenseGradientParts.join(", ")})`
      : "#ead9c7";

  const maxExpense = Math.max(
    ...expenseList.map((item) => Number(item.amount || 0)),
    1
  );

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
      />

      <main className="min-h-screen bg-[#f8f1e7] text-[#292929]">
        {/* HERO */}
        <section className="relative overflow-hidden bg-[#761019] px-5 py-14 text-white sm:py-18">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full border border-white/10" />

          <div className="relative mx-auto max-w-7xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#e5c878] bg-white/10 text-[#f2d77f]">
              <i className="fa-solid fa-chart-pie text-xl" />
            </div>

            <p className="mt-5 text-[10px] font-bold tracking-[0.35em] text-[#f0d27d]">
              BUH DURGA PUJA 2026
            </p>

            <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
              Financial Transparency
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/75">
              A transparent, read-only view of verified contributions,
              external support, Seva and expenses.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/80">
                <i className="fa-solid fa-shield-check mr-1.5" />
                Verified Records
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/80">
                <i className="fa-solid fa-eye mr-1.5" />
                Read Only
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
          {/* KEY FIGURES */}
          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Total Collection",
                value: totalCollection,
                sub: `${memberContributions.length + externalContributions.length} verified records`,
                icon: "fa-hand-holding-heart",
              },
              {
                label: "Total Expenses",
                value: totalExpenses,
                sub: `${expenseList.length} recorded expenses`,
                icon: "fa-receipt",
              },
              {
                label: "Money Left",
                value: moneyLeft,
                sub:
                  moneyLeft >= 0
                    ? `${balancePercent}% of collection remaining`
                    : "Expenses exceed collection",
                icon: "fa-wallet",
              },
            ].map((item, index) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-5 shadow-sm ${
                  index === 2
                    ? "border-[#d9c092] bg-[#fffaf2]"
                    : "border-[#ead9c7] bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8c7868]">
                    {item.label}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4df] text-[#a77a2b]">
                    <i className={`fa-solid ${item.icon}`} />
                  </span>
                </div>

                <div className="mt-4 text-3xl font-bold text-[#761019]">
                  {money(item.value)}
                </div>

                <p className="mt-1 text-xs text-[#8c7868]">{item.sub}</p>
              </div>
            ))}
          </section>

          {/* SMART CHARTS */}
          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Collection Source Pie */}
            <div className="rounded-3xl border border-[#ead9c7] bg-white p-5 shadow-sm sm:p-6">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#a77a2b]">
                  COLLECTION MIX
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#761019]">
                  Where the money came from
                </h2>
              </div>

              <div className="mt-6 flex items-center gap-6">
                <div
                  className="relative h-36 w-36 shrink-0 rounded-full"
                  style={{ background: collectionSourceGradient }}
                  aria-label="Collection source pie chart"
                >
                  <div className="absolute inset-[22px] flex items-center justify-center rounded-full bg-white text-center">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[#8c7868]">
                        Total
                      </p>
                      <p className="text-sm font-bold text-[#761019]">
                        {money(totalCollection)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#a70e18]" />
                      <span className="text-xs font-semibold text-[#392823]">
                        Members
                      </span>
                    </div>
                    <p className="mt-1 pl-4 text-sm font-bold text-[#761019]">
                      {money(memberTotal)}
                    </p>
                    <p className="pl-4 text-[10px] text-[#8c7868]">
                      {memberPercent}%
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#d09a32]" />
                      <span className="text-xs font-semibold text-[#392823]">
                        External
                      </span>
                    </div>
                    <p className="mt-1 pl-4 text-sm font-bold text-[#761019]">
                      {money(externalTotal)}
                    </p>
                    <p className="pl-4 text-[10px] text-[#8c7868]">
                      {externalPercent}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Money Allocation Pie */}
            <div className="rounded-3xl border border-[#ead9c7] bg-white p-5 shadow-sm sm:p-6">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#a77a2b]">
                  MONEY ALLOCATION
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#761019]">
                  Collection vs spending
                </h2>
              </div>

              <div className="mt-6 flex items-center gap-6">
                <div
                  className="relative h-36 w-36 shrink-0 rounded-full"
                  style={{ background: allocationGradient }}
                  aria-label="Collection versus expenses pie chart"
                >
                  <div className="absolute inset-[22px] flex items-center justify-center rounded-full bg-white text-center">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[#8c7868]">
                        Left
                      </p>
                      <p className="text-sm font-bold text-[#761019]">
                        {money(Math.max(moneyLeft, 0))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#a70e18]" />
                      <span className="text-xs font-semibold text-[#392823]">
                        Spent
                      </span>
                    </div>
                    <p className="mt-1 pl-4 text-sm font-bold text-[#761019]">
                      {money(totalExpenses)}
                    </p>
                    <p className="pl-4 text-[10px] text-[#8c7868]">
                      {spentPercent}% of collection
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#d09a32]" />
                      <span className="text-xs font-semibold text-[#392823]">
                        Remaining
                      </span>
                    </div>
                    <p className="mt-1 pl-4 text-sm font-bold text-[#761019]">
                      {money(Math.max(moneyLeft, 0))}
                    </p>
                    <p className="pl-4 text-[10px] text-[#8c7868]">
                      {balancePercent}% remaining
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="rounded-3xl border border-[#ead9c7] bg-[#fffaf2] p-5 shadow-sm sm:p-6">
              <p className="text-[10px] font-bold tracking-[0.25em] text-[#a77a2b]">
                QUICK INSIGHTS
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#761019]">
                Puja at a glance
              </h2>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[#766457]">
                      Verified Member Contributors
                    </span>
                    <span className="font-bold text-[#761019]">
                      {memberContributions.length}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[#766457]">
                      External Supporters
                    </span>
                    <span className="font-bold text-[#761019]">
                      {externalContributions.length}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[#766457]">
                      Confirmed Seva
                    </span>
                    <span className="font-bold text-[#761019]">
                      {sevaList.length}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[#766457]">
                      Average Member Contribution
                    </span>
                    <span className="font-bold text-[#761019]">
                      {memberContributions.length
                        ? money(memberTotal / memberContributions.length)
                        : "₹0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Expense Category Chart */}
          <section className="mt-6 rounded-3xl border border-[#ead9c7] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#a77a2b]">
                  EXPENSE ANALYSIS
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#761019]">
                  Where the expenses went
                </h2>
                <p className="mt-1 text-sm text-[#766457]">
                  Expense distribution by category.
                </p>
              </div>

              <span className="text-xs font-semibold text-[#8c7868]">
                {money(totalExpenses)} total
              </span>
            </div>

            <div className="mt-6 grid gap-7 lg:grid-cols-[220px_1fr] lg:items-center">
              <div className="mx-auto">
                <div
                  className="relative h-48 w-48 rounded-full"
                  style={{ background: expenseGradient }}
                  aria-label="Expense category pie chart"
                >
                  <div className="absolute inset-[30px] flex items-center justify-center rounded-full bg-white text-center">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[#8c7868]">
                        Expenses
                      </p>
                      <p className="text-base font-bold text-[#761019]">
                        {money(totalExpenses)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {expenseCategories.map((item, index) => {
                  const percent = expenseChartTotal
                    ? Math.round((item.value / expenseChartTotal) * 100)
                    : 0;

                  return (
                    <div
                      key={item.name}
                      className="rounded-2xl border border-[#eee1d3] bg-[#fffaf2] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                expenseColors[index % expenseColors.length],
                            }}
                          />
                          <span className="text-xs font-semibold text-[#392823]">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#a77a2b]">
                          {percent}%
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-bold text-[#761019]">
                        {money(item.value)}
                      </p>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eadfce]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percent}%`,
                            backgroundColor:
                              expenseColors[index % expenseColors.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {!expenseCategories.length && (
                  <div className="sm:col-span-2 rounded-2xl bg-[#fffaf2] px-4 py-10 text-center text-sm text-[#8c7868]">
                    No expenses recorded yet.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* MEMBER CONTRIBUTIONS */}
          <section className="mt-6 rounded-3xl border border-[#ead9c7] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#a77a2b]">
                  CONTRIBUTIONS
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#761019]">
                  Contributions from Members
                </h2>
              </div>

              <div className="rounded-xl bg-[#fff8ee] px-4 py-2 text-right">
                <p className="text-[10px] text-[#8c7868]">Verified</p>
                <p className="font-bold text-[#761019]">
                  {memberContributions.length}
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ead9c7] text-[10px] uppercase tracking-[0.12em] text-[#8c7868]">
                    <th className="px-3 py-3">Resident</th>
                    <th className="px-3 py-3">Flat</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Verified On</th>
                  </tr>
                </thead>

                <tbody>
                  {memberContributions.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#f1e7da] last:border-0"
                    >
                      <td className="px-3 py-3.5 font-semibold text-[#392823]">
                        {item.name}
                      </td>
                      <td className="px-3 py-3.5 text-[#766457]">
                        {item.block || "—"}-{item.flat_no || "—"}
                      </td>
                      <td className="px-3 py-3.5 font-bold text-[#761019]">
                        {money(Number(item.amount || 0))}
                      </td>
                      <td className="px-3 py-3.5 text-[#766457]">
                        {formatDate(item.verified_at || item.created_at)}
                      </td>
                    </tr>
                  ))}

                  {!memberContributions.length && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-10 text-center text-sm text-[#8c7868]"
                      >
                        No verified member contributions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* EXTERNAL SUPPORT */}
          <section className="mt-6 rounded-3xl border border-[#ead9c7] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#a77a2b]">
                  COMMUNITY SUPPORT
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#761019]">
                  Contributions from External Sources
                </h2>
              </div>

              <div className="rounded-xl bg-[#fff8ee] px-4 py-2 text-right">
                <p className="text-[10px] text-[#8c7868]">Verified</p>
                <p className="font-bold text-[#761019]">
                  {externalContributions.length}
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ead9c7] text-[10px] uppercase tracking-[0.12em] text-[#8c7868]">
                    <th className="px-3 py-3">Contributor</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Verified On</th>
                  </tr>
                </thead>

                <tbody>
                  {externalContributions.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#f1e7da] last:border-0"
                    >
                      <td className="px-3 py-3.5 font-semibold text-[#392823]">
                        {item.organisation_name || item.donor_name}
                        {item.organisation_name && item.donor_name && (
                          <span className="ml-2 text-xs font-normal text-[#8c7868]">
                            {item.donor_name}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-[#766457]">
                        {item.donor_type || "Supporter"}
                      </td>
                      <td className="px-3 py-3.5 font-bold text-[#761019]">
                        {money(Number(item.amount || 0))}
                      </td>
                      <td className="px-3 py-3.5 text-[#766457]">
                        {formatDate(item.verified_at || item.created_at)}
                      </td>
                    </tr>
                  ))}

                  {!externalContributions.length && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-10 text-center text-sm text-[#8c7868]"
                      >
                        No verified external support yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* SEVA */}
          <section className="mt-6 rounded-3xl border border-[#ead9c7] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#a77a2b]">
                  SEVA
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#761019]">
                  Seva Offered
                </h2>
                <p className="mt-1 text-sm text-[#766457]">
                  Confirmed Seva offered by residents.
                </p>
              </div>

              <div className="rounded-xl bg-[#fff8ee] px-4 py-2 text-right">
                <p className="text-[10px] text-[#8c7868]">Confirmed</p>
                <p className="font-bold text-[#761019]">
                  {sevaList.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {sevaList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#ead9c7] bg-[#fffaf2] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.16em] text-[#a77a2b]">
                        {item.seva_no}
                      </p>
                      <h3 className="mt-1 font-bold text-[#761019]">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs text-[#766457]">
                        {item.block || "—"}-{item.flat_no || "—"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-[#8c7868]">
                        Sponsorship
                      </p>
                      <p className="font-bold text-[#761019]">
                        {money(Number(item.amount || 0))}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 border-t border-[#ead9c7] pt-3 text-xs leading-5 text-[#5e5047]">
                    {sevaDetails(item)}
                  </p>
                </div>
              ))}

              {!sevaList.length && (
                <div className="md:col-span-2 rounded-2xl bg-[#fffaf2] px-4 py-10 text-center text-sm text-[#8c7868]">
                  No confirmed Seva registrations yet.
                </div>
              )}
            </div>
          </section>

          {/* EXPENSES */}
          <section className="mt-6 rounded-3xl border border-[#ead9c7] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#a77a2b]">
                  EXPENSES
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#761019]">
                  Expense List
                </h2>
              </div>

              <div className="rounded-xl bg-[#fff8ee] px-4 py-2 text-right">
                <p className="text-[10px] text-[#8c7868]">Total</p>
                <p className="font-bold text-[#761019]">
                  {money(totalExpenses)}
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ead9c7] text-[10px] uppercase tracking-[0.12em] text-[#8c7868]">
                    <th className="px-3 py-3">Expense</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Paid To</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {expenseList.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#f1e7da] last:border-0"
                    >
                      <td className="px-3 py-3.5 font-semibold text-[#392823]">
                        {item.title}
                      </td>
                      <td className="px-3 py-3.5 text-[#766457]">
                        {item.category || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-[#766457]">
                        {item.paid_to || "—"}
                      </td>
                      <td className="px-3 py-3.5 font-bold text-[#a70e18]">
                        {money(Number(item.amount || 0))}
                      </td>
                      <td className="px-3 py-3.5 text-[#766457]">
                        {formatDate(item.expense_date)}
                      </td>
                    </tr>
                  ))}

                  {!expenseList.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-10 text-center text-sm text-[#8c7868]"
                      >
                        No expenses recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* READ-ONLY NOTICE */}
          <div className="mt-8 flex items-center justify-center gap-2 text-center">
            <i className="fa-solid fa-lock text-[11px] text-[#a77a2b]" />
            <p className="text-xs text-[#8c7868]">
              This is a read-only financial transparency page. Visitors cannot
              add, edit, verify or delete any records.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
