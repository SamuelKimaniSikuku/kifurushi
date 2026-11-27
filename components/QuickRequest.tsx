"use client";

// Requesting a traveller shouldn't mean retyping the route they already
// published. This sheet inherits the trip's cities, countries and date, and
// asks only for what the traveller genuinely needs to know before accepting:
// what's inside, how heavy, what you'll pay.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, X } from "lucide-react";
import { requestWeightSchema } from "@/lib/validation";
import { requestWeightCopy } from "@/lib/locales/requestWeight";
import { addParcel, requestMatch } from "@/lib/db";
import ContentsDeclaration from "./ContentsDeclaration";
import { briefDeclaration, declarationSchema, emptyDeclaration } from "@/lib/parcelSafety";
import { safetyCopy } from "@/lib/locales/safety";
import { ParcelCategory, Trip } from "@/lib/types";

import ParcelContentsFields from "./ParcelContentsFields";
import ParcelWeightField from "./ParcelWeightField";
import { acceptsContents, parcelDetailsSchema } from "@/lib/parcelContents";
import { categoryNames, parcelContentsCopy } from "@/lib/locales/parcelContents";
import { useLang, useT } from "@/lib/i18n";

export default function QuickRequest({
  trip,
  onDone,
  onClose,
}: {
  trip: Trip;
  onDone: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const { lang } = useLang();
  const [declaration, setDeclaration] = useState(emptyDeclaration);
  const [uploading, setUploading] = useState(false);
  const [createdParcelId, setCreatedParcelId] = useState<string | null>(null);
  const w = requestWeightCopy[lang];
  const [weight, setWeight] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [cats, setCats] = useState<ParcelCategory[]>([]);
  const [details, setDetails] = useState({ itemCount: "", packageType: "" });
  const [weightKind, setWeightKind] = useState<"measured"|"estimated">("estimated");
  const pc = parcelContentsCopy[lang];
  const outsideList = cats.length > 0 && !acceptsContents(trip.categoriesAccepted,cats);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && !uploading && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, busy, uploading]);

  const weightNum = parseFloat(weight);
  const estimate =
    Number.isFinite(weightNum) && weightNum > 0
      ? Math.round(weightNum * trip.pricePerKg)
      : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || uploading) return;
    if (!declarationSchema.safeParse(briefDeclaration(description, declaration)).success) { setError(safetyCopy[lang].invalid); return; }
    if (description.trim().length < 3) {
      setError(t.postParcel.insidePlaceholder);
      return;
    }
    const parsedWeight = requestWeightSchema.safeParse(weight);
    if (!parsedWeight.success) {
      setError(w.invalid);
      return;
    }
    if (!cats.length) { setError(pc.choose); return; }
    if (outsideList) { setError(pc.mismatch); return; }
    const parsedDetails = parcelDetailsSchema.safeParse({ ...details, weightKind: parsedWeight.data == null ? null : weightKind });
    if (!parsedDetails.success) { setError(pc.detailsError); return; }
    setBusy(true);
    setError("");
    try {
      // The parcel inherits the traveller's route and travel date.
      const parcelId = createdParcelId ?? await addParcel({
        fromCountry: trip.fromCountry,
        fromCity: trip.fromCity,
        toCountry: trip.toCountry,
        toCity: trip.toCity,
        neededBy: trip.departDate,
        weightKg: parsedWeight.data,
        budgetUsd: parseFloat(budget),
        categories: cats,
        ...parsedDetails.data,
        description: description.trim(),
        declaration,
      });
      setCreatedParcelId(parcelId);
      await requestMatch(trip.id, parcelId);
      onDone();
    } catch {
      setError(t.browse.quickError);
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => { if (!busy && !uploading) onClose(); }}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-forest">
              {t.browse.quickTitle(trip.travelerName)}
            </h2>
            <p className="mt-1 text-sm font-semibold text-ink">
              {trip.fromCity} → {trip.toCity}
            </p>
            <p className="mt-0.5 text-xs text-muted">{t.browse.quickRoute}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy || uploading}
            aria-label={t.browse.quickCancel}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-sand hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <fieldset disabled={busy || uploading || !!createdParcelId} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ParcelWeightField id="q-weight" value={weight} onChange={v => { setWeight(v); setError(""); }} kind={weightKind} onKind={setWeightKind} />
            <div>
              <label htmlFor="q-budget" className="field-label">
                {t.postParcel.budget}
              </label>
              <input
                id="q-budget"
                type="number"
                min={1}
                max={2000}
                step={1}
                inputMode="decimal"
                className="field"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              {Number.isFinite(estimate) && estimate > 0 && (
                <p className="mt-1 text-xs text-muted">
                  {t.browse.quickEstimate(estimate)}
                </p>
              )}
            </div>
          </div>



          <p className="rounded-xl bg-sand p-3 text-sm"><strong>{pc.accepted}:</strong> {trip.categoriesAccepted.map(c=>categoryNames[lang][c]).join(", ")}</p>
          <ParcelContentsFields prefix="q-" categories={cats} onCategories={v => {setCats(v);setError("");setDeclaration(d=>({...d,attested:false}));}} description={description} onDescription={v=>{setDescription(v);setDeclaration(d=>briefDeclaration(v,{...d,attested:false}));setError("");}} itemCount={details.itemCount} packageType={details.packageType} onDetails={(key,value)=>{setDetails(d=>({...d,[key]:value}));setDeclaration(d=>({...d,attested:false}));setError("");}} />
          {outsideList && <p role="alert" className="field-error">{pc.mismatch}</p>}
          <ContentsDeclaration descriptionProvided value={declaration} onChange={(d) => { setDeclaration(d); setError(""); }} onBusy={setUploading} disabled={busy || uploading || !!createdParcelId} />
          </fieldset>
          {createdParcelId && <p className="text-sm text-muted">{safetyCopy[lang].savedRequest} <Link className="font-semibold text-forest underline" href="/dashboard">{t.nav.dashboard}</Link></p>}

          {/* The answer to "where do I message them?" — here, one click away. */}
          <p className="rounded-xl bg-sand p-3 text-xs leading-relaxed text-muted">
            {t.browse.quickChatNote(trip.travelerName)}
          </p>

          {error && <p role="alert" className="field-error">{error}</p>}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row-reverse">
            <button type="submit" className="btn-accent w-full sm:w-auto" disabled={busy || uploading || outsideList}>
              <Package className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {busy ? t.browse.quickSending : t.browse.quickSend}
            </button>
            <button
              type="button"
              className="btn-ghost w-full sm:w-auto"
              onClick={onClose}
              disabled={busy || uploading}
            >
              {t.browse.quickCancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
