"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Calculator, ChevronDown, Info, Minus, Package, Plus, RotateCcw, Scale, Truck } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { deliveryCostCopy } from "@/lib/locales/deliveryCosts";
import { amountInCents, compareDeliveryCosts, estimateTravellerCost, weightInGrams } from "@/lib/deliveryCosts";
import styles from "./DeliveryCostComparison.module.css";

function MoneyField({ id, label, currency, suffix, value, onChange, hint, error }: {
  id: string; label: string; currency: string; suffix?: string; value: string;
  onChange: (value: string) => void; hint?: string; error?: string;
}) {
  return <div>
    <label htmlFor={id} className={styles.fieldLabel}>{label}</label>
    <div className={`${styles.moneyInput} ${error ? styles.invalid : ""}`}>
      <span aria-hidden="true">{currency}</span>
      <input id={id} type="text" inputMode="decimal" autoComplete="off" maxLength={16} value={value} placeholder="—"
        aria-invalid={!!error} aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
        onChange={e => onChange(e.target.value)} />
      {suffix && <span aria-hidden="true">{suffix}</span>}
    </div>
    {hint && <p id={`${id}-hint`} className={styles.hint}>{hint}</p>}
    {error && <p id={`${id}-error`} className="field-error">{error}</p>}
  </div>;
}

