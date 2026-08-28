"use client";

// The hero's right-column proof, under the preview card:
//
//   1. The live volume counter — total value of every parcel ever posted,
//      whatever became of it. Re-polls every 30s, so it stays current as
//      members post. The UI labels it as posted parcel budgets rather than
//      implying that this money passed through Kifurushi.
//      Never "passed through" — no money ever touches Kifurushi, and the
//      Terms depend on that sentence staying true.
//
//   2. Once a code-confirmed delivery between two different people exists,
//      the leaderboard lines join it: most earned, most saved.

import { useEffect, useState } from "react";
import Link from "next/link";
import { PiggyBank, TrendingUp, Trophy } from "lucide-react";
import {
  fetchLeaderboard, fetchParcelVolume, LeaderLine, ParcelVolume,
} from "@/lib/db";
import { useT } from "@/lib/i18n";

export default function Leaderboard() {
  const t = useT();
  const [volume, setVolume] = useState<ParcelVolume | null>(null);
  const [lines, setLines] = useState<LeaderLine[]>([]);
  const shown = volume?.total ?? 0;

  useEffect(() => {
    let live = true;
    const load = () => {
      fetchParcelVolume().then((v) => live && v && setVolume(v)).catch(() => {});
      fetchLeaderboard().then((d) => live && setLines(d)).catch(() => {});
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, []);

  if (!volume || volume.total <= 0) return null;

  return (
    <div className="mt-6 space-y-2">
      <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 rounded-2xl bg-white/5 px-5 py-4 text-center">
        <TrendingUp
          className="h-4 w-4 shrink-0 self-center text-gold"
          strokeWidth={2}
          aria-hidden
        />
        <span className="font-display text-2xl font-bold tabular-nums text-gold">
          ${shown.toLocaleString()}
        </span>
        <span className="text-sm text-white/80">
          {t.home.volumeLine(volume.parcels)}
        </span>
      </div>

      {lines.map((line) => (
        <div
          key={line.kind}
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl bg-white/5 px-5 py-3 text-center"
        >
          {line.kind === "earned" ? (
            <Trophy className="h-4 w-4 shrink-0 text-gold" strokeWidth={2} aria-hidden />
          ) : (
            <PiggyBank className="h-4 w-4 shrink-0 text-gold" strokeWidth={2} aria-hidden />
          )}
          <span className="text-sm text-white/80">
            {line.kind === "earned"
              ? t.home.leaderEarned(Math.round(line.amount), line.deliveries)
              : t.home.leaderSaved(Math.round(line.amount))}
          </span>
          <Link
            href={`/people/${line.slug}`}
            className="text-sm font-semibold text-gold underline underline-offset-2"
          >
            {line.name}
          </Link>
        </div>
      ))}
    </div>
  );
}
