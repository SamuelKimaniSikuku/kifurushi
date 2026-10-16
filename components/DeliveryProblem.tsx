"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { trustCopy } from "@/lib/locales/trust";
import { DeliveryReportState, fetchDeliveryReport, reportDelivery } from "@/lib/trust";

export default function DeliveryProblem({ matchId, handover, onHold }: { matchId: string; handover: boolean; onHold: (held: boolean) => void }) {
 const { lang } = useLang(); const t = trustCopy[lang];
 const [state, setState] = useState<DeliveryReportState | null>(null);
 const [open, setOpen] = useState(false); const [reason, setReason] = useState("not_received");
 const [details, setDetails] = useState(""); const [busy, setBusy] = useState(false);
 const [error, setError] = useState(""); const [loadError, setLoadError] = useState(false);
 const load = useCallback(async () => { try { const s = await fetchDeliveryReport(matchId); setState(s); onHold(s.on_hold); setLoadError(false); } catch { setLoadError(true); } }, [matchId, onHold]);
 useEffect(() => { void load(); const id = setInterval(() => { if(document.visibilityState === "visible") void load(); }, 30000); return () => clearInterval(id); }, [load]);
 async function submit(e: React.FormEvent) {
  e.preventDefault(); if(busy) return;
  if(details.trim().length < 10) { setError(t.short); return; }
  setBusy(true); setError("");
  try { const id = await reportDelivery(matchId, reason, details); setState({ on_hold: true, report: { id, status: "open", reason, resolution: null, created_at: new Date().toISOString() } }); onHold(true); setOpen(false); setDetails(""); await load(); }
  catch { setError(t.failed); } finally { setBusy(false); }
 }
 return <section className="mt-4 space-y-2 border-t border-line pt-3 text-sm" aria-label={t.report}>
  {handover && state?.my_verified === false && <Link href="/verify" className="inline-flex min-h-11 items-center font-semibold text-forest underline">{t.verify}</Link>}
  {handover && state?.partner_verified === false && <p className="text-muted">{t.partner}</p>}
  {state?.on_hold && <p role="status" className="rounded-xl bg-warn-bg p-3 text-warn">{t.hold}</p>}
  {loadError && <p role="alert" className="text-muted">{t.loadError} <button className="min-h-11 underline" onClick={() => void load()}>{t.retry}</button></p>}
  {state?.report ? <div role="status"><p>{state.report.status === "resolved" ? t.resolved : t.received} · #{state.report.id.slice(0,8)}</p>{state.report.resolution && <p className="mt-1 whitespace-pre-wrap text-muted">{state.report.resolution}</p>}</div> : !open ? <button type="button" className="min-h-11 text-muted underline hover:text-forest" onClick={() => setOpen(true)}>{t.report}</button> :
  <form onSubmit={submit} className="space-y-3 rounded-xl bg-sand p-4">
    <label htmlFor={`report-reason-${matchId}`} className="block font-semibold">{t.reason}</label><select id={`report-reason-${matchId}`} className="field mt-1" value={reason} disabled={busy} onChange={e => setReason(e.target.value)}>{Object.entries(t.reasons).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>
    <label htmlFor={`report-details-${matchId}`} className="block font-semibold">{t.details}</label><textarea id={`report-details-${matchId}`} className="field mt-1" rows={3} maxLength={2000} value={details} disabled={busy} onChange={e => setDetails(e.target.value)} required />
    <p className="text-xs text-muted">{t.hint} {t.note}</p>
    {error && <p role="alert" className="field-error">{error}</p>}
    <div className="flex flex-wrap gap-2"><button disabled={busy} type="submit" className="btn-primary min-h-11">{busy ? t.sending : t.send}</button><button type="button" disabled={busy} className="btn-ghost min-h-11" onClick={() => setOpen(false)}>{t.cancel}</button></div>
  </form>}
 </section>;
}
