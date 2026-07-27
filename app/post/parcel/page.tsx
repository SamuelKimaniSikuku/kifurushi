"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CountrySelect from "@/components/CountrySelect";
import { parcelSchema, zodErrors, FieldErrors } from "@/lib/validation";
import { addParcel, getSession, isVerified } from "@/lib/store";
import { CATEGORY_LABELS } from "@/lib/types";

export default function PostParcelPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    fromCountry: "", fromCity: "", toCountry: "", toCity: "",
    neededBy: "", weightKg: "3", category: "gifts", description: "", budgetUsd: "50",
  });

  useEffect(() => {
    if (!getSession()) router.replace("/auth?next=/post/parcel");
  }, [router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parcelSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    const session = getSession()!;
    addParcel({
      ...parsed.data,
      senderName: session.name,
      senderVerified: isVerified(),
    });
    router.push("/parcels");
  }

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-[var(--forest)]">Send a parcel</h1>
      <p className="mt-1 text-sm text-[#5c6b63]">
        Describe what you&apos;re sending — travellers on your route get notified.
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
            <input className="field" value={form.fromCity} onChange={(e) => set("fromCity")(e.target.value)} placeholder="e.g. Paris" />
            {errors.fromCity && <p className="field-error">{errors.fromCity}</p>}
          </div>
          <div>
            <label className="field-label">To country</label>
            <CountrySelect value={form.toCountry} onChange={set("toCountry")} />
            {errors.toCountry && <p className="field-error">{errors.toCountry}</p>}
          </div>
          <div>
            <label className="field-label">To city</label>
            <input className="field" value={form.toCity} onChange={(e) => set("toCity")(e.target.value)} placeholder="e.g. Dakar" />
            {errors.toCity && <p className="field-error">{errors.toCity}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label">Needed by</label>
            <input type="date" className="field" value={form.neededBy} onChange={(e) => set("neededBy")(e.target.value)} />
            {errors.neededBy && <p className="field-error">{errors.neededBy}</p>}
          </div>
          <div>
            <label className="field-label">Weight (kg)</label>
            <input type="number" step="0.1" className="field" value={form.weightKg} onChange={(e) => set("weightKg")(e.target.value)} />
            {errors.weightKg && <p className="field-error">{errors.weightKg}</p>}
          </div>
          <div>
            <label className="field-label">Budget (USD)</label>
            <input type="number" step="1" className="field" value={form.budgetUsd} onChange={(e) => set("budgetUsd")(e.target.value)} />
            {errors.budgetUsd && <p className="field-error">{errors.budgetUsd}</p>}
          </div>
        </div>

        <div>
          <label className="field-label">Category</label>
          <select className="field" value={form.category} onChange={(e) => set("category")(e.target.value)}>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {errors.category && <p className="field-error">{errors.category}</p>}
        </div>

        <div>
          <label className="field-label">What&apos;s inside?</label>
          <textarea
            className="field min-h-[90px]"
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            placeholder="Be specific — travellers will inspect the contents with you before sealing."
          />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>

        <div className="rounded-xl bg-[var(--sand-deep)] px-4 py-3 text-xs text-[#4a5a51]">
          🚫 No cash, batteries loose in luggage, liquids over 100ml, perishables,
          weapons, or anything illegal in either country — full list on the{" "}
          <a href="/safety#prohibited" className="font-semibold underline">prohibited items page</a>.
          Misdeclared contents forfeit platform protection.
        </div>

        <button type="submit" className="btn-accent w-full py-3">Post parcel request</button>
      </form>
    </div>
  );
}
