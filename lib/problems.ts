import problems from "@/data/imo-2023-shortlist.json";

export type ShortlistProblem = {
  id: string;
  number: string;
  topic: "algebra" | "combinatorics" | "geometry" | "number theory";
  statement: string;
  solution: string;
  proposer: string;
  sourceUrl: string;
};

export const PROBLEMS: ShortlistProblem[] = problems as ShortlistProblem[];

export function getProblem(id: string): ShortlistProblem | undefined {
  return PROBLEMS.find((problem) => problem.id === id);
}
