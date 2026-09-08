"use client";

import { AFRICAN_COUNTRIES, DIASPORA_COUNTRIES } from "@/lib/countries";
import { useT } from "@/lib/i18n";

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
  const t = useT().experience;
  return (
    <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      <optgroup label={t.africa}>
        {AFRICAN_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name}
          </option>
        ))}
      </optgroup>
      <optgroup label={t.abroad}>
        {DIASPORA_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
