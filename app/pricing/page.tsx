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
  X,
} from "lucide-react";
import {
  getSession, getMembership, joinMembership, BillingPlan, Membership,
} from "@/lib/store";

const PLANS: Record<BillingPlan, { price: string; period: string; label: string }> = {
  monthly: { price: "$5", period: "/month", label: "Monthly" },
  yearly: { price: "$29", period: "/year", label: "Yearly" },
};

const FREE_FEATURES = [
  "Browse every trip and parcel request",
  "See traveller ratings and reviews",
  "Receive a parcel — receiving is always free",
  "Track a delivery sent to you, with your delivery code",
];

const MEMBER_FEATURES = [
  "Send parcels — post unlimited requests",
  "Travel & earn — post unlimited trips, keep 100% of your carriage fee",
  "Contact and match with anyone on the platform",
  "ID verification & the ✓ Verified badge",
  "Sealed-handover photo log & one-time delivery codes",
  "Two-way reviews that build your reputation",
  "Dispute support with the full delivery record",
];

function ContactBanner() {
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  if (params.get("reason") !== "contact" || dismissed) return null;

  return (
    <div className="card mb-8 flex items-center gap-3 p-4" role="status">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand-deep">
        <Lock className="h-4 w-4 text-forest" strokeWidth={2} />
      </span>
      <p className="flex-1 text-sm text-ink">
        Membership is needed to contact travellers and senders — one membership
        covers your whole year.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-sand-deep hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [plan, setPlan] = useState<BillingPlan>("yearly");

  useEffect(() => {
    setMembership(getMembership());
  }, []);

  function join() {
    if (!getSession()) {
      router.push("/auth?next=/pricing");
      return;
    }
    setMembership(joinMembership(plan));
  }

  const isMember = membership?.status === "member";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Suspense fallback={null}>
        <ContactBanner />
      </Suspense>

      <h1 className="text-center font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        One membership. Every role.
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-muted">
        Send this month, receive next month, carry when you fly home — one
        account, one price, no commission. Kifurushi never takes a cut of what
        travellers earn.
      </p>

      {/* Billing toggle */}
      <div className="mt-8 flex justify-center">
        <div
          role="group"
          aria-label="Billing period"
          className="inline-flex items-center gap-1 rounded-full border border-line bg-white p-1"
        >
          {(Object.keys(PLANS) as BillingPlan[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPlan(key)}
              aria-pressed={plan === key}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 ${
                plan === key
                  ? "bg-forest text-white"
                  : "text-muted hover:text-forest"
              }`}
            >
              {PLANS[key].label}
              {key === "yearly" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    plan === key ? "bg-gold text-ink" : "bg-sand-deep text-forest"
                  }`}
                >
                  Save 52%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="card p-7">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">Free</div>
          <div className="mt-2 font-display text-4xl font-extrabold text-ink">$0</div>
          <p className="mt-1 text-sm text-muted">Look around, receive, track.</p>
          <ul className="mt-6 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link href="/trips" className="btn-ghost mt-7 w-full">Browse trips</Link>
        </div>

        {/* Member */}
        <div className="card relative border-2 border-forest p-7">
          <div className="-mt-10 mb-2 flex justify-center">
            <span className="rounded-full bg-forest px-4 py-1.5 text-xs font-semibold text-white">
              Pays for itself on parcel #1
            </span>
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Membership</div>
          <div className="mt-2 font-display text-4xl font-extrabold text-forest">
            {PLANS[plan].price}
            <span className="font-body text-lg font-semibold text-muted">
              {PLANS[plan].period}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {plan === "yearly"
              ? "Sender, receiver and traveller — all in one. Or $5/month."
              : "Sender, receiver and traveller — all in one. $29/year saves you $31."}
          </p>

          <div className="mt-5 rounded-xl bg-forest px-4 py-3.5 text-white">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Plane className="h-4 w-4 shrink-0 text-gold" strokeWidth={2} />
              Make money travelling - save on every parcel
            </div>
            <div className="mt-2 space-y-1 text-xs text-white/80">
              <div>
                <b className="text-white">
                  {PLANS[plan].price}{PLANS[plan].period} is for the platform only
                </b>{" "}
                — unlimited parcels, both directions.
              </div>
              <div>The delivery fee you <b className="text-white">negotiate directly with the traveller</b> (typically ~$45 per 5 kg vs $60+ courier). Kifurushi takes no cut.</div>
              <div className="pt-0.5 font-semibold text-gold">5 parcels a year = $150+ saved.</div>
            </div>
          </div>

          <ul className="mt-5 space-y-3">
            {MEMBER_FEATURES.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {isMember ? (
            <div className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-success-bg px-4 py-3 text-center text-sm font-semibold text-success">
              <BadgeCheck className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span>
                You&apos;re a member{membership?.since && ` since ${new Date(membership.since).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`}
              </span>
            </div>
          ) : (
            <>
              <button onClick={join} className="btn-accent btn-lg mt-7 w-full">
                Join for {PLANS[plan].price}{PLANS[plan].period}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-faint">
                <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                Secure checkout - cancel anytime
              </p>
            </>
          )}
        </div>
      </div>

      {/* Why one price */}
      <div className="card mt-10 grid gap-8 p-7 md:grid-cols-3 md:gap-6">
        <div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-sand-deep">
            <Wallet className="h-5 w-5 text-forest" strokeWidth={2} />
          </div>
          <div className="mt-3 text-base font-semibold text-ink">Cheaper than one courier shipment</div>
          <p className="mt-1 text-sm text-muted">
            A 5 kg parcel London → Lagos costs $50–80 with a courier. One year of
            Kifurushi costs $29 (or $5/month) — and a traveller charges you
            around $45.
          </p>
        </div>
        <div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-sand-deep">
            <RefreshCcw className="h-5 w-5 text-forest" strokeWidth={2} />
          </div>
          <div className="mt-3 text-base font-semibold text-ink">Roles switch, price doesn&apos;t</div>
          <p className="mt-1 text-sm text-muted">
            The same person sends in December, receives in March and carries in
            August. One membership covers all of it.
          </p>
        </div>
        <div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-sand-deep">
            <HeartHandshake className="h-5 w-5 text-forest" strokeWidth={2} />
          </div>
          <div className="mt-3 text-base font-semibold text-ink">No commission, ever</div>
          <p className="mt-1 text-sm text-muted">
            Carriage fees are agreed and paid directly between you — cash,
            M-Pesa, bank transfer. Kifurushi never touches the money.
          </p>
        </div>
      </div>

      {/* Demo: joining is instant and free. Production wires this to
          Stripe Billing, Paystack or Flutterwave subscriptions. */}
    </div>
  );
}
