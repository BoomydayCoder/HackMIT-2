import imoProblems from "@/data/imo-2023-shortlist.json";
import amc8Problems from "@/data/amc8-2023.json";

export type Problem = {
  id: string;
  number: string;
  set: "IMO 2023 Shortlist" | "AMC 8 2023";
  topic: string;
  statement: string;
  solution: string;
  answer?: string;
  proposer: string;
  sourceUrl: string;
};

export type ShortlistProblem = Problem;

const imo = imoProblems as Omit<Problem, "set">[];
const amc8 = amc8Problems as Problem[];

export const PROBLEMS: Problem[] = [
  ...imo.map((problem) => ({ ...problem, set: "IMO 2023 Shortlist" as const })),
  ...amc8,
];

export const SETS = ["AMC 8 2023", "IMO 2023 Shortlist"] as const;

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((problem) => problem.id === id);
}
