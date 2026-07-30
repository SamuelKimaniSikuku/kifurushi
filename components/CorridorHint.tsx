"use client";

// A date is the easiest thing to get wrong on both forms, and the mistake is
// invisible: you post a trip leaving the day after the only parcel on your
// route needed to arrive, and nothing tells you. The database will refuse the
// match later; this says so now, while the field is still in front of you.

import { CalendarClock, CheckCircle2, Info } from "lucide-react";
import { CorridorFit } from "@/lib/db";
import { useT } from "@/lib/i18n";

export default function CorridorHint({
  fit,
  mode,
  onUseSuggested,
}: {
  fit: CorridorFit | null;
  /** 'trip' = you're choosing a departure; 'parcel' = you're choosing a deadline. */
  mode: "trip" | "parcel";
  onUseSuggested?: (date: string) => void;
}) {
  const t = useT();
  if (!fit || fit.total === 0) return null;

  const c = t.corridor;
  const nice = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  // Nothing missed: this is just encouragement, and it belongs in the quiet
  // style — a green banner for "your date is fine" would shout over the form.
  if (fit.missed === 0) {
    return (
      <p className="mt-2 flex items-start gap-2 text-xs text-success">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {mode === "trip" ? c.tripFitsAll(fit.fits) : c.parcelFitsAll(fit.fits)}
      </p>
    );
  }

  const warn = fit.fits === 0;
  return (
    <div
      className={`mt-2 rounded-xl border p-3 text-xs ${
        warn ? "border-warn bg-warn-bg text-ink" : "border-line bg-sand text-ink"
      }`}
    >
      <p className="flex items-start gap-2">
        {warn ? (
          <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" strokeWidth={2} aria-hidden />
        ) : (
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2} aria-hidden />
        )}
        <span>
          {mode === "trip"
            ? c.tripMissed(fit.missed, fit.fits)
            : c.parcelMissed(fit.missed, fit.fits)}
        </span>
      </p>
      {fit.suggestedDate && (
        <p className="mt-2 pl-5">
          {mode === "trip"
            ? c.tripSuggest(nice(fit.suggestedDate))
            : c.parcelSuggest(nice(fit.suggestedDate))}{" "}
          {onUseSuggested && (
            <button
              type="button"
              className="font-semibold text-forest underline"
              onClick={() => onUseSuggested(fit.suggestedDate!)}
            >
              {c.useDate}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
