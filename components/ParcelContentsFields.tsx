"use client";
import { useLang } from "@/lib/i18n";
import { ParcelCategory } from "@/lib/types";
import { categoryNames, parcelContentsCopy } from "@/lib/locales/parcelContents";
import { packageTypes } from "@/lib/parcelContents";
export default function ParcelContentsFields({ categories, onCategories, description, onDescription, itemCount, packageType, onDetails, error, prefix = "" }: {
 categories: ParcelCategory[]; onCategories: (cats: ParcelCategory[]) => void;
 description: string; onDescription: (v: string) => void; itemCount: string; packageType: string;
 onDetails: (key: "itemCount"|"packageType", value: string) => void; error?: string; prefix?: string;
}) {
 const {lang} = useLang(); const s = parcelContentsCopy[lang]; const names = categoryNames[lang];
 const hint = categories.some(c => c === "certificates" || c === "documents") ? s.documentHint : categories.includes("food") ? s.foodHint : categories.includes("electronics") ? s.electronicsHint : categories.includes("cosmetics") ? s.liquidHint : s.hint;
 return <div className="space-y-5">
 <fieldset id={`${prefix}cats`} tabIndex={-1} className="rounded-xl focus-visible:ring-2 focus-visible:ring-leaf" aria-describedby={error ? `${prefix}contents-error` : undefined}>
 <legend className="field-label">{s.categories}</legend><p className="mb-3 text-xs text-muted">{s.categoryHelp}</p>
 <div className="flex flex-wrap gap-2">{(Object.keys(names) as ParcelCategory[]).map(c => <button key={c} type="button" aria-pressed={categories.includes(c)} onClick={() => onCategories(categories.includes(c) ? categories.filter(x => x !== c) : [...categories,c])} className={`min-h-11 rounded-full border px-3 py-2 text-sm font-medium ${categories.includes(c) ? "border-forest bg-forest text-white" : "border-line-strong bg-white text-ink"}`}>{names[c]}</button>)}</div>
 </fieldset>
 <div><label className="field-label" htmlFor={`${prefix}description`}>{s.contents}</label><textarea id={`${prefix}description`} className="field min-h-[90px]" maxLength={400} value={description} onChange={e => onDescription(e.target.value)} placeholder={hint} aria-describedby={`${prefix}contents-help`} /><p id={`${prefix}contents-help`} className="mt-2 text-xs text-muted">{hint}</p></div>
 <div className="grid gap-4 sm:grid-cols-2"><div><label className="field-label" htmlFor={`${prefix}packageType`}>{s.package}</label><select className="field" id={`${prefix}packageType`} value={packageType} onChange={e => onDetails("packageType",e.target.value)}><option value="">{s.choosePackage}</option>{packageTypes.map(p => <option key={p} value={p}>{s[p]}</option>)}</select></div><div><label className="field-label" htmlFor={`${prefix}itemCount`}>{s.count}</label><input className="field" id={`${prefix}itemCount`} type="number" min="1" max="10000" step="1" inputMode="numeric" value={itemCount} onChange={e => onDetails("itemCount",e.target.value)} /></div></div>
 {error && <p role="alert" id={`${prefix}contents-error`} className="field-error">{error}</p>}
 </div>;
}
