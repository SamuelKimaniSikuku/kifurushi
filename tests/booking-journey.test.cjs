const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {deliveryMilestone}=require('../lib/deliveryOffers.ts');
const {bookingCopy}=require('../lib/locales/booking.ts');
test('timeline never treats a request or acceptance without terms as agreement',()=>{
 assert.equal(deliveryMilestone('requested'),0);assert.equal(deliveryMilestone('accepted'),0);assert.equal(deliveryMilestone('escrow_paid'),1);
 assert.equal(deliveryMilestone('picked_up'),2);assert.equal(deliveryMilestone('in_transit'),2);
 assert.equal(deliveryMilestone('delivered'),2);assert.equal(deliveryMilestone('released'),3);
});
test('both role guides and offer controls are translated',()=>{
 for(const lang of ['en','fr','sw']){const s=bookingCopy[lang];assert.equal(s.senderSteps.length,4);assert.equal(s.travellerSteps.length,4);assert.equal(s.steps.length,4);for(const key of Object.keys(bookingCopy.en))assert.ok(s[key],`${lang}.${key}`);}
});
