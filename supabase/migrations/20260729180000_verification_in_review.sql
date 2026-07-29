-- Didit doesn't only answer yes or no. When its automatic checks raise a flag
-- it can't settle alone — a document number that doesn't match the expected
-- format, or a face already approved on another account — it parks the session
-- as "In Review" for a human. We had no state for that, so those users sat on
-- "Verification in progress ... usually within minutes" forever.
--
-- 'in_review' is set only by the webhook (service role). The client insert
-- policy still requires 'pending', so nobody can start a session already in
-- review.

alter table public.verifications
  drop constraint if exists verifications_status_check;

alter table public.verifications
  add constraint verifications_status_check
  check (status in ('pending', 'in_review', 'verified', 'rejected'));
