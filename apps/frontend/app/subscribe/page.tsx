"use client";

import { useEffect, useState, FormEvent } from "react";
import type { Plan } from "@/lib/types";

type Props = {
  searchParams?: {
    ref?: string;
  };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function SubscribePage(props: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [referralCode, setReferralCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch(`${apiBaseUrl}/api/subscriptions/plans`);
      if (!response.ok) {
        setMessage("Unable to load plans");
        return;
      }
      const payload = await response.json();
      setPlans(payload.data);
      if (!selectedPlanId && payload.data.length > 0) {
        setSelectedPlanId(payload.data[0].id);
      }
    }
    load().catch(() => setMessage("Unable to load plans"));
  }, [selectedPlanId]);

  useEffect(() => {
    const refFromUrl = props.searchParams?.ref;
    if (refFromUrl) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("referralCode", refFromUrl);
      }
      setReferralCode((current) => (current || refFromUrl ? refFromUrl : current));
      return;
    }
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("referralCode");
      if (stored) {
        setReferralCode((current) => current || stored);
      }
    }
  }, [props.searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    if (!token) {
      setMessage("Please sign in before subscribing.");
      return;
    }
    if (!selectedPlanId) {
      setMessage("Select a plan first.");
      return;
    }
    setMessage("Activating subscription...");
    const response = await fetch(`${apiBaseUrl}/api/subscriptions/activate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        planId: selectedPlanId,
        referralCode: referralCode || undefined
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.message ?? "Unable to activate subscription");
      return;
    }
    setMessage("Subscription activated successfully.");
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Choose Your Plan</h1>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-3">
          {plans.map((plan) => (
            <label
              className={`cursor-pointer rounded-md border p-4 ${
                selectedPlanId === plan.id ? "border-red-500" : "border-gray-700"
              }`}
              key={plan.id}
            >
              <input
                checked={selectedPlanId === plan.id}
                className="mr-2"
                name="plan"
                onChange={() => setSelectedPlanId(plan.id)}
                type="radio"
                value={plan.id}
              />
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="text-xs text-gray-300">₹{plan.priceInr}/month</p>
              <p className="text-xs text-gray-400">{plan.videoQuality}</p>
              <p className="text-xs text-gray-400">{plan.maxScreens} screens</p>
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-gray-300">
            Referral code (optional)
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-900 p-3 text-sm outline-none focus:border-red-500"
              onChange={(event) => setReferralCode(event.target.value)}
              placeholder="friend-name-abc123"
              value={referralCode}
            />
          </label>
        </div>
        <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500" type="submit">
          Activate Subscription
        </button>
      </form>
      <p className="text-sm text-gray-300">{message}</p>
    </main>
  );
}
