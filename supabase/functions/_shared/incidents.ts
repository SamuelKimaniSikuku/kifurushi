// One place for edge functions to say "this broke". Severe goes straight to
// Samuel's inbox via the incidents trigger; normal waits for the morning
// digest. Logging must never itself break the caller, so every failure here
// is swallowed after being printed.

import { createClient } from "npm:@supabase/supabase-js@2";

export type Severity = "severe" | "normal";

export async function logIncident(
  kind: string,
  summary: string,
  severity: Severity = "normal",
  detail?: unknown,
  userId?: string | null
): Promise<void> {
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await admin.rpc("log_incident", {
      p_kind: kind,
      p_summary: summary.slice(0, 300),
      p_severity: severity,
      p_detail: detail === undefined ? null : JSON.parse(JSON.stringify(detail)),
      p_user_id: userId ?? null,
    });
  } catch (e) {
    console.error("could not log incident", kind, e);
  }
}
