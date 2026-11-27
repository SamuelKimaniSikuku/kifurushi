# Parcel contents and traveller preferences

New parcel forms require explicit categories and a packaging choice, offer grams/kg and estimated/measured weight, and leave weight, budget and quantity blank initially. Unknown weight remains supported. Private photos remain optional. Cards lead with the actual description and show supplied quantity, packaging and weight confidence.

Trips can select Certificates only in one tap, or choose several item types. Certificates are a subset of Documents. Other is never a wildcard. Mixed parcels must fit every accepted type. This is enforced when creating a request and again when accepting it, including direct API requests. Pending edits are rechecked. Accepted parcel details are frozen, and incompatible changes to trip categories are refused. New declaration versions snapshot these details for both participants at inspection. Older listings and declarations are preserved; owners must choose accurate categories themselves.

Matching suggestions, reuse of existing listings and new-listing email alerts use the same category predicate. The existing hook-secret authentication is unchanged. Existing accepted deliveries can continue.

Validation on 2026-11-27:
- Production build, lint and type checks passed.
- All 192 unit tests passed. Final focused content/email tests passed after weight-input refinement.
- 98 local SQL assertions across contents, request weight, inspection and brief-declaration flows passed against the real migration in a disposable database. Includes mixed-category rejection, stale attestation, unknown weight, private snapshots and immutable accepted metadata.
- Desktop/mobile browser tests passed using intercepted sample API responses only. Covers empty defaults, required categories, 50 g storage, failed-save retention, certificates-only posting, mixed request rejection and 320 px layout.
- Supabase migration 20261127134829 applied to Kifurushi (bltaaidjhpkmwnsprenu); post-deploy checks verified category rules and all three triggers. Security advisories unchanged.
- new-listing-alerts deployed as version 4 with only the shared category predicate change.

Commands:
```
node --test tests/*.test.cjs
npm run build
PLAYWRIGHT_MODULE=/path/to/playwright node tests/browser/parcel-contents.cjs
```
For SQL: apply tests/safety/bootstrap.sql and the migration to an isolated database, then run tests/safety/parcel-contents.test.sql, request-weight.test.sql, inspection.test.sql and brief-declaration.test.sql. Never use production for fixture tests.
