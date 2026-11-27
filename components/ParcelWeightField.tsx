"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { parcelContentsCopy } from "@/lib/locales/parcelContents";
import { weightInKg } from "@/lib/parcelContents";
export default function ParcelWeightField({value,onChange,kind,onKind,id="weightKg",error}:{value:string;onChange:(v:string)=>void;kind:"measured"|"estimated";onKind:(v:"measured"|"estimated")=>void;id?:string;error?:string}){
 const {lang}=useLang();const s=parcelContentsCopy[lang];const [unit,setUnit]=useState<"kg"|"g">("kg");
 const [displayed,setDisplayed]=useState(value);
 useEffect(()=>{
  if(weightInKg(displayed,unit)!==value) setDisplayed(value && unit==="g" && Number.isFinite(Number(value)) ? String(Number((Number(value)*1000).toPrecision(12))) : value);
 },[value,unit,displayed]);
 return <div><label htmlFor={id} className="field-label">{s.weight}</label><div className="flex gap-2"><input id={id} type="number" min="0" step="any" inputMode="decimal" className="field min-w-0 flex-1" value={displayed} onChange={e=>{setDisplayed(e.target.value);onChange(weightInKg(e.target.value,unit));}} aria-invalid={!!error} aria-describedby={`${id}-help`} /><select aria-label={s.unit} className="field w-20 shrink-0 px-2" value={unit} onChange={e=>setUnit(e.target.value as "kg"|"g")}><option>kg</option><option>g</option></select></div>
 {Number(value)>0 && <select className="mt-2 rounded-lg border border-line bg-white p-2 text-xs" value={kind} aria-label={s.weightKind} onChange={e=>onKind(e.target.value as "measured"|"estimated")}><option value="estimated">{s.estimated}</option><option value="measured">{s.measured}</option></select>}
 <p id={`${id}-help`} className="mt-1 text-xs text-muted">{s.weightHelp}</p>{error && <p className="field-error">{error}</p>}</div>;
}
