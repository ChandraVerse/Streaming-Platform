"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Creating account...");
    const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fullName, email, password })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.message ?? "Unable to create account");
      return;
    }
    setMessage("Account created. Please sign in.");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-6">
      <h1 className="text-3xl font-bold">Create Account</h1>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-md border border-gray-700 bg-gray-900 p-3 outline-none focus:border-red-500"
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Full name"
          required
          value={fullName}
        />
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
          placeholder="Password"
          required
          type="password"
          value={password}
        />
        <button className="w-full rounded-md bg-red-600 p-3 font-medium hover:bg-red-500" type="submit">
          Create account
        </button>
      </form>
      <p className="text-sm text-gray-300">{message}</p>
      <Link className="text-sm text-red-300 hover:text-red-200" href="/signin">
        Already have an account? Sign in
      </Link>
    </main>
  );
}
