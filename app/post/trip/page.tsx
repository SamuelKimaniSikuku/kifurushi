"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Plane, ShieldCheck } from "lucide-react";
import CountrySelect from "@/components/CountrySelect";
import { tripSchema, zodErrors, FieldErrors } from "@/lib/validation";
import CorridorHint from "@/components/CorridorHint";
import {
  addTrip, CorridorFit, fetchTripById, fitForTrip, updateTrip,
} from "@/lib/db";
import { useSession, fetchIsMember } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { CATEGORY_LABELS, ParcelCategory } from "@/lib/types";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ParcelCategory[];

// What senders typically pay a courier per kg on Africa ↔ diaspora routes —
// baseline for the earnings/savings comparison shown on the form.
const COURIER_RATE_PER_KG = 14;

const FIELD_ORDER = [
  "fromCountry",
  "fromCity",
  "toCountry",
  "toCity",
  "departDate",
  "spaceKg",
  "pricePerKg",
  "cats",
  "notes",
];

function focusFirstInvalid(errs: FieldErrors) {
  const first = FIELD_ORDER.find((k) => errs[k]);
  if (!first) return;
  const el = document.getElementById(first);
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "center" });
}

function PostTripForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { session, loading } = useSession();
  const t = useT();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    fromCountry: "", fromCity: "", toCountry: "", toCity: "",
    departDate: "", spaceKg: "10", pricePerKg: "9", notes: "",
  });
  const [cats, setCats] = useState<ParcelCategory[]>(["documents", "clothing", "gifts"]);
  const [minDate, setMinDate] = useState("");
  const editId = params.get("edit");

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/auth?next=/post/trip");
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

  // Editing an existing trip: load it into the form.
  useEffect(() => {
    if (!editId) return;
    fetchTripById(editId)
      .then((trip) => {
        if (!trip) return;
        setForm({
          fromCountry: trip.fromCountry,
          fromCity: trip.fromCity,
          toCountry: trip.toCountry,
          toCity: trip.toCity,
          departDate: trip.departDate,
          spaceKg: String(trip.spaceKg),
          pricePerKg: String(trip.pricePerKg),
          notes: trip.notes,
        });
        setCats(trip.categoriesAccepted);
      })
      .catch(() => {});
  }, [editId]);

  // Arriving from "Offer to carry this": the route is already known.
  useEffect(() => {
    const fromCountry = params.get("fromCountry");
    if (!fromCountry) return;
    setForm((f) => ({
      ...f,
      fromCountry,
      fromCity: params.get("fromCity") ?? f.fromCity,
      toCountry: params.get("toCountry") ?? f.toCountry,
      toCity: params.get("toCity") ?? f.toCity,
    }));
  }, [params]);

  function toggleCat(c: ParcelCategory) {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = tripSchema.safeParse(form);
    if (!parsed.success) {
      const errs = zodErrors(parsed.error);
      setErrors(errs);
      focusFirstInvalid(errs);
      return;
    }
    if (cats.length === 0) {
      const errs = { cats: t.postTrip.categoriesError };
      setErrors(errs);
      focusFirstInvalid(errs);
      return;
    }
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      if (editId) {
        await updateTrip(editId, { ...parsed.data, categoriesAccepted: cats });
      } else {
        await addTrip({ ...parsed.data, categoriesAccepted: cats });
      }
      router.push("/trips");
    } catch {
      setErrors({ _submit: t.postTrip.submitError });
      setSubmitting(false);
    }
  }

  // Which parcels already waiting on this route does the chosen date serve?
  // Debounced because it fires on every keystroke in the date field.
  const [fit, setFit] = useState<CorridorFit | null>(null);
  useEffect(() => {
    const { fromCountry, toCountry, departDate } = form;
    if (!fromCountry || !toCountry || !departDate) {
      setFit(null);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      fitForTrip(fromCountry, toCountry, departDate)
        .then((f) => live && setFit(f))
        .catch(() => live && setFit(null));
    }, 350);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [form.fromCountry, form.toCountry, form.departDate, form]);

  // Live earnings maths for the comparison band. Courier baseline matches
  // the marketing copy (5 kg London→Lagos runs $50–80 by courier).
  const spaceNum = parseFloat(form.spaceKg);
  const priceNum = parseFloat(form.pricePerKg);
  const valid =
    Number.isFinite(spaceNum) && spaceNum > 0 &&
    Number.isFinite(priceNum) && priceNum > 0;
  const earnings = valid ? Math.round(spaceNum * priceNum) : 0;
  const courierCost = valid ? Math.round(spaceNum * COURIER_RATE_PER_KG) : 0;
  const senderSavings = Math.max(0, courierCost - earnings);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const cls = (k: string) => (errors[k] ? "field field-invalid" : "field");
  const err = (k: string) =>
    errors[k]
      ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` }
      : {};

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        {editId ? t.postTrip.editTitle : t.postTrip.title}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {t.postTrip.sub}
      </p>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-forest bg-forest px-5 py-4 text-sm leading-relaxed text-white">
        <Plane className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={2} aria-hidden />
        <p>{t.postTrip.roleBanner}</p>
      </div>

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
            <label htmlFor="departDate" className="field-label">{t.postTrip.departureDate}</label>
            <input
              id="departDate"
              type="date"
              min={minDate || undefined}
              className={cls("departDate")}
              value={form.departDate}
              onChange={(e) => set("departDate")(e.target.value)}
              {...err("departDate")}
            />
            {errors.departDate && (
              <p id="departDate-error" className="field-error">{errors.departDate}</p>
            )}
          </div>
          <div>
            <label htmlFor="spaceKg" className="field-label">{t.postTrip.space}</label>
            <input
              id="spaceKg"
              type="number"
              min={0.5}
              max={46}
              step={0.5}
              inputMode="decimal"
              className={cls("spaceKg")}
              value={form.spaceKg}
              onChange={(e) => set("spaceKg")(e.target.value)}
              {...err("spaceKg")}
            />
            {errors.spaceKg && (
              <p id="spaceKg-error" className="field-error">{errors.spaceKg}</p>
            )}
          </div>
          <div>
            <label htmlFor="pricePerKg" className="field-label">{t.postTrip.pricePerKg}</label>
            <input
              id="pricePerKg"
              type="number"
              min={1}
              max={100}
              step={1}
              inputMode="decimal"
              className={cls("pricePerKg")}
              value={form.pricePerKg}
              onChange={(e) => set("pricePerKg")(e.target.value)}
              {...err("pricePerKg")}
            />
            {errors.pricePerKg && (
              <p id="pricePerKg-error" className="field-error">{errors.pricePerKg}</p>
            )}
            <p id="pricePerKg-hint" className="mt-1 text-xs text-muted">
              {t.postTrip.priceHint(COURIER_RATE_PER_KG)}
            </p>
          </div>
        </div>

        {/* Does the chosen departure actually serve the parcels waiting here? */}
        <CorridorHint
          fit={fit}
          mode="trip"
          onUseSuggested={(d) => set("departDate")(d)}
        />

        {/* Live earnings vs courier comparison */}
        {earnings > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-sand px-4 py-3.5 text-sm">
            <span className="font-semibold text-forest">
              {t.postTrip.earnBand(earnings)}
            </span>
            {senderSavings > 0 && (
              <span className="text-muted">
                {t.postTrip.saveBand(courierCost, senderSavings)}
              </span>
            )}
          </div>
        )}

        {/* Extras */}
        <div className="mt-6 space-y-5 border-t border-line pt-5">
          <div>
            <span id="cats-label" className="field-label">{t.postTrip.categoriesLabel}</span>
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
                    type="button"
                    key={c}
                    onClick={() => toggleCat(c)}
                    aria-pressed={selected}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 ${
                      selected
                        ? "border-forest bg-forest text-white"
                        : "border-line-strong bg-white text-muted hover:border-forest hover:text-forest"
                    }`}
                  >
                    {selected && <Check size={16} strokeWidth={2} aria-hidden="true" />}
                    {CATEGORY_LABELS[c]}
                  </button>
                );
              })}
            </div>
            {errors.cats && (
              <p id="cats-error" className="field-error">{errors.cats}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="field-label">{t.postTrip.notes}</label>
            <textarea
              id="notes"
              className={`${cls("notes")} min-h-[80px]`}
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
              placeholder={t.postTrip.notesPlaceholder}
              {...err("notes")}
            />
            {errors.notes && (
              <p id="notes-error" className="field-error">{errors.notes}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-sand-deep px-4 py-3 text-xs leading-relaxed text-muted">
          <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0 text-forest" />
          <p>
            {t.postTrip.safetyNote}{" "}
            <a href="/safety" className="font-semibold underline">{t.postTrip.safetyLink}</a>.
          </p>
        </div>

        {errors._submit && (
          <p role="alert" className="field-error mt-4">{errors._submit}</p>
        )}
        <button type="submit" className="btn-primary mt-6 w-full py-3" disabled={submitting}>
          {editId
            ? submitting ? t.postTrip.saving : t.postTrip.save
            : submitting ? t.postTrip.publishing : t.postTrip.publish}
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

export default function PostTripPage() {
  return (
    <Suspense>
      <PostTripForm />
    </Suspense>
  );
}
