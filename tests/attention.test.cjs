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
let tables, failures, calls, signedIn;
const uid = 'me', other = 'partner';
const client = {
  auth: { getSession: async () => ({ data: { session: signedIn ? { user: { id: uid } } : null } }) },
  from: (table) => {
    const call = { table }; calls.push(call);
    const chain = {
      select: (columns) => { call.columns = columns; return chain; },
      in: (key, values) => { call.filter = { key, values }; return chain; },
      order: () => chain,
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
const { fetchAttention, needsMyAction } = require('../lib/db.ts');
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
beforeEach(() => { tables = {}; failures = {}; calls = []; signedIn = true; });
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
