// The moment a listing is posted, tell the people it fits — immediately, not
// in tomorrow's digest. A sender's parcel goes to every traveller whose open
// trip can carry it; a traveller's new trip goes to every sender whose open
// parcel it could take. This is the promise the post-parcel form has made
// since day one ("travellers on your route get notified") finally kept.
//
// Invoked by database triggers on parcels/trips INSERT, gated by the shared
// alert hook secret.

import { createClient } from "npm:@supabase/supabase-js@2";
import { logIncident } from "../_shared/incidents.ts";

const SITE = "https://www.kifurushiapp.com";
const MAX_RECIPIENTS = 30;
type Lang = "en" | "fr" | "sw";

const T: Record<
  Lang,
  {
    parcelSubject: (from: string, to: string) => string;
    parcelBody: (c: {
      sender: string; from: string; to: string; kg: number;
      budget: number; needed: string; tripDate: string;
    }) => string;
    tripSubject: (from: string, to: string) => string;
    tripBody: (c: {
      traveler: string; from: string; to: string; kg: number;
      price: number; depart: string;
    }) => string;
    seeParcels: string;
    seeTravellers: string;
    footer: string;
  }
> = {
  en: {
    parcelSubject: (from, to) => `New parcel on your route: ${from} → ${to} 📦`,
    parcelBody: (c) =>
      `<b>${c.sender}</b> just posted a parcel on <b>${c.from} → ${c.to}</b>: ` +
      `${c.kg} kg, budget $${c.budget}, needed by ${c.needed}. ` +
      `Your trip on ${c.tripDate} fits — offer to carry it before someone else does.`,
    tripSubject: (from, to) => `A traveller just posted your route: ${from} → ${to} ✈️`,
    tripBody: (c) =>
      `<b>${c.traveler}</b> is flying <b>${c.from} → ${c.to}</b> on ${c.depart} ` +
      `with ${c.kg} kg free at $${c.price}/kg. Your open parcel fits — request them now.`,
    seeParcels: "See the parcel",
    seeTravellers: "Request this traveller",
    footer: "You get this because you have an open listing on this route.",
  },
  fr: {
    parcelSubject: (from, to) => `Nouveau colis sur votre itinéraire : ${from} → ${to} 📦`,
    parcelBody: (c) =>
      `<b>${c.sender}</b> vient de publier un colis sur <b>${c.from} → ${c.to}</b> : ` +
      `${c.kg} kg, budget ${c.budget} $, requis avant le ${c.needed}. ` +
      `Votre voyage du ${c.tripDate} correspond — proposez de le transporter avant quelqu'un d'autre.`,
    tripSubject: (from, to) => `Un voyageur vient de publier votre itinéraire : ${from} → ${to} ✈️`,
    tripBody: (c) =>
      `<b>${c.traveler}</b> part de <b>${c.from} → ${c.to}</b> le ${c.depart} ` +
      `avec ${c.kg} kg libres à ${c.price} $/kg. Votre colis correspond — sollicitez-le maintenant.`,
    seeParcels: "Voir le colis",
    seeTravellers: "Solliciter ce voyageur",
    footer: "Vous recevez ceci car vous avez une annonce ouverte sur cet itinéraire.",
  },
  sw: {
    parcelSubject: (from, to) => `Kifurushi kipya kwenye njia yako: ${from} → ${to} 📦`,
    parcelBody: (c) =>
      `<b>${c.sender}</b> ametangaza kifurushi kwenye <b>${c.from} → ${c.to}</b>: ` +
      `kg ${c.kg}, bajeti $${c.budget}, kinahitajika kabla ya ${c.needed}. ` +
      `Safari yako ya ${c.tripDate} inafaa — jitolee kukibeba kabla ya mtu mwingine.`,
    tripSubject: (from, to) => `Msafiri ametangaza njia yako: ${from} → ${to} ✈️`,
    tripBody: (c) =>
      `<b>${c.traveler}</b> anasafiri <b>${c.from} → ${c.to}</b> tarehe ${c.depart} ` +
      `akiwa na kg ${c.kg} wazi kwa $${c.price}/kg. Kifurushi chako kinafaa — mwombe sasa.`,
    seeParcels: "Ona kifurushi",
    seeTravellers: "Omba msafiri huyu",
    footer: "Unapata hii kwa sababu una tangazo wazi kwenye njia hii.",
  },
};

