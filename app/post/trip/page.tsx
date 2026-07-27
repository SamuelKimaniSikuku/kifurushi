"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CountrySelect from "@/components/CountrySelect";
import { tripSchema, zodErrors, FieldErrors } from "@/lib/validation";
import { addTrip, getSession, isVerified } from "@/lib/store";
import { CATEGORY_LABELS, ParcelCategory } from "@/lib/types";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ParcelCategory[];

export default function PostTripPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    fromCountry: "", fromCity: "", toCountry: "", toCity: "",
    departDate: "", spaceKg: "10", pricePerKg: "9", notes: "",
  });
  const [cats, setCats] = useState<ParcelCategory[]>(["documents", "clothing", "gifts"]);

  useEffect(() => {
    if (!getSession()) router.replace("/auth?next=/post/trip");
  }, [router]);

  function toggleCat(c: ParcelCategory) {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = tripSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    if (cats.length === 0) {
      setErrors({ cats: "Pick at least one category you'll accept" });
      return;
    }
    const session = getSession()!;
    addTrip({
      ...parsed.data,
      travelerName: session.name,
      travelerVerified: isVerified(),
      travelerRating: 5,
      tripsCompleted: 0,
      categoriesAccepted: cats,
    });
    router.push("/trips");
  }

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-[var(--forest)]">Post a trip</h1>
      <p className="mt-1 text-sm text-[#5c6b63]">
        Tell senders where you&apos;re flying and how much space you have.
      </p>

      <form onSubmit={submit} className="card mt-6 space-y-5 p-6" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">From country</label>
            <CountrySelect value={form.fromCountry} onChange={set("fromCountry")} />
            {errors.fromCountry && <p className="field-error">{errors.fromCountry}</p>}
          </div>
          <div>
            <label className="field-label">From city</label>
            <input className="field" value={form.fromCity} onChange={(e) => set("fromCity")(e.target.value)} placeholder="e.g. London" />
            {errors.fromCity && <p className="field-error">{errors.fromCity}</p>}
          </div>
          <div>
            <label className="field-label">To country</label>
            <CountrySelect value={form.toCountry} onChange={set("toCountry")} />
            {errors.toCountry && <p className="field-error">{errors.toCountry}</p>}
          </div>
          <div>
            <label className="field-label">To city</label>
            <input className="field" value={form.toCity} onChange={(e) => set("toCity")(e.target.value)} placeholder="e.g. Lagos" />
            {errors.toCity && <p className="field-error">{errors.toCity}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label">Departure date</label>
            <input type="date" className="field" value={form.departDate} onChange={(e) => set("departDate")(e.target.value)} />
            {errors.departDate && <p className="field-error">{errors.departDate}</p>}
          </div>
          <div>
            <label className="field-label">Space (kg)</label>
            <input type="number" step="0.5" className="field" value={form.spaceKg} onChange={(e) => set("spaceKg")(e.target.value)} />
            {errors.spaceKg && <p className="field-error">{errors.spaceKg}</p>}
          </div>
          <div>
            <label className="field-label">Price per kg (USD)</label>
            <input type="number" step="1" className="field" value={form.pricePerKg} onChange={(e) => set("pricePerKg")(e.target.value)} />
            {errors.pricePerKg && <p className="field-error">{errors.pricePerKg}</p>}
          </div>
        </div>

        <div>
          <label className="field-label">Categories you&apos;ll accept</label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggleCat(c)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  cats.includes(c)
                    ? "border-[var(--forest)] bg-[var(--forest)] text-white"
                    : "border-[#d8cfbc] bg-white text-[#4a5a51]"
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          {errors.cats && <p className="field-error">{errors.cats}</p>}
        </div>

        <div>
          <label className="field-label">Notes (optional)</label>
          <textarea
            className="field min-h-[80px]"
            value={form.notes}
            onChange={(e) => set("notes")(e.target.value)}
            placeholder="Airline, pickup arrangements, anything senders should know…"
          />
          {errors.notes && <p className="field-error">{errors.notes}</p>}
        </div>

        <div className="rounded-xl bg-[var(--sand-deep)] px-4 py-3 text-xs text-[#4a5a51]">
          🛡 You&apos;ll inspect and co-seal every parcel before carrying it. Never
          accept a sealed package you haven&apos;t seen inside — see{" "}
          <a href="/safety" className="font-semibold underline">traveller safety rules</a>.
        </div>

        <button type="submit" className="btn-primary w-full py-3">Publish trip</button>
      </form>
    </div>
  );
}
