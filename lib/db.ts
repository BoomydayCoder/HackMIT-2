import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | undefined;

/**
 * Every account, friendship and duel lives in Postgres: two players sharing a
 * duel cannot be served from one process's local file. Connected on first use
 * so a build without credentials still succeeds.
 */
export function db(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  client ??= neon(url);
  return client;
}

const STATEMENTS = [
  `create table if not exists users (
     username text primary key,
     display_name text not null,
     salt text not null,
     hash text not null,
     created_at timestamptz not null default now(),
     bio text not null default '',
     avatar text not null default '',
     progress jsonb not null default '{}'::jsonb
   )`,
  `create table if not exists sessions (
     token text primary key,
     username text not null references users(username) on delete cascade,
     expires_at timestamptz not null
   )`,
  `create index if not exists sessions_username on sessions (username)`,
  /** One row per pair, keyed on the requester, so an accept is an update. */
  `create table if not exists friendships (
     requester text not null references users(username) on delete cascade,
     addressee text not null references users(username) on delete cascade,
     status text not null check (status in ('pending', 'accepted')),
     created_at timestamptz not null default now(),
     primary key (requester, addressee)
   )`,
  `create index if not exists friendships_addressee on friendships (addressee)`,
  /** cards is the dealt order of problem ids; their ratings stay server-side. */
  `create table if not exists duels (
     id text primary key,
     challenger text not null references users(username) on delete cascade,
     opponent text not null references users(username) on delete cascade,
     status text not null check (status in ('pending', 'active', 'finished', 'declined')),
     cards jsonb not null default '[]'::jsonb,
     created_at timestamptz not null default now(),
     ends_at timestamptz,
     finished_at timestamptz
   )`,
  `create index if not exists duels_players on duels (challenger, opponent, status)`,
  /** One row per card: the primary key is what makes a claim atomic. */
  `create table if not exists duel_claims (
     duel_id text not null references duels(id) on delete cascade,
     card text not null,
     username text not null references users(username) on delete cascade,
     claimed_at timestamptz not null default now(),
     primary key (duel_id, card)
   )`,
  `create table if not exists duel_attempts (
     id bigserial primary key,
     duel_id text not null references duels(id) on delete cascade,
     card text not null,
     username text not null references users(username) on delete cascade,
     score integer not null,
     created_at timestamptz not null default now()
   )`,
  `create index if not exists duel_attempts_card on duel_attempts (duel_id, card, username)`,
];

let migrated: Promise<void> | undefined;

/** Creates the schema once per process; every entry point awaits it. */
export function ready(): Promise<void> {
  migrated ??= (async () => {
    for (const statement of STATEMENTS) await db().query(statement);
  })().catch((error: unknown) => {
    migrated = undefined;
    throw error;
  });
  return migrated;
}
