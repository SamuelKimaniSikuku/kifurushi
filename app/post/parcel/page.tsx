"use client";

import { readPostRoute, safeReturnPath } from "@/lib/routes";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import CountrySelect from "@/components/CountrySelect";
import {
  parcelSchema, zodErrors, touchedErrors, FieldErrors,
} from "@/lib/validation";
import {
  addParcel, fetchParcelById, hasDuplicateParcel, updateParcel,
} from "@/lib/db";
import { useSession, fetchIsMember } from "@/lib/auth";
import { requestWeightCopy } from "@/lib/locales/requestWeight";
import { useLang, useT } from "@/lib/i18n";
import { CATEGORY_LABELS, ParcelCategory } from "@/lib/types";
import ContentsDeclaration from "@/components/ContentsDeclaration";
import { briefDeclaration, declarationSchema, emptyDeclaration } from "@/lib/parcelSafety";
import { fetchDeclaration } from "@/lib/safetyDb";
import { safetyCopy } from "@/lib/locales/safety";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ParcelCategory[];

const FIELD_ORDER = [
  "fromCountry",
  "fromCity",
  "toCountry",
  "toCity",
  "neededBy",
  "weightKg",
  "budgetUsd",
  "cats",
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

function PostParcelForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { session, loading } = useSession();
  const t = useT();
  const { lang } = useLang();
  const s = safetyCopy[lang];
  const [declaration, setDeclaration] = useState(emptyDeclaration);
  const [uploading, setUploading] = useState(false);
  const [declarationLoading, setDeclarationLoading] = useState(!!params.get("edit"));
  const [declarationLoadError, setDeclarationLoadError] = useState(false);
  const [declarationAttempt, setDeclarationAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  // Which fields the member has actually finished with. Nothing complains
  // until you have been there.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    fromCountry: "", fromCity: "", toCountry: "", toCity: "",
    neededBy: "", weightKg: "3", description: "", budgetUsd: "50",
  });
  const [cats, setCats] = useState<ParcelCategory[]>([]);
  const [minDate, setMinDate] = useState("");
  // Set when the member already has an open parcel on this route and deadline;
  // the next submit is taken as "yes, it really is a second parcel".
  const [dupWarning, setDupWarning] = useState(false);
  const editId = params.get("edit");

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace(`/auth?next=${encodeURIComponent("/post/parcel" + window.location.search)}`);
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

  // Load the editable parcel once per account/attempt, preserving optional photos.
  const userId = session?.userId;
  useEffect(() => {
    if (!editId || !userId) return;
    let active = true;
    setDeclarationLoading(true);
    setDeclarationLoadError(false);
    Promise.all([fetchParcelById(editId), fetchDeclaration(editId)]).then(([p, d]) => {
      if (!active) return;
      if (!p) throw new Error("Parcel unavailable");
      setForm({ fromCountry: p.fromCountry, fromCity: p.fromCity, toCountry: p.toCountry, toCity: p.toCity,
        neededBy: p.neededBy, weightKg: p.weightKg == null ? "" : String(p.weightKg), description: p.description, budgetUsd: String(p.budgetUsd) });
      setCats(p.categories);
      setDeclaration(briefDeclaration(p.description, { photoPaths: d?.photo_paths ?? [], items: [], attested: false }));
    }).catch(() => { if (active) setDeclarationLoadError(true); }).finally(() => { if (active) setDeclarationLoading(false); });
    return () => { active = false; };
  }, [editId, userId, declarationAttempt]);

  // Keep the selected route when arriving from browsing or signing in.
  useEffect(() => {
    if (editId) return;
    const route = readPostRoute(params);
    if (Object.keys(route).length) setForm((current) => ({ ...current, ...route }));
  }, [params, editId]);

  function toggleCat(c: ParcelCategory) {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parcelSchema.safeParse(form);
    if (!parsed.success) {
      const errs = zodErrors(parsed.error);
      setTouched((t) => ({ ...t, ...Object.fromEntries(FIELD_ORDER.map((f) => [f, true])) }));
      setErrors(errs);
      focusFirstInvalid(errs);
      return;
    }
    if (!declarationSchema.safeParse(briefDeclaration(form.description, declaration)).success) {
      setErrors({ _submit: s.invalid });
      document.getElementById("parcel-declaration")?.scrollIntoView({ block: "center" });
      return;
    }
    if (!session || submitting || uploading || declarationLoading || declarationLoadError) return;
    setSubmitting(true);
    try {
      if (!editId && !dupWarning && (await hasDuplicateParcel(parsed.data))) {
        setDupWarning(true);
        setSubmitting(false);
        return;
      }
      if (editId) {
        await updateParcel(editId, { ...parsed.data, categories: cats.length ? cats : ["other"], declaration });
      } else {
        await addParcel({ ...parsed.data, categories: cats.length ? cats : ["other"], declaration });
      }
      router.push(editId && params.get("next") ? safeReturnPath(params.get("next")) : "/parcels");
    } catch (e) {
      setErrors({ _submit: e && typeof e === "object" && "message" in e ? String(e.message) : t.postParcel.submitError });
      setSubmitting(false);
    }
  }

  useEffect(() => { setDupWarning(false); }, [form.fromCountry, form.toCountry, form.neededBy]);

  // Clear stale submit errors as soon as the sender corrects the form/checkbox.
  useEffect(() => { setErrors(touchedErrors(parcelSchema, form, touched)); }, [form, touched, declaration]);

  const set = (k: string) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "description") setDeclaration((d) => briefDeclaration(v, { ...d, attested: false }));
  };

  const touch = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));
  const cls = (k: string) => (errors[k] ? "field field-invalid" : "field");
  const err = (k: string) =>
    errors[k]
      ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` }
      : {};

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        {editId ? t.postParcel.editTitle : t.postParcel.title}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {s.postNote}
      </p>

      <form onSubmit={submit} className="card mt-6 p-6 sm:p-8" noValidate>
        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fromCountry" className="field-label">{t.postTrip.fromCountry}</label>
            <div className={errors.fromCountry ? "[&>select]:border-danger" : undefined}>
              <CountrySelect id="fromCountry" value={form.fromCountry} onChange={(v) => { set("fromCountry")(v); touch("fromCountry")(); }} />
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
              onBlur={touch("fromCity")}
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
              <CountrySelect id="toCountry" value={form.toCountry} onChange={(v) => { set("toCountry")(v); touch("toCountry")(); }} />
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
              onBlur={touch("toCity")}
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
              onBlur={touch("neededBy")}
              {...err("neededBy")}
            />
            {errors.neededBy && (
              <p id="neededBy-error" className="field-error">{errors.neededBy}</p>
            )}
          </div>
          <div>
            <label htmlFor="weightKg" className="field-label">{requestWeightCopy[lang].label}</label>
            <input
              id="weightKg"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              className={cls("weightKg")}
              value={form.weightKg}
              onChange={(e) => set("weightKg")(e.target.value)}
              onBlur={touch("weightKg")}
              {...err("weightKg")}
            />
            <p className="mt-1 text-xs text-muted">{requestWeightCopy[lang].help}</p>
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
              onBlur={touch("budgetUsd")}
              {...err("budgetUsd")}
            />
            {errors.budgetUsd && (
              <p id="budgetUsd-error" className="field-error">{errors.budgetUsd}</p>
            )}
          </div>
        </div>

        {/* Extras */}
        <div className="mt-6 space-y-5 border-t border-line pt-5">


          <div>
            <label htmlFor="description" className="field-label">{t.postParcel.whatsInside}</label>
            <textarea
              id="description"
              className={`${cls("description")} min-h-[90px]`}
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              onBlur={touch("description")}
              placeholder={s.briefPlaceholder}
              maxLength={400}
              {...err("description")}
            />
            {errors.description && (
              <p id="description-error" className="field-error">{errors.description}</p>
            )}
          </div>
        </div>

        <div id="parcel-declaration" className="mt-6">
          <ContentsDeclaration descriptionProvided value={declaration} onChange={setDeclaration} onBusy={setUploading} disabled={submitting || uploading || declarationLoading || declarationLoadError}>
          <div>
            <span id="cats-label" className="field-label">{t.postParcel.categoriesLabel}</span>
            <div
              id="cats"
              tabIndex={-1}
              role="group"
              aria-labelledby="cats-label"
              aria-describedby={errors.cats ? "cats-error" : undefined}
              className="flex flex-wrap gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2"
            >
              {ALL_CATEGORIES.map((c) => {
                const selected = cats.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCat(c)}
                    aria-pressed={selected}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 ${
                      selected
                        ? "border-forest bg-forest text-white"
                        : "border-line-strong bg-white text-ink hover:border-forest"
                    }`}
                  >
                    {selected && <span aria-hidden>✓</span>}
                    {CATEGORY_LABELS[c]}
                  </button>
                );
              })}
            </div>
            {errors.cats && (
              <p id="cats-error" className="field-error">{errors.cats}</p>
            )}
          </div>
          </ContentsDeclaration>
          {declarationLoadError && <div className="mt-3"><p role="alert" className="field-error">{s.loadError}</p><button type="button" className="btn-ghost mt-2" onClick={() => setDeclarationAttempt((n) => n + 1)}>{s.retry}</button></div>}
        </div>

        {dupWarning && (
          <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-warn bg-sand px-4 py-3 text-sm leading-relaxed">
            <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0 text-warn" />
            <p>{t.postParcel.duplicateWarning}</p>
          </div>
        )}
        {errors._submit && (
          <p role="alert" className="field-error mt-4">{errors._submit}</p>
        )}
        <button type="submit" className="btn-accent mt-6 w-full py-3" disabled={submitting || uploading || declarationLoading || declarationLoadError}>
          {editId
            ? submitting ? t.postParcel.saving : t.postParcel.save
            : submitting ? t.postParcel.posting
            : dupWarning ? t.postParcel.postAnyway : t.postParcel.post}
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

export default function PostParcelPage() {
  return (
    <Suspense>
      <PostParcelForm />
    </Suspense>
  );
}
