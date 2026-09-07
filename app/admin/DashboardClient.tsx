"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Contribution = {
  id: string;
  name: string;
  flat_no: string;
  mobile: string;
  amount: number;
  utr: string | null;
  status: string;
  created_at: string;
  verified_at: string | null;
};

type Donation = {
  id: string;
  donor_name: string;
  organisation_name: string | null;
  donor_type: string;
  mobile: string;
  email: string | null;
  location: string | null;
  amount: number;
  utr: string | null;
  donation_type: string;
  status: string;
  created_at: string;
  verified_at: string | null;
};

type Expense = {
  id: string;
  title: string;
  category: string;
  paid_to: string | null;
  amount: number;
  expense_date: string;
  payment_mode: string;
  reference_no: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Section =
  | "overview"
  | "contributions"
  | "donations"
  | "expenses";

type Filter = "all" | "pending" | "verified" | "rejected";

const EXPENSE_CATEGORIES = [
  "Puja & Rituals",
  "Decoration",
  "Pandal",
  "Sound & Lighting",
  "Food & Prasad",
  "Cultural Program",
  "Security",
  "Electrical",
  "Cleaning",
  "Printing & Promotion",
  "Transportation",
  "Miscellaneous",
];

const PAYMENT_MODES = [
  "cash",
  "upi",
  "bank transfer",
  "cheque",
];

export default function DashboardClient({
  initialContributions,
  initialDonations,
  initialExpenses,
}: {
  initialContributions: Contribution[];
  initialDonations: Donation[];
  initialExpenses: Expense[];
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [section, setSection] =
    useState<Section>("overview");

  const [contributions, setContributions] =
    useState<Contribution[]>(initialContributions);

  const [donations, setDonations] =
    useState<Donation[]>(initialDonations);

  const [expenses, setExpenses] =
    useState<Expense[]>(initialExpenses);

  const [contributionFilter, setContributionFilter] =
    useState<Filter>("all");

  const [donationFilter, setDonationFilter] =
    useState<Filter>("all");

  const [contributionSearch, setContributionSearch] =
    useState("");

  const [donationSearch, setDonationSearch] =
    useState("");

  const [expenseSearch, setExpenseSearch] =
    useState("");

  const [loadingId, setLoadingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [showExpenseForm, setShowExpenseForm] =
    useState(false);

  const [editingExpense, setEditingExpense] =
    useState<Expense | null>(null);

  const contributionStats = useMemo(() => {
    const verified = contributions.filter(
      (item) => item.status === "verified"
    );

    const pending = contributions.filter(
      (item) => item.status === "pending"
    );

    const rejected = contributions.filter(
      (item) => item.status === "rejected"
    );

    return {
      count: contributions.length,

      verifiedCount: verified.length,

      verifiedAmount: verified.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      ),

      pendingCount: pending.length,

      pendingAmount: pending.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      ),

      rejectedCount: rejected.length,
    };
  }, [contributions]);

  const donationStats = useMemo(() => {
    const verified = donations.filter(
      (item) => item.status === "verified"
    );

    const pending = donations.filter(
      (item) => item.status === "pending"
    );

    const rejected = donations.filter(
      (item) => item.status === "rejected"
    );

    return {
      count: donations.length,

      verifiedCount: verified.length,

      verifiedAmount: verified.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      ),

      pendingCount: pending.length,

      pendingAmount: pending.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      ),

      rejectedCount: rejected.length,
    };
  }, [donations]);

  const expenseStats = useMemo(() => {
    const total = expenses.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

    return {
      count: expenses.length,
      total,
    };
  }, [expenses]);

  const financialStats = useMemo(() => {
    const verifiedFunds =
      contributionStats.verifiedAmount +
      donationStats.verifiedAmount;

    const remaining =
      verifiedFunds - expenseStats.total;

    return {
      verifiedFunds,
      remaining,
    };
  }, [
    contributionStats.verifiedAmount,
    donationStats.verifiedAmount,
    expenseStats.total,
  ]);

  const filteredContributions = useMemo(() => {
    const term =
      contributionSearch.trim().toLowerCase();

    return contributions.filter((item) => {
      const matchesFilter =
        contributionFilter === "all" ||
        item.status === contributionFilter;

      if (!matchesFilter) return false;

      if (!term) return true;

      return [
        item.name,
        item.flat_no,
        item.mobile,
        item.utr ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [
    contributions,
    contributionFilter,
    contributionSearch,
  ]);

  const filteredDonations = useMemo(() => {
    const term =
      donationSearch.trim().toLowerCase();

    return donations.filter((item) => {
      const matchesFilter =
        donationFilter === "all" ||
        item.status === donationFilter;

      if (!matchesFilter) return false;

      if (!term) return true;

      return [
        item.donor_name,
        item.organisation_name ?? "",
        item.donor_type,
        item.mobile,
        item.utr ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [
    donations,
    donationFilter,
    donationSearch,
  ]);

  const filteredExpenses = useMemo(() => {
    const term =
      expenseSearch.trim().toLowerCase();

    if (!term) return expenses;

    return expenses.filter((item) =>
      [
        item.title,
        item.category,
        item.paid_to ?? "",
        item.payment_mode,
        item.reference_no ?? "",
        item.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [expenses, expenseSearch]);

  const money = (value: number) =>
    `₹${Number(value).toLocaleString("en-IN")}`;

  async function updateContributionStatus(
    id: string,
    status: "verified" | "rejected"
  ) {
    setLoadingId(id);
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/contributions/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          result.error ||
            "Unable to update contribution."
        );
        return;
      }

      setContributions((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                verified_at:
                  status === "verified"
                    ? new Date().toISOString()
                    : null,
              }
            : item
        )
      );

      setMessage(
        status === "verified"
          ? "Contribution verified successfully."
          : "Contribution rejected."
      );
    } catch {
      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function updateDonationStatus(
    id: string,
    status: "verified" | "rejected"
  ) {
    setLoadingId(id);
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/donations/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          result.error ||
            "Unable to update donation."
        );
        return;
      }

      setDonations((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                verified_at:
                  status === "verified"
                    ? new Date().toISOString()
                    : null,
              }
            : item
        )
      );

      setMessage(
        status === "verified"
          ? "External support verified successfully."
          : "External support rejected."
      );
    } catch {
      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteExpense(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    setLoadingId(id);
    setMessage("");

    try {
      const response = await fetch(
        "/api/expenses",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          result.error ||
            "Unable to delete expense."
        );
        return;
      }

      setExpenses((current) =>
        current.filter((item) => item.id !== id)
      );

      setMessage("Expense deleted successfully.");
    } catch {
      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setMessage("");

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      setMessage(
        "Unable to logout. Please try again."
      );
      setLoggingOut(false);
      return;
    }

    router.replace("/admin/login");
    router.refresh();
  }

  function exportContributions() {
    const rows = filteredContributions.map(
      (item) => ({
        Name: item.name,
        "Flat No.": item.flat_no,
        Mobile: item.mobile,
        Amount: Number(item.amount),
        UTR: item.utr || "",
        Status: item.status,
        "Submitted On":
          new Date(
            item.created_at
          ).toLocaleString("en-IN"),
        "Verified On": item.verified_at
          ? new Date(
              item.verified_at
            ).toLocaleString("en-IN")
          : "",
      })
    );

    const worksheet =
      XLSX.utils.json_to_sheet(rows);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Contributions"
    );

    XLSX.writeFile(
      workbook,
      `BUH-Contributions-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  }

  function exportDonations() {
    const rows = filteredDonations.map(
      (item) => ({
        Donor: item.donor_name,
        Organisation:
          item.organisation_name || "",
        "Donor Type": item.donor_type,
        Mobile: item.mobile,
        Email: item.email || "",
        Location: item.location || "",
        Amount: Number(item.amount),
        Type: item.donation_type,
        UTR: item.utr || "",
        Status: item.status,
        "Submitted On":
          new Date(
            item.created_at
          ).toLocaleString("en-IN"),
        "Verified On": item.verified_at
          ? new Date(
              item.verified_at
            ).toLocaleString("en-IN")
          : "",
      })
    );

    const worksheet =
      XLSX.utils.json_to_sheet(rows);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "External Support"
    );

    XLSX.writeFile(
      workbook,
      `BUH-External-Support-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  }

  function exportExpenses() {
    const rows = filteredExpenses.map(
      (item) => ({
        Expense: item.title,
        Category: item.category,
        "Paid To": item.paid_to || "",
        Amount: Number(item.amount),
        Date: item.expense_date,
        "Payment Mode": item.payment_mode,
        "Reference No.": item.reference_no || "",
        Notes: item.notes || "",
      })
    );

    const worksheet =
      XLSX.utils.json_to_sheet(rows);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Expenses"
    );

    XLSX.writeFile(
      workbook,
      `BUH-Expenses-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  }

  function exportFinancialReport() {
    const workbook =
      XLSX.utils.book_new();

    const summary = [
      {
        Particular: "Verified Resident Contributions",
        Amount:
          contributionStats.verifiedAmount,
      },
      {
        Particular: "Verified External Support",
        Amount:
          donationStats.verifiedAmount,
      },
      {
        Particular: "Total Verified Funds",
        Amount:
          financialStats.verifiedFunds,
      },
      {
        Particular: "Total Expenses",
        Amount:
          expenseStats.total,
      },
      {
        Particular: "Remaining Balance",
        Amount:
          financialStats.remaining,
      },
    ];

    const contributionRows =
      contributions.map((item) => ({
        Name: item.name,
        "Flat No.": item.flat_no,
        Mobile: item.mobile,
        Amount: Number(item.amount),
        UTR: item.utr || "",
        Status: item.status,
        Date: new Date(
          item.created_at
        ).toLocaleString("en-IN"),
      }));

    const donationRows =
      donations.map((item) => ({
        Donor: item.donor_name,
        Organisation:
          item.organisation_name || "",
        "Donor Type": item.donor_type,
        Mobile: item.mobile,
        Amount: Number(item.amount),
        Type: item.donation_type,
        UTR: item.utr || "",
        Status: item.status,
        Date: new Date(
          item.created_at
        ).toLocaleString("en-IN"),
      }));

    const expenseRows =
      expenses.map((item) => ({
        Expense: item.title,
        Category: item.category,
        "Paid To": item.paid_to || "",
        Amount: Number(item.amount),
        Date: item.expense_date,
        "Payment Mode": item.payment_mode,
        "Reference No.":
          item.reference_no || "",
        Notes: item.notes || "",
      }));

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summary),
      "Financial Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        contributionRows
      ),
      "Contributions"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(donationRows),
      "External Support"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(expenseRows),
      "Expenses"
    );

    XLSX.writeFile(
      workbook,
      `BUH-Durga-Puja-Financial-Report-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f1e7] text-[#292929]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* HEADER */}
        <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-[#ead9c7] bg-white px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-[3px] text-[#a70e18]">
              <i className="fa-solid fa-spa" />
              DURGA PUJA 2026
            </div>

            <h1 className="mt-1 font-opensans text-2xl font-bold">
              BUH Puja Management Dashboard
            </h1>

            <p className="mt-1 text-sm text-[#737373]">
              Manage contributions, external support and expenses.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/contribute"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#ead9c7] bg-white px-4 py-2.5 text-sm font-semibold text-[#a70e18] no-underline"
            >
              <i className="fa-solid fa-house-user" />
              Contribution Page
            </a>

            <a
              href="/donate"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#a70e18] px-4 py-2.5 text-sm font-semibold text-white no-underline"
            >
              <i className="fa-solid fa-hand-holding-heart" />
              Donation Page
            </a>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#ddd] bg-white px-4 py-2.5 text-sm font-semibold text-[#666] disabled:opacity-50"
            >
              <i className="fa-solid fa-right-from-bracket" />
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        {/* NAVIGATION */}
        <nav className="mb-5 overflow-x-auto rounded-xl border border-[#eadfd2] bg-white p-1.5 shadow-sm">
          <div className="flex min-w-max gap-1">
            <NavButton
              active={section === "overview"}
              onClick={() => setSection("overview")}
              icon="fa-chart-pie"
              label="Overview"
            />

            <NavButton
              active={section === "contributions"}
              onClick={() =>
                setSection("contributions")
              }
              icon="fa-house-user"
              label="Contributions"
            />

            <NavButton
              active={section === "donations"}
              onClick={() =>
                setSection("donations")
              }
              icon="fa-hand-holding-heart"
              label="External Support"
            />

            <NavButton
              active={section === "expenses"}
              onClick={() =>
                setSection("expenses")
              }
              icon="fa-receipt"
              label="Expenses"
            />
          </div>
        </nav>

        {/* MESSAGE */}
        {message && (
          <div className="mb-5 rounded-xl border border-[#ead9c7] bg-white px-4 py-3 text-sm text-[#725e3a] shadow-sm">
            {message}
          </div>
        )}

        {/* =====================================================
            OVERVIEW
        ===================================================== */}
        {section === "overview" && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <FinancialCard
                icon="fa-house-user"
                label="Resident Contributions"
                value={money(
                  contributionStats.verifiedAmount
                )}
                sub={`${contributionStats.verifiedCount} verified payments`}
              />

              <FinancialCard
                icon="fa-hand-holding-heart"
                label="External Support"
                value={money(
                  donationStats.verifiedAmount
                )}
                sub={`${donationStats.verifiedCount} verified donors`}
              />

              <FinancialCard
                icon="fa-receipt"
                label="Total Expenses"
                value={money(
                  expenseStats.total
                )}
                sub={`${expenseStats.count} expenses`}
              />

              <FinancialCard
                icon="fa-wallet"
                label="Remaining Balance"
                value={money(
                  financialStats.remaining
                )}
                sub="Verified funds minus expenses"
                highlight
              />
            </section>

            {/* FINANCIAL BREAKDOWN */}
            <section className="mt-5 rounded-2xl border border-[#eadfd2] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-xl font-bold">
                    Financial Summary
                  </h2>

                  <p className="mt-1 text-sm text-[#858585]">
                    Current position based on verified funds and recorded expenses.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={exportFinancialReport}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#23753b] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <i className="fa-solid fa-file-excel" />
                  Financial Report
                </button>
              </div>

              <div className="mt-5 space-y-3">

                <SummaryRow
                  label="Verified Resident Contributions"
                  amount={
                    contributionStats.verifiedAmount
                  }
                  positive
                />

                <SummaryRow
                  label="Verified External Support"
                  amount={
                    donationStats.verifiedAmount
                  }
                  positive
                />

                <div className="border-t border-[#eee5db] pt-3">
                  <SummaryRow
                    label="Total Verified Funds"
                    amount={
                      financialStats.verifiedFunds
                    }
                    bold
                  />
                </div>

                <SummaryRow
                  label="Total Expenses"
                  amount={
                    expenseStats.total
                  }
                  negative
                />

                <div className="mt-4 rounded-xl bg-[#fcf8f1] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#8b8178]">
                        Remaining Balance
                      </div>

                      <div className="mt-1 text-2xl font-bold text-[#a70e18]">
                        {money(
                          financialStats.remaining
                        )}
                      </div>
                    </div>

                    <i className="fa-solid fa-wallet text-3xl text-[#d09a32]" />
                  </div>
                </div>
              </div>
            </section>

            {/* QUICK STATUS */}
            <section className="mt-5 grid gap-3 md:grid-cols-3">

              <SmallSummary
                icon="fa-clock"
                title="Pending Contributions"
                value={money(
                  contributionStats.pendingAmount
                )}
                sub={`${contributionStats.pendingCount} awaiting verification`}
              />

              <SmallSummary
                icon="fa-clock"
                title="Pending External Support"
                value={money(
                  donationStats.pendingAmount
                )}
                sub={`${donationStats.pendingCount} awaiting verification`}
              />

              <SmallSummary
                icon="fa-file-invoice-dollar"
                title="Expenses Recorded"
                value={String(
                  expenseStats.count
                )}
                sub="Expense records"
              />

            </section>
          </>
        )}

        {/* =====================================================
            CONTRIBUTIONS
        ===================================================== */}
        {section === "contributions" && (
          <section className="overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">

            <SectionHeader
              title="Resident Contributions"
              subtitle={`${filteredContributions.length} record${filteredContributions.length === 1 ? "" : "s"} shown`}
              search={contributionSearch}
              setSearch={setContributionSearch}
              placeholder="Search name, flat, mobile or UTR"
              filter={contributionFilter}
              setFilter={setContributionFilter}
              onExport={exportContributions}
            />

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-[#fcf8f1] text-xs uppercase tracking-wide text-[#777]">
                  <tr>
                    <th className="px-5 py-3">Resident</th>
                    <th className="px-4 py-3">Flat</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">UTR</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0ebe5]">
                  {filteredContributions.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#fffdf9]"
                      >
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold">
                            {item.name}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {item.flat_no}
                        </td>

                        <td className="px-4 py-4 text-sm text-[#666]">
                          {item.mobile}
                        </td>

                        <td className="px-4 py-4 text-sm font-bold">
                          {money(item.amount)}
                        </td>

                        <td className="px-4 py-4 text-xs text-[#666]">
                          {item.utr || "—"}
                        </td>

                        <td className="px-4 py-4 text-xs text-[#666]">
                          {formatDate(
                            item.created_at
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={item.status}
                          />
                        </td>

                        <td className="px-5 py-4 text-right">
                          {item.status ===
                          "pending" ? (
                            <ActionButtons
                              loading={
                                loadingId ===
                                item.id
                              }
                              onVerify={() =>
                                updateContributionStatus(
                                  item.id,
                                  "verified"
                                )
                              }
                              onReject={() =>
                                updateContributionStatus(
                                  item.id,
                                  "rejected"
                                )
                              }
                            />
                          ) : (
                            <span className="text-xs text-[#999]">
                              No action
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#eee5db] md:hidden">
              {filteredContributions.map(
                (item) => (
                  <div
                    key={item.id}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {item.name}
                        </div>

                        <div className="mt-1 text-xs text-[#777]">
                          Flat {item.flat_no} ·{" "}
                          {item.mobile}
                        </div>
                      </div>

                      <StatusBadge
                        status={item.status}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[#fcf8f1] p-3 text-xs">
                      <div>
                        <span className="text-[#888]">
                          Amount
                        </span>

                        <strong className="mt-1 block text-sm">
                          {money(item.amount)}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[#888]">
                          Date
                        </span>

                        <strong className="mt-1 block font-medium">
                          {formatDate(
                            item.created_at
                          )}
                        </strong>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[#888]">
                          UTR
                        </span>

                        <strong className="mt-1 block break-all font-medium">
                          {item.utr || "—"}
                        </strong>
                      </div>
                    </div>

                    {item.status ===
                      "pending" && (
                      <div className="mt-3">
                        <ActionButtons
                          loading={
                            loadingId ===
                            item.id
                          }
                          onVerify={() =>
                            updateContributionStatus(
                              item.id,
                              "verified"
                            )
                          }
                          onReject={() =>
                            updateContributionStatus(
                              item.id,
                              "rejected"
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {filteredContributions.length ===
              0 && (
              <EmptyState label="No contributions found." />
            )}
          </section>
        )}

        {/* =====================================================
            DONATIONS
        ===================================================== */}
        {section === "donations" && (
          <section className="overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">

            <SectionHeader
              title="External Support"
              subtitle={`${filteredDonations.length} record${filteredDonations.length === 1 ? "" : "s"} shown`}
              search={donationSearch}
              setSearch={setDonationSearch}
              placeholder="Search donor, organisation, mobile or UTR"
              filter={donationFilter}
              setFilter={setDonationFilter}
              onExport={exportDonations}
            />

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-[#fcf8f1] text-xs uppercase tracking-wide text-[#777]">
                  <tr>
                    <th className="px-5 py-3">Donor</th>
                    <th className="px-4 py-3">Organisation</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">UTR</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0ebe5]">
                  {filteredDonations.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#fffdf9]"
                      >
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold">
                            {item.donor_name}
                          </div>

                          <div className="mt-1 text-xs text-[#888]">
                            {item.mobile}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {item.organisation_name ||
                            "—"}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          <div>
                            {item.donor_type}
                          </div>

                          <div className="mt-1 text-xs capitalize text-[#888]">
                            {item.donation_type}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm font-bold">
                          {money(item.amount)}
                        </td>

                        <td className="px-4 py-4 text-xs text-[#666]">
                          {item.utr || "—"}
                        </td>

                        <td className="px-4 py-4 text-xs text-[#666]">
                          {formatDate(
                            item.created_at
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={item.status}
                          />
                        </td>

                        <td className="px-5 py-4 text-right">
                          {item.status ===
                          "pending" ? (
                            <ActionButtons
                              loading={
                                loadingId ===
                                item.id
                              }
                              onVerify={() =>
                                updateDonationStatus(
                                  item.id,
                                  "verified"
                                )
                              }
                              onReject={() =>
                                updateDonationStatus(
                                  item.id,
                                  "rejected"
                                )
                              }
                            />
                          ) : (
                            <span className="text-xs text-[#999]">
                              No action
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#eee5db] md:hidden">
              {filteredDonations.map(
                (item) => (
                  <div
                    key={item.id}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {item.donor_name}
                        </div>

                        <div className="mt-1 text-xs text-[#777]">
                          {item.organisation_name ||
                            item.donor_type}
                        </div>
                      </div>

                      <StatusBadge
                        status={item.status}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[#fcf8f1] p-3 text-xs">
                      <div>
                        <span className="text-[#888]">
                          Amount
                        </span>

                        <strong className="mt-1 block text-sm">
                          {money(item.amount)}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[#888]">
                          Date
                        </span>

                        <strong className="mt-1 block font-medium">
                          {formatDate(
                            item.created_at
                          )}
                        </strong>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[#888]">
                          UTR
                        </span>

                        <strong className="mt-1 block break-all font-medium">
                          {item.utr || "—"}
                        </strong>
                      </div>
                    </div>

                    {item.status ===
                      "pending" && (
                      <div className="mt-3">
                        <ActionButtons
                          loading={
                            loadingId ===
                            item.id
                          }
                          onVerify={() =>
                            updateDonationStatus(
                              item.id,
                              "verified"
                            )
                          }
                          onReject={() =>
                            updateDonationStatus(
                              item.id,
                              "rejected"
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {filteredDonations.length ===
              0 && (
              <EmptyState label="No external support found." />
            )}
          </section>
        )}

        {/* =====================================================
            EXPENSES
        ===================================================== */}
        {section === "expenses" && (
          <section className="overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">

            <div className="border-b border-[#eee5db] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h2 className="font-serif text-xl font-bold">
                    Expenses
                  </h2>

                  <p className="mt-1 text-xs text-[#858585]">
                    {filteredExpenses.length} record
                    {filteredExpenses.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    shown · Total{" "}
                    {money(expenseStats.total)}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]" />

                    <input
                      value={expenseSearch}
                      onChange={(e) =>
                        setExpenseSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search expenses..."
                      className="h-10 w-full rounded-lg border border-[#ddd6cd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#a70e18] sm:w-[250px]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingExpense(null);
                      setShowExpenseForm(true);
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#a70e18] px-4 text-sm font-semibold text-white"
                  >
                    <i className="fa-solid fa-plus" />
                    Add Expense
                  </button>

                  <button
                    type="button"
                    onClick={exportExpenses}
                    disabled={
                      filteredExpenses.length ===
                      0
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#23753b] px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <i className="fa-solid fa-file-excel" />
                    Export
                  </button>

                </div>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-[#fcf8f1] text-xs uppercase tracking-wide text-[#777]">
                  <tr>
                    <th className="px-5 py-3">Expense</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Paid To</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0ebe5]">
                  {filteredExpenses.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#fffdf9]"
                      >
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold">
                            {item.title}
                          </div>

                          {item.reference_no && (
                            <div className="mt-1 text-xs text-[#888]">
                              Ref:{" "}
                              {item.reference_no}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {item.category}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {item.paid_to || "—"}
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-[#a70e18]">
                          {money(item.amount)}
                        </td>

                        <td className="px-4 py-4 text-sm capitalize">
                          {item.payment_mode}
                        </td>

                        <td className="px-4 py-4 text-xs text-[#666]">
                          {formatDateOnly(
                            item.expense_date
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExpense(
                                  item
                                );
                                setShowExpenseForm(
                                  true
                                );
                              }}
                              className="rounded-lg border border-[#ddd] bg-white px-3 py-2 text-xs font-semibold text-[#666]"
                            >
                              <i className="fa-solid fa-pen mr-1" />
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={
                                loadingId ===
                                item.id
                              }
                              onClick={() =>
                                deleteExpense(
                                  item.id
                                )
                              }
                              className="rounded-lg border border-[#f0cccc] bg-[#fff6f6] px-3 py-2 text-xs font-semibold text-[#a70e18] disabled:opacity-50"
                            >
                              <i className="fa-solid fa-trash mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#eee5db] md:hidden">
              {filteredExpenses.map(
                (item) => (
                  <div
                    key={item.id}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {item.title}
                        </div>

                        <div className="mt-1 text-xs text-[#777]">
                          {item.category}
                        </div>
                      </div>

                      <div className="font-bold text-[#a70e18]">
                        {money(item.amount)}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[#fcf8f1] p-3 text-xs">
                      <div>
                        <span className="text-[#888]">
                          Paid To
                        </span>

                        <strong className="mt-1 block font-medium">
                          {item.paid_to || "—"}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[#888]">
                          Date
                        </span>

                        <strong className="mt-1 block font-medium">
                          {formatDateOnly(
                            item.expense_date
                          )}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[#888]">
                          Payment
                        </span>

                        <strong className="mt-1 block capitalize font-medium">
                          {item.payment_mode}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[#888]">
                          Reference
                        </span>

                        <strong className="mt-1 block break-all font-medium">
                          {item.reference_no ||
                            "—"}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingExpense(
                            item
                          );
                          setShowExpenseForm(
                            true
                          );
                        }}
                        className="flex-1 rounded-lg border border-[#ddd] bg-white py-2.5 text-xs font-semibold text-[#666]"
                      >
                        <i className="fa-solid fa-pen mr-1" />
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={
                          loadingId ===
                          item.id
                        }
                        onClick={() =>
                          deleteExpense(
                            item.id
                          )
                        }
                        className="flex-1 rounded-lg border border-[#f0cccc] bg-[#fff6f6] py-2.5 text-xs font-semibold text-[#a70e18] disabled:opacity-50"
                      >
                        <i className="fa-solid fa-trash mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {filteredExpenses.length ===
              0 && (
              <EmptyState label="No expenses found." />
            )}
          </section>
        )}

        {/* EXPENSE MODAL */}
        {showExpenseForm && (
          <ExpenseModal
            expense={editingExpense}
            categories={EXPENSE_CATEGORIES}
            paymentModes={PAYMENT_MODES}
            onClose={() => {
              setShowExpenseForm(false);
              setEditingExpense(null);
            }}
            onSaved={(expense) => {
              setExpenses((current) => {
                const exists = current.some(
                  (item) =>
                    item.id === expense.id
                );

                if (exists) {
                  return current.map((item) =>
                    item.id === expense.id
                      ? expense
                      : item
                  );
                }

                return [expense, ...current];
              });

              setShowExpenseForm(false);
              setEditingExpense(null);
              setMessage(
                editingExpense
                  ? "Expense updated successfully."
                  : "Expense added successfully."
              );
            }}
          />
        )}
      </div>
    </main>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-[#a70e18] text-white"
          : "text-[#666] hover:bg-[#fcf8f1]"
      }`}
    >
      <i className={`fa-solid ${icon}`} />
      {label}
    </button>
  );
}

function FinancialCard({
  icon,
  label,
  value,
  sub,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        highlight
          ? "border-[#d8bd82] bg-[#fffaf0]"
          : "border-[#eadfd2] bg-white"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-[#777]">
        <i
          className={`fa-solid ${icon} ${
            highlight
              ? "text-[#d09a32]"
              : "text-[#a70e18]"
          }`}
        />

        {label}
      </div>

      <div
        className={`mt-2 text-xl font-bold ${
          highlight
            ? "text-[#a70e18]"
            : "text-[#292929]"
        }`}
      >
        {value}
      </div>

      {sub && (
        <div className="mt-1 text-[11px] text-[#999]">
          {sub}
        </div>
      )}
    </div>
  );
}

function SmallSummary({
  icon,
  title,
  value,
  sub,
}: {
  icon: string;
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-[#eadfd2] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#777]">
        <i className={`fa-solid ${icon} text-[#a70e18]`} />
        {title}
      </div>

      <div className="mt-2 text-lg font-bold">
        {value}
      </div>

      <div className="mt-1 text-xs text-[#999]">
        {sub}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  amount,
  positive = false,
  negative = false,
  bold = false,
}: {
  label: string;
  amount: number;
  positive?: boolean;
  negative?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        bold ? "font-bold" : ""
      }`}
    >
      <span
        className={
          bold
            ? "text-[#292929]"
            : "text-[#666]"
        }
      >
        {label}
      </span>

      <span
        className={`font-semibold ${
          positive
            ? "text-[#23753b]"
            : negative
              ? "text-[#a70e18]"
              : "text-[#292929]"
        }`}
      >
        {negative ? "− " : ""}
        ₹{Number(amount).toLocaleString("en-IN")}
      </span>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  search,
  setSearch,
  placeholder,
  filter,
  setFilter,
  onExport,
}: {
  title: string;
  subtitle: string;
  search: string;
  setSearch: (value: string) => void;
  placeholder: string;
  filter: Filter;
  setFilter: (value: Filter) => void;
  onExport: () => void;
}) {
  return (
    <div className="border-b border-[#eee5db] px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold">
            {title}
          </h2>

          <p className="mt-1 text-xs text-[#858585]">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={placeholder}
              className="h-10 w-full rounded-lg border border-[#ddd6cd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#a70e18] sm:w-[280px]"
            />
          </div>

          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value as Filter
              )
            }
            className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
          >
            <option value="all">All</option>
            <option value="pending">
              Pending
            </option>
            <option value="verified">
              Verified
            </option>
            <option value="rejected">
              Rejected
            </option>
          </select>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#23753b] px-4 text-sm font-semibold text-white"
          >
            <i className="fa-solid fa-file-excel" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButtons({
  loading,
  onVerify,
  onReject,
}: {
  loading: boolean;
  onVerify: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={onVerify}
        className="rounded-lg bg-[#a70e18] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        <i className="fa-solid fa-check mr-1" />
        Verify
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={onReject}
        className="rounded-lg border border-[#ddd] bg-white px-3 py-2 text-xs font-semibold text-[#666] disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles =
    status === "verified"
      ? "bg-[#edf8f0] text-[#23753b]"
      : status === "rejected"
        ? "bg-[#fff0f0] text-[#a70e18]"
        : "bg-[#fff7e8] text-[#9a6a16]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${styles}`}
    >
      <i
        className={`fa-solid ${
          status === "verified"
            ? "fa-circle-check"
            : status === "rejected"
              ? "fa-circle-xmark"
              : "fa-clock"
        }`}
      />

      {status}
    </span>
  );
}

function EmptyState({
  label,
}: {
  label: string;
}) {
  return (
    <div className="px-5 py-16 text-center">
      <i className="fa-solid fa-inbox text-3xl text-[#c9b8a6]" />

      <p className="mt-3 font-semibold">
        {label}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateOnly(value: string) {
  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ============================================================
   EXPENSE MODAL
============================================================ */

function ExpenseModal({
  expense,
  categories,
  paymentModes,
  onClose,
  onSaved,
}: {
  expense: Expense | null;
  categories: string[];
  paymentModes: string[];
  onClose: () => void;
  onSaved: (expense: Expense) => void;
}) {
  const [title, setTitle] =
    useState(expense?.title || "");

  const [category, setCategory] =
    useState(
      expense?.category ||
        categories[0]
    );

  const [paidTo, setPaidTo] =
    useState(expense?.paid_to || "");

  const [amount, setAmount] =
    useState(
      expense
        ? String(expense.amount)
        : ""
    );

  const [expenseDate, setExpenseDate] =
    useState(
      expense?.expense_date ||
        new Date()
          .toISOString()
          .slice(0, 10)
    );

  const [paymentMode, setPaymentMode] =
    useState(
      expense?.payment_mode ||
        "cash"
    );

  const [referenceNo, setReferenceNo] =
    useState(
      expense?.reference_no || ""
    );

  const [notes, setNotes] =
    useState(
      expense?.notes || ""
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit() {
    setError("");

    if (
      !title.trim() ||
      !category ||
      !amount ||
      !expenseDate
    ) {
      setError(
        "Please fill all required fields."
      );
      return;
    }

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a valid amount."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/expenses",
        {
          method: expense
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...(expense
              ? { id: expense.id }
              : {}),
            title,
            category,
            paidTo,
            amount:
              numericAmount,
            expenseDate,
            paymentMode,
            referenceNo,
            notes,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Unable to save expense."
        );
        return;
      }

      onSaved(result.expense);
    } catch {
      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="sticky top-0 flex items-center justify-between border-b border-[#eee5db] bg-white px-5 py-4">
          <div>
            <h2 className="font-serif text-xl font-bold">
              {expense
                ? "Edit Expense"
                : "Add Expense"}
            </h2>

            <p className="mt-1 text-xs text-[#888]">
              Record a Durga Puja expense.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f2eb] text-[#666]"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="space-y-4 p-5">

          {error && (
            <div className="rounded-lg bg-[#fff0f0] px-3 py-2 text-sm text-[#a70e18]">
              {error}
            </div>
          )}

          <FormField
            label="Expense Title"
            required
          >
            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="e.g. Pandal Decoration"
              className="form-input"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">

            <FormField
              label="Category"
              required
            >
              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
                className="form-input"
              >
                {categories.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField
              label="Amount"
              required
            >
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                placeholder="₹ 0"
                className="form-input"
              />
            </FormField>

          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <FormField label="Paid To / Vendor">
              <input
                value={paidTo}
                onChange={(e) =>
                  setPaidTo(
                    e.target.value
                  )
                }
                placeholder="Vendor / Person"
                className="form-input"
              />
            </FormField>

            <FormField
              label="Expense Date"
              required
            >
              <input
                type="date"
                value={expenseDate}
                onChange={(e) =>
                  setExpenseDate(
                    e.target.value
                  )
                }
                className="form-input"
              />
            </FormField>

          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <FormField label="Payment Mode">
              <select
                value={paymentMode}
                onChange={(e) =>
                  setPaymentMode(
                    e.target.value
                  )
                }
                className="form-input capitalize"
              >
                {paymentModes.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Reference No.">
              <input
                value={referenceNo}
                onChange={(e) =>
                  setReferenceNo(
                    e.target.value
                  )
                }
                placeholder="Transaction / receipt no."
                className="form-input"
              />
            </FormField>

          </div>

          <FormField label="Notes">
            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
              rows={3}
              placeholder="Additional details..."
              className="form-input resize-none"
            />
          </FormField>

          <div className="flex gap-3 border-t border-[#eee5db] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#ddd] bg-white py-3 text-sm font-semibold text-[#666]"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={submit}
              className="flex-1 rounded-lg bg-[#a70e18] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : expense
                  ? "Update Expense"
                  : "Add Expense"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#666]">
        {label}
        {required && (
          <span className="ml-1 text-[#a70e18]">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}