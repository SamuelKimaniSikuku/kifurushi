const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
  }});
  module._compile(outputText, filename);
};
let lang = 'en';
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === '@/lib/db') return {};
  if (request === '@/lib/i18n') return {
    useLang: () => ({ lang }),
    useT: () => require(`../lib/locales/${lang}.ts`)[lang],
  };
  if (request === '@/components/MatchSafety') return {
    __esModule: true, default: ({ children }) => children({ inspection: null, parcelDetails: null }),
  };
  if (request === '@/components/DeliveryProblem') return { __esModule: true, default: () => null };
  if (request === 'next/link') return { __esModule: true, default: props => React.createElement('a', props) };
  if (request.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '..', request.slice(2)), parent, isMain);
  return originalLoad.call(this, request, parent, isMain);
};
const MatchCard = require('../components/MatchCard.tsx').default;
const { requestWeightCopy } = require('../lib/locales/requestWeight.ts');
// Keep locale hooks available during rendering. No effects or network calls run.
const base = { id: 'pending', tripId: 'trip', parcelId: 'parcel', requesterId: 'sender',
  status: 'requested', updatedAt: '2026-10-01T00:00:00Z', role: 'traveler',
  counterpartyId: 'sender', counterpartyName: 'Sender', route: 'Nairobi → Paris',
  hasCode: false, parcelWeightKg: 4, remainingKg: 10, requestAvailability: 'available' };
function render(overrides = {}) {
  return renderToStaticMarkup(React.createElement(MatchCard, {
    match: { ...base, ...overrides }, myUserId: 'traveler', onChanged: () => {}, defaultOpen: true,
  }));
}
function acceptButton(html) { return html.match(/<button[^>]*>Accept request<\/button>/)?.[0]; }
test('booked request shows saved weight and explanation without false weight or waiting prompts', () => {
  lang = 'en';
  const html = render({ requestAvailability: 'booked_elsewhere' });
  assert.match(html, />4 kg</);
  assert.match(html, /Booked with another traveller/);
  assert.doesNotMatch(html, /Weight to agree|Agree the weight|waiting for you|Update parcel weight/);
  assert.match(acceptButton(html), /disabled/);
  assert.match(html, /Write a message/);
  assert.match(html, />Decline</);
});
test('valid available weight enables acceptance; unknown and overweight estimates do not', () => {
  lang = 'en';
  assert.doesNotMatch(acceptButton(render()), /disabled/);
  const unknown = render({ parcelWeightKg: null });
  assert.match(unknown, /Weight to agree/);
  assert.match(acceptButton(unknown), /disabled/);
  assert.match(acceptButton(render({ parcelWeightKg: 12 })), /disabled/);
  assert.match(acceptButton(render({ remainingKg: 0 })), /disabled/);
});
test('missing availability prompts refresh instead of claiming unknown weight', () => {
  lang = 'en';
  const html = render({ requestAvailability: 'unknown', parcelWeightKg: null });
  assert.match(html, /Could not check availability/);
  assert.doesNotMatch(html, /Weight to agree/);
  assert.match(acceptButton(html), /disabled/);
});
test('closed request displays unavailable and hides irrelevant weight-edit link for sender', () => {
  lang = 'en';
  const html = render({ requestAvailability: 'unavailable', role: 'sender', requesterId: 'other' });
  assert.match(html, /Request no longer available/);
  assert.doesNotMatch(html, /Update parcel weight/);
  assert.match(acceptButton(html), /disabled/);
});
test('all supported languages explain the hidden-listing case', () => {
  for (lang of ['en', 'fr', 'sw']) {
    const html = render({ requestAvailability: 'booked_elsewhere' });
    assert.ok(html.includes(requestWeightCopy[lang].bookedElsewhere));
    assert.ok(html.includes(requestWeightCopy[lang].bookedElsewhereHelp));
    assert.ok(!html.includes(requestWeightCopy[lang].pending));
    assert.match(acceptButton(html), /disabled/);
  }
  lang = 'en';
});
