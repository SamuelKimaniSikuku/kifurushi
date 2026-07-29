// Emails members about every match event — a request arriving, an accept or
// decline, each delivery milestone, and new chat activity. Invoked by the
// matches/messages DB triggers via pg_net; the shared secret header keeps
// strangers out. Deployed with --no-verify-jwt.
//
// Recipients:
//   requested            -> the counterparty of whoever requested
//   accepted / declined  -> whoever made the request (the other side answered)
//   picked_up / in_transit / delivered -> the sender (traveller acted)
//   escrow_paid / cancelled / released -> both parties
//   message              -> whoever did not send it

import { createClient } from "npm:@supabase/supabase-js@2";

type Lang = "en" | "fr" | "sw";
type Role = "traveler" | "sender";
type Event =
  | "requested" | "accepted" | "declined" | "escrow_paid" | "picked_up"
  | "in_transit" | "delivered" | "released" | "cancelled" | "message";

interface Ctx {
  route: string;
  other: string;
  role: Role;
}

type Copy = { subject: string; heading: string; body: (c: Ctx) => string };

const COPY: Record<Lang, Record<Event, Copy>> = {
  en: {
    requested: {
      subject: "New request on Kifurushi 📬",
      heading: "Someone wants to work with you",
      body: (c) =>
        c.role === "traveler"
          ? `<b>${c.other}</b> would like you to carry their parcel on <b>${c.route}</b>. Open your dashboard to accept or decline.`
          : `<b>${c.other}</b> has offered to carry your parcel on <b>${c.route}</b>. Open your dashboard to see their profile and reviews.`,
    },
    accepted: {
      subject: "Your request was accepted ✅",
      heading: "You're matched!",
      body: (c) =>
        `<b>${c.other}</b> accepted for <b>${c.route}</b>. Agree the carriage fee and handover details in the chat — then confirm the terms on your dashboard.`,
    },
    declined: {
      subject: "Your request was declined",
      heading: "Not this time",
      body: (c) =>
        `<b>${c.other}</b> can't carry this one on <b>${c.route}</b>. Browse other travellers on your route — new trips are posted daily.`,
    },
    escrow_paid: {
      subject: "Terms agreed 🤝",
      heading: "Terms agreed",
      body: (c) =>
        `You and <b>${c.other}</b> have agreed the terms for <b>${c.route}</b>. Next: meet, inspect the parcel together and seal it. The sender generates the delivery code for the receiver.`,
    },
    picked_up: {
      subject: "Your parcel is sealed and on its way 📦",
      heading: "Sealed and picked up",
      body: (c) =>
        `<b>${c.other}</b> has collected and sealed your parcel for <b>${c.route}</b>. Make sure the receiver has the 6-digit delivery code — it's on your dashboard.`,
    },
    in_transit: {
      subject: "Your parcel is in transit ✈️",
      heading: "In transit",
      body: (c) =>
        `<b>${c.other}</b> is on the way with your parcel on <b>${c.route}</b>. Journey updates appear on your dashboard.`,
    },
    delivered: {
      subject: "Delivery in progress — code needed 🔑",
      heading: "Almost there",
      body: (c) =>
        `<b>${c.other}</b> has marked your parcel delivered on <b>${c.route}</b>. The receiver must now read out the 6-digit code to complete the handover — find it on your dashboard.`,
    },
    released: {
      subject: "Delivery complete ✅",
      heading: "Delivery confirmed!",
      body: (c) =>
        c.role === "traveler"
          ? `The receiver confirmed your delivery on <b>${c.route}</b> with the code — the record with ${c.other} is complete and your delivery count went up. Leave a review to build your reputation.`
          : `Your parcel on <b>${c.route}</b> was handed over and confirmed with the delivery code. The record with ${c.other} is complete — leave a review to help the next sender.`,
    },
    cancelled: {
      subject: "A delivery was cancelled",
      heading: "Delivery cancelled",
      body: (c) =>
        `The delivery with <b>${c.other}</b> on <b>${c.route}</b> was cancelled. Your listing is open again — browse other matches on your route.`,
    },
    message: {
      subject: "New message on Kifurushi 💬",
      heading: "You have a new message",
      body: (c) =>
        `<b>${c.other}</b> sent you a message about <b>${c.route}</b>. Open your dashboard to read and reply.`,
    },
  },

  fr: {
    requested: {
      subject: "Nouvelle demande sur Kifurushi 📬",
      heading: "Quelqu'un souhaite travailler avec vous",
      body: (c) =>
        c.role === "traveler"
          ? `<b>${c.other}</b> aimerait que vous transportiez son colis sur <b>${c.route}</b>. Ouvrez votre tableau de bord pour accepter ou refuser.`
          : `<b>${c.other}</b> propose de transporter votre colis sur <b>${c.route}</b>. Ouvrez votre tableau de bord pour voir son profil et ses avis.`,
    },
    accepted: {
      subject: "Votre demande a été acceptée ✅",
      heading: "Vous êtes en relation !",
      body: (c) =>
        `<b>${c.other}</b> a accepté pour <b>${c.route}</b>. Convenez du prix et des détails de la remise dans la messagerie, puis confirmez les termes sur votre tableau de bord.`,
    },
    declined: {
      subject: "Votre demande a été refusée",
      heading: "Pas cette fois",
      body: (c) =>
        `<b>${c.other}</b> ne peut pas transporter ce colis sur <b>${c.route}</b>. Parcourez d'autres voyageurs sur votre itinéraire — de nouveaux voyages sont publiés chaque jour.`,
    },
    escrow_paid: {
      subject: "Termes convenus 🤝",
      heading: "Termes convenus",
      body: (c) =>
        `Vous et <b>${c.other}</b> avez convenu des termes pour <b>${c.route}</b>. Ensuite : rencontrez-vous, inspectez le colis ensemble et scellez-le. L'expéditeur génère le code de livraison pour le destinataire.`,
    },
    picked_up: {
      subject: "Votre colis est scellé et en route 📦",
      heading: "Scellé et récupéré",
      body: (c) =>
        `<b>${c.other}</b> a récupéré et scellé votre colis pour <b>${c.route}</b>. Assurez-vous que le destinataire a le code à 6 chiffres — il est sur votre tableau de bord.`,
    },
    in_transit: {
      subject: "Votre colis est en transit ✈️",
      heading: "En transit",
      body: (c) =>
        `<b>${c.other}</b> est en route avec votre colis sur <b>${c.route}</b>. Le suivi du trajet apparaît sur votre tableau de bord.`,
    },
    delivered: {
      subject: "Livraison en cours — code requis 🔑",
      heading: "Presque terminé",
      body: (c) =>
        `<b>${c.other}</b> a marqué votre colis comme livré sur <b>${c.route}</b>. Le destinataire doit maintenant communiquer le code à 6 chiffres pour finaliser la remise — retrouvez-le sur votre tableau de bord.`,
    },
    released: {
      subject: "Livraison terminée ✅",
      heading: "Livraison confirmée !",
      body: (c) =>
        c.role === "traveler"
          ? `Le destinataire a confirmé votre livraison sur <b>${c.route}</b> avec le code — le dossier avec ${c.other} est complet et votre compteur de livraisons a augmenté. Laissez un avis pour bâtir votre réputation.`
          : `Votre colis sur <b>${c.route}</b> a été remis et confirmé avec le code de livraison. Le dossier avec ${c.other} est complet — laissez un avis pour aider le prochain expéditeur.`,
    },
    cancelled: {
      subject: "Une livraison a été annulée",
      heading: "Livraison annulée",
      body: (c) =>
        `La livraison avec <b>${c.other}</b> sur <b>${c.route}</b> a été annulée. Votre annonce est de nouveau active — parcourez d'autres correspondances sur votre itinéraire.`,
    },
    message: {
      subject: "Nouveau message sur Kifurushi 💬",
      heading: "Vous avez un nouveau message",
      body: (c) =>
        `<b>${c.other}</b> vous a envoyé un message à propos de <b>${c.route}</b>. Ouvrez votre tableau de bord pour lire et répondre.`,
    },
  },

  sw: {
    requested: {
      subject: "Ombi jipya kwenye Kifurushi 📬",
      heading: "Mtu anataka kufanya kazi nawe",
      body: (c) =>
        c.role === "traveler"
          ? `<b>${c.other}</b> anataka ubebe kifurushi chake kwenye <b>${c.route}</b>. Fungua dashibodi yako ukubali au ukatae.`
          : `<b>${c.other}</b> amejitolea kubeba kifurushi chako kwenye <b>${c.route}</b>. Fungua dashibodi yako uone wasifu na tathmini zake.`,
    },
    accepted: {
      subject: "Ombi lako limekubaliwa ✅",
      heading: "Mmeunganishwa!",
      body: (c) =>
        `<b>${c.other}</b> amekubali kwa <b>${c.route}</b>. Kubalianeni ada na mpango wa makabidhiano kwenye ujumbe, kisha thibitisha makubaliano kwenye dashibodi yako.`,
    },
    declined: {
      subject: "Ombi lako limekataliwa",
      heading: "Si safari hii",
      body: (c) =>
        `<b>${c.other}</b> hawezi kubeba hiki kwenye <b>${c.route}</b>. Angalia wasafiri wengine wa njia yako — safari mpya zinatangazwa kila siku.`,
    },
    escrow_paid: {
      subject: "Makubaliano yamefikiwa 🤝",
      heading: "Makubaliano yamefikiwa",
      body: (c) =>
        `Wewe na <b>${c.other}</b> mmekubaliana kwa <b>${c.route}</b>. Kinachofuata: kutaneni, kagueni kifurushi pamoja na kukifunga. Mtumaji anatengeneza msimbo wa makabidhiano kwa mpokeaji.`,
    },
    picked_up: {
      subject: "Kifurushi chako kimefungwa na kiko njiani 📦",
      heading: "Kimefungwa na kuchukuliwa",
      body: (c) =>
        `<b>${c.other}</b> amechukua na kufunga kifurushi chako cha <b>${c.route}</b>. Hakikisha mpokeaji ana msimbo wa tarakimu 6 — uko kwenye dashibodi yako.`,
    },
    in_transit: {
      subject: "Kifurushi chako kiko safarini ✈️",
      heading: "Safarini",
      body: (c) =>
        `<b>${c.other}</b> yuko njiani na kifurushi chako cha <b>${c.route}</b>. Taarifa za safari zinaonekana kwenye dashibodi yako.`,
    },
    delivered: {
      subject: "Uwasilishaji unaendelea — msimbo unahitajika 🔑",
      heading: "Karibu kumaliza",
      body: (c) =>
        `<b>${c.other}</b> amesema kifurushi chako kimefikishwa kwenye <b>${c.route}</b>. Sasa mpokeaji lazima asome msimbo wa tarakimu 6 kukamilisha makabidhiano — utaupata kwenye dashibodi yako.`,
    },
    released: {
      subject: "Uwasilishaji umekamilika ✅",
      heading: "Uwasilishaji umethibitishwa!",
      body: (c) =>
        c.role === "traveler"
          ? `Mpokeaji amethibitisha uwasilishaji wako wa <b>${c.route}</b> kwa msimbo — rekodi na ${c.other} imekamilika na idadi yako ya usafirishaji imeongezeka. Acha tathmini kujenga sifa yako.`
          : `Kifurushi chako cha <b>${c.route}</b> kimekabidhiwa na kuthibitishwa kwa msimbo. Rekodi na ${c.other} imekamilika — acha tathmini kusaidia mtumaji ajaye.`,
    },
    cancelled: {
      subject: "Uwasilishaji umeghairiwa",
      heading: "Uwasilishaji umeghairiwa",
      body: (c) =>
        `Uwasilishaji na <b>${c.other}</b> kwenye <b>${c.route}</b> umeghairiwa. Tangazo lako liko wazi tena — angalia michanganyiko mingine ya njia yako.`,
    },
    message: {
      subject: "Ujumbe mpya kwenye Kifurushi 💬",
      heading: "Una ujumbe mpya",
      body: (c) =>
        `<b>${c.other}</b> amekutumia ujumbe kuhusu <b>${c.route}</b>. Fungua dashibodi yako kusoma na kujibu.`,
    },
  },
};

