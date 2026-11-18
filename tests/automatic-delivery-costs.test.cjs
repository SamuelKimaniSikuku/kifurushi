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

const { averageTravellerPrice, effectivePricePerKg, parseReferenceRates, COST_CURRENCIES } = require('../lib/automaticDeliveryCosts.ts');
test('route average uses eligible listings equally, excludes unavailable trips and changes with parcel capacity',()=>{
  const trips=[trip({remainingKg:1}),trip({id:'two',pricePerKg:9}),trip({id:'past',departDate:'2026-01-01',pricePerKg:100}),trip({id:'reverse',fromCountry:'KE',toCountry:'FR',pricePerKg:50})];
  assert.deepEqual(averageTravellerPrice(travellerEstimates(trips,'FR','KE','1',today)),{count:2,rateCents:800,totalCents:800});
  assert.deepEqual(averageTravellerPrice(travellerEstimates(trips,'FR','KE','10',today)),{count:1,rateCents:900,totalCents:9000});
  assert.equal(averageTravellerPrice(travellerEstimates(trips,'FR','KE','11',today)),null);
});
test('average rounds the final total once, including fractional kg',()=>{
  const prices=travellerEstimates([trip({pricePerKg:7}),trip({id:'b',pricePerKg:7.01})],'FR','KE','10',today);
  assert.deepEqual(averageTravellerPrice(prices),{count:2,rateCents:701,totalCents:7005});
  assert.equal(averageTravellerPrice(travellerEstimates([trip(),trip({id:'b',pricePerKg:9})],'FR','KE','.3',today)).totalCents,240);
});
test('courier price per kg divides the tariff by actual weight, not billed weight',()=>{
  assert.equal(effectivePricePerKg(rate('KE','.3').cents,300),11730);
  assert.equal(effectivePricePerKg(rate('KE','10').cents,10000),1490);
  assert.equal(effectivePricePerKg(100,0),null);
  assert.equal(effectivePricePerKg(-100,1000),null);
});
const now=Date.parse('2026-11-18T12:00:00Z');
const rows=[['USD',1.1],['KES',143],['GBP',.85],['INR',103]].map(([quote,rate])=>({date:'2026-11-18',base:'EUR',quote,rate}));
test('all selectable currencies convert both ways through the same dated rates',()=>{
  const fx=parseReferenceRates(rows,now);
  assert.equal(convertCost(700,'USD','KES',fx),91000);
  assert.equal(convertCost(91000,'KES','USD',fx),700);
  assert.equal(convertCost(10000,'EUR','GBP',fx),8500);
  assert.equal(convertCost(10000,'EUR','INR',fx),1030000);
  for(const currency of COST_CURRENCIES) assert.equal(convertCost(100,currency,currency,null),100);
});
test('stale, future, invalid, duplicated and mismatched rates are never used',()=>{
  assert.equal(parseReferenceRates({},now),null);
  for(const date of ['2026-11-01','2026-11-19','2026-02-31','bad']) assert.equal(parseReferenceRates(rows.map(row=>({...row,date})),now),null);
  for(const rate of [0,-1,Infinity,'1.1']) assert.equal(parseReferenceRates([{...rows[0],rate}],now),null);
  assert.equal(parseReferenceRates([...rows,rows[0]],now),null);
  assert.equal(parseReferenceRates(rows.map(row=>({...row,base:'USD'})),now),null);
  const fx=parseReferenceRates(rows.map(row=>row.quote==='KES'?{...row,date:'2026-11-17'}:row),now);
  assert.equal(fx.kesPerEur,undefined);
  assert.equal(convertCost(700,'USD','KES',fx),null);
  assert.equal(convertCost(700,'USD','KES',null),null);
  assert.equal(convertCost(700,'USD','KES',{...fx,kesPerEur:Infinity}),null);
});

const { courierPlanningReference } = require('../lib/automaticDeliveryCosts.ts');
const checkedDay = '2026-11-18';
const referenceFx = { date: checkedDay, usdPerEur: 1.1, kesPerEur: 143, inrPerEur: 103, gbpPerEur: .85 };
const plan = (from='ET',to='PT',weight='1',currency='USD',fx=referenceFx,day=checkedDay) => courierPlanningReference(from,to,weight,currency,fx,day);

