"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Package, Plane } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { bookingCopy } from '@/lib/locales/booking';

export default function HowToStart() {
 const { lang } = useLang();
 const s = bookingCopy[lang];
 const [role, setRole] = useState<'sender' | 'traveller'>('sender');
 const steps = role === 'sender' ? s.senderSteps : s.travellerSteps;
 return <section id="how-it-works" className="border-y border-line bg-white">
  <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
   <h2 className="text-3xl font-bold text-forest">{s.guideTitle}</h2>
   <p className="mt-3 text-base text-muted">{s.guideNote}</p>
   <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={s.guideTitle}>
    {(['sender','traveller'] as const).map(r => <button key={r} type="button" aria-pressed={role===r} onClick={()=>setRole(r)} className={role===r?'btn-primary min-h-11':'btn-ghost min-h-11'}>{r==='sender'?<Package size={18} aria-hidden/>:<Plane size={18} aria-hidden/>}{s[r]}</button>)}
   </div>
   <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {steps.map(([title,body],i)=><li key={title} className="border-t-2 border-line pt-4"><span aria-hidden className="text-sm font-semibold text-clay">{i+1}</span><h3 className="mt-2 text-lg font-semibold text-forest">{title}</h3><p className="mt-2 text-base leading-relaxed text-muted">{body}</p></li>)}
   </ol>
   <p className="mt-6 text-sm text-muted">{s.direct}</p>
   <Link className="btn-accent mt-5" href={role==='sender'?'/post/parcel':'/post/trip'}>{role==='sender'?s.senderCta:s.travellerCta}</Link>
  </div>
 </section>;
}
