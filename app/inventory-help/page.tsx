"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const DURGA_IMAGE =
  "/images/durga-puja-collection.webp";

const BLOCKS = [
  "P1",
  "P2",
  "Villa",
] as const;

type Block = (typeof BLOCKS)[number];

function generateFlats(
  start: number,
  end: number
) {
  const flats: string[] = [];

  for (let i = start; i <= end; i++) {
    flats.push(
      String(i).padStart(3, "0")
    );
  }

  return flats;
}

const FLATS: Record<Block, string[]> = {
  P1: [
    ...generateFlats(1, 12),
    ...generateFlats(101, 112),
    ...generateFlats(201, 212),
    ...generateFlats(301, 312),
  ],

  P2: [
    ...generateFlats(1, 67),
    ...generateFlats(101, 167),
    ...generateFlats(201, 267),
    ...generateFlats(301, 367),
  ],

  Villa: [
    "001",
    "002",
    "003",
    "004",
  ],
};

type InventoryHelper = {
  name: string;
  block: Block;
  flat_no: string;
  quantity: number;
};

type InventoryItem = {
  id: string;
  item_key: string;
  item_name: string;
  description: string | null;
  required_quantity: number;
  unit: string;
  icon: string | null;
  received_quantity: number;
  remaining_quantity: number;
  completed: boolean;
  helpers: InventoryHelper[];
};

