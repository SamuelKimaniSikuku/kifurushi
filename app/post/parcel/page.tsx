"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Ban } from "lucide-react";
import CountrySelect from "@/components/CountrySelect";
import { parcelSchema, zodErrors, FieldErrors } from "@/lib/validation";
import { addParcel } from "@/lib/db";
import { useSession, fetchIsMember } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { CATEGORY_LABELS } from "@/lib/types";

// What a courier typically charges per kg on Africa ↔ diaspora routes, and
// the range travellers usually ask — powers the budget guidance below.
const COURIER_RATE_PER_KG = 14;
const TRAVELLER_RATE_LOW = 7;
const TRAVELLER_RATE_HIGH = 12;

const FIELD_ORDER = [
  "fromCountry",
  "fromCity",
  "toCountry",
  "toCity",
  "neededBy",
  "weightKg",
  "budgetUsd",
  "category",
  "description",
];

function focusFirstInvalid(errs: FieldErrors) {
  const first = FIELD_ORDER.find((k) => errs[k]);
  if (!first) return;
  const el = document.getElementById(first);
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "center" });
}

export default function PostParcelPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const t = useT();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    fromCountry: "", fromCity: "", toCountry: "", toCity: "",
    neededBy: "", weightKg: "3", category: "gifts", description: "", budgetUsd: "50",
  });
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/auth?next=/post/parcel");
      return;
    }
    // Posting is a member action (enforced server-side by RLS too).
    fetchIsMember().then((member) => {
      if (!member) router.replace("/pricing?reason=post");
    });
  }, [loading, session, router]);

  useEffect(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setMinDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parcelSchema.safeParse(form);
    if (!parsed.success) {
      const errs = zodErrors(parsed.error);
      setErrors(errs);
      focusFirstInvalid(errs);
      return;
    }
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      await addParcel(parsed.data);
      router.push("/parcels");
    } catch {
      setErrors({ _submit: t.postParcel.submitError });
      setSubmitting(false);
    }
  }

  // Budget guidance: what travellers usually ask for this weight, and what a
  // courier would charge, so the sender can judge their budget in context.
  const weightNum = parseFloat(form.weightKg);
  const budgetNum = parseFloat(form.budgetUsd);
  const rateGuide =
    Number.isFinite(weightNum) && weightNum > 0
      ? {
          kg: weightNum,
          low: Math.round(weightNum * TRAVELLER_RATE_LOW),
          high: Math.round(weightNum * TRAVELLER_RATE_HIGH),
        }
      : null;
  const comparison =
    rateGuide && Number.isFinite(budgetNum) && budgetNum > 0
      ? {
          kg: weightNum,
          budget: Math.round(budgetNum),
          courier: Math.round(weightNum * COURIER_RATE_PER_KG),
          savings: Math.round(weightNum * COURIER_RATE_PER_KG - budgetNum),
        }
      : null;

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const cls = (k: string) => (errors[k] ? "field field-invalid" : "field");
  const err = (k: string) =>
    errors[k]
      ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` }
      : {};

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        {t.postParcel.title}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {t.postParcel.sub}
      </p>

      <form onSubmit={submit} className="card mt-6 p-6 sm:p-8" noValidate>
        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fromCountry" className="field-label">{t.postTrip.fromCountry}</label>
            <div className={errors.fromCountry ? "[&>select]:border-danger" : undefined}>
              <CountrySelect id="fromCountry" value={form.fromCountry} onChange={set("fromCountry")} />
            </div>
            {errors.fromCountry && (
              <p id="fromCountry-error" className="field-error">{errors.fromCountry}</p>
            )}
          </div>
          <div>
            <label htmlFor="fromCity" className="field-label">{t.postTrip.fromCity}</label>
            <input
              id="fromCity"
              className={cls("fromCity")}
              value={form.fromCity}
              onChange={(e) => set("fromCity")(e.target.value)}
              placeholder={t.postTrip.cityFromPlaceholder}
              {...err("fromCity")}
            />
            {errors.fromCity && (
              <p id="fromCity-error" className="field-error">{errors.fromCity}</p>
            )}
          </div>
          <div>
            <label htmlFor="toCountry" className="field-label">{t.postTrip.toCountry}</label>
            <div className={errors.toCountry ? "[&>select]:border-danger" : undefined}>
              <CountrySelect id="toCountry" value={form.toCountry} onChange={set("toCountry")} />
            </div>
            {errors.toCountry && (
              <p id="toCountry-error" className="field-error">{errors.toCountry}</p>
            )}
          </div>
          <div>
            <label htmlFor="toCity" className="field-label">{t.postTrip.toCity}</label>
            <input
              id="toCity"
              className={cls("toCity")}
              value={form.toCity}
              onChange={(e) => set("toCity")(e.target.value)}
              placeholder={t.postTrip.cityToPlaceholder}
              {...err("toCity")}
            />
            {errors.toCity && (
              <p id="toCity-error" className="field-error">{errors.toCity}</p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
          <div>
            <label htmlFor="neededBy" className="field-label">{t.postParcel.neededBy}</label>
            <input
              id="neededBy"
              type="date"
              min={minDate || undefined}
              className={cls("neededBy")}
              value={form.neededBy}
              onChange={(e) => set("neededBy")(e.target.value)}
              {...err("neededBy")}
            />
            {errors.neededBy && (
              <p id="neededBy-error" className="field-error">{errors.neededBy}</p>
            )}
          </div>
          <div>
            <label htmlFor="weightKg" className="field-label">{t.postParcel.weight}</label>
            <input
              id="weightKg"
              type="number"
              min={0.1}
              max={46}
              step={0.1}
              inputMode="decimal"
              className={cls("weightKg")}
              value={form.weightKg}
              onChange={(e) => set("weightKg")(e.target.value)}
              {...err("weightKg")}
            />
            {errors.weightKg && (
              <p id="weightKg-error" className="field-error">{errors.weightKg}</p>
            )}
          </div>
          <div>
            <label htmlFor="budgetUsd" className="field-label">{t.postParcel.budget}</label>
            <input
              id="budgetUsd"
              type="number"
              min={1}
              max={2000}
              step={1}
              inputMode="decimal"
              className={cls("budgetUsd")}
              value={form.budgetUsd}
              onChange={(e) => set("budgetUsd")(e.target.value)}
              {...err("budgetUsd")}
            />
            {errors.budgetUsd && (
              <p id="budgetUsd-error" className="field-error">{errors.budgetUsd}</p>
            )}
            {rateGuide && (
              <p id="budgetUsd-hint" className="mt-1 text-xs text-muted">
                {t.postParcel.budgetHint(rateGuide.low, rateGuide.high, rateGuide.kg)}
              </p>
            )}
          </div>
        </div>

        {/* Live budget vs courier comparison */}
        {comparison && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-sand px-4 py-3.5 text-sm">
            <span className="font-semibold text-forest">
              {t.postParcel.courierBand(comparison.courier, comparison.kg)}
            </span>
            {comparison.savings > 0 ? (
              <span className="text-muted">
                {t.postParcel.saveNote(comparison.budget, comparison.savings)}
              </span>
            ) : (
              <span className="text-muted">
                {t.postParcel.aboveNote}
              </span>
            )}
          </div>
        )}

        {/* Extras */}
        <div className="mt-6 space-y-5 border-t border-line pt-5">
          <div>
            <label htmlFor="category" className="field-label">{t.postParcel.category}</label>
            <select
              id="category"
              className={cls("category")}
              value={form.category}
              onChange={(e) => set("category")(e.target.value)}
              {...err("category")}
            >
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {errors.category && (
              <p id="category-error" className="field-error">{errors.category}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="field-label">{t.postParcel.whatsInside}</label>
            <textarea
              id="description"
              className={`${cls("description")} min-h-[90px]`}
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder={t.postParcel.insidePlaceholder}
              {...err("description")}
            />
            {errors.description && (
              <p id="description-error" className="field-error">{errors.description}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-sand-deep px-4 py-3 text-xs leading-relaxed text-muted">
          <Ban size={18} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />
          <p>
            {t.postParcel.prohibitedNote}{" "}
            <a href="/safety#prohibited" className="font-semibold underline">{t.postParcel.prohibitedLink}</a>.{" "}
            {t.postParcel.prohibitedNote2}
          </p>
        </div>

        {errors._submit && (
          <p role="alert" className="field-error mt-4">{errors._submit}</p>
        )}
        <button type="submit" className="btn-accent mt-6 w-full py-3" disabled={submitting}>
          {submitting ? t.postParcel.posting : t.postParcel.post}
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
