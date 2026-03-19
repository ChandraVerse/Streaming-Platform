"use client";

import { useEffect, useState } from "react";
import type { LiveEvent } from "@/lib/types";

type Props = {
  event: LiveEvent;
};

export function LiveScoreboard({ event }: Props) {
  const [hideScores, setHideScores] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("hideLiveScores");
      if (stored) {
        setHideScores(stored === "true");
      }
    } catch {
    }
  }, []);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold">
          {event.homeTeam} vs {event.awayTeam}
        </p>
        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold">
          {event.status.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{event.period}</span>
        <span>{event.clock}</span>
      </div>
      <div className="flex items-center gap-6 text-base font-semibold">
        <span>{hideScores ? "—" : event.homeScore}</span>
        <span>{hideScores ? "—" : event.awayScore}</span>
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-400">
        <input
          checked={hideScores}
          onChange={(event) => {
            const value = event.target.checked;
            setHideScores(value);
            try {
              window.localStorage.setItem("hideLiveScores", value ? "true" : "false");
            } catch {
            }
          }}
          type="checkbox"
        />
        Hide scores for spoilers
      </label>
    </div>
  );
}
