"use client";
import Link from 'next/link';
import type {MatchDetail} from '@/lib/db';
import {nextSteps} from '@/lib/matching';
export default function NextSteps({matches,userId}:{matches:MatchDetail[];userId:string}){
 const steps=nextSteps(matches,userId);
 return <div className="mb-4 rounded-2xl border border-line bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-forest">Your next step</h2><Link className="text-sm font-semibold text-forest underline" href="/dashboard/listings">My listings & matches →</Link></div>
 {steps.length?<ul className="mt-2 divide-y divide-line">{steps.slice(0,2).map(s=><li key={s.id}><Link className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2 text-sm" href={s.href}><span>{s.counterpartyName} · {s.route}</span><span className="font-semibold text-forest">{s.label} →</span></Link></li>)}</ul>:<p className="mt-2 text-sm text-muted">Check My listings for suitable people, or update a parcel that still needs a traveller.</p>}
 </div>;
}
