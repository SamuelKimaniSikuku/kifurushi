import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Calendar,
  HeartHandshake,
  KeyRound,
  Package,
  PackageCheck,
  Plane,
  ShieldCheck,
  Star,
} from "lucide-react";

const corridors = [
  { from: "🇬🇧 London", to: "🇳🇬 Lagos", price: "from $8/kg" },
  { from: "🇫🇷 Paris", to: "🇸🇳 Dakar", price: "from $7/kg" },
  { from: "🇺🇸 Atlanta", to: "🇰🇪 Nairobi", price: "from $10/kg" },
  { from: "🇦🇪 Dubai", to: "🇪🇬 Cairo", price: "from $6/kg" },
  { from: "🇩🇪 Frankfurt", to: "🇬🇭 Accra", price: "from $8/kg" },
  { from: "🇨🇦 Toronto", to: "🇪🇹 Addis Ababa", price: "from $11/kg" },
  { from: "🇿🇦 Joburg", to: "🇬🇧 Manchester", price: "from $9/kg" },
  { from: "🇳🇬 Lagos", to: "🇺🇸 Chicago", price: "from $12/kg" },
];

const steps = [
  {
    n: "1",
    title: "Post or find",
    body: "Senders post what they need moved; travellers post spare suitcase space on upcoming flights.",
  },
  {
    n: "2",
    title: "Match & verify",
    body: "We match routes and dates. Both sides see ID-verification status, ratings and delivery history before agreeing.",
  },
  {
    n: "3",
    title: "Agree & seal",
    body: "You agree the carriage fee directly — cash, M-Pesa, bank transfer, your choice. The parcel is inspected and sealed together, with a photo log.",
  },
  {
    n: "4",
    title: "Deliver & confirm",
    body: "The receiver confirms delivery with a one-time code, which completes the record and unlocks reviews for both sides.",
  },
];

const trustItems: Array<[typeof HeartHandshake, string]> = [
  [HeartHandshake, "0% commission — travellers keep everything"],
  [BadgeCheck, "Government-ID verification"],
  [KeyRound, "One-time delivery codes"],
  [Star, "Two-way ratings"],
  [Ban, "Prohibited-items screening"],
];

