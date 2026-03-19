"use client";

import { useEffect, useState, FormEvent } from "react";
import { CinematicBg } from "@/components/cinematic-bg";
import Link from "next/link";
import type { Plan } from "@/lib/types";

type Props = {
  searchParams?: { ref?: string };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

const PLAN_META: Record<string, { color: string; glow: string; badge?: string; icon: string }> = {
  default: { color: "from-gray-800 to-gray-900", glow: "shadow-gray-900/60", icon: "📺" },
  mobile:  { color: "from-slate-800 to-slate-900", glow: "shadow-slate-900/60", icon: "📱" },
  basic:   { color: "from-blue-900/60 to-gray-900", glow: "shadow-blue-900/40", icon: "📺" },
  standard: { color: "from-purple-900/60 to-gray-900", glow: "shadow-purple-900/40", badge: "Popular", icon: "🖥️" },
  premium: { color: "from-red-900/60 to-gray-900", glow: "shadow-red-900/40", badge: "Best Value", icon: "👑" },
};

function getPlanMeta(name: string) {
  const key = name?.toLowerCase();
  return PLAN_META[key] ?? PLAN_META.default;
}

export default function SubscribePage(props: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [referralCode, setReferralCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("info");
  const [userId, setUserId] = useState<string | null>(null);
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    async function load() {
      const plansRes = await fetch(`${apiBaseUrl}/api/subscriptions/plans`);
      if (!plansRes.ok) { setMessage("Unable to load plans."); setMessageType("error"); return; }
      const plansPayload = await plansRes.json();
      setPlans(plansPayload.data);
      if (plansPayload.data.length > 0) setSelectedPlanId(plansPayload.data[0].id);

      const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
      if (token) {
        const meRes = await fetch(`${apiBaseUrl}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const mePayload = await meRes.json();
          setUserId(mePayload.data.userId);
        }
      }
    }
    load().catch(() => { setMessage("Unable to load plans."); setMessageType("error"); });
  }, []);

  useEffect(() => {
    const refFromUrl = props.searchParams?.ref;
    if (refFromUrl) {
      if (typeof window !== "undefined") window.localStorage.setItem("referralCode", refFromUrl);
      setReferralCode(refFromUrl);
      return;
    }
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("referralCode");
      if (stored) setReferralCode(stored);
    }
  }, [props.searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    if (!token) { setMessage("Please sign in before subscribing."); setMessageType("error"); return; }
    if (!selectedPlanId) { setMessage("Select a plan to continue."); setMessageType("error"); return; }
    setIsActivating(true);
    setMessage("Activating your subscription...");
    setMessageType("info");
    try {
      const res = await fetch(`${apiBaseUrl}/api/subscriptions/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: selectedPlanId, referralCode: referralCode || undefined }),
      });
      const payload = await res.json();
      if (!res.ok) { setMessage(payload.message ?? "Unable to activate subscription."); setMessageType("error"); return; }
      setMessage("🎉 Subscription activated! Welcome to Unified OTT.");
      setMessageType("success");
    } finally {
      setIsActivating(false);
    }
  }

  async function handleStripeCheckout() {
    if (!stripePublishableKey) { setMessage("Stripe is not configured."); setMessageType("error"); return; }
    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    if (!token || !userId) { setMessage("Please sign in to proceed with payment."); setMessageType("error"); return; }
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) { setMessage("Select a plan to continue."); setMessageType("error"); return; }
    setIsProcessingStripe(true);
    setMessage("Redirecting to Stripe checkout...");
    setMessageType("info");
    try {
      const stripeModule = await import("@stripe/stripe-js");
      const stripe = await stripeModule.loadStripe(stripePublishableKey);
      if (!stripe) { setMessage("Unable to load Stripe."); return; }
      const res = await fetch(`${apiBaseUrl}/api/payments/stripe/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId: plan.id, priceInr: plan.priceInr }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.data?.id) { setMessage(payload.message ?? "Unable to start Stripe checkout."); return; }
      const result = await stripe.redirectToCheckout({ sessionId: payload.data.id as string });
      if (result.error) setMessage(result.error.message ?? "Stripe redirect failed.");
    } catch { setMessage("Stripe checkout failed."); setMessageType("error"); }
    finally { setIsProcessingStripe(false); }
  }

  async function handleRazorpayOrder() {
    if (!razorpayKeyId) { setMessage("Razorpay is not configured."); setMessageType("error"); return; }
    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    if (!token || !userId) { setMessage("Please sign in to proceed with payment."); setMessageType("error"); return; }
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) { setMessage("Select a plan to continue."); setMessageType("error"); return; }
    setIsProcessingRazorpay(true);
    setMessage("Creating Razorpay order...");
    setMessageType("info");
    try {
      const res = await fetch(`${apiBaseUrl}/api/payments/razorpay/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId: plan.id, priceInr: plan.priceInr }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.data?.id) { setMessage(payload.message ?? "Unable to create Razorpay order."); return; }
      const scriptId = "razorpay-checkout-js";
      if (!document.getElementById(scriptId)) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.id = scriptId; s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve(); s.onerror = () => reject(new Error("Unable to load Razorpay SDK"));
          document.body.appendChild(s);
        });
      }
      const RazorpayConstructor = (window as unknown as { Razorpay?: new (o: unknown) => { open: () => void } }).Razorpay;
      if (!RazorpayConstructor) { setMessage("Razorpay SDK is unavailable."); return; }
      new RazorpayConstructor({
        key: razorpayKeyId, amount: payload.data.amount, currency: payload.data.currency,
        name: "Unified OTT Subscription", description: `Plan ${plan.name}`,
        order_id: payload.data.id, notes: { planId: plan.id, userId },
      }).open();
    } catch { setMessage("Razorpay checkout failed."); setMessageType("error"); }
    finally { setIsProcessingRazorpay(false); }
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <>
      <CinematicBg />

      <main className="relative z-10 min-h-screen px-4 py-12">
        <div className="mx-auto max-w-4xl">

          {/* Header */}
          <div className="mb-10 text-center">
            <Link href="/" className="inline-block text-3xl font-black tracking-tight text-red-500 drop-shadow-[0_0_12px_rgba(229,9,20,0.7)]">
              Unified OTT
            </Link>
            <h1 className="mt-4 text-3xl font-black text-white">Choose your plan</h1>
            <p className="mt-2 text-gray-400">Upgrade or downgrade at any time. No hidden fees.</p>
          </div>

          {/* Plan cards */}
          {plans.length > 0 ? (
            <div className={`grid gap-4 ${plans.length <= 2 ? "md:grid-cols-2 max-w-2xl mx-auto" : plans.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
              {plans.map((plan) => {
                const meta = getPlanMeta(plan.name);
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-2xl border p-5 text-left transition-all ${
                      isSelected
                        ? "border-red-500 bg-gradient-to-b " + meta.color + " shadow-xl " + meta.glow + " scale-[1.02]"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                    }`}
                  >
                    {meta.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-3 py-0.5 text-xs font-bold text-white shadow-md shadow-red-900/50">
                        {meta.badge}
                      </span>
                    )}
                    <div className="mb-3 text-2xl">{meta.icon}</div>
                    <div className="mb-1 text-base font-bold text-white">{plan.name}</div>
                    <div className="mb-3 text-2xl font-black text-white">
                      ₹{plan.priceInr}
                      <span className="text-sm font-normal text-gray-400">/mo</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-green-400">✓</span>
                        <span>{plan.videoQuality} video quality</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-green-400">✓</span>
                        <span>{plan.maxScreens} screen{plan.maxScreens > 1 ? "s" : ""} at once</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-green-400">✓</span>
                        <span>Cancel anytime</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-400">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <p className="text-sm text-gray-400">Loading plans...</p>
            </div>
          )}

          {/* Checkout form */}
          <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-white/10 bg-black/70 p-6 backdrop-blur-xl shadow-2xl shadow-black/60">
            <h2 className="mb-4 text-lg font-bold text-white">
              {selectedPlan ? `Subscribe to ${selectedPlan.name} — ₹${selectedPlan.priceInr}/mo` : "Complete your subscription"}
            </h2>

            {/* Referral code */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-gray-300">
                Referral code <span className="text-gray-500">(optional)</span>
              </label>
              <input
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500/50 md:max-w-xs"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isActivating || !selectedPlanId}
                className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500 disabled:opacity-60"
              >
                {isActivating ? "Activating..." : "Activate Subscription"}
              </button>
              <button
                type="button"
                disabled={isProcessingStripe || !selectedPlanId}
                onClick={handleStripeCheckout}
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                </svg>
                {isProcessingStripe ? "Processing..." : "Pay with Stripe"}
              </button>
              <button
                type="button"
                disabled={isProcessingRazorpay || !selectedPlanId}
                onClick={handleRazorpayOrder}
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                <span className="text-base font-bold text-blue-400">₹</span>
                {isProcessingRazorpay ? "Processing..." : "Pay with Razorpay"}
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
          </form>

          {/* Footer trust badges */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <span>🔒 Secure payments</span>
            <span>↩ Cancel anytime</span>
            <span>📧 No spam, ever</span>
            <span>🇮🇳 INR pricing</span>
          </div>

        </div>
      </main>
    </>
  );
}
