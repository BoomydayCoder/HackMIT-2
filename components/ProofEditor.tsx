"use client";

import { useState } from "react";
import Math from "@/components/Math";

type ProofEditorProps = {
  problemId: string;
  solution: string;
};

type GradeResult = {
  score: number;
  verdict: string;
  summary: string;
  feedback: string[];
  gaps: string[];
  model: string;
};

export default function ProofEditor({ problemId, solution }: ProofEditorProps) {
  const [proof, setProof] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function gradeProof() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, proof }),
      });
      const data = (await response.json()) as Partial<GradeResult> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to grade this proof.");
      }

      setResult(data as GradeResult);
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

  return (
    <div className="proof-editor">
      <div className="editor-label-row">
        <label htmlFor="proof">Your proof</label>
        <span>{proof.length.toLocaleString()} / 20,000</span>
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

      {error && <div className="error-panel">{error}</div>}

      {result && (
        <section className="result-panel" aria-live="polite">
          <div className="result-heading">
            <div>
              <div className="result-kicker">IMO score</div>
              <div className="score">
                {result.score}
                <span>/7</span>
              </div>
            </div>
            <div className="verdict-badge">{result.verdict}</div>
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
          <details className="official-solution">
            <summary>Show official solution</summary>
            <div className="solution-copy">
              <Math text={solution} />
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
