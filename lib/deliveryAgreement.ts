import type { Lang } from "./i18n";
import { deliveryReturnCopy } from "./locales/deliveryReturn";
export const AGREEMENT_CURRENCIES = ["EUR", "USD", "KES", "GBP", "CAD", "CHF", "AED", "INR", "XOF", "XAF"] as const;

/** Save as a participant's message, never as a payment or the other party's confirmation. */
export function agreementMessage(fee: string, currency: string, handover: string, lang: Lang): string | null {
  const amount = Number(fee);
  if (!fee.trim() || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000 ||
      !/^\d+(\.\d{1,2})?$/.test(fee) || !AGREEMENT_CURRENCIES.some(code => code === currency) ||
      !handover.trim() || handover.trim().length > 500) return null;
  const s = deliveryReturnCopy[lang];
  return `${s.noteTitle}\n${s.feeLine}: ${currency} ${amount.toFixed(2)}\n${s.handoverLine}: ${handover.trim()}\n\n${s.confirmLine}`;
}
