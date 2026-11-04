"use client";

import { useMemo, useState } from "react";

type ExpenseDocument = {
  id: string;
  expense_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  legacy?: boolean;
};

type Expense = {
  id: string;
  title: string;
  category: string | null;
  paid_to: string | null;
  amount: number | string | null;
  expense_date: string | null;
  documents?: ExpenseDocument[];
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

function formatSize(size: number | null) {
  if (!size) return "";

  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FinancialExpenseList({
  expenses,
}: {
  expenses: Expense[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const expensesWithBills = useMemo(
    () => expenses.filter((expense) => (expense.documents || []).length > 0),
    [expenses]
  );

  const allSelected =
    expensesWithBills.length > 0 &&
    expensesWithBills.every((expense) => selectedIds.includes(expense.id));

  function toggleExpense(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function toggleAll() {
    setSelectedIds(
      allSelected ? [] : expensesWithBills.map((expense) => expense.id)
    );
  }

  async function downloadBills(ids: string[]) {
    if (!ids.length || downloading) return;

    setDownloading(true);
    setError("");

    try {
      const response = await fetch("/api/financials/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseIds: ids }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Unable to download bills.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "BUH-Expense-Bills.zip";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to download bills."
      );
    } finally {
      setDownloading(false);
    }
  }

  const total = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return (
    <section className="mt-6 rounded-3xl border border-[#ead9c7] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#a77a2b]">
            EXPENSES
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#761019]">
            Expense List
          </h2>
          <p className="mt-1 text-sm text-[#766457]">
            Bills attached to each recorded expense.
          </p>
        </div>

        <div className="rounded-xl bg-[#fff8ee] px-4 py-2 text-right">
          <p className="text-[10px] text-[#8c7868]">Total</p>
          <p className="font-bold text-[#761019]">{money(total)}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fffaf2] p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#392823]">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 accent-[#761019]"
          />
          Select all expenses with bills
        </label>

        <button
          type="button"
          disabled={!selectedIds.length || downloading}
          onClick={() => void downloadBills(selectedIds)}
          className="rounded-lg bg-[#761019] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5b0c13] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <i className="fa-solid fa-file-zipper mr-2" />
          {downloading
            ? "Preparing ZIP..."
            : `Download Selected (${selectedIds.length})`}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#ead9c7] text-[10px] uppercase tracking-[0.12em] text-[#8c7868]">
              <th className="px-3 py-3">Select</th>
              <th className="px-3 py-3">Expense</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Paid To</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Attached Bills</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((expense) => {
              const documents = expense.documents || [];

              return (
                <tr
                  key={expense.id}
                  className="border-b border-[#f1e7da] align-top hover:bg-[#fffaf2]"
                >
                  <td className="px-3 py-4">
                    {documents.length > 0 && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(expense.id)}
                        onChange={() => toggleExpense(expense.id)}
                        aria-label={`Select bills for ${expense.title}`}
                        className="h-4 w-4 accent-[#761019]"
                      />
                    )}
                  </td>

                  <td className="px-3 py-4 font-semibold text-[#392823]">
                    {expense.title}
                  </td>

                  <td className="px-3 py-4 text-[#766457]">
                    {expense.category || "—"}
                  </td>

                  <td className="px-3 py-4 text-[#766457]">
                    {expense.paid_to || "—"}
                  </td>

                  <td className="px-3 py-4 font-bold text-[#a70e18]">
                    {money(Number(expense.amount || 0))}
                  </td>

                  <td className="px-3 py-4 text-[#766457]">
                    {formatDate(expense.expense_date)}
                  </td>

                  <td className="px-3 py-4">
                    {documents.length ? (
                      <div className="space-y-2">
                        {documents.map((document) => (
                          <a
                            key={document.id}
                            href={`/api/financials/bills?expenseId=${encodeURIComponent(
                              expense.id
                            )}${
                              document.legacy
                                ? ""
                                : `&documentId=${encodeURIComponent(
                                    document.id
                                  )}`
                            }`}
                            className="flex max-w-[280px] items-center gap-2 text-xs font-semibold text-[#a70e18] hover:underline"
                          >
                            <i className="fa-solid fa-file-arrow-down shrink-0" />
                            <span className="min-w-0 break-all">
                              {document.file_name}
                            </span>
                            {document.file_size ? (
                              <span className="shrink-0 text-gray-400">
                                {formatSize(document.file_size)}
                              </span>
                            ) : null}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        No bill attached
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!expenses.length && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-sm text-[#8c7868]"
                >
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-[#8c7868]">
        Bulk download includes every bill attached to the selected expenses.
      </p>
    </section>
  );
}