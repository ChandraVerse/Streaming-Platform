"use client";

import { useEffect, useRef } from "react";

type Props = {
  contentId: string;
  muxPlaybackId: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function getUserIdForAnalytics(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem("userId");
  if (stored) {
    return stored;
  }
  const token = window.localStorage.getItem("accessToken");
  if (!token) {
    return null;
  }
  const meResponse = await fetch(`${apiBaseUrl}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!meResponse.ok) {
    return null;
  }
  const mePayload = await meResponse.json();
  const userId = mePayload.data?.userId ?? null;
  if (userId) {
    window.localStorage.setItem("userId", userId);
  }
  return userId;
}

export function AnalyticsVideoPlayer(props: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resumePositionRef = useRef<number | null>(null);

  useEffect(() => {
    async function loadProgress() {
      const userId = await getUserIdForAnalytics();
      if (!userId) {
        return;
      }
      const response = await fetch(
        `${apiBaseUrl}/api/analytics/continue-watching?userId=${encodeURIComponent(userId)}`
      );
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      const entry = (payload.data as { contentId: string; positionSeconds?: number | null }[]).find(
        (item) => item.contentId === props.contentId
      );
      if (!entry || typeof entry.positionSeconds !== "number" || entry.positionSeconds <= 0) {
        return;
      }
      resumePositionRef.current = entry.positionSeconds;
      const element = videoRef.current;
      if (element && element.duration && entry.positionSeconds < element.duration) {
        element.currentTime = entry.positionSeconds;
      }
    }

    loadProgress().catch(() => {});
  }, [props.contentId]);

  return (
    <div className="flex flex-col gap-2">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        controls
        src={`https://stream.mux.com/${props.muxPlaybackId}.m3u8`}
        onLoadedMetadata={(event) => {
          const position = resumePositionRef.current;
          const element = event.currentTarget;
          if (position && element.duration && position < element.duration) {
            element.currentTime = position;
          }
        }}
        onPlay={async () => {
          try {
            const userId = await getUserIdForAnalytics();
            await fetch(`${apiBaseUrl}/api/analytics/events`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                userId: userId || undefined,
                kind: "play",
                contentId: props.contentId
              })
            });
          } catch {
          }
        }}
        onPause={async (event) => {
          try {
            const userId = await getUserIdForAnalytics();
            const element = event.currentTarget;
            await fetch(`${apiBaseUrl}/api/analytics/events`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                userId: userId || undefined,
                kind: "pause",
                contentId: props.contentId,
                positionSeconds: Math.floor(element.currentTime),
                durationSeconds: Number.isFinite(element.duration) ? Math.floor(element.duration) : undefined
              })
            });
          } catch {
          }
        }}
        onEnded={async (event) => {
          try {
            const userId = await getUserIdForAnalytics();
            const element = event.currentTarget;
            await fetch(`${apiBaseUrl}/api/analytics/events`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                userId: userId || undefined,
                kind: "complete",
                contentId: props.contentId,
                positionSeconds: Math.floor(element.currentTime),
                durationSeconds: Number.isFinite(element.duration) ? Math.floor(element.duration) : undefined
              })
            });
          } catch {
          }
        }}
      >
        Your browser does not support Mux playback.
      </video>
      <button
        className="self-start rounded-md border border-gray-700 px-3 py-1 text-xs font-medium hover:border-gray-500"
        type="button"
        onClick={() => {
          const element = videoRef.current;
          if (!element) {
            return;
          }
          element.currentTime = 0;
          element.play().catch(() => {});
        }}
      >
        Restart from beginning
      </button>
    </div>
  );
}

