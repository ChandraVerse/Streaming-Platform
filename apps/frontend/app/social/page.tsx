"use client";

import { useEffect, useState } from "react";
import type { ActivityEvent } from "@/lib/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function SocialPage() {
  const [suggested, setSuggested] = useState<{ userId: string; fullName: string; email: string }[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    async function load() {
      const token = window.localStorage.getItem("accessToken");
      if (!token) {
        setStatus("Please sign in first.");
        return;
      }
      const meRes = await fetch(`${apiBaseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!meRes.ok) {
        setStatus("Session invalid. Please sign in again.");
        return;
      }
      const mePayload = await meRes.json();
      const userId = mePayload.data.userId as string;
      const [suggestionsRes, activityRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/social/suggestions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/api/analytics/activity-feed?userId=${encodeURIComponent(userId)}`)
      ]);
      if (suggestionsRes.ok) {
        const suggestionsPayload = await suggestionsRes.json();
        setSuggested(suggestionsPayload.data as { userId: string; fullName: string; email: string }[]);
      }
      if (activityRes.ok) {
        const activityPayload = await activityRes.json();
        setActivity(activityPayload.data as ActivityEvent[]);
      }
      setStatus("Ready");
    }
    load().catch(() => setStatus("Unable to load social feed."));
  }, []);

  async function follow(userId: string) {
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setStatus("Please sign in first.");
      return;
    }
    const response = await fetch(`${apiBaseUrl}/api/social/follow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ targetUserId: userId })
    });
    if (!response.ok) {
      setStatus("Unable to follow.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Social</h1>
      <p className="text-sm text-gray-300">{status}</p>
      <section className="rounded-xl border border-gray-800 p-5">
        <h2 className="text-lg font-semibold">Find friends</h2>
        {suggested.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No suggestions yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {suggested.map((user) => (
              <li className="flex items-center justify-between rounded-md border border-gray-800 bg-gray-900 p-3" key={user.userId}>
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <button
                  className="rounded-md border border-gray-700 px-3 py-1 text-xs font-medium hover:border-gray-500"
                  type="button"
                  onClick={() => follow(user.userId)}
                >
                  Follow
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-xl border border-gray-800 p-5">
        <h2 className="text-lg font-semibold">Activity feed</h2>
        {activity.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No activity yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {activity.map((event) => (
              <li className="rounded-md border border-gray-800 bg-gray-900 p-3" key={event.id}>
                <p className="text-xs text-gray-400">
                  {event.userId} {event.kind} {event.contentId ?? ""}
                  {event.rating ? ` • ${event.rating}★` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
