"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

/* ============================================================
   TYPES
============================================================ */

type LastYearPaid = {
  block: string;
  flat_no: string;
  resident_type: string | null;
  amount: number;
};

type ComparisonFilter =
  | "all"
  | "continued"
  | "followup"
  | "new"
  | "notpaid";

type Contribution = {
  id: string;
  name: string;
  block: string | null;
  flat_no: string;
  resident_type: string | null;
  mobile: string;
  amount: number;
  collection_status: string | null;
  payment_method: string | null;
  utr: string | null;
  paid_to: string | null;
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


type CulturalProgram = {
  id: string;
  registration_no: string;
  participant_name: string;
  age: number;
  block: string;
  flat_no: string;
  participant_type: string;
  mobile: string;
  email: string | null;
  performance_type: string;
  group_name: string | null;
  category: string;
  performance_title: string;
  description: string | null;
  duration: string;
  status: string;
  slot_number: number | null;
  created_at: string;
  updated_at?: string | null;
};

type SevaRegistration = {
  id: string;
  seva_no: string;
  name: string;
  block: string;
  flat_no: string;
  mobile: string;
  materials: Array<{
    type?: string;
    title?: string;
    package?: string | null;
    quantity?: number | string | null;
    unit?: string | null;
    price?: number | string | null;
    day?: string | null;
  }>;
  volunteer_roles: string[];
  volunteer_role_names: string[];
  volunteer_note: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

function getMaterialPrice(
  material: SevaRegistration["materials"][number]
) {
  return Number(material.price || 0);
}

function getSevaMaterialTotal(
  item: SevaRegistration
) {
  return (item.materials || []).reduce(
    (sum, material) =>
      sum + getMaterialPrice(material),
    0
  );
}

type SevaStatusFilter =
  | "all"
  | "pending"
  | "contacted"
  | "confirmed"
  | "completed"
  | "rejected";

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

/*
 * This is the display-level row.
 *
 * A row exists for EVERY flat.
 *
 * contribution = null means:
 * the flat has no current-year contribution.
 */
type FlatRow = {
  id: string;

  name: string;
  block: string;
  flat_no: string;

  last_year_amount: number | null;

  resident_type: string | null;
  mobile: string;

  collection_status: string | null;
  payment_method: string | null;

  amount: number | null;

  utr: string | null;
  paid_to: string | null;

  created_at: string | null;
  status: string | null;

  contribution: Contribution | null;
};

type Section =
  | "overview"
  | "contributions"
  | "culturalProgram"
  | "seva"
  | "inventory"
  | "donations"
  | "expenses"
  | "lastYear";

type Filter =
  | "all"
  | "pending"
  | "verified"
  | "rejected";

type BlockFilter =
  | "all"
  | "P1"
  | "P2"
  | "Villa";

type CollectionFilter =
  | "all"
  | "Pay Now"
  | "Door Lock"
  | "Follow-up"
  | "Not Interested";

type PaymentFilter =
  | "all"
  | "upi"
  | "cash";

type CulturalStatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

type CulturalPerformanceFilter =
  | "all"
  | "Individual"
  | "Group";

/* ============================================================
   MASTER FLAT LIST
============================================================ */

/*
 * Generate flat numbers such as:
 *
 * 001, 002, 003...
 * 101, 102, 103...
 */
function generateFlats(
  start: number,
  end: number
) {
  return Array.from(
    {
      length: end - start + 1,
    },
    (_, index) =>
      String(start + index).padStart(3, "0")
  );
}

/*
 * MASTER FLAT LIST
 *
 * IMPORTANT:
 * This is only used to DISPLAY all flats.
 *
 * It does NOT insert anything into Supabase.
 */
const ALL_FLATS = {
  P1: [
    ...generateFlats(101, 112),
    ...generateFlats(201, 212),
    ...generateFlats(301, 312),
    ...generateFlats(401, 412),
  ],

  P2: [
    ...generateFlats(101, 167),
    ...generateFlats(201, 267),
    ...generateFlats(301, 367),
    ...generateFlats(401, 467),
  ],

  Villa: [
    "001",
    "002",
    "003",
    "004",
  ],
};

/* ============================================================
   CATEGORIES
============================================================ */

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


/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function DashboardClient({
  initialContributions,
  initialDonations,
  initialExpenses,
  initialLastYearPaid,
  initialCulturalPrograms,
  initialSevaRegistrations,
}: {
  initialContributions: Contribution[];
  initialDonations: Donation[];
  initialExpenses: Expense[];
  initialLastYearPaid: LastYearPaid[];
  initialCulturalPrograms: CulturalProgram[];
  initialSevaRegistrations: SevaRegistration[];
}) {
  const router = useRouter();

  const supabase = useMemo(
    () => createSupabaseBrowserClient(),
    []
  );

  const [section, setSection] =
    useState<Section>("overview");

  const [contributions, setContributions] =
    useState<Contribution[]>(
      initialContributions
    );

  const lastYearPaid =
    initialLastYearPaid;

  const [donations, setDonations] =
    useState<Donation[]>(
      initialDonations
    );

  const [expenses, setExpenses] =
    useState<Expense[]>(
      initialExpenses
    );

  const [culturalPrograms, setCulturalPrograms] =
    useState<CulturalProgram[]>(
      initialCulturalPrograms
    );

  const [sevaRegistrations, setSevaRegistrations] =
    useState<SevaRegistration[]>(
      initialSevaRegistrations
    );

  const [contributionFilter, setContributionFilter] =
    useState<Filter>("all");

  const [blockFilter, setBlockFilter] =
    useState<BlockFilter>("all");

  const [collectionFilter, setCollectionFilter] =
    useState<CollectionFilter>("all");

  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilter>("all");

  const [donationFilter, setDonationFilter] =
    useState<Filter>("all");

  const [contributionSearch, setContributionSearch] =
    useState("");

  const [donationSearch, setDonationSearch] =
    useState("");

  const [expenseSearch, setExpenseSearch] =
    useState("");

  const [culturalSearch, setCulturalSearch] =
    useState("");

  const [culturalStatusFilter, setCulturalStatusFilter] =
    useState<CulturalStatusFilter>("all");

  const [culturalBlockFilter, setCulturalBlockFilter] =
    useState<BlockFilter>("all");

  const [culturalPerformanceFilter, setCulturalPerformanceFilter] =
    useState<CulturalPerformanceFilter>("all");

  const [sevaSearch, setSevaSearch] = useState("");
  const [sevaStatusFilter, setSevaStatusFilter] =
    useState<SevaStatusFilter>("all");
  const [sevaBlockFilter, setSevaBlockFilter] =
    useState<BlockFilter>("all");
  const [selectedSeva, setSelectedSeva] =
    useState<SevaRegistration | null>(null);

  const [selectedCulturalProgram, setSelectedCulturalProgram] =
    useState<CulturalProgram | null>(null);

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

  const [comparisonFilter, setComparisonFilter] =
  useState<ComparisonFilter>("all");

  /* ==========================================================
     LIVE 2026 CONTRIBUTION UPDATES
  ========================================================== */

  // Keep local state in sync when router.refresh() receives fresh
  // server data after another resident submits a contribution.
  useEffect(() => {
    setContributions(initialContributions);
  }, [initialContributions]);

  useEffect(() => {
    setCulturalPrograms(initialCulturalPrograms);
  }, [initialCulturalPrograms]);

  useEffect(() => {
    setSevaRegistrations(initialSevaRegistrations);
  }, [initialSevaRegistrations]);

  useEffect(() => {
    const refreshDashboard = () => {
      router.refresh();
    };

    // Refresh regularly so a new 2026 payment/submission appears
    // on the dashboard without the admin needing to reload manually.
    const interval = window.setInterval(
      refreshDashboard,
      10000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [router]);

  /* ==========================================================
     CONTRIBUTION STATS
  ========================================================== */

  const contributionStats =
    useMemo(() => {
      const verified =
        contributions.filter(
          (item) =>
            item.status === "verified"
        );

      const pending =
        contributions.filter(
          (item) =>
            item.status === "pending"
        );

      const rejected =
        contributions.filter(
          (item) =>
            item.status === "rejected"
        );

      const collectionSummary = {
        payNow: contributions.filter(
          (item) =>
            item.collection_status ===
            "Pay Now"
        ),

        doorLock: contributions.filter(
          (item) =>
            item.collection_status ===
            "Door Lock"
        ),

        followUp: contributions.filter(
          (item) =>
            item.collection_status ===
            "Follow-up"
        ),

        notInterested:
          contributions.filter(
            (item) =>
              item.collection_status ===
              "Not Interested"
          ),
      };

      return {
        count: contributions.length,

        verifiedCount:
          verified.length,

        verifiedAmount:
          verified.reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount || 0
              ),
            0
          ),

        pendingCount:
          pending.length,

        pendingAmount:
          pending.reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount || 0
              ),
            0
          ),

        rejectedCount:
          rejected.length,

        collectionSummary,
      };
    }, [contributions]);

  /* ==========================================================
     DONATION STATS
  ========================================================== */

  const donationStats =
    useMemo(() => {
      const verified =
        donations.filter(
          (item) =>
            item.status === "verified"
        );

      const pending =
        donations.filter(
          (item) =>
            item.status === "pending"
        );

      const rejected =
        donations.filter(
          (item) =>
            item.status === "rejected"
        );

      return {
        count: donations.length,

        verifiedCount:
          verified.length,

        verifiedAmount:
          verified.reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount || 0
              ),
            0
          ),

        pendingCount:
          pending.length,

        pendingAmount:
          pending.reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount || 0
              ),
            0
          ),

        rejectedCount:
          rejected.length,
      };
    }, [donations]);

  /* ==========================================================
     EXPENSE STATS
  ========================================================== */

  const expenseStats =
    useMemo(() => {
      const total =
        expenses.reduce(
          (sum, item) =>
            sum +
            Number(
              item.amount || 0
            ),
          0
        );

      return {
        count: expenses.length,
        total,
      };
    }, [expenses]);

  /* ==========================================================
     CULTURAL PROGRAM STATS
  ========================================================== */

  const culturalStats = useMemo(() => {
    const pending = culturalPrograms.filter(
      (item) => item.status === "pending"
    );

    const approved = culturalPrograms.filter(
      (item) => item.status === "approved"
    );

    const rejected = culturalPrograms.filter(
      (item) => item.status === "rejected"
    );

    return {
      total: culturalPrograms.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
    };
  }, [culturalPrograms]);

  /* ==========================================================
     SEVA STATS
  ========================================================== */

  const sevaStats = useMemo(() => {
    const pending = sevaRegistrations.filter((item) => item.status === "pending");
    const contacted = sevaRegistrations.filter((item) => item.status === "contacted");
    const confirmed = sevaRegistrations.filter((item) => item.status === "confirmed");
    const completed = sevaRegistrations.filter((item) => item.status === "completed");
    const rejected = sevaRegistrations.filter((item) => item.status === "rejected");

    return {
      total: sevaRegistrations.length,
      pending: pending.length,
      contacted: contacted.length,
      confirmed: confirmed.length,
      completed: completed.length,
      rejected: rejected.length,
    };
  }, [sevaRegistrations]);

  const filteredSevaRegistrations = useMemo(() => {
    const term = sevaSearch.trim().toLowerCase();

    return sevaRegistrations.filter((item) => {
      const matchesStatus =
        sevaStatusFilter === "all" || item.status === sevaStatusFilter;
      const matchesBlock =
        sevaBlockFilter === "all" || item.block === sevaBlockFilter;

      if (!matchesStatus || !matchesBlock) return false;
      if (!term) return true;

      return [
        item.seva_no,
        item.name,
        item.block,
        item.flat_no,
        item.mobile,
        item.volunteer_note || "",
        ...(item.volunteer_role_names || []),
        ...(item.materials || []).map((material) =>
          [material.title || "", material.quantity ?? "", material.unit || ""].join(" ")
        ),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [sevaRegistrations, sevaSearch, sevaStatusFilter, sevaBlockFilter]);

  /* ==========================================================
     FINANCIAL STATS
  ========================================================== */

  const financialStats =
    useMemo(() => {
      const verifiedFunds =
        contributionStats.verifiedAmount +
        donationStats.verifiedAmount;

      const remaining =
        verifiedFunds -
        expenseStats.total;

      return {
        verifiedFunds,
        remaining,
      };
    }, [
      contributionStats.verifiedAmount,
      donationStats.verifiedAmount,
      expenseStats.total,
    ]);

  /* ==========================================================
     CREATE MASTER LIST OF ALL FLATS
  ========================================================== */

  const allFlatRows =
    useMemo<FlatRow[]>(() => {
      const rows: FlatRow[] = [];

      const blocks: Array<
        keyof typeof ALL_FLATS
      > = [
        "P1",
        "P2",
        "Villa",
      ];

      blocks.forEach((block) => {
        ALL_FLATS[block].forEach(
          (flat) => {
            /*
             * Find current-year contribution.
             *
             * If none exists, contribution = null.
             */
            const matchingContributions =
              contributions.filter(
                (item) =>
                  item.block === block &&
                  String(
                    item.flat_no
                  ).padStart(
                    3,
                    "0"
                  ) === flat
              );

            /*
             * Keep latest current-year
             * contribution.
             */
            const contribution =
              matchingContributions.sort(
                (a, b) =>
                  new Date(
                    b.created_at
                  ).getTime() -
                  new Date(
                    a.created_at
                  ).getTime()
              )[0] || null;

            /*
             * Find last-year record.
             */
            const lastYearRecords =
              lastYearPaid.filter(
                (item) =>
                  item.block ===
                    block &&
                  String(
                    item.flat_no
                  ).padStart(
                    3,
                    "0"
                  ) === flat
              );

            let lastYearRecord =
              lastYearRecords[0] ||
              null;

            /*
             * Prefer matching resident type
             * when available.
             */
            if (
              contribution?.resident_type &&
              lastYearRecords.length
            ) {
              const exactMatch =
                lastYearRecords.find(
                  (item) =>
                    item.resident_type ===
                    contribution.resident_type
                );

              if (exactMatch) {
                lastYearRecord =
                  exactMatch;
              }
            }

            rows.push({
              id:
                contribution?.id ||
                `flat-${block}-${flat}`,

              name:
                contribution?.name ||
                "—",

              block,

              flat_no: flat,

              last_year_amount:
                lastYearRecord
                  ? Number(
                      lastYearRecord.amount
                    )
                  : null,

              resident_type:
                contribution?.resident_type ||
                lastYearRecord?.resident_type ||
                null,

              mobile:
                contribution?.mobile ||
                "",

              collection_status:
                contribution?.collection_status ||
                null,

              payment_method:
                contribution?.payment_method ||
                null,

              amount:
                contribution
                  ? Number(
                      contribution.amount
                    )
                  : null,

              utr:
                contribution?.utr ||
                null,

              paid_to:
                contribution?.paid_to ||
                null,

              created_at:
                contribution?.created_at ||
                null,

              status:
                contribution?.status ||
                null,

              contribution,
            });
          }
        );
      });

      return rows;
    }, [
      contributions,
      lastYearPaid,
    ]);

  /* ==========================================================
     FILTERED CONTRIBUTIONS
  ========================================================== */

  const filteredContributions =
    useMemo(() => {
      const search =
        contributionSearch
          .trim()
          .toLowerCase();

      return allFlatRows.filter(
        (item) => {
          /*
           * Search
           */
          if (search) {
            const searchable = [
              item.name,
              item.block,
              item.flat_no,
              item.resident_type ||
                "",
              item.mobile,
              item.collection_status ||
                "",
              item.payment_method ||
                "",
              item.utr || "",
              item.paid_to || "",
              item.status || "",
            ]
              .join(" ")
              .toLowerCase();

            if (
              !searchable.includes(
                search
              )
            ) {
              return false;
            }
          }

          /*
           * Block
           */
          if (
            blockFilter !== "all" &&
            item.block !== blockFilter
          ) {
            return false;
          }

          /*
           * Status
           *
           * When All is selected:
           * every flat remains visible.
           *
           * When Pending / Verified /
           * Rejected is selected:
           * only actual contribution
           * records matching that status
           * are shown.
           */
          if (
            contributionFilter !==
            "all"
          ) {
            if (
              item.status !==
              contributionFilter
            ) {
              return false;
            }
          }

          /*
           * Collection
           */
          if (
            collectionFilter !==
            "all"
          ) {
            if (
              item.collection_status !==
              collectionFilter
            ) {
              return false;
            }
          }

          /*
           * Payment
           */
          if (
            paymentFilter !==
            "all"
          ) {
            if (
              item.payment_method !==
              paymentFilter
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      allFlatRows,
      contributionSearch,
      blockFilter,
      contributionFilter,
      collectionFilter,
      paymentFilter,
    ]);

  /* ==========================================================
     DONATION FILTER
  ========================================================== */

  const filteredDonations =
    useMemo(() => {
      const term =
        donationSearch
          .trim()
          .toLowerCase();

      return donations.filter(
        (item) => {
          const matchesFilter =
            donationFilter ===
              "all" ||
            item.status ===
              donationFilter;

          if (!matchesFilter) {
            return false;
          }

          if (!term) {
            return true;
          }

          return [
            item.donor_name,
            item.organisation_name ||
              "",
            item.donor_type,
            item.mobile,
            item.utr || "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(term);
        }
      );
    }, [
      donations,
      donationFilter,
      donationSearch,
    ]);

  /* ==========================================================
     EXPENSE FILTER
  ========================================================== */

  const filteredExpenses =
    useMemo(() => {
      const term =
        expenseSearch
          .trim()
          .toLowerCase();

      if (!term) {
        return expenses;
      }

      return expenses.filter(
        (item) =>
          [
            item.title,
            item.category,
            item.paid_to || "",
            item.payment_mode,
            item.reference_no ||
              "",
            item.notes || "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(term)
      );
    }, [
      expenses,
      expenseSearch,
    ]);

  /* ==========================================================
     CULTURAL PROGRAM FILTER
  ========================================================== */

  const filteredCulturalPrograms = useMemo(() => {
    const term = culturalSearch.trim().toLowerCase();

    return culturalPrograms.filter((item) => {
      const matchesStatus =
        culturalStatusFilter === "all" ||
        item.status === culturalStatusFilter;

      const matchesBlock =
        culturalBlockFilter === "all" ||
        item.block === culturalBlockFilter;

      const matchesPerformance =
        culturalPerformanceFilter === "all" ||
        item.performance_type === culturalPerformanceFilter;

      if (
        !matchesStatus ||
        !matchesBlock ||
        !matchesPerformance
      ) {
        return false;
      }

      if (!term) return true;

      return [
        item.registration_no,
        item.participant_name,
        item.age,
        item.block,
        item.flat_no,
        item.participant_type,
        item.mobile,
        item.email ?? "",
        item.performance_type,
        item.group_name ?? "",
        item.category,
        item.performance_title,
        item.description ?? "",
        item.duration,
        item.status,
        item.slot_number ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [
    culturalPrograms,
    culturalSearch,
    culturalStatusFilter,
    culturalBlockFilter,
    culturalPerformanceFilter,
  ]);

  /* ==========================================================
     LAST YEAR VS 2026 COMPARISON
  ========================================================== */

  const collectionComparison = useMemo(() => {
    type ComparisonRow = {
      key: string;
      block: string;
      flat_no: string;
      resident_type: string | null;
      lastYearAmount: number | null;
      currentAmount: number | null;
      currentStatus: string | null;
      category: "continued" | "followup" | "new" | "notpaid";
    };

    const normalizeFlat = (value: string | number | null | undefined) => {
      const text = String(value ?? "").trim();
      const match = text.match(/\d+/);
      if (!match) return "";
      return match[0].padStart(3, "0");
    };

    // Current-year records: latest non-rejected contribution per flat.
    const currentByFlat = new Map<string, Contribution>();

    contributions.forEach((item) => {
      if (
        item.status === "rejected" ||
        !item.block ||
        !item.flat_no
      ) {
        return;
      }

      const flat = normalizeFlat(item.flat_no);
      if (!flat) return;

      const key = `${item.block}-${flat}`;
      const existing = currentByFlat.get(key);

      if (
        !existing ||
        new Date(item.created_at).getTime() >
          new Date(existing.created_at).getTime()
      ) {
        currentByFlat.set(key, item);
      }
    });

    // Historical records are stored only for flats that paid in 2025.
    // If there are multiple historical entries for the same flat,
    // combine them so one flat still produces one comparison row.
    const historicalByFlat = new Map<
      string,
      {
        block: string;
        flat_no: string;
        resident_type: string | null;
        amount: number;
      }
    >();

    lastYearPaid.forEach((item) => {
      const flat = normalizeFlat(item.flat_no);
      if (!item.block || !flat) return;

      const key = `${item.block}-${flat}`;
      const existing = historicalByFlat.get(key);

      if (existing) {
        existing.amount += Number(item.amount || 0);
        if (!existing.resident_type && item.resident_type) {
          existing.resident_type = item.resident_type;
        }
      } else {
        historicalByFlat.set(key, {
          block: item.block,
          flat_no: flat,
          resident_type: item.resident_type || null,
          amount: Number(item.amount || 0),
        });
      }
    });

    const rows: ComparisonRow[] = [];

    // IMPORTANT: start from ALL_FLATS, not lastYearPaid.
    // This guarantees every flat appears even when there is no
    // 2025 record and no 2026 contribution.
    (Object.keys(ALL_FLATS) as Array<keyof typeof ALL_FLATS>).forEach(
      (block) => {
        ALL_FLATS[block].forEach((flat) => {
          const key = `${block}-${flat}`;
          const history = historicalByFlat.get(key);
          const current = currentByFlat.get(key);

          const lastYearAmount = history
            ? Number(history.amount || 0)
            : null;

          const currentAmount = current
            ? Number(current.amount || 0)
            : null;

          let category: ComparisonRow["category"];

          if (history && current) {
            category = "continued";
          } else if (history && !current) {
            category = "followup";
          } else if (!history && current) {
            category = "new";
          } else {
            category = "notpaid";
          }

          rows.push({
            key,
            block,
            flat_no: flat,
            resident_type:
              current?.resident_type ||
              history?.resident_type ||
              null,
            lastYearAmount,
            currentAmount,
            currentStatus: current?.status || null,
            category,
          });
        });
      }
    );

    const continued = rows.filter(
      (row) => row.category === "continued"
    );

    const followup = rows.filter(
      (row) => row.category === "followup"
    );

    const newContributors = rows.filter(
      (row) => row.category === "new"
    );

    const notPaid = rows.filter(
      (row) => row.category === "notpaid"
    );

    return {
      rows,
      filteredRows: rows.filter(
        (row) =>
          comparisonFilter === "all" ||
          row.category === comparisonFilter
      ),
      continued,
      followup,
      newContributors,
      notPaid,
      paidLastYearCount: historicalByFlat.size,
      paidLastYearAmount: Array.from(
        historicalByFlat.values()
      ).reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
      followupAmount: followup.reduce(
        (sum, row) => sum + Number(row.lastYearAmount || 0),
        0
      ),
      continuedAmount: continued.reduce(
        (sum, row) => sum + Number(row.currentAmount || 0),
        0
      ),
      newAmount: newContributors.reduce(
        (sum, row) => sum + Number(row.currentAmount || 0),
        0
      ),
    };
  }, [lastYearPaid, contributions, comparisonFilter]);

  /* ==========================================================
     HELPERS
  ========================================================== */

  const money = (
    value: number
  ) =>
    `₹${Number(
      value
    ).toLocaleString(
      "en-IN"
    )}`;

  /* ==========================================================
     UPDATE CONTRIBUTION
  ========================================================== */

  async function updateContributionStatus(
    id: string,
    status:
      | "verified"
      | "rejected"
  ) {
    setLoadingId(id);
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/admin/contributions/verify",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id,
              status,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setMessage(
          result.error ||
            "Unable to update contribution."
        );

        return;
      }

      setContributions(
        (current) =>
          current.map(
            (item) =>
              item.id === id
                ? {
                    ...item,
                    status,
                    verified_at:
                      status ===
                      "verified"
                        ? new Date().toISOString()
                        : null,
                  }
                : item
          )
      );

      setMessage(
        status ===
          "verified"
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

  /* ==========================================================
     UPDATE SEVA
  ========================================================== */

  async function updateSevaStatus(
    id: string,
    status: "contacted" | "confirmed" | "completed" | "rejected"
  ) {
    setLoadingId(id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/seva/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Unable to update Seva registration.");
        return;
      }

      const updated = result.seva as SevaRegistration | undefined;

      setSevaRegistrations((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updated_at: new Date().toISOString(),
                ...(updated || {}),
              }
            : item
        )
      );

      setSelectedSeva((current) =>
        current?.id === id
          ? {
              ...current,
              status,
              updated_at: new Date().toISOString(),
              ...(updated || {}),
            }
          : current
      );

      setMessage(
        status === "confirmed"
          ? "Seva registration confirmed successfully."
          : status === "completed"
            ? "Seva marked as completed."
            : status === "contacted"
              ? "Seva marked as contacted."
              : "Seva registration rejected."
      );
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  function getMaterialPrice(material: SevaRegistration["materials"][number]) {
    return Number(material.price || 0);
  }

  function getSevaMaterialTotal(item: SevaRegistration) {
    return (item.materials || []).reduce(
      (sum, material) => sum + getMaterialPrice(material),
      0
    );
  }

  function formatSevaMaterial(material: SevaRegistration["materials"][number]) {
    const parts = [
      material.title || "",
      material.package || (material.quantity ? `${material.quantity}${material.unit ? ` ${material.unit}` : ""}` : ""),
      material.day || "",
    ].filter(Boolean);

    const price = getMaterialPrice(material);
    if (price > 0) {
      parts.push(`₹${price.toLocaleString("en-IN")}`);
    }

    return parts.join(" · ");
  }

  function exportSevaRegistrations() {
    const rows = filteredSevaRegistrations.map((item) => ({
      "Seva ID": item.seva_no,
      Name: item.name,
      Block: item.block,
      "Flat No.": item.flat_no,
      Mobile: item.mobile,
      "Material Seva": (item.materials || [])
        .map((material) => formatSevaMaterial(material))
        .join("; "),
      "Material Seva Total": getSevaMaterialTotal(item),
      "Volunteer Seva": (item.volunteer_role_names || []).join("; "),
      "Volunteer Note": item.volunteer_note || "",
      Status: item.status,
      "Admin Note": item.admin_note || "",
      "Registered On": formatDateTime(item.created_at),
      "Updated On": formatDateTime(item.updated_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 18 }, { wch: 24 }, { wch: 10 }, { wch: 12 }, { wch: 15 },
      { wch: 55 }, { wch: 20 }, { wch: 55 }, { wch: 35 }, { wch: 14 }, { wch: 35 },
      { wch: 22 }, { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Seva Registrations");
    XLSX.writeFile(
      workbook,
      `BUH-Seva-Registrations-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  /* ==========================================================
     UPDATE DONATION
  ========================================================== */

  async function updateDonationStatus(
    id: string,
    status:
      | "verified"
      | "rejected"
  ) {
    setLoadingId(id);
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/admin/donations/verify",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id,
              status,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setMessage(
          result.error ||
            "Unable to update donation."
        );

        return;
      }

      setDonations(
        (current) =>
          current.map(
            (item) =>
              item.id === id
                ? {
                    ...item,
                    status,
                    verified_at:
                      status ===
                      "verified"
                        ? new Date().toISOString()
                        : null,
                  }
                : item
          )
      );

      setMessage(
        status ===
          "verified"
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

  /* ==========================================================
     UPDATE CULTURAL PROGRAM
  ========================================================== */

  async function updateCulturalProgramStatus(
    id: string,
    status: "approved" | "rejected"
  ) {
    setLoadingId(id);
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/cultural-program/verify",
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
            "Unable to update cultural program."
        );
        return;
      }

      setCulturalPrograms((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );

      setSelectedCulturalProgram((current) =>
        current?.id === id
          ? {
              ...current,
              status,
              updated_at: new Date().toISOString(),
            }
          : current
      );

      setMessage(
        status === "approved"
          ? "Cultural program approved successfully."
          : "Cultural program rejected."
      );
    } catch {
      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoadingId(null);
    }
  }

  function exportCulturalPrograms() {
    const rows = filteredCulturalPrograms.map((item) => ({
      "Registration ID": item.registration_no,
      "Slot No.": item.slot_number ?? "",
      Participant: item.participant_name,
      Age: item.age,
      Block: item.block,
      "Flat No.": item.flat_no,
      "Participant Type": item.participant_type,
      Mobile: item.mobile,
      Email: item.email || "",
      "Performance Type": item.performance_type,
      "Group Name": item.group_name || "",
      Category: item.category,
      "Performance Title": item.performance_title,
      Duration: item.duration,
      Description: item.description || "",
      Status: item.status,
      "Registered On": formatDateTime(item.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 20 }, // Registration ID
      { wch: 10 }, // Slot No.
      { wch: 24 },
      { wch: 8 },
      { wch: 10 },
      { wch: 12 },
      { wch: 18 },
      { wch: 15 },
      { wch: 28 },
      { wch: 18 },
      { wch: 22 },
      { wch: 20 },
      { wch: 28 },
      { wch: 20 },
      { wch: 40 },
      { wch: 12 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Cultural Programs"
    );

    XLSX.writeFile(
      workbook,
      `BUH-Cultural-Programs-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  }

  /* ==========================================================
     DELETE EXPENSE
  ========================================================== */

  async function deleteExpense(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this expense?"
      );

    if (!confirmed) {
      return;
    }

    setLoadingId(id);
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/expenses",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setMessage(
          result.error ||
            "Unable to delete expense."
        );

        return;
      }

      setExpenses(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id
          )
      );

      setMessage(
        "Expense deleted successfully."
      );
    } catch {
      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoadingId(null);
    }
  }

  /* ==========================================================
     LOGOUT
  ========================================================== */

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

    router.replace(
      "/admin/login"
    );

    router.refresh();
  }

  /* ==========================================================
     LAST YEAR AMOUNT
  ========================================================== */

  function getLastYearPaid(
    item: FlatRow
  ) {
    if (
      item.last_year_amount !==
      null
    ) {
      return item.last_year_amount;
    }

    return null;
  }

  /* ==========================================================
     EXPORT CONTRIBUTIONS
  ========================================================== */

  function exportContributions() {
    const rows =
      filteredContributions.map(
        (item) => ({
          Block: item.block,

          "Flat No.":
            item.flat_no,

          Resident:
            item.name === "—"
              ? ""
              : item.name,

          "Last Year Paid":
            item.last_year_amount ===
            null
              ? "Not Paid"
              : Number(
                  item.last_year_amount
                ),

          "Resident Type":
            item.resident_type ||
            "",

          Mobile:
            item.mobile,

          "Collection Status":
            item.collection_status ||
            "",

          "Payment Method":
            item.payment_method ===
            "upi"
              ? "UPI / Online"
              : item.payment_method ===
                  "cash"
                ? "Cash"
                : "",

          Amount:
            item.amount === null
              ? ""
              : Number(
                  item.amount
                ),

          UTR:
            item.payment_method ===
            "upi"
              ? item.utr || ""
              : "",

          "Paid To":
            item.payment_method ===
            "cash"
              ? item.paid_to || ""
              : "",

          Status:
            item.status ||
            "Not Paid",

          "Submitted On":
            item.created_at
              ? new Date(
                  item.created_at
                ).toLocaleString(
                  "en-IN"
                )
              : "",

          "Verified On":
            item.contribution?.verified_at
              ? new Date(
                  item.contribution.verified_at
                ).toLocaleString(
                  "en-IN"
                )
              : "",
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 12 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
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
      `BUH-Contributions-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  }

  /* ==========================================================
     EXPORT DONATIONS
  ========================================================== */

  function exportDonations() {
    const rows =
      filteredDonations.map(
        (item) => ({
          Donor:
            item.donor_name,

          Organisation:
            item.organisation_name ||
            "",

          "Donor Type":
            item.donor_type,

          Mobile:
            item.mobile,

          Email:
            item.email || "",

          Location:
            item.location || "",

          Amount:
            Number(item.amount),

          Type:
            item.donation_type,

          UTR:
            item.utr || "",

          Status:
            item.status,

          "Submitted On":
            new Date(
              item.created_at
            ).toLocaleString(
              "en-IN"
            ),

          "Verified On":
            item.verified_at
              ? new Date(
                  item.verified_at
                ).toLocaleString(
                  "en-IN"
                )
              : "",
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

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

  /* ==========================================================
     EXPORT EXPENSES
  ========================================================== */

  function exportExpenses() {
    const rows =
      filteredExpenses.map(
        (item) => ({
          Expense:
            item.title,

          Category:
            item.category,

          "Paid To":
            item.paid_to || "",

          Amount:
            Number(item.amount),

          Date:
            item.expense_date,

          "Payment Mode":
            item.payment_mode,

          "Reference No.":
            item.reference_no ||
            "",

          Notes:
            item.notes || "",
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

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

  /* ==========================================================
     EXPORT FINANCIAL REPORT
  ========================================================== */

  function exportFinancialReport() {
    const workbook =
      XLSX.utils.book_new();

    const summary = [
      {
        Particular:
          "Verified Resident Contributions",

        Amount:
          contributionStats.verifiedAmount,
      },

      {
        Particular:
          "Verified External Support",

        Amount:
          donationStats.verifiedAmount,
      },

      {
        Particular:
          "Total Verified Funds",

        Amount:
          financialStats.verifiedFunds,
      },

      {
        Particular:
          "Total Expenses",

        Amount:
          expenseStats.total,
      },

      {
        Particular:
          "Remaining Balance",

        Amount:
          financialStats.remaining,
      },
    ];

    const contributionRows =
      allFlatRows.map(
        (item) => ({
          Block:
            item.block,

          "Flat No.":
            item.flat_no,

          Name:
            item.name === "—"
              ? ""
              : item.name,

          "Last Year Paid":
            item.last_year_amount ===
            null
              ? "Not Paid"
              : Number(
                  item.last_year_amount
                ),

          "Resident Type":
            item.resident_type ||
            "",

          Mobile:
            item.mobile,

          "Collection Status":
            item.collection_status ||
            "",

          "Payment Method":
            item.payment_method ===
            "upi"
              ? "UPI / Online"
              : item.payment_method ===
                  "cash"
                ? "Cash"
                : "",

          Amount:
            item.amount === null
              ? ""
              : Number(
                  item.amount
                ),

          UTR:
            item.utr || "",

          "Paid To":
            item.paid_to || "",

          Status:
            item.status ||
            "Not Paid",

          Date:
            item.created_at
              ? new Date(
                  item.created_at
                ).toLocaleString(
                  "en-IN"
                )
              : "",
        })
      );

    const donationRows =
      donations.map(
        (item) => ({
          Donor:
            item.donor_name,

          Organisation:
            item.organisation_name ||
            "",

          "Donor Type":
            item.donor_type,

          Mobile:
            item.mobile,

          Amount:
            Number(item.amount),

          Type:
            item.donation_type,

          UTR:
            item.utr || "",

          Status:
            item.status,

          Date:
            new Date(
              item.created_at
            ).toLocaleString(
              "en-IN"
            ),
        })
      );

    const expenseRows =
      expenses.map(
        (item) => ({
          Expense:
            item.title,

          Category:
            item.category,

          "Paid To":
            item.paid_to || "",

          Amount:
            Number(item.amount),

          Date:
            item.expense_date,

          "Payment Mode":
            item.payment_mode,

          "Reference No.":
            item.reference_no ||
            "",

          Notes:
            item.notes || "",
        })
      );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        summary
      ),
      "Financial Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        contributionRows
      ),
      "All Flats"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        donationRows
      ),
      "External Support"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        expenseRows
      ),
      "Expenses"
    );

    XLSX.writeFile(
      workbook,
      `BUH-Durga-Puja-Financial-Report-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f8f1e7] text-[#292929]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* ====================================================
            HEADER
        ==================================================== */}

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
              Manage contributions,
              external support and
              expenses.
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

              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>

          </div>
        </header>

        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <nav className="mb-5 overflow-x-auto rounded-xl border border-[#eadfd2] bg-white p-1.5 shadow-sm">

          <div className="flex min-w-max gap-1">

            <NavButton
              active={
                section ===
                "overview"
              }
              onClick={() =>
                setSection(
                  "overview"
                )
              }
              icon="fa-chart-pie"
              label="Overview"
            />

            <NavButton
              active={
                section ===
                "contributions"
              }
              onClick={() =>
                setSection(
                  "contributions"
                )
              }
              icon="fa-house-user"
              label="Contributions"
            />

            <NavButton
              active={
                section ===
                "lastYear"
              }
              onClick={() =>
                setSection(
                  "lastYear"
                )
              }
              icon="fa-clock-rotate-left"
              label="Last Year Paid"
            />

            <NavButton
              active={
                section ===
                "culturalProgram"
              }
              onClick={() =>
                setSection(
                  "culturalProgram"
                )
              }
              icon="fa-masks-theater"
              label="Cultural Program"
            />

            <NavButton
              active={section === "seva"}
              onClick={() => setSection("seva")}
              icon="fa-hands-praying"
              label="Seva"
            />

            <NavButton
              active={section === "inventory"}
              onClick={() => setSection("inventory")}
              icon="fa-boxes-stacked"
              label="Inventory Help"
            />

            <NavButton
              active={
                section ===
                "donations"
              }
              onClick={() =>
                setSection(
                  "donations"
                )
              }
              icon="fa-hand-holding-heart"
              label="External Support"
            />

            <NavButton
              active={
                section ===
                "expenses"
              }
              onClick={() =>
                setSection(
                  "expenses"
                )
              }
              icon="fa-receipt"
              label="Expenses"
            />

          </div>
        </nav>

        {/* ====================================================
            MESSAGE
        ==================================================== */}

        {message && (
          <div className="mb-5 rounded-xl border border-[#ead9c7] bg-white px-4 py-3 text-sm text-[#725e3a] shadow-sm">
            {message}
          </div>
        )}

        {/* ====================================================
            OVERVIEW
        ==================================================== */}

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

            {/* FINANCIAL SUMMARY */}

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
                  onClick={
                    exportFinancialReport
                  }
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
                icon="fa-masks-theater"
                title="Cultural Programs"
                value={String(
                  culturalStats.total
                )}
                sub={`${culturalStats.pending} pending · ${culturalStats.approved} approved`}
              />

              <SmallSummary
                icon="fa-hands-praying"
                title="Seva Registrations"
                value={String(sevaStats.total)}
                sub={`${sevaStats.pending} pending · ${sevaStats.confirmed} confirmed`}
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

            {/* COLLECTION SUMMARY */}

            <section className="mt-5">

              <div className="mb-3">

                <h2 className="font-serif text-xl font-bold text-[#292929]">
                  Collection Summary
                </h2>

                <p className="mt-1 text-xs text-[#858585]">
                  Resident collection status overview
                </p>

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <CollectionSummaryCard
                  icon="fa-credit-card"
                  label="Pay Now"
                  count={
                    contributionStats.collectionSummary.payNow.length
                  }
                  amount={contributionStats.collectionSummary.payNow.reduce(
                    (sum, item) =>
                      sum +
                      Number(
                        item.amount ||
                          0
                      ),
                    0
                  )}
                  description="Residents ready to pay"
                  onClick={() => {
                    setSection(
                      "contributions"
                    );

                    setCollectionFilter(
                      "Pay Now"
                    );
                  }}
                />

                <CollectionSummaryCard
                  icon="fa-door-closed"
                  label="Door Lock"
                  count={
                    contributionStats.collectionSummary.doorLock.length
                  }
                  amount={contributionStats.collectionSummary.doorLock.reduce(
                    (sum, item) =>
                      sum +
                      Number(
                        item.amount ||
                          0
                      ),
                    0
                  )}
                  description="Residents unavailable"
                  onClick={() => {
                    setSection(
                      "contributions"
                    );

                    setCollectionFilter(
                      "Door Lock"
                    );
                  }}
                />

                <CollectionSummaryCard
                  icon="fa-phone"
                  label="Follow-up"
                  count={
                    contributionStats.collectionSummary.followUp.length
                  }
                  amount={contributionStats.collectionSummary.followUp.reduce(
                    (sum, item) =>
                      sum +
                      Number(
                        item.amount ||
                          0
                      ),
                    0
                  )}
                  description="Requires follow-up"
                  onClick={() => {
                    setSection(
                      "contributions"
                    );

                    setCollectionFilter(
                      "Follow-up"
                    );
                  }}
                />

                <CollectionSummaryCard
                  icon="fa-circle-xmark"
                  label="Not Interested"
                  count={
                    contributionStats.collectionSummary.notInterested.length
                  }
                  amount={contributionStats.collectionSummary.notInterested.reduce(
                    (sum, item) =>
                      sum +
                      Number(
                        item.amount ||
                          0
                      ),
                    0
                  )}
                  description="Residents not participating"
                  onClick={() => {
                    setSection(
                      "contributions"
                    );

                    setCollectionFilter(
                      "Not Interested"
                    );
                  }}
                />

              </div>
            </section>
          </>
        )}

        {/* ====================================================
            CONTRIBUTIONS
        ==================================================== */}

        {section ===
          "contributions" && (
          <section className="overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">

            <div className="border-b border-[#eee5db] px-4 py-4 sm:px-5">

              <div className="flex flex-col gap-3">

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                  <div>

                    <h2 className="font-serif text-xl font-bold">
                      Resident Contributions
                    </h2>

                    <p className="mt-1 text-xs text-[#858585]">
                      Showing{" "}
                      <strong>
                        {filteredContributions.length}
                      </strong>{" "}
                      of{" "}
                      <strong>
                        {allFlatRows.length}
                      </strong>{" "}
                      flats
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      exportContributions
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#23753b] px-4 text-sm font-semibold text-white"
                  >
                    <i className="fa-solid fa-file-excel" />
                    Export
                  </button>

                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">

                  <div className="relative lg:col-span-2">

                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]" />

                    <input
                      value={
                        contributionSearch
                      }
                      onChange={(e) =>
                        setContributionSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search name, flat, mobile, UTR..."
                      className="h-10 w-full rounded-lg border border-[#ddd6cd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#a70e18]"
                    />

                  </div>

                  <select
                    value={
                      contributionFilter
                    }
                    onChange={(e) =>
                      setContributionFilter(
                        e.target.value as Filter
                      )
                    }
                    className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                  >
                    <option value="all">
                      All Status
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

                  <select
                    value={
                      blockFilter
                    }
                    onChange={(e) =>
                      setBlockFilter(
                        e.target.value as BlockFilter
                      )
                    }
                    className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                  >
                    <option value="all">
                      All Blocks
                    </option>

                    <option value="P1">
                      P1
                    </option>

                    <option value="P2">
                      P2
                    </option>

                    <option value="Villa">
                      Villa
                    </option>
                  </select>

                  <select
                    value={
                      collectionFilter
                    }
                    onChange={(e) =>
                      setCollectionFilter(
                        e.target.value as CollectionFilter
                      )
                    }
                    className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                  >
                    <option value="all">
                      All Collection
                    </option>

                    <option value="Pay Now">
                      Pay Now
                    </option>

                    <option value="Door Lock">
                      Door Lock
                    </option>

                    <option value="Follow-up">
                      Follow-up
                    </option>

                    <option value="Not Interested">
                      Not Interested
                    </option>
                  </select>

                  <select
                    value={
                      paymentFilter
                    }
                    onChange={(e) =>
                      setPaymentFilter(
                        e.target.value as PaymentFilter
                      )
                    }
                    className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                  >
                    <option value="all">
                      All Payments
                    </option>

                    <option value="upi">
                      UPI / Online
                    </option>

                    <option value="cash">
                      Cash
                    </option>
                  </select>

                </div>
              </div>
            </div>

            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full min-w-[1500px] text-left">

                <thead className="bg-[#fcf8f1] text-xs uppercase tracking-wide text-[#777]">

                  <tr>

                    <th className="px-5 py-3">
                      Resident
                    </th>

                    <th className="px-4 py-3">
                      Block
                    </th>

                    <th className="px-4 py-3">
                      Flat
                    </th>

                    <th className="whitespace-nowrap px-4 py-3">
                      Last Year Paid
                    </th>

                    <th className="px-4 py-3">
                      Type
                    </th>

                    <th className="px-4 py-3">
                      Mobile
                    </th>

                    <th className="px-4 py-3">
                      Collection
                    </th>

                    <th className="px-4 py-3">
                      Payment
                    </th>

                    <th className="px-4 py-3">
                      Amount
                    </th>

                    <th className="px-4 py-3">
                      UTR / Paid To
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

                        {/* RESIDENT */}

                        <td className="px-5 py-4">

                          <div className="text-sm font-semibold">
                            {item.name}
                          </div>

                          {!item.contribution && (
                            <div className="mt-1 text-[10px] font-medium text-[#aaa]">
                              No 2026 contribution
                            </div>
                          )}

                        </td>

                        {/* BLOCK */}

                        <td className="px-4 py-4 text-sm font-semibold">
                          {item.block}
                        </td>

                        {/* FLAT */}

                        <td className="px-4 py-4 text-sm font-semibold">
                          {item.flat_no}
                        </td>

                        {/* LAST YEAR */}

                        <td className="whitespace-nowrap px-4 py-4">

                          {getLastYearPaid(
                            item
                          ) !== null ? (
                            <span className="text-sm font-bold text-[#23753b]">
                              {money(
                                getLastYearPaid(
                                  item
                                ) as number
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-[#fff1f1] px-3 py-1.5 text-xs font-semibold text-[#a70e18]">
                              Not Paid
                            </span>
                          )}

                        </td>

                        {/* TYPE */}

                        <td className="px-4 py-4 text-xs">
                          {item.resident_type ||
                            "—"}
                        </td>

                        {/* MOBILE */}

                        <td className="px-4 py-4 text-sm text-[#666]">
                          {item.mobile ||
                            "—"}
                        </td>

                        {/* COLLECTION */}

                        <td className="px-4 py-4">

                          {item.contribution ? (
                            <CollectionBadge
                              status={
                                item.collection_status
                              }
                            />
                          ) : (
                            <span className="inline-flex rounded-full bg-[#fff1f1] px-3 py-1.5 text-[11px] font-semibold text-[#a70e18]">
                              Not Paid
                            </span>
                          )}

                        </td>

                        {/* PAYMENT */}

                        <td className="px-4 py-4">

                          {item.contribution ? (
                            <PaymentBadge
                              method={
                                item.payment_method
                              }
                            />
                          ) : (
                            <span className="text-xs text-[#999]">
                              —
                            </span>
                          )}

                        </td>

                        {/* AMOUNT */}

                        <td className="whitespace-nowrap px-4 py-4 text-sm font-bold">

                          {item.amount !==
                          null
                            ? money(
                                item.amount
                              )
                            : "—"}

                        </td>

                        {/* UTR / PAID TO */}

                        <td className="max-w-[220px] px-4 py-4 text-xs text-[#666]">

                          {item.contribution ? (
                            <>
                              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#aaa]">
                                {item.payment_method ===
                                "cash"
                                  ? "Paid To"
                                  : "UTR"}
                              </div>

                              <div className="break-all">
                                {item.payment_method ===
                                "cash"
                                  ? item.paid_to ||
                                    "—"
                                  : item.utr ||
                                    "—"}
                              </div>
                            </>
                          ) : (
                            "—"
                          )}

                        </td>

                        {/* DATE */}

                        <td className="px-4 py-4 text-xs text-[#666]">

                          {item.created_at
                            ? formatDate(
                                item.created_at
                              )
                            : "—"}

                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-4">

                          {item.contribution ? (
                            <StatusBadge
                              status={
                                item.status ||
                                "pending"
                              }
                            />
                          ) : (
                            <span className="inline-flex rounded-full bg-[#fff1f1] px-3 py-1.5 text-[11px] font-semibold text-[#a70e18]">
                              Not Paid
                            </span>
                          )}

                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4 text-right">

                          {item.contribution &&
                          item.status ===
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
                          ) : item.contribution ? (
                            <span className="text-xs text-[#999]">
                              No action
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-[#fff7e8] px-3 py-1.5 text-[11px] font-semibold text-[#9a6a16]">
                              Follow-up
                            </span>
                          )}

                        </td>

                      </tr>
                    )
                  )}

                </tbody>
              </table>

            </div>

            {/* MOBILE */}

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
                          {item.block} · Flat{" "}
                          {item.flat_no}
                        </div>

                        {!item.contribution && (
                          <div className="mt-1 text-[10px] text-[#a70e18]">
                            No 2026 contribution
                          </div>
                        )}

                      </div>

                      {item.contribution ? (
                        <StatusBadge
                          status={
                            item.status ||
                            "pending"
                          }
                        />
                      ) : (
                        <span className="inline-flex rounded-full bg-[#fff1f1] px-2.5 py-1 text-[10px] font-semibold text-[#a70e18]">
                          Not Paid
                        </span>
                      )}

                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[#fcf8f1] p-3 text-xs">

                      <div>

                        <span className="text-[#888]">
                          Last Year Paid
                        </span>

                        <strong
                          className={`mt-1 block text-sm ${
                            item.last_year_amount ===
                            null
                              ? "text-[#a70e18]"
                              : "text-[#23753b]"
                          }`}
                        >
                          {item.last_year_amount ===
                          null
                            ? "Not Paid"
                            : money(
                                item.last_year_amount
                              )}
                        </strong>

                      </div>

                      <div>

                        <span className="text-[#888]">
                          Type
                        </span>

                        <strong className="mt-1 block font-medium">
                          {item.resident_type ||
                            "—"}
                        </strong>

                      </div>

                      <div>

                        <span className="text-[#888]">
                          Mobile
                        </span>

                        <strong className="mt-1 block font-medium">
                          {item.mobile ||
                            "—"}
                        </strong>

                      </div>

                      <div>

                        <span className="text-[#888]">
                          Amount
                        </span>

                        <strong className="mt-1 block text-sm">
                          {item.amount !==
                          null
                            ? money(
                                item.amount
                              )
                            : "—"}
                        </strong>

                      </div>

                      <div>

                        <span className="text-[#888]">
                          Collection
                        </span>

                        <strong className="mt-1 block font-medium">
                          {item.collection_status ||
                            "Not Paid"}
                        </strong>

                      </div>

                      <div>

                        <span className="text-[#888]">
                          Payment
                        </span>

                        <strong className="mt-1 block font-medium">
                          {item.payment_method ===
                          "cash"
                            ? "Cash"
                            : item.payment_method ===
                                "upi"
                              ? "UPI / Online"
                              : "—"}
                        </strong>

                      </div>

                      <div>

                        <span className="text-[#888]">
                          Date
                        </span>

                        <strong className="mt-1 block font-medium">
                          {item.created_at
                            ? formatDate(
                                item.created_at
                              )
                            : "—"}
                        </strong>

                      </div>

                      <div className="col-span-2">

                        <span className="text-[#888]">
                          {item.payment_method ===
                          "cash"
                            ? "Paid To"
                            : "UTR"}
                        </span>

                        <strong className="mt-1 block break-all font-medium">
                          {item.contribution
                            ? item.payment_method ===
                              "cash"
                              ? item.paid_to ||
                                "—"
                              : item.utr ||
                                "—"
                            : "—"}
                        </strong>

                      </div>

                    </div>

                    {item.contribution &&
                      item.status ===
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
              <EmptyState
                label="No flats found."
              />
            )}

          </section>
        )}

        {/* ====================================================
            LAST YEAR VS 2026
        ==================================================== */}

        {section === "lastYear" && (
          <section className="rounded-2xl border border-[#eadfd2] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold">
                  Last Year vs 2026 Collection
                </h2>
                <p className="mt-1 text-xs text-[#858585]">
                  Complete flat-wise comparison of Durga Puja 2025 and 2026.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const rows = collectionComparison.rows.map((item) => ({
                    Block: item.block,
                    "Flat No.": item.flat_no,
                    "Resident Type": item.resident_type || "",
                    "2025 Paid":
                      item.lastYearAmount === null
                        ? "Not Paid"
                        : item.lastYearAmount,
                    "2026 Amount":
                      item.currentAmount === null
                        ? "Not Paid"
                        : item.currentAmount,
                    "2026 Status":
                      item.currentAmount === null
                        ? "Not Paid"
                        : item.currentStatus === "verified"
                          ? "Paid / Verified"
                          : item.currentStatus === "pending"
                            ? "Pending Verification"
                            : item.currentStatus || "Submitted",
                    Category:
                      item.category === "continued"
                        ? "Continued Contributor"
                        : item.category === "followup"
                          ? "Follow-up"
                          : item.category === "new"
                            ? "New Contributor"
                            : "Not Paid",
                  }));

                  const worksheet = XLSX.utils.json_to_sheet(rows);
                  worksheet["!cols"] = [
                    { wch: 10 },
                    { wch: 12 },
                    { wch: 18 },
                    { wch: 16 },
                    { wch: 16 },
                    { wch: 22 },
                    { wch: 24 },
                  ];

                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    "2025 vs 2026"
                  );

                  XLSX.writeFile(
                    workbook,
                    `BUH-2025-vs-2026-Collection-${new Date()
                      .toISOString()
                      .slice(0, 10)}.xlsx`
                  );
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#23753b] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <i className="fa-solid fa-file-excel" />
                Export Comparison
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[#eadfd2] bg-[#fcf8f1] px-4 py-3 text-xs text-[#6f665d]">
              <i className="fa-solid fa-rotate mr-2 text-[#a70e18]" />
              The comparison refreshes automatically. When a new 2026 contribution is submitted, the flat moves from <strong>Follow-up</strong> or <strong>Not Paid</strong> to <strong>Continued Contributor</strong> or <strong>New Contributor</strong>.
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ComparisonStat
                label="Continued Contributor"
                value={String(collectionComparison.continued.length)}
                sub={money(collectionComparison.continuedAmount)}
                icon="fa-circle-check"
              />

              <ComparisonStat
                label="Follow-up"
                value={String(collectionComparison.followup.length)}
                sub={money(collectionComparison.followupAmount)}
                icon="fa-user-clock"
                highlight
              />

              <ComparisonStat
                label="New Contributor"
                value={String(collectionComparison.newContributors.length)}
                sub={money(collectionComparison.newAmount)}
                icon="fa-user-plus"
              />

              <ComparisonStat
                label="Not Paid"
                value={String(collectionComparison.notPaid.length)}
                sub="No payment record"
                icon="fa-circle-xmark"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { value: "all", label: "All Flats" },
                { value: "continued", label: "Continued Contributor" },
                { value: "followup", label: "Follow-up" },
                { value: "new", label: "New Contributor" },
                { value: "notpaid", label: "Not Paid" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() =>
                    setComparisonFilter(
                      filter.value as ComparisonFilter
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    comparisonFilter === filter.value
                      ? "border-[#a70e18] bg-[#a70e18] text-white"
                      : "border-[#ddd6cd] bg-white text-[#666] hover:border-[#a70e18] hover:text-[#a70e18]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-[#eee5db]">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-[#fcf8f1] text-xs uppercase tracking-wide text-[#777]">
                  <tr>
                    <th className="px-4 py-3">Block</th>
                    <th className="px-4 py-3">Flat</th>
                    <th className="px-4 py-3">Resident Type</th>
                    <th className="px-4 py-3">2025 Paid</th>
                    <th className="px-4 py-3">2026 Amount</th>
                    <th className="px-4 py-3">2026 Status</th>
                    <th className="px-4 py-3">Category</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0ebe5]">
                  {collectionComparison.filteredRows.map((item) => {
                    const categoryLabel =
                      item.category === "continued"
                        ? "Continued Contributor"
                        : item.category === "followup"
                          ? "Follow-up"
                          : item.category === "new"
                            ? "New Contributor"
                            : "Not Paid";

                    const categoryClass =
                      item.category === "continued"
                        ? "bg-[#edf8ef] text-[#23753b]"
                        : item.category === "followup"
                          ? "bg-[#fff1f1] text-[#a70e18]"
                          : item.category === "new"
                            ? "bg-[#eef5ff] text-[#245a9b]"
                            : "bg-[#f1f1f1] text-[#777]";

                    return (
                      <tr
                        key={item.key}
                        className="hover:bg-[#fffdf9]"
                      >
                        <td className="px-4 py-3 font-semibold">
                          {item.block}
                        </td>

                        <td className="px-4 py-3 font-semibold">
                          {item.flat_no}
                        </td>

                        <td className="px-4 py-3 text-xs">
                          {item.resident_type || "—"}
                        </td>

                        <td className="px-4 py-3">
                          {item.lastYearAmount === null ? (
                            <span className="text-[#a70e18]">
                              Not Paid
                            </span>
                          ) : (
                            <span className="font-bold text-[#23753b]">
                              {money(item.lastYearAmount)}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {item.currentAmount === null ? (
                            <span className="text-[#a70e18]">
                              Not Paid
                            </span>
                          ) : (
                            <span className="font-bold text-[#23753b]">
                              {money(item.currentAmount)}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {item.currentAmount === null ? (
                            <span className="inline-flex rounded-full bg-[#fff1f1] px-2.5 py-1 text-xs font-semibold text-[#a70e18]">
                              Not Paid
                            </span>
                          ) : item.currentStatus === "verified" ? (
                            <span className="inline-flex rounded-full bg-[#edf8ef] px-2.5 py-1 text-xs font-semibold text-[#23753b]">
                              Paid / Verified
                            </span>
                          ) : item.currentStatus === "pending" ? (
                            <span className="inline-flex rounded-full bg-[#fff8e7] px-2.5 py-1 text-xs font-semibold text-[#a56b00]">
                              Pending Verification
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-[#f3f3f3] px-2.5 py-1 text-xs font-semibold text-[#666]">
                              Submitted
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${categoryClass}`}
                          >
                            {categoryLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {collectionComparison.filteredRows.length === 0 && (
              <div className="mt-4 rounded-xl border border-[#eee5db] bg-[#fcf8f1] px-4 py-6 text-center text-sm text-[#777]">
                No flats found for this category.
              </div>
            )}
          </section>
        )}

        {/* ====================================================
            CULTURAL PROGRAM
        ==================================================== */}

        {section === "culturalProgram" && (
          <section className="overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">

            <div className="border-b border-[#eee5db] px-4 py-4 sm:px-5">

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h2 className="font-serif text-xl font-bold">
                    Cultural Program Registrations
                  </h2>

                  <p className="mt-1 text-xs text-[#858585]">
                    {filteredCulturalPrograms.length} shown · {culturalStats.total} total registrations
                  </p>
                </div>

                <button
                  type="button"
                  onClick={exportCulturalPrograms}
                  disabled={filteredCulturalPrograms.length === 0}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#23753b] px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <i className="fa-solid fa-file-excel" />
                  Export
                </button>

              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">

                <div className="relative lg:col-span-2">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]" />

                  <input
                    value={culturalSearch}
                    onChange={(e) =>
                      setCulturalSearch(e.target.value)
                    }
                    placeholder="Search participant, flat, performance..."
                    className="h-10 w-full rounded-lg border border-[#ddd6cd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#a70e18]"
                  />
                </div>

                <select
                  value={culturalStatusFilter}
                  onChange={(e) =>
                    setCulturalStatusFilter(
                      e.target.value as CulturalStatusFilter
                    )
                  }
                  className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={culturalBlockFilter}
                  onChange={(e) =>
                    setCulturalBlockFilter(
                      e.target.value as BlockFilter
                    )
                  }
                  className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                >
                  <option value="all">All Blocks</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="Villa">Villa</option>
                </select>

                <select
                  value={culturalPerformanceFilter}
                  onChange={(e) =>
                    setCulturalPerformanceFilter(
                      e.target.value as CulturalPerformanceFilter
                    )
                  }
                  className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                >
                  <option value="all">All Performance</option>
                  <option value="Individual">Individual</option>
                  <option value="Group">Group</option>
                </select>

              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg bg-[#fcf8f1] px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-[#999]">Total</div>
                  <div className="mt-1 text-lg font-bold">{culturalStats.total}</div>
                </div>

                <div className="rounded-lg bg-[#fff8e7] px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-[#999]">Pending</div>
                  <div className="mt-1 text-lg font-bold text-[#a56b00]">{culturalStats.pending}</div>
                </div>

                <div className="rounded-lg bg-[#edf8ef] px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-[#999]">Approved</div>
                  <div className="mt-1 text-lg font-bold text-[#23753b]">{culturalStats.approved}</div>
                </div>

                <div className="rounded-lg bg-[#fff0f0] px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-[#999]">Rejected</div>
                  <div className="mt-1 text-lg font-bold text-[#a70e18]">{culturalStats.rejected}</div>
                </div>
              </div>

            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1250px] text-left">
                <thead className="bg-[#fcf8f1] text-xs uppercase tracking-wide text-[#777]">
                  <tr>
                    <th className="px-5 py-3">Registration</th>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Participant</th>
                    <th className="px-4 py-3">Flat</th>
                    <th className="px-4 py-3">Performance</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0ebe5]">
                  {filteredCulturalPrograms.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#fffdf9]"
                    >
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-[#a70e18]">
                          {item.registration_no}
                        </div>
                        <div className="mt-1 text-xs text-[#888]">
                          {formatDateTime(item.created_at)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {item.slot_number ? (
                          <span className="inline-flex items-center rounded-full bg-[#fff4dc] px-3 py-1 text-xs font-bold text-[#9a6b00]">
                            Slot {item.slot_number}
                          </span>
                        ) : (
                          <span className="text-xs text-[#aaa]">—</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold">
                          {item.participant_name}
                        </div>
                        <div className="mt-1 text-xs text-[#777]">
                          Age {item.age} · {item.participant_type}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold">
                          {item.block}-{item.flat_no}
                        </div>
                        <div className="mt-1 text-xs text-[#777]">
                          {item.mobile}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold">
                          {item.performance_title}
                        </div>
                        <div className="mt-1 text-xs text-[#777]">
                          {item.performance_type}
                          {item.group_name
                            ? ` · ${item.group_name}`
                            : ""}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm">
                        {item.category}
                      </td>

                      <td className="px-4 py-4 text-sm">
                        {item.duration}
                      </td>

                      <td className="px-4 py-4">
                        <CulturalStatusBadge
                          status={item.status}
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCulturalProgram(item)
                            }
                            className="rounded-lg border border-[#ddd] bg-white px-3 py-2 text-xs font-semibold text-[#666]"
                          >
                            <i className="fa-solid fa-eye mr-1" />
                            View
                          </button>

                          {item.status === "pending" && (
                            <>
                              <button
                                type="button"
                                disabled={
                                  loadingId === item.id
                                }
                                onClick={() =>
                                  updateCulturalProgramStatus(
                                    item.id,
                                    "approved"
                                  )
                                }
                                className="rounded-lg bg-[#23753b] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                <i className="fa-solid fa-check mr-1" />
                                Approve
                              </button>

                              <button
                                type="button"
                                disabled={
                                  loadingId === item.id
                                }
                                onClick={() =>
                                  updateCulturalProgramStatus(
                                    item.id,
                                    "rejected"
                                  )
                                }
                                className="rounded-lg border border-[#f0cccc] bg-[#fff6f6] px-3 py-2 text-xs font-semibold text-[#a70e18] disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#eee5db] md:hidden">
              {filteredCulturalPrograms.map((item) => (
                <div
                  key={item.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {item.participant_name}
                      </div>
                      <div className="mt-1 text-xs text-[#777]">
                        {item.block}-{item.flat_no} · Age {item.age}
                      </div>
                    </div>

                    <CulturalStatusBadge
                      status={item.status}
                    />
                  </div>

                  <div className="mt-3 rounded-lg bg-[#fcf8f1] p-3 text-xs">
                    <div className="font-semibold text-[#a70e18]">
                      {item.registration_no}
                    </div>

                    <div className="mt-2 flex items-center justify-between rounded-lg border border-[#f0dfbd] bg-[#fff8ea] px-3 py-2">
                      <span className="text-[#777]">Assigned Slot</span>
                      <strong className="font-bold text-[#a70e18]">
                        {item.slot_number ? `Slot ${item.slot_number}` : "—"}
                      </strong>
                    </div>

                    <div className="mt-2 font-semibold">
                      {item.performance_title}
                    </div>

                    <div className="mt-1 text-[#777]">
                      {item.category} · {item.performance_type} · {item.duration}
                    </div>

                    {item.group_name && (
                      <div className="mt-1 text-[#777]">
                        Group: {item.group_name}
                      </div>
                    )}

                    <div className="mt-2 text-[#777]">
                      {item.mobile}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCulturalProgram(item)
                      }
                      className="flex-1 rounded-lg border border-[#ddd] bg-white py-2.5 text-xs font-semibold text-[#666]"
                    >
                      <i className="fa-solid fa-eye mr-1" />
                      View
                    </button>

                    {item.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={
                            loadingId === item.id
                          }
                          onClick={() =>
                            updateCulturalProgramStatus(
                              item.id,
                              "approved"
                            )
                          }
                          className="rounded-lg bg-[#23753b] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <i className="fa-solid fa-check" />
                        </button>

                        <button
                          type="button"
                          disabled={
                            loadingId === item.id
                          }
                          onClick={() =>
                            updateCulturalProgramStatus(
                              item.id,
                              "rejected"
                            )
                          }
                          className="rounded-lg border border-[#f0cccc] bg-[#fff6f6] px-3 py-2.5 text-xs font-semibold text-[#a70e18] disabled:opacity-50"
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredCulturalPrograms.length === 0 && (
              <EmptyState
                label="No cultural program registrations found."
              />
            )}

          </section>
        )}

        {/* ====================================================
            SEVA
        ==================================================== */}

        {section === "seva" && (
          <section className="overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">
            <div className="border-b border-[#eee5db] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-serif text-xl font-bold">Seva Registrations</h2>
                  <p className="mt-1 text-xs text-[#858585]">
                    {filteredSevaRegistrations.length} shown · {sevaStats.total} total registrations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportSevaRegistrations}
                  disabled={filteredSevaRegistrations.length === 0}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#23753b] px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <i className="fa-solid fa-file-excel" />
                  Export
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative lg:col-span-2">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]" />
                  <input
                    value={sevaSearch}
                    onChange={(e) => setSevaSearch(e.target.value)}
                    placeholder="Search Seva ID, name, flat, mobile..."
                    className="h-10 w-full rounded-lg border border-[#ddd6cd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#a70e18]"
                  />
                </div>
                <select
                  value={sevaStatusFilter}
                  onChange={(e) => setSevaStatusFilter(e.target.value as SevaStatusFilter)}
                  className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={sevaBlockFilter}
                  onChange={(e) => setSevaBlockFilter(e.target.value as BlockFilter)}
                  className="h-10 rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                >
                  <option value="all">All Blocks</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="Villa">Villa</option>
                </select>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  ["Total", sevaStats.total, "bg-[#fcf8f1] text-[#292929]"],
                  ["Pending", sevaStats.pending, "bg-[#fff8e7] text-[#a56b00]"],
                  ["Contacted", sevaStats.contacted, "bg-[#eef5ff] text-[#245a9b]"],
                  ["Confirmed", sevaStats.confirmed, "bg-[#edf8ef] text-[#23753b]"],
                  ["Completed", sevaStats.completed, "bg-[#f3f3f3] text-[#555]"],
                ].map(([label, value, classes]) => (
                  <div key={String(label)} className={`rounded-lg px-3 py-2.5 ${classes}`}>
                    <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
                    <div className="mt-1 text-lg font-bold">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1250px] text-left">
                <thead className="bg-[#fcf8f1] text-xs uppercase tracking-wide text-[#777]">
                  <tr>
                    <th className="px-5 py-3">Seva ID</th>
                    <th className="px-4 py-3">Resident</th>
                    <th className="px-4 py-3">Flat</th>
                    <th className="px-4 py-3">Material Seva</th>
                    <th className="px-4 py-3">Volunteer Seva</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ebe5]">
                  {filteredSevaRegistrations.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fffdf9]">
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-[#a70e18]">{item.seva_no}</div>
                        <div className="mt-1 text-xs text-[#888]">{formatDateTime(item.created_at)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold">{item.name}</div>
                        <div className="mt-1 text-xs text-[#777]">{item.mobile}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold">{item.block}-{item.flat_no}</div>
                      </td>
                      <td className="max-w-[320px] px-4 py-4 text-xs">
                        {(item.materials || []).length ? (
                          <div>
                            <div className="space-y-1">
                              {(item.materials || []).map((material, index) => (
                                <div key={`${item.id}-m-${index}`} className="rounded-md bg-[#fcf8f1] px-2 py-1.5">
                                  <div className="font-semibold text-[#292929]">
                                    {material.type === "annadana" ? "Annadana Seva" : (material.title || "Material Seva")}
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-[#666]">
                                    {material.package || (material.quantity ? `${material.quantity} ${material.unit || ""}` : "")}
                                    {material.day ? ` · ${material.day}` : ""}
                                    {getMaterialPrice(material) > 0 ? ` · ₹${getMaterialPrice(material).toLocaleString("en-IN")}` : ""}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {getSevaMaterialTotal(item) > 0 && (
                              <div className="mt-2 font-bold text-[#a70e18]">
                                Total: ₹{getSevaMaterialTotal(item).toLocaleString("en-IN")}
                              </div>
                            )}
                          </div>
                        ) : <span className="text-[#aaa]">None</span>}
                      </td>
                      <td className="max-w-[330px] px-4 py-4 text-xs">
                        {(item.volunteer_role_names || []).length ? (
                          <div className="line-clamp-4">{item.volunteer_role_names.join(" · ")}</div>
                        ) : <span className="text-[#aaa]">None</span>}
                      </td>
                      <td className="px-4 py-4"><SevaStatusBadge status={item.status} /></td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setSelectedSeva(item)} className="rounded-lg border border-[#ddd] bg-white px-3 py-2 text-xs font-semibold text-[#666]">
                            <i className="fa-solid fa-eye mr-1" /> View
                          </button>
                          {item.status === "pending" && (
                            <>
                              <button type="button" disabled={loadingId === item.id} onClick={() => updateSevaStatus(item.id, "confirmed")} className="rounded-lg bg-[#23753b] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Confirm</button>
                              <button type="button" disabled={loadingId === item.id} onClick={() => updateSevaStatus(item.id, "rejected")} className="rounded-lg border border-[#f0cccc] bg-[#fff6f6] px-3 py-2 text-xs font-semibold text-[#a70e18] disabled:opacity-50">Reject</button>
                            </>
                          )}
                          {item.status === "confirmed" && (
                            <button type="button" disabled={loadingId === item.id} onClick={() => updateSevaStatus(item.id, "completed")} className="rounded-lg bg-[#a70e18] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Complete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#eee5db] md:hidden">
              {filteredSevaRegistrations.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="mt-1 text-xs text-[#777]">{item.block}-{item.flat_no} · {item.mobile}</div>
                    </div>
                    <SevaStatusBadge status={item.status} />
                  </div>
                  <div className="mt-3 rounded-lg bg-[#fcf8f1] p-3 text-xs">
                    <div className="font-semibold text-[#a70e18]">{item.seva_no}</div>
                    <div className="mt-2">
                      <span className="text-[#888]">Material Seva</span>
                      <div className="mt-1 space-y-1 font-medium">
                        {(item.materials || []).length ? (
                          <>
                            {(item.materials || []).map((m, index) => (
                              <div key={`${item.id}-mobile-m-${index}`}>
                                {formatSevaMaterial(m)}
                              </div>
                            ))}
                            {getSevaMaterialTotal(item) > 0 && (
                              <div className="pt-1 font-bold text-[#a70e18]">
                                Total: ₹{getSevaMaterialTotal(item).toLocaleString("en-IN")}
                              </div>
                            )}
                          </>
                        ) : "None"}
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-[#888]">Volunteer Seva</span>
                      <div className="mt-1 font-medium">{(item.volunteer_role_names || []).join(" · ") || "None"}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setSelectedSeva(item)} className="flex-1 rounded-lg border border-[#ddd] bg-white py-2.5 text-xs font-semibold text-[#666]">View Details</button>
                    {item.status === "pending" && (
                      <>
                        <button type="button" disabled={loadingId === item.id} onClick={() => updateSevaStatus(item.id, "confirmed")} className="rounded-lg bg-[#23753b] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><i className="fa-solid fa-check" /></button>
                        <button type="button" disabled={loadingId === item.id} onClick={() => updateSevaStatus(item.id, "rejected")} className="rounded-lg border border-[#f0cccc] bg-[#fff6f6] px-3 py-2.5 text-xs font-semibold text-[#a70e18] disabled:opacity-50"><i className="fa-solid fa-xmark" /></button>
                      </>
                    )}
                    {item.status === "confirmed" && (
                      <button type="button" disabled={loadingId === item.id} onClick={() => updateSevaStatus(item.id, "completed")} className="rounded-lg bg-[#a70e18] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><i className="fa-solid fa-check-double" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredSevaRegistrations.length === 0 && <EmptyState label="No Seva registrations found." />}
          </section>
        )}

        {/* ====================================================
            INVENTORY HELP
        ==================================================== */}

        {section === "inventory" && (
          <InventoryManagement />
        )}

        {/* ====================================================
            DONATIONS
        ==================================================== */}

        {section ===
          "donations" && (
          <section className="overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">

            <SectionHeader
              title="External Support"
              subtitle={`${filteredDonations.length} record${
                filteredDonations.length ===
                1
                  ? ""
                  : "s"
              } shown`}
              search={
                donationSearch
              }
              setSearch={
                setDonationSearch
              }
              placeholder="Search donor, organisation, mobile or UTR"
              filter={
                donationFilter
              }
              setFilter={
                setDonationFilter
              }
              onExport={
                exportDonations
              }
            />

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full min-w-[1100px] text-left">

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
                          {money(
                            item.amount
                          )}
                        </td>

                        <td className="px-4 py-4 text-xs text-[#666]">
                          {item.utr ||
                            "—"}
                        </td>

                        <td className="px-4 py-4 text-xs text-[#666]">
                          {formatDate(
                            item.created_at
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              item.status
                            }
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
                        status={
                          item.status
                        }
                      />

                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[#fcf8f1] p-3 text-xs">

                      <div>

                        <span className="text-[#888]">
                          Amount
                        </span>

                        <strong className="mt-1 block text-sm">
                          {money(
                            item.amount
                          )}
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
                          {item.utr ||
                            "—"}
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
              <EmptyState
                label="No external support found."
              />
            )}

          </section>
        )}

        {/* ====================================================
            EXPENSES
        ==================================================== */}

        {section ===
          "expenses" && (
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
                    {money(
                      expenseStats.total
                    )}
                  </p>

                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                  <div className="relative">

                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]" />

                    <input
                      value={
                        expenseSearch
                      }
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
                      setEditingExpense(
                        null
                      );

                      setShowExpenseForm(
                        true
                      );
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#a70e18] px-4 text-sm font-semibold text-white"
                  >
                    <i className="fa-solid fa-plus" />
                    Add Expense
                  </button>

                  <button
                    type="button"
                    onClick={
                      exportExpenses
                    }
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

                    <th className="px-5 py-3">
                      Expense
                    </th>

                    <th className="px-4 py-3">
                      Category
                    </th>

                    <th className="px-4 py-3">
                      Paid To
                    </th>

                    <th className="px-4 py-3">
                      Amount
                    </th>

                    <th className="px-4 py-3">
                      Payment
                    </th>

                    <th className="px-4 py-3">
                      Date
                    </th>

                    <th className="px-5 py-3 text-right">
                      Action
                    </th>

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
                              {
                                item.reference_no
                              }
                            </div>
                          )}

                        </td>

                        <td className="px-4 py-4 text-sm">
                          {item.category}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {item.paid_to ||
                            "—"}
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-[#a70e18]">
                          {money(
                            item.amount
                          )}
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
                        {money(
                          item.amount
                        )}
                      </div>

                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[#fcf8f1] p-3 text-xs">

                      <div>

                        <span className="text-[#888]">
                          Paid To
                        </span>

                        <strong className="mt-1 block font-medium">
                          {item.paid_to ||
                            "—"}
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
              <EmptyState
                label="No expenses found."
              />
            )}

          </section>
        )}

        {/* ====================================================
            EXPENSE MODAL
        ==================================================== */}

        {selectedSeva && (
          <SevaDetailsModal
            seva={selectedSeva}
            loading={loadingId === selectedSeva.id}
            onClose={() => setSelectedSeva(null)}
            onContact={() => updateSevaStatus(selectedSeva.id, "contacted")}
            onConfirm={() => updateSevaStatus(selectedSeva.id, "confirmed")}
            onComplete={() => updateSevaStatus(selectedSeva.id, "completed")}
            onReject={() => updateSevaStatus(selectedSeva.id, "rejected")}
          />
        )}

        {selectedCulturalProgram && (
          <CulturalProgramModal
            program={selectedCulturalProgram}
            loading={
              loadingId ===
              selectedCulturalProgram.id
            }
            onClose={() =>
              setSelectedCulturalProgram(null)
            }
            onApprove={() =>
              updateCulturalProgramStatus(
                selectedCulturalProgram.id,
                "approved"
              )
            }
            onReject={() =>
              updateCulturalProgramStatus(
                selectedCulturalProgram.id,
                "rejected"
              )
            }
          />
        )}

        {showExpenseForm && (
          <ExpenseModal
            expense={
              editingExpense
            }
            categories={
              EXPENSE_CATEGORIES
            }
            paymentModes={
              PAYMENT_MODES
            }
            onClose={() => {
              setShowExpenseForm(
                false
              );

              setEditingExpense(
                null
              );
            }}
            onSaved={(expense) => {
              setExpenses(
                (current) => {
                  const exists =
                    current.some(
                      (item) =>
                        item.id ===
                        expense.id
                    );

                  if (exists) {
                    return current.map(
                      (item) =>
                        item.id ===
                        expense.id
                          ? expense
                          : item
                    );
                  }

                  return [
                    expense,
                    ...current,
                  ];
                }
              );

              setShowExpenseForm(
                false
              );

              setEditingExpense(
                null
              );

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
   INVENTORY MANAGEMENT
============================================================ */

type DashboardInventoryItem = {
  id: string;
  item_key: string;
  item_name: string;
  description: string | null;
  required_quantity: number;
  unit: string;
  icon: string | null;
  display_order: number;
  active: boolean;
  received_quantity: number;
  remaining_quantity: number;
  completed: boolean;
};

type DashboardInventoryRequest = {
  id: string;
  request_no: string;
  inventory_item_id: string;
  name: string;
  block: string;
  flat_no: string;
  mobile: string;
  brand: string | null;
  quantity: number;
  status: "pending" | "verified" | "rejected";
  admin_note: string | null;
  created_at: string;
  verified_at: string | null;
  inventory_item?: {
    item_name: string;
    unit: string;
  } | null;
};

function InventoryManagement() {
  const [items, setItems] = useState<DashboardInventoryItem[]>([]);
  const [requests, setRequests] = useState<DashboardInventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DashboardInventoryItem | null>(null);

  const [form, setForm] = useState({
    itemName: "",
    description: "",
    requiredQuantity: "",
    unit: "piece",
    icon: "fa-box",
  });

  const [filter, setFilter] = useState<
    "all" | "pending" | "verified" | "rejected"
  >("all");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadInventory = async () => {
    try {
      const response = await fetch(
        "/api/admin/inventory-help",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load inventory data."
        );
      }

      setItems(data.items || []);
      setRequests(data.requests || []);
      setError("");
    } catch (err) {
      console.error("Inventory load error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load inventory data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();

    const interval = window.setInterval(() => {
      loadInventory();
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests]
  );

  const filteredRequests = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((request) => request.status === filter);
  }, [requests, filter]);

  const totalRequired = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.required_quantity || 0), 0),
    [items]
  );

  const totalReceived = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.received_quantity || 0), 0),
    [items]
  );

  const openAddModal = () => {
    setEditingItem(null);
    setForm({
      itemName: "",
      description: "",
      requiredQuantity: "",
      unit: "piece",
      icon: "fa-box",
    });
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const openEditModal = (item: DashboardInventoryItem) => {
    setEditingItem(item);
    setForm({
      itemName: item.item_name || "",
      description: item.description || "",
      requiredQuantity: String(item.required_quantity ?? ""),
      unit: item.unit || "piece",
      icon: item.icon || "fa-box",
    });
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const saveInventory = async () => {
    setError("");
    setMessage("");

    const itemName = form.itemName.trim();
    const description = form.description.trim();
    const requiredQuantity = Number(form.requiredQuantity);
    const unit = form.unit.trim();
    const icon = form.icon.trim() || "fa-box";

    if (!itemName) {
      setError("Item name is required.");
      return;
    }

    if (!Number.isInteger(requiredQuantity) || requiredQuantity < 1) {
      setError("Required quantity must be a positive integer.");
      return;
    }

    if (!unit) {
      setError("Unit is required.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingItem);

      const response = await fetch(
        "/api/admin/inventory-help",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isEditing
              ? {
                  id: editingItem!.id,
                  itemName,
                  description: description || null,
                  requiredQuantity,
                  unit,
                  icon,
                }
              : {
                  itemName,
                  description: description || null,
                  requiredQuantity,
                  unit,
                  icon,
                }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            (isEditing
              ? "Unable to update inventory."
              : "Unable to add inventory.")
        );
      }

      setShowModal(false);
      setEditingItem(null);

      setMessage(
        isEditing
          ? "Inventory updated successfully."
          : "Inventory added successfully."
      );

      await loadInventory();
    } catch (err) {
      console.error("Inventory save error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save inventory."
      );
    } finally {
      setSaving(false);
    }
  };

  const removeInventory = async (item: DashboardInventoryItem) => {
    const confirmed = window.confirm(
      `Remove "${item.item_name}" from the inventory requirements?`
    );

    if (!confirmed) return;

    try {
      setActionId(item.id);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/inventory-help",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: item.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to remove inventory."
        );
      }

      setMessage("Inventory removed successfully.");
      await loadInventory();
    } catch (err) {
      console.error("Inventory remove error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove inventory."
      );
    } finally {
      setActionId(null);
    }
  };

  const updateRequest = async (
    request: DashboardInventoryRequest,
    status: "verified" | "rejected"
  ) => {
    let adminNote = "";

    if (status === "rejected") {
      adminNote =
        window.prompt("Reason for rejection:", "") || "";

      if (!adminNote.trim()) {
        const proceed = window.confirm(
          "No rejection reason entered. Continue?"
        );
        if (!proceed) return;
      }
    } else {
      adminNote =
        window.prompt("Optional admin note:", "") || "";
    }

    try {
      setActionId(request.id);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/inventory-help/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: request.id,
            status,
            adminNote: adminNote.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to update help request."
        );
      }

      setMessage(
        status === "verified"
          ? "Inventory help verified successfully."
          : "Inventory help request rejected."
      );

      await loadInventory();
    } catch (err) {
      console.error("Inventory request update error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update help request."
      );
    } finally {
      setActionId(null);
    }
  };

  const progress = (item: DashboardInventoryItem) => {
    const required = Number(item.required_quantity || 0);
    const received = Number(item.received_quantity || 0);

    if (!required) return 0;
    return Math.min(100, Math.round((received / required) * 100));
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">
      <div className="border-b border-[#eee5db] px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#292929]">
              Inventory Requirements
            </h2>
            <p className="mt-1 text-sm text-[#737373]">
              Add and manage items required for the Puja.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b40716] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#970612]"
          >
            <i className="fa-solid fa-plus" />
            Add Inventory
          </button>
        </div>
      </div>

      <div className="p-5">
        {message && (
          <div className="mb-4 rounded-xl border border-[#ead9b8] bg-[#fff8e9] px-4 py-3 text-sm text-[#7a6243]">
            <i className="fa-solid fa-circle-info mr-2 text-[#b40716]" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-[#f0cccc] bg-[#fff6f6] px-4 py-3 text-sm text-[#a70e18]">
            <i className="fa-solid fa-circle-exclamation mr-2" />
            {error}
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#eadfd2] bg-[#fffaf4] p-4">
              <div className="text-xs uppercase tracking-wide text-[#888]">
                Inventory Items
              </div>
              <div className="mt-1 text-2xl font-bold text-[#292929]">
                {items.length}
              </div>
            </div>

            <div className="rounded-xl border border-[#eadfd2] bg-[#fffaf4] p-4">
              <div className="text-xs uppercase tracking-wide text-[#888]">
                Total Required
              </div>
              <div className="mt-1 text-2xl font-bold text-[#292929]">
                {totalRequired}
              </div>
            </div>

            <div className="rounded-xl border border-[#eadfd2] bg-[#fffaf4] p-4">
              <div className="text-xs uppercase tracking-wide text-[#888]">
                Verified Received
              </div>
              <div className="mt-1 text-2xl font-bold text-[#23753b]">
                {totalReceived}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-[#eadfd2] bg-[#fffaf4] p-10 text-center">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-[#b40716]" />
            <p className="mt-3 text-sm text-[#737373]">
              Loading inventory...
            </p>
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-[#dfcfbd] bg-[#fffaf4] p-10 text-center">
            <i className="fa-solid fa-box-open text-4xl text-[#b40716]" />
            <h3 className="mt-4 font-serif text-xl font-bold">
              No inventory requirements yet
            </h3>
            <p className="mt-1 text-sm text-[#737373]">
              Add the items required for the Puja.
            </p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {items.map((item) => {
              const percentage = progress(item);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#eadfd2] bg-[#fffdf9] p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f8e8e8] text-[#b40716]">
                      <i
                        className={`fa-solid ${item.icon || "fa-box"} text-xl`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-[#292929]">
                        {item.item_name}
                      </h3>
                      {item.description && (
                        <p className="mt-1 text-xs leading-5 text-[#737373]">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-[#fcf8f1] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Required</span>
                      <strong>
                        {item.required_quantity} {item.unit}
                      </strong>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span>Verified Received</span>
                      <strong className="text-[#23753b]">
                        {item.received_quantity} {item.unit}
                      </strong>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span>Remaining</span>
                      <strong className={item.completed ? "text-[#23753b]" : "text-[#b40716]"}>
                        {item.remaining_quantity} {item.unit}
                      </strong>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eadfd2]">
                      <div
                        className="h-full rounded-full bg-[#b40716] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-[#888]">
                      <span>{percentage}% complete</span>
                      {item.completed && (
                        <span className="font-bold text-[#23753b]">
                          ✓ Target Completed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={actionId === item.id}
                      onClick={() => openEditModal(item)}
                      className="flex-1 rounded-xl border border-[#ddd2c5] bg-white px-4 py-2.5 text-sm font-semibold text-[#555] transition hover:bg-[#fffaf4] disabled:opacity-50"
                    >
                      <i className="fa-solid fa-pen mr-2" />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={actionId === item.id}
                      onClick={() => removeInventory(item)}
                      className="flex-1 rounded-xl border border-[#f0cccc] bg-[#fff6f6] px-4 py-2.5 text-sm font-semibold text-[#b40716] transition hover:bg-[#ffecec] disabled:opacity-50"
                    >
                      <i className="fa-solid fa-trash mr-2" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ====================================================
            HELP REQUESTS
        ==================================================== */}

        {!loading && (
          <div className="mt-7 overflow-hidden rounded-2xl border border-[#eadfd2] bg-white">
            <div className="border-b border-[#eee5db] px-5 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold">
                    Inventory Help Requests
                  </h3>
                  <p className="mt-1 text-xs text-[#737373]">
                    Verify items residents have offered for the Puja.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["all", "All"],
                      ["pending", "Pending"],
                      ["verified", "Verified"],
                      ["rejected", "Rejected"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        filter === value
                          ? "bg-[#b40716] text-white"
                          : "border border-[#eadfd2] bg-[#fffaf4] text-[#666]"
                      }`}
                    >
                      {label}
                      {value === "pending" && pendingCount > 0
                        ? ` (${pendingCount})`
                        : ""}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="p-10 text-center">
                <i className="fa-solid fa-inbox text-3xl text-[#c0b2a4]" />
                <p className="mt-3 text-sm text-[#737373]">
                  No inventory help requests found.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#eee5db]">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-[#292929]">
                            {request.inventory_item?.item_name || "Inventory Item"}
                          </h4>

                          <span className="rounded-full bg-[#f8eadb] px-2.5 py-1 text-[11px] font-semibold text-[#8b5c37]">
                            {request.request_no}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              request.status === "verified"
                                ? "bg-green-100 text-green-700"
                                : request.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-[#666] sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <span className="text-[#999]">Resident</span>
                            <div className="font-semibold text-[#333]">
                              {request.name}
                            </div>
                          </div>

                          <div>
                            <span className="text-[#999]">Flat</span>
                            <div className="font-semibold text-[#333]">
                              {request.block}-{request.flat_no}
                            </div>
                          </div>

                          <div>
                            <span className="text-[#999]">Mobile</span>
                            <div className="font-semibold text-[#333]">
                              {request.mobile}
                            </div>
                          </div>

                          <div>
                            <span className="text-[#999]">Quantity</span>
                            <div className="font-semibold text-[#333]">
                              {request.quantity} {request.inventory_item?.unit || ""}
                            </div>
                          </div>
                        </div>

                        {request.brand && (
                          <p className="mt-3 text-xs text-[#737373]">
                            <strong>Brand:</strong> {request.brand}
                          </p>
                        )}

                        {request.admin_note && (
                          <p className="mt-2 text-xs text-[#737373]">
                            <strong>Admin Note:</strong> {request.admin_note}
                          </p>
                        )}

                        <p className="mt-2 text-[11px] text-[#999]">
                          Submitted {formatDateTime(request.created_at)}
                        </p>
                      </div>

                      {request.status === "pending" && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={actionId === request.id}
                            onClick={() => updateRequest(request, "verified")}
                            className="rounded-lg bg-[#23753b] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            <i className="fa-solid fa-check mr-1.5" />
                            Verify
                          </button>

                          <button
                            type="button"
                            disabled={actionId === request.id}
                            onClick={() => updateRequest(request, "rejected")}
                            className="rounded-lg border border-[#f0cccc] bg-[#fff6f6] px-4 py-2.5 text-xs font-semibold text-[#a70e18] disabled:opacity-50"
                          >
                            <i className="fa-solid fa-xmark mr-1.5" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====================================================
          ADD / EDIT MODAL
      ==================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eee5db] px-6 py-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#292929]">
                  {editingItem ? "Edit Inventory" : "Add Inventory"}
                </h2>
                <p className="mt-1 text-sm text-[#737373]">
                  {editingItem
                    ? "Update the requirement that residents will see."
                    : "Set the requirement that residents will see."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!saving) setShowModal(false);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f1e9] text-[#b40716] transition hover:bg-[#f2e7da]"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveInventory();
              }}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-[#444]">
                  Item Name *
                </label>
                <input
                  value={form.itemName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      itemName: event.target.value,
                    }))
                  }
                  placeholder="e.g. Gas Cylinder"
                  className="w-full rounded-xl border border-[#ddd2c5] px-4 py-3 text-base outline-none focus:border-[#b40716]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#444]">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Short description"
                  className="w-full resize-none rounded-xl border border-[#ddd2c5] px-4 py-3 text-base outline-none focus:border-[#b40716]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#444]">
                    Required Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.requiredQuantity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        requiredQuantity: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#ddd2c5] px-4 py-3 text-base outline-none focus:border-[#b40716]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#444]">
                    Unit *
                  </label>
                  <select
                    value={form.unit}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        unit: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#ddd2c5] bg-white px-4 py-3 text-base outline-none focus:border-[#b40716]"
                  >
                    <option value="piece">piece</option>
                    <option value="pieces">pieces</option>
                    <option value="can">can</option>
                    <option value="cans">cans</option>
                    <option value="cylinder">cylinder</option>
                    <option value="cylinders">cylinders</option>
                    <option value="set">set</option>
                    <option value="sets">sets</option>
                    <option value="chair">chair</option>
                    <option value="chairs">chairs</option>
                    <option value="table">table</option>
                    <option value="tables">tables</option>
                    <option value="mat">mat</option>
                    <option value="mats">mats</option>
                    <option value="item">item</option>
                    <option value="items">items</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#444]">
                  Font Awesome Icon
                </label>
                <input
                  value={form.icon}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      icon: event.target.value,
                    }))
                  }
                  placeholder="fa-box"
                  className="w-full rounded-xl border border-[#ddd2c5] px-4 py-3 text-base outline-none focus:border-[#b40716]"
                />
                <p className="mt-1.5 text-xs text-[#999]">
                  Example: fa-chair, fa-table, fa-plug
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-[#f0cccc] bg-[#fff6f6] px-4 py-3 text-sm text-[#a70e18]">
                  <i className="fa-solid fa-circle-exclamation mr-2" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-[#ddd2c5] bg-white px-5 py-3.5 text-sm font-bold text-[#666] transition hover:bg-[#fffaf4] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#b40716] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#970612] disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2" />
                      Saving...
                    </>
                  ) : editingItem ? (
                    <>
                      <i className="fa-solid fa-check mr-2" />
                      Update Inventory
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-plus mr-2" />
                      Add Inventory
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}


/* ============================================================
   NAV BUTTON
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
      <i
        className={`fa-solid ${icon}`}
      />

      {label}
    </button>
  );
}

/* ============================================================
   FINANCIAL CARD
============================================================ */

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

/* ============================================================
   COMPARISON STAT
============================================================ */

function ComparisonStat({
  label,
  value,
  sub,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-[#f0d4d4] bg-[#fff8f8]"
          : "border-[#eee5db] bg-[#fcf8f1]"
      }`}
    >

      <div className="flex items-start justify-between gap-3">

        <div>

          <div className="text-xs font-semibold text-[#777]">
            {label}
          </div>

          <div
            className={`mt-1 text-2xl font-bold ${
              highlight
                ? "text-[#a70e18]"
                : "text-[#292929]"
            }`}
          >
            {value}
          </div>

          <div className="mt-1 text-xs text-[#858585]">
            {sub}
          </div>

        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            highlight
              ? "bg-[#f8e6e6] text-[#a70e18]"
              : "bg-white text-[#c8952e]"
          }`}
        >
          <i
            className={`fa-solid ${icon}`}
          />
        </div>

      </div>

    </div>
  );
}

/* ============================================================
   COLLECTION SUMMARY
============================================================ */

function CollectionSummaryCard({
  icon,
  label,
  count,
  amount,
  description,
  onClick,
}: {
  icon: string;
  label: string;
  count: number;
  amount: number;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-[#eadfd2] bg-white p-4 text-left shadow-sm transition hover:shadow-md"
    >

      <div className="flex items-center justify-between gap-3">

        <div className="flex items-center gap-2">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff7ed] text-[#a70e18]">
            <i
              className={`fa-solid ${icon}`}
            />
          </div>

          <div>

            <h3 className="text-sm font-semibold text-[#292929]">
              {label}
            </h3>

            <p className="text-[11px] text-[#999]">
              {description}
            </p>

          </div>

        </div>

        <div className="text-right">

          <div className="text-lg font-bold text-[#292929]">
            {count}
          </div>

          <div className="text-[10px] text-[#999]">
            residents
          </div>

        </div>

      </div>

      <div className="mt-4 border-t border-[#f0ebe5] pt-3">

        <span className="text-[11px] text-[#888]">
          Expected collection
        </span>

        <div className="mt-1 text-base font-bold text-[#a70e18]">
          ₹
          {Number(
            amount
          ).toLocaleString(
            "en-IN"
          )}
        </div>

      </div>

    </button>
  );
}

/* ============================================================
   COLLECTION BADGE
============================================================ */

function CollectionBadge({
  status,
}: {
  status: string | null;
}) {
  if (!status) {
    return (
      <span className="text-xs text-[#999]">
        —
      </span>
    );
  }

  const styles =
    status === "Pay Now"
      ? "bg-[#fff0f0] text-[#a70e18]"
      : status === "Door Lock"
        ? "bg-[#fff7e8] text-[#9a6a16]"
        : status ===
            "Follow-up"
          ? "bg-[#eef5ff] text-[#3166a8]"
          : "bg-[#f3f3f3] text-[#666]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

/* ============================================================
   PAYMENT BADGE
============================================================ */

function PaymentBadge({
  method,
}: {
  method: string | null;
}) {
  if (!method) {
    return (
      <span className="text-xs text-[#999]">
        —
      </span>
    );
  }

  if (method === "cash") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7e8] px-2.5 py-1 text-[11px] font-semibold text-[#9a6a16]">
        <i className="fa-solid fa-money-bill-wave" />
        Cash
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef7ff] px-2.5 py-1 text-[11px] font-semibold text-[#28699b]">
      <i className="fa-solid fa-mobile-screen-button" />
      UPI
    </span>
  );
}

/* ============================================================
   SMALL SUMMARY
============================================================ */

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

        <i
          className={`fa-solid ${icon} text-[#a70e18]`}
        />

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

/* ============================================================
   SUMMARY ROW
============================================================ */

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
        bold
          ? "font-bold"
          : ""
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
        {negative
          ? "− "
          : ""}

        ₹
        {Number(
          amount
        ).toLocaleString(
          "en-IN"
        )}
      </span>

    </div>
  );
}

/* ============================================================
   SECTION HEADER
============================================================ */

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
  setSearch: (
    value: string
  ) => void;
  placeholder: string;
  filter: Filter;
  setFilter: (
    value: Filter
  ) => void;
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
                setSearch(
                  e.target.value
                )
              }
              placeholder={
                placeholder
              }
              className="h-10 w-full rounded-lg border border-[#ddd6cd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#a70e18] sm:w-[280px]"
            />

          </div>

          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target
                  .value as Filter
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
            onClick={
              onExport
            }
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

/* ============================================================
   ACTION BUTTONS
============================================================ */

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

/* ============================================================
   STATUS BADGE
============================================================ */

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
          status ===
          "verified"
            ? "fa-circle-check"
            : status ===
                "rejected"
              ? "fa-circle-xmark"
              : "fa-clock"
        }`}
      />

      {status}

    </span>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

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

/* ============================================================
   DATE
============================================================ */

function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateOnly(
  value: string
) {
  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ============================================================
   SEVA STATUS BADGE
============================================================ */

function SevaStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string; icon: string }> = {
    pending: { label: "Pending", classes: "bg-[#fff7e8] text-[#9a6a16]", icon: "fa-clock" },
    contacted: { label: "Contacted", classes: "bg-[#eef5ff] text-[#245a9b]", icon: "fa-phone" },
    confirmed: { label: "Confirmed", classes: "bg-[#edf8f0] text-[#23753b]", icon: "fa-circle-check" },
    completed: { label: "Completed", classes: "bg-[#f1f1f1] text-[#555]", icon: "fa-check-double" },
    rejected: { label: "Rejected", classes: "bg-[#fff0f0] text-[#a70e18]", icon: "fa-circle-xmark" },
  };
  const item = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.classes}`}>
      <i className={`fa-solid ${item.icon}`} /> {item.label}
    </span>
  );
}

/* ============================================================
   SEVA DETAILS MODAL
============================================================ */

function SevaDetailsModal({
  seva, loading, onClose, onContact, onConfirm, onComplete, onReject,
}: {
  seva: SevaRegistration;
  loading: boolean;
  onClose: () => void;
  onContact: () => void;
  onConfirm: () => void;
  onComplete: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#eee5db] bg-white px-5 py-4">
          <div>
            <div className="text-[10px] font-bold tracking-[2px] text-[#a70e18]">SEVA</div>
            <h2 className="mt-1 font-serif text-xl font-bold">Seva Registration Details</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f2eb] text-[#666]"><i className="fa-solid fa-xmark" /></button>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-4 rounded-xl bg-[#fcf8f1] p-4">
            <div>
              <div className="text-xs text-[#888]">Seva ID</div>
              <div className="mt-1 font-bold text-[#a70e18]">{seva.seva_no}</div>
            </div>
            <SevaStatusBadge status={seva.status} />
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold">Resident Details</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <DetailItem label="Name" value={seva.name} />
              <DetailItem label="Block / Flat" value={`${seva.block}-${seva.flat_no}`} />
              <DetailItem label="Mobile" value={seva.mobile} />
              <DetailItem label="Registered On" value={formatDateTime(seva.created_at)} />
            </div>
          </div>

          <div className="border-t border-[#eee5db] pt-5">
            <h3 className="font-serif text-lg font-bold">Material Seva</h3>
            <div className="mt-3 space-y-2">
              {(seva.materials || []).length ? (seva.materials || []).map((material, index) => (
                <div key={`${seva.id}-detail-m-${index}`} className="rounded-lg bg-[#fcf8f1] px-3 py-3 text-sm">
                  <div className="font-semibold text-[#292929]">{material.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[#666]">
                    {material.package ? <span>{material.package}</span> : material.quantity ? <span>{material.quantity} {material.unit || ""}</span> : null}
                    {material.day ? <span>· {material.day}</span> : null}
                    {getMaterialPrice(material) > 0 ? (
                      <span className="font-bold text-[#a70e18]">· ₹{getMaterialPrice(material).toLocaleString("en-IN")}</span>
                    ) : null}
                  </div>
                </div>
              )) : <div className="text-sm text-[#999]">No material Seva selected.</div>}
              {getSevaMaterialTotal(seva) > 0 && (
                <div className="mt-3 rounded-lg border border-[#eadfd2] bg-[#fff7ed] px-3 py-3 text-right">
                  <span className="text-sm font-semibold text-[#666]">Material Seva Total</span>
                  <span className="ml-3 text-lg font-bold text-[#a70e18]">
                    ₹{getSevaMaterialTotal(seva).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#eee5db] pt-5">
            <h3 className="font-serif text-lg font-bold">Volunteer Seva</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(seva.volunteer_role_names || []).length ? (seva.volunteer_role_names || []).map((role) => (
                <span key={role} className="rounded-full bg-[#fff7ed] px-3 py-1.5 text-xs font-semibold text-[#a70e18]">{role}</span>
              )) : <span className="text-sm text-[#999]">No volunteer role selected.</span>}
            </div>
            {seva.volunteer_note && (
              <div className="mt-3 rounded-xl bg-[#fcf8f1] p-4">
                <div className="text-xs font-semibold text-[#888]">Volunteer Note</div>
                <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#444]">{seva.volunteer_note}</div>
              </div>
            )}
          </div>

          {seva.admin_note && (
            <div className="border-t border-[#eee5db] pt-5">
              <div className="text-xs font-semibold text-[#888]">Admin Note</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-[#444]">{seva.admin_note}</div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-[#eee5db] pt-4">
            {seva.status === "pending" && <button type="button" disabled={loading} onClick={onContact} className="flex-1 rounded-lg border border-[#ddd] bg-white py-3 text-sm font-semibold text-[#245a9b] disabled:opacity-50">Mark Contacted</button>}
            {(seva.status === "pending" || seva.status === "contacted") && <button type="button" disabled={loading} onClick={onConfirm} className="flex-1 rounded-lg bg-[#23753b] py-3 text-sm font-semibold text-white disabled:opacity-50">Confirm Seva</button>}
            {seva.status === "confirmed" && <button type="button" disabled={loading} onClick={onComplete} className="flex-1 rounded-lg bg-[#a70e18] py-3 text-sm font-semibold text-white disabled:opacity-50">Mark Completed</button>}
            {(seva.status === "pending" || seva.status === "contacted") && <button type="button" disabled={loading} onClick={onReject} className="flex-1 rounded-lg border border-[#f0cccc] bg-[#fff6f6] py-3 text-sm font-semibold text-[#a70e18] disabled:opacity-50">Reject</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CULTURAL PROGRAM STATUS BADGE
============================================================ */

function CulturalStatusBadge({
  status,
}: {
  status: string;
}) {
  const styles =
    status === "approved"
      ? "bg-[#edf8f0] text-[#23753b]"
      : status === "rejected"
        ? "bg-[#fff0f0] text-[#a70e18]"
        : "bg-[#fff7e8] text-[#9a6a16]";

  const label =
    status === "approved"
      ? "Approved"
      : status === "rejected"
        ? "Rejected"
        : "Pending";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles}`}
    >
      <i
        className={`fa-solid ${
          status === "approved"
            ? "fa-circle-check"
            : status === "rejected"
              ? "fa-circle-xmark"
              : "fa-clock"
        }`}
      />
      {label}
    </span>
  );
}

/* ============================================================
   CULTURAL PROGRAM DETAILS MODAL
============================================================ */

function CulturalProgramModal({
  program,
  loading,
  onClose,
  onApprove,
  onReject,
}: {
  program: CulturalProgram;
  loading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="sticky top-0 flex items-center justify-between border-b border-[#eee5db] bg-white px-5 py-4">
          <div>
            <div className="text-[10px] font-bold tracking-[2px] text-[#a70e18]">
              CULTURAL PROGRAM
            </div>

            <h2 className="mt-1 font-serif text-xl font-bold">
              Registration Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f2eb] text-[#666]"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="space-y-5 p-5">

          <div className="flex items-start justify-between gap-4 rounded-xl bg-[#fcf8f1] p-4">
            <div>
              <div className="text-xs text-[#888]">
                Registration ID
              </div>

              <div className="mt-1 font-bold text-[#a70e18]">
                {program.registration_no}
              </div>
            </div>

            <CulturalStatusBadge
              status={program.status}
            />
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold">
              Participant Details
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <DetailItem
                label="Participant"
                value={program.participant_name}
              />

              <DetailItem
                label="Age"
                value={`${program.age} years`}
              />

              <DetailItem
                label="Participant Type"
                value={program.participant_type}
              />

              <DetailItem
                label="Block / Flat"
                value={`${program.block}-${program.flat_no}`}
              />

              <DetailItem
                label="Assigned Slot"
                value={
                  program.slot_number
                    ? `Slot ${program.slot_number}`
                    : "Not Assigned"
                }
              />

              <DetailItem
                label="Mobile"
                value={program.mobile}
              />

              <DetailItem
                label="Email"
                value={program.email || "—"}
              />
            </div>
          </div>

          <div className="border-t border-[#eee5db] pt-5">
            <h3 className="font-serif text-lg font-bold">
              Performance Details
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <DetailItem
                label="Performance Type"
                value={program.performance_type}
              />

              <DetailItem
                label="Group Name"
                value={program.group_name || "—"}
              />

              <DetailItem
                label="Category"
                value={program.category}
              />

              <DetailItem
                label="Performance Title"
                value={program.performance_title}
              />

              <DetailItem
                label="Expected Duration"
                value={program.duration}
              />
            </div>

            <div className="mt-3 rounded-xl bg-[#fcf8f1] p-4">
              <div className="text-xs font-semibold text-[#888]">
                Description
              </div>

              <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#444]">
                {program.description || "No description provided."}
              </div>
            </div>
          </div>

          <div className="border-t border-[#eee5db] pt-5 text-xs text-[#888]">
            Registered on {formatDateTime(program.created_at)}
          </div>

          {program.status === "pending" && (
            <div className="flex gap-3 border-t border-[#eee5db] pt-4">
              <button
                type="button"
                disabled={loading}
                onClick={onReject}
                className="flex-1 rounded-lg border border-[#f0cccc] bg-[#fff6f6] py-3 text-sm font-semibold text-[#a70e18] disabled:opacity-50"
              >
                Reject
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={onApprove}
                className="flex-1 rounded-lg bg-[#23753b] py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading
                  ? "Updating..."
                  : "Approve Registration"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#eee5db] bg-white px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-[#999]">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-semibold text-[#333]">
        {value}
      </div>
    </div>
  );
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
  onSaved: (
    expense: Expense
  ) => void;
}) {
  const [title, setTitle] =
    useState(
      expense?.title ||
        ""
    );

  const [category, setCategory] =
    useState(
      expense?.category ||
        categories[0]
    );

  const [paidTo, setPaidTo] =
    useState(
      expense?.paid_to ||
        ""
    );

  const [amount, setAmount] =
    useState(
      expense
        ? String(
            expense.amount
          )
        : ""
    );

  const [expenseDate, setExpenseDate] =
    useState(
      expense?.expense_date ||
        new Date()
          .toISOString()
          .slice(
            0,
            10
          )
    );

  const [paymentMode, setPaymentMode] =
    useState(
      expense?.payment_mode ||
        "cash"
    );

  const [referenceNo, setReferenceNo] =
    useState(
      expense?.reference_no ||
        ""
    );

  const [notes, setNotes] =
    useState(
      expense?.notes ||
        ""
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
      numericAmount <=
        0
    ) {
      setError(
        "Please enter a valid amount."
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
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
                ? {
                    id: expense.id,
                  }
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

      onSaved(
        result.expense
      );
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
            onClick={
              onClose
            }
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
                setTitle(
                  e.target.value
                )
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
                value={
                  expenseDate
                }
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
                value={
                  paymentMode
                }
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
                value={
                  referenceNo
                }
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
              onClick={
                onClose
              }
              className="flex-1 rounded-lg border border-[#ddd] bg-white py-3 text-sm font-semibold text-[#666]"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={
                submit
              }
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

/* ============================================================
   FORM FIELD
============================================================ */

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