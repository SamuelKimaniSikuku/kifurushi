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
  const dateMode = filters.month ? "month" : filters.date ? "date" : "any";
  function changeDateMode(mode: string) {
    // The controls always reflect the URL, including after back/forward or clear.
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (mode === "month") update({ month: filters.date.slice(0, 7) || today.slice(0, 7), date: "" });
    else if (mode === "date") update({ date: today, month: "" });
    else update({ date: "", month: "" });
  }
  return <>
    <fieldset className={`browse-filters ${kind === "trips" ? "browse-filters-trips" : ""}`} disabled={pending}>
      <legend className="sr-only">{kind === "trips" ? t.browseTrips : t.browseParcels}</legend>
      <div className="min-w-0"><label className="field-label" htmlFor={`${kind}-from`}>{t.from}</label><CountrySelect id={`${kind}-from`} value={filters.from} onChange={(from) => update({ from })} placeholder={t.anyOrigin} /></div>
      <button type="button" onClick={() => update({ from: filters.to, to: filters.from })} aria-label={t.swap} className="btn-ghost mx-auto h-12 w-12 shrink-0 p-0"><ArrowLeftRight size={18} aria-hidden /></button>
      <div className="min-w-0"><label className="field-label" htmlFor={`${kind}-to`}>{t.to}</label><CountrySelect id={`${kind}-to`} value={filters.to} onChange={(to) => update({ to })} placeholder={t.anyDestination} /></div>
      {kind === "trips" ? <div className="flex min-w-0 flex-wrap items-end gap-3 border-t border-line pt-4 md:col-span-3">
        <div className="w-full min-w-0 sm:w-56">
          <label className="field-label" htmlFor="trips-when">{t.travelDates}</label>
          <select id="trips-when" className="field" value={dateMode} onChange={(event) => changeDateMode(event.target.value)}>
            <option value="any">{t.anyDate}</option>
            <option value="month">{t.wholeMonth}</option>
            <option value="date">{t.byDate}</option>
          </select>
        </div>
        {dateMode === "month" && <div className="w-full min-w-0 sm:w-56">
          <label className="field-label" htmlFor="trips-month">{t.chooseMonth}</label>
          <input id="trips-month" type="month" className="field min-w-0" value={filters.month} placeholder="YYYY-MM" onChange={(event) => update({ month: event.target.value, date: "" })} />
        </div>}
        {dateMode === "date" && <div className="w-full min-w-0 sm:w-56">
          <label className="field-label" htmlFor="trips-date">{t.departBy}</label>
          <input id="trips-date" type="date" className="field min-w-0" value={filters.date} onChange={(event) => update({ date: event.target.value, month: "" })} />
        </div>}
        <button type="button" className="btn-ghost min-h-12 w-full sm:ml-auto sm:w-auto" onClick={clear} disabled={!filters.from && !filters.to && !filters.date && !filters.month}>{t.clear}</button>
      </div> : <>
        <div className="min-w-0"><label className="field-label" htmlFor="parcels-date">{t.travelOn}</label><input id="parcels-date" type="date" className="field" value={filters.date} onChange={(event) => update({ date: event.target.value })} /></div>
        <button type="button" className="btn-ghost min-h-12 w-full lg:w-auto" onClick={clear} disabled={!filters.from && !filters.to && !filters.date}>{t.clear}</button>
      </>}
    </fieldset>
    <p className="mt-3 text-sm text-muted">{t.dateNote}</p>
  </>;
}
