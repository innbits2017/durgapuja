"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PendingStatus =
  | "Door Lock"
  | "Follow-up"
  | "Collect Later"
  | "Not Interested";

type PendingContribution = {
  id: string;
  name: string;
  block: string;
  flat_no: string;
  collection_status: PendingStatus;
  collection_channel: string | null;
  created_at: string;
  status: string;
};

const STATUS_OPTIONS: Array<
  "All" | PendingStatus
> = [
  "All",
  "Door Lock",
  "Follow-up",
  "Collect Later",
  "Not Interested",
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getStatusStyle(status: PendingStatus) {
  switch (status) {
    case "Door Lock":
      return {
        bg: "#FEF2F2",
        text: "#B91C1C",
        border: "#FECACA",
      };

    case "Follow-up":
      return {
        bg: "#FFF7ED",
        text: "#C2410C",
        border: "#FED7AA",
      };

    case "Collect Later":
      return {
        bg: "#FEFCE8",
        text: "#A16207",
        border: "#FEF08A",
      };

    case "Not Interested":
      return {
        bg: "#F3F4F6",
        text: "#4B5563",
        border: "#D1D5DB",
      };

    default:
      return {
        bg: "#F3F4F6",
        text: "#374151",
        border: "#E5E7EB",
      };
  }
}

export default function PendingCollectionsPage() {
  const [records, setRecords] = useState<
    PendingContribution[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeStatus, setActiveStatus] =
    useState<
      "All" | PendingStatus
    >("All");

  const [search, setSearch] = useState("");

  async function loadPendingCollections() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/contributions/pending",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load pending collections."
        );
      }

      setRecords(data ?? []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load pending collections."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPendingCollections();
  }, []);

  const counts = useMemo(() => {
    return {
      total: records.length,

      doorLock: records.filter(
        (item) =>
          item.collection_status ===
          "Door Lock"
      ).length,

      followUp: records.filter(
        (item) =>
          item.collection_status ===
          "Follow-up"
      ).length,

      collectLater: records.filter(
        (item) =>
          item.collection_status ===
          "Collect Later"
      ).length,

      notInterested: records.filter(
        (item) =>
          item.collection_status ===
          "Not Interested"
      ).length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    const filtered = records.filter((item) => {
      const matchesStatus =
        activeStatus === "All" ||
        item.collection_status ===
          activeStatus;

      if (!matchesStatus) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      return (
        item.block
          .toLowerCase()
          .includes(searchText) ||
        item.flat_no
          .toLowerCase()
          .includes(searchText) ||
        item.name
          .toLowerCase()
          .includes(searchText) ||
        `${item.block}-${item.flat_no}`
          .toLowerCase()
          .includes(searchText)
      );
    });

    const phaseOrder: Record<string, number> = {
      P1: 1,
      P2: 2,
      Villa: 3,
    };

    return filtered.sort((a, b) => {
      const phaseCompare =
        (phaseOrder[a.block] ?? 99) -
        (phaseOrder[b.block] ?? 99);

      if (phaseCompare !== 0) {
        return phaseCompare;
      }

      return (
        Number(a.flat_no) - Number(b.flat_no)
      );
    });
  }, [
    records,
    activeStatus,
    search,
  ]);

  return (
    <main className="min-h-screen bg-[#fafafa] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-red-700">
              BUH Durga Utsav 2026
            </p>

            <h1 className="text-3xl font-bold text-gray-900">
              Pending Collections
            </h1>

            <p className="mt-2 text-gray-600">
              Flats arranged phase-wise and in ascending flat order.
            </p>
          </div>

          <Link
            href="/contribute/committee"
            className="inline-flex items-center justify-center rounded-xl bg-[#bd0613] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#a80511]"
          >
            + New Collection
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {counts.total}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">
              Door Lock
            </p>

            <p className="mt-2 text-3xl font-bold text-red-800">
              {counts.doorLock}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <p className="text-sm font-medium text-orange-700">
              Follow-up
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-800">
              {counts.followUp}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <p className="text-sm font-medium text-yellow-700">
              Collect Later
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-800">
              {counts.collectLater}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-100 p-5">
            <p className="text-sm font-medium text-gray-600">
              Not Interested
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-700">
              {counts.notInterested}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Status filters */}
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(
                (status) => {
                  const active =
                    activeStatus === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        setActiveStatus(
                          status
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-[#bd0613] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {status}
                    </button>
                  );
                }
              )}
            </div>

            {/* Search */}
            <div className="w-full md:max-w-sm">
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search block, flat or name..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#bd0613]" />

            <p className="text-gray-600">
              Loading pending collections...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredRecords.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <div className="mb-4 text-4xl">
                ✓
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                No pending collections
              </h2>

              <p className="mt-2 text-gray-500">
                There are no flats matching
                the selected filter.
              </p>
            </div>
          )}

        {/* Desktop Table */}
        {!loading &&
          filteredRecords.length > 0 && (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                          Block
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                          Flat No.
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                          Resident
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                          Status
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                          Date
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRecords.map(
                        (item, index) => {
                          const style =
                            getStatusStyle(
                              item.collection_status
                            );
                          const previous =
                            filteredRecords[index - 1];
                          const showPhase =
                            !previous ||
                            previous.block !== item.block;

                          return (
                            <>
                              {showPhase && (
                                <tr key={`phase-${item.block}`}>
                                  <td
                                    colSpan={6}
                                    className="bg-gray-100 px-5 py-3 text-sm font-bold uppercase tracking-wider text-gray-700"
                                  >
                                    {item.block}
                                  </td>
                                </tr>
                              )}
                              <tr
                              key={item.id}
                              className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                            >
                              <td className="px-5 py-4 font-semibold text-gray-900">
                                {item.block}
                              </td>

                              <td className="px-5 py-4 font-semibold text-gray-900">
                                {item.flat_no}
                              </td>

                              <td className="px-5 py-4 text-gray-600">
                                {item.name.startsWith(
                                  "Collection -"
                                )
                                  ? "Not provided"
                                  : item.name}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className="inline-flex rounded-full border px-3 py-1 text-xs font-bold"
                                  style={{
                                    backgroundColor:
                                      style.bg,
                                    color:
                                      style.text,
                                    borderColor:
                                      style.border,
                                  }}
                                >
                                  {
                                    item.collection_status
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4 text-sm text-gray-500">
                                {formatDate(
                                  item.created_at
                                )}
                              </td>

                              <td className="px-5 py-4 text-right">
                                <Link
                                  href={`/contribute/committee?block=${encodeURIComponent(
                                    item.block
                                  )}&flat=${encodeURIComponent(
                                    item.flat_no
                                  )}&status=Pay%20Now`}
                                  className="inline-flex rounded-lg bg-[#bd0613] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a80511]"
                                >
                                  Pay Now
                                </Link>
                              </td>
                              </tr>
                            </>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-4 md:hidden">
                {filteredRecords.map(
                  (item, index) => {
                    const style =
                      getStatusStyle(
                        item.collection_status
                      );

                    const previous =
                      filteredRecords[index - 1];
                    const showPhase =
                      !previous ||
                      previous.block !== item.block;

                    return (
                      <div key={item.id}>
                        {showPhase && (
                          <div className="mb-2 mt-6 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold uppercase tracking-wider text-gray-700 first:mt-0">
                            {item.block}
                          </div>
                        )}
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              {item.block}
                            </p>

                            <h2 className="mt-1 text-2xl font-bold text-gray-900">
                              {item.flat_no}
                            </h2>
                          </div>

                          <span
                            className="rounded-full border px-3 py-1 text-xs font-bold"
                            style={{
                              backgroundColor:
                                style.bg,
                              color:
                                style.text,
                              borderColor:
                                style.border,
                            }}
                          >
                            {
                              item.collection_status
                            }
                          </span>
                        </div>

                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <p className="text-sm text-gray-500">
                            Resident
                          </p>

                          <p className="mt-1 font-medium text-gray-900">
                            {item.name.startsWith(
                              "Collection -"
                            )
                              ? "Not provided"
                              : item.name}
                          </p>

                          <p className="mt-3 text-sm text-gray-500">
                            Collection Date
                          </p>

                          <p className="mt-1 text-sm text-gray-900">
                            {formatDate(
                              item.created_at
                            )}
                          </p>
                        </div>

                        <Link
                          href={`/contribute/committee?block=${encodeURIComponent(
                            item.block
                          )}&flat=${encodeURIComponent(
                            item.flat_no
                          )}&status=Pay%20Now`}
                          className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#bd0613] px-4 py-3 font-semibold text-white transition hover:bg-[#a80511]"
                        >
                          Pay Now
                        </Link>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}

        {/* Result count */}
        {!loading &&
          filteredRecords.length > 0 && (
            <p className="mt-5 text-center text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {filteredRecords.length}
              </span>{" "}
              pending collection
              {filteredRecords.length !== 1
                ? "s"
                : ""}
            </p>
          )}
      </div>
    </main>
  );
}