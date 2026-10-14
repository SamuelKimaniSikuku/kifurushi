"use client";

import { useId, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Star } from "lucide-react";
import type { MatchDetail } from "@/lib/db";
import type { Review } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { reviewCopy } from "@/lib/locales/reviews";
import { reviewSchema } from "@/lib/validation";
import Stars from "./ui/Stars";

export default function DeliveryReview({ match, myReview, theirReview, onSubmit }: {
  match: MatchDetail;
  myReview?: Review;
  theirReview?: Review;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}) {
  const { lang } = useLang();
  const s = reviewCopy[lang];
  const id = useId();
  const [open, setOpen] = useState(!myReview);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const sending = useRef(false);
  const firstStar = useRef<HTMLInputElement>(null);
  const isRatingSender = match.role === "traveler";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending.current) return;
    const parsed = reviewSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      setError(rating < 1 ? s.chooseError : s.commentError);
      if (rating < 1) firstStar.current?.focus();
      return;
    }
    sending.current = true;
    setSaving(true);
    setError("");
    try {
      await onSubmit(parsed.data.rating, parsed.data.comment);
      setSaved(true);
    } catch {
      setError(s.saveError);
    } finally {
      sending.current = false;
      setSaving(false);
    }
  }

  return <article id={`review-${match.id}`} className="scroll-mt-24 rounded-xl border border-line bg-white p-4 sm:p-5">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={`${id}-body`}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
      <span className="min-w-0">
        <span className="block text-xs font-medium text-muted">{isRatingSender ? s.rateSender : s.rateTraveller}</span>
        <span className="block break-words font-semibold text-forest">{match.counterpartyName}</span>
        <span className="block text-xs text-muted">{match.route} · {new Date(match.updatedAt).toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" })}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {myReview && <CheckCircle2 size={18} className="text-success" aria-label={s.yourReview} />}
        <ChevronDown size={18} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </span>
    </button>
    <div id={`${id}-body`} hidden={!open}>
      {saved && <p role="status" className="mt-3 text-sm font-medium text-success">{s.saved}</p>}
      {myReview ? <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold text-muted">{s.yourReview}</p>
        <Stars rating={myReview.rating} label={s.stars(myReview.rating)} />
        {myReview.comment && <p className="whitespace-pre-wrap break-words text-sm">{myReview.comment}</p>}
      </div> : !match.counterpartyId ? <p role="alert" className="mt-3 text-sm text-danger">{s.missingPartner}</p> : <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
        <fieldset disabled={saving} aria-describedby={`${id}-score`}>
          <legend className="text-sm font-semibold">{s.rating(match.counterpartyName)}</legend>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => <label key={n} className="relative grid h-11 w-11 cursor-pointer place-items-center">
              <input ref={n === 1 ? firstStar : undefined} type="radio" name={`${id}-rating`} value={n}
                checked={rating === n} onChange={() => { setRating(n); setError(""); }} aria-label={s.stars(n)}
                className="peer sr-only" />
              <span className="absolute inset-0 rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-leaf peer-disabled:opacity-50" />
              <Star size={29} className={n <= rating ? "fill-gold text-gold-deep" : "text-line-strong"} aria-hidden />
            </label>)}
          </div>
          <p id={`${id}-score`} className="min-h-5 text-xs text-muted" aria-live="polite">{rating ? s.scores[rating - 1] : s.choose}</p>
        </fieldset>
        <div>
          <label htmlFor={`${id}-comment`} className="field-label">{s.feedback(match.counterpartyName)}</label>
          <textarea id={`${id}-comment`} className="field min-h-[80px]" value={comment} maxLength={300} disabled={saving}
            placeholder={isRatingSender ? s.senderHint : s.travellerHint}
            aria-describedby={`${id}-privacy ${id}-count`}
            onChange={(e) => { setComment(e.target.value); setError(""); }} />
          <p id={`${id}-count`} className="mt-1 text-right text-xs text-muted">{comment.length}/300</p>
        </div>
        <p id={`${id}-privacy`} className="text-xs leading-relaxed text-muted">{s.privacy}</p>
        {error && <p role="alert" className="field-error">{error}</p>}
        <button type="submit" className="btn-accent min-h-11 w-full sm:w-auto" disabled={saving}>{saving ? s.saving : s.submit}</button>
      </form>}
      {theirReview && <div className="mt-4 space-y-2 border-t border-line pt-4">
        <p className="text-xs font-semibold text-muted">{s.from(theirReview.authorName)}</p>
        <Stars rating={theirReview.rating} label={s.stars(theirReview.rating)} />
        {theirReview.comment && <p className="whitespace-pre-wrap break-words text-sm">{theirReview.comment}</p>}
      </div>}
    </div>
  </article>;
}
