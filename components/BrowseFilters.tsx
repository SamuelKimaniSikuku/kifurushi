"use client";

import { ArrowLeftRight } from "lucide-react";
import CountrySelect from "./CountrySelect";
import { useT } from "@/lib/i18n";
import type { RouteFilters } from "@/lib/routes";

export default function BrowseFilters({ kind, filters, update, clear, pending }: {
  kind: "trips" | "parcels";
  filters: RouteFilters;
  update: (values: Partial<RouteFilters>) => void;
  clear: () => void;
  pending: boolean;
}) {
  const t = useT().experience;
  return <>
    <fieldset className="browse-filters" disabled={pending}>
      <legend className="sr-only">{kind === "trips" ? t.browseTrips : t.browseParcels}</legend>
      <div className="min-w-0"><label className="field-label" htmlFor={`${kind}-from`}>{t.from}</label><CountrySelect id={`${kind}-from`} value={filters.from} onChange={(from) => update({ from })} placeholder={t.anyOrigin} /></div>
      <button type="button" onClick={() => update({ from: filters.to, to: filters.from })} aria-label={t.swap} className="btn-ghost mx-auto h-12 w-12 shrink-0 p-0"><ArrowLeftRight size={18} aria-hidden /></button>
      <div className="min-w-0"><label className="field-label" htmlFor={`${kind}-to`}>{t.to}</label><CountrySelect id={`${kind}-to`} value={filters.to} onChange={(to) => update({ to })} placeholder={t.anyDestination} /></div>
      <div className="min-w-0"><label className="field-label" htmlFor={`${kind}-date`}>{kind === "trips" ? t.departBy : t.travelOn}</label><input id={`${kind}-date`} type="date" className="field" value={filters.date} onChange={(event) => update({ date: event.target.value })} /></div>
      <button type="button" className="btn-ghost min-h-12 w-full lg:w-auto" onClick={clear} disabled={!filters.from && !filters.to && !filters.date}>{t.clear}</button>
    </fieldset>
    <p className="mt-3 text-sm text-muted">{t.dateNote}</p>
  </>;
}
