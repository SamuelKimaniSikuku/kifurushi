"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import TripCard from "@/components/TripCard";
import CountrySelect from "@/components/CountrySelect";
import Toast from "@/components/ui/Toast";
import SkeletonCard from "@/components/ui/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import { getTrips, getSession, requestMatch, getParcels } from "@/lib/store";
import { useContactGate } from "@/lib/useContactGate";
import { Trip } from "@/lib/types";

export default function TripsPage() {
  const gate = useContactGate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setTrips(getTrips());
    setLoaded(true);
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

  function handleRequest(trip: Trip) {
    if (!gate()) return;
    const session = getSession();
    // Demo: attach the user's most recent parcel, or create the request directly.
    const myParcel = getParcels().find((p) => p.senderName === session?.name);
    requestMatch(trip.id, myParcel?.id ?? "pending");
    setRequestedIds((prev) => new Set(prev).add(trip.id));
    setToast(`Request sent to ${trip.travelerName}. Track it in your dashboard.`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        Find a traveller
      </h1>
      <p className="mt-2 text-muted">
        Verified people flying your route with spare luggage space.
      </p>

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

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
