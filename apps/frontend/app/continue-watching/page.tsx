 "use client";

import { useEffect, useState } from "react";
import type { CatalogItem } from "@/lib/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function ContinueWatchingPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    async function load() {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
      if (!token) {
        setStatus("Please sign in first.");
        return;
      }
      const meResponse = await fetch(`${apiBaseUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!meResponse.ok) {
        setStatus("Session invalid. Please sign in again.");
        return;
      }
      const mePayload = await meResponse.json();
      const userId = mePayload.data.userId as string;

      const analyticsRes = await fetch(
        `${apiBaseUrl}/api/analytics/continue-watching?userId=${encodeURIComponent(userId)}`
      );
      if (!analyticsRes.ok) {
        setStatus("Unable to load continue watching.");
        return;
      }
      const analyticsPayload = await analyticsRes.json();
      const ids: string[] = analyticsPayload.data.map(
        (entry: { contentId: string; lastPlayedAt: string }) => entry.contentId
      );
      if (ids.length === 0) {
        setItems([]);
        setStatus("No titles to continue.");
        return;
      }

      const bulkResponse = await fetch(
        `${apiBaseUrl}/api/content/bulk?ids=${encodeURIComponent(ids.join(","))}`
      );
      if (!bulkResponse.ok) {
        setStatus("Unable to load titles.");
        return;
      }
      const bulkPayload = await bulkResponse.json();
      setItems(bulkPayload.data as CatalogItem[]);
      setStatus("Ready");
    }

    load().catch(() => setStatus("Unable to load continue watching."));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Continue Watching</h1>
      <p className="text-sm text-gray-300">{status}</p>
      <div className="grid gap-4 md:grid-cols-4">
        {items.map((item) => (
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
    </main>
  );
}

