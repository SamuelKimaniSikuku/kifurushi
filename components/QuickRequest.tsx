"use client";

// Requesting a traveller shouldn't mean retyping the route they already
// published. This sheet inherits the trip's cities, countries and date, and
// asks only for what the traveller genuinely needs to know before accepting:
// what's inside, how heavy, what you'll pay.

import { useEffect, useState } from "react";
import { Package, X } from "lucide-react";
import { addParcel, fetchMyOpenParcels, requestMatch } from "@/lib/db";
import { CATEGORY_LABELS, ParcelCategory, Trip } from "@/lib/types";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ParcelCategory[];
import { useT } from "@/lib/i18n";

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
  const maxKg = Math.max(0.1, trip.remainingKg);
  const [weight, setWeight] = useState(String(Math.min(3, maxKg)));
  const [budget, setBudget] = useState(String(Math.round(trip.pricePerKg * 3)));
  const [description, setDescription] = useState("");
  const [cats, setCats] = useState<ParcelCategory[]>(
    trip.categoriesAccepted.slice(0, 1)
  );
  // Every category, the traveller's declared ones first. Their list is a
  // preference, not a wall — the chat exists precisely to ask "would you take
  // medicine too?" — so we don't hide options, we order and flag them.
  const orderedCats: ParcelCategory[] = [
    ...trip.categoriesAccepted,
    ...ALL_CATEGORIES.filter((c) => !trip.categoriesAccepted.includes(c)),
  ];
  const outsideList = cats.some((c) => !trip.categoriesAccepted.includes(c));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Keep the suggested budget in step with the weight and their rate.
  useEffect(() => {
    const w = parseFloat(weight);
    if (Number.isFinite(w) && w > 0) {
      setBudget(String(Math.round(w * trip.pricePerKg)));
    }
  }, [weight, trip.pricePerKg]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const weightNum = parseFloat(weight);
  const estimate =
    Number.isFinite(weightNum) && weightNum > 0
      ? Math.round(weightNum * trip.pricePerKg)
      : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (description.trim().length < 10) {
      setError(t.postParcel.insidePlaceholder);
      return;
    }
    if (cats.length === 0) {
      setError(t.postParcel.categoriesError);
      return;
    }
    if (!Number.isFinite(weightNum) || weightNum <= 0 || weightNum > maxKg) {
      setError(t.browse.tooHeavy(maxKg));
      return;
    }
    setBusy(true);
    setError("");
    try {
      // The parcel inherits the traveller's route and travel date.
      await addParcel({
        fromCountry: trip.fromCountry,
        fromCity: trip.fromCity,
        toCountry: trip.toCountry,
        toCity: trip.toCity,
        neededBy: trip.departDate,
        weightKg: parseFloat(weight),
        budgetUsd: parseFloat(budget),
        categories: cats,
        description: description.trim(),
      });
      const [mine] = await fetchMyOpenParcels();
      if (!mine) throw new Error("parcel not found after insert");
      await requestMatch(trip.id, mine.id);
      onDone();
    } catch {
      setError(t.browse.quickError);
      setBusy(false);
    }
  }

  function toggle(c: ParcelCategory) {
    setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
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
            aria-label={t.browse.quickCancel}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-sand hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="q-weight" className="field-label">
                {t.postParcel.weight} · {maxKg} kg free
              </label>
              <input
                id="q-weight"
                type="number"
                min={0.1}
                max={maxKg}
                step={0.1}
                inputMode="decimal"
                className="field"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
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
              {estimate > 0 && (
                <p className="mt-1 text-xs text-muted">
                  {t.browse.quickEstimate(estimate)}
                </p>
              )}
            </div>
          </div>

          <div>
            <span className="field-label">{t.postParcel.categoriesLabel}</span>
            <div className="flex flex-wrap gap-2">
              {orderedCats.map((c) => {
                const on = cats.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(c)}
                    aria-pressed={on}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                      on
                        ? "border-forest bg-forest text-white"
                        : "border-line-strong bg-white text-ink hover:border-forest"
                    }`}
                  >
                    {on && <span aria-hidden>✓</span>}
                    {CATEGORY_LABELS[c]}
                  </button>
                );
              })}
            </div>
            {outsideList && (
              <p className="mt-2 text-xs text-muted">
                {t.browse.quickCatHint(trip.travelerName)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="q-desc" className="field-label">
              {t.postParcel.whatsInside}
            </label>
            <textarea
              id="q-desc"
              className="field min-h-[80px]"
              placeholder={t.postParcel.insidePlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={400}
            />
          </div>

          {/* The answer to "where do I message them?" — here, one click away. */}
          <p className="rounded-xl bg-sand p-3 text-xs leading-relaxed text-muted">
            {t.browse.quickChatNote(trip.travelerName)}
          </p>

          {error && <p role="alert" className="field-error">{error}</p>}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row-reverse">
            <button type="submit" className="btn-accent w-full sm:w-auto" disabled={busy}>
              <Package className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {busy ? t.browse.quickSending : t.browse.quickSend}
            </button>
            <button
              type="button"
              className="btn-ghost w-full sm:w-auto"
              onClick={onClose}
              disabled={busy}
            >
              {t.browse.quickCancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
