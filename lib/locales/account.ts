import type { Lang } from "../i18n";

const en = {
  details: "Contact & verification", identity: "Identity", verified: "Your ID is verified.",
  pending: "Verification pending", pendingHint: "Your ID check is running.",
  review: "Verification under review", reviewHint: "Your ID is being checked by our team.",
  unverified: "Not verified yet", unverifiedHint: "Verify your ID before your first carry.",
  verify: "Get verified", view: "View details", whatsapp: "WhatsApp", optional: "Not added · Optional",
  add: "Add", edit: "Edit", close: "Close", loading: "Loading contact details…",
  summary: "Delivery summary", earned: "Estimated earned", spent: "Estimated spent",
  carriedCount: (n: number) => `${n} ${n === 1 ? "parcel" : "parcels"} carried`,
  sentCount: (n: number) => `${n} ${n === 1 ? "parcel" : "parcels"} sent`,
  estimates: "About these estimates", admin: "Admin tools", adminHint: "Verifications, matching and reports",
  verifications: "Verification reviews", matching: "Matching & promotion", reports: "Delivery reports",
};
type Copy = { [K in keyof typeof en]: typeof en[K] };

export const accountCopy: Record<Lang, Copy> = {
  en,
  fr: {
    details: "Contact et vérification", identity: "Identité", verified: "Votre identité est vérifiée.",
    pending: "Vérification en cours", pendingHint: "La vérification de votre pièce d’identité est en cours.",
    review: "Vérification à l’étude", reviewHint: "Notre équipe examine votre pièce d’identité.",
    unverified: "Identité non vérifiée", unverifiedHint: "Vérifiez votre identité avant votre premier transport.",
    verify: "Vérifier mon identité", view: "Voir les détails", whatsapp: "WhatsApp", optional: "Non renseigné · Facultatif",
    add: "Ajouter", edit: "Modifier", close: "Fermer", loading: "Chargement des coordonnées…",
    summary: "Bilan des livraisons", earned: "Gains estimés", spent: "Dépenses estimées",
    carriedCount: (n) => `${n} colis transporté${n === 1 ? "" : "s"}`,
    sentCount: (n) => `${n} colis envoyé${n === 1 ? "" : "s"}`,
    estimates: "À propos de ces estimations", admin: "Administration", adminHint: "Vérifications, mises en relation et signalements",
    verifications: "Examiner les identités", matching: "Mises en relation et promotion", reports: "Signalements de livraison",
  },
  sw: {
    details: "Mawasiliano na uthibitisho", identity: "Utambulisho", verified: "Utambulisho wako umethibitishwa.",
    pending: "Uthibitisho unaendelea", pendingHint: "Kitambulisho chako kinakaguliwa.",
    review: "Uthibitisho unakaguliwa", reviewHint: "Timu yetu inakagua kitambulisho chako.",
    unverified: "Bado hujathibitishwa", unverifiedHint: "Thibitisha utambulisho kabla ya kubeba kifurushi chako cha kwanza.",
    verify: "Thibitisha utambulisho", view: "Ona maelezo", whatsapp: "WhatsApp", optional: "Haijawekwa · Si lazima",
    add: "Ongeza", edit: "Badilisha", close: "Funga", loading: "Inapakia mawasiliano…",
    summary: "Muhtasari wa usafirishaji", earned: "Makadirio ya mapato", spent: "Makadirio ya matumizi",
    carriedCount: (n) => n === 1 ? "Kifurushi 1 kimebebwa" : `Vifurushi ${n} vimebebwa`,
    sentCount: (n) => n === 1 ? "Kifurushi 1 kimetumwa" : `Vifurushi ${n} vimetumwa`,
    estimates: "Kuhusu makadirio haya", admin: "Zana za usimamizi", adminHint: "Uthibitisho, ulinganishaji na ripoti",
    verifications: "Kagua uthibitisho", matching: "Ulinganishaji na matangazo", reports: "Ripoti za usafirishaji",
  },
};
