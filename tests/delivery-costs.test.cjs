const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  }}).outputText, filename);
};
const { amountInCents, compareDeliveryCosts, estimateTravellerCost, weightInGrams } = require('../lib/deliveryCosts.ts');

test('estimates a traveller price from weight and rate without needing a courier quote', () => {
  assert.deepEqual(estimateTravellerCost('5', '10'), {
    grams: 5000, rateCents: 1000, carryingCents: 5000, otherCents: 0, totalCents: 5000,
  });
  assert.equal(estimateTravellerCost('8', '10').totalCents, 8000);
});
test('accepts small parcels, grams, and decimal commas without rounding weight up to a kilo', () => {
  assert.equal(estimateTravellerCost('0.3', '10').totalCents, 300);
  assert.equal(estimateTravellerCost(',3', '10').totalCents, 300);
  assert.equal(estimateTravellerCost('1,125', '10,20', '2,50').totalCents, 1398);
  assert.equal(weightInGrams('0.001'), 1);
  assert.equal(weightInGrams(' 2,750 '), 2750);
});
test('rounds carrying charges to the nearest cent before adding other costs', () => {
  assert.equal(estimateTravellerCost('0.125', '0.04').carryingCents, 1);
  assert.equal(estimateTravellerCost('0.3', '0.30', '.50').totalCents, 59);
});
test('includes extra costs in the saving and handles a more expensive estimate', () => {
  const estimate = estimateTravellerCost('5', '10', '15');
  assert.equal(estimate.totalCents, 6500);
  assert.equal(compareDeliveryCosts('100', (estimate.totalCents / 100).toFixed(2)).percent, 35);
  assert.equal(compareDeliveryCosts('40', (estimate.totalCents / 100).toFixed(2)).differenceCents, -2500);
});
test('requires valid weight and rate, with only extra charges allowed to be blank', () => {
  for (const bad of ['', ' ', '0', '-1', 'NaN', 'Infinity', '1e3', '0.0001', '1000.001', '1,000.00']) {
    assert.equal(estimateTravellerCost(bad, '10'), null, bad);
  }
  for (const bad of ['', ' ', '-1', 'Infinity', '10.001', '10000001']) {
    assert.equal(estimateTravellerCost('5', bad), null, bad);
  }
  for (const bad of ['-1', 'NaN', '1e3', '0.001']) {
    assert.equal(estimateTravellerCost('5', '10', bad), null, bad);
  }
  assert.equal(estimateTravellerCost('5', '0', ' ').totalCents, 0);
});
test('rejects estimates beyond the supported total instead of showing an incorrect comparison', () => {
  assert.equal(estimateTravellerCost('1000', '10000').totalCents, 1_000_000_000);
  assert.equal(estimateTravellerCost('1000', '10000', '0.01'), null);
  assert.equal(estimateTravellerCost('1000', '10000000'), null);
});

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
