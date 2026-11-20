const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function harness(seed,opts={}){
 let reads=0;const sent=[];const context={exports:{},encodeURIComponent,Set,escapeHtml:s=>s.replaceAll('<','&lt;').replaceAll('>','&gt;'),sendTrackedEmail:async(_a,input)=>{sent.push(input);return !opts.failed;}};
 const source=fs.readFileSync('supabase/functions/_shared/delivery-followups.ts','utf8').replace(/^import .*\n/gm,'');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,context);
 const admin={rpc:async(_name,args)=>{reads++;if(opts.readError&&args)return {data:null,error:Error('Read failed')};return {data:args?(opts.changed?[]:seed.filter(c=>c.match_id===args.p_match_id)):seed,error:null};},auth:{admin:{getUserById:async id=>({data:{user:{email:opts.testAlias?'member+test@example.invalid':id+'@example.invalid'}},error:null})}}};
 return {...context.exports,sent,admin};
}
const c={match_id:'m1',recipient_id:'sender',stage:'receipt',route:'<img> → Nairobi',lang:'en'};
test('reminders include one exact delivery action and escape route text in all languages',()=>{
 const h=harness([]);
 for(const lang of ['en','fr','sw'])for(const stage of ['agreement','contents','inspection','collection','receipt','review']){
  const mail=h.followupEmail({...c,lang,stage});assert.match(mail.html,stage==='review'?/#review-m1/:/#delivery-m1/);assert.match(mail.html,/&lt;img&gt;/);assert.doesNotMatch(mail.html,/<img>/);
 }
});
test('the reminder worker deduplicates by participant and shares its cooldown with listing reminders',async()=>{
 const h=harness([c,{...c,match_id:'m2'}]);const seen=new Set();await h.sendDeliveryFollowups(h.admin,seen,false);
 assert.equal(h.sent.length,1);assert.equal(h.sent[0].key,'delivery-followup/m1/receipt/sender');assert.equal(h.sent[0].reminder,true);assert.ok(seen.has('sender'));
 await h.sendDeliveryFollowups(h.admin,seen,false);assert.equal(h.sent.length,1);
});
test('receipt, review or cancellation recorded during the run suppresses a stale reminder',async()=>{
 const h=harness([c],{changed:true});await h.sendDeliveryFollowups(h.admin,new Set(),false);assert.equal(h.sent.length,0);
});
test('lookup failures stop the send instead of assuming the action is still pending',async()=>{
 const h=harness([c],{readError:true});await assert.rejects(h.sendDeliveryFollowups(h.admin,new Set(),false),/Read failed/);assert.equal(h.sent.length,0);
});
test('preview checks eligibility but never sends; failed sends remain retryable',async()=>{
 let h=harness([c]);const plan=await h.sendDeliveryFollowups(h.admin,new Set(),true);assert.equal(plan.sent,0);assert.equal(plan.planned.delivery_receipt,1);assert.equal(h.sent.length,0);
 h=harness([c],{failed:true});const seen=new Set();await h.sendDeliveryFollowups(h.admin,seen,false);assert.equal(seen.size,0);
 await h.sendDeliveryFollowups(h.admin,seen,false);assert.equal(h.sent[0].key,h.sent[1].key);
});
test('test aliases never receive delivery reminders',async()=>{
 const h=harness([c],{testAlias:true});await h.sendDeliveryFollowups(h.admin,new Set(),false);assert.equal(h.sent.length,0);
});
