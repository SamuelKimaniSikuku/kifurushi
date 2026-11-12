const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const NOW = Date.parse('2026-11-12T07:00:00Z');
const DAY = 86400000;
const source = fs.readFileSync('supabase/functions/listing-nudges/index.ts', 'utf8').replace(/^import .*;\n/gm, '') + '\nmodule.exports = { reminderPhase, BOOKED_STATUSES, T };';
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

function parcel(overrides = {}) {
  return { id: 'p1', sender_id: 'sender', status: 'open', safety_hold: false, to_city: 'Paris', from_country: 'KE', to_country: 'FR', needed_by: '2026-11-20', created_at: '2026-11-10T07:00:00Z', nudged_early_at: null, nudged_soon_at: null, nudged_expired_at: null, weight_kg: 1, budget_usd: 10, ...overrides };
}
function trip(overrides = {}) {
  const p = parcel();
  return { ...p, id: 't1', traveler_id: 'traveller', depart_date: '2026-11-19', remaining_kg: 10, ...overrides };
}
function match(overrides = {}) {
  return { id: 'm1', trip_id: 't1', parcel_id: 'p1', requester_id: 'sender', status: 'requested', request_nudged_at: null, updated_at: '2026-11-12T01:00:00Z', ...overrides };
}
function listing(overrides = {}) {
  return { ...parcel(), user_id: 'sender', listing_date: '2026-11-20', ...overrides };
}
function harness(seed = {}, options = {}) {
  const db = { parcels: [], trips: [], matches: [], profiles: [], memberships: [], ...structuredClone(seed) };
  const mail = [], writes = [], incidents = [];
  let handler;
  class Query {
    constructor(table) { this.table = table; this.filters = []; this.fields = ''; }
    select(fields, opts = {}) { this.fields = fields; this.head = opts.head; return this; }
    update(values) { this.values = values; return this; }
    eq(k, v) { this.filters.push(r => r[k] === v); return this; }
    is(k, v) { this.filters.push(r => (r[k] ?? null) === v); return this; }
    in(k, vs) { this.filters.push(r => vs.includes(r[k])); return this; }
    gte(k, v) { this.filters.push(r => r[k] != null && r[k] >= v); return this; }
    gt(k, v) { this.filters.push(r => r[k] != null && r[k] > v); return this; }
    lte(k, v) { this.filters.push(r => r[k] != null && r[k] <= v); return this; }
    lt(k, v) { this.filters.push(r => r[k] != null && r[k] < v); return this; }
    order(k) { this.sortKey = k; return this; }
    limit(n) { this.max = n; return this; }
    maybeSingle() { this.single = true; return this; }
    throwOnError() { this.shouldThrow = true; return this; }
    then(resolve, reject) {
      return Promise.resolve().then(() => {
        if (options.bookingReadError && this.table === 'matches' && this.head) throw new Error('Booking query failed');
        if (options.writeError && this.values) throw new Error('Timestamp update failed');
        let rows = db[this.table].filter(r => this.filters.every(f => f(r)));
        if (this.sortKey) rows.sort((a,b) => String(a[this.sortKey]).localeCompare(String(b[this.sortKey])));
        if (this.max) rows = rows.slice(0, this.max);
        if (this.values) {
          for (const r of rows) { Object.assign(r, this.values); writes.push({ table: this.table, id: r.id, values: this.values }); }
        }
        const data = rows.map(r => {
          const out = { ...r };
          for (const [, alias, key] of this.fields.matchAll(/(user_id|listing_date):(\w+)/g)) out[alias] = r[key];
          if (this.fields.includes('trip:trips!')) out.trip = db.trips.find(t => t.id === r.trip_id) ?? null;
          if (this.fields.includes('parcel:parcels!')) out.parcel = db.parcels.find(p => p.id === r.parcel_id) ?? null;
          return out;
        });
        return { data: this.head ? null : this.single ? data[0] ?? null : data, count: rows.length, error: null };
      }).then(resolve, reject);
    }
  }
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [NOW])); } static now() { return NOW; } }
  const context = {
    module: { exports: {} }, Date: Clock, Request, Response, URL, encodeURIComponent,
    console: { log() {}, error() {} },
    Deno: { serve(fn) { handler = fn; }, env: { get(name) { return name === 'ALERT_HOOK_SECRET' ? options.noSecret ? undefined : 'test-hook' : name === 'RESEND_API_KEY' ? options.noEmailKey ? undefined : 'fake-email-key' : 'fake'; } } },
    createClient() { return { from: table => new Query(table), auth: { admin: { getUserById: async id => ({ data: { user: { email: `${id}@example.invalid` } }, error: null }) } } }; },
    fetch: async (url, opts) => { assert.equal(url, 'https://api.resend.com/emails'); mail.push({ ...JSON.parse(opts.body), key: opts.headers['Idempotency-Key'] }); return new Response('{}', { status: options.emailFailure ? 429 : 200 }); },
    logIncident: async (...args) => incidents.push(args),
  };
  vm.runInNewContext(js, context);
  return { ...context.module.exports, db, mail, writes, incidents, run: (body = {}, headers = { 'x-hook-secret': 'test-hook' }, method = 'POST') => handler(new Request('https://example.invalid', { method, headers, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) })) };
}

