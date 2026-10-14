"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";

type Block = "P1" | "P2" | "Villa";

const DURGA_IMAGE = "/images/durga-puja-collection.webp";
const BLOCKS: Block[] = ["P1", "P2", "Villa"];

function generateFlats(start: number, end: number) {
  const flats: string[] = [];
  for (let i = start; i <= end; i++) flats.push(String(i).padStart(3, "0"));
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

const COMPETITIONS = [
  {
    value: "Diya Decoration",
    label: "Diya Decoration",
    detail: "Children aged 5–9 years",
  },
  {
    value: "Thali Decoration",
    label: "Thali Decoration",
    detail: "Children aged 10–15 years",
  },
];

const GAMES = [
  { value: "Item Mera, Control Tera?", label: "Item Mera, Control Tera?", eligibility: "Open to all" },
  { value: "Meri Topi Tere Sar", label: "Meri Topi Tere Sar", eligibility: "Open to all" },
  { value: "Balloon Challenge", label: "🎈 Balloon Challenge", eligibility: "Open to all" },
  { value: "Blindfold Bindi Challenge", label: "🔴 Blindfold Bindi Challenge", eligibility: "Ladies only" },
  { value: "Freeze Dance", label: "💃 Freeze Dance", eligibility: "Open to all" },
  { value: "Musical Chairs", label: "🎶 Musical Chairs", eligibility: "Open to all" },
  { value: "Shankh Dhwani Competition", label: "🐚 Shankh Dhwani Competition", eligibility: "Open to all" },
  { value: "Ululu Competition", label: "🌸 Ululu Competition", eligibility: "Ladies only" },
];

export default function EventRegistrationPage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [block, setBlock] = useState<Block | "">("");
  const [flatNo, setFlatNo] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [competition, setCompetition] = useState("");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [gender, setGender] = useState("");
  const [notes, setNotes] = useState("");
  const [flatSearch, setFlatSearch] = useState("");
  const [showFlatDropdown, setShowFlatDropdown] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [registrationNo, setRegistrationNo] = useState("");
  const flatDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (flatDropdownRef.current && !flatDropdownRef.current.contains(event.target as Node)) {
        setShowFlatDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    return FLATS[block].filter((flat) => flat.toLowerCase().includes(search));
  }, [block, flatSearch]);

  function toggleGame(value: string) {
    setSelectedGames((current) =>
      current.includes(value) ? current.filter((game) => game !== value) : [...current, value]
    );
    setError("");
  }

  async function submitRegistration() {
    setError("");
    if (!name.trim()) return setError("Please enter the participant name.");
    const numericAge = Number(age);
    if (!Number.isInteger(numericAge) || numericAge < 1 || numericAge > 100) {
      return setError("Please enter a valid age.");
    }
    if (!block) return setError("Please select your block.");
    if (!flatNo) return setError("Please select your flat number.");
    if (!/^[6-9]\d{9}$/.test(mobile)) return setError("Please enter a valid 10-digit mobile number.");
    if (!competition && selectedGames.length === 0) {
      return setError("Please select a competition or at least one game.");
    }
    if ((competition === "Diya Decoration" && (numericAge < 5 || numericAge > 9))) {
      return setError("Diya Decoration is for children aged 5 to 9 years.");
    }
    if ((competition === "Thali Decoration" && (numericAge < 10 || numericAge > 15))) {
      return setError("Thali Decoration is for children aged 10 to 15 years.");
    }
    if (selectedGames.some((game) => ["Blindfold Bindi Challenge", "Ululu Competition"].includes(game)) && gender !== "Female") {
      return setError("Blindfold Bindi Challenge and Ululu Competition are for ladies only. Select Female or remove those games.");
    }
    if (!agree) return setError("Please accept the declaration before submitting.");

    try {
      setLoading(true);
      const response = await fetch("/api/event-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: name.trim(),
          age: numericAge,
          block,
          flatNo,
          mobile,
          email: email.trim() || null,
          competition: competition || null,
          games: selectedGames,
          gender: gender || null,
          notes: notes.trim() || null,
          eventDate: "2026-10-16",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Unable to submit registration. Please try again.");
        return;
      }
      setRegistrationNo(data.registrationNo || data.id || "Submitted");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setAge("");
    setBlock("");
    setFlatNo("");
    setMobile("");
    setEmail("");
    setCompetition("");
    setSelectedGames([]);
    setGender("");
    setNotes("");
    setFlatSearch("");
    setShowFlatDropdown(false);
    setAgree(false);
    setError("");
    setRegistrationNo("");
    setSubmitted(false);
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
      <main className="font-sans text-[#292929] [font-family:Inter,Arial,Helvetica,sans-serif] relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#fffaf2_0%,#f8eddd_48%,#efdfca_100%)] px-4 py-[24px] pb-[36px] max-[600px]:px-2 max-[600px]:py-2 max-[600px]:pb-5">
        <div className="pointer-events-none fixed left-[-290px] top-[150px] h-[420px] w-[420px] rounded-full opacity-[0.12] bg-[repeating-radial-gradient(circle,transparent_0px,transparent_18px,#c99336_19px,transparent_21px)]" />
        <div className="pointer-events-none fixed right-[-290px] bottom-[100px] h-[420px] w-[420px] rounded-full opacity-[0.12] bg-[repeating-radial-gradient(circle,transparent_0px,transparent_18px,#c99336_19px,transparent_21px)]" />
        <div className="pointer-events-none fixed bottom-[-180px] left-[-170px] h-[700px] w-[270px] rotate-[18deg] opacity-90 bg-[linear-gradient(135deg,transparent_0_15%,#b80c15_16%,#e32328_38%,#a90913_65%,transparent_66%)] drop-shadow-[0_10px_15px_rgba(80,0,0,0.08)]" />
        <div className="pointer-events-none fixed right-[-180px] bottom-[-170px] h-[700px] w-[270px] -rotate-[18deg] opacity-90 bg-[linear-gradient(135deg,transparent_0_15%,#b80c15_16%,#e32328_38%,#a90913_65%,transparent_66%)] drop-shadow-[0_10px_15px_rgba(80,0,0,0.08)]" />
        <div className="pointer-events-none fixed bottom-[90px] left-[-25px] text-[100px] text-[#d09a34] opacity-[0.18]">✿</div>
        <div className="pointer-events-none fixed right-[-25px] bottom-[140px] text-[100px] text-[#d09a34] opacity-[0.18]">✿</div>

        <div className="relative z-30 mx-auto -mt-2 mb-3 w-full max-w-7xl rounded-2xl border border-[#ead8bd]/70 bg-[#fffaf2]/95 shadow-[0_8px_30px_rgba(120,70,20,0.08)] backdrop-blur-sm max-[600px]:rounded-xl">
          <Navbar />
        </div>

        <div className="relative z-[5] mx-auto mt-[30px] w-full max-w-[760px]">
          <section className="relative overflow-visible rounded-[24px] border border-[#ead9c7] bg-gradient-to-br from-white/[0.97] to-[#fff9ef]/[0.98] px-7 pb-5 pt-5 shadow-[0_18px_50px_rgba(77,48,20,0.10)] mt-[75px] max-[600px]:rounded-[18px] max-[600px]:px-3 max-[600px]:pb-3 max-[600px]:pt-3">
            <div className="pointer-events-none absolute inset-0 rounded-[28px] opacity-[0.12] bg-[radial-gradient(circle_at_15%_25%,#d3a044_1px,transparent_2px)] bg-[size:30px_30px]" />
            <div className="absolute left-[55px] top-[105px] z-[5] flex flex-col text-left text-[10px] font-bold leading-[1.8] tracking-[4px] text-[#73594b] max-[850px]:left-6 max-[600px]:hidden">
              <span>TOGETHER</span><span>WE CELEBRATE</span><span>OUR COMMUNITY</span><div className="mt-2 h-[2px] w-10 bg-[#d09a32]" />
            </div>
            <div className="absolute right-[55px] top-[105px] z-[5] flex flex-col items-end text-right text-[10px] font-bold leading-[1.8] tracking-[4px] text-[#73594b] max-[850px]:right-6 max-[600px]:hidden">
              <span>FAITH</span><span>COMMUNITY</span><span>HARMONY</span><div className="mt-2 h-[2px] w-10 bg-[#d09a32]" />
            </div>
            <div className="absolute left-1/2 top-[-50px] z-[4] flex h-[270px] w-[270px] -translate-x-1/2 justify-center max-[600px]:top-[-10px] max-[600px]:h-[170px] max-[600px]:w-[170px]">
              <div className="absolute -top-[25px] h-[270px] w-[270px] rounded-full bg-[radial-gradient(circle,rgba(210,157,47,0.25),transparent_68%)] max-[600px]:h-[200px] max-[600px]:w-[200px]" />
              <img src={DURGA_IMAGE} alt="Maa Durga" className="relative z-[1] h-[270px] w-[270px] object-contain object-center max-[600px]:h-[170px] max-[600px]:w-[170px]" />
            </div>
            <div className="relative z-[6] pt-[215px] text-center max-[600px]:pt-[145px]">
              <div className="text-[10px] font-bold tracking-[5px] text-[#795044] max-[600px]:text-[7px] max-[600px]:tracking-[2px]">BUH DURGA PUJA 2026</div>
              <h1 className="mt-2 font-open-sans text-[30px] font-bold leading-tight text-[#a80d17] max-[600px]:text-[25px]">Competition & Games Registration</h1>
              <p className="mx-auto mt-2 max-w-[560px] font-serif text-[15px] italic leading-[1.45] text-[#7b5b4e] max-[600px]:text-[12px]">
                Diya & Thali Decoration Competition and fun games for our community.
              </p>
              <div className="mt-3 flex items-center justify-center gap-3 text-[#d09a32]"><span /><i className="fa-solid fa-spa text-[23px] text-[#a70e18]" /><span /></div>
            </div>
          </section>

          {!submitted ? (
            <section className="relative mt-5 overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">
              <div className="px-6 pb-7 pt-5 max-[600px]:px-3 max-[600px]:pb-4 max-[600px]:pt-4">
                <div className="mb-5">
                  <h2 className="font-serif text-[25px] text-[#292929] max-[600px]:text-[20px]">Participant Details</h2>
                  <p className="mt-1 text-[13px] text-[#737983]">Enter the participant’s details below.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <InputField icon="fa-user" label="Participant Name" placeholder="Enter participant name" value={name} onChange={setName} required />
                  <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                    <InputField icon="fa-calendar" label="Age" placeholder="Enter age" value={age} onChange={setAge} type="number" required />
                    <SelectField icon="fa-venus-mars" label="Gender" value={gender} placeholder="Select gender" options={["Female", "Male", "Prefer not to say"]} onChange={setGender} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                    <SelectField icon="fa-building" label="Block" value={block} placeholder="Select Block" options={BLOCKS} onChange={handleBlockChange} required />
                    <div ref={flatDropdownRef} className="relative flex flex-col gap-1">
                      <label className="text-[13px] font-semibold text-[#333]">Flat No. <span className="ml-1 text-[#a70e18]">*</span></label>
                      <div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white focus-within:border-[#b3121b] max-[600px]:min-h-[47px]">
                        <div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]"><i className="fa-solid fa-house" /></div>
                        <input type="text" disabled={!block} placeholder={block ? "Search flat" : "Select block first"} value={flatSearch}
                          onFocus={() => { if (block) setShowFlatDropdown(true); }}
                          onChange={(e) => { setFlatSearch(e.target.value); setFlatNo(""); setShowFlatDropdown(true); }}
                          className="h-[52px] flex-1 border-0 bg-transparent pr-3 text-[15px] outline-none placeholder:text-[#a1a5ad] disabled:opacity-60 max-[600px]:h-[47px]" />
                        <i className="fa-solid fa-chevron-down mr-4 text-[11px] text-[#999]" />
                      </div>
                      {showFlatDropdown && block && <div className="absolute left-0 right-0 top-[77px] z-[50] max-h-[260px] overflow-y-auto rounded-[11px] border border-[#e2d8cd] bg-white p-1.5 shadow-[0_15px_35px_rgba(50,30,10,0.16)]">
                        {filteredFlats.length === 0 ? <div className="px-3 py-4 text-center text-[12px] text-[#888]">No flats found</div> :
                          filteredFlats.map((flat) => <button key={`${block}-${flat}`} type="button" onClick={() => { setFlatNo(flat); setFlatSearch(flat); setShowFlatDropdown(false); setError(""); }}
                            className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[13px] font-semibold ${flatNo === flat ? "bg-[#faeeee] text-[#a70e18]" : "text-[#333] hover:bg-[#fff1f1]"}`}>
                            <span>{flat}</span>{flatNo === flat && <i className="fa-solid fa-check text-[10px]" />}
                          </button>)}
                      </div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                    <InputField icon="fa-phone" label="Mobile Number" placeholder="10-digit mobile number" value={mobile} onChange={(value) => setMobile(value.replace(/\D/g, "").slice(0, 10))} type="tel" required />
                    <InputField icon="fa-envelope" label="Email (Optional)" placeholder="Email address" value={email} onChange={setEmail} type="email" />
                  </div>
                </div>

                <div className="my-7 h-px bg-[#eee4da]" />
                <div className="mb-4">
                  <h2 className="font-serif text-[25px] text-[#292929] max-[600px]:text-[20px]">Competition Registration</h2>
                  <p className="mt-1 text-[13px] text-[#737983]">Select one competition if applicable. Age limits are checked before submission.</p>
                </div>
                <div className="flex flex-col gap-3">
                  {COMPETITIONS.map((item) => <label key={item.value} className={`flex cursor-pointer items-start gap-3 rounded-[12px] border p-4 transition ${competition === item.value ? "border-[#a70e18] bg-[#fff6f3]" : "border-[#e7dfd5] bg-white hover:bg-[#fffaf4]"}`}>
                    <input type="radio" name="competition" value={item.value} checked={competition === item.value} onChange={() => { setCompetition(competition === item.value ? "" : item.value); setError(""); }} className="mt-1 accent-[#a70e18]" />
                    <span className="flex-1"><span className="block text-[14px] font-bold text-[#333]">{item.label}</span><span className="mt-1 block text-[12px] text-[#75685f]">{item.detail}</span></span>
                  </label>)}
                  <button type="button" onClick={() => setCompetition("")} className="self-start text-[12px] font-semibold text-[#a70e18] underline">Clear competition selection</button>
                </div>

                <div className="my-7 h-px bg-[#eee4da]" />
                <div className="mb-4">
                  <h2 className="font-serif text-[25px] text-[#292929] max-[600px]:text-[20px]">Games Registration</h2>
                  <p className="mt-1 text-[13px] text-[#737983]">Choose all games you would like to participate in.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {GAMES.map((game) => {
                    const checked = selectedGames.includes(game.value);
                    const ladiesOnly = game.eligibility === "Ladies only";
                    return <label key={game.value} className={`flex cursor-pointer items-start gap-3 rounded-[12px] border p-3 transition ${checked ? "border-[#a70e18] bg-[#fff6f3]" : "border-[#e7dfd5] bg-white hover:bg-[#fffaf4]"}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleGame(game.value)} className="mt-1 accent-[#a70e18]" />
                      <span className="flex-1"><span className="block text-[13px] font-bold text-[#333]">{game.label}</span><span className={`mt-1 inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${ladiesOnly ? "bg-[#fae8e8] text-[#a70e18]" : "bg-[#f5efdf] text-[#75603a]"}`}>{game.eligibility}</span></span>
                    </label>;
                  })}
                </div>

                <div className="mt-4 flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Additional Notes (Optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any additional information" className="resize-y rounded-[11px] border border-[#dedede] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#b3121b]" />
                </div>

                <div className="mt-6 rounded-[12px] border border-[#ead9c7] bg-[#fff8eb] p-4">
                  <h3 className="mb-2 text-[14px] font-bold text-[#6f332a]">Event Details — 16 October 2026</h3>
                  <ul className="list-disc space-y-1 pl-5 text-[12px] leading-[1.6] text-[#6f6259]">
                    <li><strong>Diya & Thali Decoration Competition:</strong> 3:30 PM at the Durga Puja Pandal; duration 1 hour.</li>
                    <li>Diyas will be provided to participants.</li>
                    <li>Thali Decoration participants must bring their own thalis.</li>
                    <li>Participants must bring their own decoration materials, such as paints, glitter, mirrors, brushes and adhesives.</li>
                    <li>Blindfold Bindi Challenge and Ululu Competition are for ladies only.</li>
                  </ul>
                </div>

                <div className="mt-5 rounded-[12px] border border-[#ead9c7] bg-[#fff8eb] p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-[#a70e18]" />
                    <span className="text-[12px] leading-[1.6] text-[#6f6259]">I confirm that the information provided is correct and agree to participate in the selected BUH Durga Puja 2026 competition/game(s). I understand that the organizers may contact me regarding event arrangements.</span>
                  </label>
                </div>

                {error && <div className="mt-4 flex items-center gap-2 rounded-[9px] border border-[#f1cccc] bg-[#fff1f1] px-3 py-2.5 text-[12px] text-[#a20d16]"><i className="fa-solid fa-circle-exclamation" /><span>{error}</span></div>}
                <button type="button" disabled={loading} onClick={submitRegistration} className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-[15px] rounded-[12px] bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? <><span>Submitting Registration...</span><i className="fa-solid fa-spinner fa-spin" /></> : <><span>Register for Competition / Games</span><i className="fa-solid fa-arrow-right" /></>}
                </button>
                <div className="my-2 flex items-center justify-center gap-2 text-[12px] text-[#687078]"><i className="fa-solid fa-lock" /><span>Your information is safe and secure</span></div>
              </div>
            </section>
          ) : (
            <section className="relative mt-5 overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)]">
              <div className="px-6 py-10 text-center max-[600px]:px-4">
                <div className="mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#a70e18] text-[29px] text-white"><i className="fa-solid fa-check" /></div>
                <h2 className="font-serif text-[30px] text-[#292929] max-[600px]:text-[25px]">Registration Submitted</h2>
                <p className="mt-2">Thank you, <strong>{name}</strong>.</p>
                <p className="mt-2 text-[13px] text-[#707070]">Your competition/game registration has been submitted successfully.</p>
                <div className="mx-auto my-6 max-w-[400px] rounded-[13px] bg-[#fcf7ed] p-4 text-left text-[13px]">
                  <div className="flex justify-between gap-3"><span className="text-[#666]">Registration ID</span><strong className="text-[#a70e18]">{registrationNo}</strong></div>
                  {competition && <div className="mt-2 flex justify-between gap-3"><span className="text-[#666]">Competition</span><strong>{competition}</strong></div>}
                  {selectedGames.length > 0 && <div className="mt-2"><span className="text-[#666]">Games</span><ul className="mt-1 list-disc pl-5">{selectedGames.map((game) => <li key={game}>{game}</li>)}</ul></div>}
                </div>
                <button type="button" onClick={resetForm} className="mt-3 rounded-[12px] bg-gradient-to-br from-[#a70812] to-[#c70d18] px-6 py-3 text-[13px] font-bold text-white">Register Another Participant</button>
                <div className="mt-7 font-serif text-[12px] font-bold tracking-[5px] text-[#a70e18]">JAI MAA DURGA</div>
              </div>
            </section>
          )}

          <footer>
            <div className="flex items-center justify-center gap-3 pt-7 text-[#c8952e]"><span className="h-px w-[65px] bg-[#c8952e]" /><i className="fa-solid fa-spa text-[17px]" /><span className="h-px w-[65px] bg-[#c8952e]" /></div>
            <div className="relative z-[6] text-center"><h3 className="mt-[9px] font-serif text-[13px] font-bold tracking-[5px] text-[#a70e18] max-[600px]:text-[11px]">JAI MAA DURGA</h3><p className="mt-[7px] text-[9px] tracking-[4px] text-[#7b6d60]">A STRONGER COMMUNITY TOGETHER</p></div>
          </footer>
        </div>
      </main>
    </>
  );
}

