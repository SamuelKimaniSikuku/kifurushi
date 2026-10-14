const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
 const {outputText}=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}});
 module._compile(outputText,filename);
};
const { requestWeightSchema, parcelSchema } = require('../lib/validation.ts');
test('unknown and zero weights are stored as unknown, never guessed',()=>{
 for(const weight of ['', '  ', 0, '0', '0.0', null, undefined]) assert.equal(requestWeightSchema.parse(weight),null);
});
test('valid estimates are retained even above a traveller’s advertised 9 kg',()=>{
 for(const weight of [0.1,1,9,12,46]) assert.equal(requestWeightSchema.parse(String(weight)),weight);
});
test('negative, malformed and out-of-range estimates do not become unknown',()=>{
 for(const weight of [-1,'abc',NaN,Infinity,47,0.01]) assert.equal(requestWeightSchema.safeParse(weight).success,false);
});
test('envelope with 0 kg and $5 passes parcel validation as an unknown-weight request',()=>{
 const result=parcelSchema.parse({fromCountry:'KE',fromCity:'Nairobi',toCountry:'FR',toCity:'Paris',neededBy:'2099-10-17',weightKg:'0',budgetUsd:'5',description:'A document in a small envelope containing my birth certificate'});
 assert.equal(result.weightKg,null); assert.equal(result.budgetUsd,5);
});

test('listing and reminder templates describe unknown weight instead of reporting 0 kg',()=>{
 const vm=require('node:vm');
 for(const name of ['new-listing-alerts','listing-nudges']) {
  const source=fs.readFileSync(`supabase/functions/${name}/index.ts`,'utf8').replace(/^import .*;\n/gm,'')+'\nmodule.exports=T;';
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const context={module:{exports:{}},Deno:{serve:()=>{}}};
  vm.runInNewContext(js,context);
  for(const lang of ['en','fr','sw']) {
   const copy=context.module.exports[lang];
   const ctx={kg:null,budget:5,name:'Test',sender:'Test',from:'Nairobi',to:'Paris',city:'Paris',days:2,needed:'17 Oct',tripDate:'17 Oct'};
   const texts=name==='new-listing-alerts'?[copy.parcelBody(ctx)]:[copy.pendingAskBody(ctx),copy.pendingOfferBody(ctx)];
   for(const text of texts) {assert.doesNotMatch(text,/null|undefined|0 kg|kg 0/); assert.match(text,lang==='en'?/weight to agree/i:lang==='fr'?/poids à convenir/i:/uzito wa kukubaliana/i);}
  }
 }
});
