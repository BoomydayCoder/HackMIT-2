import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { emptyProgress, parseProgress, type Progress } from "@/lib/progress";

/**
 * Accounts live in a single JSON file (MATHMATCH_DATA_DIR, default `.data/`).
 * That is plenty for a hackathon deployment on one box; swap `load`/`save`
 * for a database call if the app ever runs on more than one instance.
 */
const DATA_DIR = process.env.MATHMATCH_DATA_DIR ?? path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "accounts.json");
const SESSION_COOKIE = "mathmatch_session";
const SESSION_DAYS = 30;

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/i;
export const MIN_PASSWORD_LENGTH = 8;

type UserRecord = {
  username: string;
  salt: string;
  hash: string;
  createdAt: string;
  progress: Progress;
};

type SessionRecord = { username: string; expiresAt: string };

type Store = {
  users: Record<string, UserRecord>;
  sessions: Record<string, SessionRecord>;
};

export type PublicUser = { username: string };

function load(): Store {
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Partial<Store>;
    return { users: parsed.users ?? {}, sessions: parsed.sessions ?? {} };
  } catch {
    return { users: {}, sessions: {} };
  }
}

function save(store: Store) {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${STORE_PATH}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(store));
  renameSync(tmp, STORE_PATH);
}

const key = (username: string) => username.toLowerCase();

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function pruneSessions(store: Store) {
  const now = Date.now();
  for (const [token, session] of Object.entries(store.sessions)) {
    if (new Date(session.expiresAt).getTime() < now) delete store.sessions[token];
  }
}

function startSession(store: Store, username: string): string {
  pruneSessions(store);
  const token = randomBytes(32).toString("hex");
  store.sessions[token] = {
    username,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString(),
  };
  return token;
}

async function setSessionCookie(token: string | null) {
  const jar = await cookies();
  if (token) {
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DAYS * 86_400,
    });
  } else {
    jar.delete(SESSION_COOKIE);
  }
}

export type AuthResult =
  | { ok: true; user: PublicUser; progress: Progress }
  | { ok: false; error: string };

export async function signUp(username: string, password: string): Promise<AuthResult> {
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, error: "Usernames are 3–20 letters, digits or underscores." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  const store = load();
  if (store.users[key(username)]) return { ok: false, error: "That username is taken." };

  const salt = randomBytes(16).toString("hex");
  const user: UserRecord = {
    username,
    salt,
    hash: hashPassword(password, salt),
    createdAt: new Date().toISOString(),
    progress: emptyProgress(),
  };
  store.users[key(username)] = user;
  const token = startSession(store, user.username);
  save(store);
  await setSessionCookie(token);
  return { ok: true, user: { username: user.username }, progress: user.progress };
}

export async function signIn(username: string, password: string): Promise<AuthResult> {
  const store = load();
  const user = store.users[key(username)];
  const failure = { ok: false as const, error: "Wrong username or password." };
  if (!user) return failure;
  const expected = Buffer.from(user.hash, "hex");
  const actual = Buffer.from(hashPassword(password, user.salt), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return failure;

  const token = startSession(store, user.username);
  save(store);
  await setSessionCookie(token);
  return { ok: true, user: { username: user.username }, progress: user.progress };
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const store = load();
    if (store.sessions[token]) {
      delete store.sessions[token];
      save(store);
    }
  }
  await setSessionCookie(null);
}

async function currentRecord(store: Store): Promise<UserRecord | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = store.sessions[token];
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) return null;
  return store.users[key(session.username)] ?? null;
}

/** The signed-in user and their saved progress, or null for guests. */
export async function currentUser(): Promise<{ user: PublicUser; progress: Progress } | null> {
  const user = await currentRecord(load());
  return user ? { user: { username: user.username }, progress: user.progress } : null;
}

export async function saveProgress(value: unknown): Promise<PublicUser | null> {
  const store = load();
  const user = await currentRecord(store);
  if (!user) return null;
  user.progress = parseProgress(value);
  save(store);
  return { username: user.username };
}
