import { ALL_COUNTRIES } from "./countries";
import { estimateTravellerCost, weightInGrams } from "./deliveryCosts";
import { upcomingOnRoute } from "./tripDiscovery";
import type { Trip } from "./types";
import dhl from "./data/dhl-france-2026.json";
import dhlEgypt from "./data/dhl-eg-2026.json";
import dhlIndia from "./data/dhl-in-2026.json";
import postaKenya from "./data/posta-kenya-ems.json";

const countries = new Set(ALL_COUNTRIES.map(c => c.code));
export const validCostRoute = (from: string, to: string) => countries.has(from) && countries.has(to) && from !== to;

/** Only actual upcoming listings with enough advertised capacity become price estimates. */
export function travellerEstimates(trips: Trip[], from: string, to: string, weight: string, today?: string) {
  const grams = weightInGrams(weight);
  if (!validCostRoute(from, to) || grams === null) return [];
  return upcomingOnRoute(trips, from, to, today).flatMap(trip => {
    if (!Number.isFinite(trip.remainingKg) || Math.round(trip.remainingKg * 1000) < grams) return [];
    const estimate = estimateTravellerCost(weight, String(trip.pricePerKg));
    return estimate ? [{ trip, ...estimate }] : [];
  }).sort((a, b) => a.totalCents - b.totalCents || a.trip.departDate.localeCompare(b.trip.departDate) || a.trip.id.localeCompare(b.trip.id));
}

/** Each eligible listing has equal weight; this is a listed-price mean, not completed payments. */
export function averageTravellerPrice(estimates: ReturnType<typeof travellerEstimates>) {
  if (!estimates.length) return null;
  const mean = estimates.reduce((sum, estimate) => sum + estimate.rateCents, 0) / estimates.length;
  return {
    count: estimates.length,
    rateCents: Math.round(mean),
    totalCents: Math.round(mean * estimates[0].grams / 1000),
  };
}

/** Effective price per actual kg, after the courier's weight band has been applied. */
export function effectivePricePerKg(totalCents: number, grams: number): number | null {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0 || !Number.isSafeInteger(grams) || grams <= 0) return null;
  const result = Math.round(totalCents * 1000 / grams);
  return Number.isSafeInteger(result) ? result : null;
}

// Explicit export zones from the French guide, pp. 23–26. Never use these for reverse routes.
const dhlZones: Record<string, number> = {};
[
  "DE BE ES IT NL", "AT DK IE PT", "SE", "GB", "CH NO TR", "US CA",
  "ZA DZ EG MA TN AE CN IN",
  "LY SD BJ BF CV CI GM GH GN GW LR ML MR NE NG SN SL TG BI KM DJ ER ET KE MG MW MU RW SC SO SS TZ UG ZM ZW AO CM CF TD CG CD GQ GA ST BW SZ LS MZ NA SA QA AU",
].forEach((codes, index) => codes.split(" ").forEach(code => { dhlZones[code] = index; }));

// Public retail postage from metropolitan France, 2026. Prices in euro cents.
// Source: https://www.laposte.fr/tarifs-postaux-colis (checked 2026-11-12).
const colissimoBands = [500, 1000, 2000, 5000, 10000, 15000, 20000];
const colissimo = {
  europe: [1499, 1939, 2219, 2859, 4699, 6799, 8799],
  uk: [1899, 2339, 2619, 3259, 5099, 7199, 9199],
  b: [2379, 2839, 3109, 3989, 6609, 8959, 10949],
  c: [3519, 3919, 5399, 7869, 14899, 21079, 25689],
};
const europe = new Set("DE NL BE IT ES PT SE DK AT IE CH".split(" "));
const zoneB = new Set("NO DZ MA TN".split(" "));
// Do not infer a zone where the publisher's broad region label is ambiguous.
const unverifiedColissimo = new Set(["TR", "LY", "MR"]);

export type CourierRate = {
  provider: "colissimo" | "dhl" | "posta";
  name: string;
  currency: CostCurrency;
  cents: number | null;
  billedGrams: number | null;
  reason: "route" | "weight" | "expired" | null;
  source: string;
  checkedOn: string;
  validThrough: string;
};

