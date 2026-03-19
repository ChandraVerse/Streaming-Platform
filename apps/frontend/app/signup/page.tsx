"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CinematicBg } from "@/components/cinematic-bg";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Props = {
  searchParams?: { ref?: string };
};

export default function SignUpPage(props: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("info");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = props.searchParams?.ref;
    if (ref && typeof window !== "undefined") {
      window.localStorage.setItem("referralCode", ref);
    }
  }, [props.searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setMessageType("error");
      return;
    }
    setLoading(true);
    setMessage("Creating your account...");
    setMessageType("info");
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.message ?? "Unable to create account. Please try again.");
        setMessageType("error");
        return;
      }
      setMessage("Account created successfully! You can now sign in.");
      setMessageType("success");
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength =
    password.length === 0
      ? null
      : password.length < 6
      ? { label: "Weak", color: "bg-red-500", width: "w-1/4" }
      : password.length < 10
      ? { label: "Fair", color: "bg-yellow-500", width: "w-2/4" }
      : /[A-Z]/.test(password) && /[0-9]/.test(password)
      ? { label: "Strong", color: "bg-green-500", width: "w-full" }
      : { label: "Good", color: "bg-blue-500", width: "w-3/4" };

  return (
    <>
      <CinematicBg />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block text-3xl font-black tracking-tight text-red-500 drop-shadow-[0_0_12px_rgba(229,9,20,0.7)]">
              Unified OTT
            </Link>
            <p className="mt-1 text-sm text-gray-400">Your entertainment starts here.</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-black/70 p-8 shadow-2xl shadow-black/80 backdrop-blur-xl">

            <h1 className="mb-1 text-2xl font-bold text-white">Create your account</h1>
            <p className="mb-6 text-sm text-gray-400">Join millions of viewers. Cancel anytime.</p>

            {/* Benefits */}
            <div className="mb-6 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: "🎬", label: "10k+ titles" },
                { icon: "📺", label: "4K & HD" },
                { icon: "📱", label: "All devices" },
              ].map((b) => (
                <div key={b.label} className="rounded-lg bg-white/5 py-2 text-xs text-gray-300">
                  <div className="text-base">{b.icon}</div>
                  <div className="mt-0.5 font-medium">{b.label}</div>
                </div>
              ))}
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Full name</label>
                <input
                  type="text"
                  placeholder="Chandra Sekhar"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-red-500 focus:bg-white/8 focus:ring-1 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-red-500 focus:bg-white/8 focus:ring-1 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-red-500 focus:bg-white/8 focus:ring-1 focus:ring-red-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {/* Password strength */}
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="h-1 w-full rounded-full bg-white/10">
                      <div className={`h-1 rounded-full transition-all ${passwordStrength.color} ${passwordStrength.width}`} />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">Strength: <span className="font-medium text-white">{passwordStrength.label}</span></p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-300">Confirm password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-lg border bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:ring-1 ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/50"
                      : confirmPassword && confirmPassword === password
                      ? "border-green-500/60 focus:border-green-500 focus:ring-green-500/50"
                      : "border-white/10 focus:border-red-500 focus:ring-red-500/50"
                  }`}
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500 disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Account — It's Free"}
              </button>
            </form>

            {/* Status message */}
            {message && (
              <div className={`mt-5 rounded-lg px-4 py-3 text-sm ${
                messageType === "error"
                  ? "bg-red-900/30 border border-red-500/30 text-red-300"
                  : messageType === "success"
                  ? "bg-green-900/30 border border-green-500/30 text-green-300"
                  : "bg-white/5 border border-white/10 text-gray-300"
              }`}>
                {message}
              </div>
            )}

            {/* Footer link */}
            <p className="mt-6 text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/signin" className="font-medium text-red-400 hover:text-red-300 underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-600">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>
    </>
  );
}
