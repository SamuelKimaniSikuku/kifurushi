"use client";

import Link from "next/link";
import { ArrowRight, BellRing, Calendar, Check, Pencil, Scale } from "lucide-react";
import { ParcelRequest, CATEGORY_LABELS } from "@/lib/types";
import { label } from "@/lib/countries";
import { personHref } from "@/lib/people";
import { useLang, useT } from "@/lib/i18n";
import Avatar from "@/components/ui/Avatar";
import ShareListing from "@/components/ShareListing";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

export default function ParcelCard({
  parcel,
  onOffer,
  requested,
  mine,
  pending = 0,
}: {
  parcel: ParcelRequest;
  onOffer?: (parcel: ParcelRequest) => void;
  requested?: boolean;
  mine?: boolean;
  pending?: number;
}) {
  const t = useT();
  const { lang } = useLang();
  const date = new Date(`${parcel.neededBy}T12:00:00`).toLocaleDateString(lang, {
    day: "numeric",
    month: "short",
  });
  const shareAction = (
    <ShareListing
      url={`https://www.kifurushiapp.com/parcels?open=${parcel.id}`}
      text={t.browse.shareText(parcel.fromCity, parcel.toCity)}
    />
  );

  return (
    <article className="card card-lift group flex h-full min-w-0 flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={parcel.senderName} />
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Link
              href={personHref(parcel.senderName)}
              className="truncate rounded text-base font-semibold text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2"
            >
              {parcel.senderName}
            </Link>
            {parcel.senderVerified ? (
              <VerifiedBadge small />
            ) : (
              <span className="inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-faint">
                {t.experience.unverified}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-display text-2xl font-extrabold leading-none text-forest">
            ${parcel.budgetUsd}
          </div>
          <p className="mt-1 text-sm text-muted">{t.experience.totalBudget}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 break-words font-semibold text-ink">{parcel.fromCity}</span>
          <span className="flex w-12 shrink-0 items-center gap-1.5" aria-hidden>
            <span className="flex-1 border-t border-dashed border-line-strong" />
            <ArrowRight size={16} strokeWidth={2} className="shrink-0 text-clay" />
            <span className="flex-1 border-t border-dashed border-line-strong" />
          </span>
          <span className="min-w-0 flex-1 break-words text-right font-semibold text-ink">{parcel.toCity}</span>
        </div>
        <div className="mt-1 text-xs text-muted">
          {label(parcel.fromCountry)} → {label(parcel.toCountry)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <Scale size={14} strokeWidth={2} className="shrink-0" aria-hidden />
          {parcel.weightKg} kg
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={14} strokeWidth={2} className="shrink-0" aria-hidden />
          {t.experience.neededBy} {date}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {parcel.categories.slice(0, 3).map((cat) => (
          <span key={cat} className="chip">
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
        {parcel.categories.length > 3 && (
          <span className="chip">+{parcel.categories.length - 3}</span>
        )}
      </div>
      <p className="line-clamp-2 text-sm text-muted">{parcel.description}</p>

      {mine ? (
        <div className="mt-auto space-y-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-line-strong px-2.5 py-1 text-[11px] font-semibold text-muted">
              {t.browse.yourParcel}
            </span>
            <Link
              href={`/post/parcel?edit=${parcel.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 text-[11px] font-semibold text-forest transition hover:border-forest"
            >
              <Pencil size={11} strokeWidth={2.5} aria-hidden />
              {t.browse.edit}
            </Link>
            <div className="ml-auto flex">{shareAction}</div>
          </div>
          {pending > 0 && (
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-xl bg-clay px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-clay-deep"
            >
              <BellRing size={16} strokeWidth={2} aria-hidden />
              {t.browse.pending(pending)}
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-auto flex items-stretch justify-end gap-2 pt-1">
          {onOffer && (requested ? (
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-success-bg px-3 py-2.5 text-sm font-semibold text-success"
            >
              <Check size={16} strokeWidth={2} className="shrink-0" aria-hidden />
              {t.browse.offerSent}
            </button>
          ) : (
            <button className="btn-primary min-w-0 flex-1 px-3" onClick={() => onOffer(parcel)}>
              {t.browse.offerToCarry}
            </button>
          ))}
          {shareAction}
        </div>
      )}
    </article>
  );
}
