"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type Portrait = { name: string; alt: string; src: string; width: number; height: number };

export type BoardCard = {
  index: number;
  topic: string;
  character: Portrait | null;
  claimedBy: string | null;
  claimedAt: string | null;
  attempts: number;
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

/** The ten-card board, polled so claims vanish live from both sides. */
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
            <span aria-hidden="true">⚔</span> first to six
          </span>
        </span>
        <span className="mm-duel-score is-right">
          <em>{board.them}</em>
          <strong>{board.theirs}</strong>
        </span>
      </header>

      {finished && (
        <p className="mm-duel-result">
          {board.winner ? `${board.winner} takes the duel.` : "A draw — honours even."}
        </p>
      )}

      <ul className="mm-duel-board">
        {board.cards.map((card) => {
          const taken = card.claimedBy !== null;
          const mine = card.claimedBy === board.you;
          return (
            <li key={card.index} className="mm-duel-slot">
              <button
                type="button"
                className={`mm-tcard${taken ? (mine ? " is-mine" : " is-theirs") : ""}`}
                disabled={taken || finished}
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
                <span className="mm-tcard-name">{card.character?.name ?? "A hidden foe"}</span>
                <span className="mm-tcard-foot">
                  {taken
                    ? mine
                      ? "Claimed by you"
                      : `Claimed by ${card.claimedBy}`
                    : card.attempts > 0
                      ? `${3 - card.attempts} of 3 blows left`
                      : "Strength unknown"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
