import { randomBytes } from "node:crypto";
import { usernameKey } from "@/lib/accounts";
import { characterFor } from "@/lib/characters";
import { db, ready } from "@/lib/db";
import {
  applySpread,
  CARDS_TO_WIN,
  duelDelta,
  overallOf,
  spreadDelta,
} from "@/lib/duel-rating";
import { getProblem, PROBLEMS, type Problem } from "@/lib/problems";
import { getProfile } from "@/lib/profiles";
import { parseProgress } from "@/lib/progress";

export const DUEL_CARDS = 10;
export const DUEL_MINUTES = 15;
export { CARDS_TO_WIN };
export const MAX_ATTEMPTS = 3;
/** Sketch: duels are about finding the idea, not writing it up. */
export const DUEL_RIGOR = 4 as const;
/** Breathing room between grader calls, so a duel can't spam the API. */
export const ATTEMPT_COOLDOWN_MS = 5_000;

export type DuelStatus = "pending" | "active" | "finished" | "declined";

/** The portrait on a card face: flavour only, and it gives no difficulty away. */
export type Portrait = { name: string; alt: string; src: string; width: number; height: number };

function portraitFor(problem: Problem | undefined): Portrait | null {
  const character = problem ? characterFor(problem.id, problem.topic) : null;
  if (!problem || !character) return null;
  return {
    name: getProfile(problem).name,
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
  /** The card's name, rating and contest: the recap's reveal, null until then. */
  name: string | null;
  elo: number | null;
  source: string | null;
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
  /** Display name of whoever resigned, or null if the duel ran its course. */
  resignedBy: string | null;
  /** What the duel did to your rating, once it has settled. */
  delta: number | null;
};

type DuelRow = {
  id: string;
  challenger: string;
  opponent: string;
  status: DuelStatus;
  cards: unknown;
  ends_at: string | null;
  resigned_by: string | null;
};

type ClaimRow = { card: string; username: string; claimed_at: string };
type ResultRow = {
  duel_id: string;
  winner: string | null;
  challenger_score: number;
  opponent_score: number;
  challenger_delta: number;
  opponent_delta: number;
};

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
  await sweepPending();

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

/** Resignation ends the duel at once and hands the win to the other player. */
export async function resign(id: string, username: string): Promise<boolean> {
  const me = usernameKey(username);
  await ready();
  const rows = (await db()`
    update duels set status = 'finished', finished_at = now(), resigned_by = ${me}
    where id = ${id} and status = 'active' and (challenger = ${me} or opponent = ${me})
    returning *`) as DuelRow[];
  if (rows.length === 0) return false;
  const claims = (await db()`select card, username, claimed_at from duel_claims
                             where duel_id = ${id}`) as ClaimRow[];
  await settleRatings(rows[0], claims);
  return true;
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
  const ended = await db()`update duels set status = 'finished', finished_at = now()
                           where id = ${duel.id} and status = 'active' returning id`;
  // Only the request that actually flipped the row may move any ratings.
  if (ended.length > 0) await settleRatings({ ...duel, status: "finished" }, claims);
  return "finished";
}

type AttemptRow = { card: string; username: string };

/**
 * Pays out the duel exactly once: a pairwise Elo update on each player's mean
 * rating, split across the topics they fought in, stored alongside the scores
 * so the profile and the recap can read the result back.
 */
async function settleRatings(duel: DuelRow, claims: ClaimRow[]): Promise<void> {
  const players = [duel.challenger, duel.opponent] as const;
  const attempts = (await db()`select distinct card, username from duel_attempts
                               where duel_id = ${duel.id}`) as AttemptRow[];

  const progressRows = (await db()`select username, progress from users
                                   where username = any(${[...players]}::text[])`) as {
    username: string;
    progress: unknown;
  }[];
  const progress = Object.fromEntries(
    progressRows.map((row) => [row.username, parseProgress(row.progress)]),
  );

  const topicOf = (cardId: string) => getProblem(cardId)?.topic ?? "";
  const score = (player: string) => claims.filter((claim) => claim.username === player).length;
  const resigned = duel.resigned_by;
  const other = (player: string) => (player === duel.challenger ? duel.opponent : duel.challenger);
  const outcome = (player: string) => {
    if (!resigned) return { mine: score(player), theirs: score(other(player)) };
    // A resignation is a loss however the cards fell.
    const loss = player === resigned;
    return {
      mine: loss ? 0 : Math.max(1, score(player)),
      theirs: loss ? Math.max(1, score(other(player))) : 0,
    };
  };

  const deltas: Record<string, number> = {};
  for (const player of players) {
    const them = other(player);
    const mineRatings = progress[player]?.ratings ?? {};
    const theirRatings = progress[them]?.ratings ?? {};
    const { mine, theirs } = outcome(player);
    const delta = duelDelta(overallOf(mineRatings), overallOf(theirRatings), mine, theirs);
    deltas[player] = delta;

    const claimed = claims
      .filter((claim) => claim.username === player)
      .map((claim) => topicOf(claim.card));
    const attempted = attempts
      .filter(
        (attempt) =>
          attempt.username === player && !claims.some((claim) => claim.card === attempt.card),
      )
      .map((attempt) => topicOf(attempt.card));
    const spread = spreadDelta(
      delta,
      claimed.filter(Boolean),
      attempted.filter(Boolean),
    );

    const saved = progress[player] ?? parseProgress({});
    saved.ratings = applySpread(saved.ratings, spread);
    await db()`update users set progress = ${JSON.stringify(saved)}::jsonb
               where username = ${player}`;
  }

  const yours = score(duel.challenger);
  const theirs = score(duel.opponent);
  const winner = resigned
    ? other(resigned)
    : yours === theirs
      ? null
      : yours > theirs
        ? duel.challenger
        : duel.opponent;
  await db()`
    insert into duel_results (duel_id, winner, challenger_score, opponent_score,
                              challenger_delta, opponent_delta)
    values (${duel.id}, ${winner}, ${yours}, ${theirs},
            ${deltas[duel.challenger]}, ${deltas[duel.opponent]})
    on conflict (duel_id) do nothing`;
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
  const finished = status === "finished";
  const result = finished
    ? ((await db()`select * from duel_results where duel_id = ${id}`) as ResultRow[])[0]
    : undefined;

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
    delta: result ? (me === duel.challenger ? result.challenger_delta : result.opponent_delta) : null,
    resignedBy: duel.resigned_by ? names[duel.resigned_by] ?? duel.resigned_by : null,
    winner:
      status !== "finished"
        ? null
        : duel.resigned_by
          ? names[duel.resigned_by === me ? them : me] ?? null
          : yours === theirs
            ? null
            : names[yours > theirs ? me : them] ?? null,
    cards: cardIds(duel.cards).map((cardId, index) => {
      const claim = claims.find((row) => row.card === cardId);
      const problem = getProblem(cardId);
      return {
        index,
        topic: problem?.topic ?? "",
        character: portraitFor(problem),
        claimedBy: claim ? names[claim.username] ?? claim.username : null,
        claimedAt: claim?.claimed_at ?? null,
        attempts: attempts.find((row) => row.card === cardId)?.used ?? 0,
        name: finished && problem ? getProfile(problem).name : null,
        elo: finished && problem ? problem.elo : null,
        source: finished && problem ? `${problem.set} · Problem ${problem.number}` : null,
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
  /** The official solution, released only once the duel is over. */
  solution: string | null;
  source: string | null;
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
    character: portraitFor(problem),
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - (used[0]?.used ?? 0)),
    claimedBy: claim ? names[claim.username] ?? claim.username : null,
    open: status === "active" && !claim,
    solution: status === "finished" ? problem.solution : null,
    source: status === "finished" ? `${problem.set} · Problem ${problem.number}` : null,
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
): Promise<{ cardId: string; used: number; claimed: boolean; waitMs: number } | null> {
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
  // One grader call at a time per player: three cards can't be graded in parallel.
  const last = (await db()`
    select extract(epoch from now() - max(created_at)) * 1000 as since
    from duel_attempts where duel_id = ${id} and username = ${me}`) as { since: number | null }[];
  const since = Number(last[0]?.since ?? Number.POSITIVE_INFINITY);
  return {
    cardId,
    used: used[0]?.used ?? 0,
    claimed: claim.length > 0,
    waitMs: Math.max(0, Math.ceil(ATTEMPT_COOLDOWN_MS - since)),
  };
}

/** The duel's status after the clock has been checked, not as last written. */
export async function duelStatus(id: string): Promise<DuelStatus | null> {
  const duel = await loadDuel(id);
  if (!duel) return null;
  const claims = (await db()`select card, username, claimed_at from duel_claims
                             where duel_id = ${id}`) as ClaimRow[];
  return settle(duel, claims);
}

/** Challenges nobody answered go stale rather than blocking a fresh one. */
async function sweepPending(): Promise<void> {
  await db()`update duels set status = 'declined'
             where status = 'pending' and created_at < now() - interval '30 minutes'`;
}

export type DuelRecord = {
  id: string;
  them: string;
  yours: number;
  theirs: number;
  delta: number;
  outcome: "won" | "lost" | "drawn";
  at: string;
};

export type DuelSummary = { won: number; lost: number; drawn: number };

/** Every settled duel this player has fought, newest first. */
export async function historyFor(username: string, limit = 10): Promise<DuelRecord[]> {
  const me = usernameKey(username);
  await ready();
  const rows = (await db()`
    select d.id, d.challenger, d.opponent, r.winner, r.challenger_score, r.opponent_score,
           r.challenger_delta, r.opponent_delta, r.settled_at
    from duel_results r join duels d on d.id = r.duel_id
    where d.challenger = ${me} or d.opponent = ${me}
    order by r.settled_at desc limit ${limit}`) as (ResultRow & {
    id: string;
    challenger: string;
    opponent: string;
    settled_at: string;
  })[];

  const others = rows.map((row) => (row.challenger === me ? row.opponent : row.challenger));
  const names = others.length > 0 ? await displayNames(others) : {};

  return rows.map((row) => {
    const mine = row.challenger === me;
    const them = mine ? row.opponent : row.challenger;
    return {
      id: row.id,
      them: names[them] ?? them,
      yours: mine ? row.challenger_score : row.opponent_score,
      theirs: mine ? row.opponent_score : row.challenger_score,
      delta: mine ? row.challenger_delta : row.opponent_delta,
      outcome: row.winner === null ? "drawn" : row.winner === me ? "won" : "lost",
      at: row.settled_at,
    };
  });
}

/** Won/lost/drawn counts over every settled duel, for the profile's win rate. */
export async function recordFor(username: string): Promise<DuelSummary> {
  const me = usernameKey(username);
  await ready();
  const rows = (await db()`
    select r.winner from duel_results r join duels d on d.id = r.duel_id
    where d.challenger = ${me} or d.opponent = ${me}`) as { winner: string | null }[];
  return {
    won: rows.filter((row) => row.winner === me).length,
    lost: rows.filter((row) => row.winner !== null && row.winner !== me).length,
    drawn: rows.filter((row) => row.winner === null).length,
  };
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
  await sweepPending();
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
