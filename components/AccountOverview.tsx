"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, IdCard, Settings2 } from "lucide-react";
import type { MoneyTotals, VerificationState } from "@/lib/db";
import { useLang, useT } from "@/lib/i18n";
import { accountCopy } from "@/lib/locales/account";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import WhatsappSettings from "@/components/WhatsappSettings";

export default function AccountOverview({ verification, money, reviewer }: {
  verification: VerificationState | null;
  money: MoneyTotals | null;
  reviewer: boolean;
}) {
  const { lang } = useLang();
  const t = useT();
  const c = accountCopy[lang];
  const verified = verification?.status === "verified";
  const pending = verification?.status === "pending";
  const inReview = verification?.status === "in_review";
  const hasTotals = money && (money.carriedCount > 0 || money.sentCount > 0);

  return <div className="space-y-4">
    <div className={`grid items-start gap-4 ${hasTotals ? "lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]" : ""}`}>
      <section className="card min-w-0" aria-labelledby="account-details-title">
        <h2 id="account-details-title" className="px-5 pt-5 text-base font-semibold">{c.details}</h2>
        <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 p-5 sm:grid-cols-[2.25rem_minmax(0,1fr)_auto]">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand text-forest" aria-hidden>
            <IdCard size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{c.identity}</h3>
              {verified && <VerifiedBadge small />}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {verified ? c.verified : inReview ? c.reviewHint : pending ? c.pendingHint : c.unverifiedHint}
            </p>
            {!verified && (pending || inReview) && <p className="mt-1 text-xs font-medium text-forest">{inReview ? c.review : c.pending}</p>}
          </div>
          {!verified && <Link href="/verify" className="col-start-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-forest underline underline-offset-4 sm:col-start-auto">
            {pending || inReview ? c.view : c.verify}<ArrowRight size={15} aria-hidden />
          </Link>}
        </div>
        <WhatsappSettings />
      </section>

      {hasTotals && <section className="card min-w-0 p-5" aria-labelledby="account-summary-title">
        <h2 id="account-summary-title" className="text-base font-semibold">{c.summary}</h2>
        <dl className={`mt-4 grid gap-4 ${money.carriedCount > 0 && money.sentCount > 0 ? "grid-cols-2" : ""}`}>
          {money.carriedCount > 0 && <div>
            <dt className="text-xs text-muted">{c.earned}</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight text-forest">~${Math.round(money.earned)}</dd>
            <dd className="mt-1 text-xs text-muted">{c.carriedCount(money.carriedCount)}</dd>
          </div>}
          {money.sentCount > 0 && <div>
            <dt className="text-xs text-muted">{c.spent}</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight text-forest">~${Math.round(money.spent)}</dd>
            <dd className="mt-1 text-xs text-muted">{c.sentCount(money.sentCount)}</dd>
          </div>}
        </dl>
        <details className="group mt-3 border-t border-line pt-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-muted [&::-webkit-details-marker]:hidden">
            {c.estimates}<ChevronDown size={15} className="shrink-0 transition group-open:rotate-180" aria-hidden />
          </summary>
          <div className="space-y-2 pb-1 text-xs leading-relaxed text-muted">
            <p>{t.money.caveat}</p>
            {money.sentCount > 0 && <p>{money.courierEquivalent >= money.spent
              ? t.money.saved(Math.round(money.courierEquivalent - money.spent))
              : t.money.above(Math.round(money.spent - money.courierEquivalent))}</p>}
          </div>
        </details>
      </section>}
    </div>

    {reviewer && <details className="card group">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <Settings2 size={19} className="shrink-0 text-forest" aria-hidden />
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-forest">{c.admin}</span>
          <p className="mt-0.5 text-xs text-muted">{c.adminHint}</p>
        </div>
        <ChevronDown size={18} className="shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <nav aria-label={c.admin} className="grid gap-2 border-t border-line p-3 sm:grid-cols-3">
        {[["/admin/verifications", c.verifications], ["/admin/matching", c.matching], ["/admin/reports", c.reports]].map(([href, label]) =>
          <Link key={href} href={href} className="flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-forest hover:bg-sand">
            {label}<ArrowRight size={16} className="shrink-0" aria-hidden />
          </Link>)}
      </nav>
    </details>}
  </div>;
}