function shell(heading: string, body: string, cta: string, href: string, footer: string) {
  return `
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c2321">
  <div style="background:#0B3B2E;border-radius:16px;padding:28px;color:#fff">
    <h1 style="margin:0;font-size:22px">${heading}</h1>
  </div>
  <div style="font-size:14px;line-height:1.7;margin:20px 0">${body}</div>
  <a href="${href}" style="display:inline-block;background:#E85D26;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600">${cta}</a>
  <p style="font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:24px">${footer}</p>
</div>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<"sent" | "skipped" | "failed"> {
  // Test-run guard, same convention as every other sender.
  if (/\+test/i.test(to)) {
    console.log("skipping test-alias recipient", to);
    return "skipped";
  }
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return "failed";
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
      `Resend rejected a new-listing alert (${res.status})`,
      "severe",
      { subject, detail: detail.slice(0, 400) }
    );
    return "failed";
  }
  return "sent";
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

  let body: { kind?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad payload", { status: 400 });
  }
  if (!body.id || (body.kind !== "parcel" && body.kind !== "trip")) {
    return new Response("Bad payload", { status: 400 });
  }

  async function recipient(userId: string) {
    const [{ data: prof }, { data: userRes }] = await Promise.all([
      admin.from("profiles").select("full_name, lang").eq("id", userId).maybeSingle(),
      admin.auth.admin.getUserById(userId),
    ]);
    const lang: Lang = ["en", "fr", "sw"].includes(prof?.lang ?? "")
      ? (prof!.lang as Lang)
      : "en";
    return { email: userRes?.user?.email ?? null, lang, name: prof?.full_name ?? "A member" };
  }

  const today = new Date().toISOString().slice(0, 10);
  let sent = 0, skipped = 0;

  if (body.kind === "parcel") {
    const { data: p } = await admin
      .from("parcels")
      .select("id, sender_id, from_country, from_city, to_country, to_city, needed_by, weight_kg, budget_usd, profile:profiles!parcels_sender_id_fkey(full_name)")
      .eq("id", body.id)
      .maybeSingle();
    if (!p) return new Response("Not found", { status: 404 });

    const { data: trips } = await admin
      .from("trips")
      .select("traveler_id, depart_date")
      .eq("status", "open")
      .eq("from_country", p.from_country)
      .eq("to_country", p.to_country)
      .gte("depart_date", today)
      .lte("depart_date", p.needed_by)
      .gte("remaining_kg", p.weight_kg)
      .neq("traveler_id", p.sender_id)
      .order("depart_date", { ascending: true })
      .limit(MAX_RECIPIENTS);

    // One email per traveller, their soonest fitting trip named.
    const byTraveler = new Map<string, string>();
    for (const t of trips ?? []) {
      if (!byTraveler.has(t.traveler_id)) byTraveler.set(t.traveler_id, t.depart_date);
    }

    const senderName =
      (p.profile as { full_name?: string } | null)?.full_name ?? "A member";
    for (const [travelerId, tripDate] of byTraveler) {
      const r = await recipient(travelerId);
      if (!r.email) continue;
      const L = T[r.lang];
      const result = await sendEmail(
        r.email,
        L.parcelSubject(p.from_city, p.to_city),
        shell(
          L.parcelSubject(p.from_city, p.to_city),
          L.parcelBody({
            sender: senderName,
            from: p.from_city,
            to: p.to_city,
            kg: Number(p.weight_kg),
            budget: Math.round(Number(p.budget_usd)),
            needed: day(p.needed_by, r.lang),
            tripDate: day(tripDate, r.lang),
          }),
          L.seeParcels,
          `${SITE}/parcels`,
          L.footer
        )
      );
      if (result === "sent") sent++;
      if (result === "skipped") skipped++;
    }
  } else {
    const { data: t } = await admin
      .from("trips")
      .select("id, traveler_id, from_country, from_city, to_country, to_city, depart_date, remaining_kg, price_per_kg, profile:profiles!trips_traveler_id_fkey(full_name)")
      .eq("id", body.id)
      .maybeSingle();
    if (!t) return new Response("Not found", { status: 404 });

    const { data: parcels } = await admin
      .from("parcels")
      .select("sender_id")
      .eq("status", "open")
      .eq("from_country", t.from_country)
      .eq("to_country", t.to_country)
      .gte("needed_by", t.depart_date)
      .lte("weight_kg", t.remaining_kg)
      .neq("sender_id", t.traveler_id)
      .limit(MAX_RECIPIENTS);

    const travelerName =
      (t.profile as { full_name?: string } | null)?.full_name ?? "A member";
    const seen = new Set<string>();
    for (const p of parcels ?? []) {
      if (seen.has(p.sender_id)) continue;
      seen.add(p.sender_id);
      const r = await recipient(p.sender_id);
      if (!r.email) continue;
      const L = T[r.lang];
      const result = await sendEmail(
        r.email,
        L.tripSubject(t.from_city, t.to_city),
        shell(
          L.tripSubject(t.from_city, t.to_city),
          L.tripBody({
            traveler: travelerName,
            from: t.from_city,
            to: t.to_city,
            kg: Number(t.remaining_kg),
            price: Number(t.price_per_kg),
            depart: day(t.depart_date, r.lang),
          }),
          L.seeTravellers,
          `${SITE}/trips`,
          L.footer
        )
      );
      if (result === "sent") sent++;
      if (result === "skipped") skipped++;
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, skipped }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
