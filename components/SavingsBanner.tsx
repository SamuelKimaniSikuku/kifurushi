"use client";

import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { deliveryCostCopy } from "@/lib/locales/deliveryCosts";

export default function SavingsBanner() {
  const { lang } = useLang();
  const t = deliveryCostCopy[lang];
  return <section className="mx-auto max-w-6xl px-4 pt-10 md:pt-14">
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6 md:flex-row md:items-center md:justify-between md:p-8">
      <div className="max-w-2xl"><p className="section-eyebrow">{t.eyebrow}</p><h2 className="mt-2 text-2xl font-bold text-forest">{t.title}</h2><p className="mt-3 text-base text-muted">{t.intro}</p></div>
      <Link href="/compare-delivery-costs" className="btn-primary shrink-0"><Calculator size={18} aria-hidden />{t.link}<ArrowRight size={17} aria-hidden /></Link>
    </div>
  </section>;
}
