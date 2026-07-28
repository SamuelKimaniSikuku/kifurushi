"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import CountrySelect from "@/components/CountrySelect";
import { tripSchema, zodErrors, FieldErrors } from "@/lib/validation";
import { addTrip } from "@/lib/db";
import { useSession, fetchIsMember } from "@/lib/auth";
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

export default function PostTripPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    fromCountry: "", fromCity: "", toCountry: "", toCity: "",
    departDate: "", spaceKg: "10", pricePerKg: "9", notes: "",
  });
  const [cats, setCats] = useState<ParcelCategory[]>(["documents", "clothing", "gifts"]);
  const [minDate, setMinDate] = useState("");

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
      const errs = { cats: "Pick at least one category you'll accept" };
      setErrors(errs);
      focusFirstInvalid(errs);
      return;
    }
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      await addTrip({ ...parsed.data, categoriesAccepted: cats });
      router.push("/trips");
    } catch {
      setErrors({ _submit: "Could not post your trip — please try again." });
      setSubmitting(false);
    }
  }

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
        Post a trip
      </h1>
      <p className="mt-2 text-sm text-muted">
        Tell senders where you&apos;re flying and how much space you have.
      </p>

      <form onSubmit={submit} className="card mt-6 p-6 sm:p-8" noValidate>
        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fromCountry" className="field-label">From country</label>
            <div className={errors.fromCountry ? "[&>select]:border-danger" : undefined}>
              <CountrySelect id="fromCountry" value={form.fromCountry} onChange={set("fromCountry")} />
            </div>
            {errors.fromCountry && (
              <p id="fromCountry-error" className="field-error">{errors.fromCountry}</p>
            )}
          </div>
          <div>
            <label htmlFor="fromCity" className="field-label">From city</label>
            <input
              id="fromCity"
              className={cls("fromCity")}
              value={form.fromCity}
              onChange={(e) => set("fromCity")(e.target.value)}
              placeholder="e.g. London"
              {...err("fromCity")}
            />
            {errors.fromCity && (
              <p id="fromCity-error" className="field-error">{errors.fromCity}</p>
            )}
          </div>
          <div>
            <label htmlFor="toCountry" className="field-label">To country</label>
            <div className={errors.toCountry ? "[&>select]:border-danger" : undefined}>
              <CountrySelect id="toCountry" value={form.toCountry} onChange={set("toCountry")} />
            </div>
            {errors.toCountry && (
              <p id="toCountry-error" className="field-error">{errors.toCountry}</p>
            )}
          </div>
          <div>
            <label htmlFor="toCity" className="field-label">To city</label>
            <input
              id="toCity"
              className={cls("toCity")}
              value={form.toCity}
              onChange={(e) => set("toCity")(e.target.value)}
              placeholder="e.g. Lagos"
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
            <label htmlFor="departDate" className="field-label">Departure date</label>
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
            <label htmlFor="spaceKg" className="field-label">Space (kg)</label>
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
            <label htmlFor="pricePerKg" className="field-label">Price per kg (USD)</label>
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
              Most travellers charge $7–12/kg. Couriers average ~${COURIER_RATE_PER_KG}/kg.
            </p>
          </div>
        </div>

        {/* Live earnings vs courier comparison */}
        {earnings > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-sand px-4 py-3.5 text-sm">
            <span className="font-semibold text-forest">
              You&apos;d earn ~${earnings} on this trip
            </span>
            {senderSavings > 0 && (
              <span className="text-muted">
                Senders pay ~${courierCost} for the same weight by courier —
                they save ~${senderSavings} with you
              </span>
            )}
          </div>
        )}

        {/* Extras */}
        <div className="mt-6 space-y-5 border-t border-line pt-5">
          <div>
            <span id="cats-label" className="field-label">Categories you&apos;ll accept</span>
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
            <label htmlFor="notes" className="field-label">Notes (optional)</label>
            <textarea
              id="notes"
              className={`${cls("notes")} min-h-[80px]`}
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
              placeholder="Airline, pickup arrangements, anything senders should know…"
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
            You&apos;ll inspect and co-seal every parcel before carrying it. Never
            accept a sealed package you haven&apos;t seen inside — see{" "}
            <a href="/safety" className="font-semibold underline">traveller safety rules</a>.
          </p>
        </div>

        {errors._submit && (
          <p role="alert" className="field-error mt-4">{errors._submit}</p>
        )}
        <button type="submit" className="btn-primary mt-6 w-full py-3" disabled={submitting}>
          {submitting ? "Publishing…" : "Publish trip"}
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
