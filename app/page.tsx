"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import TopEarner from "@/components/TopEarner";
import HowToStart from "@/components/HowToStart";
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
  Star, Gift,} from "lucide-react";

const corridors = [
  { from: "🇬🇧 London", to: "🇳🇬 Lagos", price: "$8" },
  { from: "🇫🇷 Paris", to: "🇸🇳 Dakar", price: "$7" },
  { from: "🇺🇸 Atlanta", to: "🇰🇪 Nairobi", price: "$10" },
  { from: "🇦🇪 Dubai", to: "🇪🇬 Cairo", price: "$6" },
  { from: "🇩🇪 Frankfurt", to: "🇬🇭 Accra", price: "$8" },
  { from: "🇨🇦 Toronto", to: "🇪🇹 Addis Ababa", price: "$11" },
  { from: "🇿🇦 Joburg", to: "🇬🇧 Manchester", price: "$9" },
  { from: "🇳🇬 Lagos", to: "🇺🇸 Chicago", price: "$12" },
];

const TRUST_ICONS = [HeartHandshake, BadgeCheck, KeyRound, Star, Ban];
const SECURITY_ICONS = [ShieldCheck, BadgeCheck, PackageCheck, KeyRound];

export default function Home() {
  const t = useT();
  const steps = t.home.steps.map((s, i) => ({ n: String(i + 1), ...s }));
  const trustItems = t.home.trustItems.map(
    (label, i) => [TRUST_ICONS[i], label] as const
  );
  const securityPoints = t.home.securityPoints.map(
    (p, i) => [SECURITY_ICONS[i], p.title, p.body] as const
  );
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
                {t.home.badge}
              </span>
              <h1 className="max-w-xl font-display text-4xl font-bold tracking-tight md:text-6xl">
                {t.home.h1a}{" "}
                <span className="text-gold">{t.home.h1b}</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/75 md:text-lg">
                {t.home.intro}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/post/trip"
                  className="btn-accent btn-lg w-full sm:w-auto sm:whitespace-nowrap"
                >
                  <Plane className="h-5 w-5" strokeWidth={2} aria-hidden />
                  {t.home.ctaTravel}
                </Link>
                <Link
                  href="/post/parcel"
                  className="btn-outline-inverse btn-lg w-full sm:w-auto sm:whitespace-nowrap"
                >
                  <Package className="h-5 w-5" strokeWidth={2} aria-hidden />
                  {t.home.ctaSend}
                </Link>
              </div>
              {/* The single most useful thing a first-time visitor can know. */}
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-gold">
                <Gift className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                {t.home.freeMonthHero}
              </p>
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
                        {t.home.verified}
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
                  {t.home.departs}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <div className="font-display text-2xl font-extrabold">
                    $9<span className="text-base font-bold">/kg</span>
                  </div>
                  <span className="chip">{t.home.kgFree}</span>
                </div>
                <span
                  aria-hidden
                  className="btn-accent pointer-events-none mt-4 w-full"
                >
                  {t.home.requestTraveller}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              ["54", t.home.statCountries],
              [t.home.statDeliveryValue, t.home.statDelivery],
              [t.home.statPriceValue, t.home.statPrice],
              [t.home.statHandoverValue, t.home.statHandover],
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

          {/* Real earnings, shown only once the numbers are real */}
          <TopEarner />
        </div>
      </section>

      {/* Role chooser — which side of the marketplace are you on today? */}
      <section className="mx-auto max-w-6xl px-4 pt-16 md:pt-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
            {t.chooser.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            {t.chooser.sub}
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="card flex flex-col p-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-clay text-white" aria-hidden>
              <Plane size={22} strokeWidth={2} />
            </span>
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-forest">
              {t.chooser.travelTitle}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              {t.chooser.travelBody}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link href="/post/trip" className="btn-accent w-full sm:w-auto">
                {t.chooser.travelPrimary}
              </Link>
              <Link href="/parcels" className="btn-ghost w-full sm:w-auto">
                {t.chooser.travelSecondary}
              </Link>
            </div>
          </div>

          <div className="card flex flex-col p-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest text-white" aria-hidden>
              <Package size={22} strokeWidth={2} />
            </span>
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-forest">
              {t.chooser.sendTitle}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              {t.chooser.sendBody}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link href="/post/parcel" className="btn-primary w-full sm:w-auto">
                {t.chooser.sendPrimary}
              </Link>
              <Link href="/trips" className="btn-ghost w-full sm:w-auto">
                {t.chooser.sendSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What to actually do next — for people arriving from the group */}
      <HowToStart />

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
            {t.home.processLabel}
          </div>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
            {t.home.howTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            {t.home.howSub}
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
              {t.home.routesLabel}
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
              {t.home.corridorsTitle}
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
                  <div className="mt-1 text-xs text-muted">
                    {t.home.corridorFrom(c.price)}
                  </div>
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
            {t.home.corridorsNote}{" "}
            <Link
              href="/trips"
              className="font-semibold text-forest underline underline-offset-2 hover:text-forest-deep"
            >
              {t.home.browseAll}
            </Link>
          </p>
        </div>
      </section>

      {/* Security */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 lg:gap-14 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
              {t.home.securityLabel}
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
              {t.home.securityTitle}
            </h2>
            <p className="mt-4 text-muted">
              {t.home.securityIntro}
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
              {t.home.readSafety}
            </Link>
          </div>
          <div className="card border-forest-deep bg-forest p-8 text-white md:p-10">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              {t.home.handoverLabel}
            </div>
            <ol className="relative mt-6 space-y-6">
              <div
                aria-hidden
                className="absolute bottom-4 left-3.5 top-4 w-px bg-white/15"
              />
              {t.home.handoverSteps.map((s, i) => (
                <li key={s.title} className="relative flex gap-3.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold font-display text-xs font-bold text-ink ring-4 ring-forest">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="mt-0.5 text-xs text-white/65">{s.body}</div>
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
            {t.home.ctaBandTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            {t.home.ctaBandBody}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/post/parcel" className="btn-inverse">
              {t.home.ctaBandSend}
            </Link>
            <Link href="/post/trip" className="btn-outline-inverse">
              {t.home.ctaBandEarn}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
