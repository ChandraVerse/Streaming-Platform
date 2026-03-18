 "use client";

import { useEffect, useState, FormEvent } from "react";
import type { Rating } from "@/lib/types";

type Props = {
  contentId: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function getCurrentUserId(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }
  const cached = window.localStorage.getItem("userId");
  if (cached) {
    return cached;
  }
  const token = window.localStorage.getItem("accessToken");
  if (!token) {
    return null;
  }
  const response = await fetch(`${apiBaseUrl}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    return null;
  }
  const payload = await response.json();
  const userId = payload.data?.userId as string | undefined;
  if (userId) {
    window.localStorage.setItem("userId", userId);
    return userId;
  }
  return null;
}

export function RatingsSection(props: Props) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [review, setReview] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/ratings/${props.contentId}`);
        if (!response.ok) {
          setRatings([]);
        } else {
          const payload = await response.json();
          setRatings(payload.data as Rating[]);
        }
      } catch {
        setRatings([]);
      } finally {
        setLoading(false);
      }
    }
    load().catch(() => {
      setLoading(false);
    });
  }, [props.contentId]);

  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length
      : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ratingValue < 1 || ratingValue > 5) {
      setStatus("Please select a rating between 1 and 5.");
      return;
    }
    setSubmitting(true);
    setStatus("");
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setStatus("Please sign in to submit a rating.");
        return;
      }
      const response = await fetch(`${apiBaseUrl}/api/ratings/${props.contentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          rating: ratingValue,
          review: review.trim() || undefined
        })
      });
      if (!response.ok) {
        setStatus("Unable to submit rating right now.");
        return;
      }
      const createdAt = new Date().toISOString();
      setRatings((current) => [
        {
          id: `${userId}-${createdAt}`,
          userId,
          rating: ratingValue,
          review: review.trim() || undefined,
          createdAt
        },
        ...current
      ]);
      setRatingValue(0);
      setReview("");
      setStatus("Thanks for your rating.");
    } catch {
      setStatus("Unable to submit rating right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Ratings and Reviews</h2>
        {ratings.length > 0 ? (
          <p className="text-sm text-gray-300">
            {averageRating.toFixed(1)} / 5 • {ratings.length} ratings
          </p>
        ) : (
          <p className="text-sm text-gray-400">No ratings yet.</p>
        )}
      </div>
      <form className="space-y-3 rounded-md border border-gray-800 bg-gray-900 p-4" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-200">Your rating:</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const active = value <= ratingValue;
              return (
                <button
                  key={value}
                  type="button"
                  className={`h-8 w-8 rounded-full text-lg ${
                    active ? "bg-yellow-400 text-black" : "bg-gray-800 text-gray-400"
                  }`}
                  onClick={() => setRatingValue(value)}
                >
                  ★
                </button>
              );
            })}
          </div>
        </div>
        <textarea
          className="h-24 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
          placeholder="Write a short review (optional)..."
          maxLength={1000}
          value={review}
          onChange={(event) => setReview(event.target.value)}
        />
        <button
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit rating"}
        </button>
        {status ? <p className="text-sm text-gray-300">{status}</p> : null}
      </form>
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-300">Loading ratings...</p>
        ) : ratings.length === 0 ? (
          <p className="text-sm text-gray-300">Be the first to rate this title.</p>
        ) : (
          ratings.map((item) => (
            <article
              key={item.id}
              className="rounded-md border border-gray-800 bg-gray-900 p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">
                  {item.userId.slice(0, 4)}•••{item.userId.slice(-2)}
                </p>
                <p className="text-yellow-400">
                  {"★".repeat(item.rating)}
                  {"☆".repeat(5 - item.rating)}
                </p>
              </div>
              {item.review ? (
                <p className="mt-1 text-gray-200">{item.review}</p>
              ) : null}
              <p className="mt-1 text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

