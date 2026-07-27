import Link from "next/link";

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

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--forest-deep)] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #f2b705 0 2px, transparent 2px), radial-gradient(circle at 70% 60%, #e85d26 0 2px, transparent 2px)",
            backgroundSize: "90px 90px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <span className="mb-5 inline-block rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[var(--gold)]">
            ALL 54 AFRICAN COUNTRIES · 22 DIASPORA DESTINATIONS
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
            Your parcel travels with someone who&apos;s{" "}
            <span className="text-[var(--gold)]">already going home</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 md:text-lg">
            Kifurushi connects people sending parcels between Africa and abroad
            with verified travellers who have spare luggage space — faster than
            post, cheaper than courier, and we never take a cut.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/post/parcel" className="btn-accent px-7 py-3 text-base">📦 Send a parcel</Link>
            <Link href="/post/trip" className="btn-ghost border-white/30 bg-white/10 px-7 py-3 text-base text-white hover:border-white">
              ✈️ I&apos;m travelling — earn from my luggage
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["54", "African countries"],
              ["3–7 days", "typical delivery"],
              ["$29/yr", "one membership, 0% commission"],
              ["ID + code", "verified handover"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-xl font-extrabold text-[var(--gold)] md:text-2xl">{n}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-white/60">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="border-b border-[#e5ddcd] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 py-3.5 text-xs font-medium text-[#5c6b63]">
          <span>🤝 0% commission — travellers keep everything</span>
          <span>🪪 Government-ID verification</span>
          <span>🔐 One-time delivery codes</span>
          <span>⭐ Two-way ratings</span>
          <span>🚫 Prohibited-items screening</span>
        </div>
      </div>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold text-[var(--forest)]">How Kifurushi works</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#5c6b63]">
          Built so that neither side has to trust a stranger — the platform holds
          the risk, not you.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--clay)] text-lg font-extrabold text-white">{s.n}</div>
              <h3 className="mt-4 font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5c6b63]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Corridors */}
      <section className="bg-[var(--sand-deep)]/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold text-[var(--forest)]">Popular corridors this week</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {corridors.map((c) => (
              <Link
                key={c.from + c.to}
                href="/trips"
                className="card group flex items-center justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div className="text-sm font-semibold">{c.from} <span className="text-[var(--clay)]">→</span> {c.to}</div>
                  <div className="mt-1 text-xs text-[#5c6b63]">{c.price}</div>
                </div>
                <span className="text-[var(--forest)] opacity-0 transition group-hover:opacity-100">→</span>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-[#5c6b63]">
            Any route works — if a traveller flies it, Kifurushi covers it.{" "}
            <Link href="/trips" className="font-semibold text-[var(--forest)] underline">Browse all trips</Link>
          </p>
        </div>
      </section>

      {/* Security */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold text-[var(--forest)]">Security is the product</h2>
            <p className="mt-3 text-[#3d4a43]">
              Informal luggage-sharing already happens in every African
              community abroad — WhatsApp groups, church notice boards, a cousin
              of a cousin. Kifurushi keeps the community spirit and removes the
              risk.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                ["Your money stays yours", "Carriage fees are paid directly between sender and traveller — Kifurushi takes 0% and never holds your money."],
                ["Verified identities", "Travellers upload government ID and a selfie check before their first carry."],
                ["Sealed & inspected", "Travellers inspect every item before sealing it together with the sender — no carrying unknowns."],
                ["One-time delivery codes", "The receiver gets a 6-digit code; entering it completes the delivery record both sides rely on."],
              ].map(([t, b]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">✓</span>
                  <div>
                    <div className="font-semibold">{t}</div>
                    <div className="text-sm text-[#5c6b63]">{b}</div>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/safety" className="btn-primary mt-7">Read our trust &amp; safety standards</Link>
          </div>
          <div className="card bg-[var(--forest)] p-8 text-white">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">Protected handover</div>
            <ol className="mt-5 space-y-4">
              {[
                ["Fee agreed: $45", "Paid directly, traveller keeps 100%"],
                ["Handover & seal", "Photos logged by both parties"],
                ["In transit", "Journey updates for both sides"],
                ["Code 4 8 2 9 1 7", "Receiver confirms — record complete"],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--gold)] text-xs font-extrabold text-[var(--ink)]">{i + 1}</span>
                  <div>
                    <div className="text-sm font-bold">{t}</div>
                    <div className="text-xs text-white/65">{b}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="card overflow-hidden bg-gradient-to-br from-[var(--clay)] to-[var(--clay-deep)] p-10 text-center text-white">
          <h2 className="text-3xl font-extrabold">Something waiting to go home?</h2>
          <p className="mx-auto mt-2 max-w-lg text-white/85">
            Post it in two minutes. Travellers on your route get notified
            immediately.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/post/parcel" className="btn-ghost border-white bg-white text-[var(--clay-deep)]">Send a parcel</Link>
            <Link href="/post/trip" className="btn-ghost border-white/50 bg-transparent text-white hover:border-white">Earn as a traveller</Link>
          </div>
        </div>
      </section>
    </>
  );
}
