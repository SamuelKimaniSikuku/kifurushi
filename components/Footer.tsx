import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 bg-forest-deep text-white">
      <div className="kente-strip" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="font-display text-lg font-bold tracking-tight">
            Kifurushi<span className="text-gold">.</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Africa&apos;s peer-to-peer parcel network. Connecting all 54 African
            countries with the diaspora — one suitcase at a time.
          </p>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Platform</div>
          <ul className="text-sm">
            <li><Link href="/trips" className="block py-1.5 text-white/70 transition hover:text-white">Find a traveller</Link></li>
            <li><Link href="/parcels" className="block py-1.5 text-white/70 transition hover:text-white">Parcel requests</Link></li>
            <li><Link href="/post/trip" className="block py-1.5 text-white/70 transition hover:text-white">Post a trip</Link></li>
            <li><Link href="/post/parcel" className="block py-1.5 text-white/70 transition hover:text-white">Send a parcel</Link></li>
            <li><Link href="/pricing" className="block py-1.5 text-white/70 transition hover:text-white">Pricing — one membership</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Trust</div>
          <ul className="text-sm">
            <li><Link href="/safety" className="block py-1.5 text-white/70 transition hover:text-white">Trust &amp; safety</Link></li>
            <li><Link href="/safety#prohibited" className="block py-1.5 text-white/70 transition hover:text-white">Prohibited items</Link></li>
            <li><Link href="/safety#escrow" className="block py-1.5 text-white/70 transition hover:text-white">How protection works</Link></li>
            <li><Link href="/safety#security" className="block py-1.5 text-white/70 transition hover:text-white">Platform security</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Coverage</div>
          <p className="text-sm leading-relaxed text-white/70">
            54 African countries · 22 diaspora destinations across Europe, North
            America, the Gulf and Asia-Pacific.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2.5 px-4 py-5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-xs font-medium text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} strokeWidth={2} className="text-gold" aria-hidden />
              ID-verified members
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <Lock size={16} strokeWidth={2} className="text-gold" aria-hidden />
              Coded handovers
            </span>
          </div>
          <div className="text-xs text-white/50">
            © {new Date().getFullYear()} Kifurushi. Built for the African diaspora.
          </div>
        </div>
      </div>
    </footer>
  );
}
