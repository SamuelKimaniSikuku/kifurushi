import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Kifurushi",
  description:
    "What personal data Kifurushi collects, why, who processes it, how long it is kept, and the rights you have over it under the GDPR.",
};

const EFFECTIVE_DATE = "30 July 2026";

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="flex items-baseline gap-3 font-display text-xl font-bold tracking-tight text-forest md:text-2xl">
        <span className="text-clay">{n}.</span> {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink">
        {children}
      </div>
    </section>
  );
}

function Row({ what, why, basis }: { what: string; why: string; basis: string }) {
  return (
    <tr className="border-b border-line align-top">
      <td className="py-2.5 pr-4 font-semibold text-ink">{what}</td>
      <td className="py-2.5 pr-4 text-muted">{why}</td>
      <td className="py-2.5 text-muted">{basis}</td>
    </tr>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted">
        Effective {EFFECTIVE_DATE} · Applies to kifurushiapp.com
      </p>

      <div className="card mt-8 border-forest bg-forest p-6 text-white">
        <p className="text-sm font-semibold leading-relaxed">
          The short version: we keep the least we can. Your ID document and
          selfie are never stored by Kifurushi — they go straight to our
          identity partner and we keep only the pass or fail. Your phone number
          is never shown to other members. We do not sell your data, we do not
          advertise, and we do not track you across other websites.
        </p>
      </div>

      <Section n={1} title="Who is responsible for your data">
        <p>
          Kifurushi is operated by <b>Samuel Kimani Sikuku</b>, an individual
          based in France, who is the data controller for the purposes of the
          EU General Data Protection Regulation (GDPR).
        </p>
        <p>
          Contact for any privacy question or request:{" "}
          <a
            className="font-semibold text-forest underline"
            href="mailto:hello@kifurushiapp.com"
          >
            hello@kifurushiapp.com
          </a>
          . We answer privacy requests within one month, as the GDPR requires.
        </p>
      </Section>

      <Section n={2} title="What we collect, and why">
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-strong text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Why we have it</th>
                <th className="py-2">Legal basis</th>
              </tr>
            </thead>
            <tbody>
              <Row
                what="Name and email"
                why="To create your account, sign you in and send you service emails about your listings and matches."
                basis="Performance of a contract"
              />
              <Row
                what="Language preference"
                why="So the site and our emails reach you in English, French or Swahili."
                basis="Performance of a contract"
              />
              <Row
                what="Listings (routes, dates, weight, contents description, price)"
                why="This is the service: other members must be able to see and respond to what you post."
                basis="Performance of a contract"
              />
              <Row
                what="Messages between matched members"
                why="So the two people arranging a delivery can talk, and so a record exists if it goes wrong."
                basis="Performance of a contract"
              />
              <Row
                what="Phone number"
                why="Kept private. It is never displayed to other members and is only used for identity checks and, where relevant, contact about a delivery."
                basis="Performance of a contract"
              />
              <Row
                what="Identity verification outcome (pass or fail, document type)"
                why="So members can see who is verified before trusting someone with a parcel."
                basis="Explicit consent (Article 9(2)(a))"
              />
              <Row
                what="Payment records (subscription status, period, Stripe reference)"
                why="To know whether your membership is active. We never see or store your card number."
                basis="Performance of a contract; legal obligation for accounting"
              />
              <Row
                what="Technical failure logs"
                why="So we find out when something breaks for you instead of waiting for a complaint."
                basis="Legitimate interest in a working service"
              />
            </tbody>
          </table>
        </div>
      </Section>

      <Section n={3} title="Identity checks and biometric data">
        <p>
          Verification uses <b>Didit</b>, a specialist identity provider. When
          you verify, you photograph your ID document and take a short selfie.
          Didit compares the two, which involves processing{" "}
          <b>biometric data</b> — a special category of personal data under
          Article 9 of the GDPR.
        </p>
        <p>
          Three things follow from that, and we want them to be unambiguous:
        </p>
        <ul className="ml-4 list-disc space-y-2">
          <li>
            <b>It happens only if you ask for it.</b> We rely on your explicit
            consent, given by the tick box on the verification page. Verifying
            is optional — you can browse, post and receive parcels without it,
            though travellers are expected to verify before a first carry and
            other members may decline to deal with an unverified account.
          </li>
          <li>
            <b>Your images never reach Kifurushi.</b> The photographs go from
            your device to Didit. We receive only the result — approved,
            declined or under review — the document type, and a session
            reference. We could not produce your ID photo if we wanted to.
          </li>
          <li>
            <b>You can withdraw consent at any time</b> by emailing us. We will
            delete the verification result and remove your verified badge.
            Withdrawing does not undo checks already completed.
          </li>
        </ul>
        <p>
          Didit retains the images it captures under its own retention policy,
          as an independent processor for this purpose. If you want them
          deleted at Didit, tell us and we will pass the request on.
        </p>
        <p>
          Where an automatic check cannot decide — for example when the same
          face already appears on another verified account — the session is
          either refused automatically or referred to a person. In every case
          you can contest the outcome by emailing us and a human will look at
          it, as Article 22 requires.
        </p>
      </Section>

      <Section n={4} title="What other members can see">
        <p>
          Your name, profile photo initials, verified badge, rating, completed
          delivery count and the listings you publish are visible to other
          members, and your public profile page is reachable by anyone with the
          link.
        </p>
        <p className="font-semibold">
          Your email address, phone number and payment details are never shown
          to other members.
        </p>
      </Section>

      <Section n={5} title="Who else processes your data">
        <p>
          We use a small number of established providers. Each processes your
          data on our instructions, under its own data processing terms:
        </p>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            <b>Supabase</b> — database, accounts and file storage (hosted in the
            EU, Frankfurt).
          </li>
          <li>
            <b>Vercel</b> — website hosting and delivery.
          </li>
          <li>
            <b>Didit</b> — identity verification (see section 3).
          </li>
          <li>
            <b>Stripe</b> — membership payments. Stripe collects your card
            details directly; we never receive them.
          </li>
          <li>
            <b>Resend</b> — sending the emails we owe you (confirmations, match
            notifications, delivery updates).
          </li>
          <li>
            <b>Neo</b> — the mailbox behind hello@kifurushiapp.com, so anything
            you write to us is stored there.
          </li>
        </ul>
        <p>
          Some of these are established outside the European Economic Area. Where
          that is the case, transfers rely on the European Commission&apos;s
          Standard Contractual Clauses or an adequacy decision.
        </p>
        <p>
          We do not sell your data, we do not share it with advertisers, and we
          run no advertising or cross-site tracking on this website.
        </p>
      </Section>

      <Section n={6} title="Cookies and similar technology">
        <p>
          We use no advertising or analytics cookies, which is why you are not
          asked to consent to any. The site stores two things in your browser:
          your sign-in session, so you stay logged in, and your language choice.
          Both are strictly necessary for the service to work. The session
          ends when you sign out; the language choice stays until you clear
          your browser.
        </p>
      </Section>

      <Section n={7} title="How long we keep things">
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            <b>Your account and profile</b> — until you delete it or ask us
            to.
          </li>
          <li>
            <b>Listings, matches and messages</b> — kept while your account
            exists, because they are the record both parties may need if a
            delivery is disputed.
          </li>
          <li>
            <b>Verification results</b> — kept while your account exists, then
            deleted with it.
          </li>
          <li>
            <b>Payment and invoice records</b> — ten years, which French
            accounting law requires of us.
          </li>
          <li>
            <b>Failure logs</b> — 90 days.
          </li>
        </ul>
      </Section>

      <Section n={8} title="Your rights">
        <p>Under the GDPR you may ask us to:</p>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>give you a copy of the data we hold about you;</li>
          <li>correct anything inaccurate;</li>
          <li>delete your account and data;</li>
          <li>restrict or object to a particular use;</li>
          <li>
            transfer your data to another service in a machine-readable format;
          </li>
          <li>withdraw a consent you previously gave, such as verification.</li>
        </ul>
        <p>
          Email{" "}
          <a
            className="font-semibold text-forest underline"
            href="mailto:hello@kifurushiapp.com"
          >
            hello@kifurushiapp.com
          </a>{" "}
          and we will act within one month. Deleting your account removes your
          listings and profile; messages exchanged with another member may be
          retained in that member&apos;s record of a delivery, since it is their
          evidence too.
        </p>
        <p>
          If you think we have handled your data badly, you can complain to the
          French data protection authority, the{" "}
          <a
            className="font-semibold text-forest underline"
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
          >
            CNIL
          </a>
          , or to the authority in your own country. We would rather you told us
          first.
        </p>
      </Section>

      <Section n={9} title="Children">
        <p>
          Kifurushi is for adults. You must be 18 or older to hold an account,
          and we do not knowingly collect data about children. If you believe a
          child has an account, tell us and we will remove it.
        </p>
      </Section>

      <Section n={10} title="Security, and its limits">
        <p>
          Access to your data is restricted at the database level so that
          members can only read what they are entitled to; passwords are hashed
          by our authentication provider and delivery codes are stored hashed,
          never in readable form. No system is perfect, and we will tell you
          and the CNIL without undue delay if a breach puts your rights at risk.
        </p>
      </Section>

      <Section n={11} title="Changes to this policy">
        <p>
          If we change how we use your data we will update this page and change
          the effective date above. Significant changes will be emailed to
          members.
        </p>
      </Section>

      <div className="card mt-12 p-6">
        <p className="text-sm text-muted">
          See also our{" "}
          <Link href="/terms" className="font-semibold text-forest underline">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/safety" className="font-semibold text-forest underline">
            Trust &amp; safety
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