/** Published parcel tariffs only; no tax, fuel, dimensional-weight or negotiated-rate assumptions. */
export function publishedCourierRates(from: string, to: string, weight: string, today = new Date().toISOString().slice(0, 10)): CourierRate[] {
  const grams = weightInGrams(weight);
  const common = { currency: "EUR" as const, checkedOn: "2026-11-12", validThrough: "2026-12-31" };
  const result: CourierRate[] = [
    { ...common, provider: "colissimo", name: "Colissimo International", source: "https://www.laposte.fr/tarifs-postaux-colis", cents: null, billedGrams: null, reason: "route" },
    { ...common, provider: "dhl", name: "DHL Express Worldwide", source: dhl.source, cents: null, billedGrams: null, reason: "route" },
  ];
  if (!validCostRoute(from, to)) return result;
  if (from === "KE") {
    const zone = (postaKenya.zones as Record<string, number>)[to];
    const row = grams === null ? undefined : postaKenya.parcelRows.find(row => grams <= row[0]);
    const reason = zone === undefined ? "route" : today < postaKenya.checkedOn || today > postaKenya.reviewAfter ? "expired" : !row ? "weight" : null;
    result.push({
      provider: "posta", name: "Posta Kenya EMS", currency: "KES",
      source: postaKenya.source, checkedOn: postaKenya.checkedOn, validThrough: postaKenya.reviewAfter,
      cents: reason === null ? row![zone + 1] : null,
      billedGrams: reason === null ? row![0] : null, reason,
    });
  }
  for (const item of result) {
    if (item.provider === "posta") continue;
    const table = from === "FR" ? { ...dhl, zones: dhlZones, maxGrams: 30000 }
      : from === "EG" ? dhlEgypt : from === "IN" ? dhlIndia : null;
    if ((item.provider === "colissimo" && from !== "FR") || (item.provider === "dhl" && !table)) continue;
    if (item.provider === "dhl" && table) { item.currency = table.currency as CostCurrency; item.source = table.source; }
    if (today < "2026-01-01" || today > item.validThrough) { item.reason = "expired"; continue; }
    if (grams === null) { item.reason = "weight"; continue; }
    if (item.provider === "colissimo") {
      if (unverifiedColissimo.has(to)) continue;
      const zone = europe.has(to) ? "europe" : to === "GB" ? "uk" : zoneB.has(to) ? "b" : "c";
      const bands = zone === "europe" || zone === "uk" ? [...colissimoBands.slice(0, -1), 30000] : colissimoBands;
      const index = bands.findIndex(max => grams <= max);
      if (index < 0) { item.reason = "weight"; continue; }
      item.cents = colissimo[zone][index]; item.billedGrams = bands[index]; item.reason = null;
    } else {
      const zone = (table!.zones as Record<string, number>)[to];
      if (zone === undefined) continue;
      if (grams > table!.maxGrams) { item.reason = "weight"; continue; }
      const billed = Math.ceil(grams / 500) * 500;
      const row = table!.parcelRowsThrough10kg.find(row => row[0] === Math.min(billed, 10000))!;
      item.cents = row[zone + 1]
        + (billed > 10000 ? (Math.min(billed, 20000) - 10000) / 500 * table!.extraHalfKg10to20[zone] : 0)
        + (billed > 20000 ? (billed - 20000) / 500 * table!.extraHalfKg20to30[zone] : 0);
      item.billedGrams = billed; item.reason = null;
    }
  }
  return result;
}

