"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plane, RefreshCw } from "lucide-react";
import ParcelCard from "@/components/ParcelCard";
import BrowseFilters from "@/components/BrowseFilters";
import ListingError from "@/components/ListingError";
import { postHref } from "@/lib/routes";
import { useBrowseFilters } from "@/lib/useBrowseFilters";
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

function ParcelsContent() {
  const router = useRouter();
  const gate = useContactGate();
  const t = useT();
  const { session } = useSession();
  const [attention, setAttention] = useState<Attention | null>(null);
  const [parcels, setParcels] = useState<ParcelRequest[]>([]);
  const browse = useBrowseFilters("/parcels");
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
    fetchParcels()
      .then((items) => { if (active) setParcels(items); })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [reload]);

  const filtered = useMemo(() =>
    parcels.filter((item) =>
      (!from || item.fromCountry === from) &&
      (!to || item.toCountry === to) &&
      (!date || item.neededBy >= date)
    ).sort((a, b) => sort === "budget"
      ? b.budgetUsd - a.budgetUsd || a.neededBy.localeCompare(b.neededBy)
      : a.neededBy.localeCompare(b.neededBy)),
    [parcels, from, to, date, sort]
  );

  async function handleOffer(parcel: ParcelRequest) {
    try {
      if (!(await gate())) return;
      // An offer joins one of MY trips to this parcel — same route only.
      // Offer one of my trips only if it fits: same corridor, departing
      // before the parcel is needed, with room for its weight.
      const mine = await fetchMyOpenTrips();
      const today = new Date().toISOString().slice(0, 10);
      const sameRoute = mine.find(
        (tr) =>
          tr.fromCountry === parcel.fromCountry &&
          tr.toCountry === parcel.toCountry &&
          tr.date >= today &&
          tr.date <= parcel.neededBy &&
          tr.kg >= parcel.weightKg
      );
      if (!sameRoute) {
        setToast(t.browse.noFittingTrip);
        // A trip needs a flight date, so send them to the form with the
        // route already filled in.
        const q = new URLSearchParams({
          fromCountry: parcel.fromCountry,
          fromCity: parcel.fromCity,
          toCountry: parcel.toCountry,
          toCity: parcel.toCity,
        });
        router.push(`/post/trip?${q.toString()}`);
        return;
      }
      await requestMatch(sameRoute.id, parcel.id);
      setRequestedIds((prev) => new Set(prev).add(parcel.id));
      setToast(`Offer sent to ${parcel.senderName} — you can chat with them from your dashboard now.`);
    } catch {
      setToast("Could not send the offer — please try again.");
    }
  }


  // A shared link (?open=<id>) lands scrolled to that exact listing,
  // briefly ringed so the eye finds it in the grid.
  useEffect(() => {
    if (!loaded) return;
    const openId = new URLSearchParams(window.location.search).get("open");
    if (!openId || !/^[0-9a-f-]{36}$/.test(openId)) return;
    const el = document.getElementById(`listing-${openId}`);
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    el.classList.add("ring-2", "ring-leaf", "ring-offset-4", "ring-offset-sand");
    const timer = setTimeout(
      () => el.classList.remove("ring-2", "ring-leaf", "ring-offset-4", "ring-offset-sand"),
      4000
    );
    return () => clearTimeout(timer);
  }, [loaded]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><p className="section-eyebrow">{x.travel}</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">{t.browse.parcelsTitle}</h1><p className="mt-3 max-w-2xl text-base text-muted">{t.browse.parcelsSub}</p></div>
        <Link href={postHref("trip", { from, to })} className="btn-accent"><Plane size={18} aria-hidden />{x.postTrip}</Link>
      </div>
      <BrowseFilters kind="parcels" {...browse} />

      {!loaded ? (
        <div aria-busy="true" aria-label={x.loading} className="mt-6 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : loadError ? <ListingError retry={() => setReload((count) => count + 1)} /> : (
        <>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
            <div><p aria-live="polite" className="text-base font-semibold">{x.resultParcels(filtered.length)}</p><p className="mt-1 text-sm text-muted">{x.usd}</p></div>
            <div className="flex items-end gap-2">
              <div><label htmlFor="parcels-sort" className="field-label">{x.sort}</label><select id="parcels-sort" className="field" disabled={browse.pending} value={sort === "budget" ? sort : "date"} onChange={(e) => browse.update({ sort: e.target.value as "date" | "budget" })}><option value="date">{x.soonest}</option><option value="budget">{x.budget}</option></select></div>
              <button type="button" onClick={() => setReload((count) => count + 1)} className="btn-ghost h-12 w-12 px-0" aria-label={x.retry}><RefreshCw size={17} aria-hidden /></button>
            </div>
          </div>

          {filtered.length > 0 && <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-line bg-white px-5 py-4"><span className="font-display text-2xl font-bold text-forest">${filtered.reduce((sum, parcel) => sum + parcel.budgetUsd, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span><span className="text-sm font-semibold">{x.budgetsLabel}</span><p className="w-full text-sm text-muted">{x.budgetsNote}</p></div>}

          {filtered.length > 0 ? (
            <div className="mt-4 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <div key={p.id} id={`listing-${p.id}`} className="min-w-0 rounded-3xl">
                  <ParcelCard
                    parcel={p}
                    onOffer={handleOffer}
                    requested={requestedIds.has(p.id)}
                    mine={!!session && p.senderId === session.userId}
                    pending={attention?.byParcel[p.id] ?? 0}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title={x.emptyParcels}
                body={x.emptyParcelsBody}
              >
                <Link href={postHref("trip", { from, to })} className="btn-primary">
                  {x.postTrip}
                </Link>
                <button type="button" className="btn-ghost" onClick={browse.clear}>
                  {x.clear}
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

export default function ParcelsPage() {
  return <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10"><SkeletonCard /></div>}><ParcelsContent /></Suspense>;
}
