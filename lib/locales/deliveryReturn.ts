import type { Lang } from "../i18n";
import type { DeliveryAction } from "../deliveryReturn";
const en = {
  actions: { respond: "Review request", agree: "Confirm agreement", declare: "Add parcel contents", inspect: "Check parcel", collect: "Confirm collection", arrival: "Update delivery", receipt: "Has the parcel arrived?", review: "Leave a review", held: "View delivery issue", waiting: "View delivery details", closed: "View delivery record" } as Record<DeliveryAction, string>,
  next: "Your next step", returnHint: "Keep the fee, parcel checks and delivery updates together on Kifurushi.",
  whatsappHint: "Your WhatsApp message includes a link back to this delivery.", copy: "Copy delivery link", copied: "Link copied", copyFailed: "Couldn’t copy. Please try again.",
  missing: "This delivery isn’t available for this account. Check that you’re signed in with the account used for the booking.",
  agreement: "Record fee & handover", agreementHint: "Add the details you discussed on WhatsApp. Both people should confirm them in this chat before handover.",
  fee: "Total carrying fee", currency: "Currency", handover: "Collection and delivery arrangements", save: "Save details in chat", saved: "Details saved in your conversation.", failed: "Couldn’t save. Please try again.", invalid: "Enter a valid total fee and the handover arrangements.", noteTitle: "Delivery agreement — please confirm", feeLine: "Total carrying fee", handoverLine: "Handover", confirmLine: "Please confirm these details here before handover.",
};
type Copy = { [K in keyof typeof en]: (typeof en)[K] };
export const deliveryReturnCopy: Record<Lang, Copy> = {
 en,
 fr: {
  actions: { respond: "Voir la demande", agree: "Confirmer l’accord", declare: "Ajouter le contenu", inspect: "Vérifier le colis", collect: "Confirmer la collecte", arrival: "Mettre à jour la livraison", receipt: "Le colis est-il arrivé ?", review: "Laisser un avis", held: "Voir le problème", waiting: "Voir la livraison", closed: "Voir le dossier" },
  next: "Votre prochaine étape", returnHint: "Gardez le prix, les vérifications et le suivi ensemble sur Kifurushi.",
  whatsappHint: "Votre message WhatsApp contient un lien vers cette livraison.", copy: "Copier le lien", copied: "Lien copié", copyFailed: "Copie impossible. Réessayez.",
  missing: "Cette livraison n’est pas disponible pour ce compte. Connectez-vous avec le compte utilisé pour la réservation.",
  agreement: "Enregistrer le prix et la remise", agreementHint: "Ajoutez les détails discutés sur WhatsApp. Confirmez-les tous les deux dans cette conversation avant la remise.",
  fee: "Prix total du transport", currency: "Devise", handover: "Organisation de la collecte et de la livraison", save: "Enregistrer dans la conversation", saved: "Détails enregistrés dans votre conversation.", failed: "Échec de l’enregistrement. Réessayez.", invalid: "Saisissez un prix total valide et les modalités de remise.", noteTitle: "Accord de livraison — à confirmer", feeLine: "Prix total du transport", handoverLine: "Remise", confirmLine: "Merci de confirmer ces détails ici avant la remise.",
 },
 sw: {
  actions: { respond: "Angalia ombi", agree: "Thibitisha makubaliano", declare: "Ongeza yaliyomo", inspect: "Kagua kifurushi", collect: "Thibitisha kuchukua", arrival: "Sasisha uwasilishaji", receipt: "Kifurushi kimefika?", review: "Toa maoni", held: "Angalia tatizo", waiting: "Angalia uwasilishaji", closed: "Angalia rekodi" },
  next: "Hatua yako inayofuata", returnHint: "Hifadhi ada, ukaguzi wa kifurushi na taarifa za uwasilishaji pamoja kwenye Kifurushi.",
  whatsappHint: "Ujumbe wako wa WhatsApp una kiungo cha kurudi kwenye uwasilishaji huu.", copy: "Nakili kiungo", copied: "Kiungo kimenakiliwa", copyFailed: "Imeshindwa kunakili. Jaribu tena.",
  missing: "Uwasilishaji huu haupatikani kwenye akaunti hii. Ingia kwa akaunti uliyotumia kuweka nafasi.",
  agreement: "Hifadhi ada na makabidhiano", agreementHint: "Ongeza maelezo mliyojadili kwenye WhatsApp. Nyote wawili mthibitishe hapa kabla ya makabidhiano.",
  fee: "Jumla ya ada ya kubeba", currency: "Sarafu", handover: "Mpango wa kuchukua na kuwasilisha", save: "Hifadhi kwenye mazungumzo", saved: "Maelezo yamehifadhiwa kwenye mazungumzo yako.", failed: "Imeshindwa kuhifadhi. Jaribu tena.", invalid: "Weka ada sahihi na mpango wa makabidhiano.", noteTitle: "Makubaliano ya uwasilishaji — tafadhali thibitisha", feeLine: "Jumla ya ada ya kubeba", handoverLine: "Makabidhiano", confirmLine: "Tafadhali thibitisha maelezo haya hapa kabla ya makabidhiano.",
 },
};
