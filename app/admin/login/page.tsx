"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
      />

      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_10%,#fffaf2_0%,#f8eddd_48%,#efdfca_100%)] px-4 py-8">
        <div className="w-full max-w-[430px]">
          <div className="overflow-hidden rounded-[24px] border border-[#ead9c7] bg-white shadow-[0_22px_60px_rgba(68,44,20,0.13)]">
            <div className="bg-gradient-to-br from-[#a70812] to-[#c70d18] px-7 py-8 text-center text-white">
              <div className="relative z-10 mx-auto -mt-[20px] flex h-28 w-28 items-center justify-center">
                <img
                    src="/images/durga-puja-collection.webp"
                    alt="Maa Durga"
                    className="h-28 w-28 object-contain"
                />
                </div>

              <h1 className="mt-2 font-open-sans text-3xl font-bold">
                BUH Durga Puja Committee Admin
              </h1>

              <p className="mt-2 text-sm text-white/80">
                Sign in to manage contributions
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5 px-6 py-7 sm:px-8"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#333]">
                  Email
                </label>

                <div className="flex h-12 items-center rounded-xl border border-[#dedede] px-3 focus-within:border-[#a70e18]">
                  <i className="fa-solid fa-envelope mr-3 text-[#a70e18]" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="Admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#333]">
                  Password
                </label>

                <div className="flex h-12 items-center rounded-xl border border-[#dedede] px-3 focus-within:border-[#a70e18]">
                  <i className="fa-solid fa-lock mr-3 text-[#a70e18]" />

                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="border-0 bg-transparent px-1 text-[#777]"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    <i
                      className={`fa-solid ${
                        showPassword
                          ? "fa-eye-slash"
                          : "fa-eye"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-[#f1cccc] bg-[#fff1f1] px-3 py-2.5 text-xs text-[#a20d16]">
                  <i className="fa-solid fa-circle-exclamation" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#a70812] to-[#c70d18] text-sm font-bold text-white shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span>Signing in...</span>
                    <i className="fa-solid fa-spinner fa-spin" />
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <i className="fa-solid fa-arrow-right" />
                  </>
                )}
              </button>

              <a
                href="/contribute"
                className="flex items-center justify-center gap-2 text-xs font-semibold text-[#777] no-underline hover:text-[#a70e18]"
              >
                <i className="fa-solid fa-arrow-left" />
                Back to Contribution Page
              </a>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
