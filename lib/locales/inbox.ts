import type { Lang } from "../i18n";

const en = {
  deliveries: "Messages", ratings: "Reviews", account: "Account", dashboardSections: "Dashboard sections",
  postTrip: "Post a trip", sendParcel: "Send a parcel", signOut: "Sign out",
  title: "Your conversations", search: "Search a name or route", active: "Active", unread: "Unread", history: "History",
  empty: "No conversations here yet.", noResults: "No conversations match your search.", noUnread: "You’re all caught up.",
  start: "Find a traveller", clear: "Clear search", back: "All conversations", choose: "Choose a conversation to get started.",
  details: "Delivery details", newChat: "Start the conversation", you: "You", unreadMessages: "unread messages",
  loading: "Loading messages…", failed: "Messages couldn’t load. Please try again.", retry: "Try again",
  closed: "This request is closed. You can still read the conversation.", hold: "This delivery is on hold. Open Delivery details for the next step.",
};
type Copy = { [K in keyof typeof en]: string };
export const inboxCopy: Record<Lang, Copy> = {
  en,
  fr: {
    deliveries: "Messages", ratings: "Avis", account: "Compte", dashboardSections: "Rubriques du tableau de bord",
    postTrip: "Publier un trajet", sendParcel: "Envoyer un colis", signOut: "Se déconnecter",
    title: "Vos conversations", search: "Chercher un nom ou un trajet", active: "En cours", unread: "Non lus", history: "Historique",
    empty: "Aucune conversation ici pour le moment.", noResults: "Aucune conversation ne correspond à votre recherche.", noUnread: "Vous avez tout lu.",
    start: "Trouver un voyageur", clear: "Effacer la recherche", back: "Toutes les conversations", choose: "Choisissez une conversation pour commencer.",
    details: "Détails de la livraison", newChat: "Commencer la conversation", you: "Vous", unreadMessages: "messages non lus",
    loading: "Chargement des messages…", failed: "Impossible de charger les messages. Réessayez.", retry: "Réessayer",
    closed: "Cette demande est close. Vous pouvez toujours lire la conversation.", hold: "Cette livraison est suspendue. Consultez les détails de la livraison.",
  },
  sw: {
    deliveries: "Ujumbe", ratings: "Maoni", account: "Akaunti", dashboardSections: "Sehemu za dashibodi",
    postTrip: "Weka safari", sendParcel: "Tuma kifurushi", signOut: "Ondoka",
    title: "Mazungumzo yako", search: "Tafuta jina au njia", active: "Yanayoendelea", unread: "Hayajasomwa", history: "Historia",
    empty: "Hakuna mazungumzo hapa bado.", noResults: "Hakuna mazungumzo yanayolingana na utafutaji wako.", noUnread: "Umesoma ujumbe wote.",
    start: "Tafuta msafiri", clear: "Futa utafutaji", back: "Mazungumzo yote", choose: "Chagua mazungumzo ili kuanza.",
    details: "Maelezo ya uwasilishaji", newChat: "Anza mazungumzo", you: "Wewe", unreadMessages: "ujumbe ambao haujasomwa",
    loading: "Inapakia ujumbe…", failed: "Ujumbe haukupakiwa. Jaribu tena.", retry: "Jaribu tena",
    closed: "Ombi hili limefungwa. Bado unaweza kusoma mazungumzo.", hold: "Uwasilishaji huu umesimamishwa. Fungua maelezo ya uwasilishaji kwa hatua inayofuata.",
  },
};
