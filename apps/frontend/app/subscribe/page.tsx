"use client";

import { useEffect, useState, FormEvent } from "react";
import type { Plan } from "@/lib/types";

type Props = {
  searchParams?: {
    ref?: string;
  };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

export default function SubscribePage(props: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [referralCode, setReferralCode] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);

  useEffect(() => {
    async function load() {
      const plansResponse = await fetch(`${apiBaseUrl}/api/subscriptions/plans`);
      if (!plansResponse.ok) {
        setMessage("Unable to load plans");
        return;
      }
      const plansPayload = await plansResponse.json();
      setPlans(plansPayload.data);
      if (!selectedPlanId && plansPayload.data.length > 0) {
        setSelectedPlanId(plansPayload.data[0].id);
      }

      const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
      if (token) {
        const meResponse = await fetch(`${apiBaseUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (meResponse.ok) {
          const mePayload = await meResponse.json();
          setUserId(mePayload.data.userId);
        }
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

  async function handleStripeCheckout() {
    if (!stripePublishableKey) {
      setMessage("Stripe is not configured.");
      return;
    }
    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    if (!token || !userId) {
      setMessage("Please sign in before starting payment.");
      return;
    }
    const plan = plans.find((entry) => entry.id === selectedPlanId);
    if (!plan) {
      setMessage("Select a plan first.");
      return;
    }
    setIsProcessingStripe(true);
    setMessage("Starting Stripe checkout...");
    try {
      const stripeModule = await import("@stripe/stripe-js");
      const stripe = await stripeModule.loadStripe(stripePublishableKey);
      if (!stripe) {
        setMessage("Unable to load Stripe.");
        setIsProcessingStripe(false);
        return;
      }
      const response = await fetch(`${apiBaseUrl}/api/payments/stripe/checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          planId: plan.id,
          priceInr: plan.priceInr
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.data?.id) {
        setMessage(payload.message ?? "Unable to start Stripe checkout");
        setIsProcessingStripe(false);
        return;
      }
      const result = await stripe.redirectToCheckout({ sessionId: payload.data.id as string });
      if (result.error) {
        setMessage(result.error.message ?? "Stripe redirect failed.");
      }
    } catch {
      setMessage("Stripe checkout failed.");
    } finally {
      setIsProcessingStripe(false);
    }
  }

  async function handleRazorpayOrder() {
    if (!razorpayKeyId) {
      setMessage("Razorpay is not configured.");
      return;
    }
    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    if (!token || !userId) {
      setMessage("Please sign in before starting payment.");
      return;
    }
    const plan = plans.find((entry) => entry.id === selectedPlanId);
    if (!plan) {
      setMessage("Select a plan first.");
      return;
    }
    setIsProcessingRazorpay(true);
    setMessage("Creating Razorpay order...");
    try {
      const response = await fetch(`${apiBaseUrl}/api/payments/razorpay/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          planId: plan.id,
          priceInr: plan.priceInr
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.data?.id) {
        setMessage(payload.message ?? "Unable to create Razorpay order");
        setIsProcessingRazorpay(false);
        return;
      }
      const scriptId = "razorpay-checkout-js";
      if (!document.getElementById(scriptId)) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.id = scriptId;
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Unable to load Razorpay SDK"));
          document.body.appendChild(script);
        });
      }
      const RazorpayConstructor = (window as unknown as { Razorpay?: new (options: unknown) => { open: () => void } })
        .Razorpay;
      if (!RazorpayConstructor) {
        setMessage("Razorpay SDK is unavailable.");
        setIsProcessingRazorpay(false);
        return;
      }
      const options = {
        key: razorpayKeyId,
        amount: payload.data.amount,
        currency: payload.data.currency,
        name: "Unified OTT Subscription",
        description: `Plan ${plan.name}`,
        order_id: payload.data.id,
        notes: {
          planId: plan.id,
          userId
        }
      };
      const razorpayInstance = new RazorpayConstructor(options);
      razorpayInstance.open();
    } catch {
      setMessage("Razorpay checkout failed.");
    } finally {
      setIsProcessingRazorpay(false);
    }
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
        <div className="space-x-2">
          <button
            className="mt-2 rounded-md border border-gray-700 px-4 py-2 text-xs font-medium hover:border-gray-500"
            type="button"
            onClick={handleStripeCheckout}
            disabled={isProcessingStripe}
          >
            {isProcessingStripe ? "Processing Stripe..." : "Pay with Stripe"}
          </button>
          <button
            className="mt-2 rounded-md border border-gray-700 px-4 py-2 text-xs font-medium hover:border-gray-500"
            type="button"
            onClick={handleRazorpayOrder}
            disabled={isProcessingRazorpay}
          >
            {isProcessingRazorpay ? "Processing Razorpay..." : "Pay with Razorpay"}
          </button>
        </div>
      </form>
      <p className="text-sm text-gray-300">{message}</p>
    </main>
  );
}
