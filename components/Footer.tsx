import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 bg-[var(--forest-deep)] text-white">
      <div className="kente-strip" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="display text-lg font-extrabold">Kifurushi<span className="text-[var(--gold)]">.</span></div>
          <p className="mt-2 text-sm text-white/70">
            Africa&apos;s peer-to-peer parcel network. Connecting all 54 African
            countries with the diaspora — one suitcase at a time.
          </p>
        </div>
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">Platform</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/trips" className="hover:text-white">Find a traveller</Link></li>
            <li><Link href="/parcels" className="hover:text-white">Parcel requests</Link></li>
            <li><Link href="/post/trip" className="hover:text-white">Post a trip</Link></li>
            <li><Link href="/post/parcel" className="hover:text-white">Send a parcel</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Pricing — one membership</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">Trust</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/safety" className="hover:text-white">Trust &amp; safety</Link></li>
            <li><Link href="/safety#prohibited" className="hover:text-white">Prohibited items</Link></li>
            <li><Link href="/safety#escrow" className="hover:text-white">How protection works</Link></li>
            <li><Link href="/safety#security" className="hover:text-white">Platform security</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">Coverage</div>
          <p className="text-sm text-white/70">
            54 African countries · 22 diaspora destinations across Europe, North
            America, the Gulf and Asia-Pacific.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Kifurushi. Built for the African diaspora.
      </div>
    </footer>
  );
}
