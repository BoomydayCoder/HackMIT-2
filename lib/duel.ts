import { randomBytes } from "node:crypto";
import { usernameKey } from "@/lib/accounts";
import { challengerName, characterFor } from "@/lib/characters";
import { db, ready } from "@/lib/db";
import { getProblem, PROBLEMS, type Problem } from "@/lib/problems";
import { parseProgress } from "@/lib/progress";

export const DUEL_CARDS = 10;
export const DUEL_MINUTES = 15;
export const CARDS_TO_WIN = 6;
export const MAX_ATTEMPTS = 3;
/** Sketch: duels are about finding the idea, not writing it up. */
export const DUEL_RIGOR = 4 as const;

export type DuelStatus = "pending" | "active" | "finished" | "declined";

/** The portrait on a card face: flavour only, and it gives no difficulty away. */
export type Portrait = { name: string; alt: string; src: string; width: number; height: number };

function portraitFor(cardId: string, topic: string): Portrait | null {
  const character = characterFor(cardId, topic);
  if (!character) return null;
  return {
    name: challengerName(cardId, topic),
    alt: character.alt,
    src: character.image.src,
    width: character.image.width,
    height: character.image.height,
  };
}

export type BoardCard = {
  index: number;
  topic: string;
  character: Portrait | null;
  /** Display name of the claimer, or null while the card is still open. */
  claimedBy: string | null;
  claimedAt: string | null;
  attempts: number;
};

export type DuelView = {
  id: string;
  status: DuelStatus;
  you: string;
  them: string;
  yours: number;
  theirs: number;
  cards: BoardCard[];
  endsAt: string | null;
  winner: string | null;
};

type DuelRow = {
  id: string;
  challenger: string;
  opponent: string;
  status: DuelStatus;
  cards: unknown;
  ends_at: string | null;
};

type ClaimRow = { card: string; username: string; claimed_at: string };

const tier = (problem: Problem) =>
  /USA[JM]MO/.test(problem.set) ? "olympiad" : /AIME/.test(problem.set) ? "aime" : "amc";

function take<T>(pool: T[], count: number): T[] {
  const picked: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

/**
 * Seven early-contest cards, two AIME and one olympiad, centred on the two
 * players but deliberately skewed easy so six claims are reachable inside the
 * clock. Ratings never leave this module: the board shows only the topic.
 */
export function dealCards(centre: number): string[] {
  const near = (problem: Problem) => Math.abs(problem.elo - centre);
  const byTier = (name: string, span: number) =>
    PROBLEMS.filter((problem) => tier(problem) === name && near(problem) <= span);

  const amc = byTier("amc", 350);
  const chosen = [
    ...take(amc.length >= 7 ? amc : PROBLEMS.filter((p) => tier(p) === "amc"), 7),
    ...take(
      byTier("aime", 500).length >= 2
        ? byTier("aime", 500)
        : PROBLEMS.filter((p) => tier(p) === "aime"),
      2,
    ),
    ...take(
      PROBLEMS.filter((problem) => tier(problem) === "olympiad"),
      1,
    ),
  ];
  return chosen.sort(() => Math.random() - 0.5).map((problem) => problem.id);
}

async function overallRating(username: string): Promise<number> {
  const rows = (await db()`select progress from users where username = ${username}`) as {
    progress: unknown;
  }[];
  const ratings = Object.values(parseProgress(rows[0]?.progress).ratings);
  if (ratings.length === 0) return 1000;
  return Math.round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length);
}

/** Challenges someone; the deck is only dealt once they accept. */
export async function challenge(from: string, to: string): Promise<string | null> {
  const me = usernameKey(from);
  const them = usernameKey(to);
  if (me === them) return null;
  await ready();

  const existing = (await db()`
    select id from duels
    where status in ('pending', 'active')
      and ((challenger = ${me} and opponent = ${them})
        or (challenger = ${them} and opponent = ${me}))`) as { id: string }[];
  if (existing[0]) return existing[0].id;

  const id = randomBytes(9).toString("hex");
  await db()`insert into duels (id, challenger, opponent, status)
             values (${id}, ${me}, ${them}, 'pending')`;
  return id;
}

