"use client";

import { AFRICAN_COUNTRIES, DIASPORA_COUNTRIES } from "@/lib/countries";

export default function CountrySelect({
  value,
  onChange,
  placeholder = "Select country",
  id,
}: {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      <optgroup label="Africa (54 countries)">
        {AFRICAN_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Abroad — diaspora destinations">
        {DIASPORA_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