const policy = harness().reminderPhase;
test('early follow-up starts at 48 hours, before the final three days', () => {
  assert.equal(policy(listing({ created_at: new Date(NOW - 2*DAY + 1).toISOString() }), NOW), null);
  assert.equal(policy(listing(), NOW), 'early');
  assert.equal(policy(listing({ listing_date: '2026-11-15' }), NOW), 'soon');
  assert.equal(policy(listing({ listing_date: '2026-11-16' }), NOW), 'early');
});
test('each phase runs once and there is a 48-hour gap between listing emails', () => {
  assert.equal(policy(listing({ nudged_early_at: '2026-11-01T07:00:00Z' }), NOW), null);
  assert.equal(policy(listing({ listing_date: '2026-11-14', nudged_early_at: '2026-11-11T07:00:00Z' }), NOW), null);
  assert.equal(policy(listing({ listing_date: '2026-11-14', nudged_early_at: '2026-11-10T07:00:00Z' }), NOW), 'soon');
  assert.equal(policy(listing({ listing_date: '2026-11-14', nudged_soon_at: '2026-11-08T07:00:00Z' }), NOW), null);
});
test('closed or full future trips and malformed dates get no reminder', () => {
  for (const patch of [{ status: 'closed' }, { remaining_kg: 0 }, { remaining_kg: null }, { created_at: 'bad' }, { listing_date: 'bad' }]) assert.equal(policy(listing(patch), NOW), null);
});
test('expiry includes nightly closed trips, but never replays an old backlog', () => {
  assert.equal(policy(listing({ status: 'closed', listing_date: '2026-11-11' }), NOW), 'expired');
  assert.equal(policy(listing({ listing_date: '2026-11-08' }), NOW), null);
  assert.equal(policy(listing({ listing_date: '2026-11-11', nudged_expired_at: '2026-11-09T07:00:00Z' }), NOW), null);
});

