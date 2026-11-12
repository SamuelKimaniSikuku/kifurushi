// Nudges for listings nobody has taken. Run once a morning by pg_cron.
//
// Three moments matter to a member:
//   early   — 48 hours after posting, before the final three days
//   soon    — the deadline (or departure) is 3 days out and still nothing
//             booked, while there is usually still time to change the date
//   expired — it has passed unmatched, so the listing is dead and only a
//             repost will help
//
// Each is sent at most once per listing, recorded on the row itself. A nudge
// that arrives every morning is a nudge people filter.

import { createClient } from "npm:@supabase/supabase-js@2";
import { logIncident } from "../_shared/incidents.ts";

const SITE = "https://www.kifurushiapp.com";
type Lang = "en" | "fr" | "sw";

const T: Record<
  Lang,
  {
    parcelEarly: (city: string) => string;
    parcelEarlyBody: string;
    tripEarly: (city: string) => string;
    tripEarlyBody: string;
    parcelSoon: (city: string, date: string) => string;
    parcelSoonBody: (date: string, alt: number) => string;
    parcelGone: (city: string) => string;
    parcelGoneBody: string;
    tripSoon: (city: string, date: string) => string;
    tripSoonBody: (kg: number, waiting: number) => string;
    tripGone: (city: string) => string;
    tripGoneBody: (waiting: number) => string;
    pendingAsk: (name: string) => string;
    pendingAskBody: (c: { name: string; days: number; kg: number | null; budget: number; city: string }) => string;
    pendingOffer: (name: string) => string;
    pendingOfferBody: (c: { name: string; days: number; kg: number | null; city: string }) => string;
    respondNow: string;
    footerPending: string;
    trialSoon: (date: string) => string;
    trialSoonBody: (date: string) => string;
    trialOver: string;
    trialOverBody: string;
    choosePlan: string;
    footerTrial: string;
    editParcel: string;
    editTrip: string;
    browseTrips: string;
    browseParcels: string;
    footer: string;
  }
