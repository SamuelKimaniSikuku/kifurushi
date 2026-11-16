"use client";
import {useEffect} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import {useSession} from '@/lib/auth';
import {supabase} from '@/lib/supabase';
export default function NotificationVisit(){
 const {session}=useSession(); const params=useSearchParams(),pathname=usePathname(); const id=params.get('notice');
 useEffect(()=>{if(!session||!id||pathname==='/auth'||!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id))return;
  const record=()=>{if(document.visibilityState==='visible')void supabase.rpc('record_notification_visit',{p_id:id}).then(()=>{});};record();document.addEventListener('visibilitychange',record);return()=>document.removeEventListener('visibilitychange',record);
 },[session,id,pathname]);
 return null;
}
