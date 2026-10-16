// Didit webhook receiver. Deployed with --no-verify-jwt (Didit is not a
// Supabase user); authenticity is proven by the HMAC signature instead:
// X-Signature is HMAC-SHA256 of the exact raw request bytes with the webhook
// secret, and X-Timestamp must be within 5 minutes.
//
// On status.updated: Approved -> verifications.status='verified' and
// profiles.id_verified=true; Declined -> 'rejected'; In Review -> 'in_review'
// so the page can say a person is looking at it instead of implying the
// automatic check is still seconds away. Other interim statuses stay pending.

import { createClient } from "npm:@supabase/supabase-js@2";
import { logIncident } from "../_shared/incidents.ts";
import {
  applyIdentityDecision,
  identityStatus,
  fetchDecision,
} from "../_shared/didit.ts";

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

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-signature");
  const timestamp = req.headers.get("x-timestamp");

  if (!signature || !timestamp) {
    return new Response("Missing signature", { status: 401 });
  }
  if (!/^\d+$/.test(timestamp) || !Number.isFinite(Number(timestamp)) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return new Response("Stale timestamp", { status: 401 });
  }
  const expected = await hmacHex(Deno.env.get("DIDIT_WEBHOOK_SECRET")!, raw);
  if (!timingSafeEqual(expected, signature)) {
    await logIncident(
      "kyc_signature_invalid",
      "A Didit webhook failed signature verification",
      "severe"
    );
    return new Response("Invalid signature", { status: 401 });
  }

  let body: {
    webhook_type?: string;
    session_id?: string;
    status?: string;
    vendor_data?: string;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  if (body.webhook_type !== "status.updated" || !body.session_id) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const newStatus = identityStatus[body.status ?? ""];
  if (!newStatus) {
    // Interim status — nothing to change yet.
    return new Response(JSON.stringify({ ok: true, interim: body.status }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Read the provider's current decision, not an old retried webhook.
    const decision = await fetchDecision(body.session_id);
    if (!decision) return new Response("Verification temporarily unavailable", { status: 503 });
    const status = identityStatus[String(decision.status ?? "")];
    if (!status) return new Response(JSON.stringify({ ok: true, pending: true }), { status: 200 });
    const result = await applyIdentityDecision(admin, body.session_id, status, decision);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch {
    await logIncident("kyc_write_failed", "An identity decision could not be recorded", "severe", { session: body.session_id });
    return new Response("Could not record verification", { status: 503 });
  }
});
