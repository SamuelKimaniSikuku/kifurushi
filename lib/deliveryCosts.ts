// Compare totals supplied by the visitor. There is no assumed courier tariff.
export function amountInCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, decimal = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= 1_000_000_000 ? cents : null;
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
