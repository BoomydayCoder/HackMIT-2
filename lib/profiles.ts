import type { DeckCard } from "@/lib/problems";

/**
 * Tinder-style "profile" for a problem card: a playful display name shown in
 * place of the contest source. The official statement is never rewritten —
 * only the headline around it is playful.
 */
export type ProblemProfile = {
  name: string;
  /** Difficulty level (1–9), shown where an age would normally go. */
  level: number;
};

const NAMES: Record<string, string> = {
  "HARP-AJHSME-1985-20": "Four Tuesdays",
  "HARP-AJHSME-1995-2": "Jose & Zack",
  "HARP-AMC_8-2006-18": "Corner Cubes",
  "HARP-AMC_8-2007-14": "Isosceles 24",
  "HARP-AMC_8-2010-4": "Mean, Median, Mode",
  "HARP-AMC_8-2012-10": "Digits of 2012",
  "HARP-AMC_8-2012-12": "Units Digit",
  "HARP-AMC_8-2016-13": "Product Zero",
  "HARP-AMC_8-2019-18": "Odd Dice",
  "HARP-AMC_8-2022-18": "Midpoint Rectangle",
  "HARP-AMC_8-2024-16": "Minh's Grid",
  "HARP-AMC_10B-2017-5": "Camilla's Jelly Beans",
  "HARP-AMC_8-2017-24": "Mrs. Sanders",
  "HARP-AMC_10A-2007-12": "Two Tour Guides",
  "HARP-AMC_10A-2009-19": "Rolling Circle",
  "HARP-AMC_10A-2009-7": "Whole Milk",
  "HARP-AMC_10B-2008-9": "Average Root",
  "HARP-AMC_10B-2010-20": "Hexagon Twins",
  "HARP-AMC_10B-2012-19": "Rectangle 6 × 30",
  "HARP-AMC_12B-2006-10": "Triple Side",
  "HARP-AMC_12B-2006-9": "Strictly Increasing",
  "HARP-AMC_12B-2014-3": "Randy's Road Trip",
  "HARP-AMC_12B-2016-10": "PQRS",
  "HARP-AMC_12B-2021-7": "Odd vs. Even Divisors",
  "HARP-AMC_10B-2012-22": "Neighbourly List",
  "HARP-AHSME-1950-36": "The Merchant",
  "HARP-AHSME-1989-17": "Triangle vs. Square",
  "HARP-AMC_12A-2002-16": "Tina & Sergio",
  "HARP-AMC_12A-2005-19": "Faulty Odometer",
  "HARP-AMC_12A-2010-18": "Sixteen Steps",
  "HARP-AMC_12A-2011-19": "Elite Status",
  "HARP-AMC_12A-2013-19": "Circle at A",
  "HARP-AMC_12A-2014-19": "Rational k",
  "HARP-AMC_12A-2015-15": "Decimal Digits",
  "HARP-AMC_12B-2011-16": "Rhombus Region",
  "HARP-AHSME-1975-25": "Chess Family",
  "HARP-AHSME-1983-29": "Point P",
  "HARP-AHSME-1985-29": "Eights × Fives",
  "HARP-AHSME-1987-25": "Minimum Area",
  "HARP-AIME_II-2002-1": "Reversed Digits",
  "HARP-AMC_12A-2010-22": "Absolute Sum",
  "HARP-AMC_12A-2011-22": "Unit Square R",
  "HARP-AMC_12B-2005-21": "Sixty Divisors",
  "HARP-AMC_12B-2010-21": "Alternating P",
  "HARP-AIME-1997-6": "Regular n-gon",
  "HARP-AIME-1997-8": "Balanced Array",
  "HARP-AIME_I-2003-9": "Balanced Integer",
  "HARP-AIME_II-2004-8": "2004 to the 2004",
  "HARP-AIME-1983-10": "Twin Digits",
  "HARP-AIME-1984-12": "Two Symmetries",
  "HARP-AIME-1985-11": "Tangent Ellipse",
  "HARP-AIME-1986-12": "Distinct Subset Sums",
  "HARP-AIME-1988-10": "Polyhedron 12-8-6",
  "HARP-AIME-1990-10": "Roots of Unity",
  "HARP-AIME-1992-10": "Region A",
  "HARP-AIME-1993-10": "Euler's Formula",
  "HARP-AIME-1995-10": "Not 42 Plus Composite",
  "HARP-AIME_I-2000-11": "Divisors of 1000",
  "HARP-AIME_II-2001-10": "Multiples of 1001",
  "HARP-AIME_II-2003-10": "Differ by 60",
  "HARP-USAJMO-2010-1": "Perfect Permutation",
  "HARP-USAJMO-2010-4": "Parabolic Triangle",
  "HARP-USAJMO-2012-1": "AP = AQ",
  "HARP-USAJMO-2014-1": "Min of Three",
  "HARP-USAJMO-2015-4": "Rational f",
  "HARP-USAJMO-2019-4": "The A-Excircle",
  "HARP-AIME-1990-13": "Powers of Nine",
  "HARP-AIME-1999-15": "Paper Pyramid",
  "HARP-AIME_I-2001-14": "Elm Street Mail",
  "HARP-AIME_I-2005-13": "No Right Turns",
  "HARP-AIME_II-2004-14": "String of Sevens",
  "HARP-AIME_II-2006-13": "Consecutive Odds",
  "HARP-USAJMO-2014-2": "Sixty-Degree OH",
  "HARP-USAMO-1977-4": "Skew Quadrilateral",
  "HARP-USAMO-1978-4": "Dihedral Tetrahedron",
  "HARP-USAMO-1984-1": "Product −32",
  "HARP-USAMO-1990-1": "License Plates",
  "HARP-USAMO-1994-4": "Root-n Sum",
  "HARP-USAMO-2005-1": "Divisor Circle",
  "HARP-USAMO-2005-4": "Table Legs",
  "HARP-USAMO-2007-1": "Divisible Sums",
  "HARP-USAMO-2013-4": "Min of Square Roots",
  "HARP-USAMO-2018-4": "Half-p Remainders",
  "HARP-USAMO-2019-1": "f of f of f",
  "HARP-USAMO-1975-5": "Second Ace",
  "HARP-USAMO-1980-2": "Three-Term APs",
  "HARP-USAMO-1997-5": "Cubes & abc",
  "HARP-USAMO-2000-2": "Inradius r",
  "HARP-USAMO-2002-5": "From a to b",
  "HARP-USAMO-2009-5": "Trapezoid in ω",
  "HARP-USAMO-2015-5": "Fourth Powers",
  "HARP-USAMO-2017-5": "Lattice Labels",
  "HARP-USAMO-1975-3": "P(n + 1)",
  "HARP-USAMO-1976-3": "a²b²",
  "HARP-USAMO-1983-3": "Two Closed Intervals",
  "HARP-USAMO-1996-6": "a + 2b",
  "HARP-USAMO-1998-3": "Tangent Shift",
  "HARP-USAMO-2005-3": "Cyclic APBC₁",
  "HARP-USAMO-2009-6": "Rational Sequences",
  "HARP-USAMO-2017-3": "Incenter I",
};

function fallbackName(problem: Pick<DeckCard, "topic" | "number">): string {
  const topic = problem.topic.replace(/\b\w/g, (c) => c.toUpperCase());
  return `${topic} ${problem.number}`;
}

export function getProfile(
  problem: Pick<DeckCard, "id" | "topic" | "number" | "level">,
): ProblemProfile {
  return {
    name: NAMES[problem.id] ?? fallbackName(problem),
    level: problem.level,
  };
}
