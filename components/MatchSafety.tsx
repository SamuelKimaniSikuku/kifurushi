"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { MatchDetail } from "@/lib/db";
import { safetyCopy } from "@/lib/locales/safety";
import { declarationSchema, emptyDeclaration, REFUSAL_REASONS, type RefusalReason } from "@/lib/parcelSafety";
import { confirmInspection, fetchMatchSafety, refuseParcel, saveDeclaration } from "@/lib/safetyDb";
import ContentsDeclaration from "./ContentsDeclaration";
import EvidencePhotos from "./EvidencePhotos";

export default function MatchSafety({ match, myUserId, onChanged, onReady }: {
  match: MatchDetail; myUserId: string; onChanged: () => void; onReady: (ready: boolean) => void;
}) {
  const { lang } = useLang(); const s = safetyCopy[lang];
  const [state, setState] = useState<Awaited<ReturnType<typeof fetchMatchSafety>> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState(emptyDeclaration);
  const [photos, setPhotos] = useState<string[]>([]);
  const [inspectionConfirmed, setInspectionConfirmed] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState<RefusalReason>("cannot_inspect");
  const [notes, setNotes] = useState("");
  const traveler = match.role === "traveler";
  const prePickup = ["requested", "accepted", "escrow_paid"].includes(match.status);
  const reload = useCallback(async () => {
    try { const next = await fetchMatchSafety(match.id, match.parcelId); setState(next); setLoadError(false); }
    catch { setLoadError(true); }
  }, [match.id, match.parcelId]);
  useEffect(() => { void reload(); const timer = setInterval(reload, 15000); return () => clearInterval(timer); }, [reload]);
  const declaration = state?.declaration;
  const current = state?.inspections.filter((i) => i.declaration_version === declaration?.version) ?? [];
  const mine = current.some((i) => i.user_id === myUserId);
  const ready = !loadError && current.some((i) => i.role === "sender") && current.some((i) => i.role === "traveler");
  useEffect(() => { onReady(ready); }, [onReady, ready]);
  async function act(fn: () => Promise<void>) {
    if (busy || uploading) return;
    setBusy(true); setError("");
    try { await fn(); await reload(); onChanged(); }
    catch (e) { setError(e && typeof e === "object" && "message" in e ? String(e.message) : s.failed); }
    finally { setBusy(false); }
  }
  if (loadError) return <div className="mt-4 rounded-xl border border-danger/30 p-4"><p role="alert" className="text-sm text-danger">{s.loadError}</p><button type="button" className="btn-ghost mt-2" onClick={reload}>{s.retry}</button></div>;
  if (!state) return <div className="mt-4 h-16 animate-pulse rounded-xl bg-sand" aria-busy="true" />;
  if (!declaration && !prePickup && !state.refusal) return null;
  return <section className="mt-5 space-y-4 rounded-2xl border border-forest/20 bg-sand/40 p-4">
    <h3 className="flex items-center gap-2 font-semibold text-forest"><ShieldCheck size={18} aria-hidden />{s.title}</h3>
    {state.refusal && <p role="status" className="rounded-xl border border-danger/30 p-3 text-sm text-danger">{s.refused} {s[state.refusal.reason]}</p>}
    {declaration ? <>
      <p className="text-xs text-muted">{s.version} {declaration.version} · {new Date(declaration.declared_at).toLocaleDateString(lang)}</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-line"><th className="py-2 pr-3">{s.item}</th><th className="p-2">{s.quantity}</th><th className="py-2 pl-3 text-right">{s.value}</th></tr></thead><tbody>{declaration.items.map((item, i) => <tr key={i} className="border-b border-line"><td className="py-2 pr-3">{item.description}</td><td className="p-2">{item.quantity}</td><td className="py-2 pl-3 text-right">${Number(item.valueUsd).toFixed(2)}</td></tr>)}</tbody></table></div>
      <p className="text-sm font-semibold">{s.total}: ${Number(declaration.declared_value_usd).toFixed(2)}</p>
      {declaration.photo_paths.length > 0 && <EvidencePhotos paths={declaration.photo_paths} />}
      <p className="text-xs leading-relaxed text-muted">{s.frozen}</p>
    </> : <>
      <p className="text-sm text-muted">{s.missing}</p>
      {traveler ? <p className="text-sm">{s.waitingDeclaration}</p> : <>
        <ContentsDeclaration value={draft} onChange={setDraft} disabled={busy || uploading} onBusy={setUploading} />
        <button type="button" disabled={busy || uploading} className="btn-primary" onClick={() => {
          if (!declarationSchema.safeParse(draft).success) { setError(s.invalid); return; }
          void act(() => saveDeclaration(match.parcelId, draft));
        }}>{busy ? s.saving : s.save}</button>
      </>}
    </>}
    <p className="text-xs leading-relaxed text-muted">{s.limits}</p>
    {declaration && match.status === "accepted" && <p className="text-sm">{s.readyTerms}</p>}
    {declaration && (match.status === "escrow_paid" || current.length > 0) && <>
      <h4 className="font-semibold text-forest">{s.handover}</h4>
      <ul className="space-y-1 text-sm">{(["sender", "traveler"] as const).map((role) => <li key={role}>{role === "sender" ? s.sender : s.traveller}: {current.some((i) => i.role === role) ? s.record : s.waiting}</li>)}</ul>
      {current.filter((i) => i.photo_paths.length > 0).map((i) => <EvidencePhotos key={i.user_id} handover paths={i.photo_paths} />)}
      {match.status === "escrow_paid" && (mine ? <p role="status" className="text-sm font-semibold text-forest">{ready ? s.bothConfirmed : `${s.confirmed} ${s.waitingOther}`}</p> : <>
        {traveler && <><p className="text-sm">{s.verify} <Link className="font-semibold text-forest underline" href="/verify">{s.verifyLink}</Link></p><EvidencePhotos handover paths={photos} onChange={setPhotos} onBusy={setUploading} disabled={busy || uploading} /></>}
        <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" checked={inspectionConfirmed} disabled={busy || uploading} className="mt-1 h-5 w-5 shrink-0 accent-forest" onChange={(e) => setInspectionConfirmed(e.target.checked)} />{s.inspectionAttest}</label>
        <button type="button" className="btn-primary" disabled={busy || uploading || !inspectionConfirmed} onClick={() => act(() => confirmInspection(match.id, declaration.version, photos, { opened: inspectionConfirmed, matches: inspectionConfirmed, sealed: inspectionConfirmed, noConcerns: inspectionConfirmed }))}>{s.confirm}</button>
      </>)}
    </>}
    {traveler && prePickup && <div className="border-t border-line pt-4">
      {!refusing ? <button type="button" disabled={busy || uploading} className="btn-ghost text-danger" onClick={() => setRefusing(true)}>{s.refuse}</button> : <div className="space-y-3">
        <p className="text-sm leading-relaxed">{s.refusalNote}</p>
        <label className="block text-sm font-semibold">{s.reason}<select className="field mt-1" value={reason} disabled={busy} onChange={(e) => setReason(e.target.value as RefusalReason)}>{REFUSAL_REASONS.map((r) => <option key={r} value={r}>{s[r]}</option>)}</select></label>
        <label className="block text-sm font-semibold">{s.notes}<textarea className="field mt-1" rows={3} maxLength={1000} value={notes} disabled={busy} onChange={(e) => setNotes(e.target.value)} /></label>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || uploading} className="btn-primary" onClick={() => act(() => refuseParcel(match.id, reason, notes))}>{s.confirmRefusal}</button><button type="button" disabled={busy} className="btn-ghost" onClick={() => setRefusing(false)}>{s.back}</button></div>
      </div>}
    </div>}
    {error && <p role="alert" className="field-error">{error}</p>}
  </section>;
}
