import type { Lang } from "../i18n";

const en = {
  label: "Estimated weight (kg, optional)",
  help: "Enter an estimate, or leave blank if unsure. Weight won’t stop your request. Agree the final weight in chat.",
  invalid: "Enter a positive weight, or leave blank to agree the weight later.",
  toAgree: "Weight to agree",
  overCapacity: "You can still send this request. Discuss the available space and agree the weight before acceptance.",
  pending: "Agree the weight in Messages, then the sender can update the parcel before the request is accepted.",
  edit: "Update parcel weight",
  refresh: "Refresh details",
  acceptError: "Could not accept. Check the agreed weight and available space, then refresh and try again.",
};
type Copy = { [K in keyof typeof en]: string };
export const requestWeightCopy: Record<Lang, Copy> = {
  en,
  fr: {
    label: "Poids estimé (kg, facultatif)",
    help: "Indiquez une estimation ou laissez vide en cas de doute. Le poids ne bloque pas votre demande. Convenez du poids final dans la discussion.",
    invalid: "Indiquez un poids positif ou laissez vide pour convenir du poids plus tard.",
    toAgree: "Poids à convenir",
    overCapacity: "Vous pouvez quand même envoyer cette demande. Discutez de la place disponible et convenez du poids avant l’acceptation.",
    pending: "Convenez du poids dans Messages, puis l’expéditeur peut modifier le colis avant l’acceptation de la demande.",
    edit: "Modifier le poids du colis", refresh: "Actualiser les détails",
    acceptError: "Impossible d’accepter. Vérifiez le poids convenu et la place disponible, puis actualisez et réessayez.",
  },
  sw: {
    label: "Makadirio ya uzito (kg, hiari)",
    help: "Weka makadirio au acha wazi ikiwa huna uhakika. Uzito hautazuia ombi lako. Kubalianeni uzito wa mwisho kwenye gumzo.",
    invalid: "Weka uzito zaidi ya sifuri au acha wazi ili mkubaliane uzito baadaye.",
    toAgree: "Uzito wa kukubaliana",
    overCapacity: "Bado unaweza kutuma ombi hili. Jadilianeni nafasi iliyopo na mkubaliane uzito kabla ya kukubali ombi.",
    pending: "Kubalianeni uzito kwenye Ujumbe, kisha mtumaji asasishe kifurushi kabla ya ombi kukubaliwa.",
    edit: "Sasisha uzito wa kifurushi", refresh: "Sasisha maelezo",
    acceptError: "Imeshindwa kukubali. Kagua uzito uliokubaliwa na nafasi iliyopo, kisha sasisha na ujaribu tena.",
  },
};
