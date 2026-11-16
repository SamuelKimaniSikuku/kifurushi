# Matching and follow-through

Members can open `/dashboard/listings` to manage their own listings, see compatible candidates, reuse an existing parcel/trip when requesting a match, and reopen existing conversations. New posts redirect to their own listing. Suggestions use country direction, date, remaining space and categories; cities and final fees still need agreement. Unknown weight remains supported. Later-date alternatives are separate and require the sender to change their deadline.

The dashboard shows up to two concrete next steps and links to My listings. Existing stale-request History rules remain in place. Recent posts do not ask for an availability confirmation. Older open listings offer confirmation, editing or closing; closing cannot cancel an accepted delivery. Closed listings are not reopened by confirmation.

Emails open the exact conversation, or the recipient's own listing and matching options. Sign-in preserves query parameters and the conversation hash. New/changed listing alerts are deduplicated per listing and recipient. Pending requests receive reminders at 24 and 48 hours, measured from creation, only while unanswered and actionable. Replies and obsolete requests stop these reminders. Open unmatched listings receive the existing 48-hour and approaching-deadline reminders, plus weekly availability checks. A recipient gets at most one reminder in 24 hours; urgent acceptance/message notifications are separate. The hourly worker may send later than the nominal threshold when the daily cap applies.

`notification_deliveries` is readable/writable only by the service role. Provider acceptance is logged separately from a signed-in return from an email link. No email tracking pixels are used. Return tracking is restricted to the intended recipient. The admin metrics RPC requires both administrator access and MFA. `/admin/matching` shows 30-day counts and route/date/price-specific announcements to copy. No social posts are sent automatically.

## Deployment order

1. Apply the matching_follow_through migration.
2. Deploy the web app and verify `/dashboard/listings` and `/admin/matching`.
3. Deploy `match-emails`, `new-listing-alerts`, and `listing-nudges`, including `_shared/notifications.ts` and `_shared/incidents.ts`.
4. Run the reminder endpoint in authenticated `dry_run` mode; it must make no sends or writes.
5. Change the existing `kifurushi-listing-nudges` cron to `0 * * * *`, preserving its existing invocation and secret.

## Validation

- `node --test tests/*.test.cjs`
- `npm run lint` and `npm run build`
- Disposable local PostgreSQL: apply `tests/safety/matching-bootstrap.sql`, then run `tests/safety/matching.test.sql`. Never run the test bootstrap on production.
- Render real listing components with synthetic data: `node tests/fixtures/render-listings.cjs /private/tmp/kifurushi-matching-visual`. Serve the resulting directory locally for desktop/mobile checks. It contains no customer data and does not send requests.
- Edge sources type-check separately with a Deno environment declaration and the installed Supabase types.

Email metrics begin at rollout; historical visits are not reconstructed. Provider acceptance is not proof of inbox delivery. Matching suggestions cannot create demand on a route with no suitable traveller/parcel.
