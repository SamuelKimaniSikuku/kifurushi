# Parcel declarations and handover safety

This release shows upcoming travellers without requiring dates, records private
brief contents declarations with optional photos, and requires both parties to confirm
the same declaration before pickup. Traveller identity verification is checked
again by the database at handover. These records document the process; they do
not certify the legality of contents or replace airline/customs checks.

## Deployment

Apply the `parcel_declarations_and_inspections` migration to the existing
Supabase project before deploying the frontend. It adds three RLS-protected
tables, a private `parcel-evidence` bucket and authenticated RPCs. Public listing
queries never include item lists, values or evidence paths. No new secrets or
environment variables are required.

Apply `optional_parcel_photos` after the initial migration for the simplified
flow. Contents and handover photos are optional; each person ticks one checkbox
confirming the full inspection. Both confirmations, the contents declaration,
traveller verification and the existing refusal safeguards remain required.
Uploaded photos retain the same private access and validation rules.

Apply `simplify_parcel_declarations` next for the short posting form. The listing
description is reused as the confirmed contents; quantities and goods values
are optional and omitted values stay NULL. Existing detailed declarations and
version history are preserved. Categories and photos are under optional details.

Existing parcels can add their first declaration from the expanded match in
the dashboard. Every match still awaiting pickup must pass the new checks.
Deliveries already picked up or in transit can finish without invented,
retroactive inspection records. Old delivery shortcuts cannot bypass the guard
on a pre-pickup match. Accepted declarations, evidence and journey details are
locked; cancel and amend an uncollected parcel before making a new arrangement.

Safety refusal is available to the matched traveller before pickup. It records
the reason, cancels pending/accepted matches for that parcel, releases reserved
capacity, closes the parcel under a safety hold, and creates a severe incident
in the existing support queue. It creates no rating or platform penalty.
Refusal after pickup must go through the existing support process.

Support must review the incident and declaration before resolving a hold.
There is deliberately no client-side override. An authorised operator can use
the existing privileged support/database tools to clear `safety_hold`, then
reopen the parcel in a separate statement, recording the resolution in the
incident. Neither the sender nor traveller can clear a hold. Evidence is
append-only for clients; support handles retention and orphan-upload cleanup.

Apply `optional_request_weight` for requests with unknown or negotiable weight.
Blank or zero entered in the app is stored as NULL and displayed as “Weight to
agree”. Requests above the available kilos can open a conversation. The sender
can edit the open parcel from the pending match; unknown weight and insufficient
capacity still prevent acceptance. Accepted weights remain locked and all
inspection, refusal, ownership, route and date checks are unchanged.

Apply `negotiable_weight_estimates` before the app update to retain positive
estimates below 0.1 kg or above 46 kg. Requests do not enforce a luggage limit.
Parcel weight and calculated trip capacity retain decimal precision so light
envelopes reserve their actual weight when accepted. The remaining-space column
is regenerated from the existing space and bookings, with no booking changes.

The two existing listing email functions also display unknown weight correctly;
deploy `new-listing-alerts` and `listing-nudges` with their existing hook-secret
authentication configuration. Deploy the database and functions before the app.

## Verification

Run application validation and discovery tests with:

```sh
node --test tests/*.test.cjs
npm run build
```

The SQL suite is for a **fresh, disposable local PostgreSQL database only**.
It supplies minimal Supabase auth/storage schemas, applies the app's historical
state-machine migrations and the new migration, and uses fake users and photos.
It never connects to real email, identity verification, billing or incident
webhooks. Fixtures are rolled back after each test file.

From the repository root, substitute your local test database name:

```sh
psql -v ON_ERROR_STOP=1 -d kifurushi_safety_test \
  -f tests/safety/bootstrap.sql \
  -f tests/safety/inspection.test.sql \
  -f tests/safety/refusal.test.sql \
  -f tests/safety/optional-photos.test.sql \
  -f tests/safety/brief-declaration.test.sql \
  -f tests/safety/request-weight.test.sql
```

Coverage includes anonymous/unrelated-user denial, own-upload validation,
declaration versions, separate sender/traveller confirmations, verified-traveller
requirements, all delivery shortcuts, immutable records, frozen journey details,
capacity release, refusal retries, support holds and legacy delivery completion.
No production customer records are changed by this suite.
