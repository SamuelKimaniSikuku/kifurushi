"use client";

import { useId } from "react";
import { useLang } from "@/lib/i18n";
import { safetyCopy } from "@/lib/locales/safety";
import type { DeclarationDraft } from "@/lib/parcelSafety";
import EvidencePhotos from "./EvidencePhotos";

export default function ContentsDeclaration({ value, onChange, onBusy, disabled = false }: {
  value: DeclarationDraft; onChange: (value: DeclarationDraft) => void; onBusy: (busy: boolean) => void; disabled?: boolean;
}) {
  const { lang } = useLang(); const s = safetyCopy[lang]; const id = useId();
  const total = value.items.reduce((sum, item) => sum + (Number(item.valueUsd) || 0), 0);
  function setItem(index: number, key: "description" | "quantity" | "valueUsd", next: string) {
    onChange({ ...value, attested: false, items: value.items.map((item, i) => i === index ? { ...item, [key]: next } : item) });
  }
  return <fieldset disabled={disabled} className="space-y-4 rounded-2xl border border-line bg-sand/50 p-4">
    <legend className="px-1 font-semibold text-forest">{s.title}</legend>
    <p className="text-sm leading-relaxed text-muted">{s.private}</p>
    {value.items.map((item, index) => <div key={index} className="space-y-3 rounded-xl border border-line bg-white p-3">
      <div><label className="field-label" htmlFor={`${id}-item-${index}`}>{s.item} {index + 1}</label><input id={`${id}-item-${index}`} className="field" value={item.description} maxLength={160} onChange={(e) => setItem(index, "description", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="field-label" htmlFor={`${id}-qty-${index}`}>{s.quantity}</label><input id={`${id}-qty-${index}`} className="field" type="number" min={1} max={1000} step={1} inputMode="numeric" value={item.quantity} onChange={(e) => setItem(index, "quantity", e.target.value)} /></div>
        <div><label className="field-label" htmlFor={`${id}-value-${index}`}>{s.value}</label><input id={`${id}-value-${index}`} className="field" type="number" min={0.01} max={100000} step={0.01} inputMode="decimal" value={item.valueUsd} onChange={(e) => setItem(index, "valueUsd", e.target.value)} /></div>
      </div>
      {value.items.length > 1 && <button type="button" className="min-h-10 text-sm font-semibold text-danger" onClick={() => onChange({ ...value, attested: false, items: value.items.filter((_, i) => i !== index) })}>{s.remove} {index + 1}</button>}
    </div>)}
    <button type="button" className="btn-ghost" disabled={disabled || value.items.length >= 30} onClick={() => onChange({ ...value, attested: false, items: [...value.items, { description: "", quantity: "1", valueUsd: "" }] })}>{s.addItem}</button>
    <div><p className="font-semibold text-forest">{s.total}: ${total.toFixed(2)}</p><p className="text-xs text-muted">{s.valueNote}</p></div>
    <EvidencePhotos paths={value.photoPaths} onBusy={onBusy} disabled={disabled} onChange={(photoPaths) => onChange({ ...value, photoPaths, attested: false })} />
    <a href="/safety#prohibited" target="_blank" rel="noopener noreferrer" className="inline-block min-h-10 text-sm font-semibold text-forest underline">{lang === "fr" ? "Objets interdits" : lang === "sw" ? "Vitu vilivyokatazwa" : "Prohibited-items guidance"}</a>
    <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-forest" checked={value.attested} onChange={(e) => onChange({ ...value, attested: e.target.checked })} />{s.attest}</label>
  </fieldset>;
}
