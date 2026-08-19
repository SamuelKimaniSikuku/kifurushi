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
    needsAttention: (n: number) => `${n} yanakusubiri`,
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
    terms: "Sheria na Masharti",
    privacy: "Sera ya Faragha",
    faqLink: "Maswali yanayoulizwa",
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
    freeMonthHero: "Bure wakati wa uzinduzi — hakuna kadi, hakuna malipo",
    ctaTravel: "Ninasafiri — nipate pesa kwa mizigo yangu",
    ctaSend: "Tuma kifurushi",
    verified: "Amethibitishwa",
    departs: "anaondoka Jpi 2 Ago",
    kgFree: "kilo 18 wazi",
    requestTraveller: "Omba msafiri huyu",
    topEarner: (amount: number, name: string, n: number) =>
      `Kiasi kikubwa alichopata msafiri mmoja hadi sasa: $${amount} na ${name}, kwa usafirishaji ${n}.`,
    topEarnerLink: "Ona wasifu wake",
    statCountries: "nchi za Afrika",
    statDelivery: "muda wa kawaida",
    statDeliveryValue: "siku 3–7",
    statPriceValue: "Bure",
    statPrice: "wakati wa uzinduzi — 0% kamisheni",
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
        body: "Mnakubaliana bei moja kwa moja — pesa taslimu, M-Pesa, benki, chaguo lenu. Kifurushi kinakaguliwa na kufungwa pamoja, na picha zinatumwa kwenye gumzo la match.",
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
      { title: "Makabidhiano na kufunga", body: "Picha zinatumwa kwenye gumzo la match" },
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
    subtitle: "Akaunti moja kwa kutuma na kusafiri. Bure wakati wa uzinduzi.",
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
    termsAgree1: "Nakubali",
    termsLink: "Sheria na Masharti",
    termsAgree2: "na Sera ya Faragha, na ninaelewa kuwa Kifurushi inaunganisha tu watumaji na wasafiri — kila usafirishaji ni makubaliano ya moja kwa moja kati yetu wawili.",
    termsError: "Lazima ukubali Sheria na Masharti ili kufungua akaunti.",
  },
  roles: {
    tripsMenu: "Safari",
    parcelsMenu: "Vifurushi",
    postTrip: "Tangaza safari yangu",
    postTripDesc: "Ninasafiri na nafasi ya ziada",
    findTraveller: "Tafuta msafiri",
    findTravellerDesc: "Nataka mtu wa kubeba kifurushi changu",
    postParcel: "Tuma kifurushi",
    postParcelDesc: "Nahitaji kitu kifikishwe",
    browseParcels: "Vifurushi vya kubeba",
    browseParcelsDesc: "Ninasafiri na nataka kupata pesa",
  },
  chooser: {
    title: "Wewe ni yupi leo?",
    sub: "Wanachama wengi ni wote wawili — tuma mwezi huu, beba unaporudi nyumbani.",
    travelTitle: "Ninasafiri",
    travelBody:
      "Una safari inayokuja na kilo za ziada kwenye begi lako. Tangaza safari yako ili watumaji wakupate, au angalia vifurushi vinavyosubiri kwenye njia yako.",
    travelPrimary: "Tangaza safari yangu",
    travelSecondary: "Ona vifurushi vya kubeba",
    sendTitle: "Ninatuma kitu",
    sendBody:
      "Unahitaji kitu kifikishwe kati ya Afrika na ughaibuni. Tangaza kifurushi chako ili wasafiri watoe maombi, au angalia wasafiri waliothibitishwa wanaoelekea huko.",
    sendPrimary: "Tangaza kifurushi changu",
    sendSecondary: "Tafuta msafiri",
  },
  corridor: {
    tripFitsAll: (n: number) =>
      n === 1
        ? "Kifurushi 1 kinasubiri kwenye njia hii na tarehe yako inafaa."
        : `Vifurushi ${n} vinasubiri kwenye njia hii na tarehe yako inafaa vyote.`,
    parcelFitsAll: (n: number) =>
      n === 1
        ? "Msafiri 1 anaweza kufika kabla ya tarehe yako."
        : `Wasafiri ${n} wanaweza kufika kabla ya tarehe yako.`,
    tripMissed: (missed: number, fits: number) =>
      fits === 0
        ? missed === 1
          ? "Kifurushi pekee kinachosubiri kwenye njia hii kinahitajika kufika kabla ya kuondoka kwako, kwa hivyo hungeweza kukichukua."
          : `Vifurushi vyote ${missed} vinavyosubiri kwenye njia hii vinahitajika kufika kabla ya kuondoka kwako.`
        : `Ungekosa vifurushi ${missed} vinavyosubiri — vinahitajika kufika kabla ya kuondoka kwako.`,
    parcelMissed: (missed: number, fits: number) =>
      fits === 0
        ? missed === 1
          ? "Msafiri pekee kwenye njia hii anaondoka baada ya tarehe yako ya mwisho."
          : `Wasafiri wote ${missed} kwenye njia hii wanaondoka baada ya tarehe yako ya mwisho.`
        : `Wasafiri ${missed} zaidi wanaondoka baada ya tarehe yako ya mwisho.`,
    tripSuggest: (date: string) => `Ondoka kabla au siku ya ${date} ili kuvichukua.`,
    parcelSuggest: (date: string) => `Ruhusu hadi ${date} na anaweza kukichukua.`,
    useDate: "Tumia tarehe hiyo",
  },
    money: {
      title: "Pesa yako hadi sasa",
      carried: (n: number, amount: number) =>
        `Umebeba vifurushi ${n} · umepata takriban $${amount}`,
      sent: (n: number, amount: number) =>
        `Umetuma vifurushi ${n} · umelipa takriban $${amount}`,
      saved: (amount: number) => `Takriban $${amount} chini ya wangefanya makampuni ya usafirishaji`,
      above: (amount: number) => `Takriban $${amount} zaidi ya bei ya kampuni kwa uzito huo`,
      caveat:
        "Makadirio kutoka bajeti zilizowekwa kwenye usafirishaji uliokamilika. Kifurushi haishiki pesa, kwa hivyo tunaweza kuripoti kilichokubaliwa kwenye tangazo tu, si kilichobadilishwa mikononi.",
    },
  faq: {
    title: "Maswali yanayoulizwa mara nyingi",
    sub: "Yote yaliyo hapa chini yanaeleza kile Kifurushi hufanya kweli. Kama swali lako halipo, andika hello@kifurushiapp.com.",
    stillStuck: "Hukupata jibu lako?",
    stillStuckCta: "Tuandikie",
    groups: [
      {
        title: "Jinsi inavyofanya kazi",
        items: [
          {
            q: "Kifurushi ni nini hasa?",
            a: "Tunaunganisha wanaotaka kutuma kifurushi na wasafiri ambao tayari wana nafasi kwenye mizigo yao kwenye njia hiyo. Hiyo ndiyo huduma yote. Sisi si kampuni ya usafirishaji: hatugusi kifurushi chako, hatubebi chochote, na hatuko kwenye makubaliano mnayoyafanya.",
          },
          {
            q: "Ni nani hasa anayebeba kifurushi changu?",
            a: "Mwanachama mwingine, kwenye njia mliyoichagua nyote wawili, ambaye utambulisho wake umehakikiwa. Unaona hali yake ya uhakiki, alama zake na historia yake kabla ya kukubali chochote — na unaweza kumkataa yeyote bila sababu.",
          },
          {
            q: "Watumaji na wasafiri wanaunganishwaje?",
            a: "Unaweka unachohitaji; upande mwingine unakuona na kukuomba, au wewe unawaomba. Match inawezekana tu ikiwa nchi zote mbili zinalingana, safari inaondoka kabla au siku ya tarehe kifurushi kinapohitajika, na kifurushi kinatoshea nafasi iliyobaki. Mfumo unakataa kingine chochote.",
          },
          {
            q: "Inachukua muda gani kupata mtu?",
            a: "Inategemea kabisa ni nani anasafiri njia yako. Njia zenye shughuli nyingi kama Paris–Nairobi au London–Lagos ni za haraka zaidi. Kama hakuna aliyekubali siku tatu kabla ya tarehe yako, tunakutumia barua pepe, tunakuambia wasafiri wangapi wanaondoka baada ya tarehe yako, na unaweza kuibadilisha.",
          },
        ],
      },
      {
        title: "Pesa",
        items: [
          {
            q: "Kutuma kunagharimu kiasi gani?",
            a: "Wewe na msafiri mnakubaliana bei moja kwa moja — kwa kawaida $7–12 kwa kilo, dhidi ya takriban $14 kwa kilo kwa makampuni ya usafirishaji. Unaweka bajeti yako unapotangaza; wasafiri wanaamua kama inafaa nafasi yao.",
          },
          {
            q: "Ninamlipaje msafiri?",
            a: "Moja kwa moja, kwa njia mnayoaminiana: pesa taslimu wakati wa kukabidhi, M-Pesa, benki. Kifurushi haishiki, haihifadhi wala haihamishi pesa hizo, na haichukui kamisheni yoyote.",
          },
          {
            q: "Kwa nini Kifurushi haishughulikii malipo?",
            a: "Kushika pesa za watu wengine kunatufanya taasisi ya malipo, jambo linalohitaji leseni tusiyokuwa nayo na gharama ambazo ungezilipa wewe. Kuacha pesa kati yenu wawili ndiko kunakotuwezesha kutoza ada moja tu na kuchukua 0% ya usafirishaji wako.",
          },
          {
            q: "Basi ninalipia nini kwenye uanachama?",
            a: "Kuingia sokoni: kuweka matangazo, kuomba match, na gumzo na kumbukumbu za usafirishaji zinazoambatana. $5 kwa mwezi au $29 kwa mwaka, kwa majukumu yote matatu. Kuangalia, kupokea kifurushi na kufuatilia ni bure.",
          },
          {
            q: "Naweza kusitisha?",
            a: "Ndiyo, wakati wowote, kutoka ukurasa wa bei. Uanachama wako unaendelea hadi mwisho wa kipindi ulicholipia kisha unasimama. Hatutoi marejesho ya sehemu.",
          },
        ],
      },
      {
        title: "Uaminifu na usalama",
        items: [
          {
            q: "Nitajuaje msafiri ni wa kweli?",
            a: "Wanachama waliohakikiwa wamepitisha ukaguzi wa kitambulisho cha serikali pamoja na selfie ya uhai kupitia mshirika wetu Didit. Alama ya ✓ inamaanisha ukaguzi huo umepita. Alama za nyota zinatoka tu kwa usafirishaji uliokamilika na haziwezi kubadilishwa wala kufutwa.",
          },
          {
            q: "Ni nini kinachozuia mtu kuiba kifurushi changu?",
            a: "Kwa ukweli: hakuna kinachofanya wizi usiwezekane. Tunachofanya ni kuufanya uwe wa gharama na wenye kufuatilika — utambulisho halisi nyuma ya kila akaunti iliyohakikiwa, kumbukumbu isiyobadilika ya mliyokubaliana, na kufungiwa milele kwenye njia zote kwa makosa yaliyothibitishwa. Tuma ukizingatia hilo, na soma kanuni za usalama kabla ya kukabidhi mara ya kwanza.",
          },
          {
            q: "Kifurushi changu kina bima?",
            a: "Hapana. Hakuna bima wala fidia, kutoka kwetu au kwa msafiri. Kama thamani ya unachotuma ingekuumiza kuipoteza, tumia kampuni ya usafirishaji yenye bima — huo ndio ushauri wa kweli.",
          },
          {
            q: "Kanuni ya kukagua na kufunga ni ipi?",
            a: "Msafiri lazima aone kila kitu, wazi, ana kwa ana, kabla ya kufungwa — kisha mnafunga pamoja na kupiga picha kwa simu zenu wenyewe, mkizituma kwenye gumzo la match ambako zina muhuri wa muda na haziwezi kuhaririwa. Msafiri anayekubali kifurushi kilichofungwa tayari anakibeba kama chake mpakani. Pande zote mbili zinaweza kufungiwa kwa kupuuza hili.",
          },
          {
            q: "Usafirishaji unathibitishwaje?",
            a: "Mpokeaji anapata msimbo wa tarakimu sita wa mara moja. Kuuweka wakati wa kukabidhi ndiyo uthibitisho: unakamilisha kumbukumbu na kufungua maoni kwa pande zote. Misimbo huhifadhiwa ikiwa imefichwa — hakuna mtu, sisi tukiwemo, anayeweza kusoma wako.",
          },
          {
            q: "Kitu kimeenda vibaya. Nini kinafuata?",
            a: "Andika hello@kifurushiapp.com. Tunapitia mliyokubaliana, gumzo la match na taarifa za safari, na tunaweza kusimamisha au kufungia akaunti zenye makosa. Hatuamui migogoro ya watu binafsi wala hatulipi fidia — lakini kumbukumbu kamili ni yako kuitumia kwenye madai yoyote unayofuatilia.",
          },
        ],
      },
      {
        title: "Uhakiki na nyaraka",
        items: [
          {
            q: "Mnahifadhi picha ya pasipoti yangu?",
            a: "Hapana. Picha ya kitambulisho chako na selfie zinatoka kwenye kifaa chako moja kwa moja hadi Didit. Sisi tunapokea matokeo tu — imekubaliwa, imekataliwa au inapitiwa — na aina ya hati. Tusingeweza kutoa picha yako hata tungetaka.",
          },
          {
            q: "Kwa nini uhakiki wangu ulikataliwa?",
            a: "Mara nyingi kwa sababu uso huohuo tayari umehakikiwa kwenye akaunti nyingine. Mtu mmoja, akaunti moja — ndiyo inayoipa alama maana. Kama umepoteza akaunti yako ya awali, tuandikie badala ya kufungua mpya.",
          },
          {
            q: "Uhakiki wangu unapitiwa na mtu. Itachukua muda gani?",
            a: "Zaidi ya ukaguzi wa kiotomatiki, kwa sababu unasubiri binadamu. Hakuna unachohitajika kufanya; matokeo yanaonekana kwenye ukurasa huohuo. Ikichelewa, tuandikie na tutafuatilia.",
          },
        ],
      },
      {
        title: "Mambo ya kawaida",
        items: [
          {
            q: "Ni nini kisichoweza kutumwa?",
            a: "Chochote kisicho halali katika nchi yoyote kati ya hizo mbili, pamoja na pesa taslimu, dawa zisizofungwa, silaha, betri nje ya kanuni za ndege, vitu vinavyoharibika, na chochote usingekifungua mbele ya mgeni. Orodha kamili ipo kwenye ukurasa wa usalama. Msafiri ndiye anayewajibika kisheria kwa kilicho kwenye mizigo yake mpakani.",
          },
          {
            q: "Je, ni halali?",
            a: "Kubeba kitu kwa niaba ya mtu mwingine ni halali sehemu nyingi, ilimradi kimetangazwa ipasavyo na si bidhaa iliyokatazwa — ndiyo maana kanuni ya kukagua ipo. Kanuni za forodha na za ndege ni jukumu la msafiri, na wala sisi wala mtumaji hatuwezi kuzibeba kwa niaba yake.",
          },
          {
            q: "Mnahudumia nchi zipi?",
            a: "Nchi zote 54 za Afrika na maeneo 22 ya diaspora barani Ulaya, Amerika Kaskazini, Ghuba na Asia-Pasifiki. Kama njia ina manufaa inategemea wanachama wanaoisafiri kweli.",
          },
          {
            q: "Kifurushi kinazungumza lugha gani?",
            a: "Kiingereza, Kifaransa na Kiswahili. Barua pepe zetu zinafuata lugha uliyochagua kwenye tovuti.",
          },
        ],
      },
    ],
  },
  howTo: {
    title: "Jinsi ya kuanza",
    sub: "Takriban dakika mbili. Kifurushi ni bure wakati wa uzinduzi — huhitaji kadi.",
    accountStep: "Fungua akaunti yako",
    accountBody:
      "Jina, barua pepe, nenosiri. Tunakutumia kiungo — kibofye ili kuwasha akaunti yako, kisha ingia.",
    accountNote:
      "Nenosiri: herufi 10 au zaidi, likiwa na herufi kubwa, ndogo na namba.",
    travelTitle: "Kama unasafiri",
    travelSteps: [
      "Fungua menyu ya Safari na uchague Tangaza safari yangu.",
      "Jaza njia yako, tarehe ya safari, kilo zilizobaki, na bei yako kwa kilo ($7–12 ni kawaida).",
      "Watumaji watakuomba. Kubali unaowataka, kubaliana bei moja kwa moja, na ubebe.",
    ],
    travelCta: "Weka safari",
    sendTitle: "Kama unatuma",
    sendSteps: [
      "Fungua menyu ya Vifurushi na uchague Tuma kifurushi.",
      "Jaza njia yako, tarehe kinapohitajika kufika, uzito, na kiasi uko tayari kulipa.",
      "Wasafiri watajitolea kukibeba. Chagua mmoja, kubaliana bei moja kwa moja, na ukabidhi.",
    ],
    sendCta: "Tuma kifurushi",
    verifyNote:
      "Wasafiri: hakikiwa kabla ya kubeba mara ya kwanza. Picha ya kitambulisho chako na selfie, takriban dakika mbili — watumaji wanatafuta alama hiyo.",
  },
  recommend: {
    tripsTitle: (n: number) =>
      n === 1
        ? "Msafiri 1 anaweza kukichukua sasa hivi"
        : `Wasafiri ${n} wanaweza kukichukua sasa hivi`,
    tripsNote:
      "Ombi linatumia njia na tarehe yake ya safari — hutahitaji kumaliza fomu hii.",
    departs: (date: string) => `anaondoka ${date}`,
    kgFree: (kg: number) => `kg ${kg} wazi`,
    estimate: (amount: number) => `≈ $${amount} kwa kifurushi chako`,
    parcelsTitle: (n: number) =>
      n === 1
        ? "Kifurushi 1 tayari kinasubiri kwenye njia hii"
        : `Vifurushi ${n} tayari vinasubiri kwenye njia hii`,
    parcelsNote:
      "Weka safari yako kisha uweze kujitolea kuvibeba mara moja.",
    parcelMeta: (kg: number, budget: number) => `kg ${kg} · bajeti $${budget}`,
    neededBy: (date: string) => `kinahitajika kabla ya ${date}`,
  },
  browse: {
    tripsTitle: "Wasafiri wa njia yako",
    tripsSub:
      "Watu waliothibitishwa wenye nafasi ya ziada ya mizigo. Omba mmoja abebe kifurushi chako — mnakubaliana bei moja kwa moja.",
    parcelsTitle: "Vifurushi vinavyosubiri msafiri",
    parcelsSub:
      "Watu wanatafuta mtu wa njia yao. Jitolee kubeba na ubaki na 100% ya unachotoza.",
    requestTraveller: "Omba msafiri huyu",
    requestSent: "Ombi limetumwa",
    offerToCarry: "Jitolee kubeba",
    offerSent: "Ombi limetumwa",
    yourTrip: "Safari yako",
    yourParcel: "Kifurushi chako",
    pending: (n: number) =>
      n === 1 ? "Ombi 1 linasubiri" : `Maombi ${n} yanasubiri`,
    openDashboard: "Fungua dashibodi",
    quickTitle: (name: string) => `Omba ${name}`,
    quickRoute: "Anasafiri njia hii tayari — tunahitaji maelezo ya kifurushi chako tu.",
    quickEstimate: (amount: number) => `Anatoza takriban $${amount} kwa hii`,
    quickSend: "Tuma ombi",
    quickSending: "Inatuma…",
    quickCancel: "Ghairi",
    quickError: "Imeshindikana kutuma ombi — tafadhali jaribu tena.",
    needTripFirst: "Tangaza safari yako ya njia hii kwanza — tumeijaza tayari.",
    edit: "Hariri",
    tooHeavy: (free: number) => `Kuna kilo ${free} tu zilizobaki kwenye safari hii.`,
    noFittingTrip:
      "Hakuna safari yako inayofaa — lazima ifuate njia hii na iondoke kabla ya tarehe ya kifurushi. Tangaza moja, njia imejazwa tayari.",
  },
  pricing: {
    launchBanner:
      "Kifurushi ni bure wakati wa uzinduzi — weka safari na vifurushi, omba match, usilipe chochote. Utajulishwa wazi kwa barua pepe kabla ya mabadiliko yoyote.",
    heroTitle: "Bure wakati wa uzinduzi.",
    trialBanner: (date: string) =>
      `Mwezi wako wa kwanza wa bure unaendelea — unaisha tarehe ${date}. Chagua mpango kabla ya hapo ili uendelee kutangaza; hutatozwa chochote hadi utakapofanya hivyo.`,
    freeMonth: "Mwezi wa kwanza bure",
    trialDormantBanner:
      "Mwezi wako wa bure haujaanza bado — unaanza unapoweka safari au kifurushi chako cha kwanza. Hakuna kinachopita ukiwa unaangalia tu.",
    heroSub:
      "Kila kitu ni bure wakati wa uzinduzi. Bei zilizo hapa chini ni za uanachama baada ya kipindi hicho — na kamisheni inabaki 0% daima. Kifurushi kamwe haichukui sehemu ya kipato cha wasafiri.",
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
      "Ukaguzi na kufunga pamoja na misimbo ya mara moja",
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
    roleBanner:
      "Unatoa nafasi kwenye begi lako. Watumaji wa njia hii wataona safari yako na kukuomba — mnakubaliana bei moja kwa moja na unabaki na 100%.",
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
    editTitle: "Hariri safari yako",
    save: "Hifadhi mabadiliko",
    saving: "Inahifadhi…",
    submitError: "Imeshindikana kutangaza safari yako — tafadhali jaribu tena.",
  },
  postParcel: {
    title: "Tuma kifurushi",
    sub: "Eleza unachotuma — wasafiri wa njia yako wanapata taarifa.",
    roleBanner:
      "Unamwomba msafiri abebe hiki. Wasafiri wa njia yako watatoa maombi — mnakubaliana bei moja kwa moja, na Kifurushi haichukui chochote.",
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
    categoriesLabel: "Aina (chagua zote zinazohusika)",
    categoriesError: "Chagua angalau aina moja",
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
    editTitle: "Hariri kifurushi chako",
    save: "Hifadhi mabadiliko",
    saving: "Inahifadhi…",
    submitError: "Imeshindikana kutangaza kifurushi chako — tafadhali jaribu tena.",
  },
};
