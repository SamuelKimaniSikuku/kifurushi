"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hand, IdCard, Package, PackageSearch, Plane, Star } from "lucide-react";
import {
  fetchSession, fetchMembership, signOut, Session, Membership,
} from "@/lib/auth";
import {
  fetchMyMatches, fetchVerification, MatchDetail, VerificationState,
} from "@/lib/db";
import MatchCard from "@/components/MatchCard";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-10" aria-hidden>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-9 w-64 rounded-full bg-sand-deep" />
          <div className="h-4 w-48 rounded-full bg-sand-deep" />
        </div>
        <div className="h-10 w-24 rounded-xl bg-sand-deep" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="h-11 w-11 rounded-xl bg-sand-deep" />
            <div className="mt-3 h-4 w-28 rounded-full bg-sand-deep" />
            <div className="mt-2 h-3 w-36 rounded-full bg-sand-deep" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await fetchSession();
      if (!mounted) return;
      if (!s) {
        router.replace("/auth?next=/dashboard");
        return;
      }
      setSession(s);
      const [m, ms, v] = await Promise.all([
        fetchMyMatches().catch(() => []),
        fetchMembership(),
        fetchVerification().catch(() => null),
      ]);
      if (!mounted) return;
      setMatches(m);
      setMembership(ms);
      setVerification(v);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready || !session) return <DashboardSkeleton />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
            Karibu, {session.name.split(" ")[0]}
            <Hand size={20} strokeWidth={2} className="text-clay" aria-hidden />
          </h1>
          <p className="mt-1 text-sm text-muted">
            {session.email}
            {membership?.status === "member" ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-forest px-2.5 py-0.5 align-middle text-[11px] font-bold text-white">
                <Star size={12} strokeWidth={2} className="fill-gold stroke-gold" aria-hidden />
                Member
              </span>
            ) : membership ? (
              <Link href="/pricing" className="ml-2 inline-flex items-center rounded-full bg-sand-deep px-2.5 py-0.5 align-middle text-[11px] font-bold text-forest underline">
                Free plan — join from $5/mo
              </Link>
            ) : null}
          </p>
        </div>
        <button
          className="btn-ghost"
          onClick={async () => { await signOut(); router.push("/"); }}
        >
          Sign out
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link href="/post/trip" className="card card-lift p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-sand-deep text-forest" aria-hidden>
            <Plane size={20} strokeWidth={2} />
          </span>
          <div className="mt-3 text-base font-semibold">Post a trip</div>
          <div className="mt-0.5 text-xs text-muted">Earn from spare kilos</div>
        </Link>
        <Link href="/post/parcel" className="card card-lift p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-sand-deep text-forest" aria-hidden>
            <Package size={20} strokeWidth={2} />
          </span>
          <div className="mt-3 text-base font-semibold">Send a parcel</div>
          <div className="mt-0.5 text-xs text-muted">Get matched in hours</div>
        </Link>
        {verification?.status === "verified" ? (
          <div className="card border-success bg-success-bg p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-success" aria-hidden>
              <IdCard size={20} strokeWidth={2} />
            </span>
            <div className="mt-3 flex items-center gap-2 text-base font-semibold">
              Verification
              <VerifiedBadge small />
            </div>
            <div className="mt-0.5 text-xs text-muted">
              Your badge shows on everything you post
            </div>
          </div>
        ) : verification?.status === "pending" ||
          verification?.status === "in_review" ? (
          // Still waiting either way, but a session parked with a human is a
          // different promise from one the machine is still crunching.
          <Link href="/verify" className="card card-lift p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sand-deep text-forest" aria-hidden>
              <IdCard size={20} strokeWidth={2} />
            </span>
            <div className="mt-3 text-base font-semibold">
              {verification.status === "in_review"
                ? "Verification under review"
                : "Verification pending"}
            </div>
            <div className="mt-0.5 text-xs text-muted">
              {verification.status === "in_review"
                ? "A person is checking your ID — see details"
                : "Your ID check is running — usually minutes"}
            </div>
          </Link>
        ) : (
          <Link href="/verify" className="card card-lift p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sand-deep text-forest" aria-hidden>
              <IdCard size={20} strokeWidth={2} />
            </span>
            <div className="mt-3 text-base font-semibold">Get verified →</div>
            <div className="mt-0.5 text-xs text-muted">
              Not verified yet — required before your first carry
            </div>
          </Link>
        )}
      </div>

      <h2 className="mt-10 font-display text-2xl font-bold tracking-tight text-forest md:text-3xl">Your deliveries</h2>

      {matches.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center px-6 py-12 text-center">
          <span
            aria-hidden
            className="grid h-12 w-12 place-items-center rounded-full bg-sand-deep text-forest"
          >
            <PackageSearch size={20} strokeWidth={2} />
          </span>
          <p className="mt-4 max-w-sm text-sm text-muted">
            Nothing in motion yet. Request a traveller from{" "}
            <Link href="/trips" className="font-semibold text-forest underline">Find a traveller</Link>{" "}
            or offer to carry from{" "}
            <Link href="/parcels" className="font-semibold text-forest underline">Parcel requests</Link>.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              myUserId={session.userId}
              // Live deliveries open; finished ones fold away to keep the
              // dashboard short.
              defaultOpen={
                !["released", "declined", "cancelled"].includes(m.status)
              }
              onChanged={() =>
                fetchMyMatches().then(setMatches).catch(() => {})
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