/** Reference prices on OTHER routes to the same destination, never a tariff or savings quote for this route. */
export function courierPlanningReference(from: string, to: string, weight: string, currency: CostCurrency, exchange: ExchangeRate | null, today = new Date().toISOString().slice(0, 10), provider?: CourierRate["provider"]) {
  const grams = weightInGrams(weight);
  if (!validCostRoute(from, to) || grams === null) return null;
  const matchesProvider = (quote: CourierRate) => !provider || quote.provider === provider;
  const exact = publishedCourierRates(from, to, weight, today).filter(matchesProvider);
  // Missing coverage can use reference routes. An expired or overweight tariff must not be bypassed.
  if (exact.some(rate => rate.reason !== "route")) return null;
  const origin = ALL_COUNTRIES.find(country => country.code === from)!;
  const samples = ["FR", "EG", "IN", "KE"].filter(code => code !== from && code !== to).flatMap(code =>
    publishedCourierRates(code, to, weight, today).filter(matchesProvider).flatMap(quote => quote.cents === null ? [] : [{ from: code, to, quote }]));
  const regional = samples.filter(sample => {
    const country = ALL_COUNTRIES.find(country => country.code === sample.from)!;
    return origin.africa ? country.africa : country.region === origin.region;
  });
  const selected = regional.length ? regional : samples;
  if (!selected.length) return null;
  const converted = selected.map(sample => ({ ...sample, cents: convertCost(sample.quote.cents!, sample.quote.currency, currency, exchange) }));
  // Never mix currencies or silently omit an unconvertible endpoint from the range.
  if (converted.some(sample => sample.cents === null)) return null;
  const prices = converted.map(sample => sample.cents!);
  return { kind: "reference" as const, grams, currency, minCents: Math.min(...prices), maxCents: Math.max(...prices), samples: converted };
}

export const COST_CURRENCIES = ["USD", "EUR", "KES", "GBP", "INR"] as const;
export type CostCurrency = typeof COST_CURRENCIES[number];
export interface ExchangeRate {
  date: string;
  usdPerEur: number;
  inrPerEur?: number;
  kesPerEur?: number;
  gbpPerEur?: number;
  source?: "ecb" | "frankfurter";
}

function recentDate(date: string, now: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const stamp = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === date && stamp <= now && now - stamp <= 7 * 86400000;
}

/** Require a common recent date so a cross-rate cannot silently mix days. */
export function parseReferenceRates(data: unknown, now = Date.now()): ExchangeRate | null {
  if (!Array.isArray(data)) return null;
  const rows = data.filter((row): row is { base: string; quote: string; date: string; rate: number } =>
    row && row.base === "EUR" && typeof row.date === "string" && recentDate(row.date, now) &&
    typeof row.rate === "number" && Number.isFinite(row.rate) && row.rate > 0);
  const usd = rows.filter(row => row.quote === "USD");
  if (usd.length !== 1) return null;
  const result: ExchangeRate = { date: usd[0].date, usdPerEur: usd[0].rate, source: "frankfurter" };
  for (const [code, key] of [["KES", "kesPerEur"], ["GBP", "gbpPerEur"], ["INR", "inrPerEur"]] as const) {
    const matches = rows.filter(row => row.quote === code && row.date === result.date);
    if (matches.length === 1) result[key] = matches[0].rate;
  }
  return result;
}
/** Reject stale, future, missing and malformed reference data instead of guessing a conversion. */
export function parseEcbRate(xml: string, now = Date.now()): ExchangeRate | null {
  const date = xml.match(/<Cube\s+time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];
  const raw = xml.match(/<Cube\s+currency=['"]USD['"]\s+rate=['"]([\d.]+)['"]/)?.[1];
  const usdPerEur = Number(raw);
  if (!date || !Number.isFinite(usdPerEur) || usdPerEur <= 0) return null;
  const stamp = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== date || stamp > now || now - stamp > 7 * 86400000) return null;
  const inr = Number(xml.match(/<Cube\s+currency=['"]INR['"]\s+rate=['"]([\d.]+)['"]/)?.[1]);
  return { date, usdPerEur, ...(Number.isFinite(inr) && inr > 0 ? { inrPerEur: inr } : {}) };
}

export function convertCost(cents: number, from: CostCurrency, to: CostCurrency, exchange: ExchangeRate | null): number | null {
  if (!Number.isSafeInteger(cents) || cents < 0) return null;
  if (from === to) return cents;
  if (!exchange || !Number.isFinite(exchange.usdPerEur) || exchange.usdPerEur <= 0) return null;
  const rates = { EUR: 1, USD: exchange.usdPerEur, INR: exchange.inrPerEur, KES: exchange.kesPerEur, GBP: exchange.gbpPerEur };
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !Number.isFinite(fromRate) || fromRate <= 0 || !toRate || !Number.isFinite(toRate) || toRate <= 0) return null;
  const converted = Math.round(cents / fromRate * toRate);
  return Number.isSafeInteger(converted) ? converted : null;
}
