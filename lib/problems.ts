import harpDeck from "@/data/harp-deck.json";

export type Problem = {
  id: string;
  number: string;
  set: string;
  topic: string;
  elo: number;
  bio: string;
  statement: string;
  solution: string;
  answer?: string;
  proposer: string;
  sourceUrl: string;
};

export type DeckCard = Omit<Problem, "solution" | "answer">;

export const PROBLEMS: Problem[] = harpDeck as Problem[];

export const SETS: string[] = [...new Set(PROBLEMS.map((problem) => problem.set))];

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((problem) => problem.id === id);
}

export function getDeck(): DeckCard[] {
  return PROBLEMS.map(({ solution: _solution, answer: _answer, ...card }) => card);
}
