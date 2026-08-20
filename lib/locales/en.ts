// English dictionary — the source of truth for the translation shape.
// fr.ts and sw.ts must mirror this exactly (the Dict type enforces it).

export const en = {
  nav: {
    findTraveller: "Find a traveller",
    parcelRequests: "Parcel requests",
    postTrip: "Post a trip",
    sendParcel: "Send a parcel",
    pricing: "Pricing",
    getVerified: "Get verified",
    trustSafety: "Trust & safety",
    signIn: "Sign in",
    dashboard: "Dashboard",
    dashboardOf: (name: string) => `${name}'s dashboard`,
    openMenu: "Open menu",
    closeMenu: "Close menu",
    needsAttention: (n: number) => `${n} waiting for you`,
  },
  footer: {
    tagline:
      "Africa's peer-to-peer parcel network. Connecting all 54 African countries with the diaspora — one suitcase at a time.",
    platform: "Platform",
    trust: "Trust",
    coverage: "Coverage",
    coverageText:
      "54 African countries · 22 diaspora destinations across Europe, North America, the Gulf and Asia-Pacific.",
    pricingLink: "Pricing — one membership",
    prohibitedItems: "Prohibited items",
    howProtection: "How protection works",
    platformSecurity: "Platform security",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    faqLink: "Questions people ask",
    idVerified: "ID-verified members",
    codedHandovers: "Coded handovers",
    copyright: (year: number) =>
      `© ${year} Kifurushi. Built for the African diaspora.`,
  },
  home: {
    badge: "ALL 54 AFRICAN COUNTRIES · 22 DIASPORA DESTINATIONS",
    h1a: "Make money",
    h1b: "while travelling home",
    intro:
      "Your spare kilos are worth $100+ every trip. Carry parcels for people sending things between Africa and abroad — you keep 100% of what you charge, Kifurushi takes no cut. And when you're the one sending, your parcel travels with a verified traveller who's already going home.",
    freeMonthHero: "Free while we launch — no card, nothing to pay",
    ctaTravel: "I'm travelling — earn from my luggage",
    ctaSend: "Send a parcel",
    verified: "Verified",
    departs: "departs Sun 2 Aug",
    kgFree: "18 kg free",
    requestTraveller: "Request this traveller",
    topEarner: (amount: number, name: string, n: number) =>
      `Most earned by one traveller so far: $${amount} by ${name}, across ${n} deliveries.`,
    topEarnerLink: "See their profile",
    statCountries: "African countries",
    statDelivery: "typical delivery",
    statDeliveryValue: "3–7 days",
    statPriceValue: "Free",
    statPrice: "during launch — 0% commission",
    statHandover: "verified handover",
    statHandoverValue: "ID + code",
    trustItems: [
      "0% commission — travellers keep everything",
      "Government-ID verification",
      "One-time delivery codes",
      "Two-way ratings",
      "Prohibited-items screening",
    ],
    processLabel: "The process",
    howTitle: "How Kifurushi works",
    howSub:
      "Built so that neither side has to trust a stranger — the platform holds the risk, not you.",
    steps: [
      {
        title: "Post or find",
        body: "Senders post what they need moved; travellers post spare suitcase space on upcoming flights.",
      },
      {
        title: "Match & verify",
        body: "We match routes and dates. Both sides see ID-verification status, ratings and delivery history before agreeing.",
      },
      {
        title: "Agree & seal",
        body: "You agree the carriage fee directly — cash, M-Pesa, bank transfer, your choice. The parcel is inspected and sealed together, with photos exchanged in the match chat.",
      },
      {
        title: "Deliver & confirm",
        body: "The receiver confirms delivery with a one-time code, which completes the record and unlocks reviews for both sides.",
      },
    ],
    routesLabel: "Routes",
    corridorsTitle: "Popular corridors this week",
    corridorFrom: (price: string) => `from ${price}/kg`,
    corridorsNote: "Any route works — if a traveller flies it, Kifurushi covers it.",
    browseAll: "Browse all trips",
    securityLabel: "Trust & safety",
    securityTitle: "Security is the product",
    securityIntro:
      "Informal luggage-sharing already happens in every African community abroad — WhatsApp groups, church notice boards, a cousin of a cousin. Kifurushi keeps the community spirit and removes the risk.",
    securityPoints: [
      {
        title: "Your money stays yours",
        body: "Carriage fees are paid directly between sender and traveller — Kifurushi takes 0% and never holds your money.",
      },
      {
        title: "Verified identities",
        body: "Travellers upload government ID and a selfie check before their first carry.",
      },
      {
        title: "Sealed & inspected",
        body: "Travellers inspect every item before sealing it together with the sender — no carrying unknowns.",
      },
      {
        title: "One-time delivery codes",
        body: "The receiver gets a 6-digit code; entering it completes the delivery record both sides rely on.",
      },
    ],
    readSafety: "Read our trust & safety standards",
    handoverLabel: "Protected handover",
    handoverSteps: [
      { title: "Fee agreed: $45", body: "Paid directly, traveller keeps 100%" },
      { title: "Handover & seal", body: "Photos shared in the match chat" },
      { title: "In transit", body: "Journey updates for both sides" },
      { title: "Code 4 8 2 9 1 7", body: "Receiver confirms — record complete" },
    ],
    ctaBandTitle: "Something waiting to go home?",
    ctaBandBody:
      "Post it in two minutes. Travellers on your route get notified immediately.",
    ctaBandSend: "Send a parcel",
    ctaBandEarn: "Earn as a traveller",
  },
  auth: {
    joinTitle: "Join Kifurushi",
    welcomeBack: "Welcome back",
    subtitle: "One account for sending and travelling. Free while we launch.",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    passwordHint: "At least 10 characters with upper, lower and a number.",
    createAccount: "Create account",
    signIn: "Sign in",
    oneMoment: "One moment…",
    alreadyMember: "Already a member?",
    newTo: "New to Kifurushi?",
    createLink: "Create an account",
    wrongCreds: "Wrong email or password. Try again, or create an account.",
    checkEmailTitle: "Check your email",
    checkEmailBody1: "We sent a confirmation link to",
    checkEmailBody2: "Click it to activate your account, then sign in.",
    backToSignIn: "Back to sign in",
    termsAgree1: "I agree to the",
    termsLink: "Terms & Conditions",
    termsAgree2: "and the Privacy Policy, and understand that Kifurushi only connects senders and travellers — every delivery is a direct agreement between the two of us.",
    termsError: "You must accept the Terms & Conditions to create an account.",
  },
  roles: {
    tripsMenu: "Trips",
    parcelsMenu: "Parcels",
    postTrip: "Post my trip",
    postTripDesc: "I'm travelling with spare kilos",
    findTraveller: "Find a traveller",
    findTravellerDesc: "I want someone to carry my parcel",
    postParcel: "Send a parcel",
    postParcelDesc: "I need something delivered",
    browseParcels: "Parcels to carry",
    browseParcelsDesc: "I'm travelling and want to earn",
  },
  chooser: {
    title: "Which one are you today?",
    sub: "Most members are both — send this month, carry when you fly home.",
    travelTitle: "I'm travelling",
    travelBody:
      "You have a flight coming up and spare kilos in your suitcase. Post your trip so senders can find you, or browse parcels already waiting on your route.",
    travelPrimary: "Post my trip",
    travelSecondary: "See parcels to carry",
    sendTitle: "I'm sending something",
    sendBody:
      "You need something delivered between Africa and abroad. Post your parcel so travellers can offer, or browse verified travellers already going your way.",
    sendPrimary: "Post my parcel",
    sendSecondary: "Find a traveller",
  },
  corridor: {
    tripFitsAll: (n: number) =>
      n === 1
        ? "1 parcel is waiting on this route and your date works for it."
        : `${n} parcels are waiting on this route and your date works for all of them.`,
    parcelFitsAll: (n: number) =>
      n === 1
        ? "1 traveller can get there by your date."
        : `${n} travellers can get there by your date.`,
    tripMissed: (missed: number, fits: number) =>
      fits === 0
        ? missed === 1
          ? "The only parcel waiting on this route needs to arrive before you leave, so you couldn't carry it."
          : `All ${missed} parcels waiting on this route need to arrive before you leave, so you couldn't carry any of them.`
        : `You'd miss ${missed} of the parcels waiting on this route — they need to arrive before you leave.`,
    parcelMissed: (missed: number, fits: number) =>
      fits === 0
        ? missed === 1
          ? "The only traveller on this route leaves after your deadline, so they couldn't take it."
          : `All ${missed} travellers on this route leave after your deadline.`
        : `${missed} more travellers leave just after your deadline.`,
    tripSuggest: (date: string) => `Leave on or before ${date} to carry them.`,
    parcelSuggest: (date: string) => `Allow until ${date} and they could take it.`,
    useDate: "Use that date",
  },
    money: {
      title: "Your money so far",
      carried: (n: number, amount: number) =>
        `Carried ${n} parcel${n === 1 ? "" : "s"} · earned about $${amount}`,
      sent: (n: number, amount: number) =>
        `Sent ${n} parcel${n === 1 ? "" : "s"} · paid about $${amount}`,
      saved: (amount: number) => `About $${amount} less than couriers would have charged`,
      above: (amount: number) => `About $${amount} more than the courier rate for that weight`,
      caveat:
        "Estimates based on the budgets posted on your completed deliveries. Kifurushi never handles the money, so we can only report what was agreed on the listing — not what changed hands.",
    },
  faq: {
    title: "Questions people ask",
    sub: "Everything below describes what Kifurushi actually does. If something isn't here, email hello@kifurushiapp.com.",
    stillStuck: "Didn't find your answer?",
    stillStuckCta: "Email us",
    groups: [
      {
        title: "How it works",
        items: [
          {
            q: "What is Kifurushi, exactly?",
            a: "We introduce people who want to send a parcel to travellers who already have spare luggage space on that route. That is the whole service. We are not a courier: we never touch your parcel, never transport anything, and are not party to the delivery you agree.",
          },
          {
            q: "Who actually carries my parcel?",
            a: "Another member, flying a route you both chose, whose identity has been checked. You see their verification status, rating and delivery history before you agree to anything — and you can decline anyone for any reason.",
          },
          {
            q: "How are senders and travellers matched?",
            a: "You post what you need; the other side finds it and requests you, or you request them. A match is only possible when both countries agree, the flight leaves on or before the date the parcel is needed, and the parcel fits the space the traveller still has free. The database refuses anything else.",
          },
          {
            q: "How long does it take to find someone?",
            a: "It depends entirely on who is flying your route. Busy corridors like Paris–Nairobi or London–Lagos move fastest. If nothing has been booked three days before your deadline we email you, tell you how many travellers leave just after your date, and let you change it.",
          },
        ],
      },
      {
        title: "Money",
        items: [
          {
            q: "How much does it cost to send something?",
            a: "You and the traveller agree the fee directly — typically $7–12 per kilo, against roughly $14 per kilo by courier. You set your budget when you post; travellers decide whether it's worth their space.",
          },
          {
            q: "How do I pay the traveller?",
            a: "Directly, in whatever way you both trust: cash at handover, M-Pesa, bank transfer. Kifurushi never holds, escrows or transfers that money, and takes no commission from it.",
          },
          {
            q: "Why doesn't Kifurushi handle the payment?",
            a: "Holding other people's money makes us a payment institution, which means licensing we don't have and costs you would pay for. Keeping the money between you two is what lets us charge one flat membership and take 0% of your delivery.",
          },
          {
            q: "So what am I paying the membership for?",
            a: "Access to the marketplace: posting listings, requesting matches, and the chat and delivery record around them. $5 a month or $29 a year, covering all three roles. Browsing, receiving a parcel and tracking one are free.",
          },
          {
            q: "Can I cancel?",
            a: "Yes, any time, from the pricing page. Your membership runs to the end of the period you already paid for and then stops. We don't do partial refunds.",
          },
        ],
      },
      {
        title: "Trust and safety",
        items: [
          {
            q: "How do I know the traveller is real?",
            a: "Verified members have passed a government-ID check plus a liveness selfie through our identity partner, Didit. The ✓ badge on a profile means that check passed. Ratings come only from completed deliveries and can never be edited or deleted.",
          },
          {
            q: "What stops someone stealing my parcel?",
            a: "Honestly: nothing makes theft impossible. What we do is make it costly and traceable — real identity behind every verified account, an immutable record of what was agreed, and a permanent ban across all corridors for confirmed misconduct. Send accordingly, and read the safety rules before your first handover.",
          },
          {
            q: "Is my parcel insured?",
            a: "No. There is no insurance and no compensation scheme, from us or from the traveller. If the value of what you're sending would hurt to lose, use an insured courier instead — that is the honest advice.",
          },
          {
            q: "What is the inspect-and-seal rule?",
            a: "The traveller must see every item, open, in person, before it is sealed — then you seal it together and photograph it on your own phones, sending the pictures in the match chat where they are timestamped and can't be edited. A traveller who accepts a pre-sealed package carries it as their own at the border. Both sides can be banned for skipping this.",
          },
          {
            q: "How does the delivery get confirmed?",
            a: "The receiver gets a one-time six-digit code. Entering it at handover is the proof of delivery: it completes the record and unlocks reviews for both sides. Codes are stored hashed, so nobody — including us — can read yours.",
          },
          {
            q: "Something went wrong. What happens?",
            a: "Email hello@kifurushiapp.com. We review the agreed terms, the match chat and the journey updates, and we can suspend or ban accounts at fault. We do not adjudicate private disputes and we do not compensate either party — but the full record is yours to use in any claim you pursue.",
          },
        ],
      },
      {
        title: "Verification and documents",
        items: [
          {
            q: "Do you store my passport photo?",
            a: "No. Your ID photo and selfie go from your device straight to Didit. We receive only the result — approved, declined or under review — and the document type. We could not produce your ID image if we wanted to.",
          },
          {
            q: "Why was my verification declined?",
            a: "Most often because the same face is already verified on another account. One person, one account — it's what keeps the badge meaningful. If you've lost access to your original account, email us rather than making a new one.",
          },
          {
            q: "My check says a person is reviewing it. How long?",
            a: "Longer than the automatic check, because it waits on a human. Nothing is required from you; the result appears on the same page. If it drags, email us and we'll chase it.",
          },
        ],
      },
      {
        title: "Practical",
        items: [
          {
            q: "What can't be sent?",
            a: "Anything illegal in either country, plus cash, unsealed medicines, weapons, batteries outside airline rules, perishables and anything you would not open in front of a stranger. The full list is on the safety page. Travellers are legally responsible for what's in their luggage at the border.",
          },
          {
            q: "Is this legal?",
            a: "Carrying something for someone else is legal in most places, provided it is declared correctly and is not a prohibited good — which is exactly why the inspect-and-seal rule exists. Customs and airline rules are the traveller's responsibility, and neither we nor the sender can take that on for them.",
          },
          {
            q: "Which countries do you cover?",
            a: "All 54 African countries and 22 diaspora destinations across Europe, North America, the Gulf and Asia-Pacific. Whether a route is useful depends on members actually flying it.",
          },
          {
            q: "What languages does Kifurushi speak?",
            a: "English, French and Swahili. Our emails to you follow the language you chose on the site.",
          },
        ],
      },
    ],
  },
  howTo: {
    title: "How to start",
    sub: "About two minutes. Kifurushi is free while we launch — no card needed.",
    accountStep: "Create your account",
    accountBody:
      "Name, email, password. We send you a link — click it to activate your account, then sign in.",
    accountNote: "Password: 10+ characters, with a capital, a small letter and a number.",
    travelTitle: "If you're travelling",
    travelSteps: [
      "Open the Trips menu and choose Post my trip.",
      "Enter your route, your flight date, how many spare kilos you have, and your price per kg ($7–12 is typical).",
      "Senders request you. Accept the ones you want, agree the fee directly, and carry it.",
    ],
    travelCta: "Post a trip",
    sendTitle: "If you're sending",
    sendSteps: [
      "Open the Parcels menu and choose Send a parcel.",
      "Enter your route, the date it must arrive, the weight, and what you're willing to pay.",
      "Travellers offer to carry it. Pick one, agree the fee directly, and hand it over.",
    ],
    sendCta: "Send a parcel",
    verifyNote:
      "Travellers: get verified before your first carry. A photo of your ID and a selfie, about two minutes — senders look for the badge.",
  },
  recommend: {
    tripsTitle: (n: number) =>
      n === 1
        ? "1 traveller can already take this"
        : `${n} travellers can already take this`,
    tripsNote:
      "Requesting uses their route and travel date — you won't need to finish this form.",
    departs: (date: string) => `departs ${date}`,
    kgFree: (kg: number) => `${kg} kg free`,
    estimate: (amount: number) => `≈ $${amount} for your parcel`,
    parcelsTitle: (n: number) =>
      n === 1
        ? "1 parcel is already waiting on this route"
        : `${n} parcels are already waiting on this route`,
    parcelsNote:
      "Post your trip and you can offer to carry them straight after.",
    parcelMeta: (kg: number, budget: number) => `${kg} kg · budget $${budget}`,
    neededBy: (date: string) => `needed by ${date}`,
  },
  browse: {
    askFirst:
      "Not sure yet? Ask them in Messages below first — accepting can wait.",
    chatWhileWaiting: (name: string) =>
      `Waiting for ${name} to accept — you can already chat in Messages below.`,
    tripsTitle: "Travellers going your way",
    tripsSub:
      "Verified people with spare luggage space. Request one to carry your parcel — you agree the fee directly.",
    parcelsTitle: "Parcels needing a traveller",
    parcelsSub:
      "People looking for someone on their route. Offer to carry and keep 100% of what you charge.",
    requestTraveller: "Request this traveller",
    requestSent: "Request sent — chat from your dashboard",
    offerToCarry: "Offer to carry this",
    offerSent: "Offer sent — chat from your dashboard",
    yourTrip: "Your trip",
    yourParcel: "Your parcel",
    pending: (n: number) =>
      n === 1 ? "1 request waiting" : `${n} requests waiting`,
    openDashboard: "Open dashboard",
    quickTitle: (name: string) => `Request ${name}`,
    quickRoute: "They fly this route — we only need your parcel details.",
    quickEstimate: (amount: number) => `They charge about $${amount} for this`,
    quickSend: "Send request",
    quickSending: "Sending…",
    quickCancel: "Cancel",
    quickCatHint: (name: string) =>
      `${name} didn't list some of these — you can still ask, and they'll see it before deciding.`,
    requestAgain: "Request again",
    quickChatNote: (name: string) =>
      `Sending this opens a chat with ${name} — ask questions and agree details there. Nothing is final until they accept.`,
    quickError: "Could not send the request — please try again.",
    needTripFirst: "Post your trip on this route first — we've prefilled it.",
    edit: "Edit",
    tooHeavy: (free: number) => `Only ${free} kg left on this trip.`,
    noFittingTrip:
      "None of your trips fit this parcel — it must fly your route and leave before the parcel is needed. Post one and we'll prefill the route.",
  },
  pricing: {
    launchBanner:
      "Kifurushi is free while we launch — post trips and parcels, request matches, pay nothing. You'll get clear notice by email before that ever changes.",
    heroTitle: "Free while we launch.",
    trialBanner: (date: string) =>
      `Your free first month is running — it ends on ${date}. Choose a plan any time before then to keep posting; nothing is charged until you do.`,
    freeMonth: "First month free",
    trialDormantBanner:
      "Your free month hasn't started yet — it begins when you post your first trip or parcel, so nothing is ticking away while you look around.",
    heroSub:
      "Everything is free during the launch period. The prices below are what membership will cost once it ends — and the 0% commission never changes. Kifurushi never takes a cut of what travellers earn.",
    free: "Free",
    freeTag: "Look around, receive, track.",
    freeFeatures: [
      "Browse every trip and parcel request",
      "See traveller ratings and reviews",
      "Receive a parcel — receiving is always free",
      "Track a delivery sent to you, with your delivery code",
    ],
    memberFeatures: [
      "Send parcels — post unlimited requests",
      "Travel & earn — post unlimited trips, keep 100% of your carriage fee",
      "Contact and match with anyone on the platform",
      "ID verification & the ✓ Verified badge",
      "Inspect-and-seal handover & one-time delivery codes",
      "Two-way reviews that build your reputation",
      "Dispute support with the full delivery record",
    ],
    monthly: "Monthly",
    yearly: "Yearly",
    monthlyNote: "Billed monthly. Cancel anytime.",
    yearlyNote: "Just $2.42 a month, billed once — save $31.",
    bestValue: "Best value · Save 52%",
    joinFor: (price: string) => `Join for ${price}`,
    activating: "Activating…",
    secureCheckout: "Secure checkout - cancel anytime",
    yourPlanSince: (date: string) => `Your plan since ${date}`,
    yourPlan: "Your plan",
    onPlan: (plan: string) => `You're on the ${plan} plan.`,
    planMonthly: "monthly",
    planYearly: "yearly",
    browseTrips: "Browse trips",
    joinError: "Could not activate your membership. Please try again.",
    reasonContact:
      "Membership is needed to contact travellers and senders — one membership covers your whole year.",
    reasonPost:
      "Membership is needed to post trips and parcel requests — one membership covers your whole year.",
    checkoutSuccess:
      "Payment received — your membership activates within a few seconds.",
    checkoutCancelled: "Checkout cancelled — you haven't been charged.",
    dismiss: "Dismiss",
    bandTitle: "Make money travelling - save on every parcel",
    bandCell1a: "$5/month or $29/year is for the platform only",
    bandCell1b: "— unlimited parcels, both directions.",
    bandCell2a: "The delivery fee you",
    bandCell2b: "negotiate directly with the traveller",
    bandCell2c: "(typically ~$45 per 5 kg vs $60+ courier). Kifurushi takes no cut.",
    bandCell3: "5 parcels a year = $150+ saved.",
    whyCards: [
      {
        title: "Cheaper than one courier shipment",
        body: "A 5 kg parcel London → Lagos costs $50–80 with a courier. One year of Kifurushi costs $29 (or $5/month) — and a traveller charges you around $45.",
      },
      {
        title: "Roles switch, price doesn't",
        body: "The same person sends in December, receives in March and carries in August. One membership covers all of it.",
      },
      {
        title: "No commission, ever",
        body: "Carriage fees are agreed and paid directly between you — cash, M-Pesa, bank transfer. Kifurushi never touches the money.",
      },
    ],
  },
  postTrip: {
    title: "Post a trip",
    sub: "Tell senders where you're flying and how much space you have.",
    roleBanner:
      "You're offering space in your luggage. Senders on this route will see your trip and request you — you agree the fee directly and keep 100% of it.",
    fromCountry: "From country",
    fromCity: "From city",
    toCountry: "To country",
    toCity: "To city",
    cityFromPlaceholder: "e.g. London",
    cityToPlaceholder: "e.g. Lagos",
    departureDate: "Departure date",
    space: "Space (kg)",
    pricePerKg: "Price per kg (USD)",
    priceHint: (courier: number) =>
      `Most travellers charge $7–12/kg. Couriers average ~$${courier}/kg.`,
    earnBand: (earnings: number) => `You'd earn ~$${earnings} on this trip`,
    saveBand: (courier: number, savings: number) =>
      `Senders pay ~$${courier} for the same weight by courier — they save ~$${savings} with you`,
    categoriesLabel: "Categories you'll accept",
    categoriesError: "Pick at least one category you'll accept",
    notes: "Notes (optional)",
    notesPlaceholder: "Airline, pickup arrangements, anything senders should know...",
    safetyNote:
      "You'll inspect and co-seal every parcel before carrying it. Never accept a sealed package you haven't seen inside — see",
    safetyLink: "traveller safety rules",
    publish: "Publish trip",
    publishing: "Publishing…",
    editTitle: "Edit your trip",
    save: "Save changes",
    saving: "Saving…",
    submitError: "Could not post your trip — please try again.",
  },
  postParcel: {
    title: "Send a parcel",
    sub: "Describe what you're sending — travellers on your route get notified.",
    roleBanner:
      "You're asking a traveller to carry this. Travellers flying your route will offer — you agree the fee directly with them, and Kifurushi takes no cut.",
    neededBy: "Needed by",
    weight: "Weight (kg)",
    budget: "Budget (USD)",
    budgetHint: (low: number, high: number, kg: number) =>
      `Travellers typically ask $${low}–${high} for ${kg} kg.`,
    courierBand: (courier: number, kg: number) =>
      `A courier would charge ~$${courier} for ${kg} kg`,
    saveNote: (budget: number, savings: number) =>
      `At your $${budget} budget you'd save ~$${savings}`,
    aboveNote:
      "Your budget is above courier rates — most travellers will take this route for less",
    category: "Category",
    categoriesLabel: "Categories",
    categoriesError: "Pick at least one category",
    whatsInside: "What's inside?",
    insidePlaceholder:
      "Be specific — travellers will inspect the contents with you before sealing.",
    prohibitedNote:
      "No cash, batteries loose in luggage, liquids over 100ml, perishables, weapons, or anything illegal in either country — full list on the",
    prohibitedLink: "prohibited items page",
    prohibitedNote2: "Misdeclared contents forfeit platform protection.",
    post: "Post parcel request",
    posting: "Posting…",
    editTitle: "Edit your parcel",
    save: "Save changes",
    saving: "Saving…",
    submitError: "Could not post your parcel — please try again.",
  },
};

export type Dict = typeof en;
