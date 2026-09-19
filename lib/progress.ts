const SOLVED_KEY = "mathmatch:solved";
const GRADED_KEY = "mathmatch:graded";
const PINNED_KEY = "mathmatch:pinned";
export const RATINGS_KEY = "mathmatch:ratings";

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

export function parseSolved(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * The problem you last picked: it stays at the front of the deck until you
 * solve it or skip it.
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

/**
 * Records that a problem has been graded; returns false once it has, so a
 * problem can be regraded but only ever moves your rating once.
 */
export function markGraded(problemId: string): boolean {
  if (typeof window === "undefined") return false;
  const graded = parseSolved(window.localStorage.getItem(GRADED_KEY) ?? "[]");
  if (graded.includes(problemId)) return false;
  window.localStorage.setItem(GRADED_KEY, JSON.stringify([...graded, problemId]));
  notifyProgress();
  return true;
}

/** Everything that makes up a player's progress, in the shape the account API stores. */
export type Progress = {
  solved: string[];
  graded: string[];
  pinned: string;
  ratings: Record<string, number>;
};

export function emptyProgress(): Progress {
  return { solved: [], graded: [], pinned: "", ratings: {} };
}

export function parseProgress(value: unknown): Progress {
  const progress = emptyProgress();
  if (!value || typeof value !== "object") return progress;
  const record = value as Record<string, unknown>;
  const ids = (list: unknown) =>
    Array.isArray(list) ? list.filter((id): id is string => typeof id === "string") : [];
  progress.solved = ids(record.solved);
  progress.graded = ids(record.graded);
  if (typeof record.pinned === "string") progress.pinned = record.pinned;
  if (record.ratings && typeof record.ratings === "object") {
    for (const [topic, rating] of Object.entries(record.ratings as Record<string, unknown>)) {
      if (typeof rating === "number" && Number.isFinite(rating)) progress.ratings[topic] = rating;
    }
  }
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
    graded: parseSolved(window.localStorage.getItem(GRADED_KEY) ?? "[]"),
    pinned: readPinned(),
    ratings: parseProgress({ ratings }).ratings,
  };
}

/** Replaces the locally stored progress wholesale (used when an account loads). */
export function writeProgress(progress: Progress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOLVED_KEY, JSON.stringify(progress.solved));
  window.localStorage.setItem(GRADED_KEY, JSON.stringify(progress.graded));
  if (progress.pinned) window.localStorage.setItem(PINNED_KEY, progress.pinned);
  else window.localStorage.removeItem(PINNED_KEY);
  window.localStorage.setItem(RATINGS_KEY, JSON.stringify(progress.ratings));
  notifyProgress();
}

export function clearProgress() {
  writeProgress(emptyProgress());
}

/**
 * Combines what this browser has done with what an account has saved: solves
 * and grades are unioned, saved ratings win over local ones, and the local pin
 * is kept if there is one.
 */
export function mergeProgress(local: Progress, saved: Progress): Progress {
  return {
    solved: [...new Set([...saved.solved, ...local.solved])],
    graded: [...new Set([...saved.graded, ...local.graded])],
    pinned: local.pinned || saved.pinned,
    ratings: { ...local.ratings, ...saved.ratings },
  };
}
