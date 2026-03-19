"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Rental } from "@/lib/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [contentId, setContentId] = useState("");
  const [windowHours, setWindowHours] = useState("48");

  async function load() {
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setStatus("Please sign in first.");
      return;
    }
    const rentalsRes = await fetch(`${apiBaseUrl}/api/rentals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!rentalsRes.ok) {
      setStatus("Unable to load rentals.");
      return;
    }
    const payload = await rentalsRes.json();
    setRentals(payload.data as Rental[]);
    setStatus("Ready");
  }

  useEffect(() => {
    load().catch(() => setStatus("Unable to load rentals."));
  }, []);

  async function purchaseRental(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setStatus("Please sign in first.");
      return;
    }
    const response = await fetch(`${apiBaseUrl}/api/rentals/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        contentId,
        windowHours: Number(windowHours) || 48
      })
    });
    if (!response.ok) {
      setStatus("Unable to purchase rental.");
      return;
    }
    await load();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Rentals</h1>
      <p className="text-sm text-gray-300">{status}</p>
      <form className="rounded-xl border border-gray-800 p-5" onSubmit={purchaseRental}>
        <h2 className="text-lg font-semibold">Rent a title</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Content ID
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={contentId}
              onChange={(event) => setContentId(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Window hours
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={windowHours}
              onChange={(event) => setWindowHours(event.target.value)}
            />
          </label>
        </div>
        <button className="mt-3 rounded-md bg-red-600 px-3 py-1 text-sm font-medium hover:bg-red-500" type="submit">
          Purchase rental
        </button>
      </form>
      <section className="rounded-xl border border-gray-800 p-5">
        <h2 className="text-lg font-semibold">Your rentals</h2>
        {rentals.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No active rentals.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {rentals.map((rental) => (
              <li className="rounded-md border border-gray-800 bg-gray-900 p-3" key={rental.id}>
                <p className="font-medium">{rental.contentId}</p>
                <p className="text-xs text-gray-400">Ends {new Date(rental.endsAt).toLocaleString()}</p>
                <p className="text-xs text-gray-400">{rental.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
