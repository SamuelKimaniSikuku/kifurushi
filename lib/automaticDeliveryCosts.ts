import { ALL_COUNTRIES } from "./countries";
import { estimateTravellerCost, weightInGrams } from "./deliveryCosts";
import { upcomingOnRoute } from "./tripDiscovery";
import type { Trip } from "./types";
import dhl from "./data/dhl-france-2026.json";
import dhlEgypt from "./data/dhl-eg-2026.json";
import dhlIndia from "./data/dhl-in-2026.json";

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
  provider: "colissimo" | "dhl";
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
  for (const item of result) {
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

export type CostCurrency = "USD" | "EUR" | "INR";
export interface ExchangeRate { date: string; usdPerEur: number; inrPerEur?: number }
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

export function convertCost(cents: number, from: CostCurrency, to: "USD" | "EUR", exchange: ExchangeRate | null): number | null {
  if (!Number.isSafeInteger(cents) || cents < 0) return null;
  if (from === to) return cents;
  if (!exchange || !Number.isFinite(exchange.usdPerEur) || exchange.usdPerEur <= 0) return null;
  const rates = { EUR: 1, USD: exchange.usdPerEur, INR: exchange.inrPerEur };
  const fromRate = rates[from];
  if (!fromRate || !Number.isFinite(fromRate) || fromRate <= 0) return null;
  return Math.round(cents / fromRate * rates[to]);
}
