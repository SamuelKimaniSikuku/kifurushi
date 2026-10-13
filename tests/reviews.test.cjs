const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  }});
  module._compile(outputText, filename);
};
let inserted, filters, error, rows, signedIn, calls;
const saved = { id: 'review-1', match_id: 'match-1', author_id: 'sender-1', rating: 4, comment: null,
  created_at: '2026-10-13T10:00:00Z', author: { full_name: 'Test sender' } };
const client = {
  auth: { getSession: async () => ({ data: { session: signedIn ? { user: { id: 'sender-1' } } : null } }) },
  from: (table) => {
    calls++;
    assert.equal(table, 'reviews');
    const chain = {
      insert: (payload) => { inserted = payload; return chain; },
      select: () => chain,
      eq: (key, value) => { filters = { key, value }; return chain; },
      in: (key, value) => { filters = { key, value }; return chain; },
      order: async () => ({ data: rows, error: null }),
      single: async () => ({ data: { ...saved, ...inserted }, error }),
    };
    return chain;
  },
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === './supabase' && parent?.filename.endsWith('/lib/db.ts')) return { supabase: client };
  return originalLoad.call(this, request, parent, isMain);
};
const { addReview, fetchReviewsForMatches } = require('../lib/db.ts');
Module._load = originalLoad;
beforeEach(() => { inserted = undefined; filters = undefined; error = null; rows = []; signedIn = true; calls = 0; });

test('stars alone are enough; the signed-in account is the review author', async () => {
  const result = await addReview('match-1', 'traveller-1', 4, '   ');
  assert.deepEqual(inserted, { match_id: 'match-1', subject_id: 'traveller-1', author_id: 'sender-1', rating: 4, comment: null });
  assert.equal(result.authorName, 'Test sender');
  assert.equal(result.comment, '');
  assert.equal(result.rating, 4);
});
test('short feedback is trimmed and saved alongside the selected stars', async () => {
  const result = await addReview('match-1', 'traveller-1', 5, '  Clear communication.  ');
  assert.equal(inserted.comment, 'Clear communication.');
  assert.equal(result.comment, 'Clear communication.');
});
test('invalid ratings and overlong feedback never reach the database', async () => {
  for (const rating of [0, 6, 2.5, NaN]) await assert.rejects(addReview('match-1', 'traveller-1', rating, ''));
  await assert.rejects(addReview('match-1', 'traveller-1', 4, 'x'.repeat(301)));
  assert.equal(calls, 0);
});
test('signed-out attempts do not create reviews', async () => {
  signedIn = false;
  await assert.rejects(addReview('match-1', 'traveller-1', 4, ''), /Not signed in/);
  assert.equal(calls, 0);
});
test('a retry after a successful insert recovers the existing immutable review', async () => {
  error = { code: '23505' };
  rows = [{ ...saved, rating: 3, comment: 'Original feedback' }];
  const result = await addReview('match-1', 'traveller-1', 5, 'Changed in another tab');
  assert.equal(result.rating, 3);
  assert.equal(result.comment, 'Original feedback');
  assert.deepEqual(filters, { key: 'match_id', value: 'match-1' });
});
test('permission and network failures are surfaced, never treated as a saved review', async () => {
  error = { code: '42501', message: 'review not allowed' };
  await assert.rejects(addReview('match-1', 'traveller-1', 4, ''), (e) => e === error);
});
test('dashboard loading is scoped to completed matches and skips an empty list', async () => {
  assert.deepEqual(await fetchReviewsForMatches([]), []);
  assert.equal(calls, 0);
  rows = [saved];
  const result = await fetchReviewsForMatches(['match-1', 'match-2']);
  assert.deepEqual(filters, { key: 'match_id', value: ['match-1', 'match-2'] });
  assert.equal(result[0].matchId, 'match-1');
});
