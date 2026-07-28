"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  MessageSquareQuote,
  Package,
  Plane,
  ShieldCheck,
  Star,
} from "lucide-react";
import TripCard from "@/components/TripCard";
import ParcelCard from "@/components/ParcelCard";
import Avatar from "@/components/ui/Avatar";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import Stars from "@/components/ui/Stars";
import EmptyState from "@/components/ui/EmptyState";
import Toast from "@/components/ui/Toast";
import {
  getTrips,
  getParcels,
  getMatches,
  getReviews,
  requestMatch,
} from "@/lib/store";
import { fetchSession } from "@/lib/auth";
import { useContactGate } from "@/lib/useContactGate";
import { buildPersonProfile, PersonProfile } from "@/lib/people";
import { ParcelRequest, Trip } from "@/lib/types";

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-10" aria-hidden>
      <div className="h-4 w-32 rounded-full bg-sand-deep" />
      <div className="card mt-6 flex gap-5 p-6 sm:p-8">
        <div className="h-14 w-14 shrink-0 rounded-full bg-sand-deep" />
        <div className="flex-1 space-y-3">
          <div className="h-9 w-56 rounded-full bg-sand-deep" />
          <div className="h-4 w-72 rounded-full bg-sand-deep" />
        </div>
      </div>
      <div className="mt-10 h-7 w-40 rounded-full bg-sand-deep" />
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div className="card h-52" />
        <div className="card h-52" />
      </div>
    </div>
  );
}

export default function PersonProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const gate = useContactGate();
  const [person, setPerson] = useState<PersonProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const { slug } = params;

  useEffect(() => {
    setPerson(
      buildPersonProfile(slug, {
        trips: getTrips(),
        parcels: getParcels(),
        matches: getMatches(),
        reviews: getReviews(),
      })
    );
    setReady(true);
  }, [slug]);

  async function handleRequest(trip: Trip) {
    if (!(await gate())) return;
    const session = await fetchSession();
    const myParcel = getParcels().find((p) => p.senderName === session?.name);
    requestMatch(trip.id, myParcel?.id ?? "pending");
    setRequestedIds((prev) => new Set(prev).add(trip.id));
    setToast(`Request sent to ${trip.travelerName}. Track it in your dashboard.`);
  }

  async function handleOffer(parcel: ParcelRequest) {
    if (!(await gate())) return;
    const session = await fetchSession();
    const myTrip = getTrips().find((t) => t.travelerName === session?.name);
    requestMatch(myTrip?.id ?? "pending", parcel.id);
    setRequestedIds((prev) => new Set(prev).add(parcel.id));
    setToast(`Offer sent to ${parcel.senderName}. Track it in your dashboard.`);
  }

  if (!ready) return <ProfileSkeleton />;

  if (!person) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="No profile found"
          body="Nobody by that name has posted a trip or a parcel request. They may have taken their listing down."
        >
          <Link href="/trips" className="btn-primary">
            Find a traveller
          </Link>
          <Link href="/parcels" className="btn-ghost">
            Browse parcel requests
          </Link>
        </EmptyState>
      </div>
    );
  }

  const isTraveller = person.upcomingTrips.length > 0 || person.deliveries > 0;
  const backHref = isTraveller ? "/trips" : "/parcels";
  const backLabel = isTraveller ? "All travellers" : "All parcel requests";
  const joined = new Date(person.joinedAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-forest hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden />
        {backLabel}
      </Link>

      <header className="card mt-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={person.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
                {person.name}
              </h1>
              {person.verified ? (
                <VerifiedBadge />
              ) : (
                <span className="inline-flex items-center rounded-full border border-line px-2.5 py-1 text-xs font-medium text-faint">
                  Unverified
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              {person.rating !== null ? (
                <span className="flex items-center gap-1.5">
                  <Star
                    size={15}
                    strokeWidth={2}
                    className="shrink-0 fill-gold text-gold-deep"
                    aria-hidden
                  />
                  <span className="font-semibold text-ink">
                    {person.rating.toFixed(1)}
                  </span>
                  <span>
                    ·{" "}
                    {person.deliveries === 1
                      ? "1 delivery"
                      : `${person.deliveries} deliveries`}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Package size={15} strokeWidth={2} className="shrink-0" aria-hidden />
                  Sends parcels · has not carried yet
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <CalendarDays size={15} strokeWidth={2} className="shrink-0" aria-hidden />
                On Kifurushi since {joined}
              </span>
            </div>

            <p className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-faint">
              <ShieldCheck size={14} strokeWidth={2} className="shrink-0" aria-hidden />
              Meeting in person? Read the{" "}
              <Link
                href="/safety"
                className="font-semibold text-forest underline underline-offset-2"
              >
                handover checklist
              </Link>{" "}
              first.
            </p>
          </div>
        </div>
      </header>

      {person.upcomingTrips.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-forest md:text-3xl">
            <Plane
              size={22}
              strokeWidth={2}
              className="shrink-0 rotate-45 text-clay"
              aria-hidden
            />
            Upcoming trips
          </h2>
          <p className="mt-1 text-sm text-muted">
            {person.upcomingTrips.length === 1
              ? "1 route with space left."
              : `${person.upcomingTrips.length} routes with space left.`}
          </p>
          <div className="mt-4 grid items-stretch gap-5 sm:grid-cols-2">
            {person.upcomingTrips.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                onRequest={handleRequest}
                requested={requestedIds.has(t.id)}
              />
            ))}
          </div>
        </section>
      )}

      {person.openParcels.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-forest md:text-3xl">
            <Package size={22} strokeWidth={2} className="shrink-0 text-clay" aria-hidden />
            Open parcel requests
          </h2>
          <p className="mt-1 text-sm text-muted">
            {person.openParcels.length === 1
              ? "1 parcel waiting for a traveller."
              : `${person.openParcels.length} parcels waiting for a traveller.`}
          </p>
          <div className="mt-4 grid items-stretch gap-5 sm:grid-cols-2">
            {person.openParcels.map((p) => (
              <ParcelCard
                key={p.id}
                parcel={p}
                onOffer={handleOffer}
                requested={requestedIds.has(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      {person.upcomingTrips.length === 0 && person.openParcels.length === 0 && (
        <div className="mt-10">
          <EmptyState
            title="Nothing posted right now"
            body={`${person.name} has no upcoming trips or open parcel requests. Check back, or browse everyone else travelling your route.`}
          >
            <Link href="/trips" className="btn-primary">
              Find a traveller
            </Link>
          </EmptyState>
        </div>
      )}

      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-forest md:text-3xl">
          <MessageSquareQuote
            size={22}
            strokeWidth={2}
            className="shrink-0 text-clay"
            aria-hidden
          />
          Reviews
        </h2>
        <p className="mt-1 text-sm text-muted">
          Written by the people on the other end of a completed delivery.
          Reviews are public and can&apos;t be edited.
        </p>

        {person.reviews.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {person.reviews.map((r) => (
              <li key={r.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={r.authorName} size="sm" />
                    <span className="truncate text-sm font-semibold text-ink">
                      {r.authorName}
                    </span>
                  </div>
                  <Stars rating={r.rating} size="sm" />
                </div>
                {r.comment && (
                  <blockquote className="mt-3 border-l-2 border-line-strong pl-3 text-sm text-ink">
                    “{r.comment}”
                  </blockquote>
                )}
                <p className="mt-2 text-xs text-faint">
                  {new Date(r.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="No reviews yet"
              body={`Nobody has completed a delivery with ${person.name} on Kifurushi yet. Ratings shown above come from their delivery history.`}
            />
          </div>
        )}
      </section>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
