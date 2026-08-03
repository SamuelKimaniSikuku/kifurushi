"use client";

// The landing page explains what Kifurushi is; this explains what to actually
// do next. It sits high on the page because the people arriving are coming
// from a WhatsApp group, not from a search — they've already decided to try
// it, and the only thing standing between them and a posted trip is not
// knowing where to click.
//
// Deliberately split by role rather than shown as one long list: nobody needs
// both halves, and a seven-step list reads as harder than two three-step ones.

import Link from "next/link";
import { IdCard, Package, Plane, UserPlus } from "lucide-react";
import { useT } from "@/lib/i18n";

function Steps({ steps, offset }: { steps: readonly string[]; offset: number }) {
  return (
    <ol className="mt-4 space-y-3">
      {steps.map((step, i) => (
        <li key={step} className="flex gap-3">
          <span
            aria-hidden
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest text-xs font-bold text-white"
          >
            {i + offset}
          </span>
          <span className="text-sm leading-relaxed text-muted">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export default function HowToStart() {
  const t = useT();
  const h = t.howTo;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
          {h.title}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{h.sub}</p>
      </div>

      {/* Step one is the same whichever side you're on. */}
      <div className="card mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-clay text-white"
        >
          <UserPlus size={20} strokeWidth={2} />
        </span>
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest text-xs font-bold text-white">
              1
            </span>
            {h.accountStep}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {h.accountBody}
          </p>
          <p className="mt-1.5 text-xs text-faint">{h.accountNote}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <h3 className="flex items-center gap-2.5 text-base font-semibold text-ink">
            <span
              aria-hidden
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sand-deep text-forest"
            >
              <Plane size={18} strokeWidth={2} />
            </span>
            {h.travelTitle}
          </h3>
          <Steps steps={h.travelSteps} offset={2} />
          <Link href="/post/trip" className="btn-accent mt-5 w-full sm:w-auto">
            <Plane className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            {h.travelCta}
          </Link>
        </div>

        <div className="card p-6">
          <h3 className="flex items-center gap-2.5 text-base font-semibold text-ink">
            <span
              aria-hidden
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sand-deep text-forest"
            >
              <Package size={18} strokeWidth={2} />
            </span>
            {h.sendTitle}
          </h3>
          <Steps steps={h.sendSteps} offset={2} />
          <Link href="/post/parcel" className="btn-primary mt-5 w-full sm:w-auto">
            <Package className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            {h.sendCta}
          </Link>
        </div>
      </div>

      <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-muted">
        <IdCard className="mt-0.5 h-4 w-4 shrink-0 text-clay" strokeWidth={2} aria-hidden />
        <span className="max-w-lg">{h.verifyNote}</span>
      </p>
    </section>
  );
}
