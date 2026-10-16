# Trust and delivery reports

## Deployment

Apply `20261016114440_trust_and_delivery_reports.sql`, deploy `didit-webhook` with JWT verification off (HMAC required), and deploy `verification-review` with JWT verification on. Deploy the frontend afterwards. Existing customer identities and delivery statuses are not bulk-modified. Document fingerprints begin with new verification decisions; Didit face checks also compare against existing provider sessions.

Automatic and manual identity approvals call one transactional function. Cross-account face signals and reused document fingerprints go to review. Unknown duplicate payloads fail closed. A revoked session removes the badge; old sessions cannot restore it over a newer failed check. Fingerprints use a private database key. Raw identity numbers and images are not stored in app tables. Provider unavailability never grants a badge.

## Customer and administrator flow

Each delivery has Report a problem: reason plus a short explanation. Cases preserve relevant booking, identity references, contacts and conversation records. New pickups also preserve a handover snapshot. Reports hold collection and completion without cancelling the match or releasing reserved capacity. Reports can also be raised after completion; they do not rewrite history. Support gets the existing severe-incident alert with a case reference. Reports are idempotent per reporter/match, limited to 20 per day.

Visit `/admin/reports` from the dashboard. Administrators must first enrol or confirm an authenticator app. The database and verification-review endpoint require a signed AAL2 session as well as admin membership. The app never enrols factors or restricts accounts without the administrator explicitly choosing that action. Private case views and decisions are audited. Restricting new bookings blocks new listings, match requests and acceptance on the server; existing conversations and support remain usable. Resolution removes the case hold but does not confirm receipt or refund payments.

Both sender and traveller need identity verification before future pickups. Parcels already collected retain their existing completion flow. Parties still inspect the parcel and confirm receipt separately.

## Email verification and optional phone contact

The owner chose email verification for this release. Production Email Auth is enabled with `mailer_autoconfirm=false`: new members must confirm their email before signing in. The existing signup confirmation and email sign-in flows remain in place. Email ownership does not prove identity or stop one person using several email addresses; the document/face checks remain necessary.

Phone Auth remains disabled. There is no SMS requirement, configuration task or unavailable SMS prompt in the customer flow. Saved WhatsApp numbers are optional contact details, not proof of identity. The dormant phone verification component is displayed only when Phone Auth is deliberately enabled with confirmation required, or the number has already been confirmed. No SMS service was activated.

## Operations

Possible duplicate identities cannot be waved through with ordinary approval. Investigate provider records, resolve false positives with the identity provider, and recover the original account for repeat customers. Do not infer fraud from shared Wi-Fi or face similarity alone. This is not a guarantee against all duplicate people, stolen accounts or off-platform payment scams.

Review retained fraud, handover and case data when a case closes or an account closes; restrict access and handle deletion/retention requests according to the privacy policy and the circumstances of any outstanding claim. Fingerprints/restriction history must not be casually wiped to bypass duplicate checks. Provider credentials, document fingerprints and private case snapshots must never be logged or exported publicly.

## Tests

Run `node --test tests/*.test.cjs`, `next lint`, `tsc --noEmit` and `next build`.

On a fresh disposable PostgreSQL 15 database, run `psql -v ON_ERROR_STOP=1 -d DATABASE -f tests/safety/trust-bootstrap.sql -f tests/safety/trust.test.sql`. The bootstrap supplies local auth/storage schemas, no real notifications. Tests cover duplicate and manual approval races, revocation, private data access, AAL2 admin requirements, sender verification, reports, holds, identity/contact evidence, restrictions and closure. A separate concurrent-session check verifies that simultaneous approvals of one document cannot grant two accounts. Browser acceptance testing uses mocked Supabase/Auth/SMS/identity responses and no real customer actions.

## Release approval

The owner explicitly approved pushing to `SamuelKimaniSikuku/kifurushi` and deploying the database, identity handlers and frontend. The subsequent clarification selected the existing email confirmation flow instead of requiring SMS. The database migration and identity handlers were deployed on 16 October 2026 (didit-webhook v11 and verification-review v5). Live checks confirmed that all six private tables deny direct member/anonymous reads, identity decisions are service-only, admin access checks reject unauthorised callers, and both handlers reject unauthenticated requests. The new private tables intentionally have no client RLS policies: all access goes through the checked functions. Existing unrelated advisor findings remain for a separate maintenance review. The app passed 49 unit tests, 38 isolated database checks, concurrent duplicate-approval testing, TypeScript, lint, production build, and mocked browser workflows on mobile and desktop. No live customer actions were used for testing.