function InputField({
  icon,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-[#765f53]">
        {label}{" "}
        {required && (
          <span className="text-[#a70e18]">
            *
          </span>
        )}
      </span>

      <div className="flex min-h-[48px] items-center rounded-[12px] border border-[#eadfd2] bg-[#fffaf4] px-3 transition focus-within:border-[#c99a43] focus-within:bg-white">

        <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f8e8e5] text-[#a70e18]">
          <i
            className={`fa-solid ${icon}`}
          />
        </span>

        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          className="w-full bg-transparent text-[13px] text-[#292929] outline-none placeholder:text-[#aaa09a]"
        />
      </div>
    </label>
  );
}

function CustomSelect({
  icon,
  label,
  placeholder,
  value,
  options,
  open,
  onToggle,
  onChange,
}: {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">

      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-[#765f53]">
        {label}{" "}
        <span className="text-[#a70e18]">
          *
        </span>
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="flex min-h-[48px] w-full items-center rounded-[12px] border border-[#eadfd2] bg-[#fffaf4] px-3 text-left transition hover:bg-white"
      >
        <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f8e8e5] text-[#a70e18]">
          <i
            className={`fa-solid ${icon}`}
          />
        </span>

        <span
          className={`flex-1 text-[13px] ${
            value
              ? "text-[#292929]"
              : "text-[#aaa09a]"
          }`}
        >
          {value || placeholder}
        </span>

        <i
          className={`fa-solid fa-chevron-down text-[11px] text-[#8d7a70] transition ${
            open
              ? "rotate-180"
              : ""
          }`}
        />
      </button>

      {open && (
        <div
          onClick={(e) =>
            e.stopPropagation()
          }
          className="absolute left-0 right-0 top-[72px] z-[100] max-h-56 overflow-y-auto rounded-[12px] border border-[#eadfd2] bg-white p-1.5 shadow-[0_14px_30px_rgba(68,44,20,0.14)]"
        >
          {options.map(
            (option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onChange(option)
                }
                className={`flex w-full items-center rounded-[9px] px-3 py-2.5 text-left text-[13px] hover:bg-[#fff5e9] ${
                  value === option
                    ? "bg-[#fff1e9] font-semibold text-[#a70e18]"
                    : "text-[#444]"
                }`}
              >
                {option}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function FlatSelect({
  block,
  value,
  search,
  setSearch,
  open,
  onToggle,
  onChange,
}: {
  block: Block | "";
  value: string;
  search: string;
  setSearch: (
    value: string
  ) => void;
  open: boolean;
  onToggle: () => void;
  onChange: (
    value: string
  ) => void;
}) {
  const options = useMemo(() => {
    if (!block) return [];

    return FLATS[block].filter(
      (flat) =>
        flat.includes(
          search.trim()
        )
    );
  }, [block, search]);

  return (
    <div
      className="relative"
      onClick={(e) =>
        e.stopPropagation()
      }
    >
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-[#765f53]">
        Flat No.{" "}
        <span className="text-[#a70e18]">
          *
        </span>
      </span>

      <div className="flex min-h-[48px] items-center rounded-[12px] border border-[#eadfd2] bg-[#fffaf4] px-3">
        <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f8e8e5] text-[#a70e18]">
          <i className="fa-solid fa-house" />
        </span>

        <input
          value={
            search || value
          }
          disabled={!block}
          onFocus={() => {
            if (block)
              onToggle();
          }}
          onChange={(e) => {
            setSearch(
              e.target.value
            );

            if (!open)
              onToggle();
          }}
          placeholder={
            block
              ? "Search and select flat"
              : "Select block first"
          }
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#aaa09a]"
        />
      </div>

      {open && block && (
        <div className="absolute left-0 right-0 top-[72px] z-[100] max-h-56 overflow-y-auto rounded-[12px] border border-[#eadfd2] bg-white p-1.5 shadow-lg">

          {options.length ? (
            options.map(
              (flat) => (
                <button
                  key={flat}
                  type="button"
                  onClick={() =>
                    onChange(flat)
                  }
                  className={`w-full rounded-[9px] px-3 py-2.5 text-left text-[13px] hover:bg-[#fff5e9] ${
                    value === flat
                      ? "bg-[#fff1e9] font-semibold text-[#a70e18]"
                      : ""
                  }`}
                >
                  {flat}
                </button>
              )
            )
          ) : (
            <div className="px-3 py-4 text-center text-xs text-[#888]">
              No flat found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Step({
  number,
  title,
  active,
  completed,
}: {
  number: string;
  title: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="w-[120px] shrink-0 text-center max-[600px]:w-[75px]">

      <div
        className={`mx-auto flex h-[55px] w-[55px] items-center justify-center rounded-full text-[18px] font-bold max-[600px]:h-[42px] max-[600px]:w-[42px] max-[600px]:text-[14px] ${
          completed
            ? "bg-[#c7942f] text-white"
            : active
              ? "bg-[#ae0c16] text-white shadow-lg"
              : "bg-[#dfe1e4] text-[#777]"
        }`}
      >
        {completed ? (
          <i className="fa-solid fa-check" />
        ) : (
          number
        )}
      </div>

      <div
        className={`mt-2 text-[12px] font-semibold max-[600px]:text-[9px] ${
          active
            ? "text-[#ae0c16]"
            : "text-[#737373]"
        }`}
      >
        {title}
      </div>
    </div>
  );
}

export default function InventoryHelpPage() {
  const supabase = useMemo(
    () => createSupabaseBrowserClient(),
    []
  );

  const [step, setStep] =
    useState<1 | 2 | 3>(1);

  const [items, setItems] =
    useState<InventoryItem[]>([]);

  const [loadingItems, setLoadingItems] =
    useState(true);

  const [selectedItem, setSelectedItem] =
    useState<InventoryItem | null>(null);

  const [name, setName] =
    useState("");

  const [block, setBlock] =
    useState<Block | "">("");

  const [flatNo, setFlatNo] =
    useState("");

  const [flatSearch, setFlatSearch] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [brand, setBrand] =
    useState("");

  const [openDropdown, setOpenDropdown] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [requestNo, setRequestNo] =
    useState("");

  async function loadInventory() {
    try {
      const response =
        await fetch(
          "/api/inventory-help",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load inventory."
        );
      }

      // Helpers are loaded through a server endpoint so public visitors
      // can see verified contributors without requiring direct SELECT
      // access to inventory_help_requests from the browser.
      const helpersResponse = await fetch(
        "/api/inventory-help/helpers",
        { cache: "no-store" }
      );

      const helpersData = helpersResponse.ok
        ? await helpersResponse.json()
        : { helpersByItem: {} };

      if (!helpersResponse.ok) {
        console.error(
          "Unable to load inventory helpers:",
          helpersData?.error || "Unable to load helpers."
        );
      }

      setItems(
        (data.items || []).map(
          (item: InventoryItem) => ({
            ...item,
            helpers: Array.isArray(helpersData.helpersByItem?.[item.id])
              ? helpersData.helpersByItem[item.id]
              : [],
          })
        )
      );

    } catch (error) {
      console.error(error);
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
    loadInventory();

    const interval =
      window.setInterval(
        loadInventory,
        5000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, []);

  useEffect(() => {
    const channel =
      supabase
        .channel(
          "inventory-help-live"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "inventory_help_requests",
          },
          () => {
            loadInventory();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [supabase]);

  const isGasCylinder =
    selectedItem?.item_key ===
    "gas_cylinder";

  function openForm(
    item: InventoryItem
  ) {
    setSelectedItem(item);
    setName("");
    setBlock("");
    setFlatNo("");
    setFlatSearch("");
    setMobile("");
    setQuantity("");
    setBrand("");
    setError("");
    setStep(1);
  }

  function closeForm() {
    if (loading) return;

    setSelectedItem(null);
    setError("");
    setOpenDropdown(null);
  }

  function reviewRequest() {
    setError("");

    if (!name.trim()) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (!block) {
      setError(
        "Please select your block."
      );
      return;
    }

    if (!flatNo) {
      setError(
        "Please select your flat."
      );
      return;
    }

    if (
      !/^[6-9]\d{9}$/.test(
        mobile
      )
    ) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    const qty =
      Number(quantity);

    if (
      !Number.isInteger(qty) ||
      qty <= 0
    ) {
      setError(
        "Please enter a valid whole quantity."
      );
      return;
    }

    if (
      selectedItem &&
      qty >
        selectedItem.remaining_quantity
    ) {
      setError(
        `Only ${selectedItem.remaining_quantity} ${selectedItem.unit} still required.`
      );
      return;
    }

    if (
      isGasCylinder &&
      !brand.trim()
    ) {
      setError(
        "Please enter the gas cylinder brand."
      );
      return;
    }

    setOpenDropdown(null);
    setStep(2);
  }

  async function submitRequest() {
    setError("");
    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/inventory-help",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name: name.trim(),
              block,
              flatNo,
              mobile,
              inventoryItemId:
                selectedItem?.id,
              brand:
                isGasCylinder
                  ? brand.trim()
                  : null,
              quantity:
                Number(quantity),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
            "Unable to submit request."
        );
        return;
      }

      setRequestNo(
        data.requestNo ||
          ""
      );

      await loadInventory();

      setStep(3);
    } catch (error) {
      console.error(error);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setStep(1);
    setSelectedItem(null);
    setName("");
    setBlock("");
    setFlatNo("");
    setFlatSearch("");
    setMobile("");
    setQuantity("");
    setBrand("");
    setError("");
    setRequestNo("");
    setOpenDropdown(null);
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
      />

      <main
        onClick={() =>
          setOpenDropdown(null)
        }
        className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#fffaf2_0%,#f8eddd_48%,#efdfca_100%)] px-4 py-6 pb-10 text-[#292929] max-[600px]:px-2"
      >

        <div className="pointer-events-none fixed left-[-290px] top-[150px] h-[420px] w-[420px] rounded-full opacity-[0.12] bg-[repeating-radial-gradient(circle,transparent_0px,transparent_18px,#c99336_19px,transparent_21px)]" />

        <div className="pointer-events-none fixed right-[-290px] bottom-[100px] h-[420px] w-[420px] rounded-full opacity-[0.12] bg-[repeating-radial-gradient(circle,transparent_0px,transparent_18px,#c99336_19px,transparent_21px)]" />

                {/* NAVBAR — SAME HEADER AS OTHER PAGES */}
        <div className="relative z-30 mx-auto -mt-2 mb-3 w-full max-w-7xl rounded-2xl border border-[#ead8bd]/70 bg-[#fffaf2]/95 shadow-[0_8px_30px_rgba(120,70,20,0.08)] backdrop-blur-sm max-[600px]:rounded-xl">
          <Navbar />
        </div>

        <div className="relative z-10 mx-auto mt-8 w-full max-w-[850px]">

          {/* HERO */}

          <section className="relative min-h-[250px] overflow-visible rounded-[24px] border border-[#ead9c7] bg-gradient-to-br from-white/[0.97] to-[#fff9ef]/[0.98] px-7 pb-5 pt-5 shadow-[0_18px_50px_rgba(77,48,20,0.10)] max-[600px]:min-h-[285px] max-[600px]:rounded-[18px] max-[600px]:px-3 mt-[100px]">

            <div className="absolute left-1/2 top-[-50px] z-10 flex h-[270px] w-[270px] -translate-x-1/2 justify-center max-[600px]:top-[-10px] max-[600px]:h-[170px] max-[600px]:w-[170px]">

              <div className="absolute -top-[25px] h-[270px] w-[270px] rounded-full bg-[radial-gradient(circle,rgba(210,157,47,0.25),transparent_68%)] max-[600px]:h-[200px] max-[600px]:w-[200px]" />

              <img
                src={DURGA_IMAGE}
                alt="Maa Durga"
                className="relative z-10 h-[270px] w-[270px] object-contain max-[600px]:h-[170px] max-[600px]:w-[170px]"
              />
            </div>

            <div className="relative z-20 pt-[215px] text-center max-[600px]:pt-[145px]">

              <div className="text-[10px] font-bold tracking-[5px] text-[#795044]">
                INVENTORY SEVA
              </div>

              <h1 className="mt-2 text-[30px] font-bold leading-none text-[#a80d17] max-[600px]:text-[27px]">
                BUH Durga Puja 2026
              </h1>

              <p className="mt-2 font-serif text-[15px] italic text-[#7b5b4e] max-[600px]:text-[11px]">
                Help us arrange the essentials needed for our Durga Puja celebrations.
              </p>

              <div className="mt-3 flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-[#d09a32]" />
                <i className="fa-solid fa-box-open text-[22px] text-[#a70e18]" />
                <span className="h-px w-10 bg-[#d09a32]" />
              </div>
            </div>
          </section>

          {/* STEPPER */}

          <section className="flex items-start px-6 pb-3 pt-3 max-[600px]:px-0">

            <Step
              number="1"
              title="Choose Item"
              active={step >= 1}
              completed={step > 1}
            />

            <div
              className={`mt-[22px] h-px flex-1 bg-[#d7d8db] ${
                step > 1
                  ? "bg-[#c79531]"
                  : ""
              }`}
            />

            <Step
              number="2"
              title="Confirm Help"
              active={step >= 2}
              completed={step > 2}
            />

            <div
              className={`mt-[22px] h-px flex-1 bg-[#d7d8db] ${
                step > 2
                  ? "bg-[#c79531]"
                  : ""
              }`}
            />

            <Step
              number="3"
              title="Submitted"
              active={step >= 3}
              completed={step >= 3}
            />
          </section>

          {/* ====================================================
              STEP 1
          ==================================================== */}

          {step === 1 && (
            <section className="rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white p-6 shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px] max-[600px]:p-3">

              <h2 className="font-serif text-[25px]">
                Inventory Requirements
              </h2>

              <p className="mt-1 text-[13px] text-[#737983]">
                Help us arrange the essential items required for the Puja.
              </p>

              {loadingItems ? (
                <div className="mt-6 rounded-[14px] border border-[#eadfd2] bg-[#fffaf4] py-12 text-center">
                  <i className="fa-solid fa-spinner fa-spin text-xl text-[#a70e18]" />

                  <p className="mt-3 text-xs text-[#777]">
                    Loading inventory requirements...
                  </p>
                </div>
              ) : items.length === 0 ? (
                <div className="mt-6 rounded-[14px] border border-[#eadfd2] bg-[#fffaf4] py-12 text-center">
                  <i className="fa-solid fa-box-open text-[30px] text-[#a70e18]" />

                  <p className="mt-3 text-sm text-[#777]">
                    No inventory requirements have been added yet.
                  </p>

                  <p className="mt-1 text-[11px] text-[#999]">
                    The Puja Committee will add the required items shortly.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">

                  {items.map(
                    (item) => {
                      const progress =
                        item.required_quantity >
                        0
                          ? Math.min(
                              100,
                              Math.round(
                                (item.received_quantity /
                                  item.required_quantity) *
                                  100
                              )
                            )
                          : 0;

                      return (
                        <div
                          key={item.id}
                          className="rounded-[14px] border border-[#eadfd2] bg-[#fffdf9] p-3.5"
                        >

                          <div className="flex items-start gap-3">

                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                              item.completed
                                ? "bg-[#e5f3e7] text-[#287638]"
                                : "bg-[#f8e8e5] text-[#a70e18]"
                            }`}>
                              <i
                                className={`fa-solid ${
                                  item.icon ||
                                  "fa-box"
                                }`}
                              />
                            </span>

                            <div className="min-w-0 flex-1">

                              <div className="flex justify-between gap-2">
                                <h3 className="text-[14px] font-bold text-[#3b312d]">
                                  {item.item_name}
                                </h3>

                                {item.completed && (
                                  <span className="rounded-full bg-[#e7f4e9] px-2 py-1 text-[8px] font-bold text-[#287638]">
                                    COMPLETED
                                  </span>
                                )}
                              </div>

                              {item.description && (
                                <p className="mt-1 text-[12px] leading-[1.4] text-[#81766f]">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 rounded-[10px] bg-[#fcf7ed] p-3">

                            <div className="flex justify-between text-[14px]">
                              <span className="text-[#776c64]">
                                Required
                              </span>

                              <strong>
                                {item.required_quantity}{" "}
                                {item.unit}
                              </strong>
                            </div>

                            <div className="mt-1.5 flex justify-between text-[14px]">
                              <span className="text-[#776c64]">
                                Received
                              </span>

                              <strong className="text-[#287638]">
                                {item.received_quantity}{" "}
                                {item.unit}
                              </strong>
                            </div>

                            {!item.completed && (
                              <div className="mt-1.5 flex justify-between text-[14px]">
                                <span className="text-[#776c64]">
                                  Still Needed
                                </span>

                                <strong className="text-[#a70e18]">
                                  {item.remaining_quantity}{" "}
                                  {item.unit}
                                </strong>
                              </div>
                            )}

                            <div className="mt-3 h-[7px] overflow-hidden rounded-full bg-[#eadfd2]">

                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#a70e18] to-[#d09a32] transition-all"
                                style={{
                                  width: `${progress}%`,
                                }}
                              />

                            </div>

                            <div className="mt-1 text-right text-[9px] text-[#8a7b70]">
                              {progress}% arranged
                            </div>
                          </div>

                          {item.helpers.length > 0 && (
                            <div className="mt-3 rounded-[10px] border border-[#eee1d2] bg-[#fffaf3] px-3 py-2.5">
                              <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.8px] text-[#a70e18]">
                                <i className="fa-solid fa-heart" />
                                Helped By
                              </div>

                              <div className="space-y-1">
                                {item.helpers.map(
                                  (helper) => (
                                    <div
                                      key={`${helper.block}-${helper.flat_no}`}
                                      className="flex items-center justify-between gap-2 text-[11px]"
                                    >
                                      <span className="min-w-0 truncate font-semibold text-[#3b312d]">
                                        {helper.name}
                                      </span>

                                      <div className="flex shrink-0 items-center gap-1.5">
                                        <span className="font-semibold text-[#8a7b70]">
                                          {helper.block}-{helper.flat_no}
                                        </span>
                                        <span className="rounded-full bg-[#fff1d9] px-2 py-0.5 text-[9px] font-bold text-[#a70e18]">
                                          Qty: {helper.quantity}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {item.completed ? (
                            <div className="mt-3 flex items-center justify-center gap-2 rounded-[10px] bg-[#f0f8f1] py-2.5 text-[10px] font-bold text-[#287638]">
                              <i className="fa-solid fa-circle-check" />
                              Target Completed
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                openForm(item)
                              }
                              className="mt-3 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white shadow-[0_7px_16px_rgba(167,8,18,0.16)]"
                            >
                              <i className="fa-solid fa-hand-holding-heart" />
                              Want to Help?
                            </button>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              <div className="mt-5 rounded-[12px] border border-[#f0dfbd] bg-[#fff8ea] p-3.5 text-[11px] leading-[1.5] text-[#6f6259]">
                <i className="fa-solid fa-circle-info mr-2 text-[#a70e18]" />
                Received quantities are updated only after the Puja Committee verifies the contribution.
              </div>
            </section>
          )}

          {/* ====================================================
              STEP 2
          ==================================================== */}

          {step === 2 && (
            <section className="rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white p-6 shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px] max-[600px]:p-3">

              <h2 className="font-serif text-[25px]">
                Confirm Your Help
              </h2>

              <p className="mt-1 text-[13px] text-[#737983]">
                Please review your details before submitting.
              </p>

              <div className="mt-5 rounded-[13px] bg-[#fcf7ed] p-4">

                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <div className="text-[10px] text-[#8a7b70]">
                      Name
                    </div>

                    <div className="mt-1 text-[12px] font-bold">
                      {name}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-[#8a7b70]">
                      Mobile
                    </div>

                    <div className="mt-1 text-[12px] font-bold">
                      +91 {mobile}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-[#8a7b70]">
                      Block
                    </div>

                    <div className="mt-1 text-[12px] font-bold">
                      {block}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-[#8a7b70]">
                      Flat
                    </div>

                    <div className="mt-1 text-[12px] font-bold">
                      {flatNo}
                    </div>
                  </div>

                </div>
              </div>

              <div className="mt-4 rounded-[13px] border border-[#eadfd2] bg-[#fffdf9] p-4">

                <div className="flex items-center gap-3">

                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f8e8e5] text-[#a70e18]">
                    <i
                      className={`fa-solid ${
                        selectedItem?.icon ||
                        "fa-box"
                      }`}
                    />
                  </span>

                  <div className="flex-1">

                    <div className="text-[13px] font-bold">
                      {selectedItem?.item_name}
                    </div>

                    <div className="mt-1 text-[10px] text-[#777]">
                      Quantity:{" "}
                      <strong className="text-[#a70e18]">
                        {quantity}{" "}
                        {selectedItem?.unit}
                      </strong>
                    </div>

                    {isGasCylinder &&
                      brand && (
                        <div className="mt-1 text-[10px] text-[#777]">
                          Brand:{" "}
                          <strong>
                            {brand}
                          </strong>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-[10px] border border-[#f1cccc] bg-[#fff1f1] px-3 py-2.5 text-xs text-[#a20d16]">
                  <i className="fa-solid fa-circle-exclamation mr-2" />
                  {error}
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setStep(1)
                  }
                  disabled={loading}
                  className="min-h-[50px] rounded-[12px] border border-[#e3d6c8] bg-[#fffaf4] text-[13px] font-bold text-[#705e53]"
                >
                  <i className="fa-solid fa-arrow-left mr-2" />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={submitRequest}
                  disabled={loading}
                  className="flex min-h-[50px] items-center justify-center gap-2 rounded-[12px] bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[13px] font-bold text-white disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      Submitting
                      <i className="fa-solid fa-spinner fa-spin" />
                    </>
                  ) : (
                    <>
                      Submit Request
                      <i className="fa-solid fa-check" />
                    </>
                  )}
                </button>

              </div>
            </section>
          )}

          {/* ====================================================
              STEP 3
          ==================================================== */}

          {step === 3 && (
            <section className="rounded-[22px] bg-white p-8 text-center shadow-[0_14px_35px_rgba(68,44,20,0.10)]">

              <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#a70e18] text-3xl text-white">
                <i className="fa-solid fa-check" />
              </div>

              <h2 className="mt-5 font-serif text-[30px]">
                Thank You!
              </h2>

              <p className="mt-2 text-sm">
                Thank you,{" "}
                <strong>{name}</strong>.
              </p>

              <p className="mt-2 text-xs leading-6 text-[#707070]">
                Your inventory support request has been successfully submitted to the BUH Durga Puja Committee.
              </p>

              <div className="mx-auto my-6 max-w-[380px] rounded-[13px] bg-[#fcf7ed] p-4 text-left">

                <div className="flex justify-between text-xs">
                  <span>
                    Request No.
                  </span>

                  <strong className="text-[#a70e18]">
                    {requestNo}
                  </strong>
                </div>

                <div className="mt-3 flex justify-between text-xs">
                  <span>
                    Item
                  </span>

                  <strong>
                    {selectedItem?.item_name}
                  </strong>
                </div>

                <div className="mt-3 flex justify-between text-xs">
                  <span>
                    Quantity
                  </span>

                  <strong>
                    {quantity}{" "}
                    {selectedItem?.unit}
                  </strong>
                </div>

                <div className="mt-3 flex justify-between text-xs">
                  <span>
                    Flat
                  </span>

                  <strong>
                    {block}-{flatNo}
                  </strong>
                </div>

              </div>

              <div className="rounded-[12px] border border-[#f0dfbd] bg-[#fff8ea] p-4 text-left">

                <strong className="text-[13px]">
                  Your support makes a difference.
                </strong>

                <p className="mt-1 text-xs leading-5 text-[#666]">
                  The Puja Committee will contact you regarding collection or arrangement of the item.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="mt-7 rounded-[12px] bg-gradient-to-br from-[#a70812] to-[#c70d18] px-6 py-3 text-[13px] font-bold text-white"
              >
                Help With Another Item
              </button>

              <div className="mt-7 font-serif text-xs font-bold tracking-[5px] text-[#a70e18]">
                JAI MAA DURGA
              </div>
            </section>
          )}

          {/* ====================================================
              FOOTER
          ==================================================== */}

          <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-[16px] border border-[#eadfd2] bg-[#fffaf3] sm:grid-cols-4">

            {[
              [
                "fa-box-open",
                "Support",
                "The Puja",
              ],
              [
                "fa-people-group",
                "Stronger",
                "Community",
              ],
              [
                "fa-heart",
                "Seva",
                "Devotion",
              ],
              [
                "fa-heart",
                "Together",
                "We Celebrate",
              ],
            ].map(
              ([icon, first, second]) => (
                <div
                  key={first}
                  className="px-3 py-4 text-center"
                >
                  <i
                    className={`fa-solid ${icon} text-[17px] text-[#a70e18]`}
                  />

                  <div className="mt-1 text-[10px] font-bold leading-[1.35] text-[#65564d]">
                    {first}
                    <br />
                    {second}
                  </div>
                </div>
              )
            )}
          </div>

          <footer className="pb-5 pt-7 text-center">

            <div className="flex items-center justify-center gap-3 text-[#c8952e]">
              <span className="h-px w-[65px] bg-[#c8952e]" />
              <i className="fa-solid fa-spa" />
              <span className="h-px w-[65px] bg-[#c8952e]" />
            </div>

            <h3 className="mt-3 font-serif text-[13px] font-bold tracking-[5px] text-[#a70e18]">
              JAI MAA DURGA
            </h3>

            <p className="mt-1 text-[9px] tracking-[4px] text-[#7b6d60]">
              A STRONGER COMMUNITY TOGETHER
            </p>
          </footer>
        </div>

        {/* ======================================================
            HELP MODAL
        ====================================================== */}

        {selectedItem &&
          step === 1 && (
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(35,20,10,0.55)] px-3 py-5 backdrop-blur-[3px]"
              onClick={closeForm}
            >

              <div
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-[20px] bg-[#fffdf9] shadow-2xl"
              >

                <div className="border-b border-[#eadfd2] bg-[#fff8ee] p-5">

                  <div className="flex items-start justify-between">

                    <div>
                      <div className="text-[9px] font-bold tracking-[3px] text-[#a70e18]">
                        INVENTORY SEVA
                      </div>

                      <h2 className="mt-1 font-serif text-[23px]">
                        Want to Help?
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={closeForm}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8e8e5] text-[#a70e18]"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>

                  </div>
                </div>

                <div className="p-5 max-[600px]:p-3">

                  <div className="mb-5 flex items-center gap-3 rounded-[12px] bg-[#fff8ea] p-3">

                    <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#a70e18] text-white">
                      <i
                        className={`fa-solid ${
                          selectedItem.icon ||
                          "fa-box"
                        }`}
                      />
                    </span>

                    <div>
                      <div className="text-[13px] font-bold">
                        {selectedItem.item_name}
                      </div>

                      <div className="text-[10px] text-[#777]">
                        Still needed:{" "}
                        <strong className="text-[#a70e18]">
                          {selectedItem.remaining_quantity}{" "}
                          {selectedItem.unit}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <InputField
                    icon="fa-user"
                    label="Name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={setName}
                    required
                  />

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">

                    <CustomSelect
                      icon="fa-building"
                      label="Block"
                      placeholder="Select Block"
                      value={block}
                      options={[
                        ...BLOCKS,
                      ]}
                      open={
                        openDropdown ===
                        "block"
                      }
                      onToggle={() =>
                        setOpenDropdown(
                          openDropdown ===
                            "block"
                            ? null
                            : "block"
                        )
                      }
                      onChange={(value) => {
                        setBlock(
                          value as Block
                        );
                        setFlatNo("");
                        setFlatSearch("");
                        setOpenDropdown(
                          null
                        );
                      }}
                    />

                    <FlatSelect
                      block={block}
                      value={flatNo}
                      search={flatSearch}
                      setSearch={
                        setFlatSearch
                      }
                      open={
                        openDropdown ===
                        "flat"
                      }
                      onToggle={() =>
                        setOpenDropdown(
                          openDropdown ===
                            "flat"
                            ? null
                            : "flat"
                        )
                      }
                      onChange={(value) => {
                        setFlatNo(value);
                        setFlatSearch("");
                        setOpenDropdown(
                          null
                        );
                      }}
                    />

                  </div>

                  <div className="mt-3">
                    <InputField
                      icon="fa-phone"
                      label="Mobile Number"
                      placeholder="10-digit mobile number"
                      value={mobile}
                      onChange={(value) =>
                        setMobile(
                          value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              10
                            )
                        )
                      }
                      type="tel"
                      required
                    />
                  </div>

                  {isGasCylinder && (
                    <div className="mt-3">
                      <InputField
                        icon="fa-fire-flame-simple"
                        label="Gas Cylinder Brand"
                        placeholder="Indane, HP, Bharatgas..."
                        value={brand}
                        onChange={
                          setBrand
                        }
                        required
                      />
                    </div>
                  )}

                  <div className="mt-3">

                    <InputField
                      icon="fa-cubes"
                      label={`Quantity (${selectedItem.unit})`}
                      placeholder="Enter quantity"
                      value={quantity}
                      onChange={(value) =>
                        setQuantity(
                          value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      type="number"
                      required
                    />

                    <p className="mt-1.5 text-[10px] text-[#777]">
                      Maximum required now:{" "}
                      <strong className="text-[#a70e18]">
                        {
                          selectedItem.remaining_quantity
                        }{" "}
                        {
                          selectedItem.unit
                        }
                      </strong>
                    </p>
                  </div>

                  {error && (
                    <div className="mt-4 rounded-[10px] border border-[#f1cccc] bg-[#fff1f1] px-3 py-2.5 text-xs text-[#a20d16]">
                      <i className="fa-solid fa-circle-exclamation mr-2" />
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={reviewRequest}
                    className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[13px] font-bold text-white shadow-lg"
                  >
                    Review Request
                    <i className="fa-solid fa-arrow-right" />
                  </button>

                </div>
              </div>
            </div>
          )}
      </main>
    </>
  );
}