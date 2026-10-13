"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { addReview, fetchReviewsForMatches, type MatchDetail } from "@/lib/db";
import type { Review } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { reviewCopy } from "@/lib/locales/reviews";
import DeliveryReview from "./DeliveryReview";

export default function RatingsFeedback({ matches, myUserId }: { matches: MatchDetail[]; myUserId: string }) {
  const { lang } = useLang();
  const s = reviewCopy[lang];
  const completed = matches.filter((match) => match.status === "released");
  const matchKey = completed.map((match) => match.id).sort().join(",");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    setLoadedKey(null);
    fetchReviewsForMatches(matchKey ? matchKey.split(",") : []).then((items) => {
      if (active) { setReviews(items); setLoadedKey(matchKey); }
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [matchKey, myUserId, attempt]);

  const pendingCount = completed.filter((match) => !reviews.some((review) => review.matchId === match.id && review.authorId === myUserId)).length;

  return <section id="ratings" aria-labelledby="ratings-title" className="card mt-6 scroll-mt-24 p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="ratings-title" className="flex items-center gap-2 font-display text-xl font-bold text-forest">
        <Star size={21} className="fill-gold text-gold-deep" aria-hidden />{s.title}
      </h2>
      {!error && loadedKey === matchKey && pendingCount > 0 && <span className="rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-forest">{s.waiting(pendingCount)}</span>}
    </div>
    <p className="mt-2 text-sm text-muted">{completed.length ? s.intro : s.empty}</p>
    {completed.length > 0 && (error ? <div className="mt-4">
      <p role="alert" className="text-sm text-danger">{s.loadError}</p>
      <button type="button" className="btn-ghost mt-2" onClick={() => setAttempt((n) => n + 1)}>{s.retry}</button>
    </div> : loadedKey !== matchKey ? <p role="status" className="mt-4 text-sm text-muted">{s.loading}</p> : <div className="mt-4 space-y-3">
      {completed.map((match) => <DeliveryReview key={match.id} match={match}
        myReview={reviews.find((r) => r.matchId === match.id && r.authorId === myUserId)}
        theirReview={reviews.find((r) => r.matchId === match.id && r.authorId !== myUserId)}
        onSubmit={async (rating, comment) => {
          if (!match.counterpartyId) throw new Error("Missing match partner");
          const saved = await addReview(match.id, match.counterpartyId, rating, comment);
          setReviews((current) => [...current.filter((r) => !(r.matchId === match.id && r.authorId === myUserId)), saved]);
        }} />)}
    </div>)}
  </section>;
}
