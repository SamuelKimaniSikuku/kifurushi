import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import {logIncident} from './incidents.ts';
export function escapeHtml(value:string){return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
export function trackLinks(html:string,id:string){
 return html.replace(/href="(https:\/\/www\.kifurushiapp\.com[^"<>]*)"/g,(_all,href)=>{const u=new URL(href.replaceAll('&amp;','&'));if(u.origin!=='https://www.kifurushiapp.com')return `href="${escapeHtml(href)}"`;u.searchParams.set('notice',id);return `href="${escapeHtml(u.toString())}"`;});
}
export async function sendTrackedEmail(admin:SupabaseClient, input:{key:string;recipientId:string;kind:string;matchId?:string;reminder?:boolean;to:string;subject:string;html:string}):Promise<boolean>{
 if(/\+test/i.test(input.to))return false;
 const key=Deno.env.get('RESEND_API_KEY');if(!key)return false;
 const {data:claim,error}=await admin.rpc('claim_notification',{p_key:input.key,p_recipient:input.recipientId,p_kind:input.kind,p_match:input.matchId??null,p_reminder:input.reminder??false});
 if(error)throw error;
 if(claim?.state==='sent')return true;
 if(claim?.state!=='claimed')return false;
 try{
  const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`notice/${claim.id}`},body:JSON.stringify({from:'Kifurushi <hello@kifurushiapp.com>',to:[input.to],subject:input.subject,html:trackLinks(input.html,claim.id)})});
  if(!result.ok)throw new Error(`Email provider rejected notification (${result.status})`);
  const body=await result.json();
  const {error:saveError}=await admin.from('notification_deliveries').update({status:'sent',sent_at:new Date().toISOString(),provider_id:body.id??null}).eq('id',claim.id);
  if(saveError)throw saveError;
  return true;
 }catch(e){
  await admin.from('notification_deliveries').update({status:'failed'}).eq('id',claim.id);
  await logIncident('email_send_failed','A notification could not be sent or recorded','severe',{kind:input.kind,notification_id:claim.id,error:String(e)});
  return false;
 }
}