> = {
  en: {
    parcelEarly: (city) => `Still looking for a traveller to ${city}?`,
    parcelEarlyBody: "Your parcel has been listed for at least two days without a confirmed booking. Check travellers on your route, send a request, or follow up on a request you've already sent. If your dates are flexible, updating your deadline may give you more options. A request is only a booking once it is accepted.",
    tripEarly: (city) => `Find a parcel for your trip to ${city}`,
    tripEarlyBody: "Your trip has been listed for at least two days without a confirmed booking. Check parcels on your route and offer to carry one, reply to any requests, or share your trip. Make sure your dates, available space and price are up to date. A request is only a booking once it is accepted.",
    parcelSoon: (city, date) => `No traveller yet for ${city} — needed by ${date}`,
    parcelSoonBody: (date, alt) =>
      `Your parcel still has no confirmed booking, and you need it there by <b>${date}</b>.` +
      (alt > 0
        ? ` ${alt} traveller${alt === 1 ? "" : "s"} on your route leave${
            alt === 1 ? "s" : ""
          } just after that date — pushing your deadline back a few days would put them within reach.`
        : ` Allowing a later date widens the pool of travellers who can take it.`),
    parcelGone: (city) => `We're sorry — no traveller took your ${city} parcel in time`,
    parcelGoneBody:
      "Your deadline passed without a match, and we know that's a real letdown when something needed to get home. The honest reason is usually timing: most travellers post their trips two to six weeks ahead. If it still needs to go, repost with a later deadline — it costs nothing, and we'll alert every fitting traveller the moment you do.",
    tripSoon: (city, date) => `You leave for ${city} on ${date} with space unused`,
    tripSoonBody: (kg, waiting) =>
      `You still have <b>${kg} kg</b> free.` +
      (waiting > 0
        ? ` There ${waiting === 1 ? "is" : "are"} ${waiting} parcel${
            waiting === 1 ? "" : "s"
          } waiting on your route right now.`
        : ` Nothing is waiting on your route yet, but lowering your rate makes you the obvious choice when something appears.`),
    tripGone: (city) => `We're sorry — your ${city} trip flew with space unsold`,
    tripGoneBody: (waiting) =>
      "Your departure passed without a match, and we're sorry the kilos went empty — that's money that should have been yours." +
      (waiting > 0
        ? ` There ${waiting === 1 ? "is" : "are"} ${waiting} parcel${waiting === 1 ? "" : "s"} waiting on that route right now, so if you fly it again, post the trip as early as you can — we'll alert every fitting sender instantly.`
        : ` Next time, posting as early as you can makes the difference — most matches need a few days to form, and we now alert every fitting sender the moment you post.`),
    pendingAsk: (name) => `${name} is still waiting for your answer 📦`,
    pendingAskBody: (c) =>
      `<b>${c.name}</b> asked you ${c.days} days ago to carry their parcel (${c.kg == null ? "weight to agree" : `${c.kg} kg`}) to ${c.city} for $${c.budget}, and hasn't heard back. Accept, decline, or ask them a question in the chat — even a quick no lets them find another traveller in time.`,
    pendingOffer: (name) => `${name} is still waiting for your answer ✈️`,
    pendingOfferBody: (c) =>
      `<b>${c.name}</b> offered ${c.days} days ago to carry your parcel (${c.kg == null ? "weight to agree" : `${c.kg} kg`}) to ${c.city}, and hasn't heard back. Accept, decline, or ask them a question in the chat — travellers book their space out fast.`,
    respondNow: "Reply now",
    footerPending: "You get this because a match request on Kifurushi is waiting for your answer.",
    trialSoon: (date) => `Your free month on Kifurushi ends ${date}`,
    trialSoonBody: (date) =>
      `Your free first month ends on <b>${date}</b>. After that you can still browse, receive parcels and track deliveries — but posting a trip or a parcel, and requesting a match, need a membership.` +
      ` It's $5 a month or $29 a year, it covers sending and travelling both, and Kifurushi still takes no commission on anything you agree.`,
    trialOver: "Your free month on Kifurushi has ended",
    trialOverBody:
      "Your first month is up. You can still browse travellers and parcels, receive things people send you, and follow a delivery — those stay free. What needs a membership is posting your own trip or parcel and requesting a match.<br><br>$5 a month or $29 a year covers both sending and travelling, and we still take no commission on what you agree with the other person. Your listings are waiting where you left them.",
    choosePlan: "Choose a plan",
    footerTrial: "You get this because your free month on Kifurushi is ending.",
    editParcel: "Update my parcel",
    editTrip: "Update my trip",
    browseTrips: "See travellers",
    browseParcels: "See parcels",
    footer: "You get this because you have an open listing on Kifurushi.",
  },
  fr: {
    parcelEarly: (city) => `Vous cherchez encore un voyageur pour ${city} ?`,
    parcelEarlyBody: "Votre colis est publié depuis au moins deux jours sans réservation confirmée. Consultez les voyageurs sur votre trajet, envoyez une demande ou relancez une demande déjà envoyée. Si vos dates sont flexibles, modifier votre date limite peut vous donner plus de choix. Une demande devient une réservation uniquement après acceptation.",
    tripEarly: (city) => `Trouvez un colis pour votre voyage vers ${city}`,
    tripEarlyBody: "Votre voyage est publié depuis au moins deux jours sans réservation confirmée. Consultez les colis sur votre trajet, proposez de les transporter, répondez aux demandes ou partagez votre voyage. Vérifiez vos dates, la place disponible et votre tarif. Une demande devient une réservation uniquement après acceptation.",
    parcelSoon: (city, date) => `Aucun voyageur pour ${city} — requis avant le ${date}`,
    parcelSoonBody: (date, alt) =>
      `Votre colis n'a pas encore de réservation confirmée, et vous en avez besoin sur place avant le <b>${date}</b>.` +
      (alt > 0
        ? ` ${alt} voyageur${alt === 1 ? "" : "s"} sur votre itinéraire part${
            alt === 1 ? "" : "ent"
          } juste après cette date — repousser votre échéance de quelques jours les rendrait accessibles.`
        : ` Accepter une date plus tardive élargit le nombre de voyageurs possibles.`),
    parcelGone: (city) => `Désolés — aucun voyageur n'a pris votre colis pour ${city} à temps`,
    parcelGoneBody:
      "Votre échéance est passée sans mise en relation, et nous savons que c'est décevant quand quelque chose devait rentrer au pays. La raison honnête est souvent le calendrier : la plupart des voyageurs publient deux à six semaines à l'avance. S'il doit toujours partir, republiez avec une échéance plus tardive — c'est gratuit, et nous alerterons chaque voyageur compatible dès la publication.",
    tripSoon: (city, date) => `Vous partez pour ${city} le ${date} avec de la place libre`,
    tripSoonBody: (kg, waiting) =>
      `Il vous reste <b>${kg} kg</b> de libre.` +
      (waiting > 0
        ? ` ${waiting} colis attend${waiting === 1 ? "" : "ent"} actuellement sur votre itinéraire.`
        : ` Rien n'attend encore sur votre itinéraire, mais baisser votre tarif vous rendra évident dès qu'un colis apparaîtra.`),
    tripGone: (city) => `Désolés — votre voyage vers ${city} est parti avec de la place invendue`,
    tripGoneBody: (waiting) =>
      "Votre départ est passé sans mise en relation, et nous sommes désolés que ces kilos soient restés vides — c'était de l'argent qui aurait dû être le vôtre." +
      (waiting > 0
        ? ` ${waiting} colis attend${waiting === 1 ? "" : "ent"} actuellement sur cet itinéraire : si vous le refaites, publiez votre voyage le plus tôt possible — nous alertons chaque expéditeur compatible instantanément.`
        : ` La prochaine fois, publier le plus tôt possible fait la différence — la plupart des mises en relation prennent quelques jours, et nous alertons désormais chaque expéditeur compatible dès la publication.`),
    pendingAsk: (name) => `${name} attend toujours votre réponse 📦`,
    pendingAskBody: (c) =>
      `<b>${c.name}</b> vous a demandé il y a ${c.days} jours de transporter son colis (${c.kg == null ? "poids à convenir" : `${c.kg} kg`}) vers ${c.city} pour ${c.budget} $, sans réponse depuis. Acceptez, refusez, ou posez une question dans le chat — même un non rapide lui laisse le temps de trouver un autre voyageur.`,
    pendingOffer: (name) => `${name} attend toujours votre réponse ✈️`,
    pendingOfferBody: (c) =>
      `<b>${c.name}</b> a proposé il y a ${c.days} jours de transporter votre colis (${c.kg == null ? "poids à convenir" : `${c.kg} kg`}) vers ${c.city}, sans réponse depuis. Acceptez, refusez, ou posez une question dans le chat — l'espace des voyageurs part vite.`,
    respondNow: "Répondre maintenant",
    footerPending: "Vous recevez ceci car une demande de mise en relation sur Kifurushi attend votre réponse.",
    trialSoon: (date) => `Votre mois gratuit sur Kifurushi se termine le ${date}`,
    trialSoonBody: (date) =>
      `Votre premier mois gratuit se termine le <b>${date}</b>. Ensuite, vous pourrez toujours consulter les annonces, recevoir des colis et suivre les livraisons — mais publier un voyage ou un colis, et demander une mise en relation, nécessitent un abonnement.` +
      ` 5 $ par mois ou 29 $ par an, pour l'envoi comme pour le voyage, et Kifurushi ne prend toujours aucune commission sur ce que vous convenez.`,
    trialOver: "Votre mois gratuit sur Kifurushi est terminé",
    trialOverBody:
      "Votre premier mois est écoulé. Vous pouvez toujours consulter les voyageurs et les colis, recevoir ce qu'on vous envoie et suivre une livraison — cela reste gratuit. Ce qui nécessite un abonnement, c'est publier votre propre voyage ou colis et demander une mise en relation.<br><br>5 $ par mois ou 29 $ par an couvrent l'envoi et le voyage, et nous ne prenons toujours aucune commission sur ce que vous convenez. Vos annonces vous attendent là où vous les avez laissées.",
    choosePlan: "Choisir une formule",
    footerTrial: "Vous recevez ceci car votre mois gratuit sur Kifurushi se termine.",
    editParcel: "Modifier mon colis",
    editTrip: "Modifier mon voyage",
    browseTrips: "Voir les voyageurs",
    browseParcels: "Voir les colis",
    footer: "Vous recevez ceci car vous avez une annonce ouverte sur Kifurushi.",
  },
  sw: {
    parcelEarly: (city) => `Bado unatafuta msafiri kwenda ${city}?`,
    parcelEarlyBody: "Kifurushi chako kimetangazwa kwa angalau siku mbili bila makubaliano yaliyothibitishwa. Angalia wasafiri kwenye njia yako, tuma ombi au fuatilia ombi ulilotuma. Kama tarehe zako zinaweza kubadilika, kuongeza muda kunaweza kukupa chaguo zaidi. Ombi linakuwa makubaliano baada ya kukubaliwa.",
    tripEarly: (city) => `Tafuta kifurushi kwa safari yako ya ${city}`,
    tripEarlyBody: "Safari yako imetangazwa kwa angalau siku mbili bila makubaliano yaliyothibitishwa. Angalia vifurushi kwenye njia yako, jitolee kuvibeba, jibu maombi au shiriki safari yako. Hakikisha tarehe, nafasi na bei yako ni sahihi. Ombi linakuwa makubaliano baada ya kukubaliwa.",
    parcelSoon: (city, date) => `Hakuna msafiri kwa ${city} — kinahitajika kabla ya ${date}`,
    parcelSoonBody: (date, alt) =>
      `Kifurushi chako bado hakina makubaliano yaliyothibitishwa, na unakihitaji huko kabla ya <b>${date}</b>.` +
      (alt > 0
        ? ` Wasafiri ${alt} kwenye njia yako wanaondoka baada ya tarehe hiyo — kuongeza siku kadhaa kutawafanya wafikike.`
        : ` Kuruhusu tarehe ya baadaye huongeza wasafiri wanaoweza kukichukua.`),
    parcelGone: (city) => `Samahani — hakuna msafiri aliyechukua kifurushi chako cha ${city} kwa wakati`,
    parcelGoneBody:
      "Tarehe yako imepita bila match, na tunajua inavunja moyo wakati kitu kilihitajika kufika nyumbani. Sababu ya kweli mara nyingi ni muda: wasafiri wengi hutangaza safari zao wiki mbili hadi sita mapema. Kama bado kinahitaji kwenda, weka tangazo jipya na tarehe ya baadaye — ni bure, na tutawaarifu wasafiri wote wanaofaa mara moja.",
    tripSoon: (city, date) => `Unaondoka kwenda ${city} ${date} na nafasi bado ipo`,
    tripSoonBody: (kg, waiting) =>
      `Bado una <b>kg ${kg}</b> wazi.` +
      (waiting > 0
        ? ` Kuna vifurushi ${waiting} vinavyosubiri kwenye njia yako sasa.`
        : ` Hakuna kinachosubiri kwenye njia yako bado, lakini kupunguza bei yako kutakufanya uchaguliwe kwanza.`),
    tripGone: (city) => `Samahani — safari yako ya ${city} iliondoka na nafasi tupu`,
    tripGoneBody: (waiting) =>
      "Tarehe yako ya kuondoka imepita bila match, na samahani kwamba kilo hizo zilikwenda tupu — hiyo ilikuwa pesa ambayo ingekuwa yako." +
      (waiting > 0
        ? ` Kuna vifurushi ${waiting} vinavyosubiri kwenye njia hiyo sasa hivi — ukiisafiri tena, weka safari mapema uwezavyo, tutawaarifu watumaji wote wanaofaa papo hapo.`
        : ` Wakati ujao, kuweka tangazo mapema uwezavyo ndiko kunakoleta tofauti — match nyingi huchukua siku kadhaa, na sasa tunawaarifu watumaji wanaofaa mara tangazo linapowekwa.`),
    pendingAsk: (name) => `${name} bado anasubiri jibu lako 📦`,
    pendingAskBody: (c) =>
      `<b>${c.name}</b> alikuomba siku ${c.days} zilizopita ubebe kifurushi chake (${c.kg == null ? "uzito wa kukubaliana" : `kg ${c.kg}`}) kwenda ${c.city} kwa $${c.budget}, na hajapata jibu. Kubali, kataa, au muulize swali kwenye chat — hata "hapana" ya haraka inampa muda wa kutafuta msafiri mwingine.`,
    pendingOffer: (name) => `${name} bado anasubiri jibu lako ✈️`,
    pendingOfferBody: (c) =>
      `<b>${c.name}</b> alijitolea siku ${c.days} zilizopita kubeba kifurushi chako (${c.kg == null ? "uzito wa kukubaliana" : `kg ${c.kg}`}) kwenda ${c.city}, na hajapata jibu. Kubali, kataa, au muulize swali kwenye chat — nafasi za wasafiri huchukuliwa haraka.`,
    respondNow: "Jibu sasa",
    footerPending: "Unapata hii kwa sababu ombi la match kwenye Kifurushi linasubiri jibu lako.",
    trialSoon: (date) => `Mwezi wako wa bure kwenye Kifurushi unaisha ${date}`,
    trialSoonBody: (date) =>
      `Mwezi wako wa kwanza wa bure unaisha tarehe <b>${date}</b>. Baada ya hapo bado utaweza kuangalia matangazo, kupokea vifurushi na kufuatilia usafirishaji — lakini kuweka safari au kifurushi, na kuomba match, kunahitaji uanachama.` +
      ` Ni $5 kwa mwezi au $29 kwa mwaka, kwa kutuma na kusafiri vyote, na Kifurushi bado haichukui kamisheni yoyote kwa mnayokubaliana.`,
    trialOver: "Mwezi wako wa bure kwenye Kifurushi umeisha",
    trialOverBody:
      "Mwezi wako wa kwanza umekwisha. Bado unaweza kuangalia wasafiri na vifurushi, kupokea vitu watu wanavyokutumia, na kufuatilia usafirishaji — hivyo vinabaki bure. Kinachohitaji uanachama ni kuweka safari au kifurushi chako mwenyewe na kuomba match.<br><br>$5 kwa mwezi au $29 kwa mwaka inagharamia kutuma na kusafiri, na bado hatuchukui kamisheni kwa mnayokubaliana. Matangazo yako yanakusubiri pale ulipoyaacha.",
    choosePlan: "Chagua mpango",
    footerTrial: "Unapata hii kwa sababu mwezi wako wa bure kwenye Kifurushi unaisha.",
    editParcel: "Badilisha kifurushi changu",
    editTrip: "Badilisha safari yangu",
    browseTrips: "Ona wasafiri",
    browseParcels: "Ona vifurushi",
    footer: "Unapata hii kwa sababu una tangazo wazi kwenye Kifurushi.",
  },
};

