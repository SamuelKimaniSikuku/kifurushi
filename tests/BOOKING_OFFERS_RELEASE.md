# Clear booking offers

The homepage presents one four-step guide, switchable between sender and
traveller, in English, French and Swahili. Existing post-publish matching remains
in place and is covered by the matching regression tests.

After a request is accepted, either participant can suggest a total carrying
fee, currency and handover details in Messages. The recorded weight comes from
the parcel listing; an unknown weight remains unknown. Only the other person can
accept or decline. A counteroffer supersedes the old pending offer and preserves
its history. Accepted prices are immutable. Acceptance advances only the terms
stage; it does not record payment, pickup or delivery. Existing inspections,
verification requirements, receipt reporting and delivery codes remain in force.

Offers live in a private RLS-enabled table, accessible through participant-checked
RPCs. All mutations serialize on the match row. Proposal IDs make retries
idempotent, and counteroffers require the pending offer ID that was reviewed.
Direct edits are revoked. A trigger prevents older clients bypassing a pending
agreement. Existing bookings without structured offers remain compatible.

Offer events create messages inside the same transaction, using existing unread
badges and throttled email notifications. The hourly reminder queue now targets
the recipient of a pending offer, after 24 hours. No new schedule or mail worker
is needed. No live customer messages are sent during testing.

## Release order

1. Apply `20261126183815_structured_delivery_offers.sql` before deploying the UI.
2. Verify new function privileges and rerun security advisors.
3. Publish the frontend. No environment changes or Edge Function deployment.
4. Smoke-test the public guide and offer UI with intercepted test API responses.

If the frontend needs rollback, retain the additive migration and offer records.
Do not drop recorded agreements. Existing chat messages provide the audit trail.

## Verification

- Production build, TypeScript and the existing notification/matching/inbox tests.
- `node --test tests/booking-journey.test.cjs tests/delivery-return.test.cjs tests/matching.test.cjs`
- In a disposable local database only, apply `tests/safety/bootstrap.sql`, then
  `tests/safety/delivery-offers.test.sql`. The offer fixture is rolled back.
- Run `tests/browser/delivery-return.cjs` against the built preview. Supabase is
  intercepted; authentication, counteroffers, failed draft retry, acceptance,
  receipts, holds and wrong-account cases never touch real members.

Protected payments and a separate pickup PIN are outside this release. Current
joint inspection and final delivery confirmation remain the handover safeguards.
