"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useState } from "react";
import { parseProgress, writeProgress } from "@/lib/progress";

export type Portrait = { name: string; alt: string; src: string; width: number; height: number };

export type BoardCard = {
  index: number;
  topic: string;
  character: Portrait | null;
  claimedBy: string | null;
  claimedAt: string | null;
  attempts: number;
  name: string | null;
  elo: number | null;
  source: string | null;
};

export type DuelView = {
  id: string;
  status: "pending" | "active" | "finished" | "declined";
  you: string;
  them: string;
  yours: number;
  theirs: number;
  cards: BoardCard[];
  endsAt: string | null;
  winner: string | null;
  resignedBy: string | null;
  delta: number | null;
  tier: { id: string; name: string; minutes: number; toWin: number };
};

const PLACEHOLDER: Record<string, string> = {
  algebra: "∑",
  combinatorics: "⚄",
  geometry: "△",
  "number theory": "ℤ",
};

function useCountdown(endsAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);
  if (!endsAt) return "—:—";
  const left = Math.max(0, new Date(endsAt).getTime() - now);
  const seconds = Math.floor(left / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Two rows of cards at any tier: a deck of six deals 3×2, ten deals 5×2. */
const columnsFor = (cards: number) => Math.ceil(cards / 2);

/** The card board, polled so claims vanish live from both sides. */
export default function DuelBoard({ initial }: { initial: DuelView }) {
  const router = useRouter();
  const [board, setBoard] = useState(initial);
  const clock = useCountdown(board.endsAt);

  useEffect(() => {
    if (board.status !== "active") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/duel/${initial.id}`);
      if (!response.ok) return;
      const data = (await response.json()) as { board?: DuelView };
      if (data.board) setBoard(data.board);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [initial.id, board.status]);

  const finished = board.status === "finished";

  // The duel moved the ratings server-side; pull them down so a later training
  // save doesn't push this browser's pre-duel numbers back over them.
  useEffect(() => {
    if (!finished) return;
    let live = true;
    void fetch("/api/progress")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { progress?: unknown } | null) => {
        if (live && data?.progress) writeProgress(parseProgress(data.progress));
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [finished]);

  async function resign() {
    if (!window.confirm("Resign this duel? Your opponent takes the win.")) return;
    const response = await fetch(`/api/duel/${board.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resign" }),
    });
    if (!response.ok) return;
    const data = (await response.json()) as { board?: DuelView };
    if (data.board) setBoard(data.board);
  }

  return (
    <div className="mm-sheet mm-duel">
      <header className="mm-duel-head">
        <span className="mm-duel-score">
          <em>{board.you}</em>
          <strong>{board.yours}</strong>
        </span>
        <span className="mm-duel-middle">
          <span className={`mm-duel-clock${finished ? " is-done" : ""}`}>
            {finished ? "Duel over" : clock}
          </span>
          <span className="mm-duel-rule">
            <span aria-hidden="true">⚔</span> {board.tier.name} · first to {board.tier.toWin}
          </span>
        </span>
        <span className="mm-duel-score is-right">
          <em>{board.them}</em>
          <strong>{board.theirs}</strong>
        </span>
      </header>

      {finished && (
        <p className="mm-duel-result">
          {board.resignedBy
            ? `${board.resignedBy} resigned — ${board.winner} takes the duel.`
            : board.winner
              ? `${board.winner} takes the duel.`
              : "A draw — honours even."}
          <span className="mm-duel-reveal">
            {board.delta === null
              ? "Every solution is open now — pick a card to read it."
              : `${board.delta > 0 ? `+${board.delta}` : board.delta} rating, spread over the schools you fought in · every solution is open now.`}
          </span>
        </p>
      )}

      <ul
        className="mm-duel-board"
        style={{ "--mm-columns": columnsFor(board.cards.length) } as CSSProperties}
      >
        {board.cards.map((card) => {
          const taken = card.claimedBy !== null;
          const mine = card.claimedBy === board.you;
          return (
            <li key={card.index} className="mm-duel-slot">
              <button
                type="button"
                className={`mm-tcard${taken ? (mine ? " is-mine" : " is-theirs") : ""}`}
                disabled={taken && !finished}
                onClick={() => router.push(`/battle/${board.id}/cards/${card.index}`)}
              >
                <span className="mm-tcard-top">
                  <span className="mm-tcard-no">{card.index + 1}</span>
                  <span className="mm-tcard-topic">{card.topic}</span>
                </span>
                <span className="mm-tcard-art">
                  {card.character ? (
                    <Image
                      src={card.character.src}
                      alt={card.character.alt}
                      width={card.character.width}
                      height={card.character.height}
                      sizes="200px"
                    />
                  ) : (
                    <span className="mm-tcard-glyph">{PLACEHOLDER[card.topic] ?? "∞"}</span>
                  )}
                  {taken && <span className="mm-tcard-seal">{mine ? "Yours" : "Taken"}</span>}
                </span>
                <span className="mm-tcard-name">
                  {card.character?.name ?? "A hidden foe"}
                  {card.elo !== null && <em className="mm-tcard-elo">{card.elo}</em>}
                </span>
                <span className="mm-tcard-foot">
                  {taken
                    ? mine
                      ? "Claimed by you"
                      : `Claimed by ${card.claimedBy}`
                    : finished
                      ? card.source ?? "Unclaimed — read the solution"
                      : card.attempts > 0
                        ? `${3 - card.attempts} of 3 blows left`
                        : "Strength unknown"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {board.status === "active" && (
        <button className="mm-duel-resign" type="button" onClick={() => void resign()}>
          Resign the duel
        </button>
      )}
    </div>
  );
}
