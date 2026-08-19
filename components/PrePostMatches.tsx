"use client";

// The marketplace's job is to stop people posting into a void when the other
// side is already there. These two blocks live on the post forms: as soon as
// the route is typed, they surface the actual counterparties — not a count,
// the people — so a sender can request a traveller on the spot instead of
// posting a parcel and hoping, and a traveller sees who is already waiting
// for them before they've even finished the form.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Package, Plane, Scale } from "lucide-react";
import { fetchFittingTrips, fetchWaitingParcels } from "@/lib/db";
import { ParcelRequest, Trip } from "@/lib/types";
import { useT } from "@/lib/i18n";
import QuickRequest from "@/components/QuickRequest";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

const nice = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** Travellers who could already carry the parcel being typed. */
export function FittingTrips({
  fromCountry,
  toCountry,
  neededBy,
  weightKg,
}: {
  fromCountry: string;
  toCountry: string;
  neededBy: string;
  weightKg: string;
}) {
  const t = useT();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [requesting, setRequesting] = useState<Trip | null>(null);

  useEffect(() => {
    if (!fromCountry || !toCountry) {
      setTrips([]);
      return;
    }
    const kg = parseFloat(weightKg);
    let live = true;
    const timer = setTimeout(() => {
      fetchFittingTrips(
        fromCountry,
        toCountry,
        neededBy,
        Number.isFinite(kg) ? kg : 0.1
      )
        .then((r) => live && setTrips(r))
        .catch(() => live && setTrips([]));
    }, 400);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [fromCountry, toCountry, neededBy, weightKg]);

  if (trips.length === 0) return null;
  const kg = parseFloat(weightKg);

  return (
    <div className="mt-4 rounded-2xl border border-forest/25 bg-sand p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-forest">
        <Plane className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        {t.recommend.tripsTitle(trips.length)}
      </p>
      <p className="mt-0.5 text-xs text-muted">{t.recommend.tripsNote}</p>

      <ul className="mt-3 space-y-2">
        {trips.map((trip) => (
          <li
            key={trip.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                {trip.travelerName}
                {trip.travelerVerified && <VerifiedBadge small />}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {trip.fromCity} → {trip.toCity} ·{" "}
                {t.recommend.departs(nice(trip.departDate))} · $
                {trip.pricePerKg}/kg · {t.recommend.kgFree(trip.remainingKg)}
              </p>
              {Number.isFinite(kg) && kg > 0 && kg <= trip.remainingKg && (
                <p className="mt-0.5 text-xs font-semibold text-forest">
                  {t.recommend.estimate(Math.round(kg * trip.pricePerKg))}
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn-accent shrink-0"
              onClick={() => setRequesting(trip)}
            >
              {t.browse.requestTraveller}
            </button>
          </li>
        ))}
      </ul>

      {requesting && (
        <QuickRequest
          trip={requesting}
          onClose={() => setRequesting(null)}
          onDone={() => {
            setRequesting(null);
            // The request created the parcel and the match in one step —
            // the form below is no longer needed.
            router.push("/dashboard");
          }}
        />
      )}
    </div>
  );
}

/** Parcels already waiting for whoever is posting this trip. */
export function WaitingParcels({
  fromCountry,
  toCountry,
  departDate,
}: {
  fromCountry: string;
  toCountry: string;
  departDate: string;
}) {
  const t = useT();
  const [parcels, setParcels] = useState<ParcelRequest[]>([]);

  useEffect(() => {
    if (!fromCountry || !toCountry) {
      setParcels([]);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      fetchWaitingParcels(fromCountry, toCountry, departDate)
        .then((r) => live && setParcels(r))
        .catch(() => live && setParcels([]));
    }, 400);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [fromCountry, toCountry, departDate]);

  if (parcels.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-forest/25 bg-sand p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-forest">
        <Package className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        {t.recommend.parcelsTitle(parcels.length)}
      </p>
      <p className="mt-0.5 text-xs text-muted">{t.recommend.parcelsNote}</p>

      <ul className="mt-3 space-y-2">
        {parcels.map((p) => (
          <li key={p.id} className="rounded-xl bg-white p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              {p.senderName}
              {p.senderVerified && <VerifiedBadge small />}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
              <span>
                {p.fromCity} → {p.toCity}
              </span>
              <span className="inline-flex items-center gap-1">
                <Scale className="h-3 w-3" strokeWidth={2} aria-hidden />
                {t.recommend.parcelMeta(p.weightKg, p.budgetUsd)}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" strokeWidth={2} aria-hidden />
                {t.recommend.neededBy(nice(p.neededBy))}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
