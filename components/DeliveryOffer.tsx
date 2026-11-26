"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { bookingCopy } from '@/lib/locales/booking';
import { AGREEMENT_CURRENCIES, agreementMessage } from '@/lib/deliveryAgreement';
import type { DeliveryOffer as Offer } from '@/lib/deliveryOffers';
import type { MatchStatus } from '@/lib/types';

export default function DeliveryOffer({matchId,status,myUserId,weight,paused,refreshKey,onChanged}:{
 matchId:string;status:MatchStatus;myUserId:string;weight:number|null;paused:boolean;refreshKey:string;onChanged:()=>void;
}) {
 const {lang}=useLang(),s=bookingCopy[lang];
 const [offers,setOffers]=useState<Offer[]|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[editing,setEditing]=useState(false);
 const [fee,setFee]=useState(''),[currency,setCurrency]=useState<string>('EUR'),[handover,setHandover]=useState('');
 const [previous,setPrevious]=useState<string|null>(null);
 const [viewing,setViewing]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(viewing)dialog.current?.showModal();else dialog.current?.close();},[viewing]);
 const submission=useRef<{key:string;id:string}|null>(null),live=useRef(true);
 useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
 const refresh=useCallback(async()=>{
  const {data,error}=await supabase.rpc('delivery_offers_for_match',{p_match:matchId});
  if(!live.current)return;
  if(error||!Array.isArray(data))throw new Error('load');
  setOffers(data);
  if(data.some((o:Offer)=>o.status==='accepted'))setEditing(false);
 },[matchId]);
 useEffect(()=>{refresh().catch(()=>{if(live.current)setError(s.failed);});},[refresh,refreshKey,status,s.failed]);
 const current=offers?.find(o=>o.status==='pending'||o.status==='accepted');
 const writable=status==='accepted'&&!paused;
 const past=offers?.filter(o=>o.id!==current?.id)??[];
 const money=(o:Offer)=>new Intl.NumberFormat(lang==='fr'?'fr-FR':lang==='sw'?'sw-KE':'en-GB',{style:'currency',currency:o.currency,currencyDisplay:'code'}).format(o.amount);
 function edit(){setPrevious(current?.status==='pending'?current.id:null);setFee(current?String(current.amount):'');setCurrency(current?.currency??'EUR');setHandover(current?.handover??'');setError('');setEditing(true);setViewing(true);submission.current=null;}
 async function act(work:()=>PromiseLike<{data:unknown;error:unknown}>){
  if(busy)return;setBusy(true);setError('');
  try{const {data,error}=await work();if(error||!Array.isArray(data))throw error??new Error('response');if(!live.current)return;setOffers(data);setEditing(false);setViewing(false);onChanged();}
  catch{if(live.current){setError(s.failed);await refresh().catch(()=>{});}}
  finally{if(live.current)setBusy(false);}
 }
 if(status==='requested')return null;
 if(offers?.length===0&&status!=='accepted')return null;
 return <section aria-label={s.title} className="shrink-0 border-b border-line bg-sand/40 px-4 py-3 text-sm">
  {!offers?<p role="status" className="text-muted">{s.loading}</p>:<div className="flex flex-wrap items-center justify-between gap-2">
   {current?<><p className="font-semibold text-forest">{current.status==='accepted'?s.agreed:s.pending} · {money(current)}</p><button type="button" className="btn-ghost min-h-11" onClick={()=>{setEditing(false);setViewing(true);}}>{s.reviewOfferButton}</button></>:writable&&<button type="button" className="btn-ghost min-h-11" onClick={edit}>{s.propose}</button>}
   {!current&&past.length>0&&<button type="button" className="min-h-11 underline" onClick={()=>{setEditing(false);setViewing(true);}}>{s.history}</button>}
  </div>}
  {!viewing&&error&&<p role="alert" className="mt-2 text-danger">{error} <button type="button" disabled={busy} className="min-h-11 underline" onClick={()=>refresh().then(()=>setError('')).catch(()=>setError(s.failed))}>{s.retry}</button></p>}
  <dialog ref={dialog} onCancel={e=>{if(busy)e.preventDefault();else{setViewing(false);setEditing(false);}}} onClose={()=>{setViewing(false);setEditing(false);}} className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-5 text-ink shadow-xl backdrop:bg-black/40" aria-label={s.title}>
   <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-forest">{s.title}</h2><button type="button" disabled={busy} className="btn-ghost min-h-11" onClick={()=>setViewing(false)}>{s.close}</button></div>
   {current&&!editing?<div>
    <p className="mb-2 font-semibold text-forest"><span>{current.status==='accepted'?s.agreed:s.pending}</span> · {money(current)}</p>
    <p className="text-muted">{current.weight_kg==null?s.unknown:`${current.weight_kg} kg`} · {current.proposer_id===myUserId?s.you:s.partner}</p>
    <p className="mt-2 whitespace-pre-wrap break-words">{current.handover}</p>
    <p className="mt-2 text-muted">{s.direct}</p>
    {current.status==='accepted'?<p className="mt-2 font-medium text-forest">{s.recorded}</p>:<>
     <p className="mt-2 text-muted">{current.proposer_id===myUserId?s.waiting:s.received}</p>
     {writable&&!editing&&<div className="mt-3 flex flex-wrap gap-2">
      {current.proposer_id!==myUserId&&<button type="button" disabled={busy} className="btn-primary min-h-11" onClick={()=>act(()=>supabase.rpc('respond_delivery_offer',{p_match:matchId,p_offer:current.id,p_accept:true}))}>{s.accept}</button>}
      <button type="button" disabled={busy} className="btn-ghost min-h-11" onClick={edit}>{s.counter}</button>
      {current.proposer_id!==myUserId&&<button type="button" disabled={busy} className="min-h-11 px-3 text-muted underline" onClick={()=>act(()=>supabase.rpc('respond_delivery_offer',{p_match:matchId,p_offer:current.id,p_accept:false}))}>{s.decline}</button>}
     </div>}
    </>}
   </div>:writable&&!editing&&<button type="button" className="btn-ghost min-h-11" onClick={edit}>{s.propose}</button>}
   {paused&&<p className="mt-2 text-muted">{s.paused}</p>}
   {editing&&writable&&<form className="mt-3 space-y-3 pb-1" onSubmit={e=>{
    e.preventDefault();if(!agreementMessage(fee,currency,handover,lang)){setError(s.invalid);return;}
    const key=JSON.stringify([matchId,fee,currency,handover,previous]);
    if(submission.current?.key!==key)submission.current={key,id:crypto.randomUUID()};
    void act(()=>supabase.rpc('propose_delivery_offer',{p_match:matchId,p_id:submission.current!.id,p_amount:Number(fee),p_currency:currency,p_handover:handover.trim(),p_previous:previous}));
   }}>
    <p className="font-medium">{weight==null?s.unknown:`${weight} kg`}</p><p className="text-muted">{s.weightHint}</p>
    <div className="grid grid-cols-2 gap-3"><label>{s.fee}<input className="field mt-1 w-full" type="number" inputMode="decimal" min="0" max="1000000" step="0.01" required value={fee} disabled={busy} onChange={e=>setFee(e.target.value)}/></label><label>{s.currency}<select className="field mt-1 w-full" value={currency} disabled={busy} onChange={e=>setCurrency(e.target.value)}>{AGREEMENT_CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></label></div>
    <label className="block">{s.handover}<textarea className="field mt-1 w-full" rows={2} maxLength={500} required value={handover} disabled={busy} onChange={e=>setHandover(e.target.value)}/></label>
    <p className="text-muted">{s.direct}</p>
    <div className="flex gap-2"><button disabled={busy} className="btn-primary min-h-11">{s.send}</button><button type="button" disabled={busy} className="btn-ghost min-h-11" onClick={()=>{setEditing(false);if(!current)setViewing(false);}}>{s.cancel}</button></div>
   </form>}
   {past.length>0&&<details className="mt-2"><summary className="min-h-11 cursor-pointer text-muted">{s.history} ({past.length})</summary><ul className="max-h-48 space-y-3 overflow-y-auto">{past.map(o=><li key={o.id} className="border-t border-line pt-2"><p className="font-medium">{money(o)} · {o.status==='declined'?s.declined:s.superseded}</p><p className="text-muted">{o.proposer_id===myUserId?s.you:s.partner} · {new Date(o.created_at).toLocaleString()}</p><p className="whitespace-pre-wrap break-words">{o.handover}</p></li>)}</ul></details>}
  {error&&<p role="alert" className="mt-2 text-danger">{error} <button type="button" disabled={busy} className="min-h-11 underline" onClick={()=>refresh().then(()=>setError('')).catch(()=>setError(s.failed))}>{s.retry}</button></p>}
  </dialog>
 </section>;
}
