# Trust and delivery reports

## Deployment

Apply `20261016114440_trust_and_delivery_reports.sql`, deploy `didit-webhook` with JWT verification off (HMAC required), and deploy `verification-review` with JWT verification on. Deploy the frontend afterwards. Existing customer identities and delivery statuses are not bulk-modified. Document fingerprints begin with new verification decisions; Didit face checks also compare against existing provider sessions.

Automatic and manual identity approvals call one transactional function. Cross-account face signals and reused document fingerprints go to review. Unknown duplicate payloads fail closed. A revoked session removes the badge; old sessions cannot restore it over a newer failed check. Fingerprints use a private database key. Raw identity numbers and images are not stored in app tables. Provider unavailability never grants a badge.

## Customer and administrator flow

Each delivery has Report a problem: reason plus a short explanation. Cases preserve relevant booking, identity references, contacts and conversation records. New pickups also preserve a handover snapshot. Reports hold collection and completion without cancelling the match or releasing reserved capacity. Reports can also be raised after completion; they do not rewrite history. Support gets the existing severe-incident alert with a case reference. Reports are idempotent per reporter/match, limited to 20 per day.

Visit `/admin/reports` from the dashboard. Administrators must first enrol or confirm an authenticator app. The database and verification-review endpoint require a signed AAL2 session as well as admin membership. The app never enrols factors or restricts accounts without the administrator explicitly choosing that action. Private case views and decisions are audited. Restricting new bookings blocks new listings, match requests and acceptance on the server; existing conversations and support remain usable. Resolution removes the case hold but does not confirm receipt or refund payments.

Both sender and traveller need identity verification before future pickups. Parcels already collected retain their existing completion flow. Parties still inspect the parcel and confirm receipt separately.

## SMS activation dependency

Phone Auth is currently disabled in production. The dashboard shows saved numbers as unverified contacts. Do not enable phone autoconfirm or advertise phone ownership checks as live before SMS is configured.

In Supabase Authentication / Providers / Phone, configure the owner's SMS service (e.g. Twilio), enable Phone, keep phone confirmation enabled and test delivery to the intended countries. Credentials belong in the provider settings, never in source code or chat. Keep provider spend limits and Supabase OTP rate limits enabled. Test with an authorised test number before requiring phone verification for transactions.

The app detects enabled Phone Auth with autoconfirm off and then exposes Verify number. It calls updateUser on the existing signed-in account, verifies with phone_change, then checks the confirmed Auth phone on the server. It never creates a second account and never treats an entered WhatsApp number as proof of ownership. Supabase's unique phone binding prevents the same phone attaching to two accounts; recovery/recycled numbers need a support review.

## Operations

Possible duplicate identities cannot be waved through with ordinary approval. Investigate provider records, resolve false positives with the identity provider, and recover the original account for repeat customers. Do not infer fraud from shared Wi-Fi or face similarity alone. This is not a guarantee against all duplicate people, stolen accounts or off-platform payment scams.

Review retained fraud, handover and case data when a case closes or an account closes; restrict access and handle deletion/retention requests according to the privacy policy and the circumstances of any outstanding claim. Fingerprints/restriction history must not be casually wiped to bypass duplicate checks. Provider credentials, document fingerprints and private case snapshots must never be logged or exported publicly.

## Tests

Run `node --test tests/*.test.cjs`, `next lint`, `tsc --noEmit` and `next build`.

On a fresh disposable PostgreSQL 15 database, run `psql -v ON_ERROR_STOP=1 -d DATABASE -f tests/safety/trust-bootstrap.sql -f tests/safety/trust.test.sql`. The bootstrap supplies local auth/storage schemas, no real notifications. Tests cover duplicate and manual approval races, revocation, private data access, AAL2 admin requirements, sender verification, reports, holds, identity/contact evidence, restrictions and closure. A separate concurrent-session check verifies that simultaneous approvals of one document cannot grant two accounts. Browser acceptance testing uses mocked Supabase/Auth/SMS/identity responses and no real customer actions.

## Release approval

Production deployment is pending explicit owner approval. Automatic approval review rejected the production schema migration because it introduces persistent private tables, privileged functions, access controls and delivery restrictions. No production migration or identity-handler deployment was performed. The branch is prepared for review; SMS activation also needs the owner’s SMS provider configuration.