function InputField({
  icon, label, placeholder, value, onChange, type = "text", required = false,
}: {
  icon: string; label: string; placeholder: string; value: string;
  onChange: (value: string) => void; type?: string; required?: boolean;
}) {
  return <div className="flex flex-col gap-1">
    <label className="text-[13px] font-semibold text-[#333]">{label}{required && <span className="ml-1 text-[#a70e18]">*</span>}</label>
    <div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white transition duration-200 focus-within:border-[#b3121b] max-[600px]:min-h-[47px]">
      <div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]"><i className={`fa-solid ${icon}`} /></div>
      <input className="h-[52px] flex-1 border-0 bg-transparent pr-3 text-[15px] text-[#292929] outline-none placeholder:text-[#a1a5ad] max-[600px]:h-[47px]" type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  </div>;
}

function SelectField({
  icon, label, value, placeholder, options, onChange, required = false,
}: {
  icon: string; label: string; value: string; placeholder: string;
  options: readonly string[]; onChange: (value: string) => void; required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = value || placeholder;
  return <div className="flex flex-col gap-1">
    <label className="text-[13px] font-semibold text-[#333]">{label}{required && <span className="ml-1 text-[#a70e18]">*</span>}</label>
    <div className="relative">
      <button type="button" onClick={() => setOpen((previous) => !previous)} className={`flex min-h-[52px] w-full items-center rounded-[11px] border border-[#dedede] bg-white text-left transition max-[600px]:min-h-[47px] ${open ? "border-[#b3121b]" : ""}`}>
        <span className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]"><i className={`fa-solid ${icon}`} /></span>
        <span className={`flex-1 truncate pr-3 text-[15px] max-[600px]:text-[14px] ${value ? "text-[#292929]" : "text-[#a1a5ad]"}`}>{selectedLabel}</span>
        <i className={`fa-solid fa-chevron-down mr-4 text-[10px] text-[#999] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <>
        <div className="fixed inset-0 z-[40]" onClick={() => setOpen(false)} />
        <div className="absolute left-0 right-0 top-[58px] z-[50] overflow-hidden rounded-[11px] border border-[#e2d8cd] bg-white p-1.5 shadow-[0_15px_35px_rgba(50,30,10,0.16)]">
          <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="flex w-full rounded-[8px] px-3 py-2.5 text-left text-[13px] text-[#888] hover:bg-[#faf6f0]">{placeholder}</button>
          {options.map((option) => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false); }} className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[13px] font-semibold ${value === option ? "bg-[#faeeee] text-[#a70e18]" : "text-[#333] hover:bg-[#fff1f1]"}`}><span>{option}</span>{value === option && <i className="fa-solid fa-check text-[10px]" />}</button>)}
        </div>
      </>}
    </div>
  </div>;
}
