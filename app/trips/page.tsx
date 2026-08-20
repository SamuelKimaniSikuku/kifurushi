"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import TripCard from "@/components/TripCard";
import QuickRequest from "@/components/QuickRequest";
import CountrySelect from "@/components/CountrySelect";
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

export default function TripsPage() {
  const gate = useContactGate();
  const t = useT();
  const { session } = useSession();
  const [attention, setAttention] = useState<Attention | null>(null);
  const [quickTrip, setQuickTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session) fetchAttention().then(setAttention).catch(() => {});
  }, [session]);

  useEffect(() => {
    fetchTrips()
      .then(setTrips)
      .catch(() => setToast("Could not load trips — please refresh."))
      .finally(() => setLoaded(true));
  }, []);

  const filtered = useMemo(
    () =>
      trips.filter(
        (t) =>
          (!from || t.fromCountry === from) && (!to || t.toCountry === to)
      ),
    [trips, from, to]
  );

  function clear() {
    setFrom("");
    setTo("");
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  async function handleRequest(trip: Trip) {
    if (!(await gate())) return;
    try {
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
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        {t.browse.tripsTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">{t.browse.tripsSub}</p>

      <div className="card mt-6 grid grid-cols-1 items-end gap-3 p-4 sm:grid-cols-[1fr_auto_1fr_auto] sm:p-5">
        <div>
          <label className="field-label" htmlFor="trips-from">
            From
          </label>
          <CountrySelect
            id="trips-from"
            value={from}
            onChange={setFrom}
            placeholder="Any origin"
          />
        </div>

        <button
          type="button"
          onClick={swap}
          aria-label="Swap origin and destination"
          className="btn-ghost mx-auto h-11 w-11 shrink-0 p-0"
        >
          <ArrowLeftRight size={18} strokeWidth={2} aria-hidden />
        </button>

        <div>
          <label className="field-label" htmlFor="trips-to">
            To
          </label>
          <CountrySelect
            id="trips-to"
            value={to}
            onChange={setTo}
            placeholder="Any destination"
          />
        </div>

        <button
          type="button"
          className="btn-ghost h-11 w-full sm:w-auto"
          onClick={clear}
          disabled={!from && !to}
        >
          Clear filters
        </button>
      </div>

      {!loaded ? (
        <div className="mt-6 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          <p aria-live="polite" className="mt-6 text-sm text-muted">
            <span className="font-semibold text-ink">{filtered.length}</span>
            {filtered.length === 1 ? " traveller found" : " travellers found"}
          </p>

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
                title="No trips on this route yet"
                body="Try a different route or clear your filters — or post your parcel so travellers can find you."
              >
                <Link href="/post/parcel" className="btn-primary">
                  Post your parcel
                </Link>
                <button type="button" className="btn-ghost" onClick={clear}>
                  Clear filters
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
