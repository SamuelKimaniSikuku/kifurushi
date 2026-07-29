import type { Dict } from "./en";

// Kiswahili — Kenya, Tanzania, Uganda, DRC na diaspora yake.
// "Kifurushi" ni Kiswahili tayari: neno linamaanisha "parcel".

export const sw: Dict = {
  nav: {
    findTraveller: "Wasafiri",
    parcelRequests: "Vifurushi",
    postTrip: "Tangaza safari",
    sendParcel: "Tuma kifurushi",
    pricing: "Bei",
    getVerified: "Uthibitisho",
    trustSafety: "Usalama",
    signIn: "Ingia",
    dashboard: "Dashibodi",
    dashboardOf: (name: string) => `Dashibodi ya ${name}`,
    openMenu: "Fungua menyu",
    closeMenu: "Funga menyu",
  },
  footer: {
    tagline:
      "Mtandao wa vifurushi wa watu-kwa-watu wa Afrika. Tunaunganisha nchi zote 54 za Afrika na diaspora — begi moja kwa wakati.",
    platform: "Jukwaa",
    trust: "Uaminifu",
    coverage: "Maeneo",
    coverageText:
      "Nchi 54 za Afrika · maeneo 22 ya diaspora Ulaya, Amerika Kaskazini, Ghuba na Asia-Pasifiki.",
    pricingLink: "Bei — uanachama mmoja",
    prohibitedItems: "Vitu vilivyokatazwa",
    howProtection: "Jinsi ulinzi unavyofanya kazi",
    platformSecurity: "Usalama wa jukwaa",
    idVerified: "Wanachama waliothibitishwa kwa kitambulisho",
    codedHandovers: "Makabidhiano kwa msimbo",
    copyright: (year: number) =>
      `© ${year} Kifurushi. Imejengwa kwa ajili ya diaspora ya Afrika.`,
  },
  home: {
    badge: "NCHI ZOTE 54 ZA AFRIKA · MAENEO 22 YA DIASPORA",
    h1a: "Pata pesa",
    h1b: "unaposafiri nyumbani",
    intro:
      "Kilo zako za ziada zina thamani ya $100+ kila safari. Beba vifurushi vya watu wanaotuma vitu kati ya Afrika na ughaibuni — unabaki na 100% ya unachotoza, Kifurushi haichukui chochote. Na unapotuma wewe, kifurushi chako husafiri na msafiri aliyethibitishwa ambaye tayari anarudi nyumbani.",
    ctaTravel: "Ninasafiri — nipate pesa kwa mizigo yangu",
    ctaSend: "Tuma kifurushi",
    verified: "Amethibitishwa",
    departs: "anaondoka Jpi 2 Ago",
    kgFree: "kilo 18 wazi",
    requestTraveller: "Omba msafiri huyu",
    statCountries: "nchi za Afrika",
    statDelivery: "muda wa kawaida",
    statDeliveryValue: "siku 3–7",
    statPrice: "au $29/mwaka — 0% kamisheni",
    statHandover: "makabidhiano yaliyothibitishwa",
    statHandoverValue: "Kitambulisho + msimbo",
    trustItems: [
      "0% kamisheni — wasafiri wanabaki na kila kitu",
      "Uthibitisho wa kitambulisho cha serikali",
      "Misimbo ya makabidhiano ya mara moja",
      "Tathmini za pande zote mbili",
      "Ukaguzi wa vitu vilivyokatazwa",
    ],
    processLabel: "Mchakato",
    howTitle: "Jinsi Kifurushi inavyofanya kazi",
    howSub:
      "Imejengwa ili hakuna upande unaolazimika kumwamini mgeni — jukwaa ndilo linalobeba hatari, si wewe.",
    steps: [
      {
        title: "Tangaza au tafuta",
        body: "Watumaji wanatangaza wanachotaka kutuma; wasafiri wanatangaza nafasi ya ziada ya begi kwenye safari zijazo.",
      },
      {
        title: "Unganisha na thibitisha",
        body: "Tunalinganisha njia na tarehe. Pande zote mbili zinaona hali ya uthibitisho, tathmini na historia ya usafirishaji kabla ya kukubaliana.",
      },
      {
        title: "Kubaliana na funga",
        body: "Mnakubaliana bei moja kwa moja — pesa taslimu, M-Pesa, benki, chaguo lenu. Kifurushi kinakaguliwa na kufungwa pamoja, na picha kuhifadhiwa.",
      },
      {
        title: "Fikisha na thibitisha",
        body: "Mpokeaji anathibitisha kwa msimbo wa mara moja, unaokamilisha rekodi na kufungua tathmini kwa pande zote mbili.",
      },
    ],
    routesLabel: "Njia",
    corridorsTitle: "Njia maarufu wiki hii",
    corridorFrom: (price: string) => `kuanzia ${price}/kg`,
    corridorsNote:
      "Njia yoyote inafaa — msafiri akiiruka, Kifurushi inaifikia.",
    browseAll: "Tazama safari zote",
    securityLabel: "Uaminifu na usalama",
    securityTitle: "Usalama ndiyo bidhaa yenyewe",
    securityIntro:
      "Kugawana mizigo kienyeji tayari kunafanyika katika kila jamii ya Kiafrika ughaibuni — vikundi vya WhatsApp, matangazo kanisani, binamu wa binamu. Kifurushi inabaki na moyo wa kijamii na kuondoa hatari.",
    securityPoints: [
      {
        title: "Pesa yako inabaki yako",
        body: "Ada ya usafirishaji hulipwa moja kwa moja kati ya mtumaji na msafiri — Kifurushi inachukua 0% na kamwe haishiki pesa yako.",
      },
      {
        title: "Utambulisho uliothibitishwa",
        body: "Wasafiri wanawasilisha kitambulisho cha serikali na selfie kabla ya safari yao ya kwanza.",
      },
      {
        title: "Imefungwa na kukaguliwa",
        body: "Msafiri anakagua kila kitu kabla ya kukifunga pamoja na mtumaji — hakuna kubeba usichokijua.",
      },
      {
        title: "Misimbo ya makabidhiano ya mara moja",
        body: "Mpokeaji anapata msimbo wa tarakimu 6; kuuweka kunakamilisha rekodi ya usafirishaji inayolinda pande zote mbili.",
      },
    ],
    readSafety: "Soma viwango vyetu vya uaminifu na usalama",
    handoverLabel: "Makabidhiano yaliyolindwa",
    handoverSteps: [
      { title: "Ada imekubaliwa: $45", body: "Inalipwa moja kwa moja, msafiri anabaki na 100%" },
      { title: "Makabidhiano na kufunga", body: "Picha zinahifadhiwa na pande zote mbili" },
      { title: "Safarini", body: "Taarifa za safari kwa pande zote mbili" },
      { title: "Msimbo 4 8 2 9 1 7", body: "Mpokeaji anathibitisha — rekodi imekamilika" },
    ],
    ctaBandTitle: "Kuna kitu kinasubiri kwenda nyumbani?",
    ctaBandBody:
      "Kitangaze kwa dakika mbili. Wasafiri wa njia yako wanapata taarifa mara moja.",
    ctaBandSend: "Tuma kifurushi",
    ctaBandEarn: "Pata pesa ukiwa msafiri",
  },
  auth: {
    joinTitle: "Jiunge na Kifurushi",
    welcomeBack: "Karibu tena",
    subtitle: "Akaunti moja kwa kutuma na kusafiri.",
    fullName: "Jina kamili",
    email: "Barua pepe",
    password: "Nenosiri",
    passwordHint: "Angalau herufi 10 zenye kubwa, ndogo na namba.",
    createAccount: "Fungua akaunti",
    signIn: "Ingia",
    oneMoment: "Subiri kidogo…",
    alreadyMember: "Tayari ni mwanachama?",
    newTo: "Mgeni Kifurushi?",
    createLink: "Fungua akaunti",
    wrongCreds: "Barua pepe au nenosiri si sahihi. Jaribu tena, au fungua akaunti.",
    checkEmailTitle: "Angalia barua pepe yako",
    checkEmailBody1: "Tumetuma kiungo cha uthibitisho kwa",
    checkEmailBody2: "Kibonyeze ili kuwasha akaunti yako, kisha uingie.",
    backToSignIn: "Rudi kuingia",
  },
  pricing: {
    heroTitle: "Uanachama mmoja. Kila jukumu.",
    heroSub:
      "Tuma mwezi huu, pokea mwezi ujao, beba unaporudi nyumbani — akaunti moja, bei moja, hakuna kamisheni. Kifurushi kamwe haichukui sehemu ya kipato cha wasafiri.",
    free: "Bure",
    freeTag: "Angalia, pokea, fuatilia.",
    freeFeatures: [
      "Tazama kila safari na maombi ya vifurushi",
      "Ona tathmini na maoni ya wasafiri",
      "Pokea kifurushi — kupokea ni bure daima",
      "Fuatilia kifurushi kilichotumwa kwako, kwa msimbo wako",
    ],
    memberFeatures: [
      "Tuma vifurushi — maombi bila kikomo",
      "Safiri na upate — safari bila kikomo, baki na 100% ya ada yako",
      "Wasiliana na yeyote kwenye jukwaa",
      "Uthibitisho wa kitambulisho na beji ya ✓ Amethibitishwa",
      "Kumbukumbu za picha za kufunga na misimbo ya mara moja",
      "Tathmini za pande mbili zinazojenga sifa yako",
      "Msaada wa migogoro na rekodi kamili ya usafirishaji",
    ],
    monthly: "Kila mwezi",
    yearly: "Kila mwaka",
    monthlyNote: "Unalipa kila mwezi. Sitisha wakati wowote.",
    yearlyNote: "Ni $2.42 tu kwa mwezi, unalipa mara moja — okoa $31.",
    bestValue: "Bei bora · Okoa 52%",
    joinFor: (price: string) => `Jiunge kwa ${price}`,
    activating: "Inawashwa…",
    secureCheckout: "Malipo salama - sitisha wakati wowote",
    yourPlanSince: (date: string) => `Mpango wako tangu ${date}`,
    yourPlan: "Mpango wako",
    onPlan: (plan: string) => `Uko kwenye mpango wa ${plan}.`,
    planMonthly: "kila mwezi",
    planYearly: "kila mwaka",
    browseTrips: "Tazama safari",
    joinError: "Imeshindikana kuwasha uanachama wako. Tafadhali jaribu tena.",
    reasonContact:
      "Uanachama unahitajika ili kuwasiliana na wasafiri na watumaji — uanachama mmoja unatosha mwaka mzima.",
    reasonPost:
      "Uanachama unahitajika ili kutangaza safari na vifurushi — uanachama mmoja unatosha mwaka mzima.",
    checkoutSuccess:
      "Malipo yamepokelewa — uanachama wako unawashwa ndani ya sekunde chache.",
    checkoutCancelled: "Malipo yameghairiwa — hujatozwa chochote.",
    dismiss: "Funga",
    bandTitle: "Pata pesa ukisafiri - okoa kwenye kila kifurushi",
    bandCell1a: "$5/mwezi au $29/mwaka ni kwa jukwaa pekee",
    bandCell1b: "— vifurushi bila kikomo, pande zote mbili.",
    bandCell2a: "Ada ya usafirishaji",
    bandCell2b: "unakubaliana moja kwa moja na msafiri",
    bandCell2c:
      "(kwa kawaida ~$45 kwa kilo 5 dhidi ya $60+ kwa kampuni). Kifurushi haichukui chochote.",
    bandCell3: "Vifurushi 5 kwa mwaka = $150+ zimeokolewa.",
    whyCards: [
      {
        title: "Nafuu kuliko usafirishaji mmoja wa kampuni",
        body: "Kifurushi cha kilo 5 London → Lagos kinagharimu $50–80 kwa kampuni ya usafirishaji. Mwaka mzima wa Kifurushi ni $29 (au $5/mwezi) — na msafiri anakutoza karibu $45.",
      },
      {
        title: "Majukumu yanabadilika, bei haibadiliki",
        body: "Mtu yule yule anatuma Desemba, anapokea Machi na anabeba Agosti. Uanachama mmoja unatosheleza yote.",
      },
      {
        title: "Hakuna kamisheni, kamwe",
        body: "Ada za usafirishaji zinakubaliwa na kulipwa moja kwa moja kati yenu — pesa taslimu, M-Pesa, benki. Kifurushi kamwe haigusi pesa.",
      },
    ],
  },
  postTrip: {
    title: "Tangaza safari",
    sub: "Waambie watumaji unakoruka na nafasi uliyo nayo.",
    fromCountry: "Nchi ya kuondoka",
    fromCity: "Jiji la kuondoka",
    toCountry: "Nchi ya kwenda",
    toCity: "Jiji la kwenda",
    cityFromPlaceholder: "mf. London",
    cityToPlaceholder: "mf. Nairobi",
    departureDate: "Tarehe ya kuondoka",
    space: "Nafasi (kg)",
    pricePerKg: "Bei kwa kg (USD)",
    priceHint: (courier: number) =>
      `Wasafiri wengi wanatoza $7–12/kg. Kampuni za usafirishaji ni ~$${courier}/kg.`,
    earnBand: (earnings: number) => `Ungepata ~$${earnings} kwa safari hii`,
    saveBand: (courier: number, savings: number) =>
      `Watumaji wangelipa ~$${courier} kwa kampuni kwa uzito huo — wanaokoa ~$${savings} kwako`,
    categoriesLabel: "Aina utakazokubali",
    categoriesError: "Chagua angalau aina moja",
    notes: "Maelezo (si lazima)",
    notesPlaceholder:
      "Shirika la ndege, mahali pa makabidhiano, chochote watumaji wanachopaswa kujua...",
    safetyNote:
      "Utakagua na kufunga kila kifurushi pamoja kabla ya kukibeba. Kamwe usikubali kifurushi kilichofungwa usichokiona ndani — soma",
    safetyLink: "kanuni za usalama za msafiri",
    publish: "Tangaza safari",
    publishing: "Inatangazwa…",
    submitError: "Imeshindikana kutangaza safari yako — tafadhali jaribu tena.",
  },
  postParcel: {
    title: "Tuma kifurushi",
    sub: "Eleza unachotuma — wasafiri wa njia yako wanapata taarifa.",
    neededBy: "Kifike kabla ya",
    weight: "Uzito (kg)",
    budget: "Bajeti (USD)",
    budgetHint: (low: number, high: number, kg: number) =>
      `Wasafiri kwa kawaida wanaomba $${low}–${high} kwa kilo ${kg}.`,
    courierBand: (courier: number, kg: number) =>
      `Kampuni ya usafirishaji ingetoza ~$${courier} kwa kilo ${kg}`,
    saveNote: (budget: number, savings: number) =>
      `Kwa bajeti yako ya $${budget} ungeokoa ~$${savings}`,
    aboveNote:
      "Bajeti yako iko juu ya bei za kampuni — wasafiri wengi watafanya safari hii kwa bei ndogo zaidi",
    category: "Aina",
    whatsInside: "Kuna nini ndani?",
    insidePlaceholder:
      "Kuwa mahususi — msafiri atakagua vilivyomo pamoja nawe kabla ya kufunga.",
    prohibitedNote:
      "Hakuna pesa taslimu, betri zilizolegea, vimiminika zaidi ya 100ml, vitu vinavyoharibika, silaha, wala chochote kilicho kinyume cha sheria katika nchi yoyote kati ya hizo mbili — orodha kamili kwenye",
    prohibitedLink: "ukurasa wa vitu vilivyokatazwa",
    prohibitedNote2:
      "Vitu visivyotajwa kwa ukweli vinapoteza ulinzi wa jukwaa.",
    post: "Tangaza ombi la kifurushi",
    posting: "Inatangazwa…",
    submitError: "Imeshindikana kutangaza kifurushi chako — tafadhali jaribu tena.",
  },
};
