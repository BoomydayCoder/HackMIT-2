const SOLVED_KEY = "mathmatch:solved";
const RETIRED_KEY = "mathmatch:retired";
const GRADED_KEY = "mathmatch:graded";
const PINNED_KEY = "mathmatch:pinned";

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
 * The problem you last matched with: it stays at the front of the deck until
 * you solve it or pass on it.
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

/** Raw JSON of the ids you gave up on; they leave the deck like a solve does. */
export function readRetiredRaw(): string {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(RETIRED_KEY) ?? "[]";
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
 * Records that a problem has been graded; returns false once it has, so a
 * problem can be regraded but only ever moves your rating once.
 */
export function markGraded(problemId: string): boolean {
  if (typeof window === "undefined") return false;
  const graded = parseSolved(window.localStorage.getItem(GRADED_KEY) ?? "[]");
  if (graded.includes(problemId)) return false;
  window.localStorage.setItem(GRADED_KEY, JSON.stringify([...graded, problemId]));
  return true;
}
