"use client";

import { ParcelRequest, CATEGORY_LABELS } from "@/lib/types";
import { label } from "@/lib/countries";

export default function ParcelCard({
  parcel,
  onOffer,
}: {
  parcel: ParcelRequest;
  onOffer?: (parcel: ParcelRequest) => void;
}) {
  const date = new Date(parcel.neededBy).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

  return (
    <article className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          {parcel.senderName}
          {parcel.senderVerified && (
            <span title="ID verified" className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              ✓ Verified
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-[var(--forest)]">${parcel.budgetUsd}</div>
          <div className="text-xs text-[#5c6b63]">{parcel.weightKg} kg</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{label(parcel.fromCountry)}</span>
        <span className="text-[var(--clay)]">→</span>
        <span>{label(parcel.toCountry)}</span>
      </div>
      <div className="text-xs text-[#5c6b63]">
        {parcel.fromCity} → {parcel.toCity} · needed by {date}
      </div>

      <span className="chip w-fit">{CATEGORY_LABELS[parcel.category]}</span>
      <p className="text-sm text-[#3d4a43]">{parcel.description}</p>

      {onOffer && (
        <button className="btn-primary mt-1 w-full" onClick={() => onOffer(parcel)}>
          Offer to carry this
        </button>
      )}
    </article>
  );
}
