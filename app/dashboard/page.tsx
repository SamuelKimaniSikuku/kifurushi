"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Gift, Hand, Package, Plane, Star,
} from "lucide-react";
import {
  fetchSession, fetchMembership, signOut, Session, Membership,
} from "@/lib/auth";
import {
  fetchMoneyTotals, fetchMyMatches, fetchVerification, isAdmin, MatchDetail,
  MoneyTotals, VerificationState,
} from "@/lib/db";
import NextSteps from "@/components/NextSteps";
import DeliveryInbox from "@/components/DeliveryInbox";
import { inboxCopy } from "@/lib/locales/inbox";
import RatingsFeedback from "@/components/RatingsFeedback";
import AccountOverview from "@/components/AccountOverview";
import { useLang } from "@/lib/i18n";
import { readEmailAuthReturn, signInHref } from "@/lib/routes";
import { notifyAttentionChanged } from "@/lib/attentionEvents";
import { reviewCopy } from "@/lib/locales/reviews";

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
  const { lang } = useLang();
  const reviewText = reviewCopy[lang];
  const inboxText = inboxCopy[lang];
  const [section, setSection] = useState<"deliveries" | "ratings" | "account">("deliveries");
  const [session, setSession] = useState<Session | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [verification, setVerification] = useState<VerificationState | null>(null);
  // Administrative tools stay grouped inside Account and are only visible to reviewers.
  const [reviewer, setReviewer] = useState(false);
  const [money, setMoney] = useState<MoneyTotals | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoadError(false);
    setReady(false);
    (async () => {
      const s = await fetchSession();
      if (!mounted) return;
      if (!s) {
        router.replace(signInHref(`/dashboard${window.location.search}${window.location.hash}`));
        return;
      }
      const returnTo = readEmailAuthReturn(window.location.search);
      if (returnTo) {
        if (new URL(returnTo, window.location.origin).pathname !== "/dashboard") {
          router.replace(returnTo);
          return;
        }
        // Keep the mounted dashboard in sync when only its query/hash changes.
        window.history.replaceState(window.history.state, "", returnTo);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
      setSession(s);
      const [m, ms, v, admin, totals] = await Promise.all([
        fetchMyMatches(),
        fetchMembership().catch(() => null),
        fetchVerification().catch(() => null),
        isAdmin().catch(() => false),
        fetchMoneyTotals().catch(() => null),
      ]);
      if (!mounted) return;
      setMatches(m);
      setMembership(ms);
      setVerification(v);
      setReviewer(admin);
      setMoney(totals);
      setReady(true);
    })().catch(() => { if (mounted) setLoadError(true); });
    return () => {
      mounted = false;
    };
  }, [router, loadAttempt]);

  useEffect(() => {
    const syncSection = () => {
      const hash = window.location.hash.slice(1);
      setSection(hash === "ratings" || hash.startsWith("review-") ? "ratings" :
        hash === "account" || hash === "whatsapp" ? "account" : "deliveries");
    };
    syncSection();
    window.addEventListener("hashchange", syncSection);
    return () => window.removeEventListener("hashchange", syncSection);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const hash = window.location.hash.slice(1);
    if (section === "deliveries") {
      // Old dashboard links may restore a scroll position several cards down.
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
    }
    if (hash === "whatsapp" || hash.startsWith("review-")) {
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }));
    }
  }, [ready, section]);

  if (loadError) return <div className="mx-auto max-w-4xl px-4 py-10">
    <section id="ratings" className="card p-6">
      <h1 className="font-display text-2xl font-bold text-forest">{reviewText.title}</h1>
      <p role="alert" className="mt-3 text-sm text-danger">{reviewText.dashboardError}</p>
      <button type="button" className="btn-primary mt-4" onClick={() => setLoadAttempt((n) => n + 1)}>{reviewText.retry}</button>
    </section>
  </div>;

  if (!ready || !session) return <DashboardSkeleton />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
            Karibu, {session.name.split(" ")[0]}
            <Hand size={20} strokeWidth={2} className="text-clay" aria-hidden />
          </h1>
          <p className="mt-1 text-sm text-muted">
            {session.email}
            {membership?.status === "member" ? (
              membership.isTrial ? (
                // Full access, nothing paid — say which, and when it ends.
                <Link
                  href="/pricing"
                  className="ml-2 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 align-middle text-[11px] font-bold text-forest"
                >
                  <Gift size={12} strokeWidth={2} aria-hidden />
                  {!membership.expires ? (
                    // Open-ended: the launch period, or a trial that hasn't
                    // started counting. Either way there is no date to show.
                    <>Free during launch</>
                  ) : (
                    <>
                      Free month · ends{" "}
                      {new Date(membership.expires).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </>
                  )}
                </Link>
              ) : (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-forest px-2.5 py-0.5 align-middle text-[11px] font-bold text-white">
                  <Star size={12} strokeWidth={2} className="fill-gold stroke-gold" aria-hidden />
                  Member
                </span>
              )
            ) : membership ? (
              <Link href="/pricing" className="ml-2 inline-flex items-center rounded-full bg-sand-deep px-2.5 py-0.5 align-middle text-[11px] font-bold text-forest underline">
                Free plan — join from $5/mo
              </Link>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/post/trip" className="btn-ghost"><Plane size={17} aria-hidden />{inboxText.postTrip}</Link>
          <Link href="/post/parcel" className="btn-primary"><Package size={17} aria-hidden />{inboxText.sendParcel}</Link>
        </div>
      </div>

      <nav aria-label={inboxText.dashboardSections} className="mb-4 mt-5 flex gap-1 overflow-x-auto border-b border-line">
        {(["deliveries", "ratings", "account"] as const).map((item) => <a key={item}
          href={`#${item}`} aria-current={section === item ? "page" : undefined}
          onClick={() => setSection(item)}
          className={`min-h-11 shrink-0 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold ${section === item ? "border-forest text-forest" : "border-transparent text-muted hover:text-forest"}`}>
          {inboxText[item]}
        </a>)}
        <Link href="/dashboard/listings" className="min-h-11 shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold text-muted hover:text-forest">{inboxText.listings}</Link>
      </nav>

      <section id="deliveries" hidden={section !== "deliveries"} className="scroll-mt-24" aria-label={inboxText.deliveries}>
        <NextSteps matches={matches} userId={session.userId} />
        <DeliveryInbox matches={matches} myUserId={session.userId} active={section === "deliveries"}
          onChanged={() => {
            notifyAttentionChanged();
            void fetchMyMatches().then(setMatches).catch(() => setLoadError(true));
          }} />
      </section>

      <div hidden={section !== "ratings"}>
        <RatingsFeedback key={session.userId} matches={matches} myUserId={session.userId} />
      </div>

      <section id="account" hidden={section !== "account"} className="scroll-mt-24" aria-label={inboxText.account}>
        <AccountOverview verification={verification} money={money} reviewer={reviewer} />

        <button className="btn-ghost mt-5" onClick={async () => { await signOut(); router.push("/"); }}>
          {inboxText.signOut}
        </button>
      </section>
    </div>
  );
}
