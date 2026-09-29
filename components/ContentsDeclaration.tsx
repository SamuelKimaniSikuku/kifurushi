"use client";

import { useId, type ReactNode } from "react";
import { useLang } from "@/lib/i18n";
import { safetyCopy } from "@/lib/locales/safety";
import { briefDeclaration, type DeclarationDraft } from "@/lib/parcelSafety";
import EvidencePhotos from "./EvidencePhotos";

export default function ContentsDeclaration({ value, onChange, onBusy, disabled = false, descriptionProvided = false, children }: {
  value: DeclarationDraft; onChange: (value: DeclarationDraft) => void; onBusy: (busy: boolean) => void;
  disabled?: boolean; descriptionProvided?: boolean; children?: ReactNode;
}) {
  const { lang } = useLang(); const s = safetyCopy[lang]; const id = useId();
  return <fieldset disabled={disabled} className="space-y-3">
    {!descriptionProvided && <div>
      <label className="field-label" htmlFor={`${id}-contents`}>{s.briefLabel}</label>
      <textarea id={`${id}-contents`} className="field min-h-[80px]" maxLength={400} placeholder={s.briefPlaceholder}
        value={value.items.map((item) => item.description).join(", ")}
        onChange={(e) => onChange(briefDeclaration(e.target.value, { ...value, attested: false }))} />
    </div>}
    <details className="rounded-xl border border-line p-3">
      <summary className="cursor-pointer text-sm font-semibold text-forest">{children ? s.optionalDetails : s.optionalPhotos}</summary>
      <div className="mt-4 space-y-4">
        {children}
        <EvidencePhotos paths={value.photoPaths} onBusy={onBusy} disabled={disabled} onChange={(photoPaths) => onChange({ ...value, photoPaths })} />
        <p className="text-xs text-muted">{s.private}</p>
      </div>
    </details>
    <label className="flex items-start gap-3 text-sm leading-relaxed">
      <input id={`${id}-confirm`} type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-forest" checked={value.attested} onChange={(e) => onChange({ ...value, attested: e.target.checked })} />
      {s.attest}
    </label>
    <a href="/safety#prohibited" target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold text-forest underline">{s.prohibitedLink}</a>
  </fieldset>;
}
