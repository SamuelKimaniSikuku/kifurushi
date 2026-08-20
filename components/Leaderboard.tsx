"use client";

// Two lines of social proof under the hero — the most a traveller has earned
// and the most a sender has saved. The numbers come only from code-confirmed
// deliveries between two different people, so this renders nothing at all
// until such a delivery exists: a true small number builds more trust than a
// manufactured big one, and an empty band costs nothing.

import { useEffect, useState } from "react";
import Link from "next/link";
import { PiggyBank, Trophy } from "lucide-react";
import { fetchLeaderboard, LeaderLine } from "@/lib/db";
import { useT } from "@/lib/i18n";

export default function Leaderboard() {
  const t = useT();
  const [lines, setLines] = useState<LeaderLine[]>([]);

  useEffect(() => {
    let live = true;
    fetchLeaderboard()
      .then((d) => live && setLines(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (lines.length === 0) return null;

  return (
    <div className="mt-6 space-y-2">
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
