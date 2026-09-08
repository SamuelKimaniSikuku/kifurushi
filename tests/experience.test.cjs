const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Run focused TypeScript domain checks with the project's existing compiler.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  }});
  module._compile(outputText, filename);
};
const { browseHref, readRouteFilters, postHref, readPostRoute, safeReturnPath } = require('../lib/routes.ts');
const { signInSchema, signUpSchema } = require('../lib/validation.ts');

test('route shortcuts round-trip with country direction, date and sort intact', () => {
  const filters = { from: 'FR', to: 'KE', date: '2026-12-20', sort: 'price' };
  const href = browseHref('/trips', filters);
  assert.deepEqual(readRouteFilters(new URL(href, 'https://www.kifurushiapp.com').searchParams), filters);
  assert.equal(browseHref('/parcels', { from: 'KE', to: 'FR' }), '/parcels?from=KE&to=FR');
  assert.equal(browseHref('/trips', {}), '/trips');
});

test('malformed countries, impossible dates and unknown sort values are ignored', () => {
  assert.deepEqual(readRouteFilters(new URLSearchParams('from=XX&to=KE&date=2026-02-30&sort=unsafe')), { from: '', to: 'KE', date: '', sort: 'date' });
  assert.equal(readRouteFilters(new URLSearchParams('date=2028-02-29')).date, '2028-02-29');
  assert.equal(readRouteFilters(new URLSearchParams('date=2027-02-29')).date, '');
});

test('posting retains country choices without inventing arrival dates or cities', () => {
  const url = new URL(postHref('parcel', { from: 'FR', to: 'KE' }), 'https://www.kifurushiapp.com');
  assert.deepEqual(readPostRoute(url.searchParams), { fromCountry: 'FR', fromCity: '', toCountry: 'KE', toCity: '' });
  assert.equal(url.searchParams.has('neededBy'), false);
  assert.deepEqual(readPostRoute(new URLSearchParams('toCountry=KE')), { toCountry: 'KE', toCity: '' });
  assert.deepEqual(readPostRoute(new URLSearchParams('fromCountry=XX&fromCity=Bad')), {});
});

test('sign-in returns to the complete chosen route, including an encoded city', () => {
  for (const route of ['/trips?from=FR&to=KE&date=2026-12-20', '/post/trip?fromCountry=FR&fromCity=Paris%2015&toCountry=KE', '/dashboard#messages']) {
    const auth = new URL(`/auth?next=${encodeURIComponent(route)}`, 'https://www.kifurushiapp.com');
    assert.equal(safeReturnPath(auth.searchParams.get('next')), route);
  }
});

test('return destinations cannot leave the app through scheme-relative or encoded URLs', () => {
  for (const route of ['https://example.com', '//example.com', '/\\example.com', '/%5cexample.com', '/%2fexample.com', 'javascript:alert(1)', '/\n/evil', '/auth', '/auth?next=/auth', '/a/../auth', '/%zz']) {
    assert.equal(safeReturnPath(route), '/dashboard', route);
  }
});

test('sign-in accepts an existing password without applying new-account requirements', () => {
  assert.equal(signInSchema.safeParse({ email: 'member@example.com', password: 'oldpass' }).success, true);
  assert.equal(signUpSchema.safeParse({ name: 'Test Member', email: 'member@example.com', password: 'oldpass' }).success, false);
});

test('sign-in still rejects missing passwords and invalid email addresses', () => {
  assert.equal(signInSchema.safeParse({ email: 'member@example.com', password: '' }).success, false);
  assert.equal(signInSchema.safeParse({ email: 'not-an-email', password: 'valid-existing-password' }).success, false);
  const parsed = signInSchema.parse({ email: ' member@example.com ', password: ' old password ' });
  assert.equal(parsed.email, 'member@example.com');
  assert.equal(parsed.password, ' old password ');
});

test('registration keeps the existing password requirements', () => {
  const details = { name: 'Test Member', email: 'member@example.com' };
  assert.equal(signUpSchema.safeParse({ ...details, password: 'MyPassword42' }).success, true);
  for (const password of ['Short1', 'alllowercase123', 'ALLUPPERCASE123', 'NoNumberHere']) {
    assert.equal(signUpSchema.safeParse({ ...details, password }).success, false);
  }
});
