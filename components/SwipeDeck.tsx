"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import MathText from "@/components/Math";
import type { DeckCard } from "@/lib/problems";

const STARTING_LIFELINES = 5;

type SwipeDeckProps = {
  cards: DeckCard[];
};

export default function SwipeDeck({ cards }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const [lifelines, setLifelines] = useState(STARTING_LIFELINES);
  const [matched, setMatched] = useState(false);
  const [leaving, setLeaving] = useState<"pass" | "match" | null>(null);

  const card = cards[index];
  const outOfCards = index >= cards.length;
  const canPass = lifelines > 0 && !matched && !outOfCards;

  const pass = useCallback(() => {
    if (lifelines <= 0 || matched || outOfCards) return;
    setLeaving("pass");
    setLifelines((value) => value - 1);
    setIndex((value) => value + 1);
  }, [lifelines, matched, outOfCards]);

  const match = useCallback(() => {
    if (matched || outOfCards) return;
    setLeaving("match");
    setMatched(true);
  }, [matched, outOfCards]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") pass();
      if (event.key === "ArrowRight") match();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pass, match]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(null), 220);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  if (outOfCards) {
    return (
      <div className="deck-empty">
        <h2>That&apos;s the whole deck.</h2>
        <button className="deck-button" type="button" onClick={() => setIndex(0)}>
          Start over
        </button>
      </div>
    );
  }

  return (
    <div className="deck">
      <div className="deck-status">
        <span className="lifelines" aria-label={`${lifelines} lifelines left`}>
          {"♥".repeat(lifelines)}
          <span className="lifelines-spent">{"♡".repeat(Math.max(0, 5 - lifelines))}</span>
        </span>
        <span className="deck-progress">
          {index + 1} / {cards.length}
        </span>
      </div>

      <article className={`deck-card${leaving ? ` deck-card-${leaving}` : ""}`} key={card.id}>
        <div className="deck-card-elo">{card.elo}</div>
        <h2>{card.topic}</h2>
        <p className="deck-card-bio">{card.bio}</p>
        <div className="deck-card-meta">{card.set}</div>

        {matched ? (
          <div className="deck-card-statement">
            <MathText text={card.statement} />
            <Link className="deck-button deck-button-solve" href={`/problems/${card.id}`}>
              Write a proof →
            </Link>
          </div>
        ) : null}
      </article>

      {matched ? (
        <div className="deck-actions">
          <button
            className="deck-button"
            type="button"
            onClick={() => {
              setMatched(false);
              setIndex((value) => value + 1);
            }}
          >
            Back to deck
          </button>
        </div>
      ) : (
        <div className="deck-actions">
          <button className="deck-button deck-pass" type="button" onClick={pass} disabled={!canPass}>
            ✕ Pass
          </button>
          <button className="deck-button deck-match" type="button" onClick={match}>
            ♥ Try this
          </button>
        </div>
      )}

      {lifelines === 0 && !matched ? (
        <p className="deck-note">No lifelines left — solve a problem to earn one back.</p>
      ) : (
        <p className="deck-note">Left arrow passes (costs a lifeline), right arrow matches.</p>
      )}
    </div>
  );
}
