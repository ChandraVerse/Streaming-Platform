"use client";

import { useEffect, useState } from "react";
import type { CatalogItem, Plan, UserSession } from "@/lib/types";
import type { FeatureFlags } from "@/lib/feature-flags";
import { getClientFeatureFlags } from "@/lib/feature-flags";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function DashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [following, setFollowing] = useState<{ userId: string; fullName: string; email: string }[]>([]);
  const [referrals, setReferrals] = useState<{ total: number; referees: { userId: string; fullName: string; email: string }[] } | null>(null);
  const [continueWatching, setContinueWatching] = useState<(CatalogItem & { progressFraction?: number })[]>([]);
  const [topTen, setTopTen] = useState<CatalogItem[]>([]);
  const [liveNow, setLiveNow] = useState<CatalogItem[]>([]);
  const [friendsActivity, setFriendsActivity] = useState<CatalogItem[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    const flags = getClientFeatureFlags();
    setFeatureFlags(flags);
    async function loadData() {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setStatus("Please sign in first.");
        return;
      }
      const [meRes, planRes, followingRes, referralsRes] = await Promise.all([
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
        }),
        fetch(`${apiBaseUrl}/api/users/me/referrals`, {
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
      const referralsPayload = referralsRes.ok ? await referralsRes.json() : { data: null };
      let continueWatchingItems: (CatalogItem & { progressFraction?: number })[] = [];
      try {
        const userId = mePayload.data.userId as string;
        const analyticsRes = await fetch(
          `${apiBaseUrl}/api/analytics/continue-watching?userId=${encodeURIComponent(userId)}`
        );
        if (analyticsRes.ok) {
          const analyticsPayload = await analyticsRes.json();
          const entries = analyticsPayload.data as {
            contentId: string;
            lastPlayedAt: string;
            positionSeconds?: number | null;
            durationSeconds?: number | null;
          }[];
          const ids: string[] = entries.map((entry) => entry.contentId);
          if (ids.length > 0) {
            const bulkResponse = await fetch(
              `${apiBaseUrl}/api/content/bulk?ids=${encodeURIComponent(ids.join(","))}`
            );
            if (bulkResponse.ok) {
              const bulkPayload = await bulkResponse.json();
              const progressById: Record<
                string,
                { positionSeconds: number | null; durationSeconds: number | null }
              > = {};
              for (const entry of entries) {
                progressById[entry.contentId] = {
                  positionSeconds: entry.positionSeconds ?? null,
                  durationSeconds: entry.durationSeconds ?? null
                };
              }
              continueWatchingItems = (bulkPayload.data as CatalogItem[]).map((item: CatalogItem) => {
                const progress = progressById[item.id];
                let progressFraction: number | undefined;
                if (
                  progress &&
                  progress.positionSeconds !== null &&
                  progress.durationSeconds !== null &&
                  progress.durationSeconds > 0
                ) {
                  progressFraction = Math.min(
                    1,
                    progress.positionSeconds / progress.durationSeconds
                  );
                }
                return { ...item, progressFraction };
              });
            }
          }
        }
      } catch {
      }
      try {
        const trendingRes = await fetch(`${apiBaseUrl}/api/analytics/trending?windowHours=720`);
        if (trendingRes.ok) {
          const trendingPayload = await trendingRes.json();
          const ids: string[] = trendingPayload.data.map(
            (entry: { contentId: string; playCount: number }) => entry.contentId
          );
          if (ids.length > 0) {
            const bulkResponse = await fetch(
              `${apiBaseUrl}/api/content/bulk?ids=${encodeURIComponent(ids.join(","))}`
            );
            if (bulkResponse.ok) {
              const bulkPayload = await bulkResponse.json();
              setTopTen(bulkPayload.data as CatalogItem[]);
            }
          }
        }
      } catch {
      }
      try {
        const followees: { userId: string }[] = Array.isArray(followingPayload.data)
          ? followingPayload.data
          : [];
        const limitedFollowees = followees.slice(0, 10);
        const counts = new Map<
          string,
          {
            count: number;
            latest: string;
          }
        >();
        for (const followee of limitedFollowees) {
          const historyRes = await fetch(
            `${apiBaseUrl}/api/analytics/history?userId=${encodeURIComponent(followee.userId)}`
          );
          if (!historyRes.ok) {
            continue;
          }
          const historyPayload = await historyRes.json();
          const entries = historyPayload.data as {
            contentId: string;
            completedAt: string;
          }[];
          for (const entry of entries) {
            const existing = counts.get(entry.contentId);
            if (!existing) {
              counts.set(entry.contentId, { count: 1, latest: entry.completedAt });
            } else {
              const latest =
                new Date(entry.completedAt) > new Date(existing.latest)
                  ? entry.completedAt
                  : existing.latest;
              counts.set(entry.contentId, { count: existing.count + 1, latest });
            }
          }
        }
        const ranked = Array.from(counts.entries())
          .sort((a, b) => {
            if (a[1].count !== b[1].count) {
              return b[1].count - a[1].count;
            }
            return new Date(b[1].latest).getTime() - new Date(a[1].latest).getTime();
          })
          .slice(0, 10);
        const friendIds = ranked.map(([contentId]) => contentId);
        if (friendIds.length > 0) {
          const bulkRes = await fetch(
            `${apiBaseUrl}/api/content/bulk?ids=${encodeURIComponent(friendIds.join(","))}`
          );
          if (bulkRes.ok) {
            const bulkPayload = await bulkRes.json();
            setFriendsActivity(bulkPayload.data as CatalogItem[]);
          }
        }
      } catch {
      }
      try {
        const liveRes = await fetch(`${apiBaseUrl}/api/content?liveNow=true&pageSize=10`);
        if (liveRes.ok) {
          const livePayload = await liveRes.json();
          setLiveNow(livePayload.data as CatalogItem[]);
        }
      } catch {
      }
      setSession(mePayload.data);
      setPlans(plansPayload.data);
      setFollowing(followingPayload.data);
      setReferrals(referralsPayload.data);
      setContinueWatching(continueWatchingItems);
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
          {session.referralCode ? (
            <div className="mt-2 space-y-1 text-xs text-gray-400">
              <p>
                Your referral code: <span className="font-mono">{session.referralCode}</span>
              </p>
              <button
                className="rounded-md border border-gray-700 px-2 py-1 text-[11px] font-medium hover:border-gray-500"
                type="button"
                onClick={async () => {
                  const origin = typeof window !== "undefined" ? window.location.origin : "";
                  const link = `${origin}/signup?ref=${session.referralCode}`;
                  try {
                    await navigator.clipboard.writeText(link);
                  } catch {
                  }
                }}
              >
                Copy referral link
              </button>
            </div>
          ) : null}
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
      {session && referrals ? (
        <section className="rounded-xl border border-gray-800 p-5">
          <h2 className="text-xl font-semibold">Referrals</h2>
          <p className="mt-1 text-sm text-gray-300">Total referrals: {referrals.total}</p>
          {referrals.referees.length > 0 ? (
            <ul className="mt-2 grid gap-2 md:grid-cols-3">
              {referrals.referees.map((user) => (
                <li className="rounded-md bg-gray-900 p-3 text-sm" key={user.userId}>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-300">No referrals yet.</p>
          )}
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
      {session && continueWatching.length > 0 ? (
        <section className="rounded-xl border border-gray-800 p-5">
          <h2 className="text-xl font-semibold">Continue Watching</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            {continueWatching.map((item) => (
              <a
                className="group overflow-hidden rounded-md border border-gray-800 bg-gray-900"
                href={`/title/${item.id}`}
                key={item.id}
              >
                <div className="aspect-[2/3] bg-gray-800">
                  {item.posterImageUrl ? (
                    <img
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      src={item.posterImageUrl}
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.genres.join(" • ")}</p>
                  {typeof item.progressFraction === "number" ? (
                    <div className="mt-2 h-1 w-full rounded bg-gray-800">
                      <div
                        className="h-1 rounded bg-red-500"
                        style={{ width: `${Math.round(item.progressFraction * 100)}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {session && friendsActivity.length > 0 && featureFlags?.friendsRow !== false ? (
        <section className="rounded-xl border border-gray-800 p-5">
          <h2 className="text-xl font-semibold">From People You Follow</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            {friendsActivity.map((item) => (
              <a
                className="group overflow-hidden rounded-md border border-gray-800 bg-gray-900"
                href={`/title/${item.id}`}
                key={item.id}
              >
                <div className="aspect-[2/3] bg-gray-800">
                  {item.posterImageUrl ? (
                    <img
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      src={item.posterImageUrl}
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.genres.join(" • ")}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {liveNow.length > 0 && featureFlags?.liveNowRow !== false ? (
        <section className="rounded-xl border border-gray-800 p-5">
          <h2 className="text-xl font-semibold">Live Now</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            {liveNow.map((item) => (
              <a
                className="group overflow-hidden rounded-md border border-gray-800 bg-gray-900"
                href={`/title/${item.id}`}
                key={item.id}
              >
                <div className="relative aspect-[2/3] bg-gray-800">
                  {item.posterImageUrl ? (
                    <img
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      src={item.posterImageUrl}
                    />
                  ) : null}
                  <span className="absolute left-1 top-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[11px] font-semibold">
                    LIVE
                  </span>
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.genres.join(" • ")}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {topTen.length > 0 && featureFlags?.topTenRow !== false ? (
        <section className="rounded-xl border border-gray-800 p-5">
          <h2 className="text-xl font-semibold">Top 10 Overall</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-5">
            {topTen.map((item, index) => (
              <a
                className="group overflow-hidden rounded-md border border-gray-800 bg-gray-900"
                href={`/title/${item.id}`}
                key={item.id}
              >
                <div className="relative aspect-[2/3] bg-gray-800">
                  {item.posterImageUrl ? (
                    <img
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      src={item.posterImageUrl}
                    />
                  ) : null}
                  <span className="absolute left-1 top-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-bold text-yellow-300">
                    #{index + 1}
                  </span>
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.genres.join(" • ")}</p>
                </div>
              </a>
            ))}
          </div>
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
        <a
          className="mt-4 inline-block rounded-md bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500"
          href="/subscribe"
        >
          Manage subscription
        </a>
      </section>
    </main>
  );
}
