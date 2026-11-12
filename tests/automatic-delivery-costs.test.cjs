const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  }}).outputText, filename);
};
const { travellerEstimates, publishedCourierRates, parseEcbRate, convertCost, validCostRoute } = require('../lib/automaticDeliveryCosts.ts');
const { ALL_COUNTRIES } = require('../lib/countries.ts');
const today = '2026-11-12';
const trip = (changes={}) => ({id:'one', fromCountry:'FR', toCountry:'KE', departDate:'2026-12-02', remainingKg:10, pricePerKg:7, ...changes});
const rate = (to, weight, provider='colissimo', from='FR', day=today) => publishedCourierRates(from,to,weight,day).find(r=>r.provider===provider);

test('all supported international country pairs are selectable; unknown or same-country pairs are rejected',()=>{
  for(const from of ALL_COUNTRIES) for(const to of ALL_COUNTRIES) assert.equal(validCostRoute(from.code,to.code),from.code!==to.code);
  assert.equal(validCostRoute('XX','KE'),false);
});
test('traveller prices use the right direction, upcoming date and available capacity',()=>{
  const trips=[trip(),trip({id:'expired',departDate:'2026-11-11',pricePerKg:1}),trip({id:'full',remainingKg:0,pricePerKg:1}),trip({id:'small',remainingKg:1,pricePerKg:1}),trip({id:'reverse',fromCountry:'KE',toCountry:'FR',pricePerKg:1}),trip({id:'invalid',pricePerKg:NaN}),trip({id:'negative',pricePerKg:-1})];
  assert.deepEqual(travellerEstimates(trips,'FR','KE','5',today).map(r=>[r.trip.id,r.totalCents]),[['one',3500]]);
  assert.equal(travellerEstimates(trips,'FR','KE','11',today).length,0);
  assert.equal(travellerEstimates(trips,'FR','KE','0',today).length,0);
});
test('chooses lowest valid rate and keeps fractional weights exact',()=>{
  const result=travellerEstimates([trip(),trip({id:'cheap',pricePerKg:5})],'FR','KE','0,3',today);
  assert.equal(result[0].trip.id,'cheap'); assert.equal(result[0].totalCents,150);
  assert.equal(travellerEstimates([trip({remainingKg:.3})],'FR','KE','.301',today).length,0);
});
test('Colissimo uses ceiling weight bands, not a flat per-kg approximation',()=>{
  assert.equal(rate('KE','.3').cents,3519);
  assert.equal(rate('KE','1').cents,3919);
  assert.equal(rate('KE','1.001').cents,5399);
  assert.equal(rate('KE','3').cents,7869);
  assert.equal(rate('KE','5').cents,7869);
  assert.equal(rate('KE','5.001').cents,14899);
  assert.equal(rate('KE','20').cents,25689);
  assert.equal(rate('KE','20.001').cents,null);
});
test('Colissimo uses verified country zones and Europe’s different weight limit',()=>{
  assert.equal(rate('DE','5').cents,2859);
  assert.equal(rate('GB','5').cents,3259);
  assert.equal(rate('NO','5').cents,3989);
  assert.equal(rate('MA','5').cents,3989);
  assert.equal(rate('DE','30').cents,8799);
  assert.equal(rate('DE','30.001').cents,null);
  assert.equal(rate('TR','5').reason,'route');
});
test('DHL uses parcel bands, half-kg rounding and documented increments beyond 10 kg',()=>{
  assert.equal(rate('KE','.3','dhl').cents,19177);
  assert.equal(rate('KE','1','dhl').cents,24933);
  assert.equal(rate('KE','1.001','dhl').cents,28293);
  assert.equal(rate('KE','5','dhl').cents,47613);
  assert.equal(rate('KE','10.001','dhl').cents,77347);
  assert.equal(rate('KE','20','dhl').cents,132713);
  assert.equal(rate('KE','20.001','dhl').cents,135627);
  assert.equal(rate('KE','30','dhl').cents,190993);
  assert.equal(rate('KE','30.001','dhl').reason,'weight');
  assert.equal(rate('GB','.3','dhl').cents,10758);
  assert.equal(rate('DE','5','dhl').cents,17947);
});
test('does not reuse France exports for reverse routes or unknown origins',()=>{
  for(const provider of ['dhl','colissimo']) {
    assert.equal(rate('FR','1',provider,'KE').cents,null);
    assert.equal(rate('GB','1',provider,'ET').reason,'route');
    assert.equal(rate('ZZ','1',provider).cents,null);
    assert.equal(rate('FR','1',provider).cents,null);
  }
});
test('published figures expire automatically and invalid weights never return a price',()=>{
  for(const provider of ['dhl','colissimo']) {
    assert.equal(rate('KE','1',provider,'FR','2027-01-01').reason,'expired');
    assert.equal(rate('KE','1',provider,'FR','2025-12-31').reason,'expired');
    for(const weight of ['', '0', '-1', 'Infinity']) assert.equal(rate('KE',weight,provider).cents,null);
  }
});
test('every supported France export destination has an explicit DHL zone',()=>{
  for(const country of ALL_COUNTRIES.filter(c=>c.code!=='FR')) assert.notEqual(rate(country.code,'1','dhl').cents,null,country.code);
});
test('only recent valid ECB rates permit conversion',()=>{
  const xml = (date, rate='1.1127')=>`<Cube time='${date}'><Cube currency='USD' rate='${rate}'/></Cube>`;
  const now=Date.parse('2026-11-12T12:00:00Z');
  const fx=parseEcbRate(xml('2026-11-11'),now);
  assert.deepEqual(fx,{date:'2026-11-11',usdPerEur:1.1127});
  assert.equal(convertCost(3919,'EUR','USD',fx),4361);
  assert.equal(convertCost(700,'USD','EUR',fx),629);
  assert.equal(convertCost(700,'USD','USD',null),700);
  assert.equal(convertCost(3919,'EUR','USD',null),null);
  for(const value of [xml('2026-11-01'),xml('2026-11-13'),xml('2026-11-11','0'),xml('2026-02-31'),'<broken/>']) assert.equal(parseEcbRate(value,now),null);
});


