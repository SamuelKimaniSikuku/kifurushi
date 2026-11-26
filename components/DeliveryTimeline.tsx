"use client";
import { useLang } from '@/lib/i18n';
import { bookingCopy } from '@/lib/locales/booking';
import { deliveryMilestone } from '@/lib/deliveryOffers';
import type { MatchStatus } from '@/lib/types';
export default function DeliveryTimeline({status}:{status:MatchStatus}) {
 const {lang}=useLang(),s=bookingCopy[lang],index=deliveryMilestone(status);
 return <div><ol aria-label={s.progress} className="grid grid-cols-4 gap-2">
  {s.steps.map((label,i)=><li key={label} aria-current={i===index?'step':undefined}><div className={`h-1 rounded-full ${i<=index?'bg-forest':'bg-sand-deep'}`}/><p className={`mt-2 text-sm ${i<=index?'font-semibold text-forest':'text-muted'}`}>{label}</p></li>)}
 </ol>{status==='requested'&&<p className="mt-2 text-sm text-muted">{s.requestNote}</p>}{status==='delivered'&&<p className="mt-2 text-sm text-muted">{s.arrivalNote}</p>}</div>;
}
