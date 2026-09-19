export type Problem = {
  id: string;
  number: string;
  set: string;
  topic: string;
  statement: string;
  solution: string;
  answer?: string;
  proposer: string;
  sourceUrl: string;
};

export const PROBLEMS: Problem[] = [];

export const SETS: string[] = [...new Set(PROBLEMS.map((problem) => problem.set))];

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((problem) => problem.id === id);
}
