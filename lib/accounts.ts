import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db, ready } from "@/lib/db";
import { emptyProgress, parseProgress, type Progress } from "@/lib/progress";

const SESSION_COOKIE = "mathmatch_session";
const SESSION_DAYS = 30;

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/i;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_BIO_LENGTH = 240;

type UserRow = {
  username: string;
  display_name: string;
  salt: string;
  hash: string;
  bio: string;
  avatar: string;
  progress: unknown;
};

export type PublicUser = { username: string };

/** A player as everyone else sees them. */
export type PublicProfile = {
  username: string;
  bio: string;
  avatar: string;
  ratings: Record<string, number>;
  solved: number;
};

const key = (username: string) => username.toLowerCase();

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function publicProfile(row: UserRow): PublicProfile {
  const progress = parseProgress(row.progress);
  return {
    username: row.display_name,
    bio: row.bio,
    avatar: row.avatar,
    ratings: progress.ratings,
    solved: progress.solved.length,
  };
}

async function startSession(username: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  await db()`delete from sessions where expires_at < now()`;
  await db()`insert into sessions (token, username, expires_at)
            values (${token}, ${key(username)}, ${expiresAt})`;
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
  await ready();

  const salt = randomBytes(16).toString("hex");
  const progress = emptyProgress();
  const inserted = await db()`
    insert into users (username, display_name, salt, hash, progress)
    values (${key(username)}, ${username}, ${salt}, ${hashPassword(password, salt)},
            ${JSON.stringify(progress)}::jsonb)
    on conflict (username) do nothing
    returning display_name`;
  if (inserted.length === 0) return { ok: false, error: "That username is taken." };

  await setSessionCookie(await startSession(username));
  return { ok: true, user: { username }, progress };
}

export async function signIn(username: string, password: string): Promise<AuthResult> {
  await ready();
  const failure = { ok: false as const, error: "Wrong username or password." };
  const rows = (await db()`select * from users where username = ${key(username)}`) as UserRow[];
  const user = rows[0];
  if (!user) return failure;

  const expected = Buffer.from(user.hash, "hex");
  const actual = Buffer.from(hashPassword(password, user.salt), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return failure;

  await setSessionCookie(await startSession(user.username));
  return {
    ok: true,
    user: { username: user.display_name },
    progress: parseProgress(user.progress),
  };
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await ready();
    await db()`delete from sessions where token = ${token}`;
  }
  await setSessionCookie(null);
}

async function currentRow(): Promise<UserRow | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  await ready();
  const rows = (await db()`
    select users.* from sessions
    join users on users.username = sessions.username
    where sessions.token = ${token} and sessions.expires_at > now()`) as UserRow[];
  return rows[0] ?? null;
}

/** The signed-in user and their saved progress, or null for guests. */
export async function currentUser(): Promise<{ user: PublicUser; progress: Progress } | null> {
  const row = await currentRow();
  if (!row) return null;
  return { user: { username: row.display_name }, progress: parseProgress(row.progress) };
}

export async function saveProgress(value: unknown): Promise<PublicUser | null> {
  const row = await currentRow();
  if (!row) return null;
  const progress = parseProgress(value);
  await db()`update users set progress = ${JSON.stringify(progress)}::jsonb
            where username = ${row.username}`;
  return { username: row.display_name };
}

/** The signed-in player's own profile, editable fields included. */
export async function currentProfile(): Promise<PublicProfile | null> {
  const row = await currentRow();
  return row ? publicProfile(row) : null;
}

export async function findProfile(username: string): Promise<PublicProfile | null> {
  await ready();
  const rows = (await db()`select * from users where username = ${key(username)}`) as UserRow[];
  return rows[0] ? publicProfile(rows[0]) : null;
}

export async function updateProfile(fields: {
  bio?: string;
  avatar?: string;
}): Promise<PublicProfile | null> {
  const row = await currentRow();
  if (!row) return null;
  const bio = (fields.bio ?? row.bio).slice(0, MAX_BIO_LENGTH);
  const avatar = fields.avatar ?? row.avatar;
  await db()`update users set bio = ${bio}, avatar = ${avatar} where username = ${row.username}`;
  return publicProfile({ ...row, bio, avatar });
}

/** Usernames matching a prefix, for the friend search box. */
export async function searchUsers(term: string, limit = 8): Promise<string[]> {
  await ready();
  const needle = `${term.toLowerCase().replace(/[%_\\]/g, "\\$&")}%`;
  const rows = (await db()`
    select display_name from users
    where username like ${needle} order by username limit ${limit}`) as {
    display_name: string;
  }[];
  return rows.map((row) => row.display_name);
}

export { key as usernameKey };
