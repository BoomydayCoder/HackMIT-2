"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import type { DeckCard } from "@/lib/problems";
import { getProfile } from "@/lib/profiles";
import { parseReviews, readReviewsRaw, subscribeProgress } from "@/lib/progress";
import { matchPercent, recommend, tasteProfile } from "@/lib/recommend";

type ForYouProps = {
  pool: DeckCard[];
  limit?: number;
};

/** Live taste-based picks: re-ranks the moment a review changes. */
export default function ForYou({ pool, limit = 3 }: ForYouProps) {
  const reviewsRaw = useSyncExternalStore(subscribeProgress, readReviewsRaw, () => "{}");
  const reviews = useMemo(() => parseReviews(reviewsRaw), [reviewsRaw]);
  const taste = useMemo(() => tasteProfile(pool, reviews), [pool, reviews]);
  const picks = useMemo(() => recommend(pool, reviews, limit), [pool, reviews, limit]);
  const reviewed = Object.keys(reviews).length;

  return (
    <section className="similar-problems" aria-live="polite">
      <div className="card-label">Picked for you</div>
      {picks.length === 0 ? (
        <p className="star-rating-label">
          Rate a problem and picks will appear here.
        </p>
      ) : (
        <>
          <p className="star-rating-label">
            Based on {reviewed} rating{reviewed === 1 ? "" : "s"}; changes as you rate.
          </p>
          <ul>
            {picks.map((problem) => (
              <li key={problem.id}>
                <Link href={`/problems/${problem.id}`}>
                  <strong>{getProfile(problem).name}</strong>
                  <span>
                    {problem.topic} · Level {problem.level} · {matchPercent(problem, taste)}% match
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
