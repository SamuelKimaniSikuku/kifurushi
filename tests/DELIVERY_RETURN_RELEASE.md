# Returning from WhatsApp to a delivery

The WhatsApp handover link now prepares a localized message containing the exact
private delivery URL. It does not send automatically. Opening the URL never
confirms collection, receipt or payment. Existing participant authorization,
inspection checks and complaint holds still apply.

Delivery links select the correct conversation and its details tab. Message
alerts still open chat; completed-delivery alerts open that booking's review.
Password sign-in, email sign-in/confirmation and password reset preserve the
requested destination. Email links carry it in a query parameter because the
Supabase implicit auth flow uses the URL fragment for session tokens.

A small next-step button is visible above the chat. The original fee/handover
message form has been replaced by structured, bilateral price offers; see
`BOOKING_OFFERS_RELEASE.md`. Payments remain direct between participants.

## Deployment

1. Publish the frontend before switching reminder links to `#delivery-<id>`.
2. Apply `20261120101420_delivery_return_reminders.sql`.
3. Deploy `match-emails` and `listing-nudges`, including `_shared` files, with
   their existing hook-secret checks and `verify_jwt=false` configuration.
4. Keep the existing hourly `kifurushi-listing-nudges` schedule. No new cron job
   or secret is needed. A `dry_run: true` invocation plans but never sends.

The queue RPC is read-only and service-role-only. It excludes cancellations,
safety refusals, open complaints, completed actions and sent stage reminders.
Agreement reminders wait 24 hours; checks and collection are prompted within
three days of departure, even when the booking was made well in advance.
Receipt reminders wait at least 24 hours after an arrival update, or until after
the later of departure and the parcel deadline. Review reminders start 24 hours
after completion and stop after the participant submits a review. Old agreement,
arrival and review backlogs older than 14 days are excluded. Each stage is sent
at most once per participant; the existing global 24-hour reminder cooldown and
provider idempotency apply. Eligibility is re-read just before sending.

## Verification

- `node --test tests/delivery-return.test.cjs tests/delivery-followups.test.cjs tests/notifications.test.cjs tests/listing-nudges.test.cjs tests/matching-emails.test.cjs tests/chat-notifications.test.cjs tests/match-card-availability.test.cjs tests/inbox.test.cjs tests/experience.test.cjs`
- `npm run build`
- Run `tests/safety/delivery-return.test.sql` only in an empty disposable local
  PostgreSQL database with the `anon`, `authenticated` and `service_role` roles.
  Its sample schemas/data are rolled back and it performs no external sends.
- `tests/browser/delivery-return.cjs` runs against a local production build.
  Set `PLAYWRIGHT_MODULE` when Playwright is supplied externally and
  `KIFURUSHI_TEST_BASE` to the local preview URL. All backend requests are mocked;
  no real member, email, booking or account is changed.
