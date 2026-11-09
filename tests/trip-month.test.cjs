const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  }}).outputText, filename);
};
const { filterUpcomingTrips } = require('../lib/tripDiscovery.ts');
const { enExperience, frExperience, swExperience } = require('../lib/locales/experience.ts');
const filters = { from: 'FR', to: 'KE', date: '', month: '2026-12', sort: 'date' };
const trip = (id, departDate, other = {}) => ({ id, departDate, fromCountry: 'FR', toCountry: 'KE', remainingKg: 5, pricePerKg: 10, ...other });
const rows = [
  trip('jan', '2027-01-01'), trip('dec-last', '2026-12-31', { pricePerKg: 8 }),
  trip('nov-last', '2026-11-30'), trip('dec-first', '2026-12-01'),
  trip('full', '2026-12-12', { remainingKg: 0 }),
  trip('reverse', '2026-12-13', { fromCountry: 'KE', toCountry: 'FR' }),
  trip('other-route', '2026-12-14', { toCountry: 'TG' }),
];
const ids = result => result.map(t => t.id);
test('whole month includes both endpoints and excludes neighbouring months, full flights and wrong routes', () => {
  assert.deepEqual(ids(filterUpcomingTrips(rows, filters, '2026-11-09')), ['dec-first', 'dec-last']);
  assert.equal(rows[0].id, 'jan', 'filtering leaves source order intact');
});
test('current month excludes departed trips and still includes today', () => {
  assert.deepEqual(ids(filterUpcomingTrips(rows, filters, '2026-12-31')), ['dec-last']);
  assert.deepEqual(filterUpcomingTrips(rows, filters, '2027-01-01'), []);
});
test('month search handles year boundaries and leap day', () => {
  assert.deepEqual(ids(filterUpcomingTrips(rows, { ...filters, month: '2027-01' }, '2026-11-09')), ['jan']);
  const leap = [trip('feb-first', '2028-02-01'), trip('leap', '2028-02-29'), trip('march', '2028-03-01')];
  assert.deepEqual(ids(filterUpcomingTrips(leap, { ...filters, month: '2028-02' }, '2028-01-01')), ['feb-first', 'leap']);
});
test('price sorting and route swap retain the selected month', () => {
  assert.deepEqual(ids(filterUpcomingTrips(rows, { ...filters, sort: 'price' }, '2026-11-09')), ['dec-last', 'dec-first']);
  assert.deepEqual(ids(filterUpcomingTrips(rows, { ...filters, from: 'KE', to: 'FR' }, '2026-11-09')), ['reverse']);
});
test('any-date and existing depart-by searches keep their inclusive behaviour', () => {
  assert.deepEqual(ids(filterUpcomingTrips(rows, { ...filters, month: '' }, '2026-11-09')), ['nov-last', 'dec-first', 'dec-last', 'jan']);
  assert.deepEqual(ids(filterUpcomingTrips(rows, { ...filters, month: '', date: '2026-12-01' }, '2026-11-09')), ['nov-last', 'dec-first']);
});
test('all supported languages include month controls and empty-state recovery', () => {
  for (const copy of [enExperience, frExperience, swExperience]) {
    for (const key of ['travelDates', 'anyDate', 'wholeMonth', 'byDate', 'chooseMonth', 'showAnyDate']) assert.ok(copy[key]);
  }
});
