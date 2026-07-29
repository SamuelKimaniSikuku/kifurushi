import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions — Kifurushi",
  description:
    "The terms that govern your use of Kifurushi, the platform that connects parcel senders with verified travellers.",
};

const EFFECTIVE_DATE = "29 July 2026";

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

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest md:text-4xl">
        Terms &amp; Conditions
      </h1>
      <p className="mt-2 text-sm text-muted">
        Effective {EFFECTIVE_DATE} · The English version of these terms governs.
      </p>

      <div className="card mt-8 border-forest bg-forest p-6 text-white">
        <p className="text-sm font-semibold leading-relaxed">
          The most important thing to understand: Kifurushi is a connection
          platform. We introduce people who want to send a parcel to travellers
          with spare luggage space — and that is all we do. We are not a
          courier. We do not transport anything. We do not handle your money
          for deliveries. Every delivery is a private agreement between the
          sender and the traveller.
        </p>
      </div>

      <Section n={1} title="Who we are and what Kifurushi does">
        <p>
          Kifurushi (&quot;the platform&quot;, &quot;we&quot;, &quot;us&quot;)
          operates the website kifurushiapp.com. The platform lets members
          publish parcel requests and upcoming trips, discover each other,
          communicate, and keep a shared record of a delivery (agreed terms,
          journey updates, delivery confirmation codes and reviews).
        </p>
        <p className="font-semibold">
          Kifurushi only connects the two people involved. We are not a
          courier, freight forwarder, transport operator, logistics provider,
          postal service, payment processor for deliveries, or agent of either
          party. We never take custody of any parcel and we never hold, escrow
          or transfer the money exchanged between sender and traveller.
        </p>
      </Section>

      <Section n={2} title="The delivery agreement is between you two">
        <p>
          When a sender and a traveller match, any agreement they reach — the
          carriage fee, handover arrangements, timing, and everything else — is
          a private contract{" "}
          <b>
            exclusively between the sender and the traveller. Kifurushi is not
            a party to that contract
          </b>{" "}
          and assumes none of its obligations. The carriage fee is agreed and
          paid directly between the two of you (cash, mobile money, bank
          transfer or any method you choose); Kifurushi takes 0% of it.
        </p>
        <p>
          The platform&apos;s role is limited to providing the tools around
          that agreement: identity verification, matching, chat, status
          tracking, delivery codes and reviews.
        </p>
      </Section>

      <Section n={3} title="Membership and platform fees">
        <p>
          Browsing, receiving a parcel and tracking a delivery sent to you are
          free. Posting parcels or trips and contacting other members requires
          a paid membership ($5/month or $29/year), billed through our payment
          provider (Stripe). The membership fee pays for the platform only —
          it is not payment for any delivery. You can cancel any time;
          membership then runs to the end of the paid period.
        </p>
      </Section>

      <Section n={4} title="Eligibility and your account">
        <p>
          You must be at least 18 and able to enter binding contracts. You are
          responsible for your account, for keeping your credentials safe, and
          for the accuracy of everything you post. Travellers must complete
          identity verification (run by our verification partner, Didit)
          before their first carry; we store only the pass/fail outcome, never
          your ID images.
        </p>
      </Section>

      <Section n={5} title="Your responsibilities as a sender">
        <p>
          You must truthfully and completely declare the contents of your
          parcel, own (or be authorised to send) everything in it, and comply
          with the laws and customs rules of both the origin and destination
          countries. Prohibited: cash, loose batteries, liquids over 100&nbsp;ml,
          perishables, weapons, narcotics, and anything illegal in either
          country — see the{" "}
          <Link href="/safety#prohibited" className="font-semibold text-forest underline">
            prohibited items list
          </Link>
          . Misdeclared contents forfeit all platform protection and lead to a
          ban.
        </p>
      </Section>

      <Section n={6} title="Your responsibilities as a traveller">
        <p>
          You are personally responsible for everything you carry across a
          border. You must inspect every item open, seal the parcel together
          with the sender, and never accept a package you have not seen
          inside. You must comply with airline rules and the laws and customs
          regulations of every country on your route, including declaring
          goods where required. Any duties, taxes or penalties are yours or
          the sender&apos;s to resolve between you — never Kifurushi&apos;s.
        </p>
      </Section>

      <Section n={7} title="What Kifurushi is not responsible for">
        <p>
          Because we only connect people, to the maximum extent permitted by
          law Kifurushi is not liable for: loss of, damage to, or delay of any
          parcel; non-payment or overcharging of any carriage fee; the acts or
          omissions of any member; the contents of any parcel; or any customs,
          tax or legal consequence of a delivery. The platform record
          (verified identity, agreed terms, journey updates, delivery code and
          reviews) exists to help you transact carefully and to support any
          claim you pursue against the other party — it is not insurance and
          not a guarantee.
        </p>
        <p>
          Our total liability to you for anything arising from the platform is
          limited to the membership fees you paid us in the twelve months
          before the event.
        </p>
      </Section>

      <Section n={8} title="Disputes between members">
        <p>
          If a delivery goes wrong, contact the other party first — the
          in-match chat and delivery record exist for this. You can also
          report the matter to us: we will review the record, may suspend or
          ban accounts at fault, and will make the full delivery record
          available to both parties for any claim they pursue with each other
          or with authorities. Kifurushi does not adjudicate private disputes
          and does not compensate either party.
        </p>
      </Section>

      <Section n={9} title="Reviews and content">
        <p>
          Reviews are public, tied to completed deliveries, and cannot be
          edited once posted. You grant us a licence to display the content
          you post on the platform. We may remove content that is unlawful,
          deceptive or abusive.
        </p>
      </Section>

      <Section n={10} title="Termination">
        <p>
          You may close your account at any time. We may suspend or terminate
          accounts that break these terms, misdeclare contents, attempt to
          bypass verification or the paywall, or put other members at risk —
          with no refund of membership fees where the breach is serious.
        </p>
      </Section>

      <Section n={11} title="Privacy">
        <p>
          We store the data needed to run the platform: your account details,
          listings, matches, messages, delivery records and verification
          outcomes. ID and selfie images are processed by our verification
          partner and never stored by Kifurushi. We never sell your data.
        </p>
      </Section>

      <Section n={12} title="Changes and governing law">
        <p>
          We may update these terms; material changes are announced on the
          platform, and continuing to use Kifurushi after they take effect
          means you accept them. These terms are governed by the laws of
          France, without affecting any mandatory consumer protections of the
          country you live in.
        </p>
      </Section>

      <div className="card mt-10 bg-sand-deep p-5 text-sm text-muted">
        Questions about these terms? Write to{" "}
        <a href="mailto:hello@kifurushiapp.com" className="font-semibold text-forest underline">
          hello@kifurushiapp.com
        </a>
        .
      </div>
    </div>
  );
}
