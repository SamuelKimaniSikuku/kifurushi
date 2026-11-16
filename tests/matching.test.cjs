const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {fittingTrips,fittingParcels,nextSteps,tripPromotion}=require('../lib/matching.ts');
const p={id:'p',senderId:'sender',fromCountry:'KE',toCountry:'FR',neededBy:'2026-12-01',weightKg:null,categories:['documents']};
const t={id:'t',travelerId:'traveller',fromCountry:'KE',toCountry:'FR',fromCity:'Nairobi',toCity:'Paris',departDate:'2026-11-20',remainingKg:3,pricePerKg:10,categoriesAccepted:['documents'],travelerVerified:false};
test('recommendations respect direction, dates, ownership, contents and space; unknown weight works',()=>{
 assert.equal(fittingTrips(p,[t],'2026-11-16').length,1);
 for(const change of [{travelerId:'sender'},{fromCountry:'FR',toCountry:'KE'},{departDate:'2026-11-15'},{departDate:'2026-12-02'},{remainingKg:0},{categoriesAccepted:['clothing']}])assert.equal(fittingTrips(p,[{...t,...change}],'2026-11-16').length,0);
 assert.equal(fittingTrips({...p,weightKg:4},[t],'2026-11-16').length,0);
 assert.equal(fittingParcels(t,[p],'2026-11-16').length,1);
});
test('later travellers are separate from current matches',()=>{
 const later={...t,departDate:'2026-12-03'};
 assert.deepEqual(fittingTrips(p,[t,later],'2026-11-16',true),[later]);
});
test('next step never asks a requester to accept their own request or revive a stale request',()=>{
 const m={id:'m',requesterId:'other',status:'requested',requestAvailability:'available',updatedAt:'2026-11-16'};
 assert.equal(nextSteps([m],'me').length,1);
 assert.equal(nextSteps([{...m,requesterId:'me'}],'me').length,0);
 assert.equal(nextSteps([{...m,requestAvailability:'booked_elsewhere'}],'me').length,0);
 assert.equal(nextSteps([{...m,status:'disputed'}],'me').length,0);
});
test('promotion uses actual route/date/price and does not claim pending verification is verified',()=>{
 const copy=tripPromotion(t);assert.match(copy,/Nairobi to Paris/);assert.match(copy,/\$10\/kg/);assert.match(copy,/verification is pending/);assert.match(copy,/trips\?open=t/);
});
