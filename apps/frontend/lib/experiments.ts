"use client";

import type { ExperimentAssignment } from "@/lib/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function fetchExperimentAssignments(userId: string): Promise<ExperimentAssignment[]> {
  const response = await fetch(`${apiBaseUrl}/api/analytics/experiments/assignments?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as ExperimentAssignment[];
}

export async function assignExperiment(userId: string, experimentName: string): Promise<string | null> {
  const response = await fetch(`${apiBaseUrl}/api/analytics/experiments/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ userId, experimentName })
  });
  if (!response.ok) {
    return null;
  }
  const payload = await response.json();
  return payload.data?.variant ?? null;
}
