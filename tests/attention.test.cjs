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
let tables, failures, calls, signedIn, feedback;
const uid = 'me', other = 'partner';
const client = {
  rpc: async name => {
    if (name === 'match_counterparty') return { data: other };
    assert.equal(name, 'my_delivery_feedback');
    return { data: feedback, error: failures.feedback ?? null };
  },
  auth: { getSession: async () => ({ data: { session: signedIn ? { user: { id: uid } } : null } }) },
  from: (table) => {
    const call = { table }; calls.push(call);
    const chain = {
      select: (columns) => { call.columns = columns; return chain; },
      in: (key, values) => { call.filter = { key, values }; return chain; },
      order: () => chain,
      eq: () => chain,
      maybeSingle: async () => ({ data: { full_name: 'Sender' } }),
      then: (resolve, reject) => {
        const rows = tables[table] ?? [];
        const data = call.filter ? rows.filter(row => call.filter.values.includes(row[call.filter.key])) : rows;
        return Promise.resolve({ data, error: failures[table] ?? null }).then(resolve, reject);
      },
    };
    return chain;
  },
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === './supabase' && parent?.filename.endsWith('/lib/db.ts')) return { supabase: client };
  return originalLoad.call(this, request, parent, isMain);
};
const { fetchAttention, needsMyAction, fetchMyMatches } = require('../lib/db.ts');
Module._load = originalLoad;
function match(id, role = 'traveler', status = 'escrow_paid', requester = other) {
  return { id, status, requester_id: requester, trip_id: 'trip-' + id, parcel_id: 'parcel-' + id,
    updated_at: '2026-10-15T10:00:00Z', code_hash: null,
    trip: { from_city: 'Paris', to_city: 'Nairobi', remaining_kg: 9, traveler_id: role === 'traveler' ? uid : other,
      profile: { id: role === 'traveler' ? uid : other, full_name: 'Traveller' } },
    parcel: { sender_id: role === 'sender' ? uid : other, weight_kg: 1,
      profile: { id: role === 'sender' ? uid : other, full_name: 'Sender' } } };
}
const check = (id, role, user, version = 1) => ({ match_id: id, role, user_id: user, declaration_version: version });
beforeEach(() => { tables = {}; failures = {}; calls = []; signedIn = true; feedback = []; });
test('a traveller who confirmed and is waiting for the sender has no action badge', async () => {
  tables.matches = [match('waiting')];
  tables.parcel_declarations = [{ parcel_id: 'parcel-waiting', version: 1 }];
  tables.match_inspections = [check('waiting', 'traveler', uid)];
  assert.equal((await fetchAttention()).total, 0);
});
test('both people are prompted for their own check, and only the traveller is prompted for collection', async () => {
  const m = { status: 'escrow_paid', role: 'traveler' };
  const safety = { hasDeclaration: true, mine: false, both: false, refused: false };
  assert.equal(needsMyAction(m, uid, safety), true);
  assert.equal(needsMyAction({ ...m, role: 'sender' }, uid, safety), true);
  assert.equal(needsMyAction(m, uid, { ...safety, mine: true }), false);
  assert.equal(needsMyAction(m, uid, { ...safety, mine: true, both: true }), true);
  assert.equal(needsMyAction({ ...m, role: 'sender' }, uid, { ...safety, mine: true, both: true }), false);
});
test('a newer declaration requires new checks; another match cannot clear this alert', async () => {
  tables.matches = [match('updated')];
  tables.parcel_declarations = [{ parcel_id: 'parcel-updated', version: 2 }, { parcel_id: 'parcel-updated', version: 1 }];
  tables.match_inspections = [check('updated', 'traveler', uid), check('updated', 'sender', other), check('unrelated', 'traveler', uid, 2)];
  assert.equal((await fetchAttention()).total, 1);
  assert.deepEqual(calls.find(c => c.table === 'match_inspections').filter, { key: 'match_id', values: ['updated'] });
  assert.equal(calls.find(c => c.table === 'parcel_declarations').columns, 'parcel_id, version');
});
test('missing contents need the sender, while a refused parcel never asks for collection', async () => {
  tables.matches = [match('waiting'), match('needs-contents', 'sender'), match('refused')];
  tables.parcel_declarations = [{ parcel_id: 'parcel-refused', version: 1 }];
  tables.match_safety_refusals = [{ match_id: 'refused' }];
  assert.equal((await fetchAttention()).total, 1);
});
test('real pending requests stay counted, with listing counts unchanged', async () => {
  tables.matches = [match('waiting'), match('trip-request', 'traveler', 'requested'), match('parcel-request', 'sender', 'requested'), match('my-request', 'sender', 'requested', uid), match('done', 'traveler', 'released')];
  tables.parcel_declarations = [{ parcel_id: 'parcel-waiting', version: 1 }];
  tables.match_inspections = [check('waiting', 'traveler', uid)];
  assert.deepEqual(await fetchAttention(), { total: 2, byTrip: { 'trip-trip-request': 1 }, byParcel: { 'parcel-parcel-request': 1 } });
});
test('a traveller waiting for a delivery code is not prompted until a code exists', () => {
  assert.equal(needsMyAction({ status: 'delivered', role: 'traveler', hasCode: false }, uid), false);
  assert.equal(needsMyAction({ status: 'delivered', role: 'traveler', hasCode: true }, uid), true);
  assert.equal(needsMyAction({ status: 'delivered', role: 'sender', hasCode: false }, uid), true);
  for (const status of ['released', 'cancelled', 'declined', 'disputed']) assert.equal(needsMyAction({ status, role: 'traveler' }, uid), false);
});
test('a failed read is not reported as zero pending actions', async () => {
  tables.matches = [match('checking')];
  for (const table of ['matches', 'parcel_declarations', 'match_inspections', 'match_safety_refusals']) {
    const error = { message: 'Temporary read failure' }; failures = { [table]: error };
    await assert.rejects(fetchAttention(), e => e === error);
  }
});
test('skip safety queries when they are not needed, and all queries while signed out', async () => {
  tables.matches = [match('agreed', 'traveler', 'accepted')];
  assert.equal((await fetchAttention()).total, 1);
  assert.deepEqual(calls.map(c => c.table), ['matches']);
  signedIn = false; calls = [];
  assert.deepEqual(await fetchAttention(), { total: 0, byTrip: {}, byParcel: {} });
  assert.equal(calls.length, 0);
});