function shell(
  heading: string,
  body: string,
  cta: string,
  href: string,
  lang: Lang,
  footer?: string
) {
  return `
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c2321">
  <div style="background:#0B3B2E;border-radius:16px;padding:28px;color:#fff">
    <h1 style="margin:0;font-size:22px">${escapeHtml(heading)}</h1>
  </div>
  <div style="font-size:14px;line-height:1.7;margin:20px 0">${body}</div>
  <a href="${href}" style="display:inline-block;background:#E85D26;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600">${cta}</a>
  <p style="font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:24px">
    ${footer ?? T[lang].footer}
  </p>
</div>`;
}

async function sendEmail(to: string, subject: string, html: string, idempotencyKey: string): Promise<boolean> {
  // Test-run guard: temp accounts created during verification use "+test"
  // aliases. Their matches exercise the real pipeline, but nobody should
  // receive the mail — least of all the founder's inbox.
  if (/\+test/i.test(to)) {
    console.log("skipping test-alias recipient", to);
    return true;
  }
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({
      from: "Kifurushi <hello@kifurushiapp.com>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    await logIncident(
      "email_send_failed",
      `Resend rejected a listing nudge (${res.status})`,
      "severe",
      { subject, detail: detail.slice(0, 400) }
    );
  }
  return res.ok;
}