/** Deals the deck and starts the clock. Only the challenged player may accept. */
export async function accept(id: string, username: string): Promise<boolean> {
  const me = usernameKey(username);
  await ready();
  const rows = (await db()`select * from duels where id = ${id}`) as DuelRow[];
  const duel = rows[0];
  if (!duel || duel.status !== "pending" || duel.opponent !== me) return false;

  const centre = Math.round(
    ((await overallRating(duel.challenger)) + (await overallRating(duel.opponent))) / 2,
  );
  const endsAt = new Date(Date.now() + DUEL_MINUTES * 60_000).toISOString();
  const started = await db()`
    update duels set status = 'active', cards = ${JSON.stringify(dealCards(centre))}::jsonb,
                     ends_at = ${endsAt}
    where id = ${id} and status = 'pending'
    returning id`;
  return started.length > 0;
}

export async function decline(id: string, username: string): Promise<void> {
  const me = usernameKey(username);
  await ready();
  await db()`update duels set status = 'declined'
             where id = ${id} and status = 'pending' and (challenger = ${me} or opponent = ${me})`;
}

function cardIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
}

async function loadDuel(id: string): Promise<DuelRow | null> {
  await ready();
  const rows = (await db()`select * from duels where id = ${id}`) as DuelRow[];
  return rows[0] ?? null;
}

/** Ends the duel the moment either the clock or the sixth claim says so. */
async function settle(duel: DuelRow, claims: ClaimRow[]): Promise<DuelStatus> {
  if (duel.status !== "active") return duel.status;
  const expired = duel.ends_at !== null && new Date(duel.ends_at).getTime() <= Date.now();
  const decided = [duel.challenger, duel.opponent].some(
    (player) => claims.filter((claim) => claim.username === player).length >= CARDS_TO_WIN,
  );
  if (!expired && !decided) return "active";
  await db()`update duels set status = 'finished', finished_at = now()
             where id = ${duel.id} and status = 'active'`;
  return "finished";
}

const displayNames = async (keys: string[]) =>
  Object.fromEntries(
    (
      (await db()`select username, display_name from users
                  where username = any(${keys}::text[])`) as {
        username: string;
        display_name: string;
      }[]
    ).map((row) => [row.username, row.display_name]),
  );

/** The board as one player sees it: topics and claims, never a card's rating. */
export async function boardFor(id: string, username: string): Promise<DuelView | null> {
  const me = usernameKey(username);
  const duel = await loadDuel(id);
  if (!duel || (duel.challenger !== me && duel.opponent !== me)) return null;

  const claims = (await db()`select card, username, claimed_at from duel_claims
                             where duel_id = ${id}`) as ClaimRow[];
  const attempts = (await db()`
    select card, count(*)::int as used from duel_attempts
    where duel_id = ${id} and username = ${me} group by card`) as {
    card: string;
    used: number;
  }[];
  const status = await settle(duel, claims);
  const them = me === duel.challenger ? duel.opponent : duel.challenger;
  const names = await displayNames([duel.challenger, duel.opponent]);

  const score = (player: string) => claims.filter((claim) => claim.username === player).length;
  const yours = score(me);
  const theirs = score(them);

  return {
    id,
    status,
    you: names[me] ?? me,
    them: names[them] ?? them,
    yours,
    theirs,
    endsAt: duel.ends_at,
    winner:
      status !== "finished"
        ? null
        : yours === theirs
          ? null
          : names[yours > theirs ? me : them] ?? null,
    cards: cardIds(duel.cards).map((cardId, index) => {
      const claim = claims.find((row) => row.card === cardId);
      const topic = getProblem(cardId)?.topic ?? "";
      return {
        index,
        topic,
        character: portraitFor(cardId, topic),
        claimedBy: claim ? names[claim.username] ?? claim.username : null,
        claimedAt: claim?.claimed_at ?? null,
        attempts: attempts.find((row) => row.card === cardId)?.used ?? 0,
      };
    }),
  };
}

export type DuelCard = {
  duelId: string;
  index: number;
  statement: string;
  topic: string;
  character: Portrait | null;
  attemptsLeft: number;
  claimedBy: string | null;
  open: boolean;
};

/**
 * A card's statement, with everything that leaks its difficulty (set, level,
 * rating) withheld until the duel is over.
 */
