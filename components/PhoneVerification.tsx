"use client";
import { useEffect, useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { confirmPhoneCode, fetchPhoneVerification, sendPhoneCode } from "@/lib/trust";
import { useLang } from "@/lib/i18n";
const copy = {
 en: { verified: "Phone verified", unverified: "Number not verified", verify: "Verify number", send: "Send code", code: "Code from the SMS", confirm: "Confirm code", change: "Cancel", error: "Could not verify this number. Check the code or try again. If this number belongs to another account, contact support.", sent: "Code sent. Check your SMS.", setup: "SMS verification is not available yet. This number is saved as a contact only." },
 fr: { verified: "Téléphone vérifié", unverified: "Numéro non vérifié", verify: "Vérifier le numéro", send: "Envoyer le code", code: "Code reçu par SMS", confirm: "Confirmer le code", change: "Annuler", error: "Vérification impossible. Vérifiez le code ou réessayez. Si ce numéro appartient à un autre compte, contactez le support.", sent: "Code envoyé. Consultez vos SMS.", setup: "La vérification SMS n’est pas encore disponible. Ce numéro est enregistré uniquement comme contact." },
 sw: { verified: "Simu imethibitishwa", unverified: "Nambari haijathibitishwa", verify: "Thibitisha nambari", send: "Tuma msimbo", code: "Msimbo wa SMS", confirm: "Thibitisha msimbo", change: "Ghairi", error: "Uthibitisho umeshindikana. Angalia msimbo au jaribu tena. Ikiwa nambari ni ya akaunti nyingine, wasiliana na usaidizi.", sent: "Msimbo umetumwa. Angalia SMS.", setup: "Uthibitisho wa SMS bado haupatikani. Nambari hii imehifadhiwa kwa mawasiliano pekee." },
};
export default function PhoneVerification({ phone }: { phone: string }) {
 const {lang}=useLang(); const t=copy[lang];
 const [enabled,setEnabled]=useState(false), [verified,setVerified]=useState(false), [sent,setSent]=useState(false), [busy,setBusy]=useState(false);
 const [code,setCode]=useState(""),[error,setError]=useState(""),[ready,setReady]=useState(false),[retryAt,setRetryAt]=useState(0),[now,setNow]=useState(Date.now());
 useEffect(()=>{let live=true; setVerified(false); setSent(false); setCode(""); setReady(false);
  Promise.all([fetchPhoneVerification(),fetch(`${SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:SUPABASE_ANON_KEY}}).then(r=>{if(!r.ok)throw Error(); return r.json();})]).then(([v,settings])=>{if(live){setVerified(v.verified && v.phone===phone);setEnabled(settings.external?.phone===true && settings.phone_autoconfirm===false);setReady(true);}}).catch(()=>{if(live)setReady(true);});
  return ()=>{live=false;};
 },[phone]);
 useEffect(()=>{if(!retryAt)return; const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[retryAt]);
 async function send(){setBusy(true);setError("");try{await sendPhoneCode(phone);setSent(true);setRetryAt(Date.now()+60000);setNow(Date.now());}catch{setError(t.error);}finally{setBusy(false);}}
 async function confirm(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{await confirmPhoneCode(phone,code);setVerified(true);setSent(false);}catch{setError(t.error);}finally{setBusy(false);}}
 if(!ready)return null;
 return <div className="mt-3 text-xs text-muted"><p className={verified?"font-semibold text-success":""}>{verified?t.verified:t.unverified}</p>
 {!verified&&!enabled&&<p className="mt-1">{t.setup}</p>}
 {!verified&&enabled&&!sent&&<button type="button" className="min-h-11 font-semibold text-forest underline" disabled={busy} onClick={send}>{t.verify}</button>}
 {!verified&&sent&&<form className="mt-2 space-y-2" onSubmit={confirm}><p role="status">{t.sent}</p><label className="block">{t.code}<input className="field mt-1 max-w-48" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} minLength={6} maxLength={10} required disabled={busy}/></label><div className="flex flex-wrap gap-2"><button className="btn-primary min-h-11" disabled={busy}>{t.confirm}</button><button type="button" className="btn-ghost min-h-11" disabled={busy||now<retryAt} onClick={send}>{t.send}{now<retryAt?` (${Math.ceil((retryAt-now)/1000)})`:""}</button><button type="button" className="btn-ghost min-h-11" disabled={busy} onClick={()=>setSent(false)}>{t.change}</button></div></form>}
 {error&&<p role="alert" className="field-error">{error}</p>}</div>;
}
