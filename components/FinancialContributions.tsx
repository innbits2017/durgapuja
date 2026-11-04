"use client";

import { useMemo, useState } from "react";

type Contribution = {
  id: string;
  name: string;
  block: string | null;
  flat_no: string | null;
  amount: number | string | null;
  created_at: string;
  verified_at: string | null;
};

const tabs = [
  { id: "P1", label: "Phase 1" },
  { id: "P2", label: "Phase 2" },
  { id: "VILLA", label: "Villa" },
];

function normalizeBlock(block: string | null) {
  const value = (block || "").trim().toLowerCase();

  if (["p1", "phase 1", "phase1"].includes(value)) return "P1";
  if (["p2", "phase 2", "phase2"].includes(value)) return "P2";
  if (value === "villa" || value.startsWith("villa ")) return "VILLA";

  return value.toUpperCase();
}

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export default function FinancialContributions({
  contributions,
}: {
  contributions: Contribution[];
}) {
  const [activeTab, setActiveTab] = useState("P1");

  const filtered = useMemo(
    () =>
      contributions
        .filter((item) => normalizeBlock(item.block) === activeTab)
        .sort((a, b) =>
          (a.flat_no || "").localeCompare(b.flat_no || "", undefined, {
            numeric: true,
            sensitivity: "base",
          })
        ),
    [contributions, activeTab]
  );

  const total = filtered.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return (
    <section className="mt-6 rounded-3xl border border-[#ead9c7] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
          <p className="font-bold text-[#761019]">{filtered.length}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-[#761019] text-white"
                : "border border-[#ead9c7] bg-white text-[#766457] hover:bg-[#fff8ee]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap justify-between gap-2 rounded-xl bg-[#fffaf2] p-4">
        <span className="text-sm text-[#766457]">
          {tabs.find((tab) => tab.id === activeTab)?.label} Collection
        </span>
        <span className="font-bold text-[#761019]">{money(total)}</span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#ead9c7] text-[10px] uppercase tracking-wider text-[#8c7868]">
              <th className="px-3 py-3">Resident</th>
              <th className="px-3 py-3">Flat</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Verified On</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#f1e7da] hover:bg-[#fffaf2]"
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
                  {item.verified_at
                    ? new Date(item.verified_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "—"}
                </td>
              </tr>
            ))}

            {!filtered.length && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-10 text-center text-[#8c7868]"
                >
                  No verified contributions found for this phase.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}