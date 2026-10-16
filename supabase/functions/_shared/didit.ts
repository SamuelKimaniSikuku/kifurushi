// Shared Didit API calls. Used by the webhook (to auto-decide duplicates) and
// by the review queue (to record a human's decision back at the provider).

const API = "https://verification.didit.me";

function key(): string {
  return Deno.env.get("DIDIT_API_KEY")!;
}

/** Full decision payload for a session, including per-feature warnings. */
export async function fetchDecision(
  sessionId: string
): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${API}/v2/session/${sessionId}/decision/`, {
    headers: { "x-api-key": key() },
  });
  if (!res.ok) {
    console.error("didit decision fetch failed", res.status);
    return null;
  }
  return await res.json();
}

/** Read both v2 feature blocks and v3 feature arrays. Unknown duplicate
 * shapes fail closed for review instead of silently approving an account. */
export function identitySignals(decision: Record<string, unknown>) {
  const sessions = new Set<string>();
  let duplicate = false;
  function walk(value: unknown, depth = 0) {
    if (!value || typeof value !== "object" || depth > 12) return;
    if (Array.isArray(value)) { value.forEach(v => walk(v, depth + 1)); return; }
    const obj = value as Record<string, unknown>;
    const code = `${obj.risk ?? ""} ${obj.code ?? ""}`;
    if (/DUPLICAT.*(FACE|DOCUMENT|ID)|(?:FACE|DOCUMENT).*DUPLICAT/i.test(code)) {
      duplicate = true;
      const collect = (v: unknown) => {
        if (typeof v === "string" && v.length > 0 && v.length < 200) sessions.add(v);
        else if (Array.isArray(v)) v.forEach(collect);
      };
      const extra = obj.additional_data as Record<string, unknown> | undefined;
      collect(extra?.duplicated_session_id);
      collect(extra?.duplicated_session_ids);
    }
    Object.values(obj).forEach(v => walk(v, depth + 1));
  }
  walk(decision);
  const ids = Array.isArray(decision.id_verifications) ? decision.id_verifications : [decision.id_verification];
  const id = ids.find(v => v && typeof v === "object") as Record<string, unknown> | undefined;
  const normalize = (v: unknown) => typeof v === "string" ? v.toUpperCase().replace(/[\s-]/g, "") : "";
  const issuer = normalize(id?.issuing_state);
  const type = normalize(id?.document_type);
  const number = normalize(id?.document_number);
  // Only the database stores a salted fingerprint. The original number is
  // neither stored in Kifurushi tables nor written to our logs.
  const document = issuer && type && number ? JSON.stringify([issuer, type, number]) : null;
  return { sessions: [...sessions], duplicate, document };
}

export const identityStatus: Record<string, "verified" | "rejected" | "in_review"> = {
  Approved: "verified", Declined: "rejected", Expired: "rejected",
  "Kyc Expired": "rejected", Abandoned: "rejected", "In Review": "in_review",
};

export async function applyIdentityDecision(
  admin: { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> },
  session: string, status: string, decision: Record<string, unknown>, actor: string | null = null, note = ""
): Promise<{ status: string; reason: string | null }> {
  const signals = identitySignals(decision);
  const { data, error } = await admin.rpc("apply_identity_decision", {
    p_session: session, p_status: status, p_duplicate_sessions: signals.sessions,
    p_duplicate_flag: signals.duplicate, p_document: signals.document,
    p_actor: actor, p_note: note,
  });
  if (error) throw new Error(error.message);
  return data as { status: string; reason: string | null };
}

/**
 * Record a decision at Didit so its records match ours. Note this is v3 —
 * the decision endpoint above is v2.
 *
 * Didit answers this by firing a status.updated webhook back at us, which
 * re-applies the same status. That's idempotent, not a loop: the webhook only
 * ever calls this function for sessions arriving as "In Review", and what we
 * send back is always terminal.
 */
export async function updateSessionStatus(
  sessionId: string,
  status: "Approved" | "Declined",
  comment: string
): Promise<{ ok: boolean; detail?: string }> {
  const res = await fetch(`${API}/v3/session/${sessionId}/update-status/`, {
    method: "PATCH",
    headers: { "x-api-key": key(), "Content-Type": "application/json" },
    body: JSON.stringify({ new_status: status, comment }),
  });
  if (res.ok) return { ok: true };
  const detail = await res.text();
  console.error("didit update-status failed", res.status, detail);
  return { ok: false, detail: `${res.status} ${detail}` };
}
