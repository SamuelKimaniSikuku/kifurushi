// Creates a Stripe Checkout session (subscription mode) for the signed-in
// user. The Stripe secret key stays server-side; the client only receives
// the hosted checkout URL. The subscription carries user_id in its metadata
// so webhook events can always be mapped back to a profile.
//
// Deployed WITH JWT verification.

import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://www.kifurushiapp.com",
  "https://kifurushiapp.com",
  "http://localhost:3457",
  "http://localhost:3000",
];

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin":
      origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Not signed in" }, 401);

  let plan = "";
  try {
    plan = (await req.json()).plan;
  } catch { /* validated below */ }
  const price =
    plan === "monthly"
      ? Deno.env.get("STRIPE_PRICE_MONTHLY")
      : plan === "yearly"
        ? Deno.env.get("STRIPE_PRICE_YEARLY")
        : null;
  if (!price) return json({ error: "Invalid plan" }, 400);

  const callbackOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    success_url: `${callbackOrigin}/pricing?checkout=success`,
    cancel_url: `${callbackOrigin}/pricing?checkout=cancelled`,
    client_reference_id: user.id,
    "subscription_data[metadata][user_id]": user.id,
    allow_promotion_codes: "true",
  });
  if (user.email) params.set("customer_email", user.email);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!res.ok) {
    console.error("stripe checkout create failed", res.status, await res.text());
    return json({ error: "Billing provider unavailable" }, 502);
  }
  const session = await res.json();
  return json({ url: session.url });
});
