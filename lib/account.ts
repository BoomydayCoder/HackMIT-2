"use client";

import { useSyncExternalStore } from "react";
import {
  clearProgress,
  mergeProgress,
  parseProgress,
  readProgress,
  subscribeProgress,
  writeProgress,
  type Progress,
} from "@/lib/progress";

export type Account = { username: string };

/** `undefined` until the session has been checked, then the user or null for a guest. */
type AccountState = Account | null | undefined;

let account: AccountState;
const listeners = new Set<() => void>();
let syncTimer: number | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setAccount(next: AccountState) {
  account = next;
  listeners.forEach((listener) => listener());
}

export function useAccount(): AccountState {
  return useSyncExternalStore(
    subscribe,
    () => account,
    () => undefined,
  );
}

type SessionPayload = { user: Account | null; progress?: unknown; error?: string };

async function send(method: "POST" | "PUT", url: string, body?: unknown): Promise<SessionPayload> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json()) as SessionPayload;
  if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

/** Pushes the browser's progress to the account, coalescing bursts of changes. */
function scheduleSync() {
  if (!account) return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    void send("PUT", "/api/progress", readProgress()).catch(() => {
      // Offline or signed out elsewhere: local storage still has everything.
    });
  }, 400);
}

/** Adopts an account: merges saved progress into this browser and saves the result. */
function adopt(user: Account, saved: unknown) {
  const merged = mergeProgress(readProgress(), parseProgress(saved));
  setAccount(user);
  writeProgress(merged);
}

/**
 * Starts the account session for this tab: finds out who is signed in and
 * keeps their progress in sync from then on. Returns a teardown.
 */
export function startAccountSession(): () => void {
  const unsubscribe = subscribeProgress(scheduleSync);
  if (account === undefined) {
    fetch("/api/auth/session")
      .then((response) => response.json() as Promise<SessionPayload>)
      .then((data) => {
        if (data.user) adopt(data.user, data.progress);
        else setAccount(null);
      })
      .catch(() => setAccount(null));
  }
  return () => {
    unsubscribe();
  };
}

export async function signUp(username: string, password: string) {
  const data = await send("POST", "/api/auth/signup", { username, password });
  if (data.user) adopt(data.user, data.progress);
}

export async function signIn(username: string, password: string) {
  const data = await send("POST", "/api/auth/login", { username, password });
  if (data.user) adopt(data.user, data.progress);
}

/** Ends the session; progress stays on the account and this browser starts fresh. */
export async function signOut() {
  window.clearTimeout(syncTimer);
  try {
    await send("PUT", "/api/progress", readProgress());
  } catch {
    // best effort: the debounced sync has most likely already saved it
  }
  await send("POST", "/api/auth/logout");
  setAccount(null);
  clearProgress();
}

export type { Progress };
