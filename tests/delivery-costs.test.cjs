const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  }}).outputText, filename);
};
const { amountInCents, compareDeliveryCosts } = require('../lib/deliveryCosts.ts');

test('compares complete prices and uses courier quote as the percentage baseline', () => {
  assert.deepEqual(compareDeliveryCosts('100', '40'), {
    courierCents: 10000, travellerCents: 4000, differenceCents: 6000, percent: 60,
  });
});
test('preserves a more expensive traveller result instead of claiming savings', () => {
  assert.equal(compareDeliveryCosts('40', '100').differenceCents, -6000);
  assert.equal(compareDeliveryCosts('50', '50').differenceCents, 0);
});
test('does not interpret blank or invalid inputs as a free shipment', () => {
  for (const bad of ['', ' ', '-1', '1e3', 'Infinity', 'NaN', '1,000.00', '10.001', '10000001']) {
    assert.equal(compareDeliveryCosts(bad, '40'), null, bad);
    assert.equal(compareDeliveryCosts('100', bad), null, bad);
  }
});
test('handles a free traveller while preventing division by a zero courier price', () => {
  assert.equal(compareDeliveryCosts('100', '0').percent, 100);
  assert.equal(compareDeliveryCosts('0', '0'), null);
  assert.equal(compareDeliveryCosts('0', '40'), null);
});
test('decimal-comma input and cents stay accurate', () => {
  assert.equal(amountInCents(' 12,50 '), 1250);
  assert.equal(compareDeliveryCosts('0.30', '0.20').differenceCents, 10);
  assert.equal(compareDeliveryCosts('12,50', '10,25').differenceCents, 225);
});
test('rounds savings to one decimal place', () => {
  assert.equal(compareDeliveryCosts('120', '50').percent, 58.3);
});
