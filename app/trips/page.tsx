"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TripCard from "@/components/TripCard";
import CountrySelect from "@/components/CountrySelect";
import { getTrips, getSession, requestMatch, getParcels, isMember } from "@/lib/store";
import { Trip } from "@/lib/types";

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setTrips(getTrips());
  }, []);

  const filtered = useMemo(
    () =>
      trips.filter(
        (t) =>
          (!from || t.fromCountry === from) && (!to || t.toCountry === to)
      ),
    [trips, from, to]
  );

  function handleRequest(trip: Trip) {
    const session = getSession();
    if (!session) {
      router.push("/auth?next=/trips");
      return;
    }
    if (!isMember()) {
      router.push("/pricing");
      return;
    }
    // Demo: attach the user's most recent parcel, or create the request directly.
    const myParcel = getParcels().find((p) => p.senderName === session.name);
    requestMatch(trip.id, myParcel?.id ?? "pending");
    setToast(`Request sent to ${trip.travelerName}. Track it in your dashboard.`);
    setTimeout(() => setToast(""), 4000);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-[var(--forest)]">Find a traveller</h1>
      <p className="mt-1 text-sm text-[#5c6b63]">
        Verified people flying your route with spare luggage space.
      </p>

      <div className="card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="field-label">From</label>
          <CountrySelect value={from} onChange={setFrom} placeholder="Any origin" />
        </div>
        <div>
          <label className="field-label">To</label>
          <CountrySelect value={to} onChange={setTo} placeholder="Any destination" />
        </div>
        <div className="flex items-end">
          <button className="btn-ghost w-full" onClick={() => { setFrom(""); setTo(""); }}>
            Clear filters
          </button>
        </div>
      </div>

      {toast && (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          ✓ {toast}
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <TripCard key={t.id} trip={t} onRequest={handleRequest} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card mt-6 p-10 text-center text-sm text-[#5c6b63]">
          No trips on this route yet. Try clearing a filter — or{" "}
          <a href="/post/parcel" className="font-semibold text-[var(--forest)] underline">
            post your parcel
          </a>{" "}
          so travellers find you.
        </div>
      )}
    </div>
  );
}
