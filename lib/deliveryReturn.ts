import type { MatchDetail } from "./db";
import type { Lang } from "./i18n";

export type DeliveryView = "messages" | "details";
export type InspectionProgress = { hasDeclaration: boolean; mine: boolean; both: boolean; refused: boolean };
export type DeliveryAction = "respond" | "agree" | "declare" | "inspect" | "collect" | "arrival" | "receipt" | "review" | "held" | "waiting" | "closed";

export function deliveryPath(id: string, view: DeliveryView = "details") {
  return `/dashboard#${view === "details" ? "delivery" : "messages"}-${encodeURIComponent(id)}`;
}
export function readDeliveryTarget(hash: string): { id: string; view: DeliveryView } | null {
  const match = /^#?(delivery|messages)-(.+)$/.exec(hash);
  if (!match) return null;
  try { return { id: decodeURIComponent(match[2]), view: match[1] === "delivery" ? "details" : "messages" }; }
  catch { return null; }
}
export function deliveryWhatsappHref(number: string, id: string, lang: Lang) {
  // The link contains only the booking ID. Access still requires a participant's sign-in.
  const link = `https://www.kifurushiapp.com${deliveryPath(id)}`;
  const text = {
    en: `Hi! We connected on Kifurushi. Here’s our delivery link to check the details and confirm collection or receipt: ${link}`,
    fr: `Bonjour ! Nous sommes en contact sur Kifurushi. Voici notre livraison pour consulter les détails et confirmer la collecte ou la réception : ${link}`,
    sw: `Habari! Tumeunganishwa kupitia Kifurushi. Hiki ni kiungo cha uwasilishaji wetu cha kuangalia maelezo na kuthibitisha kuchukua au kupokea kifurushi: ${link}`,
  }[lang];
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
export function nextDeliveryAction(m: MatchDetail, uid: string, inspection?: InspectionProgress, held = false): DeliveryAction {
  if (held || m.status === "disputed" || inspection?.refused) return "held";
  if (m.status === "cancelled" || m.status === "declined") return "closed";
  if (m.receiptOutcome || m.status === "released") return m.canReview ? "review" : "closed";
  if (m.status === "requested") {
    if (m.requestAvailability !== "available") return "closed";
    return m.requesterId !== uid ? "respond" : "waiting";
  }
  if (m.status === "accepted") return "agree";
  if (m.status === "escrow_paid") {
    if (!inspection) return "waiting";
    if (!inspection.hasDeclaration) return m.role === "sender" ? "declare" : "waiting";
    if (!inspection.mine) return "inspect";
    return inspection.both && m.role === "traveler" ? "collect" : "waiting";
  }
  if (["picked_up", "in_transit", "delivered"].includes(m.status)) {
    if (m.role === "sender") return m.canReportReceipt ? "receipt" : "waiting";
    return m.status === "delivered" ? "waiting" : "arrival";
  }
  return "waiting";
}
