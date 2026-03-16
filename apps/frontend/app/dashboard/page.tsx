"use client";

import { useEffect, useState } from "react";
import type { Plan, UserSession } from "@/lib/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function DashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [following, setFollowing] = useState<{ userId: string; fullName: string; email: string }[]>([]);

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setStatus("Please sign in first.");
        return;
      }
      const [meRes, planRes, followingRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(`${apiBaseUrl}/api/subscriptions/plans`),
        fetch(`${apiBaseUrl}/api/social/following`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);
      if (!meRes.ok) {
        setStatus("Session invalid. Please sign in again.");
        return;
      }
      const mePayload = await meRes.json();
      const plansPayload = await planRes.json();
      const followingPayload = followingRes.ok ? await followingRes.json() : { data: [] };
      setSession(mePayload.data);
      setPlans(plansPayload.data);
      setFollowing(followingPayload.data);
      setStatus("Ready");
    }
    loadData().catch(() => setStatus("Unable to load dashboard"));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-sm text-gray-300">{status}</p>
      {session ? (
        <section className="rounded-xl border border-gray-800 p-5">
          <h2 className="text-xl font-semibold">{session.fullName}</h2>
          <p className="mt-1 text-gray-300">{session.email}</p>
          <h3 className="mt-4 font-medium">Profiles</h3>
          <ul className="mt-2 grid gap-2 md:grid-cols-3">
            {session.profiles.map((profile) => (
              <li className="rounded-md bg-gray-900 p-3" key={profile.id}>
                <p className="font-medium">{profile.name}</p>
                <p className="text-xs text-gray-400">{profile.isKids ? "Kids profile" : "Standard profile"}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {session ? (
        <section className="rounded-xl border border-gray-800 p-5">
          <h2 className="text-xl font-semibold">Following</h2>
          {following.length === 0 ? (
            <p className="mt-2 text-sm text-gray-300">You are not following anyone yet.</p>
          ) : (
            <ul className="mt-2 grid gap-2 md:grid-cols-3">
              {following.map((user) => (
                <li className="rounded-md bg-gray-900 p-3 text-sm" key={user.userId}>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
      <section className="rounded-xl border border-gray-800 p-5">
        <h2 className="text-xl font-semibold">Subscription Plans</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {plans.map((plan) => (
            <article className="rounded-md bg-gray-900 p-4" key={plan.id}>
              <p className="text-lg font-semibold">{plan.name}</p>
              <p className="text-sm text-gray-300">₹{plan.priceInr}/month</p>
              <p className="text-sm text-gray-400">{plan.videoQuality}</p>
              <p className="text-sm text-gray-400">{plan.maxScreens} screens</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
