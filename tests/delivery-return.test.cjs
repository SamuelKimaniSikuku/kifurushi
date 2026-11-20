const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {deliveryPath,readDeliveryTarget,deliveryWhatsappHref,nextDeliveryAction}=require('../lib/deliveryReturn.ts');
const {safeReturnPath,signInHref,emailAuthReturnUrl,readEmailAuthReturn}=require('../lib/routes.ts');
const {agreementMessage}=require('../lib/deliveryAgreement.ts');
const base={id:'booking-123',status:'accepted',role:'sender',requesterId:'sender',requestAvailability:'available'};
test('WhatsApp drafts include an encoded private delivery return link in all languages',()=>{
 for(const lang of ['en','fr','sw']){
  const url=new URL(deliveryWhatsappHref('+33 600000000',base.id,lang));
  assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/33600000000');
  assert.match(url.searchParams.get('text'),/https:\/\/www.kifurushiapp.com\/dashboard#delivery-booking-123/);
  assert.equal(url.searchParams.size,1);
 }
});
test('message and delivery links open the correct conversation and tab',()=>{
 assert.deepEqual(readDeliveryTarget(deliveryPath(base.id).split('#')[1]),{id:base.id,view:'details'});
 assert.deepEqual(readDeliveryTarget('#messages-booking-123'),{id:base.id,view:'messages'});
 assert.equal(readDeliveryTarget('#ratings'),null);assert.equal(readDeliveryTarget('#delivery-%zz'),null);
});
test('password and email sign-in preserve the exact delivery even when auth replaces the hash',()=>{
 const target='/dashboard?notice=notice-1#delivery-booking-123';
 const auth=new URL(signInHref(target),'https://www.kifurushiapp.com');
 assert.equal(safeReturnPath(auth.searchParams.get('next')),target);
 const callback=new URL(emailAuthReturnUrl(auth.origin,target));
 callback.hash='access_token=test-only&refresh_token=test-only';
 assert.equal(readEmailAuthReturn(callback.search),target);
 assert.doesNotMatch(callback.search,/access_token|refresh_token/);
 assert.equal(readEmailAuthReturn(''),null);
});
test('email return destinations reject external URLs and remove nested return loops',()=>{
 for(const target of ['https://evil.invalid','//evil.invalid','/%2fevil.invalid','/\\evil.invalid','/auth']){
  assert.equal(readEmailAuthReturn(new URL(emailAuthReturnUrl('https://www.kifurushiapp.com',target)).search),'/dashboard');
 }
 assert.equal(readEmailAuthReturn('?returnTo=%2Fdashboard%3FreturnTo%3D%252Fdashboard'),'/dashboard');
});
test('next action respects ownership, availability, inspection and complaints',()=>{
 assert.equal(nextDeliveryAction({...base,status:'requested'},'sender'),'waiting');
 assert.equal(nextDeliveryAction({...base,status:'requested'},'traveller'),'respond');
 assert.equal(nextDeliveryAction({...base,status:'requested',requestAvailability:'booked_elsewhere'},'traveller'),'closed');
 assert.equal(nextDeliveryAction(base,'sender'),'agree');
 assert.equal(nextDeliveryAction({...base,status:'escrow_paid'},'sender',{hasDeclaration:true,mine:true,both:false,refused:false}),'waiting');
 assert.equal(nextDeliveryAction({...base,status:'escrow_paid',role:'traveler'},'traveller',{hasDeclaration:true,mine:true,both:true,refused:false}),'collect');
 assert.equal(nextDeliveryAction({...base,status:'escrow_paid'},'sender',{hasDeclaration:true,mine:false,both:false,refused:false}),'inspect');
 assert.equal(nextDeliveryAction({...base,status:'escrow_paid'},'sender',{hasDeclaration:false,mine:false,both:false,refused:false}),'declare');
 assert.equal(nextDeliveryAction({...base,status:'in_transit',canReportReceipt:true},'sender'),'receipt');
 assert.equal(nextDeliveryAction({...base,status:'released',canReview:true},'sender'),'review');
 assert.equal(nextDeliveryAction(base,'sender',undefined,true),'held');
 assert.equal(nextDeliveryAction({...base,status:'cancelled'},'sender'),'closed');
});
test('saving agreed details produces a reviewable message, never another person’s confirmation',()=>{
 const message=agreementMessage('30.50','EUR','Collect on Friday; deliver in Nairobi.','en');
 assert.match(message,/EUR 30.50/);assert.match(message,/please confirm/i);
 assert.match(message,/Collect on Friday/);assert.ok(message.length<2000);
 for(const args of [['','EUR','Details'],['-1','EUR','Details'],['Infinity','EUR','Details'],['0.001','EUR','Details'],['10','BAD','Details'],['10','EUR',''],['10','EUR','x'.repeat(501)]])assert.equal(agreementMessage(...args,'en'),null);
 assert.match(agreementMessage('0','KES','Free delivery','sw'),/KES 0.00/);
});
