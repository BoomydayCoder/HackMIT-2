const SOLVED_KEY = "mathmatch:solved";
const RETIRED_KEY = "mathmatch:retired";
const RATED_KEY = "mathmatch:graded";
const PINNED_KEY = "mathmatch:pinned";
export const RATINGS_KEY = "mathmatch:ratings";
export const REVIEWS_KEY = "mathmatch:reviews";

export const MAX_STARS = 5;
/** Ratings as the deck last showed them, so a gain earned elsewhere can be celebrated on return. */
export const RATINGS_SEEN_KEY = "mathmatch:ratings-seen";

const listeners = new Set<() => void>();

/** Shared store subscription for every piece of locally persisted progress. */
export function subscribeProgress(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyProgress() {
  listeners.forEach((listener) => listener());
}

/** Raw JSON of the solved-problem ids; a stable string so it can back a store snapshot. */
export function readSolvedRaw(): string {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(SOLVED_KEY) ?? "[]";
}

/** Raw JSON of the ids you gave up on; they leave the deck like a solve does. */
export function readRetiredRaw(): string {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(RETIRED_KEY) ?? "[]";
}

export function parseSolved(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * The problem you last matched with: the deck serves nothing else until you
 * solve it or give up on it.
 */
export function readPinned(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PINNED_KEY) ?? "";
}

export function writePinned(problemId: string) {
  if (typeof window === "undefined") return;
  if (problemId) window.localStorage.setItem(PINNED_KEY, problemId);
  else window.localStorage.removeItem(PINNED_KEY);
  notifyProgress();
}

/** Records a solve, taking the problem out of the deck and off the pin. */
export function markSolved(problemId: string) {
  const solved = parseSolved(readSolvedRaw());
  if (readPinned() === problemId) writePinned("");
  if (solved.includes(problemId)) return;
  window.localStorage.setItem(SOLVED_KEY, JSON.stringify([...solved, problemId]));
  notifyProgress();
}

/** Records a surrender, taking the problem out of the deck and off the pin. */
export function markRetired(problemId: string) {
  const retired = parseSolved(readRetiredRaw());
  if (readPinned() === problemId) writePinned("");
  if (retired.includes(problemId)) return;
  window.localStorage.setItem(RETIRED_KEY, JSON.stringify([...retired, problemId]));
  notifyProgress();
}

/**
 * Records that a problem has settled your rating; returns false once it has,
 * so a problem can only ever move your rating once.
 */
export function markRated(problemId: string): boolean {
  if (typeof window === "undefined") return false;
  const rated = parseSolved(window.localStorage.getItem(RATED_KEY) ?? "[]");
  if (rated.includes(problemId)) return false;
  window.localStorage.setItem(RATED_KEY, JSON.stringify([...rated, problemId]));
  notifyProgress();
  return true;
}

/** Star reviews (1–5) a player has given problems, keyed by problem id. */
export type Reviews = Record<string, number>;

/** Raw JSON of the star reviews; a stable string so it can back a store snapshot. */
export function readReviewsRaw(): string {
  if (typeof window === "undefined") return "{}";
  return window.localStorage.getItem(REVIEWS_KEY) ?? "{}";
}

export function parseReviews(raw: unknown): Reviews {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  const reviews: Reviews = {};
  if (!parsed || typeof parsed !== "object") return reviews;
  for (const [id, stars] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof stars === "number" && Number.isInteger(stars) && stars >= 1 && stars <= MAX_STARS) {
      reviews[id] = stars;
    }
  }
  return reviews;
}

/** Rates a problem 1–5 stars; 0 removes the review. */
export function rateProblem(problemId: string, stars: number) {
  if (typeof window === "undefined") return;
  const reviews = parseReviews(readReviewsRaw());
  if (stars >= 1 && stars <= MAX_STARS) reviews[problemId] = Math.round(stars);
  else delete reviews[problemId];
  window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  notifyProgress();
}

/** Everything that makes up a player's progress, in the shape the account API stores. */
export type Progress = {
  solved: string[];
  retired: string[];
  graded: string[];
  pinned: string;
  ratings: Record<string, number>;
  reviews: Reviews;
};

export function emptyProgress(): Progress {
  return { solved: [], retired: [], graded: [], pinned: "", ratings: {}, reviews: {} };
}

export function parseProgress(value: unknown): Progress {
  const progress = emptyProgress();
  if (!value || typeof value !== "object") return progress;
  const record = value as Record<string, unknown>;
  const ids = (list: unknown) =>
    Array.isArray(list) ? list.filter((id): id is string => typeof id === "string") : [];
  progress.solved = ids(record.solved);
  progress.retired = ids(record.retired);
  progress.graded = ids(record.graded);
  if (typeof record.pinned === "string") progress.pinned = record.pinned;
  if (record.ratings && typeof record.ratings === "object") {
    for (const [topic, rating] of Object.entries(record.ratings as Record<string, unknown>)) {
      if (typeof rating === "number" && Number.isFinite(rating)) progress.ratings[topic] = rating;
    }
  }
  progress.reviews = parseReviews(record.reviews);
  return progress;
}

export function readProgress(): Progress {
  if (typeof window === "undefined") return emptyProgress();
  let ratings: unknown = {};
  try {
    ratings = JSON.parse(window.localStorage.getItem(RATINGS_KEY) ?? "{}");
  } catch {
    // unreadable ratings count as none
  }
  return {
    solved: parseSolved(readSolvedRaw()),
    retired: parseSolved(readRetiredRaw()),
    graded: parseSolved(window.localStorage.getItem(RATED_KEY) ?? "[]"),
    pinned: readPinned(),
    ratings: parseProgress({ ratings }).ratings,
    reviews: parseReviews(readReviewsRaw()),
  };
}

/** Replaces the locally stored progress wholesale (used when an account loads). */
export function writeProgress(progress: Progress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOLVED_KEY, JSON.stringify(progress.solved));
  window.localStorage.setItem(RETIRED_KEY, JSON.stringify(progress.retired));
  window.localStorage.setItem(RATED_KEY, JSON.stringify(progress.graded));
  if (progress.pinned) window.localStorage.setItem(PINNED_KEY, progress.pinned);
  else window.localStorage.removeItem(PINNED_KEY);
  window.localStorage.setItem(RATINGS_KEY, JSON.stringify(progress.ratings));
  window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(progress.reviews));
  notifyProgress();
}

export function clearProgress() {
  writeProgress(emptyProgress());
}

/**
 * Combines what this browser has done with what an account has saved: solves,
 * surrenders and grades are unioned, saved ratings win over local ones, the
 * local pin is kept if there is one, and local reviews win over saved ones.
 */
export function mergeProgress(local: Progress, saved: Progress): Progress {
  return {
    solved: [...new Set([...saved.solved, ...local.solved])],
    retired: [...new Set([...saved.retired, ...local.retired])],
    graded: [...new Set([...saved.graded, ...local.graded])],
    pinned: local.pinned || saved.pinned,
    ratings: { ...local.ratings, ...saved.ratings },
    reviews: { ...saved.reviews, ...local.reviews },
  };
}
