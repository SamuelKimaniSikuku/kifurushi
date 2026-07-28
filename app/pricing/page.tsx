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
  fetchSession, fetchMembership, joinMembership, startCheckout,
  BILLING_MODE, BillingPlan, Membership,
} from "@/lib/auth";

const PLANS: {
  key: BillingPlan;
  label: string;
  price: string;
  period: string;
  note: string;
  badge?: string;
}[] = [
  {
    key: "monthly",
    label: "Monthly",
    price: "$5",
    period: "/month",
    note: "Billed monthly. Cancel anytime.",
  },
  {
    key: "yearly",
    label: "Yearly",
    price: "$29",
    period: "/year",
    note: "Just $2.42 a month, billed once — save $31.",
    badge: "Best value · Save 52%",
  },
];

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

const REASON_MESSAGES: Record<string, string> = {
  contact:
    "Membership is needed to contact travellers and senders — one membership covers your whole year.",
  post:
    "Membership is needed to post trips and parcel requests — one membership covers your whole year.",
};

const CHECKOUT_MESSAGES: Record<string, string> = {
  success:
    "Payment received — your membership activates within a few seconds.",
  cancelled: "Checkout cancelled — you haven't been charged.",
};

function ContactBanner() {
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const message =
    REASON_MESSAGES[params.get("reason") ?? ""] ??
    CHECKOUT_MESSAGES[params.get("checkout") ?? ""];
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
        aria-label="Dismiss"
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
      setJoinError("Could not activate your membership. Please try again.");
    } finally {
      setJoining(null);
    }
  }

  const isMember = membership?.status === "member";
  const currentPlan: BillingPlan = membership?.plan ?? "yearly";
  const currentLabel = currentPlan === "monthly" ? "monthly" : "yearly";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
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

      <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
        {/* Free */}
        <div className="card flex flex-col p-7">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">
            Free
          </div>
          <div className="mt-2 font-display text-4xl font-extrabold text-ink">
            $0
          </div>
          <p className="mt-1 text-sm text-muted">Look around, receive, track.</p>
          <FeatureList items={FREE_FEATURES} />
          <div className="mt-auto pt-7">
            <Link href="/trips" className="btn-ghost w-full">
              Browse trips
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

              <FeatureList items={MEMBER_FEATURES} />

              <div className="mt-auto pt-7">
                {isMember ? (
                  p.key === currentPlan ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-success-bg px-4 py-3 text-center text-sm font-semibold text-success">
                      <BadgeCheck className="h-5 w-5 shrink-0" strokeWidth={2} />
                      <span>
                        Your plan
                        {membership?.since &&
                          ` since ${new Date(membership.since).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`}
                      </span>
                    </div>
                  ) : (
                    <p className="py-3 text-center text-sm text-muted">
                      You&apos;re on the {currentLabel} plan.
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
                        ? "Activating…"
                        : `Join for ${p.price}${p.period}`}
                    </button>
                    {joinError && (
                      <p role="alert" className="mt-3 text-center text-xs text-danger">
                        {joinError}
                      </p>
                    )}
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-faint">
                      <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      Secure checkout - cancel anytime
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
          Make money travelling - save on every parcel
        </div>
        <div className="mt-2 grid gap-2 text-sm text-white/80 md:grid-cols-3 md:gap-6">
          <div>
            <b className="text-white">$5/month or $29/year is for the platform only</b>{" "}
            — unlimited parcels, both directions.
          </div>
          <div>
            The delivery fee you{" "}
            <b className="text-white">negotiate directly with the traveller</b>{" "}
            (typically ~$45 per 5 kg vs $60+ courier). Kifurushi takes no cut.
          </div>
          <div className="font-semibold text-gold">
            5 parcels a year = $150+ saved.
          </div>
        </div>
      </div>

      {/* Why one price */}
      <div className="card mt-8 grid gap-8 p-7 md:grid-cols-3 md:gap-6">
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
