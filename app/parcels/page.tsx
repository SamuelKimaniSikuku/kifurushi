"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ParcelCard from "@/components/ParcelCard";
import CountrySelect from "@/components/CountrySelect";
import { getParcels, getSession, requestMatch, getTrips, isMember } from "@/lib/store";
import { ParcelRequest } from "@/lib/types";

export default function ParcelsPage() {
  const router = useRouter();
  const [parcels, setParcels] = useState<ParcelRequest[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setParcels(getParcels());
  }, []);

  const filtered = useMemo(
    () =>
      parcels.filter(
        (p) =>
          (!from || p.fromCountry === from) && (!to || p.toCountry === to)
      ),
    [parcels, from, to]
  );

  function handleOffer(parcel: ParcelRequest) {
    const session = getSession();
    if (!session) {
      router.push("/auth?next=/parcels");
      return;
    }
    if (!isMember()) {
      router.push("/pricing");
      return;
    }
    const myTrip = getTrips().find((t) => t.travelerName === session.name);
    requestMatch(myTrip?.id ?? "pending", parcel.id);
    setToast(`Offer sent to ${parcel.senderName}. Track it in your dashboard.`);
    setTimeout(() => setToast(""), 4000);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-[var(--forest)]">Parcel requests</h1>
      <p className="mt-1 text-sm text-[#5c6b63]">
        Travelling soon? Earn from your spare luggage space.
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
        {filtered.map((p) => (
          <ParcelCard key={p.id} parcel={p} onOffer={handleOffer} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card mt-6 p-10 text-center text-sm text-[#5c6b63]">
          No parcel requests on this route yet.{" "}
          <a href="/post/trip" className="font-semibold text-[var(--forest)] underline">
            Post your trip
          </a>{" "}
          so senders can find you.
        </div>
      )}
    </div>
  );
}
