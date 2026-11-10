const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }}).outputText, filename);
const { inboxMatches, isHistory, summarizeConversation } = require('../lib/inbox.ts');
const base = { id: 'a', counterpartyName: 'Alex', route: 'Paris → Nairobi', status: 'accepted', updatedAt: '2026-11-01T09:00:00Z' };
test('active conversations exclude finished and unavailable requests but retain unresolved disputes', () => {
  for (const status of ['released', 'cancelled', 'declined']) assert.equal(isHistory({ ...base, status }), true);
  assert.equal(isHistory({ ...base, status: 'disputed' }), false);
  assert.equal(isHistory({ ...base, status: 'requested', requestAvailability: 'booked_elsewhere' }), true);
  assert.equal(isHistory({ ...base, status: 'requested', requestAvailability: 'unknown' }), false);
  assert.equal(isHistory({ ...base, requestAvailability: 'unavailable' }), false);
});
test('history stays searchable by name and route without removing the underlying match', () => {
  const matches = [base, { ...base, id: 'b', status: 'cancelled' }];
  assert.deepEqual(inboxMatches(matches, {}, 'history', ' NAIROBI ').map(m => m.id), ['b']);
  assert.deepEqual(inboxMatches(matches, {}, 'active', 'alex').map(m => m.id), ['a']);
  assert.equal(matches.length, 2);
});
test('new messages sort ahead of a newer booking; equal times have a stable order', () => {
  const matches = [base, { ...base, id: 'b', updatedAt: '2026-11-03T09:00:00Z' }];
  const summaries = { a: { lastMessage: { createdAt: '2026-11-04T09:00:00Z' }, unread: 1 } };
  assert.deepEqual(inboxMatches(matches, summaries, 'active', '').map(m => m.id), ['a', 'b']);
  assert.deepEqual(inboxMatches([{...base, id:'b'}, base], {}, 'active', '').map(m => m.id), ['a','b']);
});
test('own messages do not count as unread and reading one conversation does not clear another', () => {
  const incoming = { id: '1', senderId: 'other', createdAt: '2026-11-02T10:00:00Z', body: 'Hello' };
  const outgoing = { ...incoming, id: '2', senderId: 'me', createdAt: '2026-11-02T11:00:00Z' };
  const summaries = { a: summarizeConversation([incoming, outgoing], 'me', ''), b: summarizeConversation([incoming], 'me', '') };
  assert.equal(summaries.a.unread, 1);
  summaries.a = summarizeConversation([incoming, outgoing], 'me', outgoing.createdAt);
  assert.deepEqual(inboxMatches([base, {...base,id:'b'}], summaries, 'unread', '').map(m => m.id), ['b']);
  assert.equal(summaries.a.lastMessage.id, '2');
});
test('unread history remains reachable, and empty searches stay empty', () => {
  const closed = { ...base, status: 'cancelled' };
  assert.equal(inboxMatches([closed], { a: { unread: 2 } }, 'unread', '').length, 1);
  assert.deepEqual(inboxMatches([base], {}, 'active', 'Dubai'), []);
  assert.deepEqual(inboxMatches([], {}, 'active', ''), []);
});
