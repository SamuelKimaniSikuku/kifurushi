// Stripe webhook receiver — the only writer of paid memberships. Deployed
// with --no-verify-jwt; authenticity comes from the Stripe-Signature header
// (HMAC-SHA256 of "{t}.{raw body}" with the endpoint's signing secret,
// 5-minute tolerance, constant-time compare).
//
// checkout.session.completed        -> membership active (plan from price id)
// customer.subscription.updated     -> status/period kept in sync
// customer.subscription.deleted     -> status 'canceled'

import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyStripeSignature(
  raw: string,
  header: string | null,
  secret: string
): Promise<boolean> {
  if (!header) return false;
  const parts = new Map<string, string[]>();
  for (const kv of header.split(",")) {
    const [k, v] = kv.split("=", 2);
    if (!k || !v) continue;
    parts.set(k, [...(parts.get(k) ?? []), v]);
  }
  const t = parts.get("t")?.[0];
  const v1s = parts.get("v1") ?? [];
  if (!t || v1s.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - parseInt(t, 10)) > 300) return false;
  const expected = await hmacHex(secret, `${t}.${raw}`);
  return v1s.some((v1) => timingSafeEqual(expected, v1));
}

// Stripe subscription statuses -> memberships.status check constraint.
const SUB_STATUS_MAP: Record<string, "active" | "past_due" | "canceled"> = {
  active: "active",
  trialing: "active",
  past_due: "past_due",
  unpaid: "past_due",
  canceled: "canceled",
  incomplete: "past_due",
  incomplete_expired: "canceled",
  paused: "canceled",
};

// Plan comes from the price's billing interval, so prices created anywhere
// (API, dashboard, payment links) map correctly; configured ids are a
// fallback for prices without an expanded recurring object.
function planFromPrice(price: {
  id?: string;
  recurring?: { interval?: string };
} | undefined): "monthly" | "yearly" | null {
  const interval = price?.recurring?.interval;
  if (interval === "month") return "monthly";
  if (interval === "year") return "yearly";
  if (price?.id === Deno.env.get("STRIPE_PRICE_MONTHLY")) return "monthly";
  if (price?.id === Deno.env.get("STRIPE_PRICE_YEARLY")) return "yearly";
  return null;
}

// Branded payment confirmation via Resend, in the member's site language.
// Best-effort: a failed email must never fail the webhook (Stripe would
// retry and double-process).
type Lang = "en" | "fr" | "sw";

const MAIL: Record<Lang, {
  subject: string;
  heading: string;
  intro: string;
  planLabel: string;
  renewsLabel: string;
  monthly: string;
  yearly: string;
  body: string;
  button: string;
  footer: string;
}> = {
  en: {
    subject: "Your Kifurushi membership is active 🎉",
    heading: "Karibu — you're a member!",
    intro: "Your payment went through and your Kifurushi membership is active.",
    planLabel: "Plan",
    renewsLabel: "Renews",
    monthly: "Monthly — $5 / month",
    yearly: "Yearly — $29 / year",
    body: "You can now post trips and parcels, contact anyone on the platform, and keep 100% of what you earn as a traveller — Kifurushi takes no cut.",
    button: "Go to your dashboard",
    footer: "Billing is handled securely by Stripe. Questions? Just reply to this email or write to hello@kifurushiapp.com.",
  },
  fr: {
    subject: "Votre abonnement Kifurushi est actif 🎉",
    heading: "Karibu — vous êtes membre !",
    intro: "Votre paiement a bien été reçu et votre abonnement Kifurushi est actif.",
    planLabel: "Formule",
    renewsLabel: "Renouvellement",
    monthly: "Mensuelle — 5 $ / mois",
    yearly: "Annuelle — 29 $ / an",
    body: "Vous pouvez maintenant publier des voyages et des colis, contacter tout le monde sur la plateforme, et garder 100 % de ce que vous gagnez en voyageant — Kifurushi ne prend aucune commission.",
    button: "Accéder à votre tableau de bord",
    footer: "La facturation est gérée en toute sécurité par Stripe. Des questions ? Répondez à cet e-mail ou écrivez à hello@kifurushiapp.com.",
  },
  sw: {
    subject: "Uanachama wako wa Kifurushi umewashwa 🎉",
    heading: "Karibu — wewe ni mwanachama!",
    intro: "Malipo yako yamefanikiwa na uanachama wako wa Kifurushi umewashwa.",
    planLabel: "Mpango",
    renewsLabel: "Unajirudia",
    monthly: "Kila mwezi — $5 / mwezi",
    yearly: "Kila mwaka — $29 / mwaka",
    body: "Sasa unaweza kutangaza safari na vifurushi, kuwasiliana na yeyote kwenye jukwaa, na kubaki na 100% ya unachopata ukiwa msafiri — Kifurushi haichukui chochote.",
    button: "Nenda kwenye dashibodi yako",
    footer: "Malipo yanasimamiwa salama na Stripe. Maswali? Jibu barua pepe hii au andika kwa hello@kifurushiapp.com.",
  },
};