export async function cardFor(
  id: string,
  index: number,
  username: string,
): Promise<DuelCard | null> {
  const me = usernameKey(username);
  const duel = await loadDuel(id);
  if (!duel || (duel.challenger !== me && duel.opponent !== me)) return null;
  const cardId = cardIds(duel.cards)[index];
  const problem = cardId ? getProblem(cardId) : undefined;
  if (!problem) return null;

  const claims = (await db()`select card, username, claimed_at from duel_claims
                             where duel_id = ${id}`) as ClaimRow[];
  const status = await settle(duel, claims);
  const claim = claims.find((row) => row.card === cardId);
  const used = (await db()`
    select count(*)::int as used from duel_attempts
    where duel_id = ${id} and card = ${cardId} and username = ${me}`) as { used: number }[];
  const names = await displayNames([duel.challenger, duel.opponent]);

  return {
    duelId: id,
    index,
    statement: problem.statement,
    topic: problem.topic,
    character: portraitFor(cardId, problem.topic),
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - (used[0]?.used ?? 0)),
    claimedBy: claim ? names[claim.username] ?? claim.username : null,
    open: status === "active" && !claim,
  };
}

export type SubmitOutcome =
  | { ok: false; status: number; error: string }
  | { ok: true; score: number; claimed: boolean; attemptsLeft: number; grade: unknown };

/**
 * Records an attempt and, at 4/5 or better, claims the card. The insert is the
 * lock: two simultaneous passing proofs race on the primary key and the second
 * one loses, so a card can only ever be worth one point to one player.
 */
export async function submitAttempt(
  id: string,
  index: number,
  username: string,
  score: number,
): Promise<{ claimed: boolean; attemptsLeft: number } | null> {
  const me = usernameKey(username);
  const duel = await loadDuel(id);
  if (!duel) return null;
  const cardId = cardIds(duel.cards)[index];
  if (!cardId) return null;

  await db()`insert into duel_attempts (duel_id, card, username, score)
             values (${id}, ${cardId}, ${me}, ${score})`;
  const used = (await db()`
    select count(*)::int as used from duel_attempts
    where duel_id = ${id} and card = ${cardId} and username = ${me}`) as { used: number }[];

  let claimed = false;
  if (score >= 4) {
    const rows = await db()`
      insert into duel_claims (duel_id, card, username) values (${id}, ${cardId}, ${me})
      on conflict (duel_id, card) do nothing returning username`;
    claimed = rows.length > 0;
  }
  return { claimed, attemptsLeft: Math.max(0, MAX_ATTEMPTS - (used[0]?.used ?? 0)) };
}

export async function attemptsUsed(
  id: string,
  index: number,
  username: string,
): Promise<{ cardId: string; used: number; claimed: boolean } | null> {
  const me = usernameKey(username);
  const duel = await loadDuel(id);
  if (!duel || (duel.challenger !== me && duel.opponent !== me)) return null;
  const cardId = cardIds(duel.cards)[index];
  if (!cardId) return null;
  const used = (await db()`
    select count(*)::int as used from duel_attempts
    where duel_id = ${id} and card = ${cardId} and username = ${me}`) as { used: number }[];
  const claim = (await db()`select username from duel_claims
                            where duel_id = ${id} and card = ${cardId}`) as { username: string }[];
  return { cardId, used: used[0]?.used ?? 0, claimed: claim.length > 0 };
}

export async function duelStatus(id: string): Promise<DuelStatus | null> {
  const duel = await loadDuel(id);
  return duel?.status ?? null;
}

export type Invite = {
  id: string;
  status: DuelStatus;
  them: string;
  incoming: boolean;
};

/** Everything on this player's battle tab: invitations and a running duel. */
export async function invitesFor(username: string): Promise<Invite[]> {
  const me = usernameKey(username);
  await ready();
  const rows = (await db()`
    select d.id, d.status, d.challenger, d.opponent, d.ends_at
    from duels d
    where (d.challenger = ${me} or d.opponent = ${me}) and d.status in ('pending', 'active')
    order by d.created_at desc`) as DuelRow[];

  const invites: Invite[] = [];
  for (const row of rows) {
    const them = row.challenger === me ? row.opponent : row.challenger;
    const names = await displayNames([them]);
    const claims = (await db()`select card, username, claimed_at from duel_claims
                               where duel_id = ${row.id}`) as ClaimRow[];
    const status = await settle(row, claims);
    if (status !== "pending" && status !== "active") continue;
    invites.push({ id: row.id, status, them: names[them] ?? them, incoming: row.opponent === me });
  }
  return invites;
}
