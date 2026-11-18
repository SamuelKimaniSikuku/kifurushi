"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown, Package, Plane, Truck } from "lucide-react";
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
  const routeValid = validCostRoute(from, to);
  const ready = routeValid && grams !== null;
  const estimates = tripState === "loaded" ? travellerEstimates(trips, from, to, weight) : [];
  const average = averageTravellerPrice(estimates);
  const hasRoute = upcomingOnRoute(trips, from, to).length > 0;
  const routes = Array.from(new Map(upcomingOnRoute(trips).map(trip => [`${trip.fromCountry}-${trip.toCountry}`, trip])).values()).slice(0, 3);
  const couriers = publishedCourierRates(from, to, weight).filter(quote => quote.provider === "dhl");
  const availableCouriers = couriers.filter(quote => quote.cents !== null);
  const planning = courierPlanningReference(from, to, weight, currency, exchange, undefined, "dhl");
  const locale = lang === "fr" ? "fr-FR" : lang === "sw" ? "sw-KE" : "en-GB";
  const countryName = (code: string) => new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  const routeName = (origin: string, destination: string) => `${countryName(origin)} → ${countryName(destination)}`;
  const money = (cents: number, code: CostCurrency = currency) => new Intl.NumberFormat(locale, { style: "currency", currency: code, currencyDisplay: "code", maximumFractionDigits: 2 }).format(cents / 100);
  const price = (cents: number, native: CostCurrency) => {
    const converted = convertCost(cents, native, currency, exchange);
    return `${converted !== null && native !== currency ? "≈ " : ""}${money(converted ?? cents, converted === null ? native : currency)}`;
  };
  const perKgPrice = (cents: number, native: CostCurrency) => {
    const converted = convertCost(cents, native, currency, exchange);
    return `${converted !== null && native !== currency ? "≈ " : ""}${money(effectivePricePerKg(converted ?? cents, grams!)!, converted === null ? native : currency)}`;
  };
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value);
  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
  const averageConverted = average ? convertCost(average.totalCents, "USD", currency, exchange) : null;
  const fxMissing = fxLoaded && (!exchange || convertCost(100, "USD", currency, exchange) === null || availableCouriers.some(quote => convertCost(quote.cents!, quote.currency, currency, exchange) === null));
  const waitingText = tripState === "loading" ? t.loading : tripState === "error" ? t.loadFailed : hasRoute ? t.noSpace : t.simpleNoTrip;
  const range = (low: number, high: number) => <>{money(low)}{low !== high && <> – {money(high)}</>}</>;

  return <div className={styles.page}>
    <header className={styles.hero}>
      <p className={styles.eyebrow}><Package size={16} aria-hidden="true" />{t.link}</p>
      <h1>{t.simpleTitle}</h1>
      <p>{t.simpleIntro}</p>
    </header>

    <div className={styles.calculator}>
      <section className={styles.form} aria-label={t.parcelTitle}>
        <div className={styles.fields}>
          <div><label htmlFor={`${id}-from`}>{t.simpleFrom}</label><CountrySelect id={`${id}-from`} value={from} onChange={setFrom} placeholder={t.simpleCountry} /></div>
          <div><label htmlFor={`${id}-to`}>{t.simpleTo}</label><CountrySelect id={`${id}-to`} value={to} onChange={setTo} placeholder={t.simpleCountry} /></div>
          <div><label htmlFor={`${id}-weight`}>{t.simpleWeight}</label><input id={`${id}-weight`} type="text" inputMode="decimal" autoComplete="off" maxLength={16} value={weight} placeholder="1" aria-invalid={weightInvalid} aria-describedby={`${id}-weight-hint${weightInvalid ? ` ${id}-weight-error` : ""}`} onChange={e => setWeight(e.target.value)} /></div>
          <div><label htmlFor={`${id}-currency`}>{t.simpleCurrency}</label><select id={`${id}-currency`} value={currency} onChange={e => chooseCurrency(e.target.value as CostCurrency)}>{COST_CURRENCIES.map(code => <option key={code} value={code}>{code}</option>)}</select></div>
        </div>
        <div className={styles.formHelp}>
          <p id={`${id}-weight-hint`}>{t.weightHint}</p>
          <div className={styles.presets} role="group" aria-label={t.quickWeights}>{[0.3, 1, 5, 10].map(value => <button key={value} type="button" aria-pressed={grams === value * 1000} onClick={() => setWeight(String(value))}>{number(value)} kg</button>)}</div>
        </div>
        {weightInvalid && <p id={`${id}-weight-error`} className={styles.error} role="alert">{t.weightInvalid}</p>}
        {from && from === to && <p className={styles.error} role="alert">{t.sameRoute}</p>}
      </section>

      {ready ? <section className={styles.results} aria-labelledby={`${id}-results-title`}>
        <div className={styles.resultHeading}><h2 id={`${id}-results-title`}>{t.simpleResults}</h2><p>{routeName(from, to)} · {number(grams / 1000)} kg</p></div>
        <div className={styles.priceList} aria-live="polite">
          <article className={`${styles.priceRow} ${styles.kifurushiRow}`}>
            <div className={styles.provider}><Plane size={20} aria-hidden="true" /><div><h3>Kifurushi</h3><p>{t.simpleAverage}</p>{average && <span className={styles.tripCount}>{t.simpleTrips(average.count)}</span>}</div></div>
            {average ? <div className={styles.amount}><p>{price(average.totalCents, "USD")}</p><small>{price(average.rateCents, "USD")} / kg</small></div> : <div className={styles.unavailable}><p>{waitingText}</p>{tripState === "error" && <button type="button" onClick={() => setAttempt(a => a + 1)}>{t.retry}</button>}</div>}
          </article>
          {availableCouriers.map(quote => {
            const converted = convertCost(quote.cents!, quote.currency, currency, exchange);
            const saving = averageConverted !== null && converted !== null ? converted - averageConverted : null;
            return <article className={styles.priceRow} key={quote.provider}>
              <div className={styles.provider}><Truck size={20} aria-hidden="true" /><div><h3>{quote.name}</h3><p>{t.baseRate}</p></div></div>
              <div className={styles.amount}><p>{price(quote.cents!, quote.currency)}</p><small>{perKgPrice(quote.cents!, quote.currency)} / kg</small>{saving !== null && saving > 0 && <span className={styles.saving}>{t.simpleSaving(money(saving))}</span>}</div>
            </article>;
          })}
          {planning && <article className={`${styles.priceRow} ${styles.referenceRow}`}>
            <div className={styles.provider}><Truck size={20} aria-hidden="true" /><div><h3>{t.simpleCourier}</h3><p className={styles.referenceBadge}>{t.simpleReference}</p></div></div>
            <div className={styles.amount}><p>≈ {range(planning.minCents, planning.maxCents)}</p><small>{range(effectivePricePerKg(planning.minCents, grams)!, effectivePricePerKg(planning.maxCents, grams)!)} / kg</small></div>
            <div className={styles.referenceNote}><p>{t.simpleReferenceNote}</p><p>{Array.from(new Set(planning.samples.map(sample => sample.from))).map(origin => routeName(origin, to)).join(" · ")}</p></div>
          </article>}
          {!availableCouriers.length && !planning && <div className={styles.quoteRow}><Truck size={19} aria-hidden="true" /><div><p>{!fxLoaded ? t.loading : couriers.some(quote => quote.reason === "expired") ? t.expired : couriers.some(quote => quote.reason === "weight") || grams > 30000 ? t.missingWeight : t.missingRoute}</p><a href="https://www.dhl.com/global-en/home/get-a-quote.html" target="_blank" rel="noopener noreferrer">{t.simpleNoQuote}<ArrowUpRight size={14} aria-hidden="true" /></a></div></div>}
        </div>
        {fxMissing && <p className={styles.notice} role="status">{t.simpleFx} <button type="button" onClick={() => setAttempt(a => a + 1)}>{t.retry}</button></p>}
        <p className={styles.estimateNote}>{t.simpleNote}</p>
        <div className={styles.actions}>
          <Link href={average ? browseHref("/trips", { from, to }) : postHref("parcel", { from, to })} className="btn-accent">{average ? t.simpleFind : t.post}<ArrowRight size={18} aria-hidden="true" /></Link>
          {average && <Link href={postHref("parcel", { from, to })}>{t.simplePost}</Link>}
        </div>
      </section> : <div className={styles.empty}>
        <p>{routeValid ? t.waiting : t.simpleStart}</p>
        {!from && !to && routes.length > 0 && <div className={styles.suggestions}><span>{t.simpleTry}</span>{routes.map(trip => <button type="button" key={`${trip.fromCountry}-${trip.toCountry}`} onClick={() => { setFrom(trip.fromCountry); setTo(trip.toCountry); }}>{routeName(trip.fromCountry, trip.toCountry)}<ArrowUpRight size={13} aria-hidden="true" /></button>)}</div>}
      </div>}
    </div>

    {ready && <details className={styles.details}>
      <summary>{t.simpleDetails}<ChevronDown size={17} aria-hidden="true" /></summary>
      <div className={styles.detailBody}>
        <section><h3>{t.averageTitle}</h3><p>{t.averageExplain}</p><p>{t.basedOn}</p></section>
        {availableCouriers.map(quote => {
          const converted = convertCost(quote.cents!, quote.currency, currency, exchange);
          const difference = averageConverted !== null && converted !== null ? converted - averageConverted : null;
          return <section key={quote.provider}>
            <h3>{quote.name} · {routeName(from, to)}</h3>
            <p>{money(quote.cents!, quote.currency)} · {t.upTo} {number(quote.billedGrams! / 1000)} kg · {t.checked} {date(quote.checkedOn)}</p>
            <p>{t.dhlNote}</p>
            {difference !== null && <p>{t.averageDifference}: {difference === 0 ? t.equal : `${money(Math.abs(difference))} ${difference > 0 ? t.averageLower : t.averageHigher}`}. {t.differenceNote}</p>}
            <a href={quote.source} target="_blank" rel="noopener noreferrer">{t.source}<ArrowUpRight size={14} aria-hidden="true" /></a>
          </section>;
        })}
        {planning && <section><h3>{t.referenceRoutes}</h3><p>{t.referenceMethod}</p><ul>{planning.samples.map(sample => <li key={`${sample.from}-${sample.quote.provider}`}><strong>{routeName(sample.from, sample.to)} · {sample.quote.name}</strong><p>{money(sample.cents!)} · {t.checked} {date(sample.quote.checkedOn)}</p><a href={sample.quote.source} target="_blank" rel="noopener noreferrer">{t.source}<ArrowUpRight size={14} aria-hidden="true" /></a></li>)}</ul></section>}
        <section><h3>{t.sourceDate}</h3><p>{t.perKgExplain}</p><p>{t.dhlCoverage}</p>{exchange ? <p>{t.fxNote} {date(exchange.date)}. <a href={exchange.source === "frankfurter" ? "https://frankfurter.dev" : "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html"} target="_blank" rel="noopener noreferrer">{exchange.source === "frankfurter" ? "Frankfurter" : "ECB"}</a>. {t.fxPurpose}</p> : fxLoaded && <p>{t.fxUnavailable}</p>}</section>
        <section><h3>{t.checkTitle}</h3><p>{t.checkText}</p><Link href="/safety">{t.safety}<ArrowRight size={14} aria-hidden="true" /></Link></section>
      </div>
    </details>}
  </div>;
}