export default function DeliveryCostComparison() {
  const { lang } = useLang();
  const t = deliveryCostCopy[lang];
  const id = useId();
  const [currency, setCurrency] = useState("USD");
  const [courier, setCourier] = useState("");
  const [weight, setWeight] = useState("");
  const [rate, setRate] = useState("");
  const [extras, setExtras] = useState("");
  const [examplePrices, setExamplePrices] = useState({ rate: false, courier: false });
  const example = examplePrices.rate || examplePrices.courier;
  const estimate = estimateTravellerCost(weight, rate, extras);
  const comparison = compareDeliveryCosts(courier, estimate ? (estimate.totalCents / 100).toFixed(2) : "");
  const grams = weightInGrams(weight);
  const courierInvalid = courier !== "" && (amountInCents(courier) === null || amountInCents(courier) === 0);
  const weightInvalid = weight !== "" && grams === null;
  const rateInvalid = rate !== "" && amountInCents(rate) === null;
  const extrasInvalid = extras.trim() !== "" && amountInCents(extras) === null;
  const totalInvalid = weight !== "" && rate !== "" && !weightInvalid && !rateInvalid && !extrasInvalid && !estimate;
  const locale = lang === "fr" ? "fr-FR" : lang === "sw" ? "sw-KE" : "en-GB";
  const money = (cents: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(cents / 100);
  const number = (value: number, digits = 3) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  const clearPrices = () => { setCourier(""); setRate(""); setExtras(""); setExamplePrices({ rate: false, courier: false }); };
  const clear = () => { clearPrices(); setWeight(""); };
  const adjustWeight = (difference: number) => {
    if (weightInvalid) return;
    setWeight(String(Math.min(1_000_000, Math.max(1, (grams ?? 0) + difference)) / 1000));
  };
  const showExample = () => {
    setCurrency("USD"); setCourier("100"); setWeight("5"); setRate("10"); setExtras("");
    setExamplePrices({ rate: true, courier: true });
    document.getElementById(`${id}-calculator`)?.scrollIntoView({ block: "start" });
  };
  const maximumCost = comparison ? Math.max(comparison.courierCents, comparison.travellerCents) : 1;

  return <div className={styles.page}>
    <header className={styles.hero}>
      <div>
        <p className={styles.eyebrow}><Calculator size={16} aria-hidden="true" />{t.link}</p>
        <h1>{t.pageTitle}</h1>
        <p className={styles.intro}>{t.pageIntro}</p>
      </div>
      <div className={styles.exampleAction}>
        <span>{t.examplePrompt}</span>
        <button type="button" onClick={showExample}>{t.tryExample}<ArrowRight size={16} aria-hidden="true" /></button>
      </div>
    </header>

    {example && <div className={styles.exampleNotice} role="status">
      <Info size={18} aria-hidden="true" /><span>{t.exampleNotice}</span>
      <button type="button" onClick={clear}>{t.clear}</button>
    </div>}

    <section id={`${id}-calculator`} aria-label={t.link} className={styles.calculator}>
      <div className={styles.formCard}>
        <div className={styles.formHeading}>
          <div className={styles.formTitle}><span className={styles.iconTile}><Package size={23} aria-hidden="true" /></span><div><h2>{t.parcelTitle}</h2><p>{t.parcelSubtitle}</p></div></div>
          <div className={styles.currency}>
            <label htmlFor={`${id}-currency`}>{t.currency}</label>
            <select id={`${id}-currency`} value={currency} aria-describedby={`${id}-currency-note`} onChange={e => { setCurrency(e.target.value); clearPrices(); }}>
              {['USD', 'EUR', 'GBP', 'KES'].map(code => <option key={code} value={code}>{code}</option>)}
            </select>
          </div>
        </div>
        <p id={`${id}-currency-note`} className={styles.currencyNote}>{t.currencyNote}</p>

        <div className={styles.inputStep}>
          <div className={styles.stepLabel}><span aria-hidden="true">1</span><label htmlFor={`${id}-weight`}>{t.weightQuestion}<span className="sr-only"> ({t.weight})</span></label></div>
          <div className={`${styles.weightControl} ${weightInvalid ? styles.invalid : ""}`}>
            <button type="button" aria-label={t.decreaseWeight} disabled={weightInvalid || grams === null || grams <= 500} onClick={() => adjustWeight(-500)}><Minus size={20} aria-hidden="true" /></button>
            <div><input id={`${id}-weight`} type="text" inputMode="decimal" autoComplete="off" maxLength={16} placeholder="—" value={weight}
              aria-invalid={weightInvalid} aria-describedby={`${id}-weight-hint${weightInvalid ? ` ${id}-weight-error` : ""}`} onChange={e => setWeight(e.target.value)} /><span aria-hidden="true">kg</span></div>
            <button type="button" aria-label={t.increaseWeight} disabled={weightInvalid || grams === 1_000_000} onClick={() => adjustWeight(500)}><Plus size={20} aria-hidden="true" /></button>
          </div>
          <div className={styles.presets} role="group" aria-label={t.quickWeights}>
            {[0.3, 1, 3, 5, 10].map(value => <button type="button" key={value} aria-pressed={grams === value * 1000} onClick={() => setWeight(String(value))}>{number(value)} kg</button>)}
          </div>
          <p id={`${id}-weight-hint`} className={styles.hint}>{t.weightHint}</p>
          {weightInvalid && <p id={`${id}-weight-error`} className="field-error">{t.weightInvalid}</p>}
        </div>

        <div className={styles.inputStep}>
          <div className={styles.stepLabel}><span aria-hidden="true">2</span><p>{t.rateQuestion}</p></div>
          <MoneyField id={`${id}-rate`} label={`${t.rate} (${currency}/kg)`} currency={currency} suffix="/ kg" value={rate}
            onChange={value => { setRate(value); setExamplePrices(previous => ({ ...previous, rate: false })); }} hint={t.rateHint} error={rateInvalid ? t.invalid : undefined} />
        </div>

        <details className={styles.extras}>
          <summary><span><Plus size={17} aria-hidden="true" />{t.extras}</span><span className={styles.extrasAmount}>{estimate && estimate.otherCents > 0 ? money(estimate.otherCents) : <ChevronDown size={17} aria-hidden="true" />}</span></summary>
          <div><MoneyField id={`${id}-extras`} label={`${t.extrasLabel} (${currency})`} currency={currency} value={extras} onChange={setExtras} hint={t.extrasHint} error={extrasInvalid ? t.invalid : undefined} /></div>
        </details>
      </div>

      <aside className={styles.estimateCard} aria-label={t.estimateLabel}>
        <div className={styles.estimateTop}><span>{t.estimateLabel}</span><Package size={26} strokeWidth={1.5} aria-hidden="true" /></div>
        <div role="status" aria-live="polite" aria-atomic="true" className={styles.estimateBody}>
          <p className={styles.total}>{estimate ? money(estimate.totalCents) : '—'}</p>
          <p className={styles.estimateCaption}>{estimate ? t.estimateCaption : totalInvalid ? t.totalInvalid : t.waiting}</p>
          {estimate ? <div className={styles.receipt}>
            <div><span>{number(estimate.grams / 1000)} kg × {money(estimate.rateCents)}/kg</span><strong>{money(estimate.carryingCents)}</strong></div>
            <div><span>{t.otherCharges}</span><strong>{money(estimate.otherCents)}</strong></div>
          </div> : <div className={styles.emptyFormula}><Scale size={20} aria-hidden="true" /><span>{t.weight} × {t.rate}</span></div>}
          <p className={styles.estimateNote}>{t.basedOn}</p>
        </div>
        <div className={styles.estimateActions}>
          <Link href="/trips" className="btn-accent btn-lg">{t.find}<ArrowRight size={18} aria-hidden="true" /></Link>
          <Link href="/post/parcel">{t.post}<ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
      </aside>
    </section>

    <section className={styles.comparisonCard} aria-labelledby={`${id}-comparison-title`}>
      <div className={styles.quoteForm}>
        <div className={styles.compareHeading}><Truck size={22} aria-hidden="true" /><span>{t.optional}</span></div>
        <h2 id={`${id}-comparison-title`}>{t.compareTitle}</h2>
        <p className={styles.compareIntro}>{t.compareIntro}</p>
        <MoneyField id={`${id}-courier`} label={`${t.courierField} (${currency})`} currency={currency} value={courier}
          onChange={value => { setCourier(value); setExamplePrices(previous => ({ ...previous, courier: false })); }} hint={t.courierHint} error={courierInvalid ? t.courierInvalid : undefined} />
        <a href="https://www.dhl.com/global-en/home/get-a-quote.html" target="_blank" rel="noopener noreferrer" className={styles.quoteLink}>{t.quoteLink}<ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
      <div className={styles.comparisonResult} role="status" aria-live="polite" aria-atomic="true">
        {comparison ? <>
          <div className={styles.barRow}><div><span>{t.traveller}</span><strong>{money(comparison.travellerCents)}</strong></div><div className={styles.barTrack} aria-hidden="true"><span className={styles.travellerBar} style={{ width: `${comparison.travellerCents / maximumCost * 100}%` }} /></div></div>
          <div className={styles.barRow}><div><span>{t.courierLabel}</span><strong>{money(comparison.courierCents)}</strong></div><div className={styles.barTrack} aria-hidden="true"><span className={styles.courierBar} style={{ width: `${comparison.courierCents / maximumCost * 100}%` }} /></div></div>
          <div className={`${styles.saving} ${comparison.differenceCents < 0 ? styles.higher : ''}`}>
            <div><p>{comparison.differenceCents > 0 ? t.saving : comparison.differenceCents < 0 ? t.higher : t.same}</p><strong>{money(Math.abs(comparison.differenceCents))}</strong></div>
            {comparison.differenceCents > 0 && <span className={styles.savingPercent}>{number(comparison.percent, 1)}%</span>}
            {comparison.differenceCents < 0 && <p>{t.higherNote}</p>}
          </div>
          {comparison.differenceCents > 0 && <p className={styles.comparisonNote}>{number(comparison.percent, 1)}% {t.lower}</p>}
          <p className={styles.comparisonNote}>{t.totalHint}</p>
        </> : <div className={styles.comparisonEmpty}><span><Scale size={25} aria-hidden="true" /></span><p>{t.comparisonWaiting}</p><small>{estimate ? t.addQuote : t.comparisonHelp}</small></div>}
      </div>
    </section>

    {(weight || rate || courier || extras) && <button type="button" onClick={clear} className={styles.reset}><RotateCcw size={14} aria-hidden="true" />{t.clear}</button>}

    <section className={styles.help} aria-labelledby={`${id}-help-title`}>
      <h2 id={`${id}-help-title`}>{t.goodToKnow}</h2>
      <details><summary>{t.whyTitle}<ChevronDown size={18} aria-hidden="true" /></summary><p>{t.whyText}</p></details>
      <details><summary>{t.checkTitle}<ChevronDown size={18} aria-hidden="true" /></summary><p>{t.checkText}</p><Link href="/safety">{t.safety}<ArrowRight size={15} aria-hidden="true" /></Link></details>
      <details><summary>{t.quoteTitle}<ChevronDown size={18} aria-hidden="true" /></summary><p>{t.quoteText}</p><a href="https://www.dhl.com/us-en/home/ship/shipping-faq.html" target="_blank" rel="noopener noreferrer">{t.sourceLink}<ArrowUpRight size={15} aria-hidden="true" /></a></details>
    </section>
  </div>;
}
