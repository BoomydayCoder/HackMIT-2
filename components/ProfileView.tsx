"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { avatarChoices, avatarFor } from "@/lib/characters";
import { STARTING_RATING, TOPICS } from "@/lib/rating";

type Profile = {
  username: string;
  bio: string;
  avatar: string;
  ratings: Record<string, number>;
  solved: number;
};

type Tally = { won: number; lost: number; drawn: number };

type Duel = {
  id: string;
  them: string;
  yours: number;
  theirs: number;
  delta: number;
  outcome: "won" | "lost" | "drawn";
  at: string;
};

type Standing = {
  rank: number;
  username: string;
  avatar: string;
  overall: number;
  solved: number;
};

type Payload = {
  profile?: Profile;
  leaderboard?: Standing[];
  players?: number;
  record?: Tally;
  history?: Duel[];
  friend?: string;
  isSelf?: boolean;
  error?: string;
};

const MAX_BIO = 240;

/** The mean of the four topic ratings: one number to rank a player by. */
function overall(ratings: Record<string, number>): number {
  const total = TOPICS.reduce((sum, topic) => sum + (ratings[topic] ?? STARTING_RATING), 0);
  return Math.round(total / TOPICS.length);
}

export default function ProfileView({ username }: { username?: string }) {
  const [state, setState] = useState<Payload | null>(null);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const query = username ? `?username=${encodeURIComponent(username)}` : "";

  useEffect(() => {
    let live = true;
    fetch(`/api/profile${query}`)
      .then((response) => response.json() as Promise<Payload>)
      .then((data) => {
        if (!live) return;
        setState(data);
        setBio(data.profile?.bio ?? "");
      })
      .catch(() => live && setState({ error: "Could not reach the heralds." }));
    return () => {
      live = false;
    };
  }, [query]);

  async function save(fields: { bio?: string; avatar?: string }) {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = (await response.json()) as Payload;
      if (data.profile) setState((previous) => ({ ...previous, profile: data.profile }));
    } finally {
      setSaving(false);
    }
  }

  if (!state) return <p className="mm-count">Unrolling the scroll…</p>;
  if (!state.profile) {
    return <p className="mm-count">{state.error ?? "No such player."}</p>;
  }

  const { profile, isSelf } = state;
  const portrait = avatarFor(profile.avatar);
  const record = state.record ?? { won: 0, lost: 0, drawn: 0 };
  const fought = record.won + record.lost + record.drawn;
  const history = state.history ?? [];
  const leaderboard = state.leaderboard ?? [];
  const place = leaderboard.find((entry) => entry.username === profile.username);

  return (
    <section className="mm-profile">
      <header className="mm-profile-head">
        <div className="mm-avatar">
          {portrait ? (
            <Image src={portrait.image} alt={portrait.alt} width={120} height={120} />
          ) : (
            <span aria-hidden="true">⚔</span>
          )}
        </div>
        <div>
          <h1>{profile.username}</h1>
          <p className="mm-overall">
            <strong>{overall(profile.ratings)}</strong> overall
          </p>
          <p className="mm-count">
            {place ? `#${place.rank} of ${state.players ?? leaderboard.length} · ` : ""}
            {profile.solved} problem{profile.solved === 1 ? "" : "s"} taken ·{" "}
            {fought === 0
              ? "no duels fought"
              : `${Math.round((record.won / fought) * 100)}% of ${fought} duel${fought === 1 ? "" : "s"} won (${record.won}–${record.lost}–${record.drawn})`}
          </p>
        </div>
      </header>

      {isSelf ? (
        <label className="mm-field">
          <span className="control-label">Your motto</span>
          <textarea
            maxLength={MAX_BIO}
            value={bio}
            placeholder="A line for the herald to read out…"
            onChange={(event) => setBio(event.target.value)}
            onBlur={() => bio !== profile.bio && void save({ bio })}
          />
        </label>
      ) : (
        profile.bio && <p className="mm-bio">{profile.bio}</p>
      )}

      <h2 className="control-label">Schools of arms</h2>
      <ul className="mm-subelos">
        {TOPICS.map((topic) => {
          const rating = profile.ratings[topic] ?? STARTING_RATING;
          return (
            <li key={topic}>
              <span>{topic}</span>
              <span className="mm-bar">
                <span style={{ width: `${Math.min(100, Math.max(6, (rating / 2000) * 100))}%` }} />
              </span>
              <strong>{rating}</strong>
            </li>
          );
        })}
      </ul>

      {history.length > 0 && (
        <>
          <h2 className="control-label">Duels fought</h2>
          <ul className="mm-history">
            {history.map((duel) => (
              <li key={duel.id} className={`is-${duel.outcome}`}>
                <span>
                  {duel.outcome === "drawn" ? "Drew" : duel.outcome === "won" ? "Beat" : "Lost to"}{" "}
                  <strong>{duel.them}</strong>
                </span>
                <span className="mm-history-score">
                  {duel.yours}–{duel.theirs}
                </span>
                <span className="mm-history-delta">
                  {duel.delta > 0 ? `+${duel.delta}` : duel.delta}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {leaderboard.length > 0 && (
        <>
          <h2 className="control-label">Hall of champions</h2>
          <ol className="mm-leaderboard">
            {leaderboard.map((entry) => {
              const standard = avatarFor(entry.avatar);
              const you = entry.username === profile.username;
              return (
                <li key={entry.username} className={you ? "is-you" : undefined}>
                  <span className="mm-rank">{entry.rank}</span>
                  <span className="mm-rank-avatar">
                    {standard ? (
                      <Image src={standard.image} alt={standard.alt} width={32} height={32} />
                    ) : (
                      <span aria-hidden="true">⚔</span>
                    )}
                  </span>
                  {you ? (
                    <strong>{entry.username}</strong>
                  ) : (
                    <Link href={`/u/${entry.username}`}>{entry.username}</Link>
                  )}
                  <span className="mm-rank-solved">
                    {entry.solved} solved
                  </span>
                  <strong className="mm-rank-elo">{entry.overall}</strong>
                </li>
              );
            })}
          </ol>
        </>
      )}

      {isSelf && (
        <>
          <h2 className="control-label">Choose your standard</h2>
          <ul className="mm-avatars">
            {avatarChoices().map((choice) => (
              <li key={choice.key}>
                <button
                  type="button"
                  disabled={saving}
                  className={choice.key === profile.avatar ? "mm-avatar-on" : undefined}
                  title={choice.name}
                  onClick={() => void save({ avatar: choice.key })}
                >
                  <Image src={choice.image} alt={choice.alt} width={56} height={56} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
