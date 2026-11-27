const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {acceptsContents}=require('../supabase/functions/_shared/itemCategories.ts');
function runWorker(slug, seed, body, secret='secret'){
 let handler;const sent=[];
 class Q{constructor(table){this.table=table;this.filters=[];}select(){return this;}eq(k,v){this.filters.push(r=>r[k]===v);return this;}neq(k,v){this.filters.push(r=>r[k]!==v);return this;}gte(k,v){this.filters.push(r=>r[k]>=v);return this;}lte(k,v){this.filters.push(r=>r[k]<=v);return this;}or(){return this;}order(){return this;}limit(){return this;}maybeSingle(){this.single=true;return this;}throwOnError(){return this;}then(resolve,reject){return Promise.resolve().then(()=>{const rows=(seed[this.table]??[]).filter(r=>this.filters.every(f=>f(r)));return {data:this.single?rows[0]??null:rows,error:null};}).then(resolve,reject);}}
 const admin={from:table=>new Q(table),auth:{admin:{getUserById:async id=>({data:{user:{email:id+'@example.invalid'}}})}}};
 const ctx={acceptsContents,Date,Response,Request,URL,console,Deno:{env:{get:()=> 'secret'},serve:fn=>handler=fn},createClient:()=>admin,sendTrackedEmail:async(_admin,input)=>{sent.push(input);return true;},escapeHtml:s=>s.replaceAll('<','&lt;').replaceAll('>','&gt;')};
 const src=fs.readFileSync(`supabase/functions/${slug}/index.ts`,'utf8').replace(/^import .*\n/gm,'');
 vm.runInNewContext(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ctx);
 return handler(new Request('https://example.invalid',{method:'POST',headers:{'x-hook-secret':secret},body:JSON.stringify(body)})).then(response=>({sent,response}));
}
const future='2099-01-01';
const trip={id:'trip-id',status:'open',traveler_id:'traveller',from_country:'KE',to_country:'FR',from_city:'Nairobi',to_city:'Paris',depart_date:future,remaining_kg:10,price_per_kg:7,categories:['documents'],profile:{full_name:'Alex'}};
const parcel={id:'parcel-id',status:'open',safety_hold:false,sender_id:'sender',from_country:'KE',to_country:'FR',from_city:'Nairobi',to_city:'Paris',needed_by:future,weight_kg:null,budget_usd:30,categories:['documents'],profile:{full_name:'<img>'}};
const match={id:'match-id',status:'accepted',requester_id:'sender',updated_at:'2026-11-16T00:00:00Z',trip,parcel};
test('acceptance tells the requester and opens the exact delivery',async()=>{
 const {sent}=await runWorker('match-emails',{matches:[match],profiles:[{id:'sender',lang:'en',full_name:'Sender'},{id:'traveller',lang:'en',full_name:'<img>'}]},{match_id:'match-id',event:'accepted',actor:'traveller'});
 assert.equal(sent.length,1);assert.equal(sent[0].recipientId,'sender');assert.match(sent[0].html,/#delivery-match-id/);assert.match(sent[0].html,/&lt;img&gt;/);assert.doesNotMatch(sent[0].html,/<img>/);
});
test('a stale queued status event cannot tell someone a cancelled request was accepted',async()=>{
 const {sent}=await runWorker('match-emails',{matches:[{...match,status:'cancelled'}]},{match_id:'match-id',event:'accepted',actor:'traveller'});assert.equal(sent.length,0);
});
test('new trip alert reuses the sender’s parcel instead of asking them to post again',async()=>{
 const {sent}=await runWorker('new-listing-alerts',{trips:[trip],parcels:[parcel],profiles:[]},{kind:'trip',id:'trip-id'});
 assert.equal(sent.length,1);assert.match(sent[0].html,/dashboard\/listings\?kind=parcel&id=parcel-id/);assert.doesNotMatch(sent[0].html,/weight before acceptance/);
});
test('new parcel alert uses the fitting trip and escapes sender-supplied content',async()=>{
 const {sent}=await runWorker('new-listing-alerts',{trips:[trip],parcels:[parcel],profiles:[]},{kind:'parcel',id:'parcel-id'});
 assert.equal(sent.length,1);assert.match(sent[0].html,/kind=trip&id=trip-id/);assert.match(sent[0].html,/&lt;img&gt;/);
});
test('closed listings and unsupported parcel contents do not generate match alerts',async()=>{
 let result=await runWorker('new-listing-alerts',{trips:[{...trip,status:'closed'}],parcels:[parcel]},{kind:'trip',id:'trip-id'});assert.equal(result.sent.length,0);
 result=await runWorker('new-listing-alerts',{trips:[trip],parcels:[{...parcel,categories:['electronics']}]},{kind:'trip',id:'trip-id'});assert.equal(result.sent.length,0);
});
test('completed-delivery emails open that booking’s review',async()=>{
 const {sent}=await runWorker('match-emails',{matches:[{...match,status:'released'}],profiles:[]},{match_id:'match-id',event:'released',actor:'sender'});
 assert.equal(sent.length,1);assert.match(sent[0].html,/#review-match-id/);assert.match(sent[0].html,/Leave a review/);
});
test('message alerts keep opening chat rather than delivery actions',async()=>{
 const {sent}=await runWorker('match-emails',{matches:[match],messages:[{id:'msg1',match_id:'match-id',created_at:'2026-11-20T00:00:00Z'}],profiles:[]},{match_id:'match-id',event:'message',actor:'sender'});
 assert.equal(sent.length,1);assert.match(sent[0].html,/#messages-match-id/);assert.match(sent[0].html,/Read message/);
});

test('certificate alerts respect strict restrictions and broader document trips in both directions',async()=>{
 for(const kind of ['trip','parcel']){
  for(const categories of [['certificates'],['documents']]){
   const {sent}=await runWorker('new-listing-alerts',{trips:[{...trip,categories}],parcels:[{...parcel,categories:['certificates']}],profiles:[]},{kind,id:kind+'-id'});
   assert.equal(sent.length,1);
  }
  for(const categories of [['certificates','clothing'],['documents'],['other'],[]]){
   const {sent}=await runWorker('new-listing-alerts',{trips:[{...trip,categories:['certificates']}],parcels:[{...parcel,categories}],profiles:[]},{kind,id:kind+'-id'});
   assert.equal(sent.length,0);
  }
 }
});
