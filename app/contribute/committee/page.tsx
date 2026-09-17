"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Step = 1 | 2 | 3;

type Block = "P1" | "P2" | "Villa";

type ResidentType = "Owner" | "Tenant";

type CollectionStatus =
  | "Pay Now"
  | "Door Lock"
  | "Follow-up"
  | "Not Interested";

type PaymentMethod = "upi" | "cash";

type LastYearPaidRecord = {
  block: string;
  flat_no: string;
  amount: number;
  resident_type?: string | null;
};

const DURGA_IMAGE = "/images/durga-puja-collection.webp";

const BLOCKS: Block[] = ["P1", "P2", "Villa"];

const RESIDENT_TYPES: ResidentType[] = ["Owner", "Tenant"];

const COLLECTION_STATUSES: CollectionStatus[] = [
  "Pay Now",
  "Door Lock",
  "Follow-up",
  "Not Interested",
];

const CASH_RECEIVERS = [
  "Debadutta Mishra",
  "Brajesh Kumar",
  "Hira Lal",
  "Rahul Kumar",
];

function generateFlats(
  start: number,
  end: number
) {
  const flats: string[] = [];

  for (let i = start; i <= end; i++) {
    flats.push(String(i).padStart(3, "0"));
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

export default function CommitteeContributePage() {
  const [step, setStep] = useState<Step>(1);

  const [name, setName] = useState("");
  const [block, setBlock] = useState<Block | "">("");
  const [flatNo, setFlatNo] = useState("");
  const [residentType, setResidentType] =
    useState<ResidentType | "">("");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");

  const [collectionStatus] =
    useState<CollectionStatus>("Pay Now");

  const [collectedBy, setCollectedBy] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("upi");

  const [utr, setUtr] = useState("");

  const [flatSearch, setFlatSearch] = useState("");
  const [showFlatDropdown, setShowFlatDropdown] =
    useState(false);

  const [paidFlats, setPaidFlats] = useState<string[]>(
    []
  );

  const [lastYearPaid, setLastYearPaid] = useState<
    LastYearPaidRecord[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentId, setPaymentId] = useState("");

  const flatDropdownRef = useRef<HTMLDivElement>(null);

  const upiId =
    process.env.NEXT_PUBLIC_UPI_ID ||
    "9036082478@ptsbi";

  const upiName =
    process.env.NEXT_PUBLIC_UPI_NAME ||
    "BUH Durga Puja";

  const numericAmount = Number(amount);

  /*
   * Load flats which already have a contribution
   * record that is not rejected.
   */
  useEffect(() => {
    async function loadPaidFlats() {
      try {
        const response = await fetch(
          "/api/contributions/paid-flats"
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setPaidFlats(
          (data ?? []).map(
            (item: {
              block: string;
              flat_no: string;
            }) =>
              `${item.block}-${item.flat_no}`
          )
        );
      } catch (error) {
        console.error(
          "Unable to load paid flats:",
          error
        );
      }
    }

    loadPaidFlats();

    async function loadLastYearPaid() {
      try {
        const response = await fetch(
          "/api/lastyearpaid",
          { cache: "no-store" }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setLastYearPaid(
          (data ?? []).map(
            (item: LastYearPaidRecord) => ({
              block: item.block,
              flat_no: item.flat_no,
              amount: Number(item.amount),
              resident_type: item.resident_type ?? null,
            })
          )
        );
      } catch (error) {
        console.error(
          "Unable to load last year paid data:",
          error
        );
      }
    }

    loadLastYearPaid();
  }, []);

  /*
   * Close searchable flat dropdown when clicking outside.
   */
  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        flatDropdownRef.current &&
        !flatDropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setShowFlatDropdown(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /*
   * Reset flat when block changes.
   */
  function handleBlockChange(
    value: Block
  ) {
    setBlock(value);
    setFlatNo("");
    setFlatSearch("");
    setShowFlatDropdown(false);
    setError("");
  }

  /*
   * Flats shown inside searchable dropdown.
   */
  const filteredFlats = useMemo(() => {
    if (!block) {
      return [];
    }

    const search = flatSearch
      .trim()
      .toLowerCase();

    return FLATS[block].filter((flat) =>
      flat.toLowerCase().includes(search)
    );
  }, [block, flatSearch]);

  function isFlatPaid(flat: string) {
    if (!block) {
      return false;
    }

    return paidFlats.includes(
      `${block}-${flat}`
    );
  }

  function getLastYearPaid(flat: string) {
    if (!block || !flat) {
      return null;
    }

    // Prefer a resident-specific record (used where a flat has
    // separate Owner/Tenant historical payments), then fall back
    // to the normal block + flat record.
    if (residentType) {
      const residentRecord = lastYearPaid.find(
        (item) =>
          item.block === block &&
          item.flat_no === flat &&
          item.resident_type === residentType
      );

      if (residentRecord) {
        return residentRecord;
      }
    }

    return (
      lastYearPaid.find(
        (item) =>
          item.block === block &&
          item.flat_no === flat &&
          !item.resident_type
      ) ||
      lastYearPaid.find(
        (item) =>
          item.block === block &&
          item.flat_no === flat
      ) ||
      null
    );
  }

  const selectedLastYearPaid = getLastYearPaid(flatNo);

  function selectFlat(flat: string) {
    if (isFlatPaid(flat)) {
      return;
    }

    setFlatNo(flat);
    setFlatSearch(flat);
    setShowFlatDropdown(false);
    setError("");
  }

  /*
   * UPI deep link.
   */
  const upiUrl =
    `upi://pay` +
    `?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(upiName)}` +
    `&am=${numericAmount.toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(
      `BUH Durga Puja - ${block}-${flatNo}`
    )}`;

  /*
   * QR image URL.
   */
  const qrUrl =
    `https://api.qrserver.com/v1/create-qr-code/` +
    `?size=400x400` +
    `&margin=10` +
    `&data=${encodeURIComponent(upiUrl)}`;

  function continueToPayment() {
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!block) {
      setError("Please select your block.");
      return;
    }

    if (!flatNo) {
      setError("Please select your flat number.");
      return;
    }

    if (isFlatPaid(flatNo)) {
      setError(
        "This flat already has a contribution record."
      );
      return;
    }

    if (!residentType) {
      setError(
        "Please select Owner or Tenant."
      );
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a valid contribution amount."
      );
      return;
    }

    setStep(2);
  }

  async function submitContribution() {
    setError("");

    if (!block || !flatNo) {
      setError(
        "Please select your block and flat."
      );
      setStep(1);
      return;
    }

    if (isFlatPaid(flatNo)) {
      setError(
        "This flat already has a contribution record."
      );
      setStep(1);
      return;
    }

    if (
      paymentMethod === "upi" &&
      !utr.trim()
    ) {
      setError(
        "Please enter the UTR / Transaction ID."
      );
      return;
    }

    if (paymentMethod === "cash" && !collectedBy) {
      setError("Please select the committee member who collected the cash.");
      return;
    }


    try {
      setLoading(true);

      const response = await fetch(
        "/api/contributions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            block,
            flatNo,
            residentType,
            mobile,
            amount: numericAmount,
            collectionStatus,
            paymentMethod,
            utr:
              paymentMethod === "upi"
                ? utr.trim()
                : null,
            paidTo:
              paymentMethod === "cash"
                ? collectedBy
                : null,
            collectionChannel: "committee",
            collectedBy:
              paymentMethod === "cash"
                ? collectedBy
                : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to submit contribution."
        );
        return;
      }

      const generatedPaymentId =
        data?.contribution?.payment_id ||
        data?.contribution?.paymentId ||
        data?.contribution?.id ||
        "";

      setPaymentId(String(generatedPaymentId));

      /*
       * Immediately grey out this flat locally.
       */
      setPaidFlats((previous) => {
        const key = `${block}-${flatNo}`;

        if (previous.includes(key)) {
          return previous;
        }

        return [...previous, key];
      });

      setStep(3);
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
      />

      <main className="font-sans text-[#292929] [font-family:Inter,Arial,Helvetica,sans-serif] relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#fffaf2_0%,#f8eddd_48%,#efdfca_100%)] px-4 py-[24px] pb-[36px] max-[600px]:px-2 max-[600px]:py-2 max-[600px]:pb-5">

        {/* DECORATIVE BACKGROUND */}

        <div className="pointer-events-none fixed left-[-290px] top-[150px] h-[420px] w-[420px] rounded-full opacity-[0.12] bg-[repeating-radial-gradient(circle,transparent_0px,transparent_18px,#c99336_19px,transparent_21px)]" />

        <div className="pointer-events-none fixed right-[-290px] bottom-[100px] h-[420px] w-[420px] rounded-full opacity-[0.12] bg-[repeating-radial-gradient(circle,transparent_0px,transparent_18px,#c99336_19px,transparent_21px)]" />

        <div className="pointer-events-none fixed bottom-[-180px] left-[-170px] h-[700px] w-[270px] rotate-[18deg] opacity-90 bg-[linear-gradient(135deg,transparent_0_15%,#b80c15_16%,#e32328_38%,#a90913_65%,transparent_66%)] drop-shadow-[0_10px_15px_rgba(80,0,0,0.08)]" />

        <div className="pointer-events-none fixed right-[-180px] bottom-[-170px] h-[700px] w-[270px] -rotate-[18deg] opacity-90 bg-[linear-gradient(135deg,transparent_0_15%,#b80c15_16%,#e32328_38%,#a90913_65%,transparent_66%)] drop-shadow-[0_10px_15px_rgba(80,0,0,0.08)]" />

        <div className="pointer-events-none fixed bottom-[90px] left-[-25px] text-[100px] text-[#d09a34] opacity-[0.18]">
          ✿
        </div>

        <div className="pointer-events-none fixed right-[-25px] bottom-[140px] text-[100px] text-[#d09a34] opacity-[0.18]">
          ✿
        </div>

        <div className="relative z-[5] mx-auto mt-[30px] w-full max-w-[650px] max-[850px]:max-w-[760px]">

          {/* HERO */}

          <section className="relative min-h-[250px] overflow-visible rounded-[24px] border border-[#ead9c7] bg-gradient-to-br from-white/[0.97] to-[#fff9ef]/[0.98] px-7 pb-5 pt-5 shadow-[0_18px_50px_rgba(77,48,20,0.10)] max-[600px]:min-h-[285px] max-[600px]:rounded-[18px] max-[600px]:px-3 max-[600px]:pb-3 max-[600px]:pt-3">

            <div className="pointer-events-none absolute inset-0 rounded-[28px] opacity-[0.12] bg-[radial-gradient(circle_at_15%_25%,#d3a044_1px,transparent_2px)] bg-[size:30px_30px]" />

            <div className="absolute left-[55px] top-[105px] z-[5] flex flex-col gap-0 text-left text-[10px] font-bold leading-[1.8] tracking-[4px] text-[#73594b] max-[850px]:left-6 max-[600px]:hidden">
              <span>TOGETHER</span>
              <span>WE CELEBRATE</span>
              <span>OUR COMMUNITY</span>

              <div className="mt-2 h-[2px] w-10 bg-[#d09a32]" />
            </div>

            <div className="absolute right-[55px] top-[105px] z-[5] flex flex-col items-end gap-0 text-right text-[10px] font-bold leading-[1.8] tracking-[4px] text-[#73594b] max-[850px]:right-6 max-[600px]:hidden">
              <span>FAITH</span>
              <span>COMMUNITY</span>
              <span>HARMONY</span>

              <div className="mt-2 h-[2px] w-10 bg-[#d09a32]" />
            </div>

            <div className="absolute left-1/2 top-[-50px] z-[4] flex h-[270px] w-[270px] -translate-x-1/2 justify-center max-[600px]:top-[-10px] max-[600px]:h-[170px] max-[600px]:w-[170px]">

              <div className="absolute -top-[25px] h-[270px] w-[270px] rounded-full bg-[radial-gradient(circle,rgba(210,157,47,0.25),transparent_68%)] max-[600px]:h-[200px] max-[600px]:w-[200px]" />

              <img
                src={DURGA_IMAGE}
                alt="Maa Durga"
                className="relative z-[1] h-[270px] w-[270px] object-contain object-center max-[600px]:h-[170px] max-[600px]:w-[170px]"
              />
            </div>

            <div className="relative z-[6] pt-[215px] text-center max-[600px]:pt-[145px]">

              <div className="text-[10px] font-bold tracking-[5px] text-[#795044] max-[600px]:text-[7px] max-[600px]:tracking-[2px]">
                COMMITTEE COLLECTION
              </div>

              <h1 className="mt-2 text-[30px] font-bold leading-[1.02] text-[#a80d17] font-open-sans max-[600px]:text-[27px]">
                BUH Durga Puja 2026
              </h1>

              <p className="mt-2 font-serif text-[15px] italic text-[#7b5b4e] max-[600px]:text-[11px]">
                Let&apos;s come together to make this
                celebration grander!
              </p>

              <div className="mt-3 flex items-center justify-center gap-3 text-[#d09a32] max-[600px]:mt-2">
                <span />
                <i className="text-[23px] text-[#a70e18] fa-solid fa-spa" />
                <span />
              </div>

            </div>
          </section>

          {/* STEPS */}

          <section className="flex items-start px-6 pb-3 pt-3 max-[600px]:px-0 max-[600px]:pb-2 max-[600px]:pt-2">

            <StepItem
              number="1"
              title="Contribution Details"
              active={step >= 1}
              completed={step > 1}
            />

            <div
              className={`mt-[22px] h-px flex-1 bg-[#d7d8db] max-[600px]:mt-[18px] ${
                step > 1
                  ? "bg-[#c79531]"
                  : ""
              }`}
            />

            <StepItem
              number="2"
              title="Payment & Confirmation"
              active={step >= 2}
              completed={step > 2}
            />

            <div
              className={`mt-[22px] h-px flex-1 bg-[#d7d8db] max-[600px]:mt-[18px] ${
                step > 2
                  ? "bg-[#c79531]"
                  : ""
              }`}
            />

            <StepItem
              number="3"
              title="Submitted"
              active={step >= 3}
              completed={step > 3}
            />

          </section>

          {/* STEP 1 */}

          {step === 1 && (
            <section className="relative overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">

              <div className="px-6 pb-2 pt-5 max-[600px]:px-3 max-[600px]:pb-1 max-[600px]:pt-3">

                <div className="mb-3 max-[600px]:mb-2">

                  <h2 className="m-0 font-serif text-[25px] text-[#292929] max-[600px]:text-[19px]">
                    Contribution Details
                  </h2>

                  <p className="mt-2 text-[13px] text-[#737983] max-[600px]:text-[9px] max-[600px]:leading-[1.4]">
                    Please enter the resident details and record the contribution.
                  </p>

                </div>

                <div className="flex flex-col gap-3">

                  {/* NAME */}

                  <InputField
                    icon="fa-user"
                    label="Name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={setName}
                  />

                  {/* BLOCK + FLAT */}

                  <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">

                    <SelectField
                      icon="fa-building"
                      label="Block"
                      value={block}
                      placeholder="Select Block"
                      options={BLOCKS}
                      onChange={(value) =>
                        handleBlockChange(
                          value as Block
                        )
                      }
                    />

                    {/* SEARCHABLE FLAT */}

                    <div
                      ref={flatDropdownRef}
                      className="relative flex flex-col gap-1"
                    >

                      <label className="text-[13px] font-semibold text-[#333]">
                        Flat No.
                      </label>

                      <div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white transition duration-200 focus-within:border-[#b3121b] focus-within:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px]">

                        <div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]">
                          <i className="fa-solid fa-house" />
                        </div>

                        <input
                          type="text"
                          disabled={!block}
                          placeholder={
                            block
                              ? "Search flat"
                              : "Select block first"
                          }
                          value={flatSearch}
                          onFocus={() => {
                            if (block) {
                              setShowFlatDropdown(
                                true
                              );
                            }
                          }}
                          onChange={(e) => {
                            setFlatSearch(
                              e.target.value
                            );
                            setFlatNo("");
                            setShowFlatDropdown(
                              true
                            );
                          }}
                          className="h-[52px] flex-1 border-0 bg-transparent pr-3 text-[15px] text-[#292929] outline-none placeholder:text-[#a1a5ad] disabled:cursor-not-allowed disabled:opacity-60 max-[600px]:h-[47px]"
                        />

                        <i className="mr-4 text-[11px] text-[#999] fa-solid fa-chevron-down" />
                      </div>

                      {showFlatDropdown &&
                        block && (
                          <div className="absolute left-0 right-0 top-[77px] z-[50] max-h-[260px] overflow-y-auto rounded-[11px] border border-[#e2d8cd] bg-white p-1.5 shadow-[0_15px_35px_rgba(50,30,10,0.16)]">

                            {filteredFlats.length ===
                            0 ? (
                              <div className="px-3 py-4 text-center text-[12px] text-[#888]">
                                No flats found
                              </div>
                            ) : (
                              filteredFlats.map(
                                (flat) => {
                                  const paid =
                                    isFlatPaid(
                                      flat
                                    );

                                  return (
                                    <button
                                      key={`${block}-${flat}`}
                                      type="button"
                                      disabled={paid}
                                      onClick={() =>
                                        selectFlat(
                                          flat
                                        )
                                      }
                                      className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                                        paid
                                          ? "cursor-not-allowed bg-[#f3f3f3] text-[#aaa]"
                                          : flatNo ===
                                              flat
                                            ? "bg-[#faeeee] text-[#a70e18]"
                                            : "text-[#333] hover:bg-[#fff1f1] hover:text-[#a70e18]"
                                      }`}
                                    >
                                      <span>
                                        {flat}
                                      </span>

                                      {paid && (
                                        <span className="text-[11px] font-semibold text-[#999]">
                                          <i className="mr-1 fa-solid fa-check" />
                                          Paid
                                        </span>
                                      )}
                                    </button>
                                  );
                                }
                              )
                            )}
                          </div>
                        )}

                    </div>
                  </div>

                  {/* LAST YEAR PAID */}
                  {block && flatNo && (
                    <div className="flex items-center justify-between rounded-[11px] border border-[#ead9c7] bg-[#fcf8f1] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f8e9d1] text-[#a70e18]">
                          <i className="fa-solid fa-clock-rotate-left text-[13px]" />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-[#555]">
                            Last Year Paid
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#999]">
                            Durga Puja 2025
                          </p>
                        </div>
                      </div>

                      {selectedLastYearPaid ? (
                        <div className="text-right">
                          <p className="text-[16px] font-bold text-[#a70e18]">
                            ₹{Number(selectedLastYearPaid.amount).toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px] font-semibold text-[#4f8a5b]">
                            Paid
                          </p>
                        </div>
                      ) : (
                        <span className="rounded-full bg-[#f1f1f1] px-3 py-1.5 text-[11px] font-semibold text-[#777]">
                          Not Paid
                        </span>
                      )}
                    </div>
                  )}

                  {/* OWNER / TENANT */}

                  <SelectField
                    icon="fa-user-tag"
                    label="Resident Type"
                    value={residentType}
                    placeholder="Select Owner / Tenant"
                    options={RESIDENT_TYPES}
                    onChange={(value) =>
                      setResidentType(
                        value as ResidentType
                      )
                    }
                  />

                  {/* MOBILE */}

                  <div className="flex flex-col gap-1">

                    <label className="text-[13px] font-semibold text-[#333]">
                      Mobile Number
                    </label>

                    <div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white transition duration-200 focus-within:border-[#b3121b] focus-within:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px]">

                      <div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]">
                        <i className="fa-solid fa-phone" />
                      </div>

                      <div className="pr-3 text-[12px] text-[#555] max-[600px]:pr-2">
                        🇮🇳 <span>+91</span>
                      </div>

                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={mobile}
                        onChange={(e) =>
                          setMobile(
                            e.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                        className="h-[52px] flex-1 border-0 bg-transparent text-[15px] text-[#292929] outline-none placeholder:text-[#a1a5ad] max-[600px]:h-[47px]"
                      />

                    </div>

                  </div>

                  {/* AMOUNT */}

                  <div className="flex flex-col gap-1">

                    <label className="text-[13px] font-semibold text-[#333]">
                      Contribution Amount
                    </label>

                    <div className="grid grid-cols-[minmax(220px,1fr)_auto] items-center gap-2 max-[850px]:grid-cols-1">

                      <div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white transition duration-200 focus-within:border-[#b3121b] focus-within:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px]">

                        <div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]">
                          ₹
                        </div>

                        <input
                          type="number"
                          min="1"
                          placeholder="Enter amount (in ₹)"
                          value={amount}
                          onChange={(e) =>
                            setAmount(
                              e.target.value
                            )
                          }
                          className="h-[52px] flex-1 border-0 bg-transparent pr-3 text-[15px] outline-none max-[600px]:h-[47px]"
                        />

                      </div>

                      <div className="flex gap-1 max-[850px]:justify-start max-[600px]:grid max-[600px]:grid-cols-4 max-[600px]:gap-[5px]">

                        {[501, 1001, 2501, 5001].map(
                          (value) => (
                            <button
                              key={value}
                              type="button"
                              className={`h-[38px] rounded-[9px] border border-[#f0d9d9] bg-[#fbefef] px-3 text-[11px] font-bold text-[#a20f18] transition duration-200 hover:border-[#a70e18] hover:bg-[#a70e18] hover:text-white max-[600px]:h-[34px] max-[600px]:w-full max-[600px]:px-0 max-[600px]:text-[9px] ${
                                Number(
                                  amount
                                ) === value
                                  ? "!border-[#a70e18] !bg-[#a70e18] !text-white"
                                  : ""
                              }`}
                              onClick={() =>
                                setAmount(
                                  String(value)
                                )
                              }
                            >
                              ₹
                              {value.toLocaleString(
                                "en-IN"
                              )}
                            </button>
                          )
                        )}

                      </div>
                    </div>
                  </div>

                  {/* ERROR */}

                  {error && (
                    <ErrorMessage
                      message={error}
                    />
                  )}

                  {/* CTA */}

                  <button
                    type="button"
                    className="flex min-h-[50px] w-full items-center justify-center gap-[15px] rounded-[12px] border-0 bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition duration-200 hover:-translate-y-px"
                    onClick={
                      continueToPayment
                    }
                  >
                    <span>
                      Continue to Payment
                    </span>

                    <i className="fa-solid fa-arrow-right" />
                  </button>

                </div>

                <div className="my-2 flex items-center justify-center gap-2 text-[12px] text-[#687078]">
                  <i className="fa-solid fa-lock" />
                  <span>
                    Your information is safe and secure
                  </span>
                </div>

              </div>

              <Benefits />

            </section>
          )}

          {/* STEP 2 */}

          {step === 2 && (
            <section className="relative overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">

              <div className="px-[45px] pb-6 pt-6 max-[600px]:px-4 max-[600px]:pb-[17px] max-[600px]:pt-[26px]">

                <div className="mb-[22px] text-center">

                  <h2 className="m-0 font-serif text-[25px] text-[#292929] max-[600px]:text-[19px]">
                    Payment & Confirmation
                  </h2>

                  <p className="mt-2 text-[14px] text-[#737983]">
                    Complete your payment and submit
                    the transaction details.
                  </p>

                </div>

                {/* SUMMARY */}

                <div className="mb-5 grid grid-cols-4 gap-3 rounded-[13px] bg-[#fcf8f1] p-[15px] max-[600px]:grid-cols-2">

                  <SummaryItem
                    label="Block"
                    value={block}
                  />

                  <SummaryItem
                    label="Flat"
                    value={flatNo}
                  />

                  <SummaryItem
                    label="Resident"
                    value={residentType}
                  />

                  <SummaryItem
                    label="Amount"
                    value={`₹${numericAmount.toLocaleString(
                      "en-IN"
                    )}`}
                  />

                </div>

                {/* PAYMENT METHOD */}

                <div className="mb-5">

                  <label className="mb-2 block text-[13px] font-semibold text-[#333]">
                    Payment Method
                  </label>

                  <div className="grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod(
                          "upi"
                        );
                        setCollectedBy("");
                        setError("");
                      }}
                      className={`flex min-h-[58px] items-center justify-center gap-3 rounded-[11px] border text-[13px] font-bold transition ${
                        paymentMethod === "upi"
                          ? "border-[#a70e18] bg-[#fff1f1] text-[#a70e18]"
                          : "border-[#ddd] bg-white text-[#555]"
                      }`}
                    >
                      <i className="fa-solid fa-qrcode" />
                      UPI / Online
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod(
                          "cash"
                        );
                        setUtr("");
                        setError("");
                      }}
                      className={`flex min-h-[58px] items-center justify-center gap-3 rounded-[11px] border text-[13px] font-bold transition ${
                        paymentMethod === "cash"
                          ? "border-[#a70e18] bg-[#fff1f1] text-[#a70e18]"
                          : "border-[#ddd] bg-white text-[#555]"
                      }`}
                    >
                      <i className="fa-solid fa-money-bill-wave" />
                      Cash
                    </button>

                  </div>
                </div>

                {/* UPI */}

                {paymentMethod === "upi" && (
                  <>

                    <div className="mb-4 rounded-[13px] bg-[#fcf8f1] px-[18px] py-[15px]">

                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-[#555]">
                          Contribution Amount
                        </span>

                        <strong className="text-[18px] text-[#a70e18]">
                          ₹
                          {numericAmount.toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>

                    </div>

                    <div className="text-center">

                      <div className="inline-flex w-[65%] rounded-[17px] border border-[#ededed] bg-white p-3 shadow-[0_8px_25px_rgba(0,0,0,0.07)] max-[600px]:w-[85%]">

                        <img
                          src={qrUrl}
                          alt="UPI Payment QR Code"
                          className="h-auto w-full"
                        />

                      </div>

                      <p className="mt-3 text-[13px] text-[#333]">
                        Scan with Google Pay,
                        PhonePe, Paytm or any UPI app
                      </p>

                      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">

                        <span className="text-[12px] text-[#555]">
                          Paying to
                        </span>

                        <strong className="text-[12px] text-[#222]">
                          {upiName}
                        </strong>

                        <div className="inline-flex items-center gap-2 rounded-lg bg-[#f6f6f6] px-3 py-[7px] text-[11px] text-[#737373]">
                          <span>
                            {upiId}
                          </span>

                          <button
                            type="button"
                            className="text-[#737373] hover:text-[#333]"
                            onClick={() =>
                              navigator.clipboard?.writeText(
                                upiId
                              )
                            }
                            aria-label="Copy UPI ID"
                          >
                            <i className="fa-regular fa-copy" />
                          </button>
                        </div>

                      </div>

                    </div>

                    <a
                      href={upiUrl}
                      className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-[15px] rounded-[12px] bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white no-underline shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition duration-200 hover:-translate-y-px"
                    >
                      <i className="fa-solid fa-mobile-screen-button" />
                      Open UPI App
                    </a>

                    {/* UTR ON SAME PAGE */}

                    <div className="mt-6">

                      <InputField
                        icon="fa-receipt"
                        label="UTR / Transaction ID"
                        placeholder="Enter UTR / Transaction ID"
                        value={utr}
                        onChange={setUtr}
                      />

                    </div>

                    <div className="my-[15px] flex gap-2 rounded-[11px] border border-[#f0dfbd] bg-[#fff8eb] px-[15px] py-[13px] text-[12px] text-[#725e3a]">

                      <i className="mt-0.5 fa-solid fa-circle-info" />

                      <p>
                        Payment is not confirmed until
                        the UTR / Transaction ID is filled
                        and submitted.
                      </p>

                    </div>

                  </>
                )}

                {/* CASH */}

                {paymentMethod === "cash" && (
                  <>

                    <div className="rounded-[13px] border border-[#f0dfbd] bg-[#fff8eb] p-[18px]">

                      <div className="mb-4 flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f8e9d1] text-[#a70e18]">
                          <i className="fa-solid fa-money-bill-wave" />
                        </div>

                        <div>
                          <h3 className="text-[15px] font-bold text-[#333]">
                            Cash Payment
                          </h3>

                          <p className="text-[12px] text-[#777]">
                            Select the committee member who
                            received the cash.
                          </p>
                        </div>

                      </div>

                      <SelectField
                        icon="fa-user-check"
                        label="Collected By"
                        value={collectedBy}
                        placeholder="Select committee member"
                        options={CASH_RECEIVERS}
                        onChange={setCollectedBy}
                      />

                      <p className="mt-2 text-[11px] text-[#8a776a]">
                        * Please select the committee member who collected this cash contribution.
                      </p>

                    </div>

                  </>
                )}

                {/* ERROR */}

                {error && (
                  <div className="mt-4">
                    <ErrorMessage
                      message={error}
                    />
                  </div>
                )}

                {/* SUBMIT */}

                <button
                  type="button"
                  disabled={
                    loading ||
                    (paymentMethod === "upi" &&
                      !utr.trim()) ||
                    (paymentMethod === "cash" &&
                      !collectedBy)
                  }
                  onClick={
                    submitContribution
                  }
                  className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-[15px] rounded-[12px] border-0 bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {loading ? (
                    <>
                      <span>
                        Submitting...
                      </span>

                      <i className="fa-solid fa-spinner fa-spin" />
                    </>
                  ) : (
                    <>
                      <span>
                        Submit Contribution
                      </span>

                      <i className="fa-solid fa-check" />
                    </>
                  )}

                </button>

                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center gap-2 border-0 bg-transparent text-[12px] font-semibold text-[#777]"
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                >
                  <i className="fa-solid fa-arrow-left" />
                  Change Details
                </button>

              </div>
            </section>
          )}

          {/* SUCCESS */}

          {step === 3 && (
            <section className="relative overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">

              <div className="px-[45px] pb-[50px] pt-[45px] text-center max-[600px]:px-[18px] max-[600px]:pb-10 max-[600px]:pt-[35px]">

                <div className="mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#a70e18] text-[29px] text-white shadow-[0_12px_28px_rgba(167,14,24,0.20)]">
                  <i className="fa-solid fa-check" />
                </div>

                <h2 className="m-0 font-serif text-[30px] text-[#292929] max-[600px]:text-[26px]">
                  Contribution Recorded
                </h2>

                <p className="mt-2">
                  Thank you, <strong>{name}</strong>.
                </p>

                <p className="mt-2 text-[13px] text-[#707070]">
                  Your contribution has been successfully recorded by the committee.
                </p>

                <div className="mx-auto my-[25px] max-w-[350px] rounded-[13px] bg-[#fcf7ed] p-[17px]">

                  <div className="flex justify-between text-[12px] text-[#666]">
                    <span>Block</span>
                    <strong>
                      {block}
                    </strong>
                  </div>

                  {paymentId && (
                    <div className="flex justify-between text-[12px] text-[#666]">
                      <span>Payment ID</span>
                      <strong className="max-w-[210px] truncate text-[#a70e18]">
                        {paymentId}
                      </strong>
                    </div>
                  )}

                  <div className="mt-2 flex justify-between text-[12px] text-[#666]">
                    <span>Flat</span>
                    <strong>
                      {flatNo}
                    </strong>
                  </div>

                  <div className="mt-2 flex justify-between text-[12px] text-[#666]">
                    <span>Amount</span>
                    <strong>
                      ₹
                      {numericAmount.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div className="mt-2 flex justify-between text-[12px] text-[#666]">
                    <span>Payment</span>
                    <strong>
                      {paymentMethod ===
                      "upi"
                        ? "UPI / Online"
                        : "Cash"}
                    </strong>
                  </div>

                </div>

                <div className="mx-auto flex max-w-[500px] gap-[11px] rounded-[12px] border border-[#f0dfbd] bg-[#fff8ea] p-[15px] text-left">

                  <i className="mt-0.5 fa-solid fa-shield-halved" />

                  <div>

                    <strong>
                      Payment Recorded
                    </strong>

                    <p className="mt-1 text-[12px] leading-[1.5] text-[#666]">

                      {paymentMethod ===
                      "upi"
                        ? "The UPI payment has been recorded with the UTR provided."
                        : "The cash payment has been recorded by the committee member selected above."}

                    </p>

                  </div>

                </div>

                <div className="mt-7 font-serif text-[12px] font-bold tracking-[5px] text-[#a70e18]">
                  JAI MAA DURGA
                </div>

              </div>
            </section>
          )}

          {/* FOOTER */}

          <footer>

            <div className="flex items-center justify-center gap-3 pt-7 text-[#c8952e]">
              <span className="h-px w-[65px] bg-[#c8952e]" />
              <i className="text-[17px] text-[#c8952e] fa-solid fa-spa" />
              <span className="h-px w-[65px] bg-[#c8952e]" />
            </div>

            <div className="relative z-[6] text-center">

              <h3 className="mt-[9px] font-serif text-[13px] font-bold tracking-[5px] text-[#a70e18] max-[600px]:text-[11px] max-[600px]:tracking-[4px]">
                JAI MAA DURGA
              </h3>

              <p className="mt-[7px] text-[9px] tracking-[4px] text-[#7b6d60]">
                A STRONGER COMMUNITY TOGETHER
              </p>

            </div>

          </footer>

        </div>
      </main>
    </>
  );
}

/* ==========================================================
   INPUT FIELD
========================================================== */

function InputField({
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">

      <label className="text-[13px] font-semibold text-[#333]">
        {label}
      </label>

      <div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white transition duration-200 focus-within:border-[#b3121b] focus-within:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px]">

        <div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]">
          <i
            className={`fa-solid ${icon}`}
          />
        </div>

        <input
          className="h-[52px] flex-1 border-0 bg-transparent pr-3 text-[15px] text-[#292929] outline-none placeholder:text-[#a1a5ad] max-[600px]:h-[47px]"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
        />

      </div>
    </div>
  );
}

/* ==========================================================
   SELECT FIELD
========================================================== */

function SelectField({
  icon,
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  icon: string;
  label: string;
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = value || placeholder;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-semibold text-[#333]">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          className={`flex min-h-[52px] w-full items-center rounded-[11px] border border-[#dedede] bg-white text-left transition duration-200 hover:border-[#c9c9c9] focus:outline-none focus:border-[#b3121b] focus:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px] ${
            open ? "border-[#b3121b] shadow-[0_0_0_4px_rgba(179,18,27,0.06)]" : ""
          }`}
        >
          <span className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]">
            <i className={`fa-solid ${icon}`} />
          </span>

          <span
            className={`flex-1 truncate pr-3 text-[15px] max-[600px]:text-[14px] ${
              value ? "text-[#292929]" : "text-[#a1a5ad]"
            }`}
          >
            {selectedLabel}
          </span>

          <i
            className={`mr-4 text-[10px] text-[#999] transition-transform duration-200 fa-solid fa-chevron-down ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-[40]"
              onClick={() => setOpen(false)}
            />

            <div className="absolute left-0 right-0 top-[58px] z-[50] overflow-hidden rounded-[11px] border border-[#e2d8cd] bg-white p-1.5 shadow-[0_15px_35px_rgba(50,30,10,0.16)] max-[600px]:top-[53px]">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[13px] transition ${
                  !value
                    ? "bg-[#faeeee] font-semibold text-[#a70e18]"
                    : "text-[#888] hover:bg-[#faf6f0] hover:text-[#a70e18]"
                }`}
              >
                <span>{placeholder}</span>
                {!value && <i className="fa-solid fa-check text-[10px]" />}
              </button>

              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                    value === option
                      ? "bg-[#faeeee] text-[#a70e18]"
                      : "text-[#333] hover:bg-[#fff1f1] hover:text-[#a70e18]"
                  }`}
                >
                  <span>{option}</span>
                  {value === option && (
                    <i className="fa-solid fa-check text-[10px]" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ==========================================================
   SUMMARY ITEM
========================================================== */

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="block text-[10px] text-[#888]">
        {label}
      </span>

      <strong className="mt-1 block truncate text-[12px] text-[#333]">
        {value || "-"}
      </strong>
    </div>
  );
}

/* ==========================================================
   ERROR
========================================================== */

function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex items-center gap-[9px] rounded-[9px] border border-[#f1cccc] bg-[#fff1f1] px-2.5 py-2 text-[12px] text-[#a20d16]">
      <i className="fa-solid fa-circle-exclamation" />
      <span>{message}</span>
    </div>
  );
}

/* ==========================================================
   STEP
========================================================== */

function StepItem({
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
    <div className="w-[130px] shrink-0 text-center max-[600px]:w-[75px]">

      <div
        className={`mx-auto flex h-[55px] w-[55px] items-center justify-center rounded-full text-[18px] font-bold max-[600px]:h-[42px] max-[600px]:w-[42px] max-[600px]:text-[14px] ${
          completed
            ? "bg-[#c7942f] text-white"
            : active
              ? "bg-[#ae0c16] text-white shadow-[0_8px_20px_rgba(174,12,22,0.20)]"
              : "bg-[#dfe1e4] text-[#777b80]"
        }`}
      >
        {completed ? (
          <i className="fa-solid fa-check" />
        ) : (
          number
        )}
      </div>

      <div
        className={`mt-[11px] whitespace-nowrap text-[12px] font-semibold max-[600px]:ml-[-2px] max-[600px]:w-20 max-[600px]:whitespace-normal max-[600px]:text-[9px] max-[600px]:leading-[1.3] ${
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

/* ==========================================================
   BENEFITS
========================================================== */

function Benefits() {
  return (
    <div className="mx-[14px] mb-[14px] mt-0 grid grid-cols-4 rounded-[16px] bg-[#fdf8ef] px-[10px] py-[18px] max-[600px]:mx-2 max-[600px]:mb-2 max-[600px]:grid-cols-2">

      <div className="flex min-h-[70px] flex-col items-center justify-center gap-2 border-r border-[#e1d8cc] text-center max-[600px]:min-h-[80px]">
        <i className="text-[23px] text-[#a70e18] fa-solid fa-users" />
        <span className="text-[12px] font-semibold leading-[1.4] text-[#555]">
          Stronger
          <br />
          Community
        </span>
      </div>

      <div className="flex min-h-[70px] flex-col items-center justify-center gap-2 border-r border-[#e1d8cc] text-center max-[600px]:min-h-[80px]">
        <i className="text-[23px] text-[#a70e18] fa-solid fa-spa" />
        <span className="text-[12px] font-semibold leading-[1.4] text-[#555]">
          Our Culture
          <br />
          Our Pride
        </span>
      </div>

      <div className="flex min-h-[70px] flex-col items-center justify-center gap-2 border-r border-[#e1d8cc] text-center max-[600px]:min-h-[80px]">
        <i className="text-[23px] text-[#a70e18] fa-solid fa-heart" />
        <span className="text-[12px] font-semibold leading-[1.4] text-[#555]">
          Your Support
          <br />
          Makes a Difference
        </span>
      </div>

      <div className="flex min-h-[70px] flex-col items-center justify-center gap-2 text-center max-[600px]:min-h-[80px]">
        <i className="text-[23px] text-[#a70e18] fa-solid fa-leaf" />
        <span className="text-[12px] font-semibold leading-[1.4] text-[#555]">
          A Cleaner
          <br />
          Brighter Tomorrow
        </span>
      </div>

    </div>
  );
}
