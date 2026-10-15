"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { MatchDetail } from "@/lib/db";
import { safetyCopy } from "@/lib/locales/safety";
import { deliveryCopy } from "@/lib/locales/delivery";
import { declarationSchema, emptyDeclaration, REFUSAL_REASONS, type RefusalReason } from "@/lib/parcelSafety";
import { confirmInspection, fetchMatchSafety, refuseParcel, saveDeclaration } from "@/lib/safetyDb";
import ContentsDeclaration from "./ContentsDeclaration";
import EvidencePhotos from "./EvidencePhotos";

export default function MatchSafety({ match, myUserId, onChanged, onReady, onMessage, children }: {
  match: MatchDetail; myUserId: string; onChanged: () => void; onReady: (ready: boolean) => void; onMessage: () => void;
  children: (panels: { inspection: ReactNode; parcelDetails: ReactNode }) => ReactNode;
}) {
  const { lang } = useLang(); const s = safetyCopy[lang]; const d = deliveryCopy[lang];
  const [state, setState] = useState<Awaited<ReturnType<typeof fetchMatchSafety>> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmingInspection, setConfirmingInspection] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState(emptyDeclaration);
  const [photos, setPhotos] = useState<string[]>([]);
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
  const ready = !loadError && !state?.refusal && current.some((i) => i.role === "sender") && current.some((i) => i.role === "traveler");
  useEffect(() => { onReady(ready); }, [onReady, ready]);
  async function act(fn: () => Promise<void>) {
    if (busy || uploading) return;
    setBusy(true); setError("");
    try { await fn(); await reload(); onChanged(); }
    catch (e) { setError(e && typeof e === "object" && "message" in e ? String(e.message) : s.failed); }
    finally { setBusy(false); }
  }
  const loadNotice = loadError
    ? <div><p role="alert" className="text-sm text-danger">{s.loadError}</p><button type="button" className="btn-ghost mt-2" onClick={reload}>{s.retry}</button></div>
    : <div className="h-16 animate-pulse rounded-xl bg-sand" aria-busy="true" />;
  if (loadError || !state) return children({ inspection: loadNotice, parcelDetails: null });
  if (!declaration && !prePickup && !state.refusal) return children({ inspection: null, parcelDetails: null });
  const errorNotice = error && <div role="alert" className="field-error"><p>{error}</p>{traveler && /identity verification/i.test(error) && <Link href="/verify" className="mt-2 inline-flex min-h-11 items-center font-semibold underline">{s.verifyLink}</Link>}</div>;
  const details = <section aria-label={s.title} className="text-sm">
    <h3 className="flex items-center gap-2 font-semibold text-forest"><ShieldCheck size={18} aria-hidden />{s.title}</h3>
    {declaration && <p className="mt-2 break-words">{declaration.items.map((item) => item.description).join("; ")}</p>}
    <div className="mt-2 space-y-3 text-muted">
      {declaration && <>
        {declaration.items.some((item) => item.quantity != null || item.valueUsd != null) && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-line"><th className="py-2 pr-3">{s.item}</th><th className="p-2">{s.quantity}</th><th className="py-2 pl-3 text-right">{s.value}</th></tr></thead><tbody>{declaration.items.map((item, i) => <tr key={i} className="border-b border-line"><td className="py-2 pr-3">{item.description}</td><td className="p-2">{item.quantity ?? "—"}</td><td className="py-2 pl-3 text-right">{item.valueUsd != null ? `$${Number(item.valueUsd).toFixed(2)}` : "—"}</td></tr>)}</tbody></table></div>}
        {declaration.declared_value_usd != null && <p>{s.total}: ${Number(declaration.declared_value_usd).toFixed(2)}</p>}
        {declaration.photo_paths.length > 0 && <EvidencePhotos paths={declaration.photo_paths} />}
        <p>{d.editContents}</p>
        {current.length > 0 && <ul>{(["sender", "traveler"] as const).map((role) => <li key={role}>{role === "sender" ? s.sender : s.traveller}: {current.some((i) => i.role === role) ? s.record : s.waiting}</li>)}</ul>}
        {current.filter((i) => i.photo_paths.length > 0).map((i) => <EvidencePhotos key={i.user_id} handover paths={i.photo_paths} />)}
      </>}
      <p>{d.safetyHelp}</p>
      <Link href="/safety" className="inline-block font-medium text-forest underline">{s.prohibitedLink}</Link>
    </div>
  </section>;
  const refusalControl = traveler && prePickup && <div className="border-t border-line pt-4">
      {!refusing ? <button type="button" disabled={busy || uploading} className="min-h-11 text-sm font-medium text-danger underline" onClick={() => setRefusing(true)}>{s.refuse}</button> : <div className="space-y-3">
        <p className="text-sm leading-relaxed">{s.refusalNote}</p>
        <label className="block text-sm font-semibold">{s.reason}<select className="field mt-1" value={reason} disabled={busy} onChange={(e) => setReason(e.target.value as RefusalReason)}>{REFUSAL_REASONS.map((r) => <option key={r} value={r}>{s[r]}</option>)}</select></label>
        <label className="block text-sm font-semibold">{s.notes}<textarea className="field mt-1" rows={3} maxLength={1000} value={notes} disabled={busy} onChange={(e) => setNotes(e.target.value)} /></label>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || uploading} className="btn-primary" onClick={() => act(() => refuseParcel(match.id, reason, notes))}>{s.confirmRefusal}</button><button type="button" disabled={busy} className="btn-ghost" onClick={() => setRefusing(false)}>{s.back}</button></div>
      </div>}
    </div>;
  const inspection = ((!declaration && prePickup) || match.status === "escrow_paid") && <div className="space-y-3">
    {!declaration && prePickup && <>
      <p className="text-sm text-muted">{s.missing}</p>
      {traveler ? <p className="text-sm">{s.waitingDeclaration}</p> : <>
        <ContentsDeclaration value={draft} onChange={setDraft} disabled={busy || uploading} onBusy={setUploading} />
        <button type="button" disabled={busy || uploading} className="btn-primary" onClick={() => {
          if (!declarationSchema.safeParse(draft).success) { setError(s.invalid); return; }
          void act(() => saveDeclaration(match.parcelId, draft));
        }}>{busy ? s.saving : s.save}</button>
      </>}
    </>}
    {declaration && !state.refusal && match.status === "escrow_paid" && <>
      {mine ? <>
        <p role="status" className="text-sm font-medium text-forest">{ready ? (traveler ? d.readyCollect : d.waitingCollection(match.counterpartyName)) : d.waitingFor(match.counterpartyName)}</p>
        {!ready && <a href={`#messages-${match.id}`} onClick={onMessage} className="inline-flex min-h-11 items-center text-sm font-semibold text-forest underline">{d.message(match.counterpartyName)}</a>}
      </> : <div className="space-y-3">
        <h3 className="text-sm font-semibold text-forest">{d.check}</h3>
        <p className="break-words text-sm">{declaration.items.map((item) => item.description).join("; ")}</p>
        <p id={`inspection-help-${match.id}`} className="text-sm text-muted">{d.checkInstructions}</p>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg bg-white p-3 text-sm leading-relaxed">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-forest" checked={confirmingInspection}
            aria-describedby={`inspection-help-${match.id}`} disabled={busy || uploading}
            onChange={async (event) => {
              if (!event.target.checked || busy || uploading) return;
              setConfirmingInspection(true);
              try {
                await act(() => confirmInspection(match.id, declaration.version, photos, { opened: true, matches: true, sealed: true, noConcerns: true }));
              } finally { setConfirmingInspection(false); }
            }} />
          <span>{d.confirmCheck}</span>
        </label>
        {confirmingInspection && <p role="status" className="text-sm text-muted">{d.confirming}</p>}
      </div>}
    </>}
    {match.status === "escrow_paid" && refusalControl}
    {errorNotice}
  </div>;
  return children({ inspection, parcelDetails: <div className="space-y-4">
    {state.refusal && <p role="status" className="text-sm text-danger">{s.refused} {s[state.refusal.reason]}</p>}
    {details}
    {traveler && declaration && !state.refusal && match.status === "escrow_paid" && !mine && <details className="border-t border-line pt-3 text-sm"><summary className="cursor-pointer py-2 text-forest">{d.checkHelp}</summary><div className="mt-2 space-y-3"><p className="text-muted">{s.verify} <Link className="font-medium text-forest underline" href="/verify">{s.verifyLink}</Link></p><EvidencePhotos handover paths={photos} onChange={setPhotos} onBusy={setUploading} disabled={busy || uploading} /></div></details>}
    {match.status !== "escrow_paid" && refusalControl}
    {match.status !== "escrow_paid" && declaration && errorNotice}
  </div> });
}
