"use client";

import Link from "next/link";
import { BellRing, Calendar, Check, Pencil, Plane, Star } from "lucide-react";
import { Trip, CATEGORY_LABELS } from "@/lib/types";
import { label } from "@/lib/countries";
import { personHref } from "@/lib/people";
import { useT } from "@/lib/i18n";
import Avatar from "@/components/ui/Avatar";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

export default function TripCard({
  trip,
  onRequest,
  requested,
  mine,
  pending = 0,
}: {
  trip: Trip;
  onRequest?: (trip: Trip) => void;
  requested?: boolean;
  mine?: boolean;
  pending?: number;
}) {
  const t = useT();
  const date = new Date(trip.departDate).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const anchorPrice = Math.round(trip.pricePerKg * 5);
  const capacityPct = Math.min(100, Math.max(0, Math.round((trip.remainingKg / Math.max(trip.spaceKg, 1)) * 100)));
  const shownCategories = trip.categoriesAccepted.slice(0, 3);
  const extraCategories = trip.categoriesAccepted.length - shownCategories.length;

  return (
    <article className="card card-lift group flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={trip.travelerName} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={personHref(trip.travelerName)}
                className="truncate rounded text-base font-semibold text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2"
              >
                {trip.travelerName}
              </Link>
              {trip.travelerVerified ? (
                <VerifiedBadge small />
              ) : (
                <span className="inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-faint">
                  Unverified
                </span>
              )}
            </div>
            {trip.tripsCompleted > 0 ? (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                <Star
                  size={13}
                  strokeWidth={2}
                  className="shrink-0 fill-gold text-gold-deep"
                  aria-hidden
                />
                <span className="font-semibold text-ink">
                  {trip.travelerRating.toFixed(1)}
                </span>
                <span>({trip.tripsCompleted})</span>
              </div>
            ) : (
              <div className="mt-0.5 text-xs text-muted">
                New traveller · no deliveries yet
              </div>
            )}
          </div>
        </div>

        <div className="w-24 shrink-0 text-right">
          <div className="font-display text-2xl font-extrabold leading-none text-forest">
            ${trip.pricePerKg}
            <span className="text-xs font-medium text-muted">/kg</span>
          </div>
          <div className="mt-1 text-xs text-muted">
            ~ ${anchorPrice} for 5 kg
          </div>
          <div className="mt-1.5">
            <div className="text-xs text-muted">{trip.remainingKg} kg free</div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-sand-deep">
              <div
                className="h-full rounded-full bg-leaf"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm">
          <span className="truncate font-semibold text-ink">{trip.fromCity}</span>
          <span className="flex min-w-[3rem] flex-1 items-center gap-1.5" aria-hidden>
            <span className="flex-1 border-t border-dashed border-line-strong" />
            <Plane size={16} strokeWidth={2} className="shrink-0 rotate-45 text-clay" />
            <span className="flex-1 border-t border-dashed border-line-strong" />
          </span>
          <span className="truncate text-right font-semibold text-ink">{trip.toCity}</span>
        </div>
        <div className="mt-1 text-xs text-muted">
          {label(trip.fromCountry)} → {label(trip.toCountry)}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Calendar size={14} strokeWidth={2} className="shrink-0" aria-hidden />
        departs {date}
      </div>

      {trip.notes && (
        <p className="line-clamp-2 text-sm text-muted">{trip.notes}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {shownCategories.map((cat) => (
          <span key={cat} className="chip">
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
        {extraCategories > 0 && <span className="chip">+{extraCategories}</span>}
      </div>

      {mine ? (
        <div className="mt-auto space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-line-strong px-2.5 py-1 text-[11px] font-semibold text-muted">
              {t.browse.yourTrip}
            </span>
            <Link
              href={`/post/trip?edit=${trip.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 text-[11px] font-semibold text-forest transition hover:border-forest"
            >
              <Pencil size={11} strokeWidth={2.5} aria-hidden />
              {t.browse.edit}
            </Link>
          </div>
          {pending > 0 && (
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-xl bg-clay px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-clay-deep"
            >
              <BellRing size={16} strokeWidth={2} aria-hidden />
              {t.browse.pending(pending)}
            </Link>
          )}
        </div>
      ) : onRequest && (
        <div className="mt-auto pt-1">
          {requested ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-success-bg px-5 py-2.5 text-sm font-semibold text-success"
            >
              <Check size={16} strokeWidth={2} aria-hidden />
              {t.browse.requestSent}
            </button>
          ) : (
            <button className="btn-accent w-full" onClick={() => onRequest(trip)}>
              {t.browse.requestTraveller}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
