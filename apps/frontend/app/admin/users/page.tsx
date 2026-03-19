"use client";

import { FormEvent, useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function AdminUsersPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Ready");
  const [results, setResults] = useState<{ userId: string; fullName: string; email: string }[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("adminSecret");
      if (stored) {
        setAdminSecret(stored);
      }
    } catch {
    }
  }, []);

  function persistSecret(value: string) {
    setAdminSecret(value);
    try {
      window.localStorage.setItem("adminSecret", value);
    } catch {
    }
  }

  async function searchUsers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminSecret) {
      setStatus("Admin secret required.");
      return;
    }
    setStatus("Searching...");
    const response = await fetch(`${apiBaseUrl}/api/users/search?query=${encodeURIComponent(query)}`, {
      headers: {
        "x-admin-secret": adminSecret
      }
    });
    if (!response.ok) {
      setStatus("Search failed.");
      return;
    }
    const payload = await response.json();
    setResults(payload.data as { userId: string; fullName: string; email: string }[]);
    setStatus(`Found ${payload.data.length} users`);
  }

  async function resetAccess(userId: string) {
    if (!adminSecret) {
      setStatus("Admin secret required.");
      return;
    }
    const response = await fetch(`${apiBaseUrl}/api/users/reset-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": adminSecret
      },
      body: JSON.stringify({ userId })
    });
    if (!response.ok) {
      setStatus("Reset failed.");
      return;
    }
    setStatus("Access reset.");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Admin User Management</h1>
      <p className="text-sm text-gray-300">{status}</p>
      <form className="rounded-xl border border-gray-800 p-5" onSubmit={searchUsers}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Admin secret
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={adminSecret}
              onChange={(event) => persistSecret(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Search query
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <button className="mt-3 rounded-md bg-red-600 px-3 py-1 text-sm font-medium hover:bg-red-500" type="submit">
          Search
        </button>
      </form>
      <section className="rounded-xl border border-gray-800 p-5">
        <h2 className="text-lg font-semibold">Results</h2>
        {results.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No results.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {results.map((user) => (
              <li className="flex items-center justify-between rounded-md border border-gray-800 bg-gray-900 p-3" key={user.userId}>
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <button
                  className="rounded-md border border-gray-700 px-3 py-1 text-xs font-medium hover:border-gray-500"
                  type="button"
                  onClick={() => resetAccess(user.userId)}
                >
                  Reset access
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
