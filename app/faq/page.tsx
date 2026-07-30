"use client";

// The questions people actually ask, answered in the language they're reading.
//
// Two deliberate choices. Every answer describes what the product does today —
// including the three places where the honest answer is "no": there is no
// insurance, we do not hold your money, and we do not adjudicate disputes.
// Burying those would only move the disappointment to the worst possible
// moment. And the whole list renders open in the markup, so search engines and
// screen readers get the answers without needing to click anything.

import { ChevronDown, HelpCircle, Mail } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function FaqPage() {
  const t = useT();
  const f = t.faq;

  // Schema.org FAQ markup: this is the page people arrive on from a search for
  // "send parcel to Nairobi with traveller", so the answers should be able to
  // show up there directly.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: f.groups.flatMap((g) =>
      g.items.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a },
      }))
    ),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sand-deep text-forest"
          aria-hidden
        >
          <HelpCircle size={20} strokeWidth={2} />
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
          {f.title}
        </h1>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{f.sub}</p>

      {f.groups.map((group) => (
        <section key={group.title} className="mt-10">
          <h2 className="font-display text-xl font-bold tracking-tight text-forest md:text-2xl">
            {group.title}
          </h2>
          <div className="mt-4 space-y-2">
            {group.items.map((item) => (
              <details
                key={item.q}
                className="card group overflow-hidden p-0 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold text-ink transition hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
                  {item.q}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                    strokeWidth={2}
                    aria-hidden
                  />
                </summary>
                <p className="border-t border-line px-5 py-4 text-sm leading-relaxed text-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="card mt-12 flex flex-wrap items-center justify-between gap-4 p-6">
        <p className="text-sm font-semibold text-ink">{f.stillStuck}</p>
        <a className="btn-accent" href="mailto:hello@kifurushiapp.com">
          <Mail className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {f.stillStuckCta}
        </a>
      </div>
    </div>
  );
}
