"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getSession, signOut, getMatches, getTrips, getParcels, getVerification,
  getMembership, Session,
} from "@/lib/store";
import { Match } from "@/lib/types";
import { label } from "@/lib/countries";
import MatchCard from "@/components/MatchCard";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/auth?next=/dashboard");
      return;
    }
    setSession(s);
    setMatches(getMatches());
    setReady(true);
  }, [router]);

  if (!ready || !session) return null;

  const trips = getTrips();
  const parcels = getParcels();

  function describe(m: Match): string {
    const trip = trips.find((t) => t.id === m.tripId);
    const parcel = parcels.find((p) => p.id === m.parcelId);
    if (trip) return `${label(trip.fromCountry)} → ${label(trip.toCountry)} with ${trip.travelerName}`;
    if (parcel) return `${label(parcel.fromCountry)} → ${label(parcel.toCountry)} for ${parcel.senderName}`;
    return "Pending match";
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--forest)]">
            Karibu, {session.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-[#5c6b63]">
            {session.email}
            {getMembership().status === "member" ? (
              <span className="ml-2 rounded-full bg-[var(--forest)] px-2.5 py-0.5 text-[11px] font-bold text-white">
                ⭐ Member
              </span>
            ) : (
              <Link href="/pricing" className="ml-2 rounded-full bg-[var(--sand-deep)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--forest)] underline">
                Free plan — join for $29/yr
              </Link>
            )}
          </p>
        </div>
        <button
          className="btn-ghost"
          onClick={() => { signOut(); router.push("/"); }}
        >
          Sign out
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link href="/post/trip" className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-2xl">✈️</div>
          <div className="mt-2 font-bold">Post a trip</div>
          <div className="text-xs text-[#5c6b63]">Earn from spare kilos</div>
        </Link>
        <Link href="/post/parcel" className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-2xl">📦</div>
          <div className="mt-2 font-bold">Send a parcel</div>
          <div className="text-xs text-[#5c6b63]">Get matched in hours</div>
        </Link>
        {getVerification().status === "verified" ? (
          <div className="card border-emerald-300 bg-emerald-50 p-5">
            <div className="text-2xl">🪪</div>
            <div className="mt-2 flex items-center gap-2 font-bold">
              Verification
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">✓ Verified</span>
            </div>
            <div className="text-xs text-[#5c6b63]">
              Your badge shows on everything you post
            </div>
          </div>
        ) : (
          <Link href="/verify" className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-2xl">🪪</div>
            <div className="mt-2 font-bold">Get verified →</div>
            <div className="text-xs text-[#5c6b63]">
              Not verified yet — required before your first carry
            </div>
          </Link>
        )}
      </div>

      <h2 className="mt-10 text-xl font-extrabold text-[var(--forest)]">Your deliveries</h2>
      <p className="mt-1 text-xs text-[#5c6b63]">
        Demo: use “Advance status” to walk a delivery through the handover flow.
      </p>

      {matches.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-sm text-[#5c6b63]">
          Nothing in motion yet. Request a traveller from{" "}
          <Link href="/trips" className="font-semibold text-[var(--forest)] underline">Find a traveller</Link>{" "}
          or offer to carry from{" "}
          <Link href="/parcels" className="font-semibold text-[var(--forest)] underline">Parcel requests</Link>.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              title={describe(m)}
              authorName={session.name}
              onChanged={() => setMatches(getMatches())}
            />
          ))}
        </div>
      )}
    </div>
  );
}
