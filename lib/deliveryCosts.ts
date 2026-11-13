// Compare totals supplied by the visitor. There is no assumed courier tariff.
export function amountInCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(normalized)) return null;
  const [whole, decimal = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= 1_000_000_000 ? cents : null;
}

// Keep fractional weights exact to one gram, including small document parcels.
export function weightInGrams(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(normalized)) return null;
  const [whole, decimal = ""] = normalized.split(".");
  const grams = Number(whole) * 1000 + Number(decimal.padEnd(3, "0"));
  return Number.isSafeInteger(grams) && grams > 0 && grams <= 1_000_000 ? grams : null;
}

export function estimateTravellerCost(weight: string, pricePerKg: string, otherCosts = "") {
  const grams = weightInGrams(weight);
  const rateCents = amountInCents(pricePerKg);
  const otherCents = otherCosts.trim() === "" ? 0 : amountInCents(otherCosts);
  if (grams === null || rateCents === null || otherCents === null) return null;
  // Round once to the nearest cent, then add any collection/onward delivery costs.
  const carryingCents = Math.round((grams * rateCents) / 1000);
  const totalCents = carryingCents + otherCents;
  if (!Number.isSafeInteger(totalCents) || totalCents > 1_000_000_000) return null;
  return { grams, rateCents, carryingCents, otherCents, totalCents };
}

export function compareDeliveryCosts(courier: string, traveller: string) {
  const courierCents = amountInCents(courier);
  const travellerCents = amountInCents(traveller);
  if (courierCents === null || courierCents <= 0 || travellerCents === null) return null;
  const differenceCents = courierCents - travellerCents;
  return {
    courierCents, travellerCents, differenceCents,
    percent: Math.round((differenceCents / courierCents) * 1000) / 10,
  };
}
