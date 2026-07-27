"use client";

import { Trip, CATEGORY_LABELS } from "@/lib/types";
import { label } from "@/lib/countries";

export default function TripCard({
  trip,
  onRequest,
}: {
  trip: Trip;
  onRequest?: (trip: Trip) => void;
}) {
  const date = new Date(trip.departDate).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <article className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            {trip.travelerName}
            {trip.travelerVerified && (
              <span title="ID verified" className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                ✓ Verified
              </span>
            )}
          </div>
          <div className="text-xs text-[#5c6b63]">
            ★ {trip.travelerRating.toFixed(1)} · {trip.tripsCompleted} deliveries
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-[var(--forest)]">${trip.pricePerKg}<span className="text-xs font-medium text-[#5c6b63]">/kg</span></div>
          <div className="text-xs text-[#5c6b63]">{trip.spaceKg} kg free</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{label(trip.fromCountry)}</span>
        <span className="text-[var(--clay)]">✈</span>
        <span>{label(trip.toCountry)}</span>
      </div>
      <div className="text-xs text-[#5c6b63]">
        {trip.fromCity} → {trip.toCity} · departs {date}
      </div>

      {trip.notes && <p className="text-sm text-[#3d4a43]">{trip.notes}</p>}

      <div className="flex flex-wrap gap-1.5">
        {trip.categoriesAccepted.map((cat) => (
          <span key={cat} className="chip">{CATEGORY_LABELS[cat]}</span>
        ))}
      </div>

      {onRequest && (
        <button className="btn-accent mt-1 w-full" onClick={() => onRequest(trip)}>
          Request this traveller
        </button>
      )}
    </article>
  );
}
