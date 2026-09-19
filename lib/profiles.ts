import type { Problem } from "@/lib/problems";

/**
 * Tinder-style "profile" for a problem card: a playful display name and a
 * difficulty shown where an age would normally go. The official statement is
 * never rewritten — only the headline around it is playful.
 */
export type ProblemProfile = {
  name: string;
  /** Estimated difficulty on a 1–10 scale, shown as the card "age". */
  difficulty: number;
  /** One-line tagline shown under the name. */
  tagline: string;
};

const NAMES: Record<string, string> = {
  "IMO-SL-2023-A1": "Professor Oak",
  "IMO-SL-2023-A2": "Strictly Positive",
  "IMO-SL-2023-A3": "Integer Roots",
  "IMO-SL-2023-A4": "Double f",
  "IMO-SL-2023-A5": "Permutation Steps",
  "IMO-SL-2023-A6": "Monic P",
  "IMO-SL-2023-A7": "Three Permutations",
  "IMO-SL-2023-C1": "Coin Flipper",
  "IMO-SL-2023-C2": "Sequence Max",
  "IMO-SL-2023-C3": "Bowling Pins",
  "IMO-SL-2023-C4": "Paul's Strip",
  "IMO-SL-2023-C5": "Elisa & the Fairy",
  "IMO-SL-2023-C6": "Right-Down Path",
  "IMO-SL-2023-C7": "Imomi Ferries",
  "IMO-SL-2023-G1": "Pentagon ABCDE",
  "IMO-SL-2023-G2": "Foot of the Perpendicular",
  "IMO-SL-2023-G3": "Arc Midpoint M",
  "IMO-SL-2023-G4": "Acute & Unequal",
  "IMO-SL-2023-G5": "Perpendicular Chords",
  "IMO-SL-2023-G6": "Tangent Gamma",
  "IMO-SL-2023-G7": "Orthocentre H",
  "IMO-SL-2023-G8": "Scalene Inside",
  "IMO-SL-2023-N1": "Divisor Chain",
  "IMO-SL-2023-N2": "Perfect Square (a, p)",
  "IMO-SL-2023-N3": "Factorial Exponents",
  "IMO-SL-2023-N4": "Arithmetic Products",
  "IMO-SL-2023-N5": "Prime Collector",
  "IMO-SL-2023-N6": "Kawaii Sequence",
  "IMO-SL-2023-N7": "Harmonic Sum",
  "IMO-SL-2023-N8": "Iterated f",
  "AMC8-2023-1": "Order of Operations",
  "AMC8-2023-2": "Paper Folder",
  "AMC8-2023-3": "Wind Chill",
  "AMC8-2023-4": "Spiral Grid",
  "AMC8-2023-5": "Trout Counter",
  "AMC8-2023-6": "Digits of 2023",
  "AMC8-2023-7": "Lines & a Rectangle",
  "AMC8-2023-8": "Ping Pong Bracket",
  "AMC8-2023-9": "Malaika Skis",
  "AMC8-2023-10": "Plum Pie",
  "AMC8-2023-11": "Perseverance Rover",
  "AMC8-2023-12": "Shaded Circles",
  "AMC8-2023-13": "Water Stations",
  "AMC8-2023-14": "Stamp Collector",
  "AMC8-2023-15": "Viswam's Walk",
  "AMC8-2023-16": "P, Q, R Table",
  "AMC8-2023-17": "Octahedron Fold",
  "AMC8-2023-18": "Greta Grasshopper",
  "AMC8-2023-19": "Triangle Trapezoids",
  "AMC8-2023-20": "Range Doubler",
  "AMC8-2023-21": "Alina's Cards",
  "AMC8-2023-22": "Product Sequence",
  "AMC8-2023-23": "Tile Probability",
  "AMC8-2023-24": "Isosceles Shade",
  "AMC8-2023-25": "Fifteen Integers",
};

const TAGLINES: Record<Problem["topic"], string> = {
  algebra: "Into inequalities and functional equations.",
  combinatorics: "Loves a good invariant. Will count anything.",
  geometry: "Looking for someone who appreciates a clean circle.",
  "number theory": "Prime material. Divisible by very little.",
  "amc 8": "Easygoing, but expects you to show your work.",
};

function estimateDifficulty(problem: Problem): number {
  const n = Number.parseInt(problem.number.replace(/\D/g, ""), 10) || 1;
  if (problem.set === "AMC 8 2023") {
    return n <= 10 ? 1 : n <= 20 ? 2 : 3;
  }
  return n <= 2 ? 6 : n <= 5 ? 8 : 10;
}

function fallbackName(problem: Problem): string {
  const topic = problem.topic.replace(/\b\w/g, (c) => c.toUpperCase());
  return `${topic} ${problem.number}`;
}

export function getProfile(problem: Problem): ProblemProfile {
  return {
    name: NAMES[problem.id] ?? fallbackName(problem),
    difficulty: estimateDifficulty(problem),
    tagline:
      TAGLINES[problem.topic] ?? "Here for a proof, not for a guess.",
  };
}
