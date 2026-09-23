"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";

type Block = "P1" | "P2" | "Villa";
type StallType = "Food" | "Product" | "Brand";

const DURGA_IMAGE = "/images/durga-puja-collection.webp";
const BLOCKS: Block[] = ["P1", "P2", "Villa"];
const STALL_TYPES: StallType[] = ["Food", "Product", "Brand"];

const FOOD_CATEGORIES = [
  "Snacks", "Sweets", "Bakery", "Beverages", "North Indian",
  "South Indian", "Bengali", "Odia", "Chinese", "Other",
];
const PRODUCT_CATEGORIES = [
  "Clothing", "Jewellery", "Handicrafts", "Home Decor",
  "Cosmetics & Beauty", "Toys & Kids", "Art & Craft",
  "Books & Stationery", "Plants & Gardening", "Other",
];
const BRAND_CATEGORIES = [
  "Fashion", "Food & Beverage", "Beauty & Wellness", "Automobile",
  "Electronics", "Education", "Real Estate", "Finance", "Other",
];

function generateFlats(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) =>
    String(start + i).padStart(3, "0")
  );
}

const FLATS: Record<Block, string[]> = {
  P1: [...generateFlats(1, 12), ...generateFlats(101, 112), ...generateFlats(201, 212), ...generateFlats(301, 312)],
  P2: [...generateFlats(1, 67), ...generateFlats(101, 167), ...generateFlats(201, 267), ...generateFlats(301, 367)],
  Villa: ["001", "002", "003", "004"],
};

