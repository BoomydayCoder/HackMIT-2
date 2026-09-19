"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import MathText from "@/components/Math";
import type { DeckCard } from "@/lib/problems";
import {
  parseSolved,
  readSolvedRaw,
  subscribeProgress,
} from "@/lib/progress";
import {
  parseRatings,
  pickCards,
  ratingFor,
  readRatingsRaw,
  recordPass,
  TOPICS,
} from "@/lib/rating";

const SWIPE_THRESHOLD = 110;

const TOPIC_GLYPHS: Record<string, string> = {
  algebra: "∑",
  combinatorics: "⚄",
  geometry: "△",
  "number theory": "ℤ",
};

type SwipeDeckProps = {
  cards: DeckCard[];
};

type Drag = { x: number; y: number };

export default function SwipeDeck({ cards: pool }: SwipeDeckProps) {
  const [turn, setTurn] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);
  const solvedRaw = useSyncExternalStore(subscribeProgress, readSolvedRaw, () => "[]");
  const ratingsRaw = useSyncExternalStore(subscribeProgress, readRatingsRaw, () => "{}");
  const [matched, setMatched] = useState<DeckCard | null>(null);
  const [drag, setDrag] = useState<Drag>({ x: 0, y: 0 });
  const [flyOut, setFlyOut] = useState<"left" | "right" | null>(null);
  const origin = useRef<Drag | null>(null);

  const ratings = useMemo(() => parseRatings(ratingsRaw), [ratingsRaw]);
  const solved = useMemo(() => parseSolved(solvedRaw), [solvedRaw]);
  const { card, upcoming } = useMemo(
    () => pickCards(pool, ratings, [...solved, ...seen], turn),
    [pool, ratings, solved, seen, turn],
  );
  const outOfCards = !card;

  const advance = useCallback((direction: "left" | "right", swiped: DeckCard) => {
    setFlyOut(direction);
    window.setTimeout(() => {
      setFlyOut(null);
      setDrag({ x: 0, y: 0 });
      setTurn((value) => value + 1);
      setSeen((value) => [...value, swiped.id]);
      if (direction === "right") setMatched(swiped);
    }, 260);
  }, []);

  const pass = useCallback(() => {
    if (!card || matched || flyOut) return;
    recordPass(card.topic);
    advance("left", card);
  }, [card, matched, flyOut, advance]);

  const match = useCallback(() => {
    if (!card || matched || flyOut) return;
    advance("right", card);
  }, [card, matched, flyOut, advance]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") pass();
      if (event.key === "ArrowRight") match();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pass, match]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (flyOut) return;
    origin.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!origin.current) return;
    setDrag({
      x: event.clientX - origin.current.x,
      y: event.clientY - origin.current.y,
    });
  }

  function onPointerUp() {
    if (!origin.current) return;
    origin.current = null;
    if (drag.x > SWIPE_THRESHOLD) match();
    else if (drag.x < -SWIPE_THRESHOLD) pass();
    else setDrag({ x: 0, y: 0 });
  }

  if (matched) {
    return (
      <section className="mm-detail">
        <div className="mm-detail-head">
          <span className="mm-chip">{matched.topic}</span>
          <span className="mm-elo">{matched.elo}</span>
        </div>
        <h2>{matched.set}</h2>
        <div className="mm-statement">
          <MathText text={matched.statement} />
        </div>
        <div className="mm-detail-actions">
          <Link className="mm-btn mm-btn-primary" href={`/problems/${matched.id}`}>
            Write a proof
          </Link>
          <button className="mm-btn" type="button" onClick={() => setMatched(null)}>
            Back to deck
          </button>
        </div>
      </section>
    );
  }

  if (outOfCards) {
    return (
      <section className="mm-empty">
        <h2>You&apos;ve seen everyone.</h2>
        <p>Come back later, or run the deck again.</p>
        <button className="mm-btn mm-btn-primary" type="button" onClick={() => setSeen([])}>
          Start over
        </button>
      </section>
    );
  }

  const rotation = drag.x / 18;
  const liking = drag.x > 60;
  const noping = drag.x < -60;

  return (
    <section className="mm-deck">
      <div className="mm-meter">
        <span className="mm-count">
          {solved.length} solved · {pool.length - solved.length - seen.length} left
        </span>
      </div>

      <div className="mm-ratings">
        {TOPICS.map((topic) => (
          <span
            className={`mm-rating${topic === card.topic ? " mm-rating-on" : ""}`}
            key={topic}
          >
            <span className="mm-rating-topic">{TOPIC_GLYPHS[topic]}</span>
            {ratingFor(ratings, topic)}
          </span>
        ))}
      </div>

      <div className="mm-stack">
        {upcoming
          .slice()
          .reverse()
          .map((next, position) => (
            <article
              className="mm-card mm-card-behind"
              key={next.id}
              style={{
                transform: `translateY(${(upcoming.length - position) * -12}px) scale(${
                  1 - (upcoming.length - position) * 0.04
                })`,
              }}
              aria-hidden="true"
            >
              <span className="mm-watermark">{TOPIC_GLYPHS[next.topic] ?? "∞"}</span>
            </article>
          ))}

        <article
          className={`mm-card mm-card-top${flyOut ? ` mm-fly-${flyOut}` : ""}`}
          style={flyOut ? undefined : { transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className={`mm-stamp mm-stamp-like${liking ? " mm-stamp-on" : ""}`}>MATCH</span>
          <span className={`mm-stamp mm-stamp-nope${noping ? " mm-stamp-on" : ""}`}>PASS</span>

          <span className="mm-watermark">{TOPIC_GLYPHS[card.topic] ?? "∞"}</span>

          <div className="mm-card-body">
            <div className="mm-card-top-row">
              <span className="mm-chip">{card.topic}</span>
              <span className="mm-elo">{card.elo}</span>
            </div>
            <h2>{card.set}</h2>
            <p className="mm-bio">{card.bio}</p>
            <div className="mm-tags">
              <span>Problem {card.number}</span>
              <span>Proof required</span>
            </div>
          </div>
        </article>
      </div>

      <div className="mm-actions">
        <button
          className="mm-round mm-round-nope"
          type="button"
          onClick={pass}
          aria-label="Pass"
        >
          ✕
        </button>
        <button className="mm-round mm-round-like" type="button" onClick={match} aria-label="Match">
          ♥
        </button>
      </div>

      <p className="mm-hint">
        Drag the card, or use ← to pass and → to match.
      </p>
    </section>
  );
}
