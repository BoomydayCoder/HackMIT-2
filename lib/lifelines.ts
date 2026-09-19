export const STARTING_LIFELINES = 5;
export const MAX_LIFELINES = 10;
export const PASS_SCORE = 5; // out of 7

const LIFELINES_KEY = "mathmatch:lifelines";
const SOLVED_KEY = "mathmatch:solved";

export function readLifelines(): number {
  if (typeof window === "undefined") return STARTING_LIFELINES;
  const raw = window.localStorage.getItem(LIFELINES_KEY);
  const stored = Number(raw);
  if (raw === null || !Number.isFinite(stored)) return STARTING_LIFELINES;
  return Math.min(MAX_LIFELINES, Math.max(0, stored));
}

const listeners = new Set<() => void>();

/** Shared store subscription for every piece of locally persisted progress. */
export function subscribeProgress(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyProgress() {
  listeners.forEach((listener) => listener());
}

export function writeLifelines(value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIFELINES_KEY, String(Math.min(MAX_LIFELINES, Math.max(0, value))));
  notifyProgress();
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

/** Records a solve and grants a lifeline; returns null if the problem was already solved. */
export function awardLifeline(problemId: string): number | null {
  const solved = parseSolved(readSolvedRaw());
  if (solved.includes(problemId)) return null;
  window.localStorage.setItem(SOLVED_KEY, JSON.stringify([...solved, problemId]));
  const next = Math.min(MAX_LIFELINES, readLifelines() + 1);
  writeLifelines(next);
  return next;
}
