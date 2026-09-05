"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

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

type Filter = "all" | "pending" | "verified" | "rejected";
type Section = "contributions" | "donations";

const COLLECTION_TARGET = 500000;

export default function DashboardClient({
  initialContributions,
  initialDonations,
}: {
  initialContributions: Contribution[];
  initialDonations: Donation[];
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [contributions, setContributions] =
    useState<Contribution[]>(initialContributions);

  const [donations, setDonations] =
    useState<Donation[]>(initialDonations);

  const [section, setSection] =
    useState<Section>("contributions");

  const [contributionFilter, setContributionFilter] =
    useState<Filter>("all");

  const [donationFilter, setDonationFilter] =
    useState<Filter>("all");

  const [contributionSearch, setContributionSearch] =
    useState("");

  const [donationSearch, setDonationSearch] =
    useState("");

  const [loadingId, setLoadingId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");

  const [loggingOut, setLoggingOut] =
    useState(false);

  /* =========================================================
     HELPERS
  ========================================================= */

  const money = (value: number) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  /* =========================================================
     CONTRIBUTION STATS
  ========================================================= */

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

      totalAmount: contributions.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),

      verifiedCount: verified.length,

      verifiedAmount: verified.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),

      pendingCount: pending.length,

      pendingAmount: pending.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),

      rejectedCount: rejected.length,

      rejectedAmount: rejected.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    };
  }, [contributions]);

  /* =========================================================
     DONATION STATS
  ========================================================= */

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

    const sponsorships = donations.filter(
      (item) =>
        item.donation_type === "sponsorship"
    );

    return {
      count: donations.length,

      totalAmount: donations.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),

      verifiedCount: verified.length,

      verifiedAmount: verified.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),

      pendingCount: pending.length,

      pendingAmount: pending.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),

      rejectedCount: rejected.length,

      rejectedAmount: rejected.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),

      sponsorshipAmount: sponsorships.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    };
  }, [donations]);

  /* =========================================================
     OVERALL STATS
  ========================================================= */

  const overallStats = useMemo(() => {
    const verifiedAmount =
      contributionStats.verifiedAmount +
      donationStats.verifiedAmount;

    const pendingAmount =
      contributionStats.pendingAmount +
      donationStats.pendingAmount;

    const totalSubmitted =
      contributionStats.totalAmount +
      donationStats.totalAmount;

    const totalRecords =
      contributionStats.count +
      donationStats.count;

    const progress = Math.min(
      (verifiedAmount / COLLECTION_TARGET) * 100,
      100
    );

    const remaining = Math.max(
      COLLECTION_TARGET - verifiedAmount,
      0
    );

    return {
      verifiedAmount,
      pendingAmount,
      totalSubmitted,
      totalRecords,
      progress,
      remaining,
    };
  }, [
    contributionStats,
    donationStats,
  ]);

  /* =========================================================
     FILTER CONTRIBUTIONS
  ========================================================= */

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

  /* =========================================================
     FILTER DONATIONS
  ========================================================= */

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
        item.email ?? "",
        item.location ?? "",
        item.utr ?? "",
        item.donation_type,
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

  /* =========================================================
     UPDATE CONTRIBUTION STATUS
  ========================================================= */

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
            "Unable to update contribution status."
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
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to the server."
      );
    } finally {
      setLoadingId(null);
    }
  }

  /* =========================================================
     UPDATE DONATION STATUS
  ========================================================= */

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
            "Unable to update donation status."
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
          ? "Donation verified successfully."
          : "Donation rejected."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to the server."
      );
    } finally {
      setLoadingId(null);
    }
  }

  /* =========================================================
     EXPORT CONTRIBUTIONS
  ========================================================= */

  function exportContributions() {
    const rows = filteredContributions.map(
      (item) => ({
        Name: item.name,
        "Flat No.": item.flat_no,
        Mobile: item.mobile,
        Amount: Number(item.amount),
        UTR: item.utr || "",
        Status: item.status,
        "Submitted On": new Date(
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

    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 12 },
      { wch: 15 },
      { wch: 14 },
      { wch: 24 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Contributions"
    );

    XLSX.writeFile(
      workbook,
      `BUH-Durga-Puja-Contributions-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  }

  /* =========================================================
     EXPORT DONATIONS
  ========================================================= */

  function exportDonations() {
    const rows = filteredDonations.map(
      (item) => ({
        "Donor Name": item.donor_name,
        Organisation:
          item.organisation_name || "",
        "Donor Type": item.donor_type,
        Mobile: item.mobile,
        Email: item.email || "",
        Location: item.location || "",
        Amount: Number(item.amount),
        Type:
          item.donation_type === "sponsorship"
            ? "Sponsorship"
            : "Donation",
        UTR: item.utr || "",
        Status: item.status,
        "Submitted On": new Date(
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

    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 24 },
      { wch: 25 },
      { wch: 15 },
      { wch: 28 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 24 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "External Support"
    );

    XLSX.writeFile(
      workbook,
      `BUH-Durga-Puja-External-Support-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  async function handleLogout() {
    setLoggingOut(true);
    setMessage("");

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(error);

      setMessage(
        "Unable to logout. Please try again."
      );

      setLoggingOut(false);
      return;
    }

    router.replace("/admin/login");
    router.refresh();
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f8f1e7] text-[#292929]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-[#ead9c7] bg-white px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-[3px] text-[#a70e18]">
              <i className="fa-solid fa-spa" />
              DURGA PUJA 2026
            </div>

            <h1 className="mt-1 font-serif text-2xl font-bold">
              BUH Contribution Dashboard
            </h1>

            <p className="mt-1 text-sm text-[#737373]">
              Manage resident contributions and
              external support.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <a
              href="/contribute"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#ead9c7] bg-white px-4 py-2.5 text-sm font-semibold text-[#a70e18] no-underline transition hover:bg-[#fcf8f1]"
            >
              <i className="fa-solid fa-house-user" />
              Contribution Page
            </a>

            <a
              href="/donate"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#ead9c7] bg-white px-4 py-2.5 text-sm font-semibold text-[#a70e18] no-underline transition hover:bg-[#fcf8f1]"
            >
              <i className="fa-solid fa-hand-holding-heart" />
              Donation Page
            </a>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#292929] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i
                className={`fa-solid ${
                  loggingOut
                    ? "fa-spinner fa-spin"
                    : "fa-right-from-bracket"
                }`}
              />

              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>

          </div>
        </header>

        {/* =====================================================
            OVERALL COLLECTION
        ===================================================== */}


        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">

          <StatCard
            icon="fa-house-user"
            label="Residents"
            value={String(
              contributionStats.count
            )}
            sub="Contributions"
          />

          <StatCard
            icon="fa-hand-holding-heart"
            label="External"
            value={String(
              donationStats.count
            )}
            sub="Donors"
          />

          <StatCard
            icon="fa-circle-check"
            label="Verified"
            value={money(
              overallStats.verifiedAmount
            )}
            sub="Collected"
          />

          <StatCard
            icon="fa-clock"
            label="Pending"
            value={money(
              overallStats.pendingAmount
            )}
            sub="Awaiting verification"
          />

          <StatCard
            icon="fa-indian-rupee-sign"
            label="Submitted"
            value={money(
              overallStats.totalSubmitted
            )}
            sub="All submissions"
          />

          <StatCard
            icon="fa-handshake"
            label="Sponsorship"
            value={money(
              donationStats.sponsorshipAmount
            )}
            sub="All sponsorships"
          />

        </section>

        {/* =====================================================
            SECTION TABS
        ===================================================== */}

        <div className="mt-6 rounded-xl border border-[#eadfd2] bg-white p-2 shadow-sm">

          <div className="grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={() => {
                setSection("contributions");
                setMessage("");
              }}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition ${
                section === "contributions"
                  ? "bg-[#a70e18] text-white shadow-sm"
                  : "text-[#666] hover:bg-[#fcf8f1]"
              }`}
            >
              <i className="fa-solid fa-house-user" />
              Resident Contributions
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {contributions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSection("donations");
                setMessage("");
              }}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition ${
                section === "donations"
                  ? "bg-[#a70e18] text-white shadow-sm"
                  : "text-[#666] hover:bg-[#fcf8f1]"
              }`}
            >
              <i className="fa-solid fa-hand-holding-heart" />
              External Support
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {donations.length}
              </span>
            </button>

          </div>

        </div>

        {/* =====================================================
            GLOBAL MESSAGE
        ===================================================== */}

        {message && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#f0dfbd] bg-[#fff8eb] px-4 py-3 text-sm text-[#725e3a]">
            <i className="fa-solid fa-circle-info" />
            {message}
          </div>
        )}

        {/* =====================================================
            CONTRIBUTIONS
        ===================================================== */}

        {section === "contributions" && (
          <section className="mt-4 overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">

            {/* Header */}

            <div className="border-b border-[#eee5db] px-4 py-4 sm:px-5">

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h2 className="font-serif text-xl font-bold">
                    Resident Contributions
                  </h2>

                  <p className="mt-1 text-xs text-[#858585]">
                    {filteredContributions.length} record
                    {filteredContributions.length === 1
                      ? ""
                      : "s"} shown
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]" />

                    <input
                      value={contributionSearch}
                      onChange={(e) =>
                        setContributionSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search resident, flat, mobile or UTR"
                      className="h-10 w-full rounded-lg border border-[#ddd6cd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#a70e18] sm:w-[300px]"
                    />
                  </div>

                  <select
                    value={contributionFilter}
                    onChange={(e) =>
                      setContributionFilter(
                        e.target.value as Filter
                      )
                    }
                    className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                  >
                    <option value="all">
                      All
                    </option>
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
                    onClick={exportContributions}
                    disabled={
                      filteredContributions.length ===
                      0
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#23753b] px-4 text-sm font-semibold text-white transition hover:bg-[#1d6331] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <i className="fa-solid fa-file-excel" />
                    Export
                  </button>

                </div>
              </div>
            </div>

            {/* Desktop */}

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full min-w-[1000px] text-left">

                <thead className="bg-[#fcf8f1] text-xs uppercase tracking-wide text-[#777]">

                  <tr>
                    <th className="px-5 py-3">
                      Resident
                    </th>

                    <th className="px-4 py-3">
                      Flat
                    </th>

                    <th className="px-4 py-3">
                      Mobile
                    </th>

                    <th className="px-4 py-3">
                      Amount
                    </th>

                    <th className="px-4 py-3">
                      UTR
                    </th>

                    <th className="px-4 py-3">
                      Date
                    </th>

                    <th className="px-4 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right">
                      Action
                    </th>
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
                          <div className="font-semibold text-sm">
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
                                loadingId === item.id
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

            {/* Mobile */}

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
                      <div className="mt-3 grid grid-cols-2 gap-2">

                        <button
                          type="button"
                          disabled={
                            loadingId === item.id
                          }
                          onClick={() =>
                            updateContributionStatus(
                              item.id,
                              "verified"
                            )
                          }
                          className="rounded-lg bg-[#a70e18] py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <i className="fa-solid fa-check mr-1" />
                          Verify
                        </button>

                        <button
                          type="button"
                          disabled={
                            loadingId === item.id
                          }
                          onClick={() =>
                            updateContributionStatus(
                              item.id,
                              "rejected"
                            )
                          }
                          className="rounded-lg border border-[#ddd] bg-white py-2.5 text-xs font-semibold text-[#666] disabled:opacity-50"
                        >
                          Reject
                        </button>

                      </div>
                    )}

                  </div>
                )
              )}

            </div>

            {filteredContributions.length ===
              0 && (
              <EmptyState label="contributions" />
            )}

          </section>
        )}

        {/* =====================================================
            EXTERNAL DONATIONS
        ===================================================== */}

        {section === "donations" && (
          <section className="mt-4 overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">

            {/* Header */}

            <div className="border-b border-[#eee5db] px-4 py-4 sm:px-5">

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h2 className="font-serif text-xl font-bold">
                    External Support
                  </h2>

                  <p className="mt-1 text-xs text-[#858585]">
                    Donations and sponsorships from
                    external supporters.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]" />

                    <input
                      value={donationSearch}
                      onChange={(e) =>
                        setDonationSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search donor, organisation, UTR"
                      className="h-10 w-full rounded-lg border border-[#ddd6cd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#a70e18] sm:w-[280px]"
                    />
                  </div>

                  <select
                    value={donationFilter}
                    onChange={(e) =>
                      setDonationFilter(
                        e.target.value as Filter
                      )
                    }
                    className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                  >
                    <option value="all">
                      All
                    </option>
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
                    onClick={exportDonations}
                    disabled={
                      filteredDonations.length ===
                      0
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#23753b] px-4 text-sm font-semibold text-white transition hover:bg-[#1d6331] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <i className="fa-solid fa-file-excel" />
                    Export
                  </button>

                </div>

              </div>
            </div>

            {/* Desktop */}

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full min-w-[1200px] text-left">

                <thead className="bg-[#fcf8f1] text-xs uppercase tracking-wide text-[#777]">

                  <tr>

                    <th className="px-5 py-3">
                      Donor
                    </th>

                    <th className="px-4 py-3">
                      Organisation
                    </th>

                    <th className="px-4 py-3">
                      Type
                    </th>

                    <th className="px-4 py-3">
                      Support
                    </th>

                    <th className="px-4 py-3">
                      Amount
                    </th>

                    <th className="px-4 py-3">
                      UTR
                    </th>

                    <th className="px-4 py-3">
                      Date
                    </th>

                    <th className="px-4 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right">
                      Action
                    </th>

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
                          <div className="font-semibold text-sm">
                            {item.donor_name}
                          </div>

                          <div className="mt-1 text-xs text-[#888]">
                            {item.mobile}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {item.organisation_name ||
                            "Individual"}
                        </td>

                        <td className="px-4 py-4 text-xs text-[#666]">
                          {item.donor_type}
                        </td>

                        <td className="px-4 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              item.donation_type ===
                              "sponsorship"
                                ? "bg-[#f3edff] text-[#6841a5]"
                                : "bg-[#fff1f1] text-[#a70e18]"
                            }`}
                          >
                            {item.donation_type ===
                            "sponsorship"
                              ? "Sponsorship"
                              : "Donation"}
                          </span>

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
                                loadingId === item.id
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

            {/* Mobile */}

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
                            "Individual"}
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
                          Type
                        </span>

                        <strong className="mt-1 block font-medium">
                          {item.donation_type ===
                          "sponsorship"
                            ? "Sponsorship"
                            : "Donation"}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[#888]">
                          Donor Type
                        </span>

                        <strong className="mt-1 block font-medium">
                          {item.donor_type}
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
                      <div className="mt-3 grid grid-cols-2 gap-2">

                        <button
                          type="button"
                          disabled={
                            loadingId === item.id
                          }
                          onClick={() =>
                            updateDonationStatus(
                              item.id,
                              "verified"
                            )
                          }
                          className="rounded-lg bg-[#a70e18] py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <i className="fa-solid fa-check mr-1" />
                          Verify
                        </button>

                        <button
                          type="button"
                          disabled={
                            loadingId === item.id
                          }
                          onClick={() =>
                            updateDonationStatus(
                              item.id,
                              "rejected"
                            )
                          }
                          className="rounded-lg border border-[#ddd] bg-white py-2.5 text-xs font-semibold text-[#666] disabled:opacity-50"
                        >
                          Reject
                        </button>

                      </div>
                    )}

                  </div>
                )
              )}

            </div>

            {filteredDonations.length ===
              0 && (
              <EmptyState label="external support records" />
            )}

          </section>
        )}

      </div>
    </main>
  );
}

/* ==========================================================
   STAT CARD
========================================================== */

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[#eadfd2] bg-white p-4 shadow-sm">

      <div className="flex items-center gap-2 text-xs font-medium text-[#777]">
        <i
          className={`fa-solid ${icon} text-[#a70e18]`}
        />

        {label}
      </div>

      <div className="mt-2 text-lg font-bold text-[#292929]">
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

/* ==========================================================
   STATUS BADGE
========================================================== */

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

  const icon =
    status === "verified"
      ? "fa-circle-check"
      : status === "rejected"
        ? "fa-circle-xmark"
        : "fa-clock";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${styles}`}
    >
      <i className={`fa-solid ${icon}`} />
      {status}
    </span>
  );
}

/* ==========================================================
   ACTION BUTTONS
========================================================== */

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
    <div className="flex justify-end gap-2">

      <button
        type="button"
        disabled={loading}
        onClick={onVerify}
        className="rounded-lg bg-[#a70e18] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#8e0b14] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <i
          className={`fa-solid ${
            loading
              ? "fa-spinner fa-spin"
              : "fa-check"
          } mr-1`}
        />

        {loading
          ? "Updating..."
          : "Verify"}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={onReject}
        className="rounded-lg border border-[#ddd] bg-white px-3 py-2 text-xs font-semibold text-[#666] transition hover:bg-[#f8f8f8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reject
      </button>

    </div>
  );
}

/* ==========================================================
   EMPTY STATE
========================================================== */

function EmptyState({
  label,
}: {
  label: string;
}) {
  return (
    <div className="px-5 py-16 text-center">

      <i className="fa-solid fa-inbox text-3xl text-[#c9b8a6]" />

      <p className="mt-3 font-semibold">
        No {label} found
      </p>

      <p className="mt-1 text-sm text-[#888]">
        Try changing the search or filter.
      </p>

    </div>
  );
}