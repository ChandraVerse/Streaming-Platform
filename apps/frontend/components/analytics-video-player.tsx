"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  contentId: string;
  muxPlaybackId: string;
  requiresPremium?: boolean;
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
  const adVideoRef = useRef<HTMLVideoElement | null>(null);
  const resumePositionRef = useRef<number | null>(null);
  const [prerollAd, setPrerollAd] = useState<{ id: string; mediaUrl: string; clickUrl?: string } | null>(null);
  const [midrollAd, setMidrollAd] = useState<{ id: string; mediaUrl: string; clickUrl?: string } | null>(null);
  const [activeAd, setActiveAd] = useState<{ id: string; mediaUrl: string; clickUrl?: string } | null>(null);
  const [adPlacement, setAdPlacement] = useState<"preroll" | "midroll" | null>(null);
  const [playBlocked, setPlayBlocked] = useState(false);
  const prerollShownRef = useRef(false);
  const midrollShownRef = useRef(false);

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

  useEffect(() => {
    async function checkEntitlement() {
      if (!props.requiresPremium) {
        setPlayBlocked(false);
        return;
      }
      const token = window.localStorage.getItem("accessToken");
      if (!token) {
        setPlayBlocked(true);
        return;
      }
      const response = await fetch(`${apiBaseUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        setPlayBlocked(true);
        return;
      }
      const payload = await response.json();
      const subscription = payload.data?.subscription;
      setPlayBlocked(!(subscription && subscription.status === "active"));
    }
    checkEntitlement().catch(() => setPlayBlocked(false));
  }, [props.requiresPremium]);

  useEffect(() => {
    async function loadAds() {
      try {
        const [preRes, midRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/ads/decision?contentId=${encodeURIComponent(props.contentId)}&placement=preroll`),
          fetch(`${apiBaseUrl}/api/ads/decision?contentId=${encodeURIComponent(props.contentId)}&placement=midroll`)
        ]);
        if (preRes.ok) {
          const payload = await preRes.json();
          setPrerollAd(payload.data || null);
        }
        if (midRes.ok) {
          const payload = await midRes.json();
          setMidrollAd(payload.data || null);
        }
      } catch {
      }
    }
    loadAds().catch(() => {});
  }, [props.contentId]);

  async function recordAdEvent(kind: "ad_impression" | "ad_click") {
    try {
      const userId = await getUserIdForAnalytics();
      await fetch(`${apiBaseUrl}/api/analytics/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: userId || undefined,
          kind,
          contentId: props.contentId
        })
      });
    } catch {
    }
  }

  function playAd(ad: { id: string; mediaUrl: string; clickUrl?: string }, placement: "preroll" | "midroll") {
    setActiveAd(ad);
    setAdPlacement(placement);
    recordAdEvent("ad_impression").catch(() => {});
  }

  return (
    <div className="flex flex-col gap-2">
      {activeAd ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
          <video
            ref={adVideoRef}
            className="h-full w-full object-contain"
            src={activeAd.mediaUrl}
            autoPlay
            controls
            onEnded={() => {
              setActiveAd(null);
              setAdPlacement(null);
              if (adPlacement === "preroll") {
                prerollShownRef.current = true;
              }
              if (adPlacement === "midroll") {
                midrollShownRef.current = true;
              }
              const main = videoRef.current;
              if (main) {
                main.play().catch(() => {});
              }
            }}
          />
          {activeAd.clickUrl ? (
            <a
              className="absolute bottom-3 right-3 rounded-md bg-white/90 px-3 py-1 text-xs font-semibold text-black"
              href={activeAd.clickUrl}
              onClick={() => recordAdEvent("ad_click")}
              rel="noreferrer"
              target="_blank"
            >
              Learn more
            </a>
          ) : null}
        </div>
      ) : null}
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        controls={!playBlocked}
        src={`https://stream.mux.com/${props.muxPlaybackId}.m3u8`}
        onLoadedMetadata={(event) => {
          const position = resumePositionRef.current;
          const element = event.currentTarget;
          if (position && element.duration && position < element.duration) {
            element.currentTime = position;
          }
        }}
        onPlay={async () => {
          if (playBlocked) {
            const element = videoRef.current;
            if (element) {
              element.pause();
            }
            return;
          }
          if (!prerollShownRef.current && prerollAd) {
            const element = videoRef.current;
            if (element) {
              element.pause();
            }
            playAd(prerollAd, "preroll");
            return;
          }
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
        onTimeUpdate={(event) => {
          if (midrollShownRef.current || !midrollAd) {
            return;
          }
          const element = event.currentTarget;
          if (element.duration && element.currentTime > element.duration / 2) {
            element.pause();
            playAd(midrollAd, "midroll");
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
      {playBlocked ? (
        <div className="rounded-md border border-red-700 bg-red-950 px-3 py-2 text-xs text-red-100">
          Subscribe to watch premium titles.
        </div>
      ) : null}
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

