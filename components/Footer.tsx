"use client";

import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function Footer() {
  const t = useT();
  return (
    <footer className="mt-16 bg-forest-deep text-white">
      <div className="kente-strip" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="font-display text-lg font-bold tracking-tight">
            Kifurushi<span className="text-gold">.</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            {t.footer.tagline}
          </p>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            {t.footer.platform}
          </div>
          <ul className="text-sm">
            <li><Link href="/trips" className="block py-1.5 text-white/70 transition hover:text-white">{t.nav.findTraveller}</Link></li>
            <li><Link href="/parcels" className="block py-1.5 text-white/70 transition hover:text-white">{t.nav.parcelRequests}</Link></li>
            <li><Link href="/post/trip" className="block py-1.5 text-white/70 transition hover:text-white">{t.nav.postTrip}</Link></li>
            <li><Link href="/post/parcel" className="block py-1.5 text-white/70 transition hover:text-white">{t.nav.sendParcel}</Link></li>
            <li><Link href="/pricing" className="block py-1.5 text-white/70 transition hover:text-white">{t.footer.pricingLink}</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            {t.footer.trust}
          </div>
          <ul className="text-sm">
            <li><Link href="/safety" className="block py-1.5 text-white/70 transition hover:text-white">{t.nav.trustSafety}</Link></li>
            <li><Link href="/safety#prohibited" className="block py-1.5 text-white/70 transition hover:text-white">{t.footer.prohibitedItems}</Link></li>
            <li><Link href="/safety#escrow" className="block py-1.5 text-white/70 transition hover:text-white">{t.footer.howProtection}</Link></li>
            <li><Link href="/safety#security" className="block py-1.5 text-white/70 transition hover:text-white">{t.footer.platformSecurity}</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            {t.footer.coverage}
          </div>
          <p className="text-sm leading-relaxed text-white/70">
            {t.footer.coverageText}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2.5 px-4 py-5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-xs font-medium text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} strokeWidth={2} className="text-gold" aria-hidden />
              {t.footer.idVerified}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <Lock size={16} strokeWidth={2} className="text-gold" aria-hidden />
              {t.footer.codedHandovers}
            </span>
          </div>
          <div className="text-xs text-white/50">
            {t.footer.copyright(new Date().getFullYear())}
          </div>
        </div>
      </div>
    </footer>
  );
}
