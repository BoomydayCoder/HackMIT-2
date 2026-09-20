"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  MAX_STARS,
  parseReviews,
  rateProblem,
  readReviewsRaw,
  subscribeProgress,
} from "@/lib/progress";

const LABELS = ["", "Not for me", "Meh", "Decent", "Liked it", "Loved it"];

type StarRatingProps = {
  problemId: string;
};

/** Five-star review of a problem; clicking the current star clears it. */
export default function StarRating({ problemId }: StarRatingProps) {
  const reviewsRaw = useSyncExternalStore(subscribeProgress, readReviewsRaw, () => "{}");
  const stars = useMemo(() => parseReviews(reviewsRaw)[problemId] ?? 0, [reviewsRaw, problemId]);

  return (
    <div className="star-rating">
      <div className="star-rating-head">
        <span className="card-label">Rate this problem</span>
        <span className="star-rating-label">
          {stars ? LABELS[stars] : "Ratings tune which challengers you meet next."}
        </span>
      </div>
      <div className="star-row" role="radiogroup" aria-label="Problem rating">
        {Array.from({ length: MAX_STARS }, (_, index) => index + 1).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={stars === value}
            aria-label={`${value} star${value === 1 ? "" : "s"}: ${LABELS[value]}`}
            className={`star${value <= stars ? " star-on" : ""}`}
            onClick={() => rateProblem(problemId, stars === value ? 0 : value)}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
