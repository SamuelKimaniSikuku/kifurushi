"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { trustCopy } from "@/lib/locales/trust";
import { receiptCopy } from "@/lib/locales/receipt";
import type { MatchDetail } from "@/lib/db";
import { DeliveryReportState, fetchDeliveryReport, reportDeliveryDetails, saveReceipt, type ReceiptOutcome } from "@/lib/trust";
import EvidencePhotos from "./EvidencePhotos";

export default function DeliveryProblem({ match, handover, onHold, onChanged }: { match: MatchDetail; handover: boolean; onHold: (held: boolean) => void; onChanged: () => void }) {
 const { lang } = useLang(); const t = trustCopy[lang], s = receiptCopy[lang];
 const [state, setState] = useState<DeliveryReportState | null>(null);
 const [open, setOpen] = useState(false), [receipt, setReceipt] = useState<ReceiptOutcome | null>(null);
 const [reason, setReason] = useState("not_received"), [details, setDetails] = useState(""), [weight, setWeight] = useState("");
 const [photos, setPhotos] = useState<string[]>([]), [uploading, setUploading] = useState(false);
 const [busy, setBusy] = useState(false), [error, setError] = useState(""), [loadError, setLoadError] = useState(false), [editing, setEditing] = useState(false);
 const load = useCallback(async () => { try { const v = await fetchDeliveryReport(match.id); setState(v); onHold(v.on_hold); setLoadError(false); } catch { setLoadError(true); } }, [match.id, onHold]);
 useEffect(() => { void load(); const id = setInterval(() => { if(document.visibilityState === "visible") void load(); }, 30000); return () => clearInterval(id); }, [load]);
 async function submit(e: React.FormEvent) {
  e.preventDefault(); if(busy || uploading) return;
  if(receipt !== "received" && details.trim().length < 10) { setError(t.short); return; }
  setBusy(true); setError("");
  try {
   const kg = weight.trim() ? Number(weight) : null;
   if(receipt) await saveReceipt(match.id, receipt, details, photos, kg);
   else await reportDeliveryDetails(match.id, reason, details, photos, kg);
   setOpen(false); setReceipt(null); setEditing(false); setDetails(""); setPhotos([]); setWeight("");
   await load(); onChanged();
  } catch { setError(s.failed); } finally { setBusy(false); }
 }
 function choose(outcome: ReceiptOutcome) { setReceipt(outcome); setReason(outcome === "received" ? "other" : outcome); setOpen(true); setError(""); }
 return <section className="my-4 space-y-3 rounded-xl border border-line p-4 text-sm" aria-label={t.report}>
  {handover && !match.receiptOutcome && state?.my_verified === false && <Link href="/verify" className="inline-flex min-h-11 items-center font-semibold text-forest underline">{t.verify}</Link>}
  {handover && !match.receiptOutcome && state?.partner_verified === false && <p className="text-muted">{t.partner}</p>}
  {state?.on_hold && <p role="status" className="rounded-xl bg-warn-bg p-3 text-warn">{t.hold}</p>}
  {loadError && <p role="alert" className="text-muted">{t.loadError} <button className="min-h-11 underline" onClick={() => void load()}>{t.retry}</button></p>}
  {match.receiptOutcome && !editing && <p role="status" className="font-semibold text-forest">{s.saved}: {s[match.receiptOutcome]}</p>}
  {!open && !state?.report && match.canReportReceipt && (!match.receiptOutcome || editing) && <>
   <h3 className="font-semibold text-forest">{s.title}</h3>
   <div className="flex flex-wrap gap-2">{(["received","missing_items","not_received"] as const).map(v => <button key={v} type="button" className="btn-ghost min-h-11" onClick={() => choose(v)}>{s[v]}</button>)}</div>
  </>}
  {state?.report ? <div role="status" className="space-y-2"><p>{state.report.status === "resolved" ? t.resolved : t.received} · #{state.report.id.slice(0,8)}</p>{state.report.resolution && <p className="whitespace-pre-wrap text-muted">{state.report.resolution}</p>}
    {!!state.report.photo_paths?.length && <EvidencePhotos paths={state.report.photo_paths} reportMatchId={match.id} />}
   </div> : !open && <button type="button" className="min-h-11 text-muted underline hover:text-forest" onClick={() => {setOpen(true);setReceipt(null);}}>{t.report}</button>}
  {!open && match.receiptOutcome && !state?.on_hold && <button type="button" className="min-h-11 underline" onClick={() => {setEditing(true);if(state?.report) choose("received");}}>{s.change}</button>}
  {open && <form onSubmit={submit} className="space-y-3">
   {receipt ? <p className="font-semibold">{s[receipt]}</p> : <label className="block font-semibold">{t.reason}<select className="field mt-1" value={reason} disabled={busy} onChange={e => setReason(e.target.value)}>{Object.entries(t.reasons).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
   {receipt !== "received" && <>
    <p className="text-muted">{s.reportOnly}</p>
    <label className="block font-semibold">{s.details}<textarea className="field mt-1" rows={3} minLength={10} maxLength={2000} value={details} disabled={busy} onChange={e => setDetails(e.target.value)} required /></label>
    {(reason === "missing_items" || reason === "not_received") && <label className="block">{s.weight}<input type="number" min="0" max="1000" step="0.01" inputMode="decimal" className="field mt-1 max-w-48" value={weight} onChange={e => setWeight(e.target.value)} disabled={busy}/></label>}
    <details><summary className="min-h-11 cursor-pointer font-semibold">{s.photos}</summary><EvidencePhotos paths={photos} onChange={setPhotos} onBusy={setUploading} disabled={busy} reportMatchId={match.id}/></details>
    <p className="text-xs text-muted">{s.privacy} {t.hint}</p>
   </>}
   {error && <p role="alert" className="field-error">{error}</p>}
   <div className="flex flex-wrap gap-2"><button disabled={busy || uploading} type="submit" className="btn-primary min-h-11">{busy ? t.sending : receipt === "received" ? s.confirm : t.send}</button><button type="button" disabled={busy || uploading} className="btn-ghost min-h-11" onClick={() => {setOpen(false);setReceipt(null);}}>{t.cancel}</button></div>
  </form>}
  {match.canReview && <a href={`#review-${match.id}`} className="inline-flex min-h-11 items-center font-semibold text-forest underline">{s.review}</a>}
  {state?.report && <p className="text-xs text-muted">{match.canReview ? s.updated : s.reviewHint}</p>}
 </section>;
}
