"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type BoardCard = {
  index: number;
  topic: string;
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

function useCountdown(endsAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);
  if (!endsAt) return "--:--";
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
          <strong>{board.you}</strong> {board.yours}
        </span>
        <span className={`mm-duel-clock${finished ? " is-done" : ""}`}>
          {finished ? "Duel over" : clock}
        </span>
        <span className="mm-duel-score">
          {board.theirs} <strong>{board.them}</strong>
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
            <li key={card.index}>
              <button
                type="button"
                className={`mm-duel-card${taken ? (mine ? " is-mine" : " is-theirs") : ""}`}
                disabled={taken || finished}
                onClick={() => router.push(`/battle/${board.id}/cards/${card.index}`)}
              >
                <span className="mm-duel-card-no">{card.index + 1}</span>
                <span className="mm-duel-card-topic">{card.topic}</span>
                <span className="mm-count">
                  {taken
                    ? mine
                      ? "Claimed by you"
                      : `Claimed by ${card.claimedBy}`
                    : card.attempts > 0
                      ? `${3 - card.attempts} tries left`
                      : "Rating hidden"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
