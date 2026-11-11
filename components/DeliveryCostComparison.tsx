"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Calculator } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { deliveryCostCopy } from "@/lib/locales/deliveryCosts";
import { amountInCents, compareDeliveryCosts } from "@/lib/deliveryCosts";

export default function DeliveryCostComparison() {
  const { lang } = useLang();
  const t = deliveryCostCopy[lang];
  const id = useId();
  const [currency, setCurrency] = useState("USD");
  const [courier, setCourier] = useState("");
  const [traveller, setTraveller] = useState("");
  const [example, setExample] = useState(false);
  const comparison = compareDeliveryCosts(courier, traveller);
  const courierInvalid = courier !== "" && (amountInCents(courier) === null || amountInCents(courier) === 0);
  const travellerInvalid = traveller !== "" && amountInCents(traveller) === null;
  const locale = lang === "fr" ? "fr-FR" : lang === "sw" ? "sw-KE" : "en-GB";
  const money = (cents: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(cents / 100);
  const percent = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const clear = () => { setCourier(""); setTraveller(""); setExample(false); };
  const showExample = () => {
    setCurrency("USD"); setCourier("100"); setTraveller("40"); setExample(true);
    const input = document.getElementById(`${id}-courier`);
    input?.scrollIntoView({ block: "center" });
    input?.focus({ preventScroll: true });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      <p className="section-eyebrow">{t.eyebrow}</p>
      <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-forest md:text-4xl">{t.title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{t.intro}</p>

      <section aria-label={t.link} className="card mt-8 overflow-hidden">
        <div className="grid md:grid-cols-[1.15fr_1fr]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor={`${id}-currency`} className="text-sm font-semibold text-forest">{t.currency}</label>
              <select id={`${id}-currency`} className="field !w-auto" value={currency} aria-describedby={`${id}-currency-note`} onChange={e => { setCurrency(e.target.value); clear(); }}>
                {['USD', 'EUR', 'GBP', 'KES'].map(code => <option key={code} value={code}>{code}</option>)}
              </select>
            </div>
            <p id={`${id}-currency-note`} className="mt-2 text-xs text-muted">{t.currencyNote}</p>
            <p id={`${id}-hint`} className="mt-5 text-sm text-muted">{t.inputHint}</p>
            <div className="mt-4">
              <label htmlFor={`${id}-courier`} className="field-label">{t.courier} ({currency})</label>
              <input id={`${id}-courier`} type="text" inputMode="decimal" autoComplete="off" maxLength={16} className={`field ${courierInvalid ? "field-invalid" : ""}`} value={courier} aria-invalid={courierInvalid} aria-describedby={`${id}-hint${courierInvalid ? ` ${id}-error` : ""}`} onChange={e => { setCourier(e.target.value); setExample(false); }} />
            </div>
            <div className="mt-4">
              <label htmlFor={`${id}-traveller`} className="field-label">{t.traveller} ({currency})</label>
              <input id={`${id}-traveller`} type="text" inputMode="decimal" autoComplete="off" maxLength={16} className={`field ${travellerInvalid ? "field-invalid" : ""}`} value={traveller} aria-invalid={travellerInvalid} aria-describedby={`${id}-hint${travellerInvalid ? ` ${id}-error` : ""}`} onChange={e => { setTraveller(e.target.value); setExample(false); }} />
            </div>
            {(courierInvalid || travellerInvalid) && <p id={`${id}-error`} className="field-error">{t.invalid}</p>}
            <p className="mt-4 text-sm leading-relaxed text-muted">{t.totalHint}</p>
            {(courier || traveller) && <button type="button" onClick={clear} className="mt-3 min-h-11 text-sm font-semibold text-forest underline underline-offset-4">{t.clear}</button>}
          </div>

          <div className="flex flex-col justify-center border-t border-line bg-success-bg p-5 sm:p-7 md:border-l md:border-t-0">
            <div role="status" aria-live="polite" aria-atomic="true">
              <Calculator size={26} className="text-forest" aria-hidden />
              {comparison ? <>
                <p className="mt-4 font-semibold text-forest">{comparison.differenceCents > 0 ? t.saving : comparison.differenceCents < 0 ? t.higher : t.same}</p>
                <p className="mt-3 break-words font-display text-4xl font-bold tracking-tight text-forest">{money(Math.abs(comparison.differenceCents))}</p>
                {comparison.differenceCents > 0 && <p className="mt-2 text-base text-forest">{percent(comparison.percent)}% {t.lower}</p>}
                {comparison.differenceCents < 0 && <p className="mt-2 text-sm text-forest">{t.higherNote}</p>}
                {example && <p className="mt-4 text-sm font-semibold text-forest">{t.exampleActive}</p>}
              </> : <p className="mt-4 text-lg font-semibold text-forest">{t.waiting}</p>}
              <p className="mt-4 text-sm leading-relaxed text-muted">{t.basedOn}</p>
            </div>
            <Link href="/trips" className="btn-primary mt-6">{t.find}<ArrowRight size={17} aria-hidden /></Link>
            <Link href="/post/parcel" className="mt-3 inline-flex min-h-11 items-center justify-center text-sm font-semibold text-forest underline underline-offset-4">{t.post}</Link>
          </div>
        </div>
      </section>

      <div className="mt-5 rounded-2xl border border-line px-5 py-4">
        <p className="text-sm font-semibold text-forest">{t.example}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t.exampleText}</p>
        <button type="button" className="mt-1 min-h-11 text-sm font-semibold text-forest underline underline-offset-4" onClick={showExample}>{t.tryExample}</button>
      </div>

      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div><h2 className="text-xl font-semibold text-forest">{t.whyTitle}</h2><p className="mt-3 text-base leading-relaxed text-muted">{t.whyText}</p></div>
        <div><h2 className="text-xl font-semibold text-forest">{t.checkTitle}</h2><p className="mt-3 text-base leading-relaxed text-muted">{t.checkText}</p><Link href="/safety" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-forest underline underline-offset-4">{t.safety}</Link></div>
      </section>
      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-lg font-semibold text-forest">{t.quoteTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.quoteText}</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <a href="https://www.dhl.com/global-en/home/get-a-quote.html" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-forest underline underline-offset-4">{t.quoteLink}<ArrowUpRight size={16} aria-hidden /></a>
          <a href="https://www.dhl.com/us-en/home/ship/shipping-faq.html" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted underline underline-offset-4">{t.sourceLink}<ArrowUpRight size={16} aria-hidden /></a>
        </div>
      </section>
    </div>
  );
}
