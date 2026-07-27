import type { Metadata } from "next";
import { Ban, Flag } from "lucide-react";

export const metadata: Metadata = {
  title: "Trust & Safety — Kifurushi",
  description:
    "How Kifurushi protects senders, travellers and receivers: ID verification, sealed handovers, delivery codes, prohibited items and platform security.",
};

const prohibited = [
  "Cash, gold, jewellery or bearer instruments",
  "Weapons, ammunition or components",
  "Illegal drugs or controlled substances in either country",
  "Loose lithium batteries or power banks in checked luggage",
  "Liquids over 100ml in cabin baggage",
  "Perishable or unsealed food",
  "Counterfeit goods",
  "Live animals or plants without permits",
  "Anything the sender refuses to open for inspection",
];

function SectionNumber({ n }: { n: number }) {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest text-sm font-bold text-white">
      {n}
    </span>
  );
}

const h2Class =
  "flex items-center gap-3 font-display text-2xl font-bold tracking-tight text-forest md:text-3xl";

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
        How Kifurushi protects you
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        Trust &amp; safety
      </h1>
      <p className="mt-3 text-muted">
        Kifurushi exists because informal luggage-sharing already happens across
        every African diaspora community — we make it safe. These are the rules
        that protect all three parties: sender, traveller and receiver.
      </p>

      <section id="escrow" className="mt-12">
        <h2 className={h2Class}>
          <SectionNumber n={1} />
          Protected handover — without touching your money
        </h2>
        <p className="mt-4 text-sm text-muted">
          Kifurushi is a platform, not a middleman for money. The carriage fee
          is agreed and paid <b>directly between sender and traveller</b> — cash,
          M-Pesa, bank transfer, whatever suits you both — and we take 0%. The
          protection comes from the record the platform builds around every
          delivery:
        </p>
        <ol className="mt-5 space-y-3 text-sm text-muted">
          <li className="card p-4 leading-relaxed"><b className="text-ink">Terms agreed on-platform.</b> Fee, weight, contents and dates are confirmed in the match before handover — so there is a written record both sides accepted.</li>
          <li className="card p-4 leading-relaxed"><b className="text-ink">Co-sealed with photos.</b> The parcel is inspected open, then sealed together and photographed in the app. The timestamped log is part of the delivery record.</li>
          <li className="card p-4 leading-relaxed"><b className="text-ink">Coded delivery.</b> The receiver gets a one-time 6-digit code. Entering it at handover is the proof of delivery that completes the record and unlocks reviews.</li>
          <li className="card p-4 leading-relaxed"><b className="text-ink">Disputes.</b> If something goes wrong, our team reviews the agreed terms, photo log and journey updates. Accounts at fault are banned, and the full record is available to the parties for any claim they pursue.</li>
        </ol>
      </section>

      <section id="verification" className="mt-12">
        <h2 className={h2Class}>
          <SectionNumber n={2} />
          Identity verification
        </h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          <li>• Travellers must pass government-ID + liveness selfie checks before their first carry.</li>
          <li>• Senders verify a phone number always, and full ID for parcels above $200 in declared value.</li>
          <li>• Ratings are two-way and immutable. Accounts with confirmed misconduct are banned across all corridors, permanently.</li>
        </ul>
      </section>

      <section id="inspection" className="mt-12">
        <h2 className={h2Class}>
          <SectionNumber n={3} />
          Inspect-and-seal — travellers never carry unknowns
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The single most important rule: <b className="text-ink">the traveller inspects every item,
          open, in person, with the sender</b> — then both seal the parcel
          together and photograph it in the app. The photo log is timestamped
          and becomes part of the delivery record. A traveller who accepts a
          pre-sealed package carries it as their own at the border — which is
          why the platform treats it as a bannable offence for both sides.
        </p>
      </section>

      <section id="prohibited" className="mt-12">
        <h2 className={h2Class}>
          <SectionNumber n={4} />
          Prohibited items
        </h2>
        <div className="card mt-4 p-5">
          <ul className="grid gap-2.5 text-sm text-muted sm:grid-cols-2">
            {prohibited.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <Ban className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2} aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-xs text-faint">
          Misdeclared contents void platform protection for the sender and are
          reported where the law requires it.
        </p>
      </section>

      <section id="security" className="mt-12">
        <h2 className={h2Class}>
          <SectionNumber n={5} />
          Platform security
        </h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          <li>• All traffic over HTTPS with strict transport security; strong Content-Security-Policy on every page.</li>
          <li>• Passwords hashed with modern KDFs; sessions are short-lived and revocable.</li>
          <li>• Database access is gated by row-level security — users can only ever read or write their own records.</li>
          <li>• Every input is validated server-side (length, format, allow-lists) before it touches the database.</li>
          <li>• Rate limiting and anomaly detection on login, posting and messaging endpoints.</li>
          <li>• Personal contact details are masked until both sides confirm the match.</li>
        </ul>
      </section>

      <section className="mt-12 rounded-2xl bg-forest p-6 text-white">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight">
          <Flag className="h-5 w-5 shrink-0 text-gold" strokeWidth={2} aria-hidden />
          Something feels off?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          Report any listing, message or user from the ⚑ button on their profile.
          Reports freeze the related match automatically until reviewed.
        </p>
      </section>
    </div>
  );
}
