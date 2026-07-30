import type { Dict } from "./en";

// Français — couvre les 21 pays africains francophones et la diaspora en
// France, Belgique, Suisse et au Canada.

export const fr: Dict = {
  nav: {
    findTraveller: "Voyageurs",
    parcelRequests: "Colis demandés",
    postTrip: "Publier un voyage",
    sendParcel: "Envoyer un colis",
    pricing: "Tarifs",
    getVerified: "Vérification",
    trustSafety: "Sécurité",
    signIn: "Se connecter",
    dashboard: "Tableau de bord",
    dashboardOf: (name: string) => `Tableau de bord de ${name}`,
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    needsAttention: (n: number) => `${n} en attente de vous`,
  },
  footer: {
    tagline:
      "Le réseau de colis pair-à-pair de l'Afrique. Relier les 54 pays africains à la diaspora — une valise à la fois.",
    platform: "Plateforme",
    trust: "Confiance",
    coverage: "Couverture",
    coverageText:
      "54 pays africains · 22 destinations de la diaspora en Europe, Amérique du Nord, dans le Golfe et en Asie-Pacifique.",
    pricingLink: "Tarifs — un seul abonnement",
    prohibitedItems: "Objets interdits",
    howProtection: "Comment fonctionne la protection",
    platformSecurity: "Sécurité de la plateforme",
    terms: "Conditions générales",
    privacy: "Politique de confidentialité",
    idVerified: "Membres vérifiés par pièce d'identité",
    codedHandovers: "Remises par code",
    copyright: (year: number) =>
      `© ${year} Kifurushi. Conçu pour la diaspora africaine.`,
  },
  home: {
    badge: "54 PAYS AFRICAINS · 22 DESTINATIONS DE LA DIASPORA",
    h1a: "Gagnez de l'argent",
    h1b: "en rentrant au pays",
    intro:
      "Vos kilos libres valent plus de 100 $ par voyage. Transportez des colis pour ceux qui envoient entre l'Afrique et l'étranger — vous gardez 100 % de ce que vous facturez, Kifurushi ne prend aucune commission. Et quand c'est vous qui envoyez, votre colis voyage avec un voyageur vérifié qui rentre déjà au pays.",
    ctaTravel: "Je voyage — gagner avec mes bagages",
    ctaSend: "Envoyer un colis",
    verified: "Vérifié",
    departs: "départ dim. 2 août",
    kgFree: "18 kg libres",
    requestTraveller: "Contacter ce voyageur",
    statCountries: "pays africains",
    statDelivery: "délai habituel",
    statDeliveryValue: "3–7 jours",
    statPrice: "ou 29 $/an — 0 % de commission",
    statHandover: "remise vérifiée",
    statHandoverValue: "ID + code",
    trustItems: [
      "0 % de commission — les voyageurs gardent tout",
      "Vérification de pièce d'identité officielle",
      "Codes de livraison à usage unique",
      "Évaluations dans les deux sens",
      "Contrôle des objets interdits",
    ],
    processLabel: "Le processus",
    howTitle: "Comment fonctionne Kifurushi",
    howSub:
      "Conçu pour que personne n'ait à faire confiance à un inconnu — c'est la plateforme qui porte le risque, pas vous.",
    steps: [
      {
        title: "Publier ou trouver",
        body: "Les expéditeurs publient ce qu'ils veulent envoyer ; les voyageurs publient l'espace libre de leur valise sur leurs prochains vols.",
      },
      {
        title: "Mise en relation & vérification",
        body: "Nous croisons itinéraires et dates. Chacun voit le statut de vérification, les notes et l'historique de livraisons avant de s'engager.",
      },
      {
        title: "Accord & scellage",
        body: "Vous convenez du prix directement — espèces, M-Pesa, virement, à vous de choisir. Le colis est inspecté et scellé ensemble, avec des photos échangées dans la messagerie du match.",
      },
      {
        title: "Livraison & confirmation",
        body: "Le destinataire confirme la livraison avec un code à usage unique, ce qui clôt le dossier et débloque les évaluations des deux côtés.",
      },
    ],
    routesLabel: "Itinéraires",
    corridorsTitle: "Corridors populaires cette semaine",
    corridorFrom: (price: string) => `dès ${price}/kg`,
    corridorsNote:
      "Tous les itinéraires fonctionnent — si un voyageur le prend, Kifurushi le couvre.",
    browseAll: "Voir tous les voyages",
    securityLabel: "Confiance & sécurité",
    securityTitle: "La sécurité, c'est le produit",
    securityIntro:
      "Le partage informel de bagages existe déjà dans chaque communauté africaine à l'étranger — groupes WhatsApp, annonces à l'église, le cousin d'un cousin. Kifurushi garde l'esprit communautaire et supprime le risque.",
    securityPoints: [
      {
        title: "Votre argent reste le vôtre",
        body: "Le prix du transport se paie directement entre expéditeur et voyageur — Kifurushi prend 0 % et ne détient jamais votre argent.",
      },
      {
        title: "Identités vérifiées",
        body: "Les voyageurs soumettent une pièce d'identité officielle et un selfie avant leur premier transport.",
      },
      {
        title: "Scellé & inspecté",
        body: "Le voyageur inspecte chaque objet avant de le sceller avec l'expéditeur — on ne transporte jamais d'inconnu.",
      },
      {
        title: "Codes de livraison à usage unique",
        body: "Le destinataire reçoit un code à 6 chiffres ; sa saisie complète le dossier de livraison qui protège les deux parties.",
      },
    ],
    readSafety: "Lire nos règles de confiance & sécurité",
    handoverLabel: "Remise protégée",
    handoverSteps: [
      { title: "Prix convenu : 45 $", body: "Payé directement, le voyageur garde 100 %" },
      { title: "Remise & scellage", body: "Photos partagées dans la messagerie" },
      { title: "En transit", body: "Suivi du trajet pour les deux côtés" },
      { title: "Code 4 8 2 9 1 7", body: "Le destinataire confirme — dossier complet" },
    ],
    ctaBandTitle: "Quelque chose à faire rentrer au pays ?",
    ctaBandBody:
      "Publiez-le en deux minutes. Les voyageurs sur votre itinéraire sont prévenus immédiatement.",
    ctaBandSend: "Envoyer un colis",
    ctaBandEarn: "Gagner en voyageant",
  },
  auth: {
    joinTitle: "Rejoindre Kifurushi",
    welcomeBack: "Bon retour",
    subtitle: "Un seul compte pour envoyer et voyager.",
    fullName: "Nom complet",
    email: "E-mail",
    password: "Mot de passe",
    passwordHint: "Au moins 10 caractères avec majuscule, minuscule et un chiffre.",
    createAccount: "Créer un compte",
    signIn: "Se connecter",
    oneMoment: "Un instant…",
    alreadyMember: "Déjà membre ?",
    newTo: "Nouveau sur Kifurushi ?",
    createLink: "Créer un compte",
    wrongCreds: "E-mail ou mot de passe incorrect. Réessayez ou créez un compte.",
    checkEmailTitle: "Vérifiez vos e-mails",
    checkEmailBody1: "Nous avons envoyé un lien de confirmation à",
    checkEmailBody2: "Cliquez dessus pour activer votre compte, puis connectez-vous.",
    backToSignIn: "Retour à la connexion",
    termsAgree1: "J'accepte les",
    termsLink: "Conditions générales",
    termsAgree2: "et la Politique de confidentialité, et je comprends que Kifurushi ne fait que mettre en relation expéditeurs et voyageurs — chaque livraison est un accord direct entre nous deux.",
    termsError: "Vous devez accepter les Conditions générales pour créer un compte.",
  },
  roles: {
    sending: "J'envoie",
    travelling: "Je voyage",
    findTraveller: "Trouver un voyageur",
    findTravellerDesc: "Parcourir les voyageurs sur votre itinéraire",
    postParcel: "Publier mon colis",
    postParcelDesc: "Demander à un voyageur de le transporter",
    browseParcels: "Colis à transporter",
    browseParcelsDesc: "Trouver un colis et gagner de l'argent",
    postTrip: "Publier mon voyage",
    postTripDesc: "Proposer vos kilos libres",
  },
  chooser: {
    title: "Vous êtes lequel aujourd'hui ?",
    sub: "La plupart des membres sont les deux — envoyer ce mois-ci, transporter en rentrant.",
    travelTitle: "Je voyage",
    travelBody:
      "Vous avez un vol prévu et des kilos libres dans votre valise. Publiez votre voyage pour que les expéditeurs vous trouvent, ou parcourez les colis qui attendent déjà sur votre itinéraire.",
    travelPrimary: "Publier mon voyage",
    travelSecondary: "Voir les colis à transporter",
    sendTitle: "J'envoie quelque chose",
    sendBody:
      "Vous devez faire livrer quelque chose entre l'Afrique et l'étranger. Publiez votre colis pour recevoir des offres, ou parcourez les voyageurs vérifiés qui partent déjà dans votre direction.",
    sendPrimary: "Publier mon colis",
    sendSecondary: "Trouver un voyageur",
  },
  corridor: {
    tripFitsAll: (n: number) =>
      n === 1
        ? "1 colis attend sur cet itinéraire et votre date lui convient."
        : `${n} colis attendent sur cet itinéraire et votre date leur convient à tous.`,
    parcelFitsAll: (n: number) =>
      n === 1
        ? "1 voyageur peut arriver avant votre date."
        : `${n} voyageurs peuvent arriver avant votre date.`,
    tripMissed: (missed: number, fits: number) =>
      fits === 0
        ? missed === 1
          ? "Le seul colis qui attend sur cet itinéraire doit arriver avant votre départ : vous ne pourriez pas le prendre."
          : `Les ${missed} colis qui attendent sur cet itinéraire doivent arriver avant votre départ : vous ne pourriez en prendre aucun.`
        : `Vous manqueriez ${missed} des colis qui attendent : ils doivent arriver avant votre départ.`,
    parcelMissed: (missed: number, fits: number) =>
      fits === 0
        ? missed === 1
          ? "Le seul voyageur sur cet itinéraire part après votre date limite : il ne pourrait pas le prendre."
          : `Les ${missed} voyageurs sur cet itinéraire partent après votre date limite.`
        : `${missed} autres voyageurs partent juste après votre date limite.`,
    tripSuggest: (date: string) => `Partez au plus tard le ${date} pour les prendre.`,
    parcelSuggest: (date: string) => `Allez jusqu'au ${date} et il pourrait le prendre.`,
    useDate: "Utiliser cette date",
  },
  browse: {
    tripsTitle: "Voyageurs sur votre itinéraire",
    tripsSub:
      "Des personnes vérifiées avec de la place dans leurs bagages. Demandez-en une pour transporter votre colis — vous convenez du prix directement.",
    parcelsTitle: "Colis en attente d'un voyageur",
    parcelsSub:
      "Des personnes cherchent quelqu'un sur leur itinéraire. Proposez de le transporter et gardez 100 % de ce que vous facturez.",
    requestTraveller: "Contacter ce voyageur",
    requestSent: "Demande envoyée",
    offerToCarry: "Proposer de le transporter",
    offerSent: "Offre envoyée",
    yourTrip: "Votre voyage",
    yourParcel: "Votre colis",
    pending: (n: number) =>
      n === 1 ? "1 demande en attente" : `${n} demandes en attente`,
    openDashboard: "Ouvrir le tableau de bord",
    quickTitle: (name: string) => `Contacter ${name}`,
    quickRoute: "Ce voyageur fait déjà ce trajet — il ne manque que votre colis.",
    quickEstimate: (amount: number) => `Il demande environ ${amount} $ pour cela`,
    quickSend: "Envoyer la demande",
    quickSending: "Envoi…",
    quickCancel: "Annuler",
    quickError: "Impossible d'envoyer la demande — veuillez réessayer.",
    needTripFirst: "Publiez d'abord votre voyage sur cet itinéraire — il est prérempli.",
    edit: "Modifier",
    tooHeavy: (free: number) => `Il ne reste que ${free} kg sur ce voyage.`,
    noFittingTrip:
      "Aucun de vos voyages ne convient — il doit suivre cet itinéraire et partir avant la date limite du colis. Publiez-en un, l'itinéraire est prérempli.",
  },
  pricing: {
    heroTitle: "Un abonnement. Tous les rôles.",
    heroSub:
      "Envoyez ce mois-ci, recevez le mois prochain, transportez quand vous rentrez — un compte, un prix, zéro commission. Kifurushi ne prend jamais de part sur ce que gagnent les voyageurs.",
    free: "Gratuit",
    freeTag: "Explorer, recevoir, suivre.",
    freeFeatures: [
      "Parcourir tous les voyages et demandes de colis",
      "Voir les notes et avis des voyageurs",
      "Recevoir un colis — recevoir est toujours gratuit",
      "Suivre une livraison qui vous est destinée, avec votre code",
    ],
    memberFeatures: [
      "Envoyer des colis — demandes illimitées",
      "Voyager & gagner — voyages illimités, gardez 100 % du prix du transport",
      "Contacter et se connecter avec tout le monde sur la plateforme",
      "Vérification d'identité & badge ✓ Vérifié",
      "Remise inspectée et scellée & codes de livraison à usage unique",
      "Avis dans les deux sens qui bâtissent votre réputation",
      "Assistance en cas de litige avec le dossier de livraison complet",
    ],
    monthly: "Mensuel",
    yearly: "Annuel",
    monthlyNote: "Facturé chaque mois. Résiliable à tout moment.",
    yearlyNote: "Soit 2,42 $ par mois, facturé une fois — économisez 31 $.",
    bestValue: "Meilleure offre · -52 %",
    joinFor: (price: string) => `Rejoindre pour ${price}`,
    activating: "Activation…",
    secureCheckout: "Paiement sécurisé - résiliable à tout moment",
    yourPlanSince: (date: string) => `Votre formule depuis ${date}`,
    yourPlan: "Votre formule",
    onPlan: (plan: string) => `Vous êtes sur la formule ${plan}.`,
    planMonthly: "mensuelle",
    planYearly: "annuelle",
    browseTrips: "Voir les voyages",
    joinError: "Impossible d'activer votre abonnement. Veuillez réessayer.",
    reasonContact:
      "L'abonnement est nécessaire pour contacter voyageurs et expéditeurs — un seul abonnement couvre toute votre année.",
    reasonPost:
      "L'abonnement est nécessaire pour publier voyages et demandes de colis — un seul abonnement couvre toute votre année.",
    checkoutSuccess:
      "Paiement reçu — votre abonnement s'active dans quelques secondes.",
    checkoutCancelled: "Paiement annulé — vous n'avez pas été débité.",
    dismiss: "Fermer",
    bandTitle: "Gagnez en voyageant - économisez sur chaque colis",
    bandCell1a: "5 $/mois ou 29 $/an, c'est uniquement pour la plateforme",
    bandCell1b: "— colis illimités, dans les deux sens.",
    bandCell2a: "Le prix de la livraison, vous le",
    bandCell2b: "négociez directement avec le voyageur",
    bandCell2c:
      "(environ 45 $ les 5 kg contre 60 $+ en messagerie). Kifurushi ne prend rien.",
    bandCell3: "5 colis par an = 150 $+ économisés.",
    whyCards: [
      {
        title: "Moins cher qu'un seul envoi en messagerie",
        body: "Un colis de 5 kg Londres → Lagos coûte 50–80 $ en messagerie. Un an de Kifurushi coûte 29 $ (ou 5 $/mois) — et un voyageur vous facture environ 45 $.",
      },
      {
        title: "Les rôles changent, pas le prix",
        body: "La même personne envoie en décembre, reçoit en mars et transporte en août. Un seul abonnement couvre tout.",
      },
      {
        title: "Zéro commission, pour toujours",
        body: "Le prix du transport se convient et se paie directement entre vous — espèces, M-Pesa, virement. Kifurushi ne touche jamais l'argent.",
      },
    ],
  },
  postTrip: {
    title: "Publier un voyage",
    sub: "Dites aux expéditeurs où vous volez et combien d'espace vous avez.",
    roleBanner:
      "Vous proposez de la place dans vos bagages. Les expéditeurs sur cet itinéraire verront votre voyage et vous contacteront — vous convenez du prix directement et gardez 100 %.",
    fromCountry: "Pays de départ",
    fromCity: "Ville de départ",
    toCountry: "Pays d'arrivée",
    toCity: "Ville d'arrivée",
    cityFromPlaceholder: "ex. Paris",
    cityToPlaceholder: "ex. Dakar",
    departureDate: "Date de départ",
    space: "Espace (kg)",
    pricePerKg: "Prix par kg (USD)",
    priceHint: (courier: number) =>
      `La plupart des voyageurs demandent 7–12 $/kg. Les messageries facturent ~${courier} $/kg.`,
    earnBand: (earnings: number) =>
      `Vous gagneriez ~${earnings} $ sur ce voyage`,
    saveBand: (courier: number, savings: number) =>
      `Les expéditeurs paieraient ~${courier} $ en messagerie pour le même poids — ils économisent ~${savings} $ avec vous`,
    categoriesLabel: "Catégories acceptées",
    categoriesError: "Choisissez au moins une catégorie",
    notes: "Remarques (facultatif)",
    notesPlaceholder:
      "Compagnie aérienne, lieu de remise, tout ce que les expéditeurs doivent savoir...",
    safetyNote:
      "Vous inspecterez et scellerez chaque colis avant de le transporter. N'acceptez jamais un paquet scellé dont vous n'avez pas vu le contenu — voir les",
    safetyLink: "règles de sécurité du voyageur",
    publish: "Publier le voyage",
    publishing: "Publication…",
    editTitle: "Modifier votre voyage",
    save: "Enregistrer",
    saving: "Enregistrement…",
    submitError: "Impossible de publier votre voyage — veuillez réessayer.",
  },
  postParcel: {
    title: "Envoyer un colis",
    sub: "Décrivez votre envoi — les voyageurs sur votre itinéraire sont prévenus.",
    roleBanner:
      "Vous demandez à un voyageur de transporter ce colis. Les voyageurs sur votre itinéraire vous feront des offres — vous convenez du prix directement avec eux, et Kifurushi ne prend aucune commission.",
    neededBy: "À livrer avant le",
    weight: "Poids (kg)",
    budget: "Budget (USD)",
    budgetHint: (low: number, high: number, kg: number) =>
      `Les voyageurs demandent généralement ${low}–${high} $ pour ${kg} kg.`,
    courierBand: (courier: number, kg: number) =>
      `Une messagerie facturerait ~${courier} $ pour ${kg} kg`,
    saveNote: (budget: number, savings: number) =>
      `Avec votre budget de ${budget} $, vous économisez ~${savings} $`,
    aboveNote:
      "Votre budget dépasse les tarifs de messagerie — la plupart des voyageurs feront ce trajet pour moins",
    category: "Catégorie",
    categoriesLabel: "Catégories",
    categoriesError: "Choisissez au moins une catégorie",
    whatsInside: "Qu'y a-t-il dedans ?",
    insidePlaceholder:
      "Soyez précis — le voyageur inspectera le contenu avec vous avant le scellage.",
    prohibitedNote:
      "Pas d'espèces, de batteries en vrac, de liquides de plus de 100 ml, de denrées périssables, d'armes, ni de tout objet illégal dans l'un des deux pays — liste complète sur la",
    prohibitedLink: "page des objets interdits",
    prohibitedNote2:
      "Un contenu mal déclaré fait perdre la protection de la plateforme.",
    post: "Publier la demande",
    posting: "Publication…",
    editTitle: "Modifier votre colis",
    save: "Enregistrer",
    saving: "Enregistrement…",
    submitError: "Impossible de publier votre colis — veuillez réessayer.",
  },
};
