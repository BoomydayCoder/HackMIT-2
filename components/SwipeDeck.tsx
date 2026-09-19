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
import Challenger from "@/components/Challenger";
import MathText from "@/components/Math";
import type { DeckCard } from "@/lib/problems";
import { getProfile } from "@/lib/profiles";
import {
  parseReviews,
  parseSolved,
  readPinned,
  RATINGS_SEEN_KEY,
  readRetiredRaw,
  readReviewsRaw,
  readSolvedRaw,
  subscribeProgress,
  writePinned,
} from "@/lib/progress";
import { affinity, tasteVector } from "@/lib/recommend";
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
  const [topics, setTopics] = useState<string[]>([...TOPICS]);
  const solvedRaw = useSyncExternalStore(subscribeProgress, readSolvedRaw, () => "[]");
  const retiredRaw = useSyncExternalStore(subscribeProgress, readRetiredRaw, () => "[]");
  const ratingsRaw = useSyncExternalStore(subscribeProgress, readRatingsRaw, () => "{}");
  const pinned = useSyncExternalStore(subscribeProgress, readPinned, () => "");
  const reviewsRaw = useSyncExternalStore(subscribeProgress, readReviewsRaw, () => "{}");
  const [matched, setMatched] = useState<DeckCard | null>(null);
  const [risen, setRisen] = useState<string[]>([]);
  const [drag, setDrag] = useState<Drag>({ x: 0, y: 0 });
  const [flyOut, setFlyOut] = useState<"left" | "right" | null>(null);
  const origin = useRef<Drag | null>(null);

  const ratings = useMemo(() => parseRatings(ratingsRaw), [ratingsRaw]);
  const reviews = useMemo(() => parseReviews(reviewsRaw), [reviewsRaw]);
  const taste = useMemo(() => tasteVector(pool, reviews), [pool, reviews]);
  const solved = useMemo(() => parseSolved(solvedRaw), [solvedRaw]);
  const retired = useMemo(() => parseSolved(retiredRaw), [retiredRaw]);
  const settled = useMemo(() => [...solved, ...retired], [solved, retired]);
  const suggestion = useMemo(
    () => pickCards(pool, ratings, [...settled, ...seen], turn, topics, reviews),
    [pool, ratings, settled, seen, turn, topics, reviews],
  );
  // The match you are committed to: nothing else is served until it is settled.
  const pinnedCard = useMemo(
    () => pool.find((entry) => entry.id === pinned && !settled.includes(entry.id)) ?? null,
    [pool, pinned, settled],
  );
  const card = suggestion.card;
  const upcoming = suggestion.upcoming;
  const outOfCards = !card;

  /** Flashes the chips of topics whose rating climbed since the deck last showed it. */
  useEffect(() => {
    // The chips are hidden while a duel is in progress, so hold the gain until they are back.
    if (matched || pinnedCard) return;
    const previous = parseRatings(window.localStorage.getItem(RATINGS_SEEN_KEY) ?? "{}");
    window.localStorage.setItem(RATINGS_SEEN_KEY, ratingsRaw);
    const climbed = TOPICS.filter(
      (topic) => ratingFor(ratings, topic) > ratingFor(previous, topic),
    );
    if (climbed.length === 0) return;
    const flash = window.requestAnimationFrame(() => setRisen(climbed));
    const clear = window.setTimeout(() => setRisen([]), 1000);
    return () => {
      window.cancelAnimationFrame(flash);
      window.clearTimeout(clear);
    };
  }, [ratings, ratingsRaw, matched, pinnedCard]);

  /** Tapping a topic filters the deck; the last selected topic can't be turned off. */
  const toggleTopic = useCallback((topic: string) => {
    setTopics((current) =>
      current.includes(topic)
        ? current.length > 1
          ? current.filter((entry) => entry !== topic)
          : current
        : [...current, topic],
    );
    setTurn(0);
  }, []);

  const advance = useCallback((direction: "left" | "right", swiped: DeckCard) => {
    setFlyOut(direction);
    window.setTimeout(() => {
      setFlyOut(null);
      setDrag({ x: 0, y: 0 });
      setTurn((value) => value + 1);
      if (direction === "right") setMatched(swiped);
      else setSeen((value) => [...value, swiped.id]);
    }, 260);
  }, []);

  const pass = useCallback(() => {
    if (!card || matched || pinnedCard || flyOut) return;
    recordPass(card.topic);
    advance("left", card);
  }, [card, matched, pinnedCard, flyOut, advance]);

  const match = useCallback(() => {
    if (!card || matched || pinnedCard || flyOut) return;
    writePinned(card.id);
    advance("right", card);
  }, [card, matched, pinnedCard, flyOut, advance]);

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

  // A duel is binding: the only ways out are a passing grade or yielding.
  const committed = matched ?? pinnedCard;
  if (committed) {
    return (
      <section className="mm-detail">
        <Challenger id={committed.id} topic={committed.topic} className="mm-portrait-detail" />
        <div className="mm-detail-head">
          <span className="mm-chip">{committed.topic}</span>
          <span className="mm-elo">{committed.elo}</span>
        </div>
        <h2 className="mm-name">
          {getProfile(committed).name}
          <span className="mm-level">Level: {committed.level}</span>
        </h2>
        <p className="mm-source">
          {committed.set} · Problem {committed.number}
        </p>
        <div className="mm-statement">
          <MathText text={committed.statement} />
        </div>
        <div className="mm-detail-actions">
          <Link className="mm-btn mm-btn-primary" href={`/problems/${committed.id}`}>
            Write a proof
          </Link>
        </div>
        <p className="mm-hint">
          You&apos;re locked in this duel. Win it or yield to face anyone else.
        </p>
      </section>
    );
  }

  const topicFilter = (
    <div className="mm-ratings">
      {TOPICS.map((topic) => (
        <button
          type="button"
          className={`mm-rating${topics.includes(topic) ? " mm-rating-on" : ""}${
            risen.includes(topic) ? " mm-rating-up" : ""
          }`}
          key={topic}
          onClick={() => toggleTopic(topic)}
          aria-pressed={topics.includes(topic)}
          aria-label={`${topic} rating ${ratingFor(ratings, topic)}`}
        >
          <span className="mm-rating-topic">{TOPIC_GLYPHS[topic]}</span>
          {ratingFor(ratings, topic)}
        </button>
      ))}
    </div>
  );

  if (outOfCards) {
    return (
      <section className="mm-empty">
        {topicFilter}
        <h2>No challengers left.</h2>
        <p>Pick another discipline above, or reopen the roster.</p>
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
          {solved.length} won
        </span>
      </div>

      {topicFilter}

      <div className="mm-stack">
        {upcoming
          .slice()
          .reverse()
          .map((next, position) => (
            <div
              className="mm-card mm-card-behind"
              key={next.id}
              style={{
                transform: `translateY(${(upcoming.length - position) * -12}px) scale(${
                  1 - (upcoming.length - position) * 0.04
                })`,
              }}
              aria-hidden="true"
            />
          ))}

        <article
          className={`mm-card mm-card-top${flyOut ? ` mm-fly-${flyOut}` : ""}`}
          style={flyOut ? undefined : { transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className={`mm-stamp mm-stamp-like${liking ? " mm-stamp-on" : ""}`}>FIGHT</span>
          <span className={`mm-stamp mm-stamp-nope${noping ? " mm-stamp-on" : ""}`}>FLEE</span>

          <div className="mm-card-body">
            <div className="mm-card-top-row">
              <span className="mm-chip">{card.topic}</span>
              {taste && (
                <span className="mm-taste" title="Similarity to the problems you rated highly">
                  ♥ {Math.round(affinity(card, taste) * 100)}% your taste
                </span>
              )}
              <span className="mm-elo">{card.elo}</span>
            </div>
            <h2 className="mm-name">
              {getProfile(card).name}
              <span className="mm-level">Level: {card.level}</span>
            </h2>
            <p className="mm-bio">{getProfile(card).bio}</p>
            <div className="mm-tags">
              <span>
                {card.set} · #{card.number}
              </span>
              <span>Proof to win</span>
            </div>
          </div>
        </article>

        {/* The challenger stands in the ring; the card is swiped behind them. */}
        <Challenger key={card.id} id={card.id} topic={card.topic} className="mm-fighter" />
      </div>

      <div className="mm-actions">
        <div className="mm-call">
          <button
            className="mm-round mm-round-nope"
            type="button"
            onClick={pass}
            aria-label="Flee"
          >
            ⚑
          </button>
          <span className="mm-call-label">← Flee</span>
        </div>
        <div className="mm-call">
          <button
            className="mm-round mm-round-like"
            type="button"
            onClick={match}
            aria-label="Fight"
          >
            ⚔
          </button>
          <span className="mm-call-label">Fight →</span>
        </div>
      </div>
    </section>
  );
}