export default function StallBookingPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [block, setBlock] = useState<Block | "">("");
  const [flatNo, setFlatNo] = useState("");
  const [stallType, setStallType] = useState<StallType | "">("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [flatSearch, setFlatSearch] = useState("");
  const [showFlatDropdown, setShowFlatDropdown] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [bookingNo, setBookingNo] = useState("");
  const flatDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (flatDropdownRef.current && !flatDropdownRef.current.contains(event.target as Node)) {
        setShowFlatDropdown(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const categoryOptions = useMemo(() => {
    if (stallType === "Food") return FOOD_CATEGORIES;
    if (stallType === "Product") return PRODUCT_CATEGORIES;
    if (stallType === "Brand") return BRAND_CATEGORIES;
    return [];
  }, [stallType]);

  const filteredFlats = useMemo(() => {
    if (!block) return [];
    const search = flatSearch.trim().toLowerCase();
    return FLATS[block].filter((flat) => flat.toLowerCase().includes(search));
  }, [block, flatSearch]);

  function handleBlockChange(value: string) {
    setBlock(value as Block);
    setFlatNo("");
    setFlatSearch("");
    setShowFlatDropdown(false);
    setError("");
  }

  function handleStallTypeChange(value: string) {
    setStallType(value as StallType);
    setCategory("");
    setError("");
  }

  async function submitBooking() {
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!/^[6-9]\d{9}$/.test(mobile)) return setError("Please enter a valid 10-digit mobile number.");
    if (!block) return setError("Please select your block.");
    if (!flatNo) return setError("Please select your flat number.");
    if (!stallType) return setError("Please select the type of stall.");
    if (!category) return setError(`Please select a ${stallType.toLowerCase()} category.`);
    if (!description.trim()) return setError("Please provide a brief description of your stall.");
    if (!agree) return setError("Please accept the declaration before submitting.");

    try {
      setLoading(true);
      const response = await fetch("/api/stall-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), mobile, block, flatNo, stallType,
          category, description: description.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Unable to submit the stall request. Please try again.");
        return;
      }
      setBookingNo(data?.bookingNo || data?.registrationNo || data?.id || "Submitted");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName(""); setMobile(""); setBlock(""); setFlatNo("");
    setStallType(""); setCategory(""); setDescription("");
    setFlatSearch(""); setShowFlatDropdown(false); setAgree(false);
    setError(""); setBookingNo(""); setSubmitted(false);
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
      <main className="font-sans text-[#292929] [font-family:Inter,Arial,Helvetica,sans-serif] relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#fffaf2_0%,#f8eddd_48%,#efdfca_100%)] px-4 py-[24px] pb-[36px] max-[600px]:px-2 max-[600px]:py-2 max-[600px]:pb-5">
        <div className="pointer-events-none fixed left-[-290px] top-[150px] h-[420px] w-[420px] rounded-full opacity-[0.12] bg-[repeating-radial-gradient(circle,transparent_0px,transparent_18px,#c99336_19px,transparent_21px)]" />
        <div className="pointer-events-none fixed right-[-290px] bottom-[100px] h-[420px] w-[420px] rounded-full opacity-[0.12] bg-[repeating-radial-gradient(circle,transparent_0px,transparent_18px,#c99336_19px,transparent_21px)]" />
        <div className="pointer-events-none fixed bottom-[-180px] left-[-170px] h-[700px] w-[270px] rotate-[18deg] opacity-90 bg-[linear-gradient(135deg,transparent_0_15%,#b80c15_16%,#e32328_38%,#a90913_65%,transparent_66%)]" />
        <div className="pointer-events-none fixed right-[-180px] bottom-[-170px] h-[700px] w-[270px] -rotate-[18deg] opacity-90 bg-[linear-gradient(135deg,transparent_0_15%,#b80c15_16%,#e32328_38%,#a90913_65%,transparent_66%)]" />

        <div className="relative z-30 mx-auto -mt-2 mb-3 w-full max-w-7xl rounded-2xl border border-[#ead8bd]/70 bg-[#fffaf2]/95 shadow-[0_8px_30px_rgba(120,70,20,0.08)] backdrop-blur-sm max-[600px]:rounded-xl">
          <Navbar />
        </div>

        <div className="relative z-[5] mx-auto mt-[30px] w-full max-w-[650px] max-[850px]:max-w-[760px]">
          <section className="relative mt-[75px] min-h-[250px] overflow-visible rounded-[24px] border border-[#ead9c7] bg-gradient-to-br from-white/[0.97] to-[#fff9ef]/[0.98] px-7 pb-5 pt-5 shadow-[0_18px_50px_rgba(77,48,20,0.10)] max-[600px]:min-h-[285px] max-[600px]:rounded-[18px] max-[600px]:px-3 max-[600px]:pb-3 max-[600px]:pt-3">
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
              <h1 className="mt-2 text-[30px] font-bold leading-[1.02] text-[#a80d17] font-open-sans max-[600px]:text-[27px]">Book a Stall</h1>
              <p className="mx-auto mt-2 max-w-[520px] font-serif text-[15px] italic leading-[1.45] text-[#7b5b4e] max-[600px]:text-[11px]">Showcase your food, products or brand and be a part of the BUH Durga Puja 2026 celebrations.</p>
              <div className="mt-3 flex items-center justify-center gap-3 text-[#d09a32]"><span className="h-px w-[45px] bg-[#d09a32]" /><i className="text-[23px] text-[#a70e18] fa-solid fa-store" /><span className="h-px w-[45px] bg-[#d09a32]" /></div>
            </div>
          </section>

          {!submitted ? (
            <section className="relative mt-5 overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">
              <div className="px-6 pb-7 pt-5 max-[600px]:px-3 max-[600px]:pb-4 max-[600px]:pt-4">
                <SectionTitle title="Resident Details" description="Please provide your basic details to book a stall." />
                <div className="flex flex-col gap-3">
                  <InputField icon="fa-user" label="Name" placeholder="Enter your name" value={name} onChange={setName} required />
                  <InputField icon="fa-phone" label="Mobile Number" placeholder="10-digit mobile number" value={mobile} onChange={(v) => setMobile(v.replace(/\D/g, "").slice(0, 10))} type="tel" required />
                  <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                    <SelectField icon="fa-building" label="Block" value={block} placeholder="Select Block" options={BLOCKS} onChange={handleBlockChange} required />
                    <div ref={flatDropdownRef} className="relative flex flex-col gap-1">
                      <label className="text-[13px] font-semibold text-[#333]">Flat No.<span className="ml-1 text-[#a70e18]">*</span></label>
                      <div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white focus-within:border-[#b3121b] focus-within:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px]">
                        <div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]"><i className="fa-solid fa-house" /></div>
                        <input type="text" disabled={!block} placeholder={block ? "Search flat" : "Select block first"} value={flatSearch} onFocus={() => block && setShowFlatDropdown(true)} onChange={(e) => { setFlatSearch(e.target.value); setFlatNo(""); setShowFlatDropdown(true); }} className="h-[52px] flex-1 border-0 bg-transparent pr-3 text-[15px] outline-none placeholder:text-[#a1a5ad] disabled:opacity-60 max-[600px]:h-[47px]" />
                        <i className="mr-4 text-[11px] text-[#999] fa-solid fa-chevron-down" />
                      </div>
                      {showFlatDropdown && block && <div className="absolute left-0 right-0 top-[77px] z-[50] max-h-[260px] overflow-y-auto rounded-[11px] border border-[#e2d8cd] bg-white p-1.5 shadow-[0_15px_35px_rgba(50,30,10,0.16)]">
                        {filteredFlats.length === 0 ? <div className="px-3 py-4 text-center text-[12px] text-[#888]">No flats found</div> : filteredFlats.map((flat) => <button key={`${block}-${flat}`} type="button" onClick={() => { setFlatNo(flat); setFlatSearch(flat); setShowFlatDropdown(false); setError(""); }} className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[13px] font-semibold ${flatNo === flat ? "bg-[#faeeee] text-[#a70e18]" : "text-[#333] hover:bg-[#fff1f1]"}`}><span>{flat}</span>{flatNo === flat && <i className="fa-solid fa-check text-[10px]" />}</button>)}
                      </div>}
                    </div>
                  </div>
                </div>

                <div className="my-7 h-px bg-[#eee4da]" />
                <SectionTitle title="Stall Details" description="Tell us what you would like to showcase at your stall." />
                <div className="flex flex-col gap-3">
                  <SelectField icon="fa-store" label="Type of Stall" value={stallType} placeholder="Select stall type" options={STALL_TYPES} onChange={handleStallTypeChange} required />
                  {stallType && <SelectField icon={stallType === "Food" ? "fa-utensils" : stallType === "Product" ? "fa-box-open" : "fa-tag"} label={stallType === "Food" ? "Food Category" : stallType === "Product" ? "Product Category" : "Brand Category"} value={category} placeholder="Select category" options={categoryOptions} onChange={setCategory} required />}
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-[#333]">Description About Your Stall<span className="ml-1 text-[#a70e18]">*</span></label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={500} placeholder="Briefly describe what you will sell, display or promote at your stall." className="min-h-[125px] resize-none rounded-[11px] border border-[#dedede] bg-white px-4 py-3 text-[14px] outline-none placeholder:text-[#a1a5ad] focus:border-[#b3121b] focus:shadow-[0_0_0_4px_rgba(179,18,27,0.06)]" />
                    <div className="text-right text-[10px] text-[#999]">{description.length}/500</div>
                  </div>
                </div>

                <div className="mt-6 rounded-[12px] border border-[#ead9c7] bg-[#fff8eb] p-4">
                  <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-[#a70e18]" /><span className="text-[12px] leading-[1.6] text-[#6f6259]">I confirm that the information provided above is correct and I am a resident of BUH. I understand that stall allocation will be subject to approval by the Durga Puja committee.</span></label>
                </div>

                {error && <div className="mt-4 flex items-center gap-[9px] rounded-[9px] border border-[#f1cccc] bg-[#fff1f1] px-3 py-2.5 text-[12px] text-[#a20d16]"><i className="fa-solid fa-circle-exclamation" /><span>{error}</span></div>}
                <button type="button" disabled={loading} onClick={submitBooking} className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-[15px] rounded-[12px] bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><span>Submitting Request...</span><i className="fa-solid fa-spinner fa-spin" /></> : <><span>Book a Stall</span><i className="fa-solid fa-arrow-right" /></>}</button>
                <div className="my-2 flex items-center justify-center gap-2 text-[12px] text-[#687078]"><i className="fa-solid fa-lock" /><span>Your information is safe and secure</span></div>
              </div>
            </section>
          ) : (
            <section className="relative mt-5 overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)]">
              <div className="px-[45px] pb-[50px] pt-[45px] text-center max-[600px]:px-[18px] max-[600px]:pb-10 max-[600px]:pt-[35px]">
                <div className="mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#a70e18] text-[29px] text-white"><i className="fa-solid fa-check" /></div>
                <h2 className="font-serif text-[30px] text-[#292929] max-[600px]:text-[26px]">Stall Request Submitted</h2>
                <p className="mt-2">Thank you, <strong>{name}</strong>.</p>
                <p className="mt-2 text-[13px] text-[#707070]">Your stall request has been successfully submitted.</p>
                <div className="mx-auto my-[25px] max-w-[380px] rounded-[13px] bg-[#fcf7ed] p-[17px] text-left">
                  <div className="flex justify-between text-[12px] text-[#666]"><span>Request ID</span><strong className="text-[#a70e18]">{bookingNo}</strong></div>
                  <div className="mt-2 flex justify-between text-[12px] text-[#666]"><span>Resident</span><strong>{name}</strong></div>
                  <div className="mt-2 flex justify-between text-[12px] text-[#666]"><span>Flat</span><strong>{block} - {flatNo}</strong></div>
                  <div className="mt-2 flex justify-between text-[12px] text-[#666]"><span>Stall Type</span><strong>{stallType}</strong></div>
                  <div className="mt-2 flex justify-between text-[12px] text-[#666]"><span>Category</span><strong>{category}</strong></div>
                </div>
                <div className="mx-auto flex max-w-[500px] gap-[11px] rounded-[12px] border border-[#f0dfbd] bg-[#fff8ea] p-[15px] text-left"><i className="mt-0.5 fa-solid fa-circle-info text-[#a70e18]" /><div><strong>Request Under Review</strong><p className="mt-1 text-[12px] leading-[1.5] text-[#666]">The Durga Puja committee will review your stall request and contact you regarding the stall allocation.</p></div></div>
                <button type="button" onClick={resetForm} className="mt-7 rounded-[12px] bg-gradient-to-br from-[#a70812] to-[#c70d18] px-6 py-3 text-[13px] font-bold text-white shadow-[0_10px_23px_rgba(167,8,18,0.20)]">Book Another Stall</button>
                <div className="mt-7 font-serif text-[12px] font-bold tracking-[5px] text-[#a70e18]">JAI MAA DURGA</div>
              </div>
            </section>
          )}

          <footer><div className="flex items-center justify-center gap-3 pt-7 text-[#c8952e]"><span className="h-px w-[65px] bg-[#c8952e]" /><i className="text-[17px] fa-solid fa-spa" /><span className="h-px w-[65px] bg-[#c8952e]" /></div><div className="text-center"><h3 className="mt-[9px] font-serif text-[13px] font-bold tracking-[5px] text-[#a70e18]">JAI MAA DURGA</h3><p className="mt-[7px] text-[9px] tracking-[4px] text-[#7b6d60]">A STRONGER COMMUNITY TOGETHER</p></div></footer>
        </div>
      </main>
    </>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return <div className="mb-5"><h2 className="font-serif text-[25px] text-[#292929] max-[600px]:text-[20px]">{title}</h2><p className="mt-1 text-[13px] text-[#737983] max-[600px]:text-[10px]">{description}</p></div>;
}

function InputField({ icon, label, placeholder, value, onChange, type = "text", required = false }: { icon: string; label: string; placeholder: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <div className="flex flex-col gap-1"><label className="text-[13px] font-semibold text-[#333]">{label}{required && <span className="ml-1 text-[#a70e18]">*</span>}</label><div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white focus-within:border-[#b3121b] focus-within:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px]"><div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]"><i className={`fa-solid ${icon}`} /></div><input className="h-[52px] flex-1 border-0 bg-transparent pr-3 text-[15px] outline-none placeholder:text-[#a1a5ad] max-[600px]:h-[47px]" type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></div></div>;
}

function SelectField({ icon, label, value, placeholder, options, onChange, required = false }: { icon: string; label: string; value: string; placeholder: string; options: readonly string[]; onChange: (value: string) => void; required?: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="flex flex-col gap-1"><label className="text-[13px] font-semibold text-[#333]">{label}{required && <span className="ml-1 text-[#a70e18]">*</span>}</label><div className="relative"><button type="button" onClick={() => setOpen((v) => !v)} className={`flex min-h-[52px] w-full items-center rounded-[11px] border border-[#dedede] bg-white text-left max-[600px]:min-h-[47px] ${open ? "border-[#b3121b] shadow-[0_0_0_4px_rgba(179,18,27,0.06)]" : ""}`}><span className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]"><i className={`fa-solid ${icon}`} /></span><span className={`flex-1 truncate pr-3 text-[15px] ${value ? "text-[#292929]" : "text-[#a1a5ad]"}`}>{value || placeholder}</span><i className={`mr-4 text-[10px] text-[#999] fa-solid fa-chevron-down ${open ? "rotate-180" : ""}`} /></button>{open && <><div className="fixed inset-0 z-[40]" onClick={() => setOpen(false)} /><div className="absolute left-0 right-0 top-[58px] z-[50] max-h-[300px] overflow-y-auto rounded-[11px] border border-[#e2d8cd] bg-white p-1.5 shadow-[0_15px_35px_rgba(50,30,10,0.16)]"><button type="button" onClick={() => { onChange(""); setOpen(false); }} className="flex w-full rounded-[8px] px-3 py-2.5 text-left text-[13px] text-[#888]">{placeholder}</button>{options.map((option) => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false); }} className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[13px] font-semibold ${value === option ? "bg-[#faeeee] text-[#a70e18]" : "text-[#333] hover:bg-[#fff1f1]"}`}><span>{option}</span>{value === option && <i className="fa-solid fa-check text-[10px]" />}</button>)}</div></>}</div></div>;
}
