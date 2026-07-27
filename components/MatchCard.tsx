"use client";

import { useState } from "react";
import { ChevronRight, Plane, Send, Star } from "lucide-react";
import { Match, STATUS_LABELS, STATUS_ORDER, TransitUpdate, Review } from "@/lib/types";
import {
  advanceMatch, getTransitUpdates, addTransitUpdate, getReview, addReview,
} from "@/lib/store";
import { transitUpdateSchema, reviewSchema } from "@/lib/validation";
import Stars from "@/components/ui/Stars";

export default function MatchCard({
  match,
  title,
  authorName,
  onChanged,
}: {
  match: Match;
  title: string;
  authorName: string;
  onChanged: () => void;
}) {
  const [updates, setUpdates] = useState<TransitUpdate[]>(() => getTransitUpdates(match.id));
  const [review, setReview] = useState<Review | undefined>(() => getReview(match.id));
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");

  const idx = STATUS_ORDER.indexOf(match.status);
  const done = match.status === "released";
  const inTransit = match.status === "picked_up" || match.status === "in_transit";
  const received = match.status === "delivered" || match.status === "released";

  const noteId = `journey-update-${match.id}`;
  const noteErrorId = `journey-update-error-${match.id}`;
  const commentId = `review-comment-${match.id}`;
  const reviewErrorId = `review-error-${match.id}`;

  function postUpdate(e: React.FormEvent) {
    e.preventDefault();
    const parsed = transitUpdateSchema.safeParse(note);
    if (!parsed.success) {
      setNoteError(parsed.error.issues[0]?.message ?? "Invalid update");
      return;
    }
    addTransitUpdate(match.id, parsed.data);
    setUpdates(getTransitUpdates(match.id));
    setNote("");
    setNoteError("");
  }

  function submitReview(e: React.FormEvent) {
    e.preventDefault();
    const parsed = reviewSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      setReviewError(parsed.error.issues[0]?.message ?? "Invalid review");
      return;
    }
    setReview(addReview(match.id, authorName, parsed.data.rating, parsed.data.comment));
    setReviewError("");
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold text-base">{title}</div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
          done ? "bg-success-bg text-success" : "bg-warn-bg text-warn"
        }`}>
          {STATUS_LABELS[match.status]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 flex items-center gap-1">
        {STATUS_ORDER.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= idx ? "bg-forest" : "bg-sand-deep"}`} />
            <div className={`mt-1.5 hidden text-[10px] uppercase tracking-wide sm:block ${
              i <= idx ? "font-semibold text-forest" : "text-faint"
            }`}>
              {STATUS_LABELS[s]}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted sm:hidden">
        {STATUS_LABELS[match.status]}
        {!done && ` · next: ${STATUS_LABELS[STATUS_ORDER[idx + 1]]}`}
      </p>

      {!done && (
        <button
          className="btn-ghost mt-4 min-h-[44px] text-xs"
          onClick={() => { advanceMatch(match.id); onChanged(); }}
        >
          Advance status
          <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {STATUS_LABELS[STATUS_ORDER[idx + 1]]}
        </button>
      )}

      {/* Journey updates: visible from pickup onward */}
      {(inTransit || (received && updates.length > 0)) && (
        <div className="mt-5 rounded-xl bg-sand p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-forest">
            <Plane className="h-4 w-4 shrink-0 text-forest" strokeWidth={2} aria-hidden />
            Journey updates
          </div>
          {updates.length > 0 ? (
            <ul className="mt-3 space-y-3 border-l border-line pl-4">
              {updates.map((u) => (
                <li key={u.id} className="relative text-sm text-ink">
                  <span
                    aria-hidden
                    className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-clay ring-2 ring-sand"
                  />
                  <div>
                    {u.note}
                    <span className="ml-2 text-xs text-faint">
                      {new Date(u.createdAt).toLocaleString(undefined, {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-faint">
              No updates yet — post the first one so the sender and receiver can follow along.
            </p>
          )}

          {inTransit && (
            <form onSubmit={postUpdate} className="mt-3 flex gap-2">
              <input
                id={noteId}
                aria-label="Journey update"
                aria-invalid={noteError ? true : undefined}
                aria-describedby={noteError ? noteErrorId : undefined}
                className={`field flex-1 ${noteError ? "field-invalid" : ""}`}
                placeholder="e.g. Landed in Lagos, heading to Ikeja pickup point"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
              />
              <button type="submit" className="btn-primary min-h-[44px] shrink-0">
                <Send className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                Post
              </button>
            </form>
          )}
          {noteError && <p id={noteErrorId} className="field-error">{noteError}</p>}
        </div>
      )}

      {/* Review: available once the parcel has been received */}
      {received && (
        <div className="mt-5 rounded-xl bg-sand p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-forest">
            <Star className="h-4 w-4 shrink-0 fill-gold text-gold" strokeWidth={2} aria-hidden />
            Rate this delivery
          </div>

          {review ? (
            <div className="mt-3">
              <Stars rating={review.rating} />
              {review.comment && (
                <blockquote className="mt-2 border-l-2 border-line-strong pl-3 text-sm text-ink">
                  “{review.comment}”
                </blockquote>
              )}
              <p className="mt-2 text-xs text-faint">
                By {review.authorName} · reviews are public and can&apos;t be edited.
              </p>
            </div>
          ) : (
            <form onSubmit={submitReview} className="mt-3 space-y-3">
              <div
                role="group"
                aria-label="Rating"
                aria-describedby={reviewError ? reviewErrorId : undefined}
                className="flex gap-1"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    aria-pressed={rating >= n}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className="grid h-10 w-10 place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        n <= (hover || rating) ? "fill-gold text-gold-deep" : "text-line-strong"
                      }`}
                      strokeWidth={2}
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
              <label htmlFor={commentId} className="sr-only">
                Review comment
              </label>
              <textarea
                id={commentId}
                aria-invalid={reviewError ? true : undefined}
                aria-describedby={reviewError ? reviewErrorId : undefined}
                className={`field min-h-[70px] ${reviewError ? "field-invalid" : ""}`}
                placeholder="How was the delivery? Your review is public and helps the next sender."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={300}
              />
              {reviewError && (
                <p id={reviewErrorId} className="field-error">{reviewError}</p>
              )}
              <button type="submit" className="btn-accent min-h-[44px]">Submit review</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
