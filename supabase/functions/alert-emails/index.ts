// Operational alerts for Kifurushi. Invoked by the database, never by a
// browser: an incident trigger fires it for anything severe, and pg_cron
// fires it once a morning for the digest. Guarded by the same shared hook
// secret as the delivery emails.
//
// The digest sends even when nothing is wrong. A monitor that only speaks up
// on bad days is indistinguishable from a monitor that has quietly died, and
// the whole point is to know without having to check.

import { createClient } from "npm:@supabase/supabase-js@2";

const TO = ["samuel.kimani.sikuku@gmail.com", "hello@kifurushiapp.com"];
const SITE = "https://www.kifurushiapp.com";

async function sendEmail(subject: string, html: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Kifurushi alerts <hello@kifurushiapp.com>",
      to: TO,
      subject,
      html,
    }),
  });
  if (!res.ok) console.error("alert email failed", res.status, await res.text());
  return res.ok;
}

function shell(heading: string, tone: string, body: string): string {
  return `
<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c2321">
  <div style="background:${tone};border-radius:16px;padding:24px;color:#fff">
    <h1 style="margin:0;font-size:20px">${heading}</h1>
  </div>
  <div style="font-size:14px;line-height:1.7;margin:20px 0">${body}</div>
  <p style="font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px">
    Automatic message from Kifurushi. <a href="${SITE}/dashboard">Dashboard</a>
  </p>
</div>`;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function row(label: string, value: string): string {
  return `<p style="margin:6px 0"><b>${esc(label)}:</b> ${esc(value)}</p>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (req.headers.get("x-hook-secret") !== Deno.env.get("ALERT_HOOK_SECRET")) {
    return new Response("Forbidden", { status: 403 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: { mode?: string; incident_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  // ------------------------------------------------------------- instant
  if (body.mode === "instant" && body.incident_id) {
    const { data: inc } = await admin
      .from("incidents")
      .select("kind, summary, detail, user_id, created_at")
      .eq("id", body.incident_id)
      .maybeSingle();
    if (!inc) return new Response("Not found", { status: 404 });

    const sent = await sendEmail(
      `Kifurushi: ${inc.summary}`,
      shell(
        "Something broke",
        "#B3261E",
        row("What", inc.summary) +
          row("Kind", inc.kind) +
          row("When", new Date(inc.created_at).toUTCString()) +
          (inc.user_id ? row("Member", inc.user_id) : "") +
          (inc.detail
            ? `<pre style="background:#f5f5f4;padding:12px;border-radius:8px;font-size:12px;white-space:pre-wrap">${esc(
                JSON.stringify(inc.detail, null, 2)
              )}</pre>`
            : "")
      )
    );
    if (sent) {
      await admin
        .from("incidents")
        .update({ alerted_at: new Date().toISOString() })
        .eq("id", body.incident_id);
    }
    return new Response(JSON.stringify({ ok: sent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // -------------------------------------------------------------- digest
  if (body.mode !== "digest") return new Response("Unknown mode", { status: 400 });

  const now = Date.now();
  const dayAgo = new Date(now - 86_400_000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const { data: incidents } = await admin
    .from("incidents")
    .select("id, kind, severity, source, summary, created_at")
    .is("digested_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  // Things that aren't errors but are stuck — the delays worth chasing.
  // Each is phrased as "who is waiting on what", because that's the thing
  // you'd act on.
  const [reviewQueue, unanswered, overdue, quiet] = await Promise.all([
    admin
      .from("verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_review")
      .lt("created_at", dayAgo),
    admin
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("status", "requested")
      .lt("created_at", new Date(now - 2 * 86_400_000).toISOString()),
    admin
      .from("matches")
      .select("id", { count: "exact", head: true })
      .in("status", ["accepted", "picked_up", "in_transit"])
      .lt("updated_at", new Date(now - 7 * 86_400_000).toISOString()),
    admin
      .from("trips")
      .select("id", { count: "exact", head: true })
      .lt("depart_date", today)
      .gt("remaining_kg", 0),
  ]);

  const stuck: string[] = [];
  if (reviewQueue.count)
    stuck.push(
      `${reviewQueue.count} verification(s) waiting on a person for over a day — <a href="${SITE}/admin/verifications">review queue</a>`
    );
  if (unanswered.count)
    stuck.push(`${unanswered.count} match request(s) unanswered for over 2 days`);
  if (overdue.count)
    stuck.push(`${overdue.count} delivery(ies) with no movement for a week`);
  if (quiet.count)
    stuck.push(`${quiet.count} trip(s) whose departure has passed but still show free space`);

  const list = (incidents ?? [])
    .map(
      (i) =>
        `<li style="margin-bottom:6px">${
          i.severity === "severe" ? "🔴 " : ""
        }<b>${esc(i.summary)}</b><br><span style="color:#6b7280;font-size:12px">${esc(
          i.kind
        )} · ${esc(i.source)} · ${new Date(i.created_at).toUTCString()}</span></li>`
    )
    .join("");

  const healthy = (incidents ?? []).length === 0 && stuck.length === 0;

  const html = shell(
    healthy ? "All clear" : "Daily check",
    healthy ? "#0B3B2E" : "#B8860B",
    (healthy
      ? "<p>Nothing failed and nothing is stuck in the last 24 hours.</p>"
      : "") +
      (stuck.length
        ? `<h2 style="font-size:16px;margin:18px 0 6px">Waiting on someone</h2><ul>${stuck
            .map((s) => `<li style="margin-bottom:6px">${s}</li>`)
            .join("")}</ul>`
        : "") +
      (list
        ? `<h2 style="font-size:16px;margin:18px 0 6px">Failures (${
            (incidents ?? []).length
          })</h2><ul>${list}</ul>`
        : "")
  );

  const sent = await sendEmail(
    healthy ? "Kifurushi: all clear" : "Kifurushi: daily check",
    html
  );

  if (sent && incidents?.length) {
    await admin
      .from("incidents")
      .update({ digested_at: new Date().toISOString() })
      .in(
        "id",
        incidents.map((i) => i.id)
      );
  }

  return new Response(
    JSON.stringify({ ok: sent, incidents: incidents?.length ?? 0, stuck: stuck.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
