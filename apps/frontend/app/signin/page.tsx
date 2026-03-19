"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CinematicBg } from "@/components/cinematic-bg";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("info");
  const [otpMode, setOtpMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("Signing in...");
    setMessageType("info");
    const url = otpMode ? `${apiBaseUrl}/api/auth/verify-otp` : `${apiBaseUrl}/api/auth/login`;
    const body = otpMode ? { email, code: password } : { email, password };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.message ?? "Unable to sign in. Please try again.");
        setMessageType("error");
        return;
      }
      localStorage.setItem("accessToken", payload.data.accessToken);
      localStorage.setItem("refreshToken", payload.data.refreshToken);
      setMessage("Signed in successfully! Redirecting...");
      setMessageType("success");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp() {
    const trimmed = email.trim();
    if (!trimmed) {
      setMessage("Enter your email address first.");
      setMessageType("error");
      return;
    }
    setLoading(true);
    setMessage("Sending OTP...");
    setMessageType("info");
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.message ?? "Unable to send OTP.");
        setMessageType("error");
        return;
      }
      setOtpMode(true);
      setMessage("OTP sent to your email. Check your inbox.");
      setMessageType("success");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "facebook") {
    setLoading(true);
    setMessage(`Signing in with ${provider === "google" ? "Google" : "Facebook"}...`);
    setMessageType("info");
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/oauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          providerId: `demo-${provider}-id`,
          email,
          fullName: email || `${provider} User`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.message ?? `${provider} sign-in failed.`);
        setMessageType("error");
        return;
      }
      localStorage.setItem("accessToken", payload.data.accessToken);
      localStorage.setItem("refreshToken", payload.data.refreshToken);
      setMessage("Signed in successfully!");
      setMessageType("success");
    } finally {
      setLoading(false);
    }
  }

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
            <p className="mt-1 text-sm text-gray-400">Stream everything. Anywhere. Anytime.</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-black/70 p-8 shadow-2xl shadow-black/80 backdrop-blur-xl">

            <h1 className="mb-1 text-2xl font-bold text-white">Welcome back</h1>
            <p className="mb-6 text-sm text-gray-400">Sign in to continue watching</p>

            {/* OTP / Password toggle */}
            <div className="mb-6 flex gap-2 rounded-lg bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setOtpMode(false)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                  !otpMode
                    ? "bg-red-600 text-white shadow-md shadow-red-900/50"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setOtpMode(true)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                  otpMode
                    ? "bg-red-600 text-white shadow-md shadow-red-900/50"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Email OTP
              </button>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
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
                <label className="mb-1.5 block text-xs font-medium text-gray-300">
                  {otpMode ? "One-time code" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={otpMode ? "text" : showPassword ? "text" : "password"}
                    placeholder={otpMode ? "6-digit code" : "••••••••"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-red-500 focus:bg-white/8 focus:ring-1 focus:ring-red-500/50"
                  />
                  {!otpMode && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  )}
                </div>
              </div>

              {otpMode && (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
                >
                  Send OTP to my email
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500 disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-gray-500">or continue with</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* OAuth */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleOAuth("google")}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleOAuth("facebook")}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>

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
              New to Unified OTT?{" "}
              <Link href="/signup" className="font-medium text-red-400 hover:text-red-300 underline underline-offset-2">
                Create a free account
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-600">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>
    </>
  );
}
