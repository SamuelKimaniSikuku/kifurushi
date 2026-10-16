"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/db";

/** AAL is enforced again by the server. This is only the setup/sign-in UI. */
export default function AdminSecurity({children}:{children:ReactNode}) {
 const router=useRouter();const [ready,setReady]=useState(false),[loaded,setLoaded]=useState(false),[allowed,setAllowed]=useState(false),[factor,setFactor]=useState(""),[qr,setQr]=useState(""),[code,setCode]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{let live=true;async function load(){
  const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace('/auth?next='+encodeURIComponent(window.location.pathname));return;}
  if(!await isAdmin()){if(live){setAllowed(false);setLoaded(true);}return;}
  const {data,error}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();if(error)throw error;
  const factors=await supabase.auth.mfa.listFactors();if(factors.error)throw factors.error;
  if(live){setAllowed(true);setFactor(factors.data.totp.find(f=>f.status==='verified')?.id??'');setReady(data.currentLevel==='aal2');setLoaded(true);}
 }void load().catch(()=>{if(live)setError('Could not check administrator security. Please refresh.');});return()=>{live=false;};},[router]);
 async function enroll(){setBusy(true);setError('');try{
  const existing=await supabase.auth.mfa.listFactors();if(existing.error)throw existing.error;
  for(const f of existing.data.all.filter(f=>f.factor_type==='totp' && f.status==='unverified')){const result=await supabase.auth.mfa.unenroll({factorId:f.id});if(result.error)throw result.error;}
  const {data,error}=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'Kifurushi administrator'});if(error)throw error;
  setFactor(data.id);setQr(data.totp.qr_code.replace(/^data:image\/svg\+xml;utf-8,/, ""));
 }catch{setError('Could not start authenticator setup. Please try again.');}finally{setBusy(false);}}
 async function verify(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{
  const {error}=await supabase.auth.mfa.challengeAndVerify({factorId:factor,code});if(error)throw error;
  const result=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();if(result.error||result.data.currentLevel!=='aal2')throw Error();setCode('');setQr('');setReady(true);
 }catch{setError('That code was not accepted. Enter the latest code from your authenticator.');}finally{setBusy(false);}}
 if(ready)return <>{children}</>;
 return <main className="mx-auto max-w-md px-4 py-12"><h1 className="text-2xl font-bold text-forest">Administrator security</h1>{error&&<p role="alert" className="field-error mt-3">{error}</p>}
 {!loaded?<p className="mt-4">Checking access…</p>:!allowed?<p className="mt-4">This page is for Kifurushi administrators.</p>:<div className="card mt-5 space-y-4 p-5"><p className="text-sm text-muted">Use an authenticator app to protect private customer records and administrator actions.</p>
 {!factor?<button className="btn-primary min-h-11" disabled={busy} onClick={enroll}>Set up authenticator</button>:<form onSubmit={verify} className="space-y-3">
 {qr&&<><p className="text-sm">Scan this code with your authenticator app, then enter its six-digit code.</p>{/* Provider-generated SVG is displayed as an image, never injected as markup. */}{/* eslint-disable-next-line @next/next/no-img-element */}
<img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`} alt="Authenticator setup QR code" width={240} height={240} className="mx-auto max-w-full" /></>}
 <label className="block text-sm font-semibold">Authenticator code<input className="field mt-1" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} minLength={6} maxLength={6} required disabled={busy}/></label><button className="btn-primary min-h-11" disabled={busy}>Continue securely</button></form>}</div>}</main>;
}
