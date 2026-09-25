const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  }}).outputText, filename);
};
const { declarationSchema, validateEvidenceFile } = require('../lib/parcelSafety.ts');
const { upcomingOnRoute, laterDepartures } = require('../lib/tripDiscovery.ts');
const { safetyCopy } = require('../lib/locales/safety.ts');
const valid = { items: [{ description: 'Cotton shirts', quantity: '2', valueUsd: '40' }], photoPaths: ['sender/contents.jpg'], attested: true };

test('declaration captures quantities and the value of goods separately from carriage fees', () => {
  assert.deepEqual(declarationSchema.parse(valid).items, [{ description: 'Cotton shirts', quantity: 2, valueUsd: 40 }]);
});
test('incomplete or unconfirmed contents cannot be posted', () => {
  for (const draft of [{ ...valid, attested: false }, { ...valid, photoPaths: [] }, { ...valid, items: [] }, { ...valid, items: [{ description: 'Shirts', quantity: 0, valueUsd: 40 }] }, { ...valid, items: [{ description: 'Shirts', quantity: 1.5, valueUsd: 40 }] }, { ...valid, items: [{ description: 'Shirts', quantity: 1, valueUsd: Infinity }] }, { ...valid, items: [{ description: 'Shirts', quantity: 1, valueUsd: '' }] }]) {
    assert.equal(declarationSchema.safeParse(draft).success, false);
  }
});
test('evidence uploads reject documents, executable formats, empty files and oversize images', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) assert.equal(validateEvidenceFile({ type, size: 100 }), true);
  for (const file of [{ type: 'image/svg+xml', size: 100 }, { type: 'text/html', size: 100 }, { type: 'application/pdf', size: 100 }, { type: 'image/jpeg', size: 0 }, { type: 'image/png', size: 8388609 }]) assert.equal(validateEvidenceFile(file), false);
});
const trips = [
  { id: 'later', fromCountry: 'FR', toCountry: 'KE', departDate: '2026-12-20', remainingKg: 3 },
  { id: 'early', fromCountry: 'FR', toCountry: 'KE', departDate: '2026-10-01', remainingKg: 2 },
  { id: 'full', fromCountry: 'FR', toCountry: 'KE', departDate: '2026-10-02', remainingKg: 0 },
  { id: 'past', fromCountry: 'FR', toCountry: 'KE', departDate: '2026-08-01', remainingKg: 3 },
  { id: 'reverse', fromCountry: 'KE', toCountry: 'FR', departDate: '2026-10-03', remainingKg: 3 },
];
test('browsing without dates shows real upcoming capacity in route order', () => {
  assert.deepEqual(upcomingOnRoute(trips, 'FR', 'KE', '2026-09-25').map(t => t.id), ['early', 'later']);
  assert.equal(trips[0].id, 'later', 'filtering does not mutate shared trip state');
});
test('later departures retain route direction and do not pretend to meet the deadline', () => {
  assert.deepEqual(laterDepartures(trips, 'FR', 'KE', '2026-10-15', '2026-09-25').map(t => t.id), ['later']);
  assert.deepEqual(laterDepartures(trips, 'FR', 'KE', '', '2026-09-25'), []);
});
test('all supported languages cover every new safety and discovery label', () => {
  for (const lang of ['fr', 'sw']) assert.deepEqual(Object.keys(safetyCopy[lang]).sort(), Object.keys(safetyCopy.en).sort());
});
