"use client";

import { useEffect, useId, useState } from "react";
import { useLang } from "@/lib/i18n";
import { receiptCopy } from "@/lib/locales/receipt";
import { safetyCopy } from "@/lib/locales/safety";
import { evidencePreview, uploadEvidence } from "@/lib/safetyDb";
import { validateEvidenceFile } from "@/lib/parcelSafety";

function Photo({ path, index, reportMatchId }: { path: string; index: number; reportMatchId?: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  const { lang } = useLang();
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    evidencePreview(path, reportMatchId).then((value) => {
      objectUrl = value;
      if (active) setUrl(value); else URL.revokeObjectURL(value);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path, reportMatchId]);
  if (error) return <p role="alert" className="text-xs text-danger">{safetyCopy[lang].photoLoadError}</p>;
  // Authenticated object URLs keep private evidence out of image proxies/caches.
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`${safetyCopy[lang].photos} ${index + 1}`} className="h-28 w-full rounded-lg object-contain bg-white" /></a> : <div className="h-28 animate-pulse rounded-lg bg-sand-deep" aria-busy="true" />;
}

export default function EvidencePhotos({ paths, onChange, onBusy, disabled = false, handover = false, reportMatchId }: {
  paths: string[]; onChange?: (paths: string[]) => void; onBusy?: (busy: boolean) => void; disabled?: boolean; handover?: boolean; reportMatchId?: string;
}) {
  const { lang } = useLang();
  const s = safetyCopy[lang];
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(files: FileList | null) {
    if (!files || !onChange || busy || disabled) return;
    const selected = Array.from(files);
    if (paths.length + selected.length > 6 || selected.some((file) => !validateEvidenceFile(file))) {
      setError(s.photoError); return;
    }
    setError(""); setBusy(true); onBusy?.(true);
    const uploaded = [...paths];
    try {
      for (const file of selected) uploaded.push(await uploadEvidence(file, reportMatchId));
    } catch { setError(s.failed); }
    finally { onChange(uploaded); setBusy(false); onBusy?.(false); }
  }
  return <div className="space-y-2">
    <p className="field-label">{reportMatchId ? receiptCopy[lang].photos : handover ? s.handoverPhotos : s.photos}</p>
    {paths.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{paths.map((path, index) => <div key={path} className="min-w-0 rounded-xl border border-line p-2">
      <Photo path={path} index={index} reportMatchId={reportMatchId} />
      {onChange && <button type="button" disabled={disabled || busy} className="mt-1 min-h-10 w-full text-sm font-semibold text-danger" onClick={() => onChange(paths.filter((p) => p !== path))}>{s.remove} {index + 1}</button>}
    </div>)}</div>}
    {onChange && <>
      <label htmlFor={id} className="field-label">{busy ? s.uploading : s.addPhotos}</label>
      <input id={id} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={disabled || busy || paths.length >= 6} className="field text-sm" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
      <p className="text-xs leading-relaxed text-muted">{reportMatchId ? receiptCopy[lang].photoNote : s.photoNote}</p>
    </>}
    {error && <p role="alert" className="field-error">{error}</p>}
  </div>;
}
