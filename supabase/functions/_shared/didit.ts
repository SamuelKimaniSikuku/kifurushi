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
    console.error("didit decision fetch failed", res.status, await res.text());
    return null;
  }
  return await res.json();
}

/**
 * The session id of an already-approved session wearing the same face, if
 * Didit flagged one. Didit reports this as a LIVENESS warning rather than a
 * failure, because on its own a repeat face is not proof of anything — it's
 * only meaningful once you check whose account the other session belongs to.
 */
export function duplicateOfSession(
  decision: Record<string, unknown> | null
): string | null {
  if (!decision) return null;
  for (const feature of ["liveness", "face_match", "id_verification"]) {
    const block = decision[feature] as { warnings?: unknown[] } | undefined;
    for (const w of block?.warnings ?? []) {
      const warn = w as {
        risk?: string;
        additional_data?: { duplicated_session_id?: string };
      };
      if (warn.risk === "DUPLICATED_FACE") {
        return warn.additional_data?.duplicated_session_id ?? null;
      }
    }
  }
  return null;
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
