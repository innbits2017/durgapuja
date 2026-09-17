"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";

type Block = "P1" | "P2" | "Villa";
type ParticipantType = "Child" | "Adult" | "Senior Citizen";
type PerformanceType = "Individual" | "Group";

const DURGA_IMAGE = "/images/durga-puja-collection.webp";

const BLOCKS: Block[] = ["P1", "P2", "Villa"];

const PARTICIPANT_TYPES: ParticipantType[] = [
  "Child",
  "Adult",
  "Senior Citizen",
];

const PERFORMANCE_TYPES: PerformanceType[] = [
  "Individual",
  "Group",
];

const CATEGORIES = [
  "Dance",
  "Singing",
  "Drama / Skit",
  "Instrumental",
  "Recitation",
  "Other",
];

const DURATIONS = [
  "Up to 3 minutes",
  "3–5 minutes",
  "5–10 minutes",
  "More than 10 minutes",
];

function generateFlats(start: number, end: number) {
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

  Villa: ["001", "002", "003", "004"],
};

export default function CulturalProgramPage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [block, setBlock] = useState<Block | "">("");
  const [flatNo, setFlatNo] = useState("");
  const [participantType, setParticipantType] = useState<
    ParticipantType | ""
  >("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const [performanceType, setPerformanceType] = useState<
    PerformanceType | ""
  >("");
  const [groupName, setGroupName] = useState("");
  const [category, setCategory] = useState("");
  const [performanceTitle, setPerformanceTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");

  const [flatSearch, setFlatSearch] = useState("");
  const [showFlatDropdown, setShowFlatDropdown] = useState(false);

  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [registrationNo, setRegistrationNo] = useState("");

  // AUTO-ASSIGNED SLOT
  const [slotNumber, setSlotNumber] = useState<number | null>(null);

  const flatDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        flatDropdownRef.current &&
        !flatDropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setShowFlatDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  function handleBlockChange(value: string) {
    setBlock(value as Block);
    setFlatNo("");
    setFlatSearch("");
    setShowFlatDropdown(false);
    setError("");
  }

  const filteredFlats = useMemo(() => {
    if (!block) return [];

    const search = flatSearch.trim().toLowerCase();

    return FLATS[block].filter((flat) =>
      flat.toLowerCase().includes(search)
    );
  }, [block, flatSearch]);

  function selectFlat(flat: string) {
    setFlatNo(flat);
    setFlatSearch(flat);
    setShowFlatDropdown(false);
    setError("");
  }

  async function submitRegistration() {
    setError("");

    if (!name.trim()) {
      setError("Please enter the participant name.");
      return;
    }

    const numericAge = Number(age);

    if (
      !Number.isInteger(numericAge) ||
      numericAge < 1 ||
      numericAge > 100
    ) {
      setError("Please enter a valid age.");
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

    if (!participantType) {
      setError("Please select participant type.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!performanceType) {
      setError("Please select Individual or Group.");
      return;
    }

    if (!category) {
      setError("Please select a program category.");
      return;
    }

    if (!performanceTitle.trim()) {
      setError("Please enter the performance title.");
      return;
    }

    if (!duration) {
      setError("Please select the expected duration.");
      return;
    }

    if (!agree) {
      setError("Please accept the declaration before submitting.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/cultural-program", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantName: name.trim(),
          age: numericAge,
          block,
          flatNo,
          participantType,
          mobile,
          email: email.trim() || null,
          performanceType,
          groupName:
            performanceType === "Group"
              ? groupName.trim() || null
              : null,
          category,
          performanceTitle: performanceTitle.trim(),
          description: description.trim() || null,
          duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
            "Unable to submit registration. Please try again."
        );
        return;
      }

      // Registration number returned by API
      setRegistrationNo(data.registrationNo);

      // Slot automatically generated by PostgreSQL
      setSlotNumber(
        typeof data.slotNumber === "number"
          ? data.slotNumber
          : null
      );

      setSubmitted(true);
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setAge("");
    setBlock("");
    setFlatNo("");
    setParticipantType("");
    setMobile("");
    setEmail("");
    setPerformanceType("");
    setGroupName("");
    setCategory("");
    setPerformanceTitle("");
    setDescription("");
    setDuration("");
    setFlatSearch("");
    setShowFlatDropdown(false);
    setAgree(false);
    setError("");
    setRegistrationNo("");

    // Reset automatically assigned slot
    setSlotNumber(null);

    setSubmitted(false);
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

        {/* NAVBAR — FULL WIDTH LIKE THE HOMEPAGE */}
        <div className="relative z-30 mx-auto -mt-2 mb-3 w-full max-w-7xl rounded-2xl border border-[#ead8bd]/70 bg-[#fffaf2]/95 shadow-[0_8px_30px_rgba(120,70,20,0.08)] backdrop-blur-sm max-[600px]:rounded-xl">
          <Navbar />
        </div>

        <div className="relative z-[5] mx-auto mt-[30px] w-full max-w-[650px] max-[850px]:max-w-[760px]">
          {/* HERO — SAME DESIGN AS CONTRIBUTION PAGE */}

          <section className="relative min-h-[250px] overflow-visible rounded-[24px] border border-[#ead9c7] bg-gradient-to-br from-white/[0.97] to-[#fff9ef]/[0.98] px-7 pb-5 pt-5 shadow-[0_18px_50px_rgba(77,48,20,0.10)] max-[600px]:min-h-[285px] max-[600px]:rounded-[18px] max-[600px]:px-3 max-[600px]:pb-3 max-[600px]:pt-3 mt-[75px]">
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
                CULTURAL PROGRAM
              </div>

              <h1 className="mt-2 text-[30px] font-bold leading-[1.02] text-[#a80d17] font-open-sans max-[600px]:text-[27px]">
                Cultural Program Registration
              </h1>

              <p className="mx-auto mt-2 max-w-[520px] font-serif text-[15px] italic leading-[1.45] text-[#7b5b4e] max-[600px]:text-[11px]">
                Showcase your talent and be a part of the BUH Durga Puja
                2026 celebrations.
              </p>

              <div className="mt-3 flex items-center justify-center gap-3 text-[#d09a32] max-[600px]:mt-2">
                <span />
                <i className="text-[23px] text-[#a70e18] fa-solid fa-spa" />
                <span />
              </div>
            </div>
          </section>

          {/* FORM */}

          {!submitted ? (
            <section className="relative mt-5 overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">
              <div className="px-6 pb-7 pt-5 max-[600px]:px-3 max-[600px]:pb-4 max-[600px]:pt-4">
                {/* PARTICIPANT DETAILS */}

                <div className="mb-5">
                  <h2 className="font-serif text-[25px] text-[#292929] max-[600px]:text-[20px]">
                    Participant Details
                  </h2>

                  <p className="mt-1 text-[13px] text-[#737983] max-[600px]:text-[10px]">
                    Please provide the participant&apos;s basic information.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <InputField
                    icon="fa-user"
                    label="Participant Name"
                    placeholder="Enter participant name"
                    value={name}
                    onChange={setName}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                    <InputField
                      icon="fa-calendar"
                      label="Age"
                      placeholder="Enter age"
                      value={age}
                      onChange={setAge}
                      type="number"
                      required
                    />

                    <SelectField
                      icon="fa-user-tag"
                      label="Participant Type"
                      value={participantType}
                      placeholder="Select type"
                      options={PARTICIPANT_TYPES}
                      onChange={(value) =>
                        setParticipantType(
                          value as ParticipantType
                        )
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                    <SelectField
                      icon="fa-building"
                      label="Block"
                      value={block}
                      placeholder="Select Block"
                      options={BLOCKS}
                      onChange={handleBlockChange}
                      required
                    />

                    {/* SEARCHABLE FLAT */}

                    <div
                      ref={flatDropdownRef}
                      className="relative flex flex-col gap-1"
                    >
                      <label className="text-[13px] font-semibold text-[#333]">
                        Flat No.
                        <span className="ml-1 text-[#a70e18]">*</span>
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
                              setShowFlatDropdown(true);
                            }
                          }}
                          onChange={(e) => {
                            setFlatSearch(e.target.value);
                            setFlatNo("");
                            setShowFlatDropdown(true);
                          }}
                          className="h-[52px] flex-1 border-0 bg-transparent pr-3 text-[15px] text-[#292929] outline-none placeholder:text-[#a1a5ad] disabled:cursor-not-allowed disabled:opacity-60 max-[600px]:h-[47px]"
                        />

                        <i className="mr-4 text-[11px] text-[#999] fa-solid fa-chevron-down" />
                      </div>

                      {showFlatDropdown && block && (
                        <div className="absolute left-0 right-0 top-[77px] z-[50] max-h-[260px] overflow-y-auto rounded-[11px] border border-[#e2d8cd] bg-white p-1.5 shadow-[0_15px_35px_rgba(50,30,10,0.16)]">
                          {filteredFlats.length === 0 ? (
                            <div className="px-3 py-4 text-center text-[12px] text-[#888]">
                              No flats found
                            </div>
                          ) : (
                            filteredFlats.map((flat) => (
                              <button
                                key={`${block}-${flat}`}
                                type="button"
                                onClick={() => selectFlat(flat)}
                                className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                                  flatNo === flat
                                    ? "bg-[#faeeee] text-[#a70e18]"
                                    : "text-[#333] hover:bg-[#fff1f1] hover:text-[#a70e18]"
                                }`}
                              >
                                <span>{flat}</span>

                                {flatNo === flat && (
                                  <i className="fa-solid fa-check text-[10px]" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <InputField
                    icon="fa-phone"
                    label="Mobile Number"
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(value) =>
                      setMobile(
                        value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    type="tel"
                    required
                  />

                  <InputField
                    icon="fa-envelope"
                    label="Email"
                    placeholder="Email address (optional)"
                    value={email}
                    onChange={setEmail}
                    type="email"
                  />
                </div>

                <div className="my-7 h-px bg-[#eee4da]" />

                {/* PERFORMANCE DETAILS */}

                <div className="mb-5">
                  <h2 className="font-serif text-[25px] text-[#292929] max-[600px]:text-[20px]">
                    Performance Details
                  </h2>

                  <p className="mt-1 text-[13px] text-[#737983] max-[600px]:text-[10px]">
                    Tell us about the performance you would like to present.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                    <SelectField
                      icon="fa-people-group"
                      label="Performance Type"
                      value={performanceType}
                      placeholder="Individual or Group"
                      options={PERFORMANCE_TYPES}
                      onChange={(value) => {
                        setPerformanceType(
                          value as PerformanceType
                        );

                        if (value === "Individual") {
                          setGroupName("");
                        }
                      }}
                      required
                    />

                    {performanceType === "Group" && (
                      <InputField
                        icon="fa-users"
                        label="Group Name"
                        placeholder="Group name (optional)"
                        value={groupName}
                        onChange={setGroupName}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                    <SelectField
                      icon="fa-masks-theater"
                      label="Program Category"
                      value={category}
                      placeholder="Select category"
                      options={CATEGORIES}
                      onChange={setCategory}
                      required
                    />

                    <InputField
                      icon="fa-music"
                      label="Performance Title"
                      placeholder="e.g. Maa Durga Stuti"
                      value={performanceTitle}
                      onChange={setPerformanceTitle}
                      required
                    />
                  </div>

                  <SelectField
                    icon="fa-clock"
                    label="Expected Duration"
                    value={duration}
                    placeholder="Select duration"
                    options={DURATIONS}
                    onChange={setDuration}
                    required
                  />

                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-[#333]">
                      Brief Description
                    </label>

                    <textarea
                      value={description}
                      onChange={(e) =>
                        setDescription(e.target.value)
                      }
                      rows={4}
                      placeholder="Briefly describe your performance (optional)"
                      className="min-h-[105px] resize-none rounded-[11px] border border-[#dedede] bg-white px-4 py-3 text-[14px] text-[#292929] outline-none transition duration-200 placeholder:text-[#a1a5ad] focus:border-[#b3121b] focus:shadow-[0_0_0_4px_rgba(179,18,27,0.06)]"
                    />
                  </div>
                </div>

                {/* DECLARATION */}

                <div className="mt-6 rounded-[12px] border border-[#ead9c7] bg-[#fff8eb] p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) =>
                        setAgree(e.target.checked)
                      }
                      className="mt-1 h-4 w-4 accent-[#a70e18]"
                    />

                    <span className="text-[12px] leading-[1.6] text-[#6f6259]">
                      I confirm that the information provided above
                      is correct and agree to participate in the BUH
                      Durga Puja 2026 cultural program. I understand
                      that the final performance schedule will be
                      decided by the organizing committee.
                    </span>
                  </label>
                </div>

                {/* ERROR */}

                {error && (
                  <div className="mt-4 flex items-center gap-[9px] rounded-[9px] border border-[#f1cccc] bg-[#fff1f1] px-3 py-2.5 text-[12px] text-[#a20d16]">
                    <i className="fa-solid fa-circle-exclamation" />
                    <span>{error}</span>
                  </div>
                )}

                {/* SUBMIT */}

                <button
                  type="button"
                  disabled={loading}
                  onClick={submitRegistration}
                  className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-[15px] rounded-[12px] border-0 bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span>Submitting Registration...</span>
                      <i className="fa-solid fa-spinner fa-spin" />
                    </>
                  ) : (
                    <>
                      <span>Register for Cultural Program</span>
                      <i className="fa-solid fa-arrow-right" />
                    </>
                  )}
                </button>

                <div className="my-2 flex items-center justify-center gap-2 text-[12px] text-[#687078]">
                  <i className="fa-solid fa-lock" />
                  <span>Your information is safe and secure</span>
                </div>
              </div>
            </section>
          ) : (
            /* SUCCESS */

            <section className="relative mt-5 overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">
              <div className="px-[45px] pb-[50px] pt-[45px] text-center max-[600px]:px-[18px] max-[600px]:pb-10 max-[600px]:pt-[35px]">
                <div className="mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#a70e18] text-[29px] text-white shadow-[0_12px_28px_rgba(167,14,24,0.20)]">
                  <i className="fa-solid fa-check" />
                </div>

                <h2 className="font-serif text-[30px] text-[#292929] max-[600px]:text-[26px]">
                  Registration Submitted
                </h2>

                <p className="mt-2">
                  Thank you, <strong>{name}</strong>.
                </p>

                <p className="mt-2 text-[13px] text-[#707070]">
                  Your cultural program registration has been
                  successfully submitted.
                </p>

                <div className="mx-auto my-[25px] max-w-[380px] rounded-[13px] bg-[#fcf7ed] p-[17px]">
                  <div className="flex justify-between text-[12px] text-[#666]">
                    <span>Registration ID</span>

                    <strong className="text-[#a70e18]">
                      {registrationNo}
                    </strong>
                  </div>

                  <div className="mt-2 flex justify-between text-[12px] text-[#666]">
                    <span>Participant</span>

                    <strong>{name}</strong>
                  </div>

                  <div className="mt-2 flex justify-between text-[12px] text-[#666]">
                    <span>Performance</span>

                    <strong className="max-w-[190px] truncate">
                      {performanceTitle}
                    </strong>
                  </div>

                  <div className="mt-2 flex justify-between text-[12px] text-[#666]">
                    <span>Category</span>

                    <strong>{category}</strong>
                  </div>

                  {/* AUTO-ASSIGNED SLOT */}

                  <div className="mt-3 flex items-center justify-between rounded-[10px] border border-[#f0dfbd] bg-[#fff8ea] px-3 py-2.5">
                    <span className="text-[12px] font-medium text-[#666]">
                      Slot Number
                    </span>

                    <strong className="text-[18px] font-bold text-[#a70e18]">
                      {slotNumber
                        ? `Slot ${slotNumber}`
                        : "Assigned"}
                    </strong>
                  </div>
                </div>

                <div className="mx-auto flex max-w-[500px] gap-[11px] rounded-[12px] border border-[#f0dfbd] bg-[#fff8ea] p-[15px] text-left">
                  <i className="mt-0.5 fa-solid fa-circle-info" />

                  <div>
                    <strong>Registration Under Review</strong>

                    <p className="mt-1 text-[12px] leading-[1.5] text-[#666]">
                      The Durga Puja committee will review the
                      registration and contact you regarding the
                      final cultural program schedule.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-7 rounded-[12px] bg-gradient-to-br from-[#a70812] to-[#c70d18] px-6 py-3 text-[13px] font-bold text-white shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition hover:-translate-y-px"
                >
                  Register Another Performance
                </button>

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
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-semibold text-[#333]">
        {label}

        {required && (
          <span className="ml-1 text-[#a70e18]">*</span>
        )}
      </label>

      <div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white transition duration-200 focus-within:border-[#b3121b] focus-within:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px]">
        <div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]">
          <i className={`fa-solid ${icon}`} />
        </div>

        <input
          className="h-[52px] flex-1 border-0 bg-transparent pr-3 text-[15px] text-[#292929] outline-none placeholder:text-[#a1a5ad] max-[600px]:h-[47px]"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
  required = false,
}: {
  icon: string;
  label: string;
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = value || placeholder;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-semibold text-[#333]">
        {label}

        {required && (
          <span className="ml-1 text-[#a70e18]">*</span>
        )}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          className={`flex min-h-[52px] w-full items-center rounded-[11px] border border-[#dedede] bg-white text-left transition duration-200 hover:border-[#c9c9c9] focus:outline-none focus:border-[#b3121b] focus:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px] ${
            open
              ? "border-[#b3121b] shadow-[0_0_0_4px_rgba(179,18,27,0.06)]"
              : ""
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

                {!value && (
                  <i className="fa-solid fa-check text-[10px]" />
                )}
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