const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {acceptsContents,weightInKg,displayWeight,parcelDetailsSchema}=require('../lib/parcelContents.ts');
const {fittingTrips,fittingParcels}=require('../lib/matching.ts');
const {categoryNames,parcelContentsCopy}=require('../lib/locales/parcelContents.ts');
test('certificates-only accepts explicitly classified certificates and rejects mixed, generic and unknown contents',()=>{
 assert.equal(acceptsContents(['certificates'],['certificates']),true);
 for(const items of [[],['documents'],['other'],['certificates','clothing'],['certificates','documents']])assert.equal(acceptsContents(['certificates'],items),false);
 assert.equal(acceptsContents(['documents'],['certificates']),true);
 assert.equal(acceptsContents(['other'],['certificates']),false);
 assert.equal(acceptsContents(['certificates','clothing'],['certificates','clothing']),true);
});
test('suggestions obey the same rule in both directions without blocking unknown weight',()=>{
 const p={senderId:'s',fromCountry:'FR',toCountry:'KE',neededBy:'2027-01-20',weightKg:null,categories:['certificates']};
 const t={travelerId:'t',fromCountry:'FR',toCountry:'KE',departDate:'2027-01-10',remainingKg:1,categoriesAccepted:['certificates']};
 assert.equal(fittingTrips(p,[t],'2027-01-01').length,1);assert.equal(fittingParcels(t,[p],'2027-01-01').length,1);
 assert.equal(fittingTrips({...p,categories:['certificates','food']},[t],'2027-01-01').length,0);
 assert.equal(fittingParcels(t,[{...p,categories:['documents']}],'2027-01-01').length,0);
});
test('grams and small weights preserve amounts without inventing unknown weights',()=>{
 assert.equal(weightInKg('50','g'),'0.05');assert.equal(weightInKg('300','g'),'0.3');assert.equal(weightInKg('5','kg'),'5');assert.equal(weightInKg('','g'),'');assert.equal(displayWeight(0.05),'50 g');assert.equal(displayWeight(1),'1 kg');
});
test('metadata allows unknown quantity but rejects decimal counts and unknown package types',()=>{
 const base={packageType:'envelope',weightKind:null,itemCount:''};assert.equal(parcelDetailsSchema.parse(base).itemCount,null);
 for(const itemCount of ['1.5','0','-1','10001'])assert.equal(parcelDetailsSchema.safeParse({...base,itemCount}).success,false);
 assert.equal(parcelDetailsSchema.safeParse({...base,packageType:''}).success,false);
});
test('all supported languages cover category choices and parcel details',()=>{
 for(const lang of ['en','fr','sw']){assert.deepEqual(Object.keys(categoryNames[lang]),Object.keys(categoryNames.en));for(const k of Object.keys(parcelContentsCopy.en))assert.ok(parcelContentsCopy[lang][k]);}
});