const MAIL_LOCALE: Record<Lang, string> = { en: "en-GB", fr: "fr-FR", sw: "sw-KE" };

async function sendConfirmationEmail(
  to: string,
  plan: "monthly" | "yearly",
  periodEndIso: string,
  lang: Lang
) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return;
  const L = MAIL[lang];
  const renews = new Date(periodEndIso).toLocaleDateString(MAIL_LOCALE[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
        subject: L.subject,
        html: `
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c2321">
  <div style="background:#0B3B2E;border-radius:16px;padding:28px;color:#fff">
    <h1 style="margin:0;font-size:22px">${L.heading}</h1>
    <p style="margin:12px 0 0;opacity:.85;font-size:14px;line-height:1.6">
      ${L.intro}
    </p>
  </div>
  <table style="width:100%;margin:20px 0;font-size:14px;border-collapse:collapse">
    <tr><td style="padding:8px 0;color:#5c6662">${L.planLabel}</td><td style="text-align:right;font-weight:600">${plan === "monthly" ? L.monthly : L.yearly}</td></tr>
    <tr><td style="padding:8px 0;color:#5c6662">${L.renewsLabel}</td><td style="text-align:right;font-weight:600">${renews}</td></tr>
  </table>
  <p style="font-size:14px;line-height:1.6">${L.body}</p>
  <a href="https://www.kifurushiapp.com/dashboard"
     style="display:inline-block;background:#E85D26;color:#fff;text-decoration:none;font-weight:600;border-radius:12px;padding:12px 22px;font-size:14px">
    ${L.button}
  </a>
  <p style="margin-top:24px;font-size:12px;color:#8a938f">${L.footer}</p>
</div>`,
      }),
    });
  } catch (e) {
    console.error("confirmation email failed", e);
  }
}

// current_period_end lives on the subscription in older API versions and on
// the subscription item in newer ones — accept either.
function periodEnd(sub: any): string | null {
  const unix = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end;
  return unix ? new Date(unix * 1000).toISOString() : null;
}

async function fetchSubscription(id: string) {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")}` },
  });
  if (!res.ok) throw new Error(`subscription fetch ${res.status}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const raw = await req.text();
  const ok = await verifyStripeSignature(
    raw,
    req.headers.get("stripe-signature"),
    Deno.env.get("STRIPE_WEBHOOK_SECRET")!
  );
  if (!ok) return new Response("Invalid signature", { status: 401 });

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const respond = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const subId = session.subscription;
    let userId = session.client_reference_id;
    // Payment-link purchases carry no user id — fall back to matching the
    // payer's email against the auth users (service-role-only lookup).
    if (!userId) {
      const email = session.customer_details?.email ?? session.customer_email;
      if (email) {
        const { data } = await admin.rpc("user_id_by_email", { p_email: email });
        userId = data ?? null;
      }
    }
    if (!userId || !subId) {
      console.error("unattributable checkout session", session.id);
      return respond({ ok: true, ignored: "no user/sub" });
    }

    const sub = await fetchSubscription(subId);
    const plan = planFromPrice(sub.items?.data?.[0]?.price);
    const end = periodEnd(sub);
    if (!plan || !end) {
      console.error("unmappable subscription", subId);
      return respond({ ok: true, ignored: "unmappable" });
    }
    const { error } = await admin.from("memberships").upsert({
      user_id: userId,
      status: "active",
      plan,
      provider: "stripe",
      provider_ref: subId,
      current_period_end: end,
    });
    if (error) {
      console.error("membership upsert failed", error);
      return new Response("DB error", { status: 500 });
    }

    const payerEmail =
      session.customer_details?.email ?? session.customer_email;
    if (payerEmail) {
      const { data: prof } = await admin
        .from("profiles")
        .select("lang")
        .eq("id", userId)
        .maybeSingle();
      const lang: Lang = ["en", "fr", "sw"].includes(prof?.lang ?? "")
        ? (prof!.lang as Lang)
        : "en";
      await sendConfirmationEmail(payerEmail, plan, end, lang);
    }

    return respond({ ok: true });
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object;
    const userId = sub.metadata?.user_id;
    const status =
      event.type === "customer.subscription.deleted"
        ? "canceled"
        : SUB_STATUS_MAP[sub.status] ?? "canceled";
    const plan = planFromPrice(sub.items?.data?.[0]?.price);
    const end = periodEnd(sub);

    const patch: Record<string, unknown> = { status, provider: "stripe", provider_ref: sub.id };
    if (plan) patch.plan = plan;
    if (end) patch.current_period_end = end;

    // Prefer the user_id we stamped at checkout; fall back to the sub ref.
    const query = admin.from("memberships").update(patch);
    const { error } = userId
      ? await query.eq("user_id", userId)
      : await query.eq("provider", "stripe").eq("provider_ref", sub.id);
    if (error) {
      console.error("membership update failed", error);
      return new Response("DB error", { status: 500 });
    }
    return respond({ ok: true });
  }

  return respond({ ok: true, ignored: event.type });
});
