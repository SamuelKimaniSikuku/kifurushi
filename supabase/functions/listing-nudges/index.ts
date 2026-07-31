// Nudges for listings nobody has taken. Run once a morning by pg_cron.
//
// Two moments matter to a member:
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
    parcelSoon: (city: string, date: string) => string;
    parcelSoonBody: (date: string, alt: number) => string;
    parcelGone: (city: string) => string;
    parcelGoneBody: string;
    tripSoon: (city: string, date: string) => string;
    tripSoonBody: (kg: number, waiting: number) => string;
    trialSoon: (date: string) => string;
    trialSoonBody: (date: string) => string;
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
    parcelSoon: (city, date) => `No traveller yet for ${city} — needed by ${date}`,
    parcelSoonBody: (date, alt) =>
      `Your parcel still has nobody to carry it, and you need it there by <b>${date}</b>.` +
      (alt > 0
        ? ` ${alt} traveller${alt === 1 ? "" : "s"} on your route leave${
            alt === 1 ? "s" : ""
          } just after that date — pushing your deadline back a few days would put them within reach.`
        : ` Allowing a later date widens the pool of travellers who can take it.`),
    parcelGone: (city) => `Your ${city} parcel expired without a traveller`,
    parcelGoneBody:
      "The date you needed it by has passed and nobody took it. Reposting with a later deadline usually finds someone — most travellers post their trips two to six weeks ahead.",
    tripSoon: (city, date) => `You leave for ${city} on ${date} with space unused`,
    tripSoonBody: (kg, waiting) =>
      `You still have <b>${kg} kg</b> free.` +
      (waiting > 0
        ? ` There ${waiting === 1 ? "is" : "are"} ${waiting} parcel${
            waiting === 1 ? "" : "s"
          } waiting on your route right now.`
        : ` Nothing is waiting on your route yet, but lowering your rate makes you the obvious choice when something appears.`),
    trialSoon: (date) => `Your free month on Kifurushi ends ${date}`,
    trialSoonBody: (date) =>
      `Your free first month ends on <b>${date}</b>. After that you can still browse, receive parcels and track deliveries — but posting a trip or a parcel, and requesting a match, need a membership.` +
      ` It's $5 a month or $29 a year, it covers sending and travelling both, and Kifurushi still takes no commission on anything you agree.`,
    choosePlan: "Choose a plan",
    footerTrial: "You get this because your free month on Kifurushi is ending.",
    editParcel: "Update my parcel",
    editTrip: "Update my trip",
    browseTrips: "See travellers",
    browseParcels: "See parcels",
    footer: "You get this because you have an open listing on Kifurushi.",
  },
  fr: {
    parcelSoon: (city, date) => `Aucun voyageur pour ${city} — requis avant le ${date}`,
    parcelSoonBody: (date, alt) =>
      `Personne ne s'est encore proposé pour votre colis, et vous en avez besoin sur place avant le <b>${date}</b>.` +
      (alt > 0
        ? ` ${alt} voyageur${alt === 1 ? "" : "s"} sur votre itinéraire part${
            alt === 1 ? "" : "ent"
          } juste après cette date — repousser votre échéance de quelques jours les rendrait accessibles.`
        : ` Accepter une date plus tardive élargit le nombre de voyageurs possibles.`),
    parcelGone: (city) => `Votre colis pour ${city} a expiré sans voyageur`,
    parcelGoneBody:
      "La date limite est passée et personne ne l'a pris. Republier avec une échéance plus tardive fonctionne généralement : la plupart des voyageurs publient deux à six semaines à l'avance.",
    tripSoon: (city, date) => `Vous partez pour ${city} le ${date} avec de la place libre`,
    tripSoonBody: (kg, waiting) =>
      `Il vous reste <b>${kg} kg</b> de libre.` +
      (waiting > 0
        ? ` ${waiting} colis attend${waiting === 1 ? "" : "ent"} actuellement sur votre itinéraire.`
        : ` Rien n'attend encore sur votre itinéraire, mais baisser votre tarif vous rendra évident dès qu'un colis apparaîtra.`),
    trialSoon: (date) => `Votre mois gratuit sur Kifurushi se termine le ${date}`,
    trialSoonBody: (date) =>
      `Votre premier mois gratuit se termine le <b>${date}</b>. Ensuite, vous pourrez toujours consulter les annonces, recevoir des colis et suivre les livraisons — mais publier un voyage ou un colis, et demander une mise en relation, nécessitent un abonnement.` +
      ` 5 $ par mois ou 29 $ par an, pour l'envoi comme pour le voyage, et Kifurushi ne prend toujours aucune commission sur ce que vous convenez.`,
    choosePlan: "Choisir une formule",
    footerTrial: "Vous recevez ceci car votre mois gratuit sur Kifurushi se termine.",
    editParcel: "Modifier mon colis",
    editTrip: "Modifier mon voyage",
    browseTrips: "Voir les voyageurs",
    browseParcels: "Voir les colis",
    footer: "Vous recevez ceci car vous avez une annonce ouverte sur Kifurushi.",
  },
  sw: {
    parcelSoon: (city, date) => `Hakuna msafiri kwa ${city} — kinahitajika kabla ya ${date}`,
    parcelSoonBody: (date, alt) =>
      `Kifurushi chako hakina mtu wa kukichukua, na unakihitaji huko kabla ya <b>${date}</b>.` +
      (alt > 0
        ? ` Wasafiri ${alt} kwenye njia yako wanaondoka baada ya tarehe hiyo — kuongeza siku kadhaa kutawafanya wafikike.`
        : ` Kuruhusu tarehe ya baadaye huongeza wasafiri wanaoweza kukichukua.`),
    parcelGone: (city) => `Kifurushi chako cha ${city} kilipita bila msafiri`,
    parcelGoneBody:
      "Tarehe uliyohitaji imepita na hakuna aliyekichukua. Kuweka tangazo jipya na tarehe ya baadaye mara nyingi hufanikiwa — wasafiri wengi hutangaza safari zao wiki mbili hadi sita mbele.",
    tripSoon: (city, date) => `Unaondoka kwenda ${city} ${date} na nafasi bado ipo`,
    tripSoonBody: (kg, waiting) =>
      `Bado una <b>kg ${kg}</b> wazi.` +
      (waiting > 0
        ? ` Kuna vifurushi ${waiting} vinavyosubiri kwenye njia yako sasa.`
        : ` Hakuna kinachosubiri kwenye njia yako bado, lakini kupunguza bei yako kutakufanya uchaguliwe kwanza.`),
    trialSoon: (date) => `Mwezi wako wa bure kwenye Kifurushi unaisha ${date}`,
    trialSoonBody: (date) =>
      `Mwezi wako wa kwanza wa bure unaisha tarehe <b>${date}</b>. Baada ya hapo bado utaweza kuangalia matangazo, kupokea vifurushi na kufuatilia usafirishaji — lakini kuweka safari au kifurushi, na kuomba match, kunahitaji uanachama.` +
      ` Ni $5 kwa mwezi au $29 kwa mwaka, kwa kutuma na kusafiri vyote, na Kifurushi bado haichukui kamisheni yoyote kwa mnayokubaliana.`,
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
    <h1 style="margin:0;font-size:22px">${heading}</h1>
  </div>
  <div style="font-size:14px;line-height:1.7;margin:20px 0">${body}</div>
  <a href="${href}" style="display:inline-block;background:#E85D26;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600">${cta}</a>
  <p style="font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:24px">
    ${footer ?? T[lang].footer}
  </p>
</div>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
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

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (req.headers.get("x-hook-secret") !== Deno.env.get("ALERT_HOOK_SECRET")) {
    return new Response("Forbidden", { status: 403 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().slice(0, 10);
  const in3 = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);

  async function recipient(userId: string) {
    const [{ data: prof }, { data: userRes }] = await Promise.all([
      admin.from("profiles").select("full_name, lang").eq("id", userId).maybeSingle(),
      admin.auth.admin.getUserById(userId),
    ]);
    const lang: Lang = ["en", "fr", "sw"].includes(prof?.lang ?? "")
      ? (prof!.lang as Lang)
      : "en";
    return { email: userRes?.user?.email ?? null, lang };
  }

  /** Has this listing been booked by anyone? A declined request doesn't count. */
  async function hasLiveMatch(column: "parcel_id" | "trip_id", id: string) {
    const { count } = await admin
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq(column, id)
      .not("status", "in", '("declined","cancelled")');
    return (count ?? 0) > 0;
  }

  let sent = 0;

  // ---------------------------------------------------- parcels, deadline near
  const { data: parcelsSoon } = await admin
    .from("parcels")
    .select("id, user_id:sender_id, to_city, from_country, to_country, needed_by")
    .eq("status", "open")
    .is("nudged_soon_at", null)
    .gte("needed_by", today)
    .lte("needed_by", in3);

  for (const p of parcelsSoon ?? []) {
    if (await hasLiveMatch("parcel_id", p.id)) continue;
    const { email, lang } = await recipient(p.user_id);
    if (!email) continue;

    // How many travellers are just out of reach? That's the number that makes
    // "change the date" concrete rather than a platitude.
    const { count: alt } = await admin
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .eq("from_country", p.from_country)
      .eq("to_country", p.to_country)
      .gt("depart_date", p.needed_by);

    const L = T[lang];
    const ok = await sendEmail(
      email,
      L.parcelSoon(p.to_city, day(p.needed_by, lang)),
      shell(
        L.parcelSoon(p.to_city, day(p.needed_by, lang)),
        L.parcelSoonBody(day(p.needed_by, lang), alt ?? 0),
        L.editParcel,
        `${SITE}/post/parcel?edit=${p.id}`,
        lang
      )
    );
    if (ok) {
      await admin
        .from("parcels")
        .update({ nudged_soon_at: new Date().toISOString() })
        .eq("id", p.id);
      sent++;
    }
  }

  // ------------------------------------------------------ parcels, now expired
  const { data: parcelsGone } = await admin
    .from("parcels")
    .select("id, user_id:sender_id, to_city")
    .eq("status", "open")
    .is("nudged_expired_at", null)
    .lt("needed_by", today);

  for (const p of parcelsGone ?? []) {
    if (await hasLiveMatch("parcel_id", p.id)) continue;
    const { email, lang } = await recipient(p.user_id);
    if (!email) continue;
    const L = T[lang];
    const ok = await sendEmail(
      email,
      L.parcelGone(p.to_city),
      shell(
        L.parcelGone(p.to_city),
        L.parcelGoneBody,
        L.editParcel,
        `${SITE}/post/parcel?edit=${p.id}`,
        lang
      )
    );
    if (ok) {
      await admin
        .from("parcels")
        .update({ nudged_expired_at: new Date().toISOString() })
        .eq("id", p.id);
      sent++;
    }
  }

  // -------------------------------------------- trips leaving with empty space
  const { data: tripsSoon } = await admin
    .from("trips")
    .select("id, user_id:traveler_id, to_city, from_country, to_country, depart_date, remaining_kg")
    .eq("status", "open")
    .is("nudged_soon_at", null)
    .gte("depart_date", today)
    .lte("depart_date", in3)
    .gt("remaining_kg", 0);

  for (const tr of tripsSoon ?? []) {
    if (await hasLiveMatch("trip_id", tr.id)) continue;
    const { email, lang } = await recipient(tr.user_id);
    if (!email) continue;

    const { count: waiting } = await admin
      .from("parcels")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .eq("from_country", tr.from_country)
      .eq("to_country", tr.to_country)
      .gte("needed_by", tr.depart_date);

    const L = T[lang];
    const ok = await sendEmail(
      email,
      L.tripSoon(tr.to_city, day(tr.depart_date, lang)),
      shell(
        L.tripSoon(tr.to_city, day(tr.depart_date, lang)),
        L.tripSoonBody(tr.remaining_kg, waiting ?? 0),
        waiting ? L.browseParcels : L.editTrip,
        waiting ? `${SITE}/parcels` : `${SITE}/post/trip?edit=${tr.id}`,
        lang
      )
    );
    if (ok) {
      await admin
        .from("trips")
        .update({ nudged_soon_at: new Date().toISOString() })
        .eq("id", tr.id);
      sent++;
    }
  }

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
      )
    );
    if (ok) {
      await admin
        .from("memberships")
        .update({ trial_notified_at: new Date().toISOString() })
        .eq("user_id", m.user_id);
      sent++;
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
