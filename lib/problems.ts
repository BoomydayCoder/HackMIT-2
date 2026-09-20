import harpDeck from "@/data/harp-deck.json";
import { extractKeyIdeas } from "@/lib/key-ideas";

export type Problem = {
  id: string;
  number: string;
  set: string;
  topic: string;
  level: number;
  elo: number;
  bio: string;
  statement: string;
  solution: string;
  answer?: string;
  proposer: string;
  sourceUrl: string;
};

/** A problem without its solution, plus the techniques the solution uses. */
export type DeckCard = Omit<Problem, "solution" | "answer"> & { keyIdeas: string[] };

export const PROBLEMS: Problem[] = harpDeck as Problem[];

export const SETS: string[] = [...new Set(PROBLEMS.map((problem) => problem.set))];

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((problem) => problem.id === id);
}

export function getDeck(): DeckCard[] {
  return PROBLEMS.map((problem) => ({
    id: problem.id,
    number: problem.number,
    set: problem.set,
    topic: problem.topic,
    level: problem.level,
    elo: problem.elo,
    bio: problem.bio,
    statement: problem.statement,
    proposer: problem.proposer,
    sourceUrl: problem.sourceUrl,
    keyIdeas: extractKeyIdeas(problem.solution),
  }));
}
