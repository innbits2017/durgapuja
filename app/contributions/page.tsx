import { supabaseAdmin } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import FinancialContributions from "@/components/FinancialContributions";

export const dynamic = "force-dynamic";

export type Contribution = {
  id: string;
  name: string;
  block: string | null;
  flat_no: string | null;
  amount: number | string | null;
  status: string;
  created_at: string;
  verified_at: string | null;
};

export default async function ContributionsPage() {
  const { data: contributions, error } = await supabaseAdmin
    .from("contributions")
    .select(
      "id, name, block, flat_no, amount, status, created_at, verified_at"
    )
    .eq("status", "verified")
    .order("verified_at", { ascending: false });

  if (error) {
    console.error("Contributions page error:", error);

    return (
      <main className="min-h-screen bg-[#f8f1e7]">
        <Navbar />
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h1 className="text-2xl font-bold text-[#761019]">
            Unable to load contributions
          </h1>
          <p className="mt-2 text-sm text-[#766457]">
            Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const verifiedContributions = (contributions ?? []) as Contribution[];

  const totalVerified = verifiedContributions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const formatMoney = (value: number) =>
    `₹${Math.round(value).toLocaleString("en-IN")}`;

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
      />

      <main className="min-h-screen bg-[#f8f1e7] text-[#292929]">
        <Navbar />

        {/* HERO */}
        <section className="relative overflow-hidden bg-[#761019] px-5 py-14 text-white sm:py-18">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full border border-white/10" />

          <div className="relative mx-auto max-w-7xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#e5c878] bg-white/10 text-[#f2d77f]">
              <i className="fa-solid fa-hand-holding-heart text-xl" />
            </div>

            <p className="mt-5 text-[10px] font-bold tracking-[0.35em] text-[#f0d27d]">
              BUH DURGA PUJA 2026
            </p>

            <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
              Resident Contributions
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/75">
              A transparent record of verified contributions from our
              community members.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/80">
                <i className="fa-solid fa-circle-check mr-1.5 text-[#f2d77f]" />
                Verified Records
              </span>

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/80">
                <i className="fa-solid fa-lock mr-1.5 text-[#f2d77f]" />
                Read Only
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
          {/* SUMMARY */}
          <section className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#ead9c7] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#8c7868]">
                  Total Verified
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4df] text-[#a77a2b]">
                  <i className="fa-solid fa-users" />
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-[#761019]">
                {verifiedContributions.length}
              </p>
              <p className="mt-1 text-xs text-[#8c7868]">
                Verified resident contributions
              </p>
            </div>

            {/* <div className="rounded-2xl border border-[#ead9c7] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#8c7868]">
                  Total Collection
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4df] text-[#a77a2b]">
                  <i className="fa-solid fa-indian-rupee-sign" />
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-[#761019]">
                {formatMoney(totalVerified)}
              </p>
              <p className="mt-1 text-xs text-[#8c7868]">
                Amount received and verified
              </p>
            </div> */}
          </section>

          {/* CONTRIBUTION TABLE */}
          <FinancialContributions
            contributions={verifiedContributions}
          />

          {/* FOOTER NOTICE */}
          <div className="mt-8 rounded-2xl border border-[#ead9c7] bg-white px-5 py-4">
            <div className="flex items-start justify-center gap-3 text-center">
              <i className="fa-solid fa-lock mt-0.5 text-[11px] text-[#a77a2b]" />
              <div>
                <p className="text-xs font-semibold text-[#5e5047]">
                  Verified & Read-only records
                </p>
                <p className="mt-1 text-[11px] leading-5 text-[#8c7868]">
                  This page displays only verified resident contributions.
                  Pending and unverified payments are not included.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}