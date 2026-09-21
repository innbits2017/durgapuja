 "use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";

const DURGA_IMAGE = "/images/durga-puja-collection.webp";

const BLOCKS = ["P1", "P2", "Villa"] as const;
type Block = (typeof BLOCKS)[number];

const FLATS: Record<Block, string[]> = {
  P1: [
    ...Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(3, "0")),
    ...Array.from({ length: 12 }, (_, i) => `${101 + i}`),
    ...Array.from({ length: 12 }, (_, i) => `${201 + i}`),
    ...Array.from({ length: 12 }, (_, i) => `${301 + i}`),
  ],
  P2: [
    ...Array.from({ length: 67 }, (_, i) => String(i + 1).padStart(3, "0")),
    ...Array.from({ length: 67 }, (_, i) => `${101 + i}`),
    ...Array.from({ length: 67 }, (_, i) => `${201 + i}`),
    ...Array.from({ length: 67 }, (_, i) => `${301 + i}`),
  ],
  Villa: ["001", "002", "003", "004"],
};

const PUJA_DAYS = ["Shashti", "Saptami", "Ashtami", "Navami", "Dasami"] as const;
type PujaDay = (typeof PUJA_DAYS)[number];

const MATERIAL_SEVAS = [
  {
    id: "rice",
    title: "Rice",
    subtitle: "Sponsor rice for Bhog & Prasad.",
    icon: "fa-bowl-rice",
    options: [
      { id: "rice_10", label: "10 kg", price: 701 },
      { id: "rice_25", label: "26 kg", price: 1751 },
      { id: "rice_50", label: "52 kg", price: 3501 },
    ],
  },
  {
    id: "dal",
    title: "Dal",
    subtitle: "Sponsor dal for community meals.",
    icon: "fa-seedling",
    options: [
      { id: "dal_5", label: "5 kg", price: 601 },
    ],
  },
  {
    id: "vegetables",
    title: "Vegetables",
    subtitle: "Sponsor fresh vegetables for Puja meals.",
    icon: "fa-carrot",
    options: [
      { id: "vegetables_10", label: "10 kg", price: 1001 },
      { id: "vegetables_20", label: "20 kg", price: 2001 },
    ],
  },
  {
    id: "sukha_prasad",
    title: "Sukha Prasad",
    subtitle: "Sponsor dry Prasad for devotees.",
    icon: "fa-gift",
    options: [
      { id: "sukha_once", label: "One Time", price: 1001 },
      { id: "sukha_both", label: "Both Times", price: 2001 },
    ],
  },
] as const;

const ANNADANA_OPTIONS = [
  { id: "annadana_5001", label: "₹5,001", price: 5001 },
  { id: "annadana_10001", label: "₹10,001", price: 10001 },
  { id: "annadana_15001", label: "₹15,001", price: 15001 },
  { id: "annadana_20001", label: "₹20,001", price: 20001 },
  { id: "annadana_25001", label: "₹25,001", price: 25001 },
] as const;

const VOLUNTEER_ROLES = [
  { id: "cooking_management", title: "Cooking Management", icon: "fa-kitchen-set" },
  { id: "grocery_purchase", title: "Grocery Purchase", icon: "fa-cart-shopping" },
  { id: "deity_keeper", title: "Deity Keeper", icon: "fa-shield-heart" },
  { id: "idol_help", title: "Helping in Getting the Idol", icon: "fa-hands-holding-circle" },
  { id: "decoration", title: "Decoration", icon: "fa-wand-magic-sparkles" },
  { id: "chanda_collection", title: "Chanda Collection", icon: "fa-hand-holding-dollar" },
  { id: "tent_puja_place", title: "Tent & Puja Place Management", icon: "fa-tent" },
  { id: "idol_transportation", title: "Idol Transportation", icon: "fa-truck" },
  { id: "puja_material", title: "Puja Material Management", icon: "fa-boxes-stacked" },
  { id: "flower", title: "Flower", icon: "fa-spa" },
  { id: "daily_prasad", title: "Daily Prasad Management", icon: "fa-bowl-food" },
  { id: "fruits_vegetables", title: "Fruits & Vegetable", icon: "fa-apple-whole" },
  { id: "prasad_meals", title: "Prasad (Lunch & Dinner) Management", icon: "fa-utensils" },
  { id: "cultural_program", title: "Cultural Program", icon: "fa-music" },
  { id: "devotee_management", title: "Devotee Management", icon: "fa-people-group" },
  { id: "cleanliness", title: "Cleanliness Management", icon: "fa-broom" },
] as const;

