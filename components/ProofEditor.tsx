"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Math from "@/components/Math";
import { useDictation } from "@/lib/dictation";
import { markRated, markRetired, markSolved } from "@/lib/progress";
import { recordGiveUp, recordSolve } from "@/lib/rating";
import {
  DEFAULT_MODEL,
  DEFAULT_RIGOR,
  MAX_SCORE,
  MODELS,
  PASS_SCORE,
  RIGOR_LABELS,
  RIGOR_LEVELS,
  type ModelId,
  type RigorLevel,
} from "@/lib/grader";

type ProofEditorProps = {
  problemId: string;
  topic: string;
  elo: number;
  solution: string;
};

type GradeResult = {
  score: number;
  verdict: string;
  summary: string;
  feedback: string[];
  gaps: string[];
  model: string;
  rigor: RigorLevel;
};

export default function ProofEditor({ problemId, topic, elo, solution }: ProofEditorProps) {
  const router = useRouter();
  const [proof, setProof] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [rigor, setRigor] = useState<RigorLevel>(DEFAULT_RIGOR);
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmingGiveUp, setConfirmingGiveUp] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const appendTranscript = useCallback((text: string) => {
    setProof((current) =>
      current.trim() ? `${current.replace(/\s+$/, "")} ${text}` : text,
    );
  }, []);
  const dictation = useDictation(appendTranscript);
  const listening = dictation.status === "listening";

  async function gradeProof() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, proof, rigor, model }),
      });
      const data = (await response.json()) as Partial<GradeResult> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to grade this proof.");
      }

      const graded = data as GradeResult;
      setResult(graded);
      setConfirmingGiveUp(false);
      // Only a pass settles the rating; a failing grade costs nothing so the
      // proof can be revised and regraded.
      if (graded.score >= PASS_SCORE) {
        markSolved(problemId);
        if (markRated(problemId)) setRating(recordSolve(topic, elo, graded.score));
      }
    } catch (gradingError) {
      setError(
        gradingError instanceof Error
          ? gradingError.message
          : "Unable to grade this proof.",
      );
    } finally {
      setLoading(false);
    }
  }

  /** Yielding: the solution is revealed, the duel ends and the rating pays for it. */
  function giveUp() {
    if (markRated(problemId)) setRating(recordGiveUp(topic));
    markRetired(problemId);
    setGaveUp(true);
    setConfirmingGiveUp(false);
  }

  const solvedThis = (result?.score ?? 0) >= PASS_SCORE;

  return (
    <div className="proof-editor">
      <div className="editor-label-row">
        <label htmlFor="proof">Your proof</label>
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
              : "Speak your proof"}
        </button>
        <span className="dictation-interim">
          {listening
            ? "Listening — stop when you have finished the thought."
            : "Spoken text lands in the box below."}
        </span>
      </div>
      {dictation.error && <div className="error-panel">{dictation.error}</div>}
      <div className="editor-controls">
        <div className="rigor-control">
          <div className="rigor-heading">
            <div>
              <div className="control-label">Rigor</div>
              <strong>{RIGOR_LABELS[rigor].name}</strong>
              <p>{RIGOR_LABELS[rigor].hint}</p>
            </div>
            <span className="rigor-number">{rigor}</span>
          </div>
          <input
            aria-label="Rigor level"
            type="range"
            min="1"
            max="5"
            step="1"
            value={rigor}
            onChange={(event) =>
              setRigor(Number(event.target.value) as RigorLevel)
            }
          />
          <div className="rigor-ticks">
            {RIGOR_LEVELS.map((level) => (
              <span key={level}>{RIGOR_LABELS[level].name}</span>
            ))}
          </div>
        </div>
        <label className="model-control" htmlFor="model">
          <span className="control-label">Model</span>
          <select
            id="model"
            value={model}
            onChange={(event) => setModel(event.target.value as ModelId)}
          >
            {MODELS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <textarea
        id="proof"
        value={proof}
        onChange={(event) => setProof(event.target.value)}
        placeholder="Write your proof here… LaTeX $...$ ok"
        spellCheck={false}
      />
      <button
        className="grade-button"
        type="button"
        onClick={gradeProof}
        disabled={!proof.trim() || proof.length > 20000 || loading}
      >
        {loading ? "Reading your proof…" : "Grade my proof"}
      </button>

      {!gaveUp && !solvedThis && (
        <div className="give-up-row">
          {confirmingGiveUp ? (
            <>
              <span>
                The solution is revealed and the duel is lost. It costs more of your
                {` ${topic} `}rating than fleeing a card ever would.
              </span>
              <button className="give-up-button" type="button" onClick={giveUp}>
                Yes, show me the solution
              </button>
              <button type="button" onClick={() => setConfirmingGiveUp(false)}>
                Keep fighting
              </button>
            </>
          ) : (
            <button
              className="give-up-button"
              type="button"
              onClick={() => setConfirmingGiveUp(true)}
            >
              Yield &amp; view solution
            </button>
          )}
        </div>
      )}

      {gaveUp && (
        <section className="result-panel" aria-live="polite">
          <div className="solved-panel">
            <strong>You yielded.</strong>{" "}
            {rating === null
              ? "Already rated \u2014 your rating stands."
              : `Your ${topic} rating is now ${rating}.`}
            <button type="button" onClick={() => router.push("/match")}>
              Back to the arena
            </button>
          </div>
          <h3>Official solution</h3>
          <div className="solution-copy">
            <Math text={solution} />
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
              <div className="result-kicker-line">
                Graded at rigor {RIGOR_LABELS[result.rigor].name} · {result.model}
              </div>
            </div>
            <div className="verdict-badge">{result.verdict}</div>
          </div>
          <div className="solved-panel">
            <strong>{solvedThis ? "Victory." : "Still standing."}</strong>{" "}
            {rating !== null
              ? `Your ${topic} rating is now ${rating}.`
              : solvedThis
                ? "Already rated \u2014 your rating stands."
                : "That attempt was free. Revise it and grade again."}
            {solvedThis ? (
              <button type="button" onClick={() => router.push("/match")}>
                Back to the arena
              </button>
            ) : (
              <span className="stuck-note">
                Revise and grade again, or yield to see the solution.
              </span>
            )}
          </div>
          <p className="result-summary">{result.summary}</p>
          <h3>Feedback</h3>
          <ul className="feedback-list">
            {result.feedback.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
          {result.gaps.length > 0 && (
            <>
              <h3>Gaps to close</h3>
              <ul className="feedback-list">
                {result.gaps.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </>
          )}
          {solvedThis && (
            <details className="official-solution">
              <summary>Show official solution</summary>
              <div className="solution-copy">
                <Math text={solution} />
              </div>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