test('a recorded receipt removes stale collection prompts without hiding unread messages', async () => {
  tables.matches = [match('received', 'sender', 'accepted')];
  feedback = [{ match_id: 'received', can_review: true, can_report_receipt: true, outcome: 'missing_items' }];
  assert.equal((await fetchAttention()).total, 0);
});
test('receipt permission failures are surfaced for retry', async () => {
  tables.matches = [match('received')];
  failures.feedback = new Error('Feedback unavailable');
  await assert.rejects(fetchAttention(), e => e === failures.feedback);
});


test('hidden matched parcel uses the saved weight and reports another booking', async () => {
  const row = match('booked', 'traveler', 'requested');
  row.parcel = null; tables.matches = [row];
  feedback = [{ match_id: 'booked', parcel_weight_kg: '4', remaining_kg: '10', request_availability: 'booked_elsewhere' }];
  const [detail] = await fetchMyMatches();
  assert.equal(detail.parcelWeightKg, 4);
  assert.equal(detail.remainingKg, 10);
  assert.equal(detail.counterpartyName, 'Sender');
  assert.equal(detail.requestAvailability, 'booked_elsewhere');
  assert.deepEqual(await fetchAttention(), { total: 0, byTrip: {}, byParcel: {} });
});
test('closed requests stop action badges for both roles, while open requests stay counted', async () => {
  tables.matches = [match('closed-trip', 'sender', 'requested'), match('booked-parcel', 'traveler', 'requested'), match('open', 'traveler', 'requested')];
  feedback = [
    { match_id: 'closed-trip', request_availability: 'unavailable' },
    { match_id: 'booked-parcel', request_availability: 'booked_elsewhere' },
    { match_id: 'open', request_availability: 'available' },
  ];
  assert.deepEqual(await fetchAttention(), { total: 1, byTrip: { 'trip-open': 1 }, byParcel: {} });
});
test('fresh context preserves truly unknown weight and overrides stale joined details', async () => {
  tables.matches = [match('open', 'traveler', 'requested')];
  feedback = [{ match_id: 'open', parcel_weight_kg: null, remaining_kg: 0, request_availability: 'available' }];
  const [detail] = await fetchMyMatches();
  assert.equal(detail.parcelWeightKg, null);
  assert.equal(detail.remainingKg, 0);
  assert.equal(detail.requestAvailability, 'available');
  feedback[0].parcel_weight_kg = '0.075';
  assert.equal((await fetchMyMatches())[0].parcelWeightKg, 0.075);
});
test('missing context is distinguished from confirmed availability', async () => {
  tables.matches = [match('open', 'traveler', 'requested')];
  assert.equal((await fetchMyMatches())[0].requestAvailability, 'unknown');
});