const BUTTON: Record<Lang, string> = {
  en: "Open your dashboard",
  fr: "Ouvrir votre tableau de bord",
  sw: "Fungua dashibodi yako",
};

const FOOTER: Record<Lang, string> = {
  en: "Kifurushi connects senders and travellers — every delivery is a direct agreement between the two of you.",
  fr: "Kifurushi met en relation expéditeurs et voyageurs — chaque livraison est un accord direct entre vous deux.",
  sw: "Kifurushi inaunganisha watumaji na wasafiri — kila usafirishaji ni makubaliano ya moja kwa moja kati yenu wawili.",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kifurushi <hello@kifurushiapp.com>",
        to: [to],
        subject,
        html,
      }),
    });
  } catch (e) {
    console.error("match email failed", e);
  }
}

function shell(heading: string, body: string, lang: Lang): string {
  return `
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c2321">
  <div style="background:#0B3B2E;border-radius:16px;padding:28px;color:#fff">
    <h1 style="margin:0;font-size:22px">${heading}</h1>
  </div>
  <div style="font-size:14px;line-height:1.7;margin:20px 0">${body}</div>
  <a href="https://www.kifurushiapp.com/dashboard"
     style="display:inline-block;background:#E85D26;color:#fff;text-decoration:none;font-weight:600;border-radius:12px;padding:12px 22px;font-size:14px">
    ${BUTTON[lang]}
  </a>
  <p style="margin-top:24px;font-size:12px;color:#8a938f">${FOOTER[lang]}</p>
</div>`;
}

