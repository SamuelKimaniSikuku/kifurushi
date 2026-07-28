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

function planFromPrice(priceId: string | undefined): "monthly" | "yearly" | null {
  if (!priceId) return null;
  if (priceId === Deno.env.get("STRIPE_PRICE_MONTHLY")) return "monthly";
  if (priceId === Deno.env.get("STRIPE_PRICE_YEARLY")) return "yearly";
  return null;
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
    const userId = session.client_reference_id;
    const subId = session.subscription;
    if (!userId || !subId) return respond({ ok: true, ignored: "no user/sub" });

    const sub = await fetchSubscription(subId);
    const plan = planFromPrice(sub.items?.data?.[0]?.price?.id);
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
    const plan = planFromPrice(sub.items?.data?.[0]?.price?.id);
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
