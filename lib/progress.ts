export const PASS_SCORE = 5; // out of 7

const SOLVED_KEY = "mathmatch:solved";

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

/** Records a solve; returns false if the problem had already been solved. */
export function markSolved(problemId: string): boolean {
  const solved = parseSolved(readSolvedRaw());
  if (solved.includes(problemId)) return false;
  window.localStorage.setItem(SOLVED_KEY, JSON.stringify([...solved, problemId]));
  notifyProgress();
  return true;
}
