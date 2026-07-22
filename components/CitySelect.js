'use client';

import { CITY_GROUPS, OTHER_VALUE } from '@/lib/locations';

// Dropdown of cities grouped by country.
// value: "City|Country" string ('' = none / any, '__other__' = free text)
// props:
//   placeholder — first option label (e.g. "Any city" for search, "Select a city…" for forms)
//   allowOther  — adds an "Other city…" option at the bottom (for posting forms)
//   compact     — smaller padding used in search bars
export default function CitySelect({ value, onChange, placeholder = 'Select a city…', allowOther = false, compact = false, required = false }) {
  const base = compact
    ? 'w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-kenya-green focus:border-transparent'
    : 'w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-kenya-green focus:border-transparent';

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className={base}>
      <option value="">{placeholder}</option>
      {CITY_GROUPS.map((g) => (
        <optgroup key={g.country} label={g.country}>
          {g.cities.map((c) => (
            <option key={c} value={`${c}|${g.country}`}>
              {c}
            </option>
          ))}
        </optgroup>
      ))}
      {allowOther && <option value={OTHER_VALUE}>Other city…</option>}
    </select>
  );
}
