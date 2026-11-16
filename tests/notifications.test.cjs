const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
const src=fs.readFileSync('supabase/functions/_shared/notifications.ts','utf8').replace(/^import .*\n/gm,'');
function harness(state='claimed',providerStatus=200){
 const mail=[],writes=[],incidents=[];
 const admin={rpc:async()=>({data:{id:'notice-id',state},error:null}),from:()=>({update:value=>({eq:async()=>{writes.push(value);return {error:null};}})})};
 const context={exports:{},URL,Date,Deno:{env:{get:()=> 'fake'}},logIncident:async(...x)=>incidents.push(x),fetch:async(_url,args)=>{mail.push(args);return new Response(JSON.stringify({id:'provider-id'}),{status:providerStatus});}};
 vm.runInNewContext(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021}}).outputText,context);
 return {...context.exports,admin,mail,writes,incidents};
}
const input={key:'request/m',recipientId:'recipient',kind:'request24',to:'person@example.invalid',html:'<a href="https://www.kifurushiapp.com/dashboard?source=email#messages-match-id">Open</a>',subject:'Request'};
test('tracked links retain the exact conversation and existing query parameters',()=>{
 const h=harness();const html=h.trackLinks(input.html,'notice-id');assert.match(html,/source=email&amp;notice=notice-id#messages-match-id/);
 assert.equal(h.trackLinks('<a href="https://example.org">Other</a>','id'),'<a href="https://example.org">Other</a>');
});
test('a busy, cooling down or already-sent email is never sent again',async()=>{
 for(const state of ['busy','cooldown','sent']){const h=harness(state);await h.sendTrackedEmail(h.admin,input);assert.equal(h.mail.length,0);}
});
test('successful provider acceptance and failed sends are recorded separately',async()=>{
 let h=harness();assert.equal(await h.sendTrackedEmail(h.admin,input),true);assert.equal(h.writes[0].status,'sent');assert.equal(h.mail[0].headers['Idempotency-Key'],'notice/notice-id');
 h=harness('claimed',429);assert.equal(await h.sendTrackedEmail(h.admin,input),false);assert.equal(h.writes[0].status,'failed');assert.equal(h.incidents.length,1);
});
test('test aliases are never emailed and user text is escaped',async()=>{
 const h=harness();assert.equal(await h.sendTrackedEmail(h.admin,{...input,to:'person+test@example.invalid'}),false);assert.equal(h.mail.length,0);assert.equal(h.escapeHtml('<img src=x>'), '&lt;img src=x&gt;');
});
