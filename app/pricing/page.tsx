"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  HeartHandshake,
  Lock,
  Plane,
  RefreshCcw,
  Wallet,
  X, Gift,} from "lucide-react";
import {
  fetchSession, fetchMembership, joinMembership, startCheckout,
  BILLING_MODE, BillingPlan, Membership,
} from "@/lib/auth";
import { useT, type Dict } from "@/lib/i18n";

const PLAN_PRICES: { key: BillingPlan; price: string; period: string }[] = [
  { key: "monthly", price: "$5", period: "/month" },
  { key: "yearly", price: "$29", period: "/year" },
];

function buildPlans(t: Dict) {
  return PLAN_PRICES.map((p) => ({
    ...p,
    label: p.key === "monthly" ? t.pricing.monthly : t.pricing.yearly,
    note: p.key === "monthly" ? t.pricing.monthlyNote : t.pricing.yearlyNote,
    badge: p.key === "yearly" ? t.pricing.bestValue : undefined,
  }));
}

function ContactBanner() {
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const t = useT();

  const reasonMessages: Record<string, string> = {
    contact: t.pricing.reasonContact,
    post: t.pricing.reasonPost,
  };
  const checkoutMessages: Record<string, string> = {
    success: t.pricing.checkoutSuccess,
    cancelled: t.pricing.checkoutCancelled,
  };
  const message =
    reasonMessages[params.get("reason") ?? ""] ??
    checkoutMessages[params.get("checkout") ?? ""];
  if (!message || dismissed) return null;

  return (
    <div className="card mb-8 flex items-center gap-3 p-4" role="status">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand-deep">
        <Lock className="h-4 w-4 text-forest" strokeWidth={2} />
      </span>
      <p className="flex-1 text-sm text-ink">{message}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t.pricing.dismiss}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-sand-deep hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((f) => (
        <li key={f} className="flex gap-2.5 text-sm text-ink">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2} />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const t = useT();
  const PLANS = buildPlans(t);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [joining, setJoining] = useState<BillingPlan | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    fetchMembership().then(setMembership);
    // Back from Stripe Checkout: the webhook activates the membership a
    // beat later — poll briefly so the page catches up on its own.
    if (new URLSearchParams(window.location.search).get("checkout") === "success") {
      let tries = 0;
      const t = setInterval(async () => {
        const m = await fetchMembership();
        setMembership(m);
        if (m.status === "member" || ++tries >= 10) clearInterval(t);
      }, 2000);
      return () => clearInterval(t);
    }
  }, []);

  async function join(plan: BillingPlan) {
    setJoinError(null);
    if (!(await fetchSession())) {
      router.push("/auth?next=/pricing");
      return;
    }
    setJoining(plan);
    try {
      if (BILLING_MODE === "stripe") {
        // Hosted Stripe Checkout; the webhook activates the membership.
        window.location.href = await startCheckout(plan);
        return;
      }
      setMembership(await joinMembership(plan));
    } catch {
      setJoinError(t.pricing.joinError);
    } finally {
      setJoining(null);
    }
  }

  // A trial gives full access but is not a subscription: both plans must stay
  // purchasable, or the member hits the paywall in a month with no way out.
  const isTrial = membership?.status === "member" && membership.isTrial;
  const isMember = membership?.status === "member" && !membership.isTrial;
  const currentPlan: BillingPlan = membership?.plan ?? "yearly";
  const currentLabel =
    currentPlan === "monthly" ? t.pricing.planMonthly : t.pricing.planYearly;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Suspense fallback={null}>
        <ContactBanner />
      </Suspense>

      <h1 className="text-center font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        {t.pricing.heroTitle}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-muted">
        {t.pricing.heroSub}
      </p>

      {isTrial && (
        <div className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-2xl border border-gold bg-gold/10 p-4">
          <Gift className="mt-0.5 h-5 w-5 shrink-0 text-forest" strokeWidth={2} aria-hidden />
          <p className="text-sm leading-relaxed text-ink">
            {t.pricing.launchBanner}
          </p>
        </div>
      )}

      <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
        {/* Free */}
        <div className="card flex flex-col p-7">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">
            {t.pricing.free}
          </div>
          <div className="mt-2 font-display text-4xl font-extrabold text-ink">
            $0
          </div>
          <p className="mt-1 text-sm text-muted">{t.pricing.freeTag}</p>
          <FeatureList items={t.pricing.freeFeatures} />
          <div className="mt-auto pt-7">
            <Link href="/trips" className="btn-ghost w-full">
              {t.pricing.browseTrips}
            </Link>
          </div>
        </div>

        {/* Monthly + Yearly */}
        {PLANS.map((p) => {
          const highlighted = p.key === "yearly";
          return (
            <div
              key={p.key}
              className={`card relative flex flex-col p-7 ${
                highlighted ? "border-2 border-forest" : ""
              }`}
            >
              {p.badge && (
                <div className="-mt-10 mb-2 flex justify-center">
                  <span className="rounded-full bg-forest px-4 py-1.5 text-xs font-semibold text-white">
                    {p.badge}
                  </span>
                </div>
              )}
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                {p.label}
              </div>
              <div className="mt-2 font-display text-4xl font-extrabold text-forest">
                {p.price}
                <span className="font-body text-lg font-semibold text-muted">
                  {p.period}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{p.note}</p>

              <FeatureList items={t.pricing.memberFeatures} />

              <div className="mt-auto pt-7">
                {isMember ? (
                  p.key === currentPlan ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-success-bg px-4 py-3 text-center text-sm font-semibold text-success">
                      <BadgeCheck className="h-5 w-5 shrink-0" strokeWidth={2} />
                      <span>
                        {membership?.since
                          ? t.pricing.yourPlanSince(
                              new Date(membership.since).toLocaleDateString(
                                undefined,
                                { month: "short", year: "numeric" }
                              )
                            )
                          : t.pricing.yourPlan}
                      </span>
                    </div>
                  ) : (
                    <p className="py-3 text-center text-sm text-muted">
                      {t.pricing.onPlan(currentLabel)}
                    </p>
                  )
                ) : (
                  <>
                    <button
                      onClick={() => join(p.key)}
                      disabled={joining !== null}
                      className={`${highlighted ? "btn-accent btn-lg" : "btn-primary"} w-full`}
                    >
                      {joining === p.key
                        ? t.pricing.activating
                        : t.pricing.joinFor(`${p.price}${p.period}`)}
                    </button>
                    {joinError && (
                      <p role="alert" className="mt-3 text-center text-xs text-danger">
                        {joinError}
                      </p>
                    )}
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-faint">
                      <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      {t.pricing.secureCheckout}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* What the membership fee is — and is not */}
      <div className="mt-8 rounded-2xl bg-forest px-5 py-5 text-white sm:px-7">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Plane className="h-4 w-4 shrink-0 text-gold" strokeWidth={2} />
          {t.pricing.bandTitle}
        </div>
        <div className="mt-2 grid gap-2 text-sm text-white/80 md:grid-cols-3 md:gap-6">
          <div>
            <b className="text-white">{t.pricing.bandCell1a}</b>{" "}
            {t.pricing.bandCell1b}
          </div>
          <div>
            {t.pricing.bandCell2a}{" "}
            <b className="text-white">{t.pricing.bandCell2b}</b>{" "}
            {t.pricing.bandCell2c}
          </div>
          <div className="font-semibold text-gold">
            {t.pricing.bandCell3}
          </div>
        </div>
      </div>

      {/* Why one price */}
      <div className="card mt-8 grid gap-8 p-7 md:grid-cols-3 md:gap-6">
        <div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-sand-deep">
            <Wallet className="h-5 w-5 text-forest" strokeWidth={2} />
          </div>
          <div className="mt-3 text-base font-semibold text-ink">{t.pricing.whyCards[0].title}</div>
          <p className="mt-1 text-sm text-muted">{t.pricing.whyCards[0].body}</p>
        </div>
        <div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-sand-deep">
            <RefreshCcw className="h-5 w-5 text-forest" strokeWidth={2} />
          </div>
          <div className="mt-3 text-base font-semibold text-ink">{t.pricing.whyCards[1].title}</div>
          <p className="mt-1 text-sm text-muted">{t.pricing.whyCards[1].body}</p>
        </div>
        <div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-sand-deep">
            <HeartHandshake className="h-5 w-5 text-forest" strokeWidth={2} />
          </div>
          <div className="mt-3 text-base font-semibold text-ink">{t.pricing.whyCards[2].title}</div>
          <p className="mt-1 text-sm text-muted">{t.pricing.whyCards[2].body}</p>
        </div>
      </div>

      {/* Demo: joining is instant and free. Production wires this to
          Stripe Billing, Paystack or Flutterwave subscriptions. */}
    </div>
  );
}
