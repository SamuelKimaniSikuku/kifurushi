"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, getMembership, joinMembership, Membership } from "@/lib/store";

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

export default function PricingPage() {
  const router = useRouter();
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    setMembership(getMembership());
  }, []);

  function join() {
    if (!getSession()) {
      router.push("/auth?next=/pricing");
      return;
    }
    setMembership(joinMembership());
  }

  const isMember = membership?.status === "member";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-center text-4xl font-extrabold text-[var(--forest)]">
        One membership. Every role.
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-[#5c6b63]">
        Send this month, receive next month, carry when you fly home — one
        account, one price, no commission. Kifurushi never takes a cut of what
        travellers earn.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="card p-7">
          <div className="text-sm font-bold uppercase tracking-wider text-[#8a8574]">Free</div>
          <div className="mt-2 text-4xl font-extrabold">$0</div>
          <p className="mt-1 text-sm text-[#5c6b63]">Look around, receive, track.</p>
          <ul className="mt-6 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-[#3d4a43]">
                <span className="text-[var(--leaf)]">✓</span>{f}
              </li>
            ))}
          </ul>
          <Link href="/trips" className="btn-ghost mt-7 w-full">Browse trips</Link>
        </div>

        {/* Member */}
        <div className="card relative overflow-hidden border-2 border-[var(--forest)] p-7">
          <div className="absolute right-0 top-0 rounded-bl-xl bg-[var(--clay)] px-3 py-1 text-xs font-bold text-white">
            PAYS FOR ITSELF ON PARCEL #1
          </div>
          <div className="text-sm font-bold uppercase tracking-wider text-[var(--forest)]">Membership</div>
          <div className="mt-2 text-4xl font-extrabold text-[var(--forest)]">
            $29<span className="text-lg font-semibold text-[#5c6b63]">/year</span>
          </div>
          <p className="mt-1 text-sm text-[#5c6b63]">
            Sender, receiver and traveller — all in one.
          </p>

          <div className="mt-5 space-y-2">
            <div className="flex items-center gap-3 rounded-xl bg-[var(--forest)] px-4 py-3 text-white">
              <span className="text-xl">✈️</span>
              <div>
                <div className="text-sm font-extrabold">Make money by travelling home</div>
                <div className="text-xs text-white/75">Your spare kilos can earn $100+ per trip — you keep all of it</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-[var(--gold)]/20 px-4 py-3">
              <span className="text-xl">📦</span>
              <div>
                <div className="text-sm font-extrabold text-[var(--forest)]">Save on every parcel — sent or received</div>
                <div className="mt-1 space-y-0.5 text-xs text-[#5c6b63]">
                  <div><b>$29/year is for the platform only</b> — unlimited parcels, both directions.</div>
                  <div>The delivery fee you <b>negotiate directly with the traveller</b> (typically ~$45 per 5 kg vs $60+ courier). Kifurushi takes no cut.</div>
                  <div className="pt-0.5 font-semibold text-[var(--forest)]">5 parcels a year = $150+ saved.</div>
                </div>
              </div>
            </div>
          </div>

          <ul className="mt-5 space-y-3">
            {MEMBER_FEATURES.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-[#3d4a43]">
                <span className="text-[var(--leaf)]">✓</span>{f}
              </li>
            ))}
          </ul>
          {isMember ? (
            <div className="mt-7 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-800">
              ✓ You&apos;re a member{membership?.since && ` since ${new Date(membership.since).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`}
            </div>
          ) : (
            <button onClick={join} className="btn-accent mt-7 w-full py-3">
              Join for $29/year
            </button>
          )}
        </div>
      </div>

      {/* Why one price */}
      <div className="card mt-10 grid gap-6 p-7 md:grid-cols-3">
        <div>
          <div className="font-bold">💸 Cheaper than one courier shipment</div>
          <p className="mt-1 text-sm text-[#5c6b63]">
            A 5 kg parcel London → Lagos costs $50–80 with a courier. One year of
            Kifurushi costs $29 — and a traveller charges you around $45.
          </p>
        </div>
        <div>
          <div className="font-bold">🔄 Roles switch, price doesn&apos;t</div>
          <p className="mt-1 text-sm text-[#5c6b63]">
            The same person sends in December, receives in March and carries in
            August. One membership covers all of it.
          </p>
        </div>
        <div>
          <div className="font-bold">🤝 No commission, ever</div>
          <p className="mt-1 text-sm text-[#5c6b63]">
            Carriage fees are agreed and paid directly between you — cash,
            M-Pesa, bank transfer. Kifurushi never touches the money.
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-[#8a8574]">
        Demo: joining is instant and free. Production wires this to
        Stripe Billing, Paystack or Flutterwave subscriptions.
      </p>
    </div>
  );
}