for (const status of ['requested', 'declined', 'cancelled']) {
  test(`${status} does not suppress sender or traveller follow-ups`, async () => {
    const h = harness({ parcels: [parcel()], trips: [trip()], matches: [match({ status })] });
    assert.equal((await h.run()).status, 200);
    assert.equal(h.mail.length, 2);
    assert.ok(h.db.parcels[0].nudged_early_at);
    assert.ok(h.db.trips[0].nudged_early_at);
    assert.ok(h.mail[0].html.includes('/trips?from=KE&to=FR'));
    assert.ok(h.mail[1].html.includes('/parcels?from=KE&to=FR'));
  });
}
for (const status of ['accepted', 'escrow_paid', 'picked_up', 'in_transit', 'delivered', 'released', 'disputed']) {
  test(`${status} suppresses both listing follow-ups`, async () => {
    const h = harness({ parcels: [parcel()], trips: [trip()], matches: [match({ status })] });
    assert.equal((await h.run()).status, 200);
    assert.equal(h.mail.length, 0);
    assert.equal(h.writes.length, 0);
  });
}
test('pending-only near-date and expiry reminders are no longer silenced', async () => {
  for (const date of ['2026-11-14', '2026-11-11']) {
    const h = harness({ parcels: [parcel({ needed_by: date })], trips: [trip({ depart_date: date, status: date < '2026-11-12' ? 'closed' : 'open' })], matches: [match()] });
    await h.run();
    assert.equal(h.mail.length, 2);
    assert.ok(h.db.parcels[0][`nudged_${date < '2026-11-12' ? 'expired' : 'soon'}_at`]);
  }
});
test('a reply reminder takes priority; no member gets two listing/request emails in a run', async () => {
  const h = harness({ parcels: [parcel()], trips: [trip(), trip({ id: 't2' })], matches: [match({ updated_at: '2026-11-09T07:00:00Z' })] });
  await h.run();
  assert.equal(h.mail.filter(m => m.to[0] === 'traveller@example.invalid').length, 1);
  assert.match(h.mail[0].subject, /still waiting/);
  assert.equal(h.db.trips[0].nudged_early_at, null);
  assert.equal(h.db.trips[1].nudged_early_at, null);
  assert.ok(h.db.matches[0].request_nudged_at);
});
test('an obsolete request does not prompt someone after that parcel is booked elsewhere', async () => {
  const h = harness({ parcels: [parcel()], trips: [trip()], matches: [match({ updated_at: '2026-11-09T07:00:00Z' }), match({ id: 'm2', trip_id: 'other-trip', status: 'accepted' })] });
  await h.run();
  assert.ok(h.mail.every(m => !/still waiting/.test(m.subject)));
});
test('successful sends are recorded once and not repeated on another run', async () => {
  const h = harness({ parcels: [parcel()] });
  await h.run(); await h.run();
  assert.equal(h.mail.length, 1);
  assert.equal(h.mail[0].key, 'listing-nudge/early/parcels/p1');
});
test('email failure never marks a listing as notified', async () => {
  const h = harness({ parcels: [parcel()] }, { emailFailure: true });
  await h.run();
  assert.equal(h.writes.length, 0);
  assert.equal(h.incidents.length, 1);
  await h.run();
  assert.equal(h.mail[0].key, h.mail[1].key);
});
test('missing email credentials never marks a listing as notified', async () => {
  const h = harness({ parcels: [parcel()] }, { noEmailKey: true });
  await h.run();
  assert.equal(h.writes.length, 0); assert.equal(h.mail.length, 0);
});
test('a booking lookup error fails closed without emailing', async () => {
  const h = harness({ parcels: [parcel()] }, { bookingReadError: true });
  assert.equal((await h.run()).status, 500);
  assert.equal(h.mail.length, 0); assert.equal(h.writes.length, 0);
});
test('a timestamp write failure is visible and keeps the retry key stable', async () => {
  const h = harness({ parcels: [parcel()] }, { writeError: true });
  assert.equal((await h.run()).status, 500);
  assert.equal((await h.run()).status, 500);
  assert.equal(h.mail[0].key, h.mail[1].key);
});
test('dry-run uses real selection but has no email or database side effects', async () => {
  const h = harness({ parcels: [parcel()], trips: [trip()], matches: [match({ updated_at: '2026-11-09T07:00:00Z' })], memberships: [{ user_id: 'trial', provider: 'trial', current_period_end: '2026-11-01' }] });
  const result = await (await h.run({ dry_run: true })).json();
  assert.deepEqual(result, { ok: true, dry_run: true, sent: 0, planned: { request: 1, early: 1 } });
  assert.equal(h.mail.length, 0); assert.equal(h.writes.length, 0);
});
test('hook authentication is required for sends and dry runs, including an unset secret', async () => {
  for (const body of [{}, { dry_run: true }]) assert.equal((await harness().run(body, {})).status, 403);
  assert.equal((await harness({}, { noSecret: true }).run()).status, 403);
  assert.equal((await harness().run({}, {}, 'GET')).status, 405);
});
test('held parcels and future closed trips are excluded', async () => {
  const h = harness({ parcels: [parcel({ safety_hold: true })], trips: [trip({ status: 'closed' })] });
  await h.run(); assert.equal(h.mail.length, 0);
});
test('early copy works in all three member languages and escapes city text', async () => {
  for (const lang of ['en', 'fr', 'sw']) {
    const h = harness({ parcels: [parcel({ to_city: '<script>bad</script>' })], profiles: [{ id: 'sender', lang }] });
    await h.run();
    assert.equal(h.mail.length, 1);
    assert.doesNotMatch(h.mail[0].html, /<script>|undefined|null/);
    assert.ok(h.mail[0].html.includes(h.T[lang].parcelEarlyBody));
  }
});
