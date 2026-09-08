"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronDown, Gift, HeartHandshake, KeyRound, Package, PackageCheck, Plane, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n";
import { label } from "@/lib/countries";
import { browseHref } from "@/lib/routes";
import Leaderboard from "@/components/Leaderboard";
import HowToStart from "@/components/HowToStart";
import RouteSearch from "@/components/RouteSearch";

// These are navigation shortcuts, not claims about availability or prices.
const corridors = [["FR", "KE"], ["GB", "NG"], ["FR", "SN"], ["US", "KE"], ["AE", "EG"], ["DE", "GH"], ["CA", "ET"], ["ZA", "GB"]];
const SECURITY_ICONS = [HeartHandshake, BadgeCheck, PackageCheck, KeyRound];

export default function Home() {
  const t = useT();
  const x = t.experience;
  return (
    <>
      <section className="home-hero bg-forest-deep text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.08fr_1fr] lg:items-center lg:gap-14 lg:py-14">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-gold">{x.eyebrow}</p>
            <h1 className="mt-4 max-w-xl text-[clamp(2.25rem,4.5vw,3.5rem)] font-bold leading-[1.12] tracking-tight">
              {x.headline} <span className="text-gold">{x.highlight}</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80">{x.intro}</p>
            <div className="mt-6"><RouteSearch /></div>
          </div>
          <div className="min-w-0">
            <div className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-forest">
              <Image src="/images/packing-for-home.webp" alt={x.photoAlt} width={1080} height={810} sizes="(min-width: 1024px) 500px, 100vw" className="aspect-[4/3] w-full object-cover" priority />
              <div className="grid grid-cols-2 divide-x divide-white/15 px-3 py-5">
                <div className="flex items-start gap-2.5 px-3"><Gift className="mt-0.5 shrink-0 text-gold" size={20} aria-hidden /><span className="text-sm font-semibold leading-relaxed">{x.launch}</span></div>
                <div className="flex items-start gap-2.5 px-3"><HeartHandshake className="mt-0.5 shrink-0 text-gold" size={20} aria-hidden /><span className="text-sm font-semibold leading-relaxed">{x.commission}</span></div>
              </div>
            </div>
            <Leaderboard />
          </div>
        </div>
      </section>

      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-5 text-sm text-muted">
          {[[BadgeCheck, t.home.trustItems[1]], [KeyRound, t.home.trustItems[2]], [ShieldCheck, t.home.trustItems[4]]].map(([Icon, text], index) => {
            const TrustIcon = Icon as typeof BadgeCheck;
            return <span key={index} className="inline-flex items-center gap-2"><TrustIcon className="shrink-0 text-leaf" size={18} aria-hidden />{text as string}</span>;
          })}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="section-eyebrow">{t.home.routesLabel}</p><h2 className="mt-2 text-3xl font-bold text-forest">{x.allRoutes}</h2></div>
          <Link href="/trips" className="inline-flex min-h-11 items-center gap-2 font-semibold text-forest underline underline-offset-4">{t.home.browseAll}<ArrowRight size={17} aria-hidden /></Link>
        </div>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{x.routesNote}</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {corridors.map(([from, to]) => <Link key={`${from}-${to}`} href={browseHref("/trips", { from, to })} className="card card-lift group p-5">
            <p className="text-sm font-medium text-muted">{label(from)}</p>
            <p className="mt-2 flex items-start gap-2 text-base font-semibold text-forest"><ArrowRight className="mt-0.5 shrink-0 text-clay" size={18} aria-hidden />{label(to)}</p>
            <p className="mt-4 border-t border-line pt-3 text-sm font-semibold text-leaf">{x.viewRoute}</p>
          </Link>)}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <p className="section-eyebrow">{t.home.processLabel}</p>
          <h2 className="mt-2 text-3xl font-bold text-forest">{t.home.howTitle}</h2>
          <p className="mt-3 max-w-2xl text-base text-muted">{x.howNote}</p>
          <ol className="mt-9 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.steps.map((step, index) => <li key={step.title} className="border-t-2 border-line pt-5">
              <span className="font-display text-sm font-semibold text-clay-deep">0{index + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted">{step.body}</p>
            </li>)}
          </ol>
          <details className="getting-started mt-9 rounded-2xl border border-line bg-sand">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-forest">{t.howTo.title}<ChevronDown size={18} aria-hidden /></summary>
            <HowToStart />
          </details>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[0.85fr_1fr] md:gap-16 md:py-20">
        <div>
          <p className="section-eyebrow">{t.home.securityLabel}</p>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-forest md:text-4xl">{x.safetyTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted">{x.safetyIntro}</p>
          <Link href="/safety" className="btn-primary mt-6">{t.home.readSafety}<ArrowRight size={17} aria-hidden /></Link>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2">
          {t.home.securityPoints.map((point, index) => {
            const Icon = SECURITY_ICONS[index];
            return <li key={point.title}><span className="grid h-11 w-11 place-items-center rounded-xl bg-success-bg text-forest"><Icon size={21} aria-hidden /></span><h3 className="mt-3 text-base font-semibold">{point.title}</h3><p className="mt-2 text-base leading-relaxed text-muted">{point.body}</p></li>;
          })}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 md:pb-20">
        <div className="flex flex-col justify-between gap-7 rounded-3xl bg-forest px-6 py-8 text-white md:flex-row md:items-center md:px-10 md:py-10">
          <div><h2 className="max-w-lg text-2xl font-bold md:text-3xl">{t.home.ctaBandTitle}</h2><p className="mt-3 flex items-center gap-2 text-sm text-white/80"><Gift size={17} className="text-gold" aria-hidden />{x.launch} · {x.commission}</p></div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
            <Link href="/post/parcel" className="btn-inverse"><Package size={18} aria-hidden />{x.postParcel}</Link>
            <Link href="/post/trip" className="btn-outline-inverse"><Plane size={18} aria-hidden />{x.postTrip}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
