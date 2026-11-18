"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ArrowLeftRight, Calculator, ChevronDown, Info, Minus, Package, Plane, Plus, RotateCcw, Scale, Truck } from "lucide-react";
import CountrySelect from "./CountrySelect";
import { useLang } from "@/lib/i18n";
import { deliveryCostCopy } from "@/lib/locales/deliveryCosts";
import { weightInGrams } from "@/lib/deliveryCosts";
import { COST_CURRENCIES, averageTravellerPrice, effectivePricePerKg, convertCost, courierPlanningReference, publishedCourierRates, travellerEstimates, validCostRoute, type ExchangeRate, type CostCurrency } from "@/lib/automaticDeliveryCosts";
import { fetchTrips } from "@/lib/db";
import { upcomingOnRoute } from "@/lib/tripDiscovery";
import { browseHref, postHref } from "@/lib/routes";
import type { Trip } from "@/lib/types";
import styles from "./DeliveryCostComparison.module.css";

export default function DeliveryCostComparison() {
  const { lang } = useLang();
  const t = deliveryCostCopy[lang];
  const id = useId();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [weight, setWeight] = useState("1");
  const [currency, setCurrency] = useState<CostCurrency>("USD");
  const [priceView, setPriceView] = useState<"kg" | "total">("kg");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripState, setTripState] = useState<"loading" | "loaded" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [exchange, setExchange] = useState<ExchangeRate | null>(null);
  const [fxLoaded, setFxLoaded] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (validCostRoute(params.get("from") ?? "", params.get("to") ?? "")) {
      setFrom(params.get("from")!); setTo(params.get("to")!);
    }
    try {
      const saved = localStorage.getItem("kifurushi-cost-currency");
      if (COST_CURRENCIES.includes(saved as CostCurrency)) setCurrency(saved as CostCurrency);
    } catch { /* Currency selection still works when storage is unavailable. */ }
  }, []);
  const chooseCurrency = (code: CostCurrency) => {
    setCurrency(code);
    try { localStorage.setItem("kifurushi-cost-currency", code); } catch { /* Optional preference. */ }
  };
  useEffect(() => {
    let live = true;
    setTripState("loading");
    fetchTrips().then(items => { if (live) { setTrips(items); setTripState("loaded"); } })
      .catch(() => { if (live) { setTrips([]); setTripState("error"); } });
    return () => { live = false; };
  }, [attempt]);
  useEffect(() => {
    const controller = new AbortController();
    setFxLoaded(false);
    setExchange(null);
    fetch("/api/delivery-exchange-rate", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("No exchange rate");
      const data: ExchangeRate = await response.json();
      if (!controller.signal.aborted) setExchange(data);
    }).catch(() => {}).finally(() => { if (!controller.signal.aborted) setFxLoaded(true); });
    return () => controller.abort();
  }, [attempt]);

  const grams = weightInGrams(weight);
  const weightInvalid = weight !== "" && grams === null;
  const ready = validCostRoute(from, to) && grams !== null;
  const estimates = tripState === "loaded" ? travellerEstimates(trips, from, to, weight) : [];
  const best = estimates[0];
  const average = averageTravellerPrice(estimates);
  const hasRoute = upcomingOnRoute(trips, from, to).length > 0;
  const routes = Array.from(new Map(upcomingOnRoute(trips).map(trip => [`${trip.fromCountry}-${trip.toCountry}`, trip])).values()).slice(0, 6);
  const couriers = publishedCourierRates(from, to, weight);
  const availableCouriers = couriers.filter(quote => quote.cents !== null);
  const planning = courierPlanningReference(from, to, weight, currency, exchange);
  const locale = lang === "fr" ? "fr-FR" : lang === "sw" ? "sw-KE" : "en-GB";
  const countryName = (code: string) => new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  const routeName = (origin: string, destination: string) => `${countryName(origin)} → ${countryName(destination)}`;
  const money = (cents: number, code: CostCurrency = currency) => new Intl.NumberFormat(locale, { style: "currency", currency: code, currencyDisplay: "code", maximumFractionDigits: 2 }).format(cents / 100);
  const price = (cents: number, native: CostCurrency) => {
    const converted = convertCost(cents, native, currency, exchange);
    return `${converted !== null && native !== currency ? "≈ " : ""}${money(converted ?? cents, converted === null ? native : currency)}`;
  };
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value);
  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
  const planningAmount = (cents: number) => money(priceView === "kg" && grams !== null ? effectivePricePerKg(cents, grams)! : cents);
  const averageConverted = average ? convertCost(average.totalCents, "USD", currency, exchange) : null;
  const fxMissing = fxLoaded && convertCost(100, "USD", currency, exchange) === null;
  const adjustWeight = (difference: number) => {
    if (!weightInvalid) setWeight(String(Math.min(1_000_000, Math.max(1, (grams ?? 0) + difference)) / 1000));
  };
  const waitingText = !ready ? t.waiting : tripState === "loading" ? t.loading : tripState === "error" ? t.loadFailed : hasRoute ? t.noSpace : t.noTrip;

  return <div className={styles.page}>
    <header className={styles.hero}>
      <div><p className={styles.eyebrow}><Calculator size={16} aria-hidden="true" />{t.link}</p><h1>{t.pageTitle}</h1><p className={styles.intro}>{t.pageIntro}</p></div>
      <div className={styles.currency}><label htmlFor={`${id}-currency`}>{t.currency}</label><select id={`${id}-currency`} value={currency} onChange={e => chooseCurrency(e.target.value as CostCurrency)}>{COST_CURRENCIES.map(code => <option key={code} value={code}>{code} · {new Intl.DisplayNames([locale], { type: "currency" }).of(code)}</option>)}</select></div>
    </header>
    {fxMissing && <p className={styles.currencyNotice} role="status">{t.selectedFxUnavailable} <button type="button" onClick={() => setAttempt(a => a + 1)}>{t.retry}</button></p>}
    <section aria-label={t.link} className={styles.calculator}>
      <div className={styles.formCard}>
        <div className={styles.formTitle}><span className={styles.iconTile}><Package size={23} aria-hidden="true" /></span><div><h2>{t.parcelTitle}</h2><p>{t.parcelSubtitle}</p></div></div>
        <div className={styles.inputStep}>
          <div className={styles.stepLabel}><span aria-hidden="true">1</span><p>{t.routeQuestion}</p></div>
          <div className={styles.routeFields}>
            <div><label className={styles.fieldLabel} htmlFor={`${id}-from`}>{t.from}</label><CountrySelect id={`${id}-from`} value={from} onChange={setFrom} placeholder={t.chooseCountry} /></div>
            <button type="button" className={styles.swap} aria-label={t.swap} onClick={() => { setFrom(to); setTo(from); }}><ArrowLeftRight size={19} aria-hidden="true" /></button>
            <div><label className={styles.fieldLabel} htmlFor={`${id}-to`}>{t.to}</label><CountrySelect id={`${id}-to`} value={to} onChange={setTo} placeholder={t.chooseCountry} /></div>
          </div>
          {from && from === to && <p className="field-error" role="alert">{t.sameRoute}</p>}
          <p className={styles.hint}>{t.countryNote}</p>
          {routes.length > 0 && <div className={styles.routeSuggestions}><p>{t.quickRoutes}</p><div>{routes.map(trip => <button key={`${trip.fromCountry}-${trip.toCountry}`} type="button" aria-pressed={from === trip.fromCountry && to === trip.toCountry} onClick={() => { setFrom(trip.fromCountry); setTo(trip.toCountry); }}>{trip.fromCity} → {trip.toCity}</button>)}</div></div>}
        </div>
        <div className={styles.inputStep}>
          <div className={styles.stepLabel}><span aria-hidden="true">2</span><label htmlFor={`${id}-weight`}>{t.weightQuestion}<span className="sr-only"> ({t.weight})</span></label></div>
          <div className={`${styles.weightControl} ${weightInvalid ? styles.invalid : ""}`}>
            <button type="button" aria-label={t.decreaseWeight} disabled={weightInvalid || grams === null || grams <= 500} onClick={() => adjustWeight(-500)}><Minus size={20} aria-hidden="true" /></button>
            <div><input id={`${id}-weight`} type="text" inputMode="decimal" autoComplete="off" maxLength={16} placeholder="—" value={weight} aria-invalid={weightInvalid} aria-describedby={`${id}-weight-hint${weightInvalid ? ` ${id}-weight-error` : ""}`} onChange={e => setWeight(e.target.value)} /><span aria-hidden="true">kg</span></div>
            <button type="button" aria-label={t.increaseWeight} disabled={weightInvalid || grams === 1_000_000} onClick={() => adjustWeight(500)}><Plus size={20} aria-hidden="true" /></button>
          </div>
          <div className={styles.presets} role="group" aria-label={t.quickWeights}>{[0.3, 1, 3, 5, 10].map(value => <button type="button" key={value} aria-pressed={grams === value * 1000} onClick={() => setWeight(String(value))}>{number(value)} kg</button>)}</div>
          <p id={`${id}-weight-hint`} className={styles.hint}>{t.weightHint}</p>
          {weightInvalid && <p id={`${id}-weight-error`} className="field-error">{t.weightInvalid}</p>}
        </div>
      </div>

      <aside className={styles.estimateCard} aria-label={t.estimateLabel}>
        <div className={styles.estimateTop}><span>{t.estimateLabel}</span><Package size={26} strokeWidth={1.5} aria-hidden="true" /></div>
        <div role="status" aria-live="polite" aria-atomic="true" className={styles.estimateBody}>
          <p className={styles.total}>{best ? price(best.totalCents, "USD") : "—"}</p>
          <p className={styles.estimateCaption}>{best ? t.estimateCaption : waitingText}</p>
          {best ? <>
            <div className={styles.receipt}><div><span>{number(best.grams / 1000)} kg × {price(best.rateCents, "USD")}/kg</span><strong>{price(best.totalCents, "USD")}</strong></div></div>
            <div className={styles.tripInfo}><Plane size={20} aria-hidden="true" /><div><strong>{best.trip.fromCity} → {best.trip.toCity}</strong><p>{t.departs} {date(best.trip.departDate)} · {number(best.trip.remainingKg)} kg {t.available}</p><p>{best.trip.travelerName} · {best.trip.travelerVerified ? t.verified : t.unverified}</p></div></div>
            <p className={styles.estimateNote}>{t.basedOn}</p>
          </> : <div className={styles.emptyFormula}><Scale size={20} aria-hidden="true" /><span>{t.weight} × {t.listedRate}</span></div>}
        </div>
        {tripState === "error" && <button className={styles.retry} onClick={() => setAttempt(a => a + 1)}>{t.retry}</button>}
        <div className={styles.estimateActions}>
          <Link href={best ? `/trips?open=${encodeURIComponent(best.trip.id)}` : browseHref("/trips", { from, to })} className="btn-accent btn-lg">{best ? t.viewTrip : t.find}<ArrowRight size={18} aria-hidden="true" /></Link>
          <Link href={postHref("parcel", { from, to })}>{t.post}<ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
      </aside>
    </section>

    <section className={styles.courierSection} aria-labelledby={`${id}-comparison-title`}>
      <div className={styles.sectionHeading}><div><h2 id={`${id}-comparison-title`}>{t.compareTitle}</h2><p>{t.compareIntro}</p></div><Truck size={26} aria-hidden="true" /></div>
      <div className={styles.viewToggle} role="group" aria-label={t.priceView}>
        <button type="button" aria-pressed={priceView === "kg"} onClick={() => setPriceView("kg")}>{t.perKg}</button>
        <button type="button" aria-pressed={priceView === "total"} onClick={() => setPriceView("total")}>{t.parcelTotal}</button>
      </div>
      <div className={styles.courierGrid} aria-live="polite">
        <article className={`${styles.courierCard} ${styles.averageCard}`}>
          <div className={styles.courierHeading}><h3>{t.averageTitle}</h3><span>{t.listedPrices}</span></div>
          <p className={styles.courierPrice}>{average ? <>{price(priceView === "kg" ? average.rateCents : average.totalCents, "USD")}{priceView === "kg" && <small> / kg</small>}</> : "—"}</p>
          {average && priceView === "kg" && <p className={styles.hint}>{t.parcelTotal}: {price(average.totalCents, "USD")}</p>}
          <p className={styles.hint}>{average ? t.averageSample(average.count) : waitingText}</p>
          <p className={styles.courierNote}>{t.averageExplain}</p>
          <Link className={styles.quoteLink} href={browseHref("/trips", { from, to })}>{t.find}<ArrowUpRight size={15} aria-hidden="true" /></Link>
        </article>
        {availableCouriers.map(quote => {
          const converted = quote.cents === null ? null : convertCost(quote.cents, quote.currency, currency, exchange);
          const difference = averageConverted !== null && converted !== null ? converted - averageConverted : null;
          const nativeAmount = quote.cents !== null && grams !== null ? (priceView === "kg" ? effectivePricePerKg(quote.cents, grams) : quote.cents) : null;
          const shownAmount = converted !== null && grams !== null ? (priceView === "kg" ? effectivePricePerKg(converted, grams) : converted) : null;
          const shownDifference = difference === null || grams === null ? null : (priceView === "kg" ? effectivePricePerKg(Math.abs(difference), grams) : Math.abs(difference));
          return <article className={styles.courierCard} key={quote.provider}>
            <div className={styles.courierHeading}><h3>{quote.name}</h3><span>{quote.provider === "dhl" ? t.baseRate : quote.provider === "posta" ? t.publishedTariff : t.tariff}</span></div>
            <p className={styles.hint}>{routeName(from, to)}</p>
            <p className={styles.courierPrice}>{ready && nativeAmount !== null ? <>{currency !== quote.currency && shownAmount !== null ? "≈ " : ""}{money(shownAmount ?? nativeAmount, shownAmount === null ? quote.currency : currency)}{priceView === "kg" && <small> / kg</small>}</> : "—"}</p>
            {ready && quote.cents !== null ? <>
              <p className={styles.hint}>{t.parcelTotal}: {price(quote.cents, quote.currency)}</p>
              <p className={styles.hint}>{quote.provider === "dhl" ? t.dhlWeight : t.upTo} {number(quote.billedGrams! / 1000)} kg{currency !== quote.currency && converted !== null ? ` · ${money(quote.cents, quote.currency)}` : ""}</p>
              <p className={styles.courierNote}>{quote.provider === "dhl" ? t.dhlNote : quote.provider === "posta" ? t.postaNote : t.colissimoNote}</p>
              {difference !== null && shownDifference !== null && <div className={`${styles.priceDifference} ${difference < 0 ? styles.higher : ""}`}><span>{t.averageDifference}</span><strong>{shownDifference === 0 ? t.equal : `${money(shownDifference)}${priceView === "kg" ? " / kg" : ""} ${difference > 0 ? t.averageLower : t.averageHigher}`}</strong></div>}
              <a className={styles.quoteLink} href={quote.source} target="_blank" rel="noopener noreferrer">{t.source}<ArrowUpRight size={15} aria-hidden="true" /></a>
              <p className={styles.hint}>{t.checked} {date(quote.checkedOn)}</p>
            </> : <><p className={styles.courierNote}>{!ready ? t.waiting : quote.reason === "expired" ? t.expired : quote.reason === "weight" ? t.missingWeight : t.missingRoute}</p><a className={styles.quoteLink} href={quote.provider === "dhl" ? "https://www.dhl.com/global-en/home/get-a-quote.html" : "https://www.laposte.fr/colissimo-en-ligne"} target="_blank" rel="noopener noreferrer">{t.quote}<ArrowUpRight size={15} aria-hidden="true" /></a></>}
          </article>;
        })}
        {planning && <article className={`${styles.courierCard} ${styles.planningCard}`}>
          <div className={styles.courierHeading}><h3>{t.planningTitle}</h3><span>{t.planningBadge}</span></div>
          <p className={styles.hint}>{t.selectedRoute}: {routeName(from, to)}</p>
          <p className={`${styles.courierPrice} ${styles.planningPrice}`}><span>≈ {planningAmount(planning.minCents)}</span>{planning.minCents !== planning.maxCents && <> – <span>{planningAmount(planning.maxCents)}</span></>}{priceView === "kg" && <small> / kg</small>}</p>
          {priceView === "kg" && <p className={styles.hint}>{t.parcelTotal}: {money(planning.minCents)}{planning.minCents !== planning.maxCents && ` – ${money(planning.maxCents)}`}</p>}
          <p className={styles.courierNote}>{t.planningExplain}</p>
          <div className={styles.referenceRoutes}><p>{t.referenceRoutes}</p>{Array.from(new Set(planning.samples.map(sample => sample.from))).map(origin => <span key={origin}>{routeName(origin, to)}</span>)}</div>
          <details className={styles.referenceDetails}><summary>{t.referenceDetails}<ChevronDown size={16} aria-hidden="true" /></summary>
            <p>{t.referenceMethod}</p>
            <ul>{planning.samples.map(sample => <li key={`${sample.from}-${sample.quote.provider}`}><strong>{routeName(sample.from, sample.to)}</strong><span>{sample.quote.name} · {planningAmount(sample.cents!)}{priceView === "kg" ? " / kg" : ""}</span><span>{t.checked} {date(sample.quote.checkedOn)}</span><a href={sample.quote.source} target="_blank" rel="noopener noreferrer">{t.source}<ArrowUpRight size={14} aria-hidden="true" /></a></li>)}</ul>
          </details>
          <a className={styles.quoteLink} href="https://www.dhl.com/global-en/home/get-a-quote.html" target="_blank" rel="noopener noreferrer">{t.quoteTitle}<ArrowUpRight size={15} aria-hidden="true" /></a>
        </article>}
        {!availableCouriers.length && !planning && <article className={styles.courierCard}>
          <div className={styles.courierHeading}><h3>{t.quoteTitle}</h3></div>
          <p className={styles.courierNote}>{!ready ? t.waiting : couriers.some(quote => quote.reason === "expired") ? t.expired : t.noReference}</p>
          {ready && <><p className={styles.hint}>{routeName(from, to)} · {number(grams! / 1000)} kg</p><p className={styles.courierNote}>{t.quoteNote}</p><a className={styles.quoteLink} href="https://www.dhl.com/global-en/home/get-a-quote.html" target="_blank" rel="noopener noreferrer">{t.quote}<ArrowUpRight size={15} aria-hidden="true" /></a></>}
        </article>}
      </div>
      <p className={styles.comparisonNote}>{t.perKgExplain}</p>
      <p className={styles.comparisonNote}>{t.differenceNote}</p>
      <details className={styles.dataNote}><summary><Info size={16} aria-hidden="true" />{t.sourceDate}<ChevronDown size={16} aria-hidden="true" /></summary><p>{t.coverage}</p></details>
      {exchange ? <p className={styles.comparisonNote}>{t.fxNote} {date(exchange.date)}. <a href={exchange.source === "frankfurter" ? "https://frankfurter.dev" : "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html"} target="_blank" rel="noopener noreferrer">{exchange.source === "frankfurter" ? "Frankfurter" : "ECB"}</a>. {t.fxPurpose}</p> : fxLoaded && <p className={styles.comparisonNote}>{t.fxUnavailable}</p>}
    </section>
    <button type="button" onClick={() => { setFrom(""); setTo(""); setWeight("1"); }} className={styles.reset}><RotateCcw size={14} aria-hidden="true" />{t.clear}</button>
    <section className={styles.help} aria-labelledby={`${id}-help-title`}><h2 id={`${id}-help-title`}>{t.goodToKnow}</h2>
      <details><summary>{t.whyTitle}<ChevronDown size={18} aria-hidden="true" /></summary><p>{t.whyText}</p></details>
      <details><summary>{t.checkTitle}<ChevronDown size={18} aria-hidden="true" /></summary><p>{t.checkText}</p><Link href="/safety">{t.safety}<ArrowRight size={15} aria-hidden="true" /></Link></details>
    </section>
  </div>;
}
