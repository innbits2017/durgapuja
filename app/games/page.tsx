"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

const games = [
  {
    title: "Save the Temple",
    description:
      "Defend the temple from approaching demons. Tap them before they reach Maa Durga and survive the 45-second challenge.",
    icon: "fa-solid fa-shield-halved",
    accent: "#a70e18",
    href: "/games/save-temple",
    tags: ["ACTION", "45 SEC", "TAP & PLAY"],
    difficulty: "FAST-PACED",
  },
  {
    title: "Quiz",
    description:
      "Test your memory with a devotional matching challenge. Match the divine pairs and complete the board before time runs out.",
    icon: "fa-solid fa-brain",
    accent: "#8f6a22",
    href: "/games/quiz",
    tags: ["MEMORY", "QUIZ", "FAMILY"],
    difficulty: "THINK & PLAY",
  },
];

export default function GamesPage() {
  return (
    <main className="min-h-screen bg-[#f8f1e7] font-sans text-[#241b17]">
      <div className="relative z-30 mx-auto -mt-2 mb-2 w-full max-w-7xl rounded-2xl border border-[#ead8bd]/70 bg-[#fffaf2]/95 shadow-[0_6px_20px_rgba(120,70,20,0.07)] backdrop-blur-sm max-[600px]:rounded-xl">
        <Navbar />
      </div>

      {/* COMPACT HERO */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_center,_#fffaf0_0%,_#f7ead8_55%,_#ecd3b0_100%)] px-4 py-5 sm:py-7">
        <div className="pointer-events-none absolute left-[-100px] top-[-70px] h-48 w-48 rounded-full border border-[#c89a3d]/15" />
        <div className="pointer-events-none absolute right-[-90px] bottom-[-90px] h-52 w-52 rounded-full border border-[#c89a3d]/15" />

        <div className="relative mx-auto max-w-4xl text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[9px] font-semibold text-[#8a6c45] transition hover:text-[#a70e18]"
          >
            <i className="fa-solid fa-arrow-left" />
            BACK TO HOME
          </Link>

          <div className="mx-auto mt-2.5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7b66a] bg-[#fff8ec] text-base text-[#a70e18] shadow-sm">
            <i className="fa-solid fa-gamepad" />
          </div>

          <p className="mt-2 text-[8px] font-bold tracking-[0.35em] text-[#a77a2b]">
            PLAY & DISCOVER
          </p>

          <h1 className="mt-1 text-3xl font-bold leading-tight text-[#761019] sm:text-4xl">
            Games
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-[#766457]">
            Take a short break, challenge yourself and enjoy a little festive fun.
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {[
              ["fa-people-group", "FOR EVERYONE"],
              ["fa-bolt", "QUICK TO PLAY"],
              ["fa-trophy", "BEAT YOUR SCORE"],
            ].map(([icon, label]) => (
              <span
                key={label}
                className="rounded-full border border-[#d7b66a] bg-white/60 px-2.5 py-1.5 text-[8px] font-bold tracking-[0.08em] text-[#7d531f]"
              >
                <i className={`fa-solid ${icon} mr-1.5 text-[#a70e18]`} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* COMPACT GAME LIST */}
      <section className="bg-[#f8f0e5] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-center">
            <p className="text-[8px] font-bold tracking-[0.3em] text-[#a77a2b]">
              CHOOSE YOUR CHALLENGE
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#761019] sm:text-2xl">
              Which game will you play?
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {games.map((game, index) => (
              <Link
                key={game.href}
                href={game.href}
                className="group block overflow-hidden rounded-2xl border border-[#e3d0b4] bg-white shadow-[0_8px_24px_rgba(77,48,20,0.07)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(77,48,20,0.11)]"
              >
                {/* Smaller visual header */}
                <div className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#fffaf0_0%,#f5e5cc_65%,#ecd2aa_100%)] px-4 pb-4 pt-5">
                  <div
                    className="absolute -right-10 -top-12 h-28 w-28 rounded-full border-[12px] opacity-10"
                    style={{ borderColor: game.accent }}
                  />

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d7b66a] bg-[#fffaf2] text-3xl text-[#761019]">
                     <i className={game.icon} />
                  </div>

                  <div className="relative mt-3 text-center">
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-[7px] font-black tracking-[0.14em] text-white"
                      style={{ backgroundColor: game.accent }}
                    >
                      {game.difficulty}
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[8px] font-bold tracking-[0.22em] text-[#a77a2b]">
                        GAME {index + 1}
                      </p>
                      <h3 className="mt-0.5 text-xl font-bold leading-tight text-[#761019]">
                        {game.title}
                      </h3>
                    </div>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d7b66a] bg-[#fffaf2] text-xs text-[#a70e18] transition group-hover:bg-[#a70e18] group-hover:text-white">
                      <i className="fa-solid fa-arrow-right" />
                    </div>
                  </div>

                  <p className="mt-2.5 text-xs leading-5 text-[#766457]">
                    {game.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {game.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[#e4d3bc] bg-[#fffaf2] px-2.5 py-1 text-[7px] font-bold tracking-[0.08em] text-[#8a6c45]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#eadfce] pt-3.5">
                    <span className="text-[8px] font-bold tracking-[0.1em] text-[#8a6c45]">
                      <i className="fa-solid fa-hand-pointer mr-1.5 text-[#a70e18]" />
                      TAP TO PLAY
                    </span>

                    <span className="text-[10px] font-bold text-[#761019] transition group-hover:text-[#a70e18]">
                      PLAY NOW
                      <i className="fa-solid fa-chevron-right ml-1.5 text-[8px]" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mx-auto mt-5 max-w-2xl rounded-xl border border-[#e3d0b4] bg-white/70 px-4 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-[#d0a957]">
              <div className="h-px w-8 bg-[#d0a957]/40" />
              <i className="fa-solid fa-spa text-xs" />
              <i className="fa-solid fa-om text-sm" />
              <i className="fa-solid fa-spa text-xs" />
              <div className="h-px w-8 bg-[#d0a957]/40" />
            </div>
            <p className="mt-2 text-xs font-semibold text-[#761019]">
              Play, have fun and celebrate together.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-[#241b17] px-4 py-4 text-[#eadbc4]">
        <div className="mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center gap-2 text-[#e5c16b]">
            <i className="fa-solid fa-spa text-xs" />
            <div className="h-px w-8 bg-[#e5c16b]/30" />
            <i className="fa-solid fa-om" />
            <div className="h-px w-8 bg-[#e5c16b]/30" />
            <i className="fa-solid fa-spa text-xs" />
          </div>
          <p className="mt-2 text-sm font-bold tracking-[0.2em] text-[#e5c16b]">
            JAI MAA DURGA
          </p>
          <p className="mt-1 text-[8px] tracking-[0.2em] text-[#9c8b76]">
            A STRONGER COMMUNITY TOGETHER
          </p>
          <p className="mt-3 text-[8px] text-[#756658]">
            © 2026 BUH Durga Puja Committee. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