const day = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : lang, {
    day: "numeric",
    month: "long",
  });

const DAY = 86_400_000;
const BOOKED_STATUSES = ["accepted", "escrow_paid", "picked_up", "in_transit", "delivered", "released", "disputed"];
type ReminderPhase = "early" | "soon" | "expired";
type ListingReminder = {
  id: string; user_id: string; status: string; to_city: string;
  from_country: string; to_country: string; listing_date: string; created_at: string;
  remaining_kg?: number; nudged_early_at: string | null;
  nudged_soon_at: string | null; nudged_expired_at: string | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function reminderPhase(listing: ListingReminder, now: number): ReminderPhase | null {
  const today = new Date(now).toISOString().slice(0, 10);
  const date = listing.listing_date;
  const created = Date.parse(listing.created_at);
  if (!Number.isFinite(created) || !Number.isFinite(Date.parse(date))) return null;
  const markers = [listing.nudged_early_at, listing.nudged_soon_at, listing.nudged_expired_at];
  // Space listing reminders out even when a member changes their deadline.
  if (markers.some((at) => at && now - Date.parse(at) < 2 * DAY)) return null;
  if (date < today) {
    const oldest = new Date(now - 3 * DAY).toISOString().slice(0, 10);
    return !listing.nudged_expired_at && date >= oldest ? "expired" : null;
  }
  if (listing.status !== "open" || (listing.remaining_kg !== undefined && !(listing.remaining_kg > 0))) return null;
  const in3 = new Date(now + 3 * DAY).toISOString().slice(0, 10);
  if (date <= in3) return !listing.nudged_soon_at && !listing.nudged_expired_at ? "soon" : null;
  return now - created >= 2 * DAY && markers.every((at) => !at) ? "early" : null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("ALERT_HOOK_SECRET");
  if (!secret || req.headers.get("x-hook-secret") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const threeDaysAgo = new Date(now - 3 * DAY).toISOString().slice(0, 10);
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;
    const notifiedUsers = new Set<string>();
    const planned: Record<string, number> = {};
    let sent = 0;

    async function recipient(userId: string) {
      const [{ data: prof, error: profileError }, { data: userRes, error: userError }] = await Promise.all([
        admin.from("profiles").select("full_name, lang").eq("id", userId).maybeSingle(),
        admin.auth.admin.getUserById(userId),
      ]);
      if (profileError || userError) throw profileError || userError;
      const lang: Lang = ["en", "fr", "sw"].includes(prof?.lang ?? "")
        ? (prof!.lang as Lang)
        : "en";
      return { email: userRes?.user?.email ?? null, lang };
    }

    async function hasConfirmedBooking(column: "parcel_id" | "trip_id", id: string) {
      // Requests are conversations, not bookings. Keep disputes suppressed too.
      // A database error must never be interpreted as "no booking".
      const { count } = await admin.from("matches")
        .select("id", { count: "exact", head: true })
        .eq(column, id)
        .in("status", BOOKED_STATUSES)
        .throwOnError();
      return (count ?? 0) > 0;
    }

    async function recordNudge(table: string, id: string, column: string) {
      if (dryRun) return;
      await admin.from(table).update({ [column]: new Date(now).toISOString() })
        .eq("id", id).throwOnError();
    }

    async function sendOnce(userId: string, key: string, email: string, subject: string, html: string) {
      // Prioritise a concrete request over a generic follow-up. Other listings
      // stay unmarked and can be considered on a later daily run.
      if (notifiedUsers.has(userId)) return false;
      const ok = dryRun || await sendEmail(email, subject, html, `listing-nudge/${key}`);
      if (ok) {
        notifiedUsers.add(userId);
        const phase = key.split("/")[0];
        planned[phase] = (planned[phase] ?? 0) + 1;
        if (!dryRun) sent++;
      }
      return ok;
    }

    // ----------------------------------- match requests unanswered for 48h
    // The responder got one email when the request landed and nothing since.
    // One reminder, once per match. A request whose listings have since gone
    // stale (trip departed, deadline passed) is marked without an email —
    // there is nothing useful left to answer.
    const cutoff = new Date(now - 48 * 3_600_000).toISOString();
    const { data: pending } = await admin
      .from("matches")
      .select(
        `id, parcel_id, requester_id, updated_at,
         trip:trips!matches_trip_id_fkey(traveler_id, to_city, depart_date),
         parcel:parcels!matches_parcel_id_fkey(sender_id, weight_kg, budget_usd, needed_by)`
      )
      .eq("status", "requested")
      .is("request_nudged_at", null)
      .lte("updated_at", cutoff)
      .limit(50)
      .throwOnError();

    for (const m of pending ?? []) {
      const trip = m.trip as unknown as {
        traveler_id: string; to_city: string; depart_date: string;
      } | null;
      const parcel = m.parcel as unknown as {
        sender_id: string; weight_kg: number | null; budget_usd: number; needed_by: string;
      } | null;
      if (!trip || !parcel) continue;

      const mark = () => recordNudge("matches", m.id, "request_nudged_at");

      if (trip.depart_date < today || parcel.needed_by < today) {
        await mark();
        continue;
      }

      // A different accepted booking makes this request obsolete.
      if (await hasConfirmedBooking("parcel_id", m.parcel_id)) {
        await mark();
        continue;
      }
      const senderRequested = m.requester_id === parcel.sender_id;
      const responderId = senderRequested ? trip.traveler_id : parcel.sender_id;
      const { email, lang } = await recipient(responderId);
      if (!email) {
        await mark();
        continue;
      }
      const { data: reqProf } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", m.requester_id)
        .maybeSingle();
      const name = reqProf?.full_name ?? "A member";
      const days = Math.max(2, Math.floor((Date.now() - new Date(m.updated_at).getTime()) / 86_400_000));

      const L = T[lang];
      const ctx = {
        name: escapeHtml(name),
        days,
        kg: parcel.weight_kg == null ? null : Number(parcel.weight_kg),
        budget: Math.round(Number(parcel.budget_usd)),
        city: escapeHtml(trip.to_city),
      };
      const ok = await sendOnce(
        responderId, `request/${m.id}`, email,
        senderRequested ? L.pendingAsk(name) : L.pendingOffer(name),
        shell(
          senderRequested ? L.pendingAsk(name) : L.pendingOffer(name),
          senderRequested ? L.pendingAskBody(ctx) : L.pendingOfferBody(ctx),
          L.respondNow,
          `${SITE}/dashboard`,
          lang,
          L.footerPending
        )
      );
      if (ok) await mark();
    }

    // Only recently expired listings are useful to follow up on. This also
    // avoids emailing months of old requested-only listings on rollout.
    for (const kind of ["parcel", "trip"] as const) {
      const table = kind === "parcel" ? "parcels" : "trips";
      const dateColumn = kind === "parcel" ? "needed_by" : "depart_date";
      const ownerColumn = kind === "parcel" ? "sender_id" : "traveler_id";
      let query = admin.from(table).select(
        `id, user_id:${ownerColumn}, status, to_city, from_country, to_country,
         listing_date:${dateColumn}, created_at, nudged_early_at, nudged_soon_at, nudged_expired_at` +
        (kind === "trip" ? ", remaining_kg" : "")
      ).gte(dateColumn, threeDaysAgo).order(dateColumn);
      if (kind === "parcel") query = query.eq("status", "open").eq("safety_hold", false);
      const { data: listings } = await query.throwOnError();

      for (const listing of (listings ?? []) as unknown as ListingReminder[]) {
        const phase = reminderPhase(listing, now);
        if (!phase || notifiedUsers.has(listing.user_id)) continue;
        if (await hasConfirmedBooking(kind === "parcel" ? "parcel_id" : "trip_id", listing.id)) continue;
        const { email, lang } = await recipient(listing.user_id);
        if (!email) continue;
        const L = T[lang];
        const city = listing.to_city;
        const when = day(listing.listing_date, lang);
        const route = `from=${encodeURIComponent(listing.from_country.trim())}&to=${encodeURIComponent(listing.to_country.trim())}`;
        let heading: string;
        let content: string;
        let cta: string;
        let href: string;
        if (phase === "early") {
          heading = kind === "parcel" ? L.parcelEarly(city) : L.tripEarly(city);
          content = kind === "parcel" ? L.parcelEarlyBody : L.tripEarlyBody;
          cta = kind === "parcel" ? L.browseTrips : L.browseParcels;
          href = `${SITE}/${kind === "parcel" ? "trips" : "parcels"}?${route}`;
        } else if (kind === "parcel") {
          let alternatives = 0;
          if (phase === "soon") {
            const { count } = await admin.from("trips").select("id", { count: "exact", head: true })
              .eq("status", "open").gt("remaining_kg", 0)
              .eq("from_country", listing.from_country).eq("to_country", listing.to_country)
              .gt("depart_date", listing.listing_date)
              .lte("depart_date", new Date(Date.parse(listing.listing_date) + 7 * DAY).toISOString().slice(0, 10))
              .throwOnError();
            alternatives = count ?? 0;
          }
          heading = phase === "soon" ? L.parcelSoon(city, when) : L.parcelGone(city);
          content = phase === "soon" ? L.parcelSoonBody(when, alternatives) : L.parcelGoneBody;
          cta = L.editParcel;
          href = `${SITE}/post/parcel?edit=${listing.id}`;
        } else {
          const { count: waiting } = await admin.from("parcels")
            .select("id", { count: "exact", head: true })
            .eq("status", "open").eq("safety_hold", false)
            .eq("from_country", listing.from_country).eq("to_country", listing.to_country)
            .gte("needed_by", phase === "soon" ? listing.listing_date : today)
            .throwOnError();
          heading = phase === "soon" ? L.tripSoon(city, when) : L.tripGone(city);
          content = phase === "soon" ? L.tripSoonBody(listing.remaining_kg ?? 0, waiting ?? 0) : L.tripGoneBody(waiting ?? 0);
          cta = phase === "soon" && waiting ? L.browseParcels : L.editTrip;
          href = phase === "expired" ? `${SITE}/post/trip` : waiting ? `${SITE}/parcels?${route}` : `${SITE}/post/trip?edit=${listing.id}`;
        }
        const ok = await sendOnce(listing.user_id, `${phase}/${table}/${listing.id}`, email,
          heading, shell(heading, content, cta, href, lang));
        if (ok) await recordNudge(table, listing.id, `nudged_${phase}_at`);
      }
    }

    // An authenticated preview exercises the real selection without sending
    // email or updating any timestamps (including the membership reminders).
    if (dryRun) return Response.json({ ok: true, dry_run: true, sent: 0, planned });

    // ------------------------------------------- free month about to run out
    // Warned once, three days out, while there is still time to decide. Someone
    // discovering the paywall by finding they can no longer post is someone who
    // concludes the app broke, not that their trial ended.
    const { data: trialsEnding } = await admin
      .from("memberships")
      .select("user_id, current_period_end")
      .eq("provider", "trial")
      .eq("status", "active")
      .is("trial_notified_at", null)
      .gt("current_period_end", new Date().toISOString())
      .lte("current_period_end", new Date(Date.now() + 3 * 86_400_000).toISOString());

    for (const m of trialsEnding ?? []) {
      const { email, lang } = await recipient(m.user_id);
      if (!email) continue;
      const L = T[lang];
      const when = day(m.current_period_end, lang);
      const ok = await sendEmail(
        email,
        L.trialSoon(when),
        shell(
          L.trialSoon(when),
          L.trialSoonBody(when),
          L.choosePlan,
          `${SITE}/pricing`,
          lang,
          L.footerTrial
        ),
        `trial-soon/${m.user_id}/${m.current_period_end}`
      );
      if (ok) {
        await admin
          .from("memberships")
          .update({ trial_notified_at: new Date().toISOString() })
          .eq("user_id", m.user_id);
        sent++;
      }
    }

    // ------------------------------------------------- free month has lapsed
    // Only for members still on a trial: anyone who has since paid has a
    // provider of 'stripe' and never sees this.
    const { data: trialsOver } = await admin
      .from("memberships")
      .select("user_id")
      .eq("provider", "trial")
      .is("trial_ended_notified_at", null)
      .lt("current_period_end", new Date().toISOString());

    for (const m of trialsOver ?? []) {
      const { email, lang } = await recipient(m.user_id);
      if (!email) continue;
      const L = T[lang];
      const ok = await sendEmail(
        email,
        L.trialOver,
        shell(L.trialOver, L.trialOverBody, L.choosePlan, `${SITE}/pricing`, lang, L.footerTrial),
        `trial-over/${m.user_id}`
      );
      if (ok) {
        await admin
          .from("memberships")
          .update({ trial_ended_notified_at: new Date().toISOString() })
          .eq("user_id", m.user_id);
        sent++;
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Listing follow-up failed", error);
    // Return a failure for operational monitoring without leaking user data.
    return Response.json({ ok: false, error: "Listing follow-up failed" }, { status: 500 });
  }
});
