# Delivery feedback and reviews

An accepted booking no longer needs its full handover sequence recorded before a customer can report partial receipt or review the experience. Sender receipt feedback offers Everything received, Some items missing, and Parcel not received. Problems create a private support case without advancing the match, changing capacity, or inventing inspection records. Optional received weight and up to six private photos accompany a report. Report submission and receipt recording share one database transaction and match lock; retries reuse the existing case.

Full receipt for an already collected parcel uses the existing sender completion function. Full receipt on a booking with stale collection steps is recorded separately: it does not fabricate past safety checks or complete that match. The UI shows the receipt outcome and removes stale prompts for the reporting sender. An open complaint must be resolved by support before full receipt can be recorded. Support resolution never itself marks a delivery complete.

Review eligibility is checked on the server and returned to the dashboard: the reviewer must be a party to an accepted booking, and receipt/partial receipt must have been reported, the delivery marked arrived/completed, or the later of the trip departure and requested delivery date must have passed. Cancellation after recorded acceptance also permits review. A premature nonreceipt report alone does not unlock reviews. Old cancellations without acceptance history need support investigation. Requested/declined bookings, outsiders, self-reviews and duplicate reviews remain blocked. Public review text and stars are separate from private reports. Both parties may review; neither can veto the other's review. Account identity checks and complaint holds remain enforced.

`delivery-report-photos` is a private bucket. Object names bind the uploader and match; inserts require match participation. Photos can be read only by their uploader or an administrator with a signed AAL2 session when attached to a case. Other match parties cannot read them. Submitted photos have no client update/delete policy. Unattached uploads remain private; retention/cleanup must follow the existing support privacy process. No photos, reports, receipts or reviews are migrated from customer messages or created on their behalf.

## Release

Apply `20261019080415_delivery_feedback_and_reviews.sql` before deploying the frontend. No Edge Function or payment-provider changes are needed. The existing three-argument report RPC remains compatible with older app versions. The owner approved these changes and publication in the conversation.

## Checks

- `node --test tests/*.test.cjs`: 51 tests.
- Fresh local PostgreSQL 15: `tests/safety/trust-bootstrap.sql`, this migration, then `tests/safety/delivery-feedback.test.sql` and `tests/safety/trust.test.sql`: 81 assertions, including private storage, spoofed/unaccepted review attempts, stale and normal completion, report holds, identity restrictions and administrator MFA.
- TypeScript, lint and Next production build.
- `tests/browser/delivery-feedback.cjs`: partial receipt with weight/photo, failed submit and retry preserving evidence, reviews without false completion, both roles, overdue bookings, unaccepted requests, normal receipt, EN/FR/SW mobile layout and administrator evidence behind MFA. All Supabase calls are intercepted; no real customer actions occur.

For the browser check, provide `PLAYWRIGHT_MODULE` if Playwright is outside the project and `KIFURUSHI_TEST_BASE` for the local preview or published site. Chrome is required. Screenshots are written to `/private/tmp/kifurushi-feedback-*.png`.
