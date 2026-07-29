"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import ParcelCard from "@/components/ParcelCard";
import CountrySelect from "@/components/CountrySelect";
import Toast from "@/components/ui/Toast";
import SkeletonCard from "@/components/ui/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import {
  fetchParcels, fetchMyOpenTrips, requestMatch, fetchAttention, type Attention,
} from "@/lib/db";
import { useContactGate } from "@/lib/useContactGate";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/auth";
import { ParcelRequest } from "@/lib/types";

export default function ParcelsPage() {
  const router = useRouter();
  const gate = useContactGate();
  const t = useT();
  const { session } = useSession();
  const [attention, setAttention] = useState<Attention | null>(null);
  const [parcels, setParcels] = useState<ParcelRequest[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session) fetchAttention().then(setAttention).catch(() => {});
  }, [session]);

  useEffect(() => {
    fetchParcels()
      .then(setParcels)
      .catch(() => setToast("Could not load parcel requests — please refresh."))
      .finally(() => setLoaded(true));
  }, []);

  const filtered = useMemo(
    () =>
      parcels.filter(
        (p) =>
          (!from || p.fromCountry === from) && (!to || p.toCountry === to)
      ),
    [parcels, from, to]
  );

  function clear() {
    setFrom("");
    setTo("");
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  async function handleOffer(parcel: ParcelRequest) {
    if (!(await gate())) return;
    try {
      // An offer links this parcel to one of YOUR trips — post one first.
      const [myTrip] = await fetchMyOpenTrips();
      if (!myTrip) {
        router.push("/post/trip?then=offer");
        return;
      }
      await requestMatch(myTrip.id, parcel.id);
      setRequestedIds((prev) => new Set(prev).add(parcel.id));
      setToast(`Offer sent to ${parcel.senderName}. Track it in your dashboard.`);
    } catch {
      setToast("Could not send the offer — please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        {t.browse.parcelsTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">{t.browse.parcelsSub}</p>

      <div className="card mt-6 grid grid-cols-1 items-end gap-3 p-4 sm:grid-cols-[1fr_auto_1fr_auto] sm:p-5">
        <div>
          <label className="field-label" htmlFor="parcels-from">
            From
          </label>
          <CountrySelect
            id="parcels-from"
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
          <label className="field-label" htmlFor="parcels-to">
            To
          </label>
          <CountrySelect
            id="parcels-to"
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
            {filtered.length === 1 ? " parcel request found" : " parcel requests found"}
          </p>

          {filtered.length > 0 ? (
            <div className="mt-4 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ParcelCard
                  key={p.id}
                  parcel={p}
                  onOffer={handleOffer}
                  requested={requestedIds.has(p.id)}
                  mine={!!session && p.senderId === session.userId}
                  pending={attention?.byParcel[p.id] ?? 0}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No parcel requests on this route yet"
                body="Try a different route or clear your filters — or post your trip so senders can find you."
              >
                <Link href="/post/trip" className="btn-primary">
                  Post your trip
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
