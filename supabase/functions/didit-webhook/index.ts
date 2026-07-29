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

// Terminal failure states also map to 'rejected' so the user can start over
// (the verify page shows the form again) instead of being stuck on pending.
const STATUS_MAP: Record<string, "verified" | "rejected" | "in_review"> = {
  Approved: "verified",
  Declined: "rejected",
  Expired: "rejected",
  "Kyc Expired": "rejected",
  Abandoned: "rejected",
  // Not terminal: a reviewer still has to decide, so we keep resolved_at null
  // and a later Approved/Declined for the same session overwrites this.
  "In Review": "in_review",
};

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
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) {
    return new Response("Stale timestamp", { status: 401 });
  }
  const expected = await hmacHex(Deno.env.get("DIDIT_WEBHOOK_SECRET")!, raw);
  if (!timingSafeEqual(expected, signature)) {
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

  const newStatus = STATUS_MAP[body.status ?? ""];
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

  const { data: updated, error } = await admin
    .from("verifications")
    .update({
      status: newStatus,
      resolved_at: newStatus === "in_review" ? null : new Date().toISOString(),
    })
    .eq("provider", "didit")
    .eq("provider_ref", body.session_id)
    .select("user_id");
  if (error) {
    console.error("verifications update failed", error);
    return new Response("DB error", { status: 500 });
  }

  // Flip the badge only for a session we actually created (row matched),
  // and only for the user that session belongs to.
  const userId = updated?.[0]?.user_id;
  if (newStatus === "verified" && userId) {
    const { error: pErr } = await admin
      .from("profiles")
      .update({ id_verified: true })
      .eq("id", userId);
    if (pErr) {
      console.error("profiles update failed", pErr);
      return new Response("DB error", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
