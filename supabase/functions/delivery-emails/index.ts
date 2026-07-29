// Emails both parties when a delivery is released (receiver's code entered).
// Invoked by the matches_notify_released DB trigger via pg_net; the shared
// secret header keeps strangers out. Deployed with --no-verify-jwt.

import { createClient } from "npm:@supabase/supabase-js@2";

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
    console.error("delivery email failed", e);
  }
}

type Lang = "en" | "fr" | "sw";

const T: Record<Lang, {
  senderSubject: string;
  travelerSubject: string;
  heading: string;
  senderBody: (route: string, name: string) => string;
  travelerBody: (route: string, name: string) => string;
  button: string;
  footer: string;
}> = {
  en: {
    senderSubject: "Your parcel was delivered ✅",
    travelerSubject: "Delivery confirmed — asante! ✅",
    heading: "Delivery confirmed!",
    senderBody: (route, name) =>
      `Your parcel on <b>${route}</b> was handed over and the receiver confirmed it with the delivery code. The delivery record with ${name} is now complete — leave a review to help the next sender.`,
    travelerBody: (route, name) =>
      `The receiver confirmed your delivery on <b>${route}</b> with the code — the record with ${name} is complete and your delivery count just went up. Leave a review to build your reputation.`,
    button: "Open your dashboard",
    footer:
      "Kifurushi connects senders and travellers — every delivery is a direct agreement between the two of you.",
  },
  fr: {
    senderSubject: "Votre colis a été livré ✅",
    travelerSubject: "Livraison confirmée — merci ! ✅",
    heading: "Livraison confirmée !",
    senderBody: (route, name) =>
      `Votre colis sur <b>${route}</b> a été remis et le destinataire l'a confirmé avec le code de livraison. Le dossier avec ${name} est maintenant complet — laissez un avis pour aider le prochain expéditeur.`,
    travelerBody: (route, name) =>
      `Le destinataire a confirmé votre livraison sur <b>${route}</b> avec le code — le dossier avec ${name} est complet et votre compteur de livraisons vient d'augmenter. Laissez un avis pour bâtir votre réputation.`,
    button: "Ouvrir votre tableau de bord",
    footer:
      "Kifurushi met en relation expéditeurs et voyageurs — chaque livraison est un accord direct entre vous deux.",
  },
  sw: {
    senderSubject: "Kifurushi chako kimefikishwa ✅",
    travelerSubject: "Uwasilishaji umethibitishwa — asante! ✅",
    heading: "Uwasilishaji umethibitishwa!",
    senderBody: (route, name) =>
      `Kifurushi chako cha <b>${route}</b> kimekabidhiwa na mpokeaji amethibitisha kwa msimbo. Rekodi na ${name} sasa imekamilika — acha tathmini kusaidia mtumaji ajaye.`,
    travelerBody: (route, name) =>
      `Mpokeaji amethibitisha uwasilishaji wako wa <b>${route}</b> kwa msimbo — rekodi na ${name} imekamilika na idadi yako ya usafirishaji imeongezeka. Acha tathmini kujenga sifa yako.`,
    button: "Fungua dashibodi yako",
    footer:
      "Kifurushi inaunganisha watumaji na wasafiri — kila usafirishaji ni makubaliano ya moja kwa moja kati yenu wawili.",
  },
};

function emailShell(heading: string, body: string, lang: Lang): string {
  return `
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c2321">
  <div style="background:#0B3B2E;border-radius:16px;padding:28px;color:#fff">
    <h1 style="margin:0;font-size:22px">${heading}</h1>
  </div>
  <div style="font-size:14px;line-height:1.7;margin:20px 0">${body}</div>
  <a href="https://www.kifurushiapp.com/dashboard"
     style="display:inline-block;background:#E85D26;color:#fff;text-decoration:none;font-weight:600;border-radius:12px;padding:12px 22px;font-size:14px">
    ${T[lang].button}
  </a>
  <p style="margin-top:24px;font-size:12px;color:#8a938f">
    ${T[lang].footer}
  </p>
</div>`;
}

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
  try {
    matchId = (await req.json()).match_id;
  } catch {
    return new Response("Bad payload", { status: 400 });
  }
  if (!matchId) return new Response("Bad payload", { status: 400 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: match, error } = await admin
    .from("matches")
    .select(
      `id, status,
       trip:trips!matches_trip_id_fkey(from_city, to_city, traveler_id),
       parcel:parcels!matches_parcel_id_fkey(sender_id)`
    )
    .eq("id", matchId)
    .maybeSingle();
  if (error || !match || match.status !== "released") {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const trip = match.trip as unknown as {
    from_city: string;
    to_city: string;
    traveler_id: string;
  } | null;
  const parcel = match.parcel as unknown as { sender_id: string } | null;
  const route = trip ? `${trip.from_city} → ${trip.to_city}` : "your route";

  async function nameAndEmail(uid: string) {
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

  const [traveler, sender] = await Promise.all([
    trip ? nameAndEmail(trip.traveler_id) : Promise.resolve(null),
    parcel ? nameAndEmail(parcel.sender_id) : Promise.resolve(null),
  ]);

  const jobs: Promise<void>[] = [];
  if (sender?.email) {
    const L = T[sender.lang];
    jobs.push(
      sendEmail(
        sender.email,
        L.senderSubject,
        emailShell(
          L.heading,
          L.senderBody(route, traveler?.name ?? "your traveller"),
          sender.lang
        )
      )
    );
  }
  if (traveler?.email) {
    const L = T[traveler.lang];
    jobs.push(
      sendEmail(
        traveler.email,
        L.travelerSubject,
        emailShell(
          L.heading,
          L.travelerBody(route, sender?.name ?? "your sender"),
          traveler.lang
        )
      )
    );
  }
  await Promise.all(jobs);

  return new Response(JSON.stringify({ ok: true, emailed: jobs.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
