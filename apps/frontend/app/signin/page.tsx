"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [otpMode, setOtpMode] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Signing in...");
    const url = otpMode ? `${apiBaseUrl}/api/auth/verify-otp` : `${apiBaseUrl}/api/auth/login`;
    const body = otpMode ? { email, code: password } : { email, password };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.message ?? "Unable to sign in");
      return;
    }
    localStorage.setItem("accessToken", payload.data.accessToken);
    localStorage.setItem("refreshToken", payload.data.refreshToken);
    setMessage("Signed in. Open Dashboard.");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-6">
      <h1 className="text-3xl font-bold">Sign In</h1>
      <div className="flex gap-2 text-xs">
        <button
          className={`rounded-md px-2 py-1 ${otpMode ? "bg-gray-800 text-gray-200" : "bg-red-600 text-white"}`}
          type="button"
          onClick={() => setOtpMode(false)}
        >
          Password
        </button>
        <button
          className={`rounded-md px-2 py-1 ${otpMode ? "bg-red-600 text-white" : "bg-gray-800 text-gray-200"}`}
          type="button"
          onClick={() => setOtpMode(true)}
        >
          Email OTP
        </button>
      </div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-md border border-gray-700 bg-gray-900 p-3 outline-none focus:border-red-500"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
          type="email"
          value={email}
        />
        <input
          className="w-full rounded-md border border-gray-700 bg-gray-900 p-3 outline-none focus:border-red-500"
          onChange={(event) => setPassword(event.target.value)}
          placeholder={otpMode ? "One-time code" : "Password"}
          required
          type={otpMode ? "text" : "password"}
          value={password}
        />
        <button className="w-full rounded-md bg-red-600 p-3 font-medium hover:bg-red-500" type="submit">
          Continue
        </button>
      </form>
      <button
        className="text-xs text-gray-300 underline"
        type="button"
        onClick={async () => {
          const trimmed = email.trim();
          if (!trimmed) {
            setMessage("Enter email first to request OTP");
            return;
          }
          setMessage("Requesting OTP...");
          const response = await fetch(`${apiBaseUrl}/api/auth/request-otp`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: trimmed })
          });
          const payload = await response.json();
          if (!response.ok) {
            setMessage(payload.message ?? "Unable to request OTP");
            return;
          }
          setOtpMode(true);
          setMessage("OTP sent (development: check API response for code).");
        }}
      >
        Send login OTP to email
      </button>
      <div className="space-y-2">
        <button
          className="w-full rounded-md border border-gray-700 bg-gray-900 p-3 text-sm font-medium hover:border-gray-500"
          type="button"
          onClick={async () => {
            const response = await fetch(`${apiBaseUrl}/api/auth/oauth`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                provider: "google",
                providerId: "demo-google-id",
                email,
                fullName: email || "Google User"
              })
            });
            const payload = await response.json();
            if (!response.ok) {
              setMessage(payload.message ?? "Google sign-in failed");
              return;
            }
            localStorage.setItem("accessToken", payload.data.accessToken);
            localStorage.setItem("refreshToken", payload.data.refreshToken);
            setMessage("Signed in with Google. Open Dashboard.");
          }}
        >
          Continue with Google (demo)
        </button>
        <button
          className="w-full rounded-md border border-gray-700 bg-gray-900 p-3 text-sm font-medium hover:border-gray-500"
          type="button"
          onClick={async () => {
            const response = await fetch(`${apiBaseUrl}/api/auth/oauth`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                provider: "facebook",
                providerId: "demo-facebook-id",
                email,
                fullName: email || "Facebook User"
              })
            });
            const payload = await response.json();
            if (!response.ok) {
              setMessage(payload.message ?? "Facebook sign-in failed");
              return;
            }
            localStorage.setItem("accessToken", payload.data.accessToken);
            localStorage.setItem("refreshToken", payload.data.refreshToken);
            setMessage("Signed in with Facebook. Open Dashboard.");
          }}
        >
          Continue with Facebook (demo)
        </button>
      </div>
      <p className="text-sm text-gray-300">{message}</p>
      <Link className="text-sm text-red-300 hover:text-red-200" href="/signup">
        New user? Create an account
      </Link>
    </main>
  );
}