test('Egypt uses its own USD export zones and rates',()=>{
  const uk=rate('GB','5','dhl','EG');
  assert.equal(uk.currency,'USD'); assert.equal(uk.cents,29543);
  assert.equal(rate('IN','5','dhl','EG').cents,35854);
  assert.equal(rate('GB','20','dhl','EG').cents,59863);
  assert.equal(rate('GB','20.001','dhl','EG').cents,60756);
  assert.equal(rate('GB','30','dhl','EG').cents,77723);
  assert.equal(rate('GB','1','colissimo','EG').reason,'route');
});
test('India uses native INR parcel rates, never a search-snippet value or a fabricated higher weight band',()=>{
  const egypt=rate('EG','5','dhl','IN');
  assert.equal(egypt.currency,'INR'); assert.equal(egypt.cents,2328500);
  assert.equal(rate('EG','.3','dhl','IN').cents,855800);
  assert.equal(rate('EG','10.001','dhl','IN').reason,'weight');
  for(const from of ['EG','IN']) for(const country of ALL_COUNTRIES.filter(c=>c.code!==from)) assert.notEqual(rate(country.code,'1','dhl',from).cents,null,`${from}-${country.code}`);
});
test('INR estimates convert through a verified reference rate and degrade to native currency without it',()=>{
  const xml="<Cube time='2026-11-11'><Cube currency='USD' rate='1.1127'/><Cube currency='INR' rate='104.2540'/></Cube>";
  const fx=parseEcbRate(xml,Date.parse('2026-11-12T12:00:00Z'));
  assert.equal(convertCost(2328500,'INR','USD',fx),24852);
  assert.equal(convertCost(2328500,'INR','EUR',fx),22335);
  assert.equal(convertCost(2328500,'INR','USD',{date:'2026-11-11',usdPerEur:1.1127}),null);
  assert.equal(convertCost(29543,'USD','USD',null),29543);
});
