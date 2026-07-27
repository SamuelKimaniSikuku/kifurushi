"use client";

import { useState } from "react";
import { Match, STATUS_LABELS, STATUS_ORDER, TransitUpdate, Review } from "@/lib/types";
import {
  advanceMatch, getTransitUpdates, addTransitUpdate, getReview, addReview,
} from "@/lib/store";
import { transitUpdateSchema, reviewSchema } from "@/lib/validation";

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
        <div className="font-semibold">{title}</div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
          done ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
        }`}>
          {STATUS_LABELS[match.status]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 flex items-center gap-1">
        {STATUS_ORDER.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= idx ? "bg-[var(--forest)]" : "bg-[var(--sand-deep)]"}`} />
            <div className={`mt-1 hidden text-[9px] uppercase tracking-wide sm:block ${
              i <= idx ? "text-[var(--forest)] font-semibold" : "text-[#a8a494]"
            }`}>
              {STATUS_LABELS[s]}
            </div>
          </div>
        ))}
      </div>

      {!done && (
        <button
          className="btn-ghost mt-4 text-xs"
          onClick={() => { advanceMatch(match.id); onChanged(); }}
        >
          Advance status → {STATUS_LABELS[STATUS_ORDER[idx + 1]]}
        </button>
      )}

      {/* Journey updates: visible from pickup onward */}
      {(inTransit || (received && updates.length > 0)) && (
        <div className="mt-5 rounded-xl bg-[var(--sand)] p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--forest)]">
            ✈️ Journey updates
          </div>
          {updates.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {updates.map((u) => (
                <li key={u.id} className="flex gap-2 text-sm text-[#3d4a43]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--clay)]" />
                  <div>
                    {u.note}
                    <span className="ml-2 text-xs text-[#8a8574]">
                      {new Date(u.createdAt).toLocaleString(undefined, {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-[#8a8574]">
              No updates yet — post the first one so the sender and receiver can follow along.
            </p>
          )}

          {inTransit && (
            <form onSubmit={postUpdate} className="mt-3 flex gap-2">
              <input
                className="field flex-1"
                placeholder="e.g. Landed in Lagos, heading to Ikeja pickup point"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
              />
              <button type="submit" className="btn-primary shrink-0">Post</button>
            </form>
          )}
          {noteError && <p className="field-error">{noteError}</p>}
        </div>
      )}

      {/* Review: available once the parcel has been received */}
      {received && (
        <div className="mt-5 rounded-xl bg-[var(--sand)] p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--forest)]">
            ⭐ Rate this delivery
          </div>

          {review ? (
            <div className="mt-3">
              <div className="text-lg text-[var(--gold)]" aria-label={`${review.rating} out of 5 stars`}>
                {"★".repeat(review.rating)}
                <span className="text-[#d8cfbc]">{"★".repeat(5 - review.rating)}</span>
              </div>
              {review.comment && (
                <p className="mt-1 text-sm text-[#3d4a43]">“{review.comment}”</p>
              )}
              <p className="mt-1 text-xs text-[#8a8574]">
                By {review.authorName} · reviews are public and can&apos;t be edited.
              </p>
            </div>
          ) : (
            <form onSubmit={submitReview} className="mt-3 space-y-3">
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className={`text-2xl transition ${
                      n <= (hover || rating) ? "text-[var(--gold)]" : "text-[#d8cfbc]"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className="field min-h-[70px]"
                placeholder="How was the delivery? Your review is public and helps the next sender."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={300}
              />
              {reviewError && <p className="field-error">{reviewError}</p>}
              <button type="submit" className="btn-accent">Submit review</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
