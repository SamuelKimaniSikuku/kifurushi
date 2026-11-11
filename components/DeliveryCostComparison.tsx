"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Calculator } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { deliveryCostCopy } from "@/lib/locales/deliveryCosts";
import { amountInCents, compareDeliveryCosts, estimateTravellerCost, weightInGrams } from "@/lib/deliveryCosts";

export default function DeliveryCostComparison() {
  const { lang } = useLang();
  const t = deliveryCostCopy[lang];
  const id = useId();
  const [currency, setCurrency] = useState("USD");
  const [courier, setCourier] = useState("");
  const [weight, setWeight] = useState("");
  const [rate, setRate] = useState("");
  const [extras, setExtras] = useState("");
  const [example, setExample] = useState(false);
  const estimate = estimateTravellerCost(weight, rate, extras);
  const comparison = compareDeliveryCosts(courier, estimate ? (estimate.totalCents / 100).toFixed(2) : "");
  const courierInvalid = courier !== "" && (amountInCents(courier) === null || amountInCents(courier) === 0);
  const weightInvalid = weight !== "" && weightInGrams(weight) === null;
  const rateInvalid = rate !== "" && amountInCents(rate) === null;
  const extrasInvalid = extras.trim() !== "" && amountInCents(extras) === null;
  const totalInvalid = weight !== "" && rate !== "" && !weightInvalid && !rateInvalid && !extrasInvalid && !estimate;
  const locale = lang === "fr" ? "fr-FR" : lang === "sw" ? "sw-KE" : "en-GB";
  const money = (cents: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(cents / 100);
  const percent = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const clearPrices = () => { setCourier(""); setRate(""); setExtras(""); setExample(false); };
  const clear = () => { clearPrices(); setWeight(""); };
  const showExample = () => {
    setCurrency("USD"); setCourier("100"); setWeight("5"); setRate("10"); setExtras(""); setExample(true);
    const input = document.getElementById(`${id}-weight`);
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
              <select id={`${id}-currency`} className="field !w-auto" value={currency} aria-describedby={`${id}-currency-note`} onChange={e => { setCurrency(e.target.value); clearPrices(); }}>
                {['USD', 'EUR', 'GBP', 'KES'].map(code => <option key={code} value={code}>{code}</option>)}
              </select>
            </div>
            <p id={`${id}-currency-note`} className="mt-2 text-xs text-muted">{t.currencyNote}</p>
            <p className="mt-5 text-sm font-semibold text-forest">{t.inputHint}</p>
            <div className="mt-4">
              <label htmlFor={`${id}-weight`} className="field-label">{t.weight}</label>
              <input id={`${id}-weight`} type="text" inputMode="decimal" autoComplete="off" maxLength={16} className={`field ${weightInvalid ? "field-invalid" : ""}`} value={weight} aria-invalid={weightInvalid} aria-describedby={`${id}-weight-hint${weightInvalid ? ` ${id}-weight-error` : ""}`} onChange={e => { setWeight(e.target.value); setExample(false); }} />
              <p id={`${id}-weight-hint`} className="mt-2 text-xs text-muted">{t.weightHint}</p>
              {weightInvalid && <p id={`${id}-weight-error`} className="field-error">{t.weightInvalid}</p>}
            </div>
            <div className="mt-4">
              <label htmlFor={`${id}-rate`} className="field-label">{t.rate} ({currency}/kg)</label>
              <input id={`${id}-rate`} type="text" inputMode="decimal" autoComplete="off" maxLength={16} className={`field ${rateInvalid ? "field-invalid" : ""}`} value={rate} aria-invalid={rateInvalid} aria-describedby={`${id}-rate-hint${rateInvalid ? ` ${id}-rate-error` : ""}`} onChange={e => { setRate(e.target.value); setExample(false); }} />
              <p id={`${id}-rate-hint`} className="mt-2 text-xs text-muted">{t.rateHint}</p>
              {rateInvalid && <p id={`${id}-rate-error`} className="field-error">{t.invalid}</p>}
            </div>
            <details className="mt-3">
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-forest">{t.extras}</summary>
              <div className="pb-3">
                <label htmlFor={`${id}-extras`} className="field-label">{t.extrasLabel} ({currency})</label>
                <input id={`${id}-extras`} type="text" inputMode="decimal" autoComplete="off" maxLength={16} placeholder="0" className={`field ${extrasInvalid ? "field-invalid" : ""}`} value={extras} aria-invalid={extrasInvalid} aria-describedby={`${id}-extras-hint${extrasInvalid ? ` ${id}-extras-error` : ""}`} onChange={e => { setExtras(e.target.value); setExample(false); }} />
                <p id={`${id}-extras-hint`} className="mt-2 text-xs text-muted">{t.extrasHint}</p>
                {extrasInvalid && <p id={`${id}-extras-error`} className="field-error">{t.invalid}</p>}
              </div>
            </details>
            <div className="mt-4 border-t border-line pt-5">
              <label htmlFor={`${id}-courier`} className="field-label">{t.courier} ({currency})</label>
              <input id={`${id}-courier`} type="text" inputMode="decimal" autoComplete="off" maxLength={16} className={`field ${courierInvalid ? "field-invalid" : ""}`} value={courier} aria-invalid={courierInvalid} aria-describedby={`${id}-total-hint${courierInvalid ? ` ${id}-courier-error` : ""}`} onChange={e => { setCourier(e.target.value); setExample(false); }} />
              {courierInvalid && <p id={`${id}-courier-error`} className="field-error">{t.invalid}</p>}
            </div>
            <p id={`${id}-total-hint`} className="mt-4 text-sm leading-relaxed text-muted">{t.totalHint}</p>
            {(courier || weight || rate || extras) && <button type="button" onClick={clear} className="mt-3 min-h-11 text-sm font-semibold text-forest underline underline-offset-4">{t.clear}</button>}
          </div>

          <div className="flex flex-col justify-center border-t border-line bg-success-bg p-5 sm:p-7 md:border-l md:border-t-0">
            <div role="status" aria-live="polite" aria-atomic="true">
              <Calculator size={26} className="text-forest" aria-hidden />
              {estimate ? <>
                <p className="mt-4 font-semibold text-forest">{t.traveller}</p>
                <p className="mt-3 break-words font-display text-4xl font-bold tracking-tight text-forest">{money(estimate.totalCents)}</p>
                <p className="mt-2 text-sm text-forest">{new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(estimate.grams / 1000)} kg × {money(estimate.rateCents)}/kg = {money(estimate.carryingCents)}</p>
                {estimate.otherCents > 0 && <p className="mt-1 text-sm text-muted">+ {money(estimate.otherCents)} · {t.extrasLabel}</p>}
                <div className="mt-5 border-t border-forest/15 pt-5">
                  {comparison ? <>
                    <p className="font-semibold text-forest">{comparison.differenceCents > 0 ? t.saving : comparison.differenceCents < 0 ? t.higher : t.same}</p>
                    <p className="mt-2 break-words font-display text-3xl font-bold text-forest">{money(Math.abs(comparison.differenceCents))}</p>
                    {comparison.differenceCents > 0 && <p className="mt-2 text-base text-forest">{percent(comparison.percent)}% {t.lower}</p>}
                    {comparison.differenceCents < 0 && <p className="mt-2 text-sm text-forest">{t.higherNote}</p>}
                  </> : <p className="text-sm text-forest">{t.addQuote}</p>}
                </div>
              </> : <p className="mt-4 text-lg font-semibold text-forest">{totalInvalid ? t.totalInvalid : t.waiting}</p>}
              {example && <p className="mt-4 text-sm font-semibold text-forest">{t.exampleActive}</p>}
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