const securityPoints: Array<[typeof ShieldCheck, string, string]> = [
  [
    ShieldCheck,
    "Your money stays yours",
    "Carriage fees are paid directly between sender and traveller — Kifurushi takes 0% and never holds your money.",
  ],
  [
    BadgeCheck,
    "Verified identities",
    "Travellers upload government ID and a selfie check before their first carry.",
  ],
  [
    PackageCheck,
    "Sealed & inspected",
    "Travellers inspect every item before sealing it together with the sender — no carrying unknowns.",
  ],
  [
    KeyRound,
    "One-time delivery codes",
    "The receiver gets a 6-digit code; entering it completes the delivery record both sides rely on.",
  ],
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(52rem 34rem at 8% 0%, color-mix(in srgb, var(--leaf) 8%, transparent), transparent 70%), radial-gradient(44rem 30rem at 95% 100%, color-mix(in srgb, var(--gold) 6%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: copy */}
            <div>
              <span className="mb-5 inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold [background:color-mix(in_srgb,var(--gold)_10%,transparent)] [border-color:color-mix(in_srgb,var(--gold)_40%,transparent)]">
                ALL 54 AFRICAN COUNTRIES · 22 DIASPORA DESTINATIONS
              </span>
              <h1 className="max-w-xl font-display text-4xl font-bold tracking-tight md:text-6xl">
                Make money{" "}
                <span className="text-gold">while travelling home</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/75 md:text-lg">
                Your spare kilos are worth $100+ every trip. Carry parcels for
                people sending things between Africa and abroad — you keep 100%
                of what you charge, Kifurushi takes no cut. And when
                you&apos;re the one sending, your parcel travels with a
                verified traveller who&apos;s already going home.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/post/trip"
                  className="btn-accent btn-lg w-full sm:w-auto sm:whitespace-nowrap"
                >
                  <Plane className="h-5 w-5" strokeWidth={2} aria-hidden />
                  I&apos;m travelling — earn from my luggage
                </Link>
                <Link
                  href="/post/parcel"
                  className="btn-outline-inverse btn-lg w-full sm:w-auto sm:whitespace-nowrap"
                >
                  <Package className="h-5 w-5" strokeWidth={2} aria-hidden />
                  Send a parcel
                </Link>
              </div>
            </div>

            {/* Right: product preview */}
            <div className="mx-auto w-full max-w-sm lg:justify-self-end">
              <div className="card w-full max-w-sm rotate-1 p-5 text-ink shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest text-sm font-semibold text-white">
                    AO
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold">Amina O.</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-semibold text-success">
                        <BadgeCheck
                          className="h-3.5 w-3.5"
                          strokeWidth={2}
                          aria-hidden
                        />
                        Verified
                      </span>
                    </div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-muted">
                      <Star
                        className="h-3.5 w-3.5 fill-gold text-gold"
                        strokeWidth={2}
                        aria-hidden
                      />
                      4.9 (23)
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-sand px-3.5 py-3">
                  <Plane
                    className="h-4 w-4 shrink-0 text-clay"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="text-sm font-semibold">London</span>
                  <span
                    aria-hidden
                    className="min-w-4 flex-1 border-t border-dashed border-line-strong"
                  />
                  <span className="text-sm font-semibold">Lagos</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <Calendar className="h-4 w-4" strokeWidth={2} aria-hidden />
                  departs Sun 2 Aug
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <div className="font-display text-2xl font-extrabold">
                    $9<span className="text-base font-bold">/kg</span>
                  </div>
                  <span className="chip">18 kg free</span>
                </div>
                <span
                  aria-hidden
                  className="btn-accent pointer-events-none mt-4 w-full"
                >
                  Request this traveller
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              ["54", "African countries"],
              ["3–7 days", "typical delivery"],
              ["$5/mo", "or $29/yr — 0% commission"],
              ["ID + code", "verified handover"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-white/5 px-4 py-4">
                <div className="font-display text-2xl font-bold text-gold">
                  {n}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-white/60">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-8 whitespace-nowrap py-3.5 text-xs font-medium text-muted lg:justify-center">
            {trustItems.map(([Icon, label]) => (
              <span key={label} className="inline-flex items-center gap-2">
                <Icon
                  className="h-4 w-4 shrink-0 text-leaf"
                  strokeWidth={2}
                  aria-hidden
                />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
            The process
          </div>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
            How Kifurushi works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            Built so that neither side has to trust a stranger — the platform
            holds the risk, not you.
          </p>
        </div>
        <div className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
          <div
            aria-hidden
            className="absolute left-5 right-5 top-5 hidden h-px bg-line-strong lg:block"
          />
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-clay-deep font-display text-lg font-bold text-white ring-8 ring-sand">
                {s.n}
              </div>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Corridors */}
      <section className="bg-sand-deep py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
              Routes
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
              Popular corridors this week
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {corridors.map((c) => (
              <Link
                key={c.from + c.to}
                href="/trips"
                className="card card-lift group flex items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {c.from} <span className="text-clay">→</span> {c.to}
                  </div>
                  <div className="mt-1 text-xs text-muted">{c.price}</div>
                </div>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-forest opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            Any route works — if a traveller flies it, Kifurushi covers it.{" "}
            <Link
              href="/trips"
              className="font-semibold text-forest underline underline-offset-2 hover:text-forest-deep"
            >
              Browse all trips
            </Link>
          </p>
        </div>
      </section>

      {/* Security */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 lg:gap-14 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
              Trust &amp; safety
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
              Security is the product
            </h2>
            <p className="mt-4 text-muted">
              Informal luggage-sharing already happens in every African
              community abroad — WhatsApp groups, church notice boards, a cousin
              of a cousin. Kifurushi keeps the community spirit and removes the
              risk.
            </p>
            <ul className="mt-7 space-y-5">
              {securityPoints.map(([Icon, t, b]) => (
                <li key={t} className="flex gap-3.5">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success-bg text-success">
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <div>
                    <div className="text-base font-semibold">{t}</div>
                    <div className="mt-0.5 text-sm text-muted">{b}</div>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/safety" className="btn-primary mt-8">
              Read our trust &amp; safety standards
            </Link>
          </div>
          <div className="card border-forest-deep bg-forest p-8 text-white md:p-10">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Protected handover
            </div>
            <ol className="relative mt-6 space-y-6">
              <div
                aria-hidden
                className="absolute bottom-4 left-3.5 top-4 w-px bg-white/15"
              />
              {[
                ["Fee agreed: $45", "Paid directly, traveller keeps 100%"],
                ["Handover & seal", "Photos logged by both parties"],
                ["In transit", "Journey updates for both sides"],
                ["Code 4 8 2 9 1 7", "Receiver confirms — record complete"],
              ].map(([t, b], i) => (
                <li key={t} className="relative flex gap-3.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold font-display text-xs font-bold text-ink ring-4 ring-forest">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{t}</div>
                    <div className="mt-0.5 text-xs text-white/65">{b}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
        <div className="card overflow-hidden border-transparent bg-gradient-to-br from-clay to-clay-deep p-10 text-center text-white md:p-14">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Something waiting to go home?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            Post it in two minutes. Travellers on your route get notified
            immediately.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/post/parcel" className="btn-inverse">
              Send a parcel
            </Link>
            <Link href="/post/trip" className="btn-outline-inverse">
              Earn as a traveller
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