test('Kenya to France uses the published EMS tariff in KES, including the 23 kg band',()=>{
  const ems = weight => rate('FR',weight,'posta','KE',checkedDay);
  assert.equal(ems('.3').cents,515000);
  assert.equal(ems('1').cents,737800);
  assert.equal(ems('1').currency,'KES');
  assert.equal(ems('1.001').cents,877000);
  assert.equal(ems('1.001').billedGrams,1500);
  assert.equal(ems('10').cents,3266300);
  assert.equal(ems('23').cents,5799700);
  assert.equal(ems('31.5').cents,7489400);
  assert.equal(ems('31.501').reason,'weight');
  assert.equal(convertCost(ems('1').cents,'KES','USD',referenceFx),5675);
});
test('EMS destinations use their own verified zones and do not assume a missing destination',()=>{
  for(const [to,cents] of [['ET',383200],['UG',383200],['ZA',535900],['GB',596000],['BE',676300],['FR',737800],['GQ',864800]]) {
    assert.equal(rate(to,'1','posta','KE',checkedDay).cents,cents,to);
  }
  for(const to of ['SS','LS','LR']) assert.equal(rate(to,'1','posta','KE',checkedDay).reason,'route');
  assert.equal(publishedCourierRates('FR','KE','1',checkedDay).some(q=>q.provider==='posta'),false);
});
test('EMS references expire for review and never quote an invalid weight or invalid route',()=>{
  for(const day of ['2026-11-17','2027-01-01']) assert.equal(rate('FR','1','posta','KE',day).reason,'expired');
  for(const weight of ['', '0', '-1', 'Infinity', '32']) assert.equal(rate('FR',weight,'posta','KE',checkedDay).cents,null);
  assert.equal(publishedCourierRates('KE','KE','1',checkedDay).some(q=>q.cents!==null),false);
});
test('a missing Ethiopia route gets a separate reference range with the real source routes preserved',()=>{
  const result=plan();
  assert.equal(result.kind,'reference');
  assert.deepEqual([...new Set(result.samples.map(s=>s.from))].sort(),['EG','KE']);
  assert.ok(result.samples.every(s=>s.to==='PT'));
  assert.ok(result.minCents>0 && result.maxCents>result.minCents);
  assert.equal(result.samples.find(s=>s.from==='KE').cents,5675);
  assert.equal(publishedCourierRates('ET','PT','1',checkedDay).some(q=>q.cents!==null),false);
});
test('DHL references exclude other carriers before selecting routes and calculating the range',()=>{
  const result=courierPlanningReference('ET','PT','5','USD',referenceFx,checkedDay,'dhl');
  assert.deepEqual(result.samples.map(s=>[s.from,s.quote.provider]),[['EG','dhl']]);
  const expected=convertCost(rate('PT','5','dhl','EG',checkedDay).cents,'USD','USD',referenceFx);
  assert.equal(result.minCents,expected);
  assert.equal(result.maxCents,expected);
});
test('DHL reference eligibility ignores another carrier’s exact tariff but respects DHL limits',()=>{
  const result=courierPlanningReference('KE','FR','1','EUR',referenceFx,checkedDay,'dhl');
  assert.ok(result);
  assert.ok(result.samples.every(s=>s.quote.provider==='dhl' && s.to==='FR'));
  for(const [from,to,weight,day] of [['FR','KE','5',checkedDay],['IN','KE','11',checkedDay],['FR','KE','31',checkedDay],['FR','KE','1','2027-01-01']]) {
    assert.equal(courierPlanningReference(from,to,weight,'EUR',referenceFx,day,'dhl'),null);
  }
});
test('reference range is the min and max of published sample prices in one chosen currency',()=>{
  for(const currency of COST_CURRENCIES) {
    const result=plan('ET','PT','5',currency);
    const amounts=result.samples.map(s=>convertCost(s.quote.cents,s.quote.currency,currency,referenceFx));
    assert.equal(result.currency,currency);
    assert.equal(result.minCents,Math.min(...amounts));
    assert.equal(result.maxCents,Math.max(...amounts));
    assert.equal(result.grams,5000);
  }
});
test('published route tariffs take precedence; overweight and expired tariffs are not bypassed with references',()=>{
  for(const from of ['FR','EG','IN','KE']) assert.equal(plan(from,'PT'),null);
  assert.equal(plan('FR','KE','30.001'),null);
  assert.equal(plan('IN','KE','11'),null);
  assert.equal(plan('KE','PT','32'),null);
  assert.equal(plan('FR','KE','1','USD',referenceFx,'2027-01-01'),null);
});
test('reference routes use the same destination, skip domestic pairs and fall back transparently to other origins',()=>{
  const europe=plan('DE','KE');
  assert.ok(europe.samples.every(s=>s.from==='FR' && s.to==='KE'));
  const america=plan('US','FR');
  assert.deepEqual([...new Set(america.samples.map(s=>s.from))].sort(),['EG','IN','KE']);
  assert.ok(america.samples.every(s=>s.from!==s.to && s.from!=='US' && s.to==='FR'));
  const asia=plan('CN','KE');
  assert.equal(asia.samples.length,1);
  assert.equal(asia.samples[0].from,'IN');
  assert.equal(asia.minCents,asia.maxCents);
});
test('fractional weights use published bands, and effective kg divides by actual weight',()=>{
  const small=plan('ET','PT','.3');
  const kenya=small.samples.find(s=>s.from==='KE');
  assert.equal(kenya.quote.cents,515000);
  assert.equal(kenya.quote.billedGrams,500);
  assert.equal(small.grams,300);
  assert.equal(effectivePricePerKg(kenya.cents,small.grams),Math.round(kenya.cents/.3));
});
test('no reference is invented for invalid input, unsupported weight, stale tariffs or missing conversions',()=>{
  for(const [from,to,weight] of [['ET','ET','1'],['XX','PT','1'],['ET','PT','0'],['ET','PT','32'],['ET','PT','NaN']]) assert.equal(plan(from,to,weight),null);
  assert.equal(plan('ET','PT','1','USD',null),null);
  assert.equal(plan('ET','PT','1','USD',{...referenceFx,kesPerEur:undefined}),null);
  assert.equal(plan('ET','PT','1','USD',referenceFx,'2027-01-01'),null);
  // Same-currency source prices still work without foreign exchange data.
  assert.ok(plan('DE','KE','1','EUR',null));
});
test('every supported uncovered route can show traceable reference prices at 1 kg with valid FX',()=>{
  for(const from of ALL_COUNTRIES) for(const to of ALL_COUNTRIES.filter(c=>c.code!==from.code)) {
    const exact=publishedCourierRates(from.code,to.code,'1',checkedDay);
    if(exact.some(q=>q.cents!==null)) continue;
    const result=plan(from.code,to.code);
    assert.ok(result,`${from.code}-${to.code}`);
    assert.ok(result.samples.every(s=>s.to===to.code && s.from!==from.code && s.quote.source.startsWith('https://')));
  }
});
