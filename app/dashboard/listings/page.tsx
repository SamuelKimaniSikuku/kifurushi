"use client";
import Link from 'next/link';
import {Suspense,useCallback,useEffect,useState,useRef} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {useSession} from '@/lib/auth';
import {useContactGate} from '@/lib/useContactGate';
import {supabase} from '@/lib/supabase';
import {fetchMyListings,fetchMyMatches,fetchTrips,fetchParcels,requestMatch,type OwnedListing,type MatchDetail} from '@/lib/db';
import type {Trip,ParcelRequest} from '@/lib/types';
import {fittingTrips,fittingParcels,listingHref,conversationHref,tripPromotion} from '@/lib/matching';
import {signInHref} from '@/lib/routes';
import TripCard from '@/components/TripCard';
import ParcelCard from '@/components/ParcelCard';

function Listings(){
 const gate=useContactGate(); const router=useRouter(),params=useSearchParams(); const {session,loading}=useSession();
 const [listings,setListings]=useState<OwnedListing[]|null>(null),[trips,setTrips]=useState<Trip[]>([]),[parcels,setParcels]=useState<ParcelRequest[]>([]),[matches,setMatches]=useState<MatchDetail[]>([]);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[history,setHistory]=useState(false);
 const currentUser=useRef(session?.userId); currentUser.current=session?.userId;
 const today=new Date().toISOString().slice(0,10);
 const refresh=useCallback(async()=>{const uid=currentUser.current;const [l,t,p,m]=await Promise.all([fetchMyListings(),fetchTrips(),fetchParcels(),fetchMyMatches()]);if(currentUser.current!==uid)return;setListings(l);setTrips(t);setParcels(p);setMatches(m);},[]);
 useEffect(()=>{if(loading)return;if(!session){setListings(null);router.replace(signInHref(`/dashboard/listings${window.location.search}`));return;}let live=true;refresh().catch(()=>{if(live)setError('Could not load your listings. Please try again.');});return()=>{live=false;};},[loading,session,router,refresh]);
 const selected=listings?.find(l=>l.id===params.get('id')&&l.kind===params.get('kind'));
 const visible=listings?.filter(l=>history?l.status!=='open'||l.date<today:l.status==='open'&&l.date>=today)??[];
 useEffect(()=>{if(selected&&(selected.status!=='open'||selected.date<today))setHistory(true);},[selected,today]);
 const related=selected?matches.filter(m=>selected.kind==='trip'?m.tripId===selected.id:m.parcelId===selected.id):[];
 const booked=related.some(m=>['accepted','escrow_paid','picked_up','in_transit','delivered','released','disputed'].includes(m.status));
 const freshlyPosted=params.get('posted')==='1' && selected && Date.now()-Date.parse((selected.parcel??selected.trip)!.createdAt)<2*86400000;
 const canManage=selected?.status==='open'&&!booked;
 const suggestions=selected?.parcel?fittingTrips(selected.parcel,trips,today):[];
 const parcelSuggestions=selected?.trip?fittingParcels(selected.trip,parcels,today):[];
 const later=selected?.parcel?fittingTrips(selected.parcel,trips,today,true):[];
 async function manage(action:'confirm'|'close'){
  if(!selected||busy)return;
  if(action==='close'&&!window.confirm('Close this listing? Existing conversations will remain available.'))return;
  setBusy(true);setError('');setNotice('');
  try{const {error}=await supabase.rpc('confirm_listing',{p_kind:selected.kind,p_id:selected.id,p_action:action});if(error)throw error;await refresh();setNotice(action==='confirm'?'Thanks — your listing is still available.':'Listing closed. Your conversations are kept in Messages.');}
  catch(e){setError(e&&typeof e==='object'&&'message' in e?String(e.message):'Could not update this listing. Please try again.');}finally{setBusy(false);}
 }
 async function connect(tripId:string,parcelId:string){
  if(busy)return;setBusy(true);setError('');
  try{const existing=matches.find(m=>m.tripId===tripId&&m.parcelId===parcelId&&!['cancelled','declined'].includes(m.status));if(existing){router.push(conversationHref(existing.id));return;}if(!await gate())return;await requestMatch(tripId,parcelId);const latest=await fetchMyMatches();const match=latest.find(m=>m.tripId===tripId&&m.parcelId===parcelId&&!['cancelled','declined'].includes(m.status));if(!match)throw new Error('Your request was sent. Open Messages to view it.');router.push(conversationHref(match.id));}
  catch(e){setError(e&&typeof e==='object'&&'message' in e?String(e.message):'Could not send the request. Refresh to check availability.');await refresh().catch(()=>{});}finally{setBusy(false);}
 }
 if(loading||!session)return <p className="p-6">Opening your listings…</p>;
 return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
  <Link href="/dashboard" className="text-sm font-semibold text-forest underline">← Messages</Link>
  <div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-display text-3xl font-bold text-forest">My listings</h1><p className="mt-2 text-muted">Find someone, keep your dates current and manage your next step.</p></div><div className={freshlyPosted?"hidden":"flex gap-2"}><Link className="btn-ghost" href="/post/trip">Post a trip</Link><Link className="btn-primary" href="/post/parcel">Send a parcel</Link></div></div>
  {error&&<div role="alert" className="mt-4 rounded-xl border border-line bg-white p-4"><p className="text-danger">{error}</p><button className="mt-2 underline" onClick={()=>refresh().then(()=>setError('')).catch(()=>{})}>Refresh listings</button></div>}
  {notice&&<p role="status" className="mt-4 rounded-xl bg-sage p-4 text-forest">{notice}</p>}
  {!listings?<p className="mt-6">Loading your listings…</p>:<div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
   <aside className={freshlyPosted?"hidden min-w-0 lg:block":"min-w-0"}><div className="mb-3 flex gap-2"><button className={history?'btn-ghost':'btn-primary'} onClick={()=>setHistory(false)}>Open</button><button className={history?'btn-primary':'btn-ghost'} onClick={()=>setHistory(true)}>Past & closed</button></div>
   <label className="mb-3 block text-sm font-semibold lg:hidden">Choose a listing<select className="field mt-2" value={visible.some(l=>l.id===selected?.id)?selected?.id:''} onChange={e=>{const item=visible.find(l=>l.id===e.target.value);if(item)router.push(listingHref(item.kind,item.id));}}><option value="" disabled>Select your trip or parcel</option>{visible.map(l=><option key={l.id} value={l.id}>{l.kind==='trip'?'Trip':'Parcel'}: {l.title} · {l.date}</option>)}</select></label>
   <nav aria-label="Your listings" className="hidden space-y-2 lg:block">{visible.map(l=><Link key={l.id} href={listingHref(l.kind,l.id)} aria-current={selected?.id===l.id?'page':undefined} className={`card block p-4 ${selected?.id===l.id?'ring-2 ring-forest':''}`}><span className="block text-xs uppercase text-muted">{l.kind==='trip'?'Travelling':'Sending a parcel'}</span><span className="mt-1 block font-semibold text-forest">{l.title}</span><span className="mt-1 block text-sm text-muted">{l.date} · {l.date<today&&l.status==='open'?'Update date':l.status}</span></Link>)}</nav>
   {!visible.length&&<p className="card p-4 text-sm text-muted">No {history?'past':'open'} listings here.</p>}
   </aside>
   <section className="min-w-0">{!selected?<div className="card p-6"><h2 className="text-xl font-bold text-forest">Choose a listing</h2><p className="mt-2 text-muted">See suitable people for your route, or update a parcel that still needs a traveller.</p>{listings.some(l=>l.status==='open'&&l.date<today)&&<button className="btn-ghost mt-4" onClick={()=>setHistory(true)}>Review listings with past dates</button>}</div>:<>
    <div className="card p-5 sm:p-6">
     {params.get('posted')==='1'&&<p role="status" className="mb-3 text-sm font-semibold text-forest">Your {selected.kind} is posted ✓</p>}
     <h2 className="font-display text-2xl font-bold text-forest">{selected.title}</h2><p className="mt-1 text-sm text-muted">{selected.kind==='trip'?'Departure':'Needed by'} {selected.date}</p>
     {canManage&&freshlyPosted?<p className="mt-4 text-sm text-muted">{suggestions.length+parcelSuggestions.length>0?'Choose someone below to discuss the fee and handover.':'We’ll email you when a suitable new listing appears. You can also adjust your dates below.'}</p>:canManage?<><h3 className="mt-5 font-semibold">{selected.kind==='parcel'?'Still sending this parcel?':'Is this trip still available?'}</h3>
      <p className="mt-1 text-sm text-muted">{selected.date<today?'Your date has passed. Choose a new date to appear in searches again.':'Keep your listing up to date so the right people can find you.'}</p>
      <div className="mt-3 flex flex-wrap gap-2">{selected.date>=today&&<button disabled={busy} className="btn-primary" onClick={()=>manage('confirm')}>Yes, still available</button>}<Link className="btn-ghost" href={`/post/${selected.kind}?edit=${selected.id}&next=${encodeURIComponent(listingHref(selected.kind,selected.id))}`}>Change date or details</Link><button disabled={busy} className="btn-ghost" onClick={()=>manage('close')}>Close listing</button></div>
      {selected.confirmedAt&&<p className="mt-3 text-xs text-muted">Availability confirmed {new Date(selected.confirmedAt).toLocaleDateString()}</p>}
     </>:<p className="mt-4 text-sm text-muted">{booked?'You have a booking. Continue in the conversation below.':'This listing is closed.'}</p>}
     {related.length>0&&<div className="mt-5 space-y-2 border-t border-line pt-4"><h3 className="font-semibold text-forest">Your conversations</h3>{related.map(m=><Link className="flex flex-wrap justify-between gap-2 rounded-xl bg-sand p-3 text-sm" href={conversationHref(m.id)} key={m.id}><span>{m.counterpartyName}</span><span className="font-semibold text-forest">{m.status==='requested'?'View request':m.status==='accepted'?'Agree details':m.status.replaceAll('_',' ')} →</span></Link>)}</div>}
    </div>
    {canManage&&selected.date>=today&&<div className="mt-6"><h2 className="text-xl font-bold text-forest">{selected.kind==='parcel'?'Travellers for your parcel':'Parcels for your trip'}</h2>
     <p className="mt-1 text-sm text-muted">Same country route and compatible dates. Confirm pickup and delivery cities, contents and the final fee in Messages.</p>
     {suggestions.length+parcelSuggestions.length===0?<div className="card mt-4 p-5"><h3 className="font-semibold">No suitable {selected.kind==='parcel'?'traveller':'parcel'} yet</h3><p className="mt-2 text-sm text-muted">We’ll email you when a suitable new listing is posted. You can also return here to check availability.</p>{later.length>0&&<p className="mt-3 text-sm"><strong>{later.length} traveller{later.length===1?'':'s'} leave after your deadline.</strong> If you can wait, change your date to see these options. Earliest departure: {[...later].sort((a,b)=>a.departDate.localeCompare(b.departDate))[0].departDate}.</p>}<Link className="btn-ghost mt-4" href={`/post/${selected.kind}?edit=${selected.id}&next=${encodeURIComponent(listingHref(selected.kind,selected.id))}`}>My dates are flexible</Link></div>:<div className="mt-4 grid gap-4 xl:grid-cols-2">{suggestions.map(t=><TripCard key={t.id} trip={t} working={busy} onRequest={()=>connect(t.id,selected.id)}/>)}{parcelSuggestions.map(p=><ParcelCard key={p.id} parcel={p} working={busy} onOffer={()=>connect(selected.id,p.id)}/>)}</div>}
     {selected.trip&&<button className="btn-ghost mt-4" onClick={()=>navigator.clipboard.writeText(tripPromotion(selected.trip!)).then(()=>setNotice('Trip announcement copied. Share it with a community for this route.')).catch(()=>setError('Could not copy. Use Share on the trip page.'))}>Copy trip announcement</button>}
    </div>}
   </>}</section>
  </div>}
 </div>;
}
export default function Page(){return <Suspense fallback={<p className="p-6">Loading…</p>}><Listings/></Suspense>;}