type MaterialSelection = {
  selected: boolean;
  optionId: string;
  day: PujaDay | "";
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
        {label} {required && <span className="text-[#a70e18]">*</span>}
      </span>
      <div className="flex min-h-[48px] items-center rounded-[12px] border border-[#eadfd2] bg-[#fffaf4] px-3 transition focus-within:border-[#c99a43] focus-within:bg-white">
        <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f8e8e5] text-[#a70e18]">
          <i className={`fa-solid ${icon}`} />
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-[#765f53]">
        {label} <span className="text-[#a70e18]">*</span>
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
          <i className={`fa-solid ${icon}`} />
        </span>
        <span className={`flex-1 text-[13px] ${value ? "text-[#292929]" : "text-[#aaa09a]"}`}>
          {value || placeholder}
        </span>
        <i className={`fa-solid fa-chevron-down text-[11px] text-[#8d7a70] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 top-[72px] z-30 max-h-56 overflow-y-auto rounded-[12px] border border-[#eadfd2] bg-white p-1.5 shadow-[0_14px_30px_rgba(68,44,20,0.14)]"
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`flex w-full items-center rounded-[9px] px-3 py-2.5 text-left text-[13px] transition hover:bg-[#fff5e9] ${
                value === option ? "bg-[#fff1e9] font-semibold text-[#a70e18]" : "text-[#444]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FlatSearchSelect({
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
  setSearch: (value: string) => void;
  open: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  const options = useMemo(() => {
    if (!block) return [];
    const q = search.trim().toLowerCase();
    return FLATS[block].filter((flat) => flat.toLowerCase().includes(q));
  }, [block, search]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-[#765f53]">
        Flat No. <span className="text-[#a70e18]">*</span>
      </span>

      <div className="flex min-h-[48px] items-center rounded-[12px] border border-[#eadfd2] bg-[#fffaf4] px-3 focus-within:bg-white">
        <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f8e8e5] text-[#a70e18]">
          <i className="fa-solid fa-house" />
        </span>
        <input
          value={open ? search : value}
          disabled={!block}
          onFocus={() => {
            if (block) {
              setSearch("");
              onToggle();
            }
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) onToggle();
          }}
          placeholder={block ? "Search and select your flat" : "Select block first"}
          className="w-full bg-transparent text-[13px] text-[#292929] outline-none placeholder:text-[#aaa09a] disabled:cursor-not-allowed"
        />
        <i className="fa-solid fa-chevron-down ml-2 text-[11px] text-[#8d7a70]" />
      </div>

      {open && block && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 top-[72px] z-30 max-h-56 overflow-y-auto rounded-[12px] border border-[#eadfd2] bg-white p-1.5 shadow-[0_14px_30px_rgba(68,44,20,0.14)]"
        >
          {options.length ? (
            options.map((flat) => (
              <button
                key={flat}
                type="button"
                onClick={() => onChange(flat)}
                className={`flex w-full items-center rounded-[9px] px-3 py-2.5 text-left text-[13px] hover:bg-[#fff5e9] ${
                  value === flat ? "bg-[#fff1e9] font-semibold text-[#a70e18]" : "text-[#444]"
                }`}
              >
                {flat}
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-[12px] text-[#888]">No flat found</div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[10px] text-[#8a7b70]">{label}</div>
      <div className="mt-1 text-[12px] font-bold text-[#403731]">
        {value}
      </div>
    </div>
  );
}

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
        {completed ? <i className="fa-solid fa-check" /> : number}
      </div>

      <div
        className={`mt-[11px] whitespace-nowrap text-[12px] font-semibold max-[600px]:ml-[-2px] max-[600px]:w-20 max-[600px]:whitespace-normal max-[600px]:text-[9px] max-[600px]:leading-[1.3] ${
          active ? "text-[#ae0c16]" : "text-[#737373]"
        }`}
      >
        {title}
      </div>
    </div>
  );
}

export default function SevaPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState("");
  const [block, setBlock] = useState<Block | "">("");
  const [flatNo, setFlatNo] = useState("");
  const [flatSearch, setFlatSearch] = useState("");
  const [mobile, setMobile] = useState("");
  const [utr, setUtr] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [materialSelections, setMaterialSelections] = useState<Record<string, MaterialSelection>>(
    Object.fromEntries(
      MATERIAL_SEVAS.map((item) => [
        item.id,
        {
          selected: false,
          optionId: item.options[0]?.id || "",
          day: "",
        },
      ])
    )
  );

  const [annadanaSelection, setAnnadanaSelection] = useState<{
    selected: boolean;
    optionId: string;
    day: PujaDay | "";
  }>({
    selected: false,
    optionId: ANNADANA_OPTIONS[0].id,
    day: "",
  });

  const [volunteerRoles, setVolunteerRoles] = useState<string[]>([]);
  const [volunteerNote, setVolunteerNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [error, setError] = useState("");

  const selectedMaterials = MATERIAL_SEVAS.filter((item) => materialSelections[item.id]?.selected);
  const hasAnySeva =
    selectedMaterials.length > 0 ||
    annadanaSelection.selected ||
    volunteerRoles.length > 0;

  const selectedMaterialTotal = selectedMaterials.reduce((sum, item) => {
    const selection = materialSelections[item.id];
    const option = item.options.find((entry) => entry.id === selection?.optionId);
    return sum + Number(option?.price || 0);
  }, 0);

  const annadanaTotal = annadanaSelection.selected
    ? Number(
        ANNADANA_OPTIONS.find(
          (option) => option.id === annadanaSelection.optionId
        )?.price || 0
      )
    : 0;

  // Calculate the total BEFORE constructing the UPI URL.
  // This avoids a temporal-dead-zone error during render.
  const totalSevaAmount = selectedMaterialTotal + annadanaTotal;

  const upiId =
    process.env.NEXT_PUBLIC_UPI_ID || "9036082478@ptsbi";

  const upiName =
    process.env.NEXT_PUBLIC_UPI_NAME || "BUH Durga Puja";

  const upiUrl =
    `upi://pay` +
    `?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(upiName)}` +
    `&am=${totalSevaAmount.toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(
      `BUH Durga Puja Seva - ${block}-${flatNo}`
    )}`;

  const qrUrl =
    `https://api.qrserver.com/v1/create-qr-code/` +
    `?size=400x400&margin=10&data=${encodeURIComponent(upiUrl)}`;

  function toggleMaterial(id: string) {
    setMaterialSelections((current) => ({
      ...current,
      [id]: {
        ...current[id],
        selected: !current[id].selected,
      },
    }));
  }

  function updateMaterialOption(id: string, optionId: string) {
    setMaterialSelections((current) => ({
      ...current,
      [id]: {
        ...current[id],
        optionId,
      },
    }));
  }

  function updateMaterialDay(id: string, day: PujaDay) {
    setMaterialSelections((current) => ({
      ...current,
      [id]: {
        ...current[id],
        day,
      },
    }));
  }

  function updateAnnadanaOption(optionId: string) {
    setAnnadanaSelection((current) => ({
      ...current,
      optionId,
    }));
  }

  function updateAnnadanaDay(day: PujaDay) {
    setAnnadanaSelection((current) => ({
      ...current,
      day,
    }));
  }

  function toggleVolunteerRole(id: string) {
    setVolunteerRoles((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function continueToConfirmation() {
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

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!hasAnySeva) {
      setError("Please select at least one Seva option.");
      return;
    }

    for (const item of selectedMaterials) {
      const selection = materialSelections[item.id];

      if (!selection?.optionId) {
        setError(`Please select a package for ${item.title}.`);
        return;
      }

      if (!selection.day) {
        setError(`Please select the Puja day for ${item.title}.`);
        return;
      }
    }

    if (annadanaSelection.selected && !annadanaSelection.day) {
      setError("Please select the Puja day for Annadana Seva.");
      return;
    }

    setOpenDropdown(null);
    setStep(2);
  }

  async function submitSeva() {
    setError("");

    if (totalSevaAmount > 0 && !utr.trim()) {
      setError("Please enter the UTR / Transaction ID.");
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/seva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          block,
          flatNo,
          mobile,
          materials: [
            ...selectedMaterials.map((item) => {
              const selection = materialSelections[item.id];
              const option = item.options.find(
                (entry) => entry.id === selection.optionId
              );

              const quantityMatch =
                option?.label.match(/^(\d+)/);

              return {
                type: item.id,
                title: item.title,
                package: option?.label || "",
                quantity: quantityMatch
                  ? Number(quantityMatch[1])
                  : null,
                unit:
                  item.id === "sukha_prasad"
                    ? "time"
                    : "kg",
                price: Number(option?.price || 0),
                day: selection.day,
              };
            }),
            ...(annadanaSelection.selected
              ? [
                  {
                    type: "annadana",
                    title: "Annadana Seva",
                    package:
                      ANNADANA_OPTIONS.find(
                        (option) =>
                          option.id === annadanaSelection.optionId
                      )?.label || "",
                    quantity: null,
                    unit: "service",
                    price: annadanaTotal,
                    day: annadanaSelection.day,
                  },
                ]
              : []),
          ],
          volunteerRoles,
          volunteerRoleNames: VOLUNTEER_ROLES.filter(
            (role) => volunteerRoles.includes(role.id)
          ).map((role) => role.title),
          volunteerNote: volunteerNote.trim() || null,
          amount: totalSevaAmount,
          paymentMethod:
            totalSevaAmount > 0 ? "upi" : null,
          utr:
            totalSevaAmount > 0 ? utr.trim() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.error || "Unable to submit your Seva."
        );
        return;
      }

      setSubmittedId(data.sevaNo);
      setStep(3);
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
    setBlock("");
    setFlatNo("");
    setFlatSearch("");
    setMobile("");
    setUtr("");
    setOpenDropdown(null);
    setMaterialSelections(
      Object.fromEntries(
        MATERIAL_SEVAS.map((item) => [
          item.id,
          {
            selected: false,
            optionId: item.options[0]?.id || "",
            day: "",
          },
        ])
      )
    );
    setAnnadanaSelection({
      selected: false,
      optionId: ANNADANA_OPTIONS[0].id,
      day: "",
    });
    setVolunteerRoles([]);
    setVolunteerNote("");
    setSubmittedId("");
    setError("");
    setStep(1);
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
      />

      <main
        onClick={() => setOpenDropdown(null)}
        className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#fffaf2_0%,#f8eddd_48%,#efdfca_100%)] px-4 py-[24px] pb-[36px] text-[#292929] max-[600px]:px-2 max-[600px]:py-2 max-[600px]:pb-5"
      >
        <div className="relative z-30 mx-auto -mt-2 mb-3 w-full max-w-7xl rounded-2xl border border-[#ead8bd]/70 bg-[#fffaf2]/95 shadow-[0_8px_30px_rgba(120,70,20,0.08)] backdrop-blur-sm max-[600px]:rounded-xl">
          <Navbar />
        </div>

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
          <section className="relative mt-[70px] min-h-[250px] overflow-visible rounded-[24px] border border-[#ead9c7] bg-gradient-to-br from-white/[0.97] to-[#fff9ef]/[0.98] px-7 pb-5 pt-5 shadow-[0_18px_50px_rgba(77,48,20,0.10)] max-[600px]:min-h-[285px] max-[600px]:rounded-[18px] max-[600px]:px-3 max-[600px]:pb-3 max-[600px]:pt-3">
            <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_15%_25%,#d3a044_1px,transparent_2px)] bg-[size:30px_30px]" />

            <div className="absolute left-[55px] top-[105px] z-[5] flex flex-col gap-0 text-left text-[10px] font-bold leading-[1.8] tracking-[4px] text-[#73594b] max-[850px]:left-6 max-[600px]:hidden">
              <span>TOGETHER</span>
              <span>WE SERVE</span>
              <span>OUR COMMUNITY</span>
              <div className="mt-2 h-[2px] w-10 bg-[#d09a32]" />
            </div>

            <div className="absolute right-[55px] top-[105px] z-[5] flex flex-col items-end gap-0 text-right text-[10px] font-bold leading-[1.8] tracking-[4px] text-[#73594b] max-[850px]:right-6 max-[600px]:hidden">
              <span>SEVA</span>
              <span>DEVOTION</span>
              <span>TOGETHERNESS</span>
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
                COMMUNITY SEVA
              </div>

              <h1 className="mt-2 text-[30px] font-bold leading-[1.02] text-[#a80d17] font-open-sans max-[600px]:text-[27px]">
                BUH Durga Puja 2026
              </h1>

              <p className="mt-2 font-serif text-[15px] italic text-[#7b5b4e] max-[600px]:text-[11px]">
                Offer your Seva and be a part of our Durga Puja celebrations.
              </p>

              <div className="mt-3 flex items-center justify-center gap-3 text-[#d09a32] max-[600px]:mt-2">
                <span />
                <i className="text-[23px] text-[#a70e18] fa-solid fa-spa" />
                <span />
              </div>
            </div>

          </section>

          {/* STEPPER */}
          <section className="flex items-start px-6 pb-3 pt-3 max-[600px]:px-0 max-[600px]:pb-2 max-[600px]:pt-2">
            <StepItem number="1" title="Choose Your Seva" active={step >= 1} completed={step > 1} />

            <div
              className={`mt-[22px] h-px flex-1 bg-[#d7d8db] max-[600px]:mt-[18px] ${
                step > 1 ? "bg-[#c79531]" : ""
              }`}
            />

            <StepItem number="2" title="Confirm Seva" active={step >= 2} completed={step > 2} />

            <div
              className={`mt-[22px] h-px flex-1 bg-[#d7d8db] max-[600px]:mt-[18px] ${
                step > 2 ? "bg-[#c79531]" : ""
              }`}
            />

            <StepItem number="3" title="Submitted" active={step >= 3} completed={step > 3} />
          </section>

          {/* STEP 1 */}
          {step === 1 && (
            <section className="relative overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">
              <div className="px-6 pb-2 pt-5 max-[600px]:px-3 max-[600px]:pb-1 max-[600px]:pt-3">
                <div className="mb-5">
                  <h2 className="font-serif text-[24px] text-[#292929] sm:text-[25px]">Seva Details</h2>
                  <p className="mt-1 text-[12px] text-[#737983] sm:text-[13px]">
                    Choose how you would like to contribute to the BUH Durga Puja 2026 celebrations.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <InputField
                    icon="fa-user"
                    label="Name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={setName}
                    required
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CustomSelect
                      icon="fa-building"
                      label="Block"
                      placeholder="Select Block"
                      value={block}
                      options={[...BLOCKS]}
                      open={openDropdown === "block"}
                      onToggle={() => setOpenDropdown(openDropdown === "block" ? null : "block")}
                      onChange={(value) => {
                        setBlock(value as Block);
                        setFlatNo("");
                        setFlatSearch("");
                        setOpenDropdown(null);
                      }}
                    />

                    <FlatSearchSelect
                      block={block}
                      value={flatNo}
                      search={flatSearch}
                      setSearch={setFlatSearch}
                      open={openDropdown === "flat"}
                      onToggle={() => {
                        if (block) setOpenDropdown(openDropdown === "flat" ? null : "flat");
                      }}
                      onChange={(value) => {
                        setFlatNo(value);
                        setFlatSearch(value);
                        setOpenDropdown(null);
                      }}
                    />
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-[#765f53]">
                      Mobile Number <span className="text-[#a70e18]">*</span>
                    </span>
                    <div className="flex min-h-[48px] items-center rounded-[12px] border border-[#eadfd2] bg-[#fffaf4] px-3 focus-within:bg-white">
                      <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f8e8e5] text-[#a70e18]">
                        <i className="fa-solid fa-phone" />
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#aaa09a]"
                      />
                      <span className="ml-2 whitespace-nowrap text-[12px] font-semibold text-[#615a55]">🇮🇳 +91</span>
                    </div>
                  </label>
                </div>

                {/* MATERIAL SEVA */}
                <div className="mt-7">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-[21px] text-[#292929]">Material Seva</h3>
                      <p className="mt-1 text-[11px] text-[#777] sm:text-[12px]">
                        Sponsor the required materials. The committee will purchase and arrange the items.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fff3e9] px-2.5 py-1 text-[10px] font-bold text-[#a70e18]">OPTIONAL</span>
                  </div>

                  <div className="mb-3 rounded-[11px] border border-[#f0dfbd] bg-[#fff8ea] px-3 py-2.5 text-[10px] leading-[1.5] text-[#6f6259]">
                    <i className="fa-solid fa-circle-info mr-1 text-[#a70e18]" />
                    Seva amounts are sponsorship amounts for the listed requirement. Please do not bring the materials directly.
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {MATERIAL_SEVAS.map((item) => {
                      const selection = materialSelections[item.id];
                      const selected = selection?.selected;
                      const selectedOption = item.options.find((option) => option.id === selection?.optionId);

                      return (
                        <div key={item.id} className={`rounded-[13px] border p-3 transition ${
                          selected
                            ? "border-[#d8b06b] bg-[#fff8ed] shadow-[0_7px_16px_rgba(150,105,42,0.08)]"
                            : "border-[#eadfd2] bg-[#fffdf9]"
                        }`}>
                          <button type="button" onClick={() => toggleMaterial(item.id)} className="flex w-full items-start gap-3 text-left">
                            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                              selected ? "bg-[#a70e18] text-white" : "bg-[#f8e8e5] text-[#a70e18]"
                            }`}>
                              <i className={`fa-solid ${item.icon}`} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-[16px] font-bold text-[#3b312d]">{item.title}</span>
                                <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[12px] ${
                                  selected ? "border-[#a70e18] bg-[#a70e18] text-white" : "border-[#d8d0c8] text-transparent"
                                }`}>
                                  <i className="fa-solid fa-check" />
                                </span>
                              </span>
                              <span className="mt-0.5 block text-[14px] leading-[1.45] text-[#81766f]">{item.subtitle}</span>
                            </span>
                          </button>

                          <div className="mt-3 grid gap-2">
                            <div>
                              <div className="mb-1 text-[14px] font-semibold text-[#756961]">Sponsorship Option</div>
                              <div className="grid grid-cols-1 gap-1.5">
                                {item.options.map((option) => (
                                  <button key={option.id} type="button" disabled={!selected} onClick={() => updateMaterialOption(item.id, option.id)}
                                    className={`flex items-center justify-between rounded-[9px] border px-2.5 py-2.5 text-left text-[14px] transition ${
                                      selectedOption?.id === option.id
                                        ? "border-[#c79531] bg-[#fff1d9] font-bold text-[#a70e18]"
                                        : "border-[#eadfd2] bg-white text-[#555]"
                                    } ${!selected ? "cursor-not-allowed opacity-50" : "hover:bg-[#fff8ed]"}`}>
                                    <span>{option.label}</span>
                                    <span>₹{option.price.toLocaleString("en-IN")}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="mb-1 text-[14px] font-semibold text-[#756961]">Puja Day</div>
                              <div className="grid grid-cols-5 gap-1">
                                {PUJA_DAYS.map((day) => (
                                  <button key={day} type="button" disabled={!selected} onClick={() => updateMaterialDay(item.id, day)}
                                    className={`rounded-[8px] border px-1 py-2 text-[11px] font-semibold transition ${
                                      selection?.day === day ? "border-[#a70e18] bg-[#a70e18] text-white" : "border-[#eadfd2] bg-white text-[#6f6259]"
                                    } ${!selected ? "cursor-not-allowed opacity-50" : "hover:bg-[#fff1e9]"}`}>
                                    {day}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ANNADANA SEVA */}
                <div className="mt-7">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-[21px] text-[#292929]">Annadana Seva</h3>
                      <p className="mt-1 text-[11px] text-[#777] sm:text-[12px]">Sponsor Annadana for the Puja community.</p>
                    </div>
                    <span className="rounded-full bg-[#fff3e9] px-2.5 py-1 text-[10px] font-bold text-[#a70e18]">OPTIONAL</span>
                  </div>

                  <div className={`rounded-[13px] border p-3 transition ${
                    annadanaSelection.selected
                      ? "border-[#d8b06b] bg-[#fff8ed] shadow-[0_7px_16px_rgba(150,105,42,0.08)]"
                      : "border-[#eadfd2] bg-[#fffdf9]"
                  }`}>
                    <button type="button" onClick={() => setAnnadanaSelection((current) => ({ ...current, selected: !current.selected }))} className="flex w-full items-start gap-3 text-left">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                        annadanaSelection.selected ? "bg-[#a70e18] text-white" : "bg-[#f8e8e5] text-[#a70e18]"
                      }`}>
                        <i className="fa-solid fa-bowl-food" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[15px] font-bold text-[#3b312d]">Annadana Sponsorship</span>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[9px] ${
                            annadanaSelection.selected ? "border-[#a70e18] bg-[#a70e18] text-white" : "border-[#d8d0c8] text-transparent"
                          }`}>
                            <i className="fa-solid fa-check" />
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-[1.45] text-[#81766f]">Choose a sponsorship amount and the day you wish to support.</span>
                      </span>
                    </button>

                    <div className="mt-3 grid gap-2">
                      <div>
                        <div className="mb-1 text-[14px] font-semibold text-[#756961]">Sponsorship Amount</div>
                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                          {ANNADANA_OPTIONS.map((option) => (
                            <button key={option.id} type="button" disabled={!annadanaSelection.selected} onClick={() => updateAnnadanaOption(option.id)}
                              className={`rounded-[9px] border px-2.5 py-2.5 text-[12px] font-bold transition ${
                                annadanaSelection.optionId === option.id ? "border-[#c79531] bg-[#fff1d9] text-[#a70e18]" : "border-[#eadfd2] bg-white text-[#555]"
                              } ${!annadanaSelection.selected ? "cursor-not-allowed opacity-50" : "hover:bg-[#fff8ed]"}`}>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 text-[14px] font-semibold text-[#756961]">Puja Day</div>
                        <div className="grid grid-cols-5 gap-1">
                          {PUJA_DAYS.map((day) => (
                            <button key={day} type="button" disabled={!annadanaSelection.selected} onClick={() => updateAnnadanaDay(day)}
                              className={`rounded-[8px] border px-1 py-2 text-[11px] font-semibold transition ${
                                annadanaSelection.day === day ? "border-[#a70e18] bg-[#a70e18] text-white" : "border-[#eadfd2] bg-white text-[#6f6259]"
                              } ${!annadanaSelection.selected ? "cursor-not-allowed opacity-50" : "hover:bg-[#fff1e9]"}`}>
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VOLUNTEERS */}
                <div className="mt-7">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-[21px] text-[#292929]">Volunteer Seva</h3>
                      <p className="mt-1 text-[11px] text-[#777] sm:text-[12px]">
                        Select the areas where you would like to volunteer.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fff3e9] px-2.5 py-1 text-[10px] font-bold text-[#a70e18]">
                      OPTIONAL
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {VOLUNTEER_ROLES.map((role) => {
                      const selected = volunteerRoles.includes(role.id);

                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => toggleVolunteerRole(role.id)}
                          className={`flex items-center gap-2.5 rounded-[11px] border px-3 py-2.5 text-left transition ${
                            selected
                              ? "border-[#d8b06b] bg-[#fff8ed]"
                              : "border-[#eadfd2] bg-[#fffdf9] hover:bg-[#fffaf3]"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${
                              selected ? "bg-[#a70e18] text-white" : "bg-[#f8e8e5] text-[#a70e18]"
                            }`}
                          >
                            <i className={`fa-solid ${role.icon} text-[11px]`} />
                          </span>
                          <span className="flex-1 text-[14px] font-semibold leading-[1.35] text-[#4b403a]">
                            {role.title}
                          </span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-[9px] ${
                              selected
                                ? "border-[#a70e18] bg-[#a70e18] text-white"
                                : "border-[#d8d0c8] text-transparent"
                            }`}
                          >
                            <i className="fa-solid fa-check" />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {volunteerRoles.length > 0 && (
                    <textarea
                      value={volunteerNote}
                      onChange={(e) => setVolunteerNote(e.target.value)}
                      placeholder="Any preference, availability or note for the committee? (Optional)"
                      rows={3}
                      className="mt-3 w-full resize-none rounded-[12px] border border-[#eadfd2] bg-[#fffaf4] px-3 py-3 text-[12px] outline-none placeholder:text-[#aaa09a] focus:border-[#c99a43] focus:bg-white"
                    />
                  )}
                </div>

                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-[10px] border border-[#f1cccc] bg-[#fff1f1] px-3 py-2.5 text-[12px] text-[#a20d16]">
                    <i className="fa-solid fa-circle-exclamation mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={continueToConfirmation}
                  className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-3 rounded-[12px] border-0 bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition hover:-translate-y-px"
                >
                  <span>Continue to Confirmation</span>
                  <i className="fa-solid fa-arrow-right" />
                </button>

                <div className="my-2 flex items-center justify-center gap-2 text-[11px] text-[#687078]">
                  <i className="fa-solid fa-hands-praying" />
                  <span>Every Seva strengthens our community.</span>
                </div>
              </div>
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
                    Complete your payment and submit the transaction details.
                  </p>
                </div>

                <div className="mb-5 grid grid-cols-4 gap-3 rounded-[13px] bg-[#fcf8f1] p-[15px] max-[600px]:grid-cols-2">
                  <SummaryBox label="Name" value={name} />
                  <SummaryBox label="Block" value={block} />
                  <SummaryBox label="Flat" value={flatNo} />
                  <SummaryBox
                    label="Amount"
                    value={`₹${totalSevaAmount.toLocaleString("en-IN")}`}
                  />
                </div>

                {totalSevaAmount > 0 ? (
                  <>
                    <div className="mb-5">
                      <label className="mb-2 block text-[13px] font-semibold text-[#333]">
                        Payment Method
                      </label>
                      <div className="flex min-h-[58px] items-center justify-center gap-3 rounded-[11px] border border-[#a70e18] bg-[#fff1f1] text-[13px] font-bold text-[#a70e18]">
                        <i className="fa-solid fa-qrcode" />
                        UPI / Online
                      </div>
                    </div>

                    <div className="mb-4 rounded-[13px] bg-[#fcf8f1] px-[18px] py-[15px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-[#555]">
                          Total Sponsorship
                        </span>
                        <strong className="text-[18px] text-[#a70e18]">
                          ₹{totalSevaAmount.toLocaleString("en-IN")}
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
                        Scan with Google Pay, PhonePe, Paytm or any UPI app
                      </p>

                      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                        <span className="text-[12px] text-[#555]">
                          Paying to
                        </span>
                        <strong className="text-[12px] text-[#222]">
                          {upiName}
                        </strong>
                        <div className="inline-flex items-center gap-2 rounded-lg bg-[#f6f6f6] px-3 py-[7px] text-[11px] text-[#737373]">
                          <span>{upiId}</span>
                          <button
                            type="button"
                            className="text-[#737373] hover:text-[#333]"
                            onClick={() =>
                              navigator.clipboard?.writeText(upiId)
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
                      className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-[15px] rounded-[12px] bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white no-underline shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition hover:-translate-y-px"
                    >
                      <i className="fa-solid fa-mobile-screen-button" />
                      Open UPI App
                    </a>

                    <div className="mt-6">
                      <InputField
                        icon="fa-receipt"
                        label="UTR / Transaction ID"
                        placeholder="Enter UTR / Transaction ID"
                        value={utr}
                        onChange={setUtr}
                        required
                      />
                    </div>

                    <div className="my-[15px] flex gap-2 rounded-[11px] border border-[#f0dfbd] bg-[#fff8eb] px-[15px] py-[13px] text-[12px] text-[#725e3a]">
                      <i className="mt-0.5 fa-solid fa-circle-info" />
                      <p>
                        Payment is not submitted for verification until the UTR / Transaction ID is filled and submitted.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[13px] border border-[#f0dfbd] bg-[#fff8eb] p-4 text-center">
                    <i className="fa-solid fa-hands-praying mb-2 text-2xl text-[#a70e18]" />
                    <p className="text-[13px] font-semibold text-[#4f4039]">
                      No payment is required for Volunteer Seva.
                    </p>
                    <p className="mt-1 text-[12px] text-[#777]">
                      You can submit your volunteer preferences directly.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-[10px] border border-[#f1cccc] bg-[#fff1f1] px-3 py-2.5 text-[12px] text-[#a20d16]">
                    <i className="fa-solid fa-circle-exclamation mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={submitSeva}
                  disabled={loading || (totalSevaAmount > 0 && !utr.trim())}
                  className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-[15px] rounded-[12px] border-0 bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span>Submitting...</span>
                      <i className="fa-solid fa-spinner fa-spin" />
                    </>
                  ) : (
                    <>
                      <span>
                        {totalSevaAmount > 0
                          ? "Submit Seva & Payment"
                          : "Submit Seva"}
                      </span>
                      <i className="fa-solid fa-check" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  className="mt-3 flex w-full items-center justify-center gap-2 border-0 bg-transparent text-[12px] font-semibold text-[#777]"
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                >
                  <i className="fa-solid fa-arrow-left" />
                  Change Seva Details
                </button>
              </div>
            </section>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <section className="relative mt-5 overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)]">
              <div className="px-4 pb-10 pt-9 text-center sm:px-[45px] sm:pb-[50px] sm:pt-[45px]">
                <div className="mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#a70e18] text-[29px] text-white shadow-[0_12px_28px_rgba(167,14,24,0.20)]">
                  <i className="fa-solid fa-check" />
                </div>

                <h2 className="font-serif text-[29px] text-[#292929] sm:text-[30px]">Seva Submitted</h2>

                <p className="mt-2 text-[13px]">
                  Thank you, <strong>{name}</strong>.
                </p>

                <p className="mt-2 text-[12px] text-[#707070] sm:text-[13px]">
                  Your Seva registration has been successfully submitted to the BUH Durga Puja Committee.
                </p>

                <div className="mx-auto my-[25px] max-w-[380px] rounded-[13px] bg-[#fcf7ed] p-[17px]">
                  <div className="flex justify-between text-[12px] text-[#666]">
                    <span>Seva ID</span>
                    <strong className="text-[#a70e18]">{submittedId}</strong>
                  </div>

                  <div className="mt-2 flex justify-between text-[12px] text-[#666]">
                    <span>Participant</span>
                    <strong>{name}</strong>
                  </div>

                  <div className="mt-2 flex justify-between text-[12px] text-[#666]">
                    <span>Flat</span>
                    <strong>{block}-{flatNo}</strong>
                  </div>

                  <div className="mt-2 flex justify-between text-[12px] text-[#666]">
                    <span>Total Sevas</span>
                    <strong>{selectedMaterials.length + (annadanaSelection.selected ? 1 : 0) + volunteerRoles.length}</strong>
                  </div>
                  {totalSevaAmount > 0 && (
                    <div className="mt-2 flex justify-between text-[12px] text-[#666]">
                      <span>Sponsorship Amount</span>
                      <strong className="text-[#a70e18]">₹{totalSevaAmount.toLocaleString("en-IN")}</strong>
                    </div>
                  )}
                </div>

                <div className="mx-auto flex max-w-[500px] gap-[11px] rounded-[12px] border border-[#f0dfbd] bg-[#fff8ea] p-[15px] text-left">
                  <i className="fa-solid fa-hands-praying mt-0.5 text-[#a70e18]" />
                  <div>
                    <strong className="text-[13px]">Thank you for offering your Seva</strong>
                    <p className="mt-1 text-[12px] leading-[1.5] text-[#666]">
                      The Puja Committee will verify the payment using the UTR provided and will contact you regarding Seva confirmation and coordination.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-7 rounded-[12px] bg-gradient-to-br from-[#a70812] to-[#c70d18] px-6 py-3 text-[13px] font-bold text-white shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition hover:-translate-y-px"
                >
                  Offer Another Seva
                </button>

                <div className="mt-7 font-serif text-[12px] font-bold tracking-[5px] text-[#a70e18]">
                  JAI MAA DURGA
                </div>
              </div>
            </section>
          )}

          {/* BENEFITS */}
          <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-[16px] border border-[#eadfd2] bg-[#fffaf3] sm:grid-cols-4">
            {[
              ["fa-people-group", "Stronger", "Community"],
              ["fa-spa", "Our Culture", "Our Pride"],
              ["fa-hands-praying", "Seva", "Devotion"],
              ["fa-heart", "Together", "We Celebrate"],
            ].map(([icon, first, second], index) => (
              <div
                key={first}
                className={`px-3 py-4 text-center ${
                  index < 2 ? "border-b border-[#eadfd2] sm:border-b-0" : ""
                } ${index % 2 === 0 ? "border-r border-[#eadfd2] sm:border-r-0" : ""} ${
                  index < 3 ? "sm:border-r sm:border-[#eadfd2]" : ""
                }`}
              >
                <i className={`fa-solid ${icon} text-[17px] text-[#a70e18]`} />
                <div className="mt-1 text-[10px] font-bold leading-[1.35] text-[#65564d]">
                  {first}
                  <br />
                  {second}
                </div>
              </div>
            ))}
          </div>

          <footer>
            <div className="flex items-center justify-center gap-3 pt-7 text-[#c8952e]">
              <span className="h-px w-[65px] bg-[#c8952e]" />
              <i className="fa-solid fa-spa text-[17px] text-[#c8952e]" />
              <span className="h-px w-[65px] bg-[#c8952e]" />
            </div>

            <div className="relative z-[6] text-center">
              <h3 className="mt-[9px] font-serif text-[13px] font-bold tracking-[5px] text-[#a70e18]">
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
