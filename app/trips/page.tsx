"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, RefreshCw } from "lucide-react";
import TripCard from "@/components/TripCard";
import QuickRequest from "@/components/QuickRequest";
import BrowseFilters from "@/components/BrowseFilters";
import ListingError from "@/components/ListingError";
import { postHref } from "@/lib/routes";
import { useBrowseFilters } from "@/lib/useBrowseFilters";
import Toast from "@/components/ui/Toast";
import SkeletonCard from "@/components/ui/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import {
  fetchTrips, fetchMyOpenParcels, requestMatch, fetchAttention, type Attention,
} from "@/lib/db";
import { useContactGate } from "@/lib/useContactGate";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/auth";
import { Trip } from "@/lib/types";

function TripsContent() {
  const gate = useContactGate();
  const t = useT();
  const { session } = useSession();
  const [attention, setAttention] = useState<Attention | null>(null);
  const [quickTrip, setQuickTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const browse = useBrowseFilters("/trips");
  const { from, to, date, sort } = browse.filters;
  const x = t.experience;
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session) fetchAttention().then(setAttention).catch(() => {});
  }, [session]);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setLoadError(false);
    fetchTrips()
      .then((items) => { if (active) setTrips(items); })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [reload]);

  const filtered = useMemo(() =>
    trips.filter((item) =>
      (!from || item.fromCountry === from) &&
      (!to || item.toCountry === to) &&
      (!date || item.departDate <= date)
    ).sort((a, b) => sort === "price"
      ? a.pricePerKg - b.pricePerKg || a.departDate.localeCompare(b.departDate)
      : a.departDate.localeCompare(b.departDate)),
    [trips, from, to, date, sort]
  );

  async function handleRequest(trip: Trip) {
    try {
      if (!(await gate())) return;
      // A match joins this trip to a parcel going the SAME way. Reuse one
      // of mine on that route if it exists; otherwise collect just the
      // parcel details, with the route inherited from the trip.
      // Reuse one of my parcels only if it genuinely fits this flight:
      // same corridor, still needed after the plane leaves, and light
      // enough for the space left. Otherwise collect a fresh one, which
      // inherits the trip's route and date and therefore always fits.
      const mine = await fetchMyOpenParcels();
      const fits = mine.find(
        (p) =>
          p.fromCountry === trip.fromCountry &&
          p.toCountry === trip.toCountry &&
          p.date >= trip.departDate &&
          p.kg <= trip.remainingKg
      );
      if (!fits) {
        setQuickTrip(trip);
        return;
      }
      await requestMatch(trip.id, fits.id);
      setRequestedIds((prev) => new Set(prev).add(trip.id));
      setToast(`Request sent to ${trip.travelerName} — you can chat with them from your dashboard now.`);
    } catch {
      setToast("Could not send the request — please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><p className="section-eyebrow">{x.send}</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">{t.browse.tripsTitle}</h1><p className="mt-3 max-w-2xl text-base text-muted">{x.browseTripsSub}</p></div>
        <Link href={postHref("parcel", { from, to })} className="btn-primary"><Package size={18} aria-hidden />{x.postParcel}</Link>
      </div>
      <BrowseFilters kind="trips" {...browse} />

      {!loaded ? (
        <div aria-busy="true" aria-label={x.loading} className="mt-6 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : loadError ? <ListingError retry={() => setReload((count) => count + 1)} /> : (
        <>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
            <div><p aria-live="polite" className="text-base font-semibold">{x.resultTrips(filtered.length)}</p><p className="mt-1 text-sm text-muted">{x.usd}</p></div>
            <div className="flex items-end gap-2">
              <div><label htmlFor="trips-sort" className="field-label">{x.sort}</label><select id="trips-sort" className="field" disabled={browse.pending} value={sort === "price" ? sort : "date"} onChange={(e) => browse.update({ sort: e.target.value as "date" | "price" })}><option value="date">{x.soonest}</option><option value="price">{x.cheapest}</option></select></div>
              <button type="button" onClick={() => setReload((count) => count + 1)} className="btn-ghost h-12 w-12 px-0" aria-label={x.retry}><RefreshCw size={17} aria-hidden /></button>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="mt-4 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <TripCard
                  key={t.id}
                  trip={t}
                  onRequest={handleRequest}
                  requested={requestedIds.has(t.id)}
                  mine={!!session && t.travelerId === session.userId}
                  pending={attention?.byTrip[t.id] ?? 0}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title={x.emptyTrips}
                body={x.emptyTripsBody}
              >
                <Link href={postHref("parcel", { from, to })} className="btn-primary">
                  {x.postParcel}
                </Link>
                <button type="button" className="btn-ghost" onClick={browse.clear}>
                  {x.clear}
                </button>
              </EmptyState>
            </div>
          )}
        </>
      )}

      {quickTrip && (
        <QuickRequest
          trip={quickTrip}
          onClose={() => setQuickTrip(null)}
          onDone={() => {
            const name = quickTrip.travelerName;
            setRequestedIds((prev) => new Set(prev).add(quickTrip.id));
            setQuickTrip(null);
            setToast(`Request sent to ${name} — you can chat with them from your dashboard now.`);
          }}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

export default function TripsPage() {
  return <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10"><SkeletonCard /></div>}><TripsContent /></Suspense>;
}
