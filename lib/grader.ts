export const RIGOR_LEVELS = [1, 2, 3, 4, 5] as const;
export type RigorLevel = (typeof RIGOR_LEVELS)[number];

export const DEFAULT_RIGOR: RigorLevel = 3;

export const RIGOR_LABELS: Record<RigorLevel, { name: string; hint: string }> = {
  1: { name: "Axiomatic", hint: "Every step justified from first principles; nothing left to the reader." },
  2: { name: "Journal", hint: "Complete proof at the standard of a published paper." },
  3: { name: "Olympiad", hint: "Standard IMO coordination: complete, routine details may be skipped." },
  4: { name: "Sketch", hint: "All key ideas and lemmas present; computations and easy steps may be omitted." },
  5: { name: "Idea", hint: "Shows the solver knows how to solve it, even if vague or informal." },
};

export const MODELS = [
  { id: "gpt-4o-mini", label: "gpt-4o-mini (fastest, cheapest, default)" },
  { id: "o4-mini", label: "o4-mini (reasoning)" },
  { id: "gpt-5-mini", label: "gpt-5-mini (reasoning, cheap)" },
  { id: "gpt-5.6-terra", label: "gpt-5.6-terra (strongest)" },
] as const;
export type ModelId = (typeof MODELS)[number]["id"];
export const DEFAULT_MODEL: ModelId = "gpt-4o-mini";

export const MAX_SCORE = 5;
export const PASS_SCORE = 4;

const COMMON = `You are grading a student's written solution to a competition mathematics problem on a 0–5 scale. You are given the problem statement, the official solution (and, for short-answer contests, the official answer), and the student's submission. Compare against the official solution but fully accept different valid approaches. Never give credit for a step that is false, and if the argument contains a genuine mathematical error, cap the score according to how much of the remaining argument survives without it. Make each feedback item concise and specific, quoting the exact step in question. Return only the requested JSON object.`;

const RUBRICS: Record<RigorLevel, string> = {
  1: `RIGOR LEVEL 1 — AXIOMATIC. Grade like a formal-verification referee. A 5 requires that every single inference is explicitly justified: every case is enumerated, every inequality is derived rather than asserted, every "clearly", "obviously", "similarly", "WLOG" or "it is easy to see" is either expanded or costs points, and every object used is shown to exist and be well-defined. Named theorems may be cited only with their hypotheses verified explicitly. Score guide: 5 = nothing left to the reader; 4 = correct and complete but with one or two small unexpanded steps; 3 = correct overall argument with several unjustified but true steps; 2 = the right strategy with major gaps; 1 = a relevant partial observation; 0 = wrong or no progress. Even a correct, elegant olympiad-style proof should typically land around 3 here unless it is unusually explicit. List every unjustified step in "gaps".`,
  2: `RIGOR LEVEL 2 — JOURNAL. Grade as a careful referee for a mathematics journal. A 5 requires a complete, correct proof in which every non-routine step is justified and routine algebra may be summarised but must be verifiable by the reader in a few lines. Well-known theorems may be cited by name provided their hypotheses clearly hold. Deduct for hand-waving on any step that is not genuinely routine, for missing edge cases, and for gaps in case analyses. Score guide: 5 = complete and rigorous; 4 = complete with minor imprecision or one small omitted routine step; 3 = substantially correct with a real but repairable gap; 2 = correct strategy but important parts missing; 1 = a relevant partial result; 0 = wrong or no progress.`,
  3: `RIGOR LEVEL 3 — OLYMPIAD. Grade as an IMO coordinator would, compressed onto a 0–5 scale. A 5 is a complete and correct proof; routine computations and genuinely easy steps may be skipped, but every essential idea must be present and correctly argued. 4 means a complete solution with only minor gaps or slips that do not affect the validity of the argument. 2–3 means substantial partial progress: key lemmas proved, the main construction found, or the problem reduced to an easier one. 1 means a relevant observation only. 0 means no meaningful progress. Do not reward unjustified claims of key steps. For short-answer (AMC-style) problems a bare correct answer with no justification scores at most 1; full marks require a complete, clearly argued solution.`,
  4: `RIGOR LEVEL 4 — SKETCH. Grade the mathematical content, not the write-up. A 5 requires that all the key ideas are present and correct: the crucial lemma(s), the main construction or invariant, and the way they combine to finish the problem. The student may omit computations, routine verifications, straightforward case checks and formal write-up, as long as an expert could complete the proof from the sketch without any new idea. Deduct only for missing or incorrect ideas: 4 = all main ideas present but one needed step is asserted without indicating why it holds; 3 = the main idea is found but a second essential idea is missing; 2 = a substantial partial reduction; 1 = a relevant observation; 0 = wrong direction or no progress. Be lenient about informal language and notation. For short-answer problems, a correct answer with a brief but correct explanation of the method earns 5.`,
  5: `RIGOR LEVEL 5 — IDEA. Grade whether the student clearly knows how to solve the problem. A 5 requires only that the submission identifies the correct central idea(s) and the correct answer (where one exists), even if expressed vaguely, informally, out of order, or in a single sentence. Do not deduct for missing details, missing justifications, sloppy notation, or missing computations. Deduct only when the idea itself is wrong, when a central idea is missing, or when the description is too vague to distinguish a solver from a guesser: 4 = the right idea with a small inaccuracy or one missing ingredient; 3 = a good relevant idea that is not enough on its own; 2 = a partially relevant idea; 1 = vaguely relevant thoughts; 0 = nothing relevant, or a bare answer with no idea behind it. Encourage in feedback: say what the student would need to add to turn the idea into a full proof.`,
};

export function graderSystemPrompt(level: RigorLevel): string {
  return `${COMMON}\n\n${RUBRICS[level]}`;
}

export function isRigorLevel(value: unknown): value is RigorLevel {
  return typeof value === "number" && (RIGOR_LEVELS as readonly number[]).includes(value);
}

export function isModelId(value: unknown): value is ModelId {
  return typeof value === "string" && MODELS.some((m) => m.id === value);
}
