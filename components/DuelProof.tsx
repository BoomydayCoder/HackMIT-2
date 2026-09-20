"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Math from "@/components/Math";
import { useDictation } from "@/lib/dictation";
import { MAX_SCORE, PASS_SCORE, RIGOR_LABELS } from "@/lib/grader";

export type DuelCard = {
  duelId: string;
  index: number;
  statement: string;
  topic: string;
  character: { name: string; alt: string; src: string; width: number; height: number } | null;
  attemptsLeft: number;
  claimedBy: string | null;
  open: boolean;
  solution: string | null;
  source: string | null;
};

type Result = {
  score: number;
  verdict: string;
  summary: string;
  feedback: string[];
  gaps: string[];
  claimed: boolean;
  attemptsLeft: number;
};

/**
 * A duel card: sketch rigor only, three submissions, and the claim decided by
 * the server — nothing here can award a point on its own.
 */
export default function DuelProof({ initial }: { initial: DuelCard }) {
  const router = useRouter();
  const [card, setCard] = useState(initial);
  const [proof, setProof] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const append = useCallback((text: string) => {
    setProof((current) => (current.trim() ? `${current.replace(/\s+$/, "")} ${text}` : text));
  }, []);
  const dictation = useDictation(append);
  const listening = dictation.status === "listening";

  // The opponent can take this card out from under you mid-write.
  useEffect(() => {
    if (!card.open) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/duel/${card.duelId}/cards/${card.index}`);
      if (!response.ok) return;
      const data = (await response.json()) as { card?: DuelCard };
      if (data.card) setCard(data.card);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [card.duelId, card.index, card.open]);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/duel/${card.duelId}/cards/${card.index}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof }),
      });
      const data = (await response.json()) as Partial<Result> & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to grade this proof.");
      const graded = data as Result;
      setResult(graded);
      setCard((current) => ({
        ...current,
        attemptsLeft: graded.attemptsLeft,
        open: current.open && !graded.claimed && graded.attemptsLeft > 0,
      }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to grade this proof.");
    } finally {
      setLoading(false);
    }
  }

  const spent = card.attemptsLeft <= 0;
  const locked = !card.open || spent;

  return (
    <div className="proof-editor">
      <div className="mm-duel-cardbar">
        <button type="button" onClick={() => router.push(`/battle/${card.duelId}`)}>
          Leave this card
        </button>
        <span className="mm-count">
          {card.claimedBy
            ? `Claimed by ${card.claimedBy}`
            : card.solution
              ? "Duel over — unclaimed"
              : `${card.attemptsLeft} of 3 submissions left · ${RIGOR_LABELS[4].name} rigor`}
        </span>
      </div>

      <div className="mm-duel-statement">
        {card.character && (
          <figure className="mm-duel-foe">
            <Image
              src={card.character.src}
              alt={card.character.alt}
              width={card.character.width}
              height={card.character.height}
              sizes="200px"
            />
            <figcaption>{card.character.name}</figcaption>
          </figure>
        )}
        <div className="solution-copy">
          <Math text={card.statement} />
        </div>
      </div>

      {!locked && (
        <>
          <div className="editor-label-row">
            <label htmlFor="proof">Your sketch</label>
            <span>{proof.length.toLocaleString()} / 20,000</span>
          </div>
          <div className="dictation-row">
            <button
              type="button"
              className={listening ? "mic-button listening" : "mic-button"}
              onClick={listening ? dictation.stop : dictation.start}
              aria-pressed={listening}
              disabled={dictation.status === "transcribing"}
            >
              <span className="mic-dot" aria-hidden="true" />
              {dictation.status === "transcribing"
                ? "Transcribing…"
                : listening
                  ? "Stop dictating"
                  : "Speak your sketch"}
            </button>
          </div>
          {dictation.error && <div className="error-panel">{dictation.error}</div>}
          <textarea
            id="proof"
            value={proof}
            onChange={(event) => setProof(event.target.value)}
            placeholder="The key idea, the lemma, the construction — the answer alone claims nothing. LaTeX $...$ ok"
            spellCheck={false}
          />
          <button
            className="grade-button"
            type="button"
            onClick={() => void submit()}
            disabled={!proof.trim() || proof.length > 20000 || loading}
          >
            {loading ? "Reading your sketch…" : "Submit for the card"}
          </button>
        </>
      )}

      {locked && (
        <div className="solved-panel">
          <strong>
            {result?.claimed
              ? "You claimed this card."
              : card.claimedBy
                ? `${card.claimedBy} claimed this card.`
                  : spent
                    ? "No submissions left on this card."
                    : "This duel is over."}
          </strong>
          <button type="button" onClick={() => router.push(`/battle/${card.duelId}`)}>
            Back to the board
          </button>
        </div>
      )}

      {card.solution && (
        <section className="solution-panel">
          <h2>Official solution</h2>
          {card.source && <p className="mm-source">{card.source}</p>}
          <div className="solution-copy">
            <Math text={card.solution} />
          </div>
        </section>
      )}

      {error && <div className="error-panel">{error}</div>}

      {result && (
        <section className="result-panel" aria-live="polite">
          <div className="result-heading">
            <div>
              <div className="result-kicker">Score</div>
              <div className="score">
                {result.score}
                <span>/{MAX_SCORE}</span>
              </div>
            </div>
            <div className="verdict-badge">{result.verdict}</div>
          </div>
          <div className="solved-panel">
            <strong>
              {result.claimed
                ? "Card claimed — one point."
                : result.score >= PASS_SCORE
                  ? "Passed, but the card was already taken."
                  : "Not enough — the card is still open."}
            </strong>
            {result.claimed && (
              <button type="button" onClick={() => router.push(`/battle/${card.duelId}`)}>
                Back to the board
              </button>
            )}
          </div>
          <p className="result-summary">{result.summary}</p>
          <ul className="feedback-list">
            {result.feedback.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
