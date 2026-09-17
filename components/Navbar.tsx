"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "About",
    href: "/#about",
  },
  {
    label: "Events",
    href: "/#events",
  },
  {
    label: "Gallery",
    href: "/#gallery",
  },
  {
    label: "Offer Seva",
    href: "/seva",
  },
  {
    label: "Cultural Program Registration",
    href: "/cultural-program",
  },
  {
    label: "Inventory Help",
    href: "/inventory-help",
  },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const pathname = usePathname();

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="relative z-50 mx-auto max-w-7xl px-5 py-1 lg:px-8">
      <div className="flex justify-between items-center">

        {/* =========================================
            LOGO
        ========================================== */}

        <Link
          href="/"
          className="flex items-center gap-3 w-[20%]"
          onClick={closeMenu}
        >
          <div className="flex items-center justify-left text-xl text-[#a70e18] transition duration-300 hover:scale-105">
            <img
            src="/images/buh-durga-puja-logo.webp"
            className="w-full md:w-[50%]"
            alt="BUH Durga Puja"
            />
          </div>
        </Link>

        {/* =========================================
            DESKTOP NAVIGATION
        ========================================== */}

        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">

          {navItems.map((item) => {
            const isActive =
              item.href.startsWith(`/${pathname}`);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative py-2 transition-colors duration-200 ${
                  isActive
                    ? "text-[#a70e18]"
                    : "text-[#3f332d] hover:text-[#a70e18]"
                }`}
              >
                {item.label}

                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 mx-auto h-[2px] rounded-full bg-[#a70e18]" />
                )}
              </Link>
            );
          })}

          {/* Financial Transparency */}

          {/* <Link
            href="/financials"
            className={`relative py-2 transition-colors duration-200 ${
              pathname === "/financials"
                ? "text-[#a70e18]"
                : "text-[#3f332d] hover:text-[#a70e18]"
            }`}
          >
            Financials

            {pathname === "/financials" && (
              <span className="absolute bottom-0 left-0 right-0 mx-auto h-[2px] rounded-full bg-[#a70e18]" />
            )}
          </Link> */}

          {/* Contribute */}

          <Link
            href="/contribute"
            className="rounded-full bg-[#a70e18] px-6 py-3 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#7f0b13] hover:shadow-xl"
          >
            <i className="fa-solid fa-heart mr-2" />
            Contribute
          </Link>

        </nav>

        {/* =========================================
            MOBILE MENU BUTTON
        ========================================== */}

        <button
          type="button"
          aria-label={
            mobileMenuOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={mobileMenuOpen}
          onClick={() =>
            setMobileMenuOpen(
              !mobileMenuOpen
            )
          }
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#b8892d] bg-white/70 text-[#8f1019] shadow-sm backdrop-blur-sm transition hover:bg-white md:hidden"
        >
          <i
            className={
              mobileMenuOpen
                ? "fa-solid fa-xmark"
                : "fa-solid fa-bars"
            }
          />
        </button>
      </div>

      {/* =========================================
          MOBILE NAVIGATION
      ========================================== */}

      {mobileMenuOpen && (
        <div className="mt-4 overflow-hidden rounded-3xl border border-[#e3d1b7] bg-white/95 p-4 shadow-xl backdrop-blur-md md:hidden">

          <nav className="flex flex-col gap-1">

            {navItems.map((item) => {

              const isActive =
                item.href === `/${pathname}`;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#fff3e3] text-[#a70e18]"
                      : "text-[#5d3f34] hover:bg-[#faf3e8]"
                  }`}
                >

                  <i
                    className={`mr-3 ${
                      item.label === "About"
                        ? "fa-solid fa-circle-info"
                        : item.label === "Events"
                        ? "fa-solid fa-calendar-days"
                        : item.label === "Gallery"
                        ? "fa-solid fa-images"
                        : item.label === "Offer Seva"
                        ? "fa-solid fa-hands-holding-heart"
                        : item.label ===
                          "Cultural Program Registration"
                        ? "fa-solid fa-masks-theater"
                        : "fa-solid fa-boxes-stacked"
                    } text-[#a70e18]`}
                  />

                  {item.label}

                </Link>
              );
            })}

            {/* Financials */}

            <Link
              href="/financials"
              onClick={closeMenu}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                pathname === "/financials"
                  ? "bg-[#fff3e3] text-[#a70e18]"
                  : "text-[#5d3f34] hover:bg-[#faf3e8]"
              }`}
            >
              <i className="fa-solid fa-chart-pie mr-3 text-[#a70e18]" />
              Financials
            </Link>

            {/* Contribute */}

            <Link
              href="/contribute"
              onClick={closeMenu}
              className="mt-2 rounded-full bg-[#a70e18] px-5 py-3.5 text-center text-sm font-bold text-white shadow-lg transition hover:bg-[#7f0b13]"
            >
              <i className="fa-solid fa-heart mr-2" />
              CONTRIBUTE
            </Link>

          </nav>
        </div>
      )}
    </header>
  );
}
