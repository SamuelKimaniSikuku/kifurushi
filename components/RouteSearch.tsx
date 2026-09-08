"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftRight, Package, Plane, Search } from "lucide-react";
import CountrySelect from "./CountrySelect";
import { useT } from "@/lib/i18n";
import { browseHref, postHref } from "@/lib/routes";

export default function RouteSearch() {
  const t = useT().experience;
  const router = useRouter();
  const [role, setRole] = useState<"travel" | "send">("travel");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  return (
    <form className="route-search" onSubmit={(event) => {
      event.preventDefault();
      router.push(browseHref(role === "travel" ? "/parcels" : "/trips", { from, to }));
    }}>
      <fieldset className="grid grid-cols-2 gap-1 rounded-xl bg-sand p-1">
        <legend className="sr-only">{t.chooseRole}</legend>
        {(["travel", "send"] as const).map((value) => {
          const Icon = value === "travel" ? Plane : Package;
          return <label key={value} className="cursor-pointer">
            <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="peer sr-only" />
            <span className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-muted peer-checked:bg-forest peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-clay peer-focus-visible:ring-offset-2">
              <Icon size={17} aria-hidden />{value === "travel" ? t.travel : t.send}
            </span>
          </label>;
        })}
      </fieldset>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
        <div className="min-w-0"><label htmlFor="home-from" className="field-label">{t.from}</label><CountrySelect id="home-from" value={from} onChange={setFrom} placeholder={t.anyOrigin} /></div>
        <button type="button" className="btn-ghost h-12 w-10 px-0" aria-label={t.swap} onClick={() => { setFrom(to); setTo(from); }}><ArrowLeftRight size={17} aria-hidden /></button>
        <div className="min-w-0"><label htmlFor="home-to" className="field-label">{t.to}</label><CountrySelect id="home-to" value={to} onChange={setTo} placeholder={t.anyDestination} /></div>
      </div>
      <button className="btn-accent mt-4 min-h-12 w-full text-base" type="submit"><Search size={18} aria-hidden />{role === "travel" ? t.browseParcels : t.browseTrips}</button>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">{t.browseNote}</span>
        <Link className="font-semibold text-forest underline underline-offset-4" href={postHref(role === "travel" ? "trip" : "parcel", { from, to })}>{role === "travel" ? t.postTrip : t.postParcel}</Link>
      </div>
    </form>
  );
}
