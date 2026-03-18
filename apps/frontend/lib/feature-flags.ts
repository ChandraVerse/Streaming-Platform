"use client";

export type FeatureFlagName = "topTenRow" | "friendsRow" | "liveNowRow";

export type FeatureFlags = Record<FeatureFlagName, boolean>;

const names: FeatureFlagName[] = ["topTenRow", "friendsRow", "liveNowRow"];

export function getClientFeatureFlags(): FeatureFlags {
  if (typeof window === "undefined") {
    return {
      topTenRow: true,
      friendsRow: true,
      liveNowRow: true
    };
  }
  try {
    const stored = window.localStorage.getItem("featureFlags");
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<FeatureFlags>;
      const flags: FeatureFlags = {
        topTenRow: parsed.topTenRow ?? true,
        friendsRow: parsed.friendsRow ?? true,
        liveNowRow: parsed.liveNowRow ?? true
      };
      return flags;
    }
  } catch {
  }
  const flags: FeatureFlags = {
    topTenRow: true,
    friendsRow: true,
    liveNowRow: true
  };
  for (const name of names) {
    flags[name] = Math.random() < 0.5;
  }
  try {
    window.localStorage.setItem("featureFlags", JSON.stringify(flags));
  } catch {
  }
  return flags;
}

