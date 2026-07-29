"use client";

// The review queue. Everything Didit escalated and our own rules couldn't
// settle lands here. The whole point is that a decision takes seconds: the
// reviewer sees who the person is, how long they've been a member and Didit's
// own objection, without opening a second dashboard.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, ShieldQuestion, X } from "lucide-react";
import { decideVerification, fetchReviewQueue, isAdmin, ReviewItem } from "@/lib/db";
import { fetchSession } from "@/lib/auth";
import Toast from "@/components/ui/Toast";

const ID_LABEL: Record<string, string> = {
  passport: "Passport",
  national_id: "National ID",
  drivers_licence: "Driver's licence",
};

function since(iso: string | null): string {
  if (!iso) return "unknown";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default function ReviewQueuePage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [busyId, setBusyId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<"success" | "error">("success");

  const load = useCallback(async () => {
    const rows = await fetchReviewQueue().catch(() => [] as ReviewItem[]);
    setItems(rows);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchSession().then(async (s) => {
      if (!mounted) return;
      if (!s) {
        router.replace("/auth?next=/admin/verifications");
        return;
      }
      const ok = await isAdmin();
      if (!mounted) return;
      setAllowed(ok);
      if (ok) await load();
    });
    return () => {
      mounted = false;
    };
  }, [router, load]);

  async function decide(item: ReviewItem, decision: "approve" | "decline") {
    setBusyId(item.id);
    try {
      const res = await decideVerification(item.id, decision, notes[item.id] ?? "");
      setItems((prev) => (prev ?? []).filter((i) => i.id !== item.id));
      setToastTone(res.mirroredToDidit ? "success" : "error");
      setToast(
        res.mirroredToDidit
          ? `${item.name} ${decision === "approve" ? "verified" : "declined"}.`
          : `${item.name} ${decision === "approve" ? "verified" : "declined"} here, but Didit rejected the update — its record still says In Review.`
      );
    } catch {
      setToastTone("error");
      setToast("Could not record that decision — it may already be resolved.");
      await load();
    } finally {
      setBusyId("");
    }
  }

  if (allowed === null) return null;

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-forest">
          Not your queue
        </h1>
        <p className="mt-2 text-sm text-muted">
          This page is for Kifurushi reviewers.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        Verification review
      </h1>
      <p className="mt-1 text-sm text-muted">
        Sessions Didit couldn&apos;t settle on its own. Duplicate accounts are
        already declined automatically — what&apos;s left needs a judgement.
      </p>

      {items === null ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
          Loading queue…
        </p>
      ) : items.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-bg text-success">
            <Check className="h-6 w-6" strokeWidth={2} aria-hidden />
          </div>
          <p className="mt-3 text-base font-semibold text-ink">Queue is empty</p>
          <p className="mt-1 text-sm text-muted">
            Nobody is waiting on a person right now.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-ink">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {ID_LABEL[item.idType] ?? item.idType} · submitted{" "}
                    {since(item.submittedAt)} · member {since(item.memberSince)}
                    {item.alreadyVerified && " · already has a badge"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-bg px-3 py-1 text-xs font-semibold text-warn">
                  <ShieldQuestion className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  In review
                </span>
              </div>

              {item.warnings.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {item.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink">
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0 text-warn"
                        strokeWidth={2}
                        aria-hidden
                      />
                      {w}
                    </li>
                  ))}
                </ul>
              )}

              <label htmlFor={`note-${item.id}`} className="field-label mt-4">
                Note (kept with the decision, at Didit too)
              </label>
              <input
                id={`note-${item.id}`}
                className="field"
                placeholder="Why you decided this way"
                value={notes[item.id] ?? ""}
                onChange={(e) =>
                  setNotes((p) => ({ ...p, [item.id]: e.target.value }))
                }
              />

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  className="btn-primary min-h-[44px] flex-1"
                  disabled={busyId === item.id}
                  onClick={() => decide(item, "approve")}
                >
                  {busyId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
                  ) : (
                    <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                  )}
                  Approve
                </button>
                <button
                  className="btn-ghost min-h-[44px] flex-1"
                  disabled={busyId === item.id}
                  onClick={() => decide(item, "decline")}
                >
                  <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {toast && (
        <Toast message={toast} tone={toastTone} onClose={() => setToast("")} />
      )}
    </div>
  );
}