const SENDER_ONLY: Event[] = ["picked_up", "in_transit", "delivered"];
const TO_REQUESTER: Event[] = ["accepted", "declined"];
const BOTH: Event[] = ["escrow_paid", "cancelled", "released"];

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const secret = req.headers.get("x-hook-secret") ?? "";
  const expected = Deno.env.get("DELIVERY_HOOK_SECRET") ?? "";
  if (!expected || !timingSafeEqual(secret, expected)) {
    return new Response("Forbidden", { status: 403 });
  }

  let matchId = "";
  let event: Event = "requested";
  let actor: string | null = null;
  try {
    const b = await req.json();
    matchId = b.match_id;
    event = b.event;
    actor = b.actor ?? null;
  } catch {
    return new Response("Bad payload", { status: 400 });
  }
  if (!matchId || !event) return new Response("Bad payload", { status: 400 });

  const ok = (extra: Record<string, unknown> = {}) =>
    new Response(JSON.stringify({ ok: true, ...extra }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  if (!COPY.en[event]) return ok({ ignored: event });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: match, error } = await admin
    .from("matches")
    .select(
      `id, requester_id,
       trip:trips!matches_trip_id_fkey(from_city, to_city, traveler_id),
       parcel:parcels!matches_parcel_id_fkey(sender_id)`
    )
    .eq("id", matchId)
    .maybeSingle();
  if (error || !match) return ok({ ignored: "match not found" });

  const trip = match.trip as unknown as {
    from_city: string;
    to_city: string;
    traveler_id: string;
  } | null;
  const parcel = match.parcel as unknown as { sender_id: string } | null;
  if (!trip || !parcel) return ok({ ignored: "listing hidden" });

  const route = `${trip.from_city} → ${trip.to_city}`;
  const travelerId = trip.traveler_id;
  const senderId = parcel.sender_id;

  // Who should hear about this?
  let recipients: string[];
  if (event === "requested") {
    recipients = [match.requester_id === travelerId ? senderId : travelerId];
  } else if (TO_REQUESTER.includes(event)) {
    recipients = [match.requester_id];
  } else if (event === "message") {
    recipients = [actor === travelerId ? senderId : travelerId];
  } else if (SENDER_ONLY.includes(event)) {
    recipients = [senderId];
  } else if (BOTH.includes(event)) {
    recipients = [travelerId, senderId];
  } else {
    return ok({ ignored: event });
  }

  async function profile(uid: string) {
    const [{ data: user }, { data: prof }] = await Promise.all([
      admin.auth.admin.getUserById(uid),
      admin.from("profiles").select("full_name, lang").eq("id", uid).maybeSingle(),
    ]);
    const lang: Lang = ["en", "fr", "sw"].includes(prof?.lang ?? "")
      ? (prof!.lang as Lang)
      : "en";
    return {
      email: user?.user?.email ?? null,
      name: prof?.full_name ?? "your match partner",
      lang,
    };
  }

  const [travelerP, senderP] = await Promise.all([
    profile(travelerId),
    profile(senderId),
  ]);

  const jobs: Promise<void>[] = [];
  for (const uid of recipients) {
    // Never email someone about their own action.
    if (uid === actor) continue;
    const me = uid === travelerId ? travelerP : senderP;
    const other = uid === travelerId ? senderP : travelerP;
    if (!me.email) continue;
    const role: Role = uid === travelerId ? "traveler" : "sender";
    const c = COPY[me.lang][event];
    jobs.push(
      sendEmail(
        me.email,
        c.subject,
        shell(c.heading, c.body({ route, other: other.name, role }), me.lang)
      )
    );
  }
  await Promise.all(jobs);

  return ok({ event, emailed: jobs.length });
});
