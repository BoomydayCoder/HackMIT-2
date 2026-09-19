import type { DeckCard } from "@/lib/problems";

/**
 * Tinder-style "profile" for a problem card: a playful display name shown in
 * place of the contest source. The official statement is never rewritten —
 * only the headline around it is playful.
 */
export type ProblemProfile = {
  name: string;
  /** Difficulty level (1–9). */
  level: number;
  /** Dating-profile blurb: what the problem is about and what it takes, no spoilers. */
  bio: string;
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

const BIOS: Record<string, string> = {
  "HARP-AJHSME-1985-20":
    "Calendar nerd. I know exactly how many of each weekday a month can hold, and I'm hoping you can work backwards from that to the day it all started.",
  "HARP-AJHSME-1995-2":
    "Three friends, three ages, two clues. I'm the gentle first date of the deck — follow the chain from Inez to Zack to Jose and we'll get along fine.",
  "HARP-AMC_8-2006-18":
    "A 3×3×3 cube with black cubes tucked into every corner. I care about surface area, not volume, so count the faces you can actually see.",
  "HARP-AMC_8-2007-14":
    "Isosceles, base 24, area 60. Drop an altitude and I split into two right triangles that have been waiting for a Pythagorean moment.",
  "HARP-AMC_8-2010-4":
    "Eight numbers, three ways to summarize them. Sort me first — I look like a mess until you line me up.",
  "HARP-AMC_8-2012-10":
    "Four digits, two of them the same, and a rule about staying above 1000. Careful with the repeated 2s and that leading zero.",
  "HARP-AMC_8-2012-12":
    "Only my last digit matters. Powers of 3 cycle, and I'm looking for someone who notices the pattern before the exponent scares them off.",
  "HARP-AMC_8-2016-13":
    "Six numbers, one of them zero, two picked at random. Probability that the product is 0 — a counting problem in a probability costume.",
  "HARP-AMC_8-2019-18":
    "Two dice with unusual faces: 1, 2, 3, 5, 7, 8. Odd and even aren't balanced here, and that's the whole point.",
  "HARP-AMC_8-2022-18":
    "You know the midpoints of my four sides; I want you to recover my area. Hint: the midpoints form a shape of their own.",
  "HARP-AMC_8-2024-16":
    "Minh fills a 9×9 grid with 1 through 81. Which rows and columns can avoid a product divisible by 3? Fewer than you'd think.",
  "HARP-AMC_10B-2017-5":
    "Blueberry-to-cherry ratio goes from 2:1 to 3:1 after eating ten of each. Set up two equations and I'm yours.",
  "HARP-AMC_8-2017-24":
    "Three grandchildren call every 3, 4, and 5 days. I'm an inclusion–exclusion problem in a family-newsletter disguise.",
  "HARP-AMC_10A-2007-12":
    "Six tourists, two guides, nobody gets left alone. Count every split, then throw out the two that break the rules.",
  "HARP-AMC_10A-2009-19":
    "Circle B rolls around inside circle A and lands exactly where it started. Which integer radii let that happen? Think divisors.",
  "HARP-AMC_10A-2009-7":
    "2% fat milk is 40% leaner than whole milk. I'm a percentage-of-what problem — don't fall for the obvious answer.",
  "HARP-AMC_10B-2008-9":
    "Quadratic with two real roots; I only want their average. Vieta's formulas, and you won't need the discriminant at all.",
  "HARP-AMC_10B-2010-20":
    "Two circles, one regular hexagon, several shared tangent lines. The second circle is bigger than you expect — find the ratio of areas.",
  "HARP-AMC_10B-2012-19":
    "Rectangle 6 by 30, a midpoint, an extension, an intersection. Similar triangles get you the area of the leftover quadrilateral.",
  "HARP-AMC_12B-2006-10":
    "Integer sides, one side triple another, third side 15. Push the triangle inequality as far as it will go.",
  "HARP-AMC_12B-2006-9":
    "Three-digit, even, digits strictly increasing. Fix the last digit and count what fits in front of it.",
  "HARP-AMC_12B-2014-3":
    "Gravel for a third, pavement for 20 miles, dirt for a fifth. Whatever's left is the pavement — solve for the whole trip.",
  "HARP-AMC_12B-2016-10":
    "Four vertices built from a and b with swaps and sign flips. I'm a rectangle in disguise, and my area is 16.",
  "HARP-AMC_12B-2021-7":
    "N = 34 · 34 · 63 · 270. Factor me, separate the powers of 2, and the ratio of odd-to-even divisor sums falls out cleanly.",
  "HARP-AMC_10B-2012-22":
    "A list of 1 through 10 where every number arrives next to a friend it already knows. Each new term extends a block at one end or the other.",
  "HARP-AHSME-1950-36":
    "Vintage 1950. A merchant buys at a discount, marks up, discounts again, and still wants 25% profit on the selling price. Track each percentage carefully.",
  "HARP-AHSME-1989-17":
    "An equilateral triangle outruns a square by 1989 cm of perimeter. I'm asking how big the per-side gap can be — bounded, not exact.",
  "HARP-AMC_12A-2002-16":
    "Tina picks two numbers, Sergio picks one. What are the odds Sergio wins? Enumerate the pair sums and stay organized.",
  "HARP-AMC_12A-2005-19":
    "My odometer skips every 4. I count in base 9 and pretend it's base 10 — translate back and you'll know how far I've really driven.",
  "HARP-AMC_12A-2010-18":
    "Sixteen steps from (−4,−4) to (4,4), never entering a forbidden square in the middle. Count paths that hug the boundary.",
  "HARP-AMC_12A-2011-19":
    "Elite status is handed out by a formula full of floors and logs. Given 19 elites, which N could have produced them?",
  "HARP-AMC_12A-2013-19":
    "A circle centered at A cuts BC into integer pieces. Power of a point turns my geometry into a factoring problem.",
  "HARP-AMC_12A-2014-19":
    "How many rational k make 5x² + kx + 12 = 0 hit an integer? Each integer root determines k, so count the roots instead.",
  "HARP-AMC_12A-2015-15":
    "A fraction over 2²⁶ · 5⁴. I terminate as a decimal — the question is how many digits I need before I do.",
  "HARP-AMC_12B-2011-16":
    "Rhombus with a 120° angle; shade everything closer to B than any other vertex. Perpendicular bisectors carve out my region.",
  "HARP-AHSME-1975-25":
    "A family of four chess players, twins, and a puzzle about who's best and who's worst. Pure logic — no board required.",
  "HARP-AHSME-1983-29":
    "A point P with distances u, v, w to three corners of a unit square, and u² + v² = w². Where can P be? Maximize its distance from D.",
  "HARP-AHSME-1985-29":
    "1985 eights times 1985 fives. I want the digit sum of the product, and I promise there's a pattern if you try small cases.",
  "HARP-AHSME-1987-25":
    "A = (0,0), B = (36,15), C on the lattice. Smallest possible area — a lattice-point problem where gcd does the heavy lifting.",
  "HARP-AIME_II-2002-1":
    "x is three digits, y is x reversed, z is their gap. How many distinct values can z take? The middle digit cancels; watch what survives.",
  "HARP-AMC_12A-2010-22":
    "A sum of 119 absolute-value terms |kx − 1|. I'm convex and piecewise linear, so my minimum sits at a very specific breakpoint.",
  "HARP-AMC_12A-2011-22":
    "A unit square and points whose four triangle areas are all at least 1/5. I'm a probability about the middle of the square — draw the region.",
  "HARP-AMC_12B-2005-21":
    "n has 60 divisors, 7n has 80. That jump tells you exactly how much 7 was already inside n.",
  "HARP-AMC_12B-2010-21":
    "A polynomial that hits a at 1, 3, 5, 7 and −a at 2, 4, 6, 8. Divisibility forces a to be surprisingly large.",
  "HARP-AIME-1997-6":
    "Equilateral triangle glued to one side of a regular n-gon, and A₁, Aₙ, B need to form part of another regular polygon. Angle chase for the largest n.",
  "HARP-AIME-1997-8":
    "4×4 grid of ±1 with every row and column summing to 0. Count me carefully — it's smaller than a brute-force guess but bigger than you'd hope.",
  "HARP-AIME_I-2003-9":
    "Four-digit numbers where the first two digits sum to the same as the last two. Count by digit-sum and pair up the halves.",
  "HARP-AIME_II-2004-8":
    "Divisors of 2004^2004 that themselves have exactly 2004 divisors. Factor 2004 twice and distribute the exponents.",
  "HARP-AIME-1983-10":
    "Four digits, starts with 1, exactly one repeated pair. Split into cases by which digit repeats — one case is different from the other.",
  "HARP-AIME-1984-12":
    "Symmetric about x = 2 and x = 7, so I'm secretly periodic. Knowing 0 is a root, how many roots am I forced to have in a wide window?",
  "HARP-AIME-1985-11":
    "An ellipse with two known foci, tangent to the x-axis. Reflect a focus and the major axis becomes a straight-line distance.",
  "HARP-AIME-1986-12":
    "A set of numbers up to 15 where no two disjoint subsets share a sum. Push the total as high as it can go without a collision.",
  "HARP-AIME-1988-10":
    "Squares, hexagons, and octagons meeting at every vertex. Count the interior diagonals — Euler and some careful subtraction.",
  "HARP-AIME-1990-10":
    "18th roots of unity times 48th roots of unity. How many distinct products? Least common multiples, not multiplication tables.",
  "HARP-AIME-1992-10":
    "A region in the complex plane defined by z/40 and 40/z̄ both staying in the unit square. I'm a square minus two circular bites.",
  "HARP-AIME-1993-10":
    "Euler's formula, 32 faces of triangles and pentagons, and a vertex rule. Solve for 100P + 10T + V — bookkeeping with a payoff.",
  "HARP-AIME-1995-10":
    "The largest number that can't be written as (a multiple of 42) plus (a composite). Think about residues mod 42 and where primes run out.",
  "HARP-AIME_I-2000-11":
    "Sum every a/b with a and b coprime divisors of 1000. Symmetry does most of the work; the floor at the end is just for show.",
  "HARP-AIME_II-2001-10":
    "Multiples of 1001 of the form 10ʲ − 10ⁱ. Factor out 10ⁱ and ask when 1001 divides a number that's all 9s.",
  "HARP-AIME_II-2003-10":
    "Two integers differ by 60, and their square roots add to the square root of a non-square. Maximize the sum — the constraint bites harder than it looks.",
  "HARP-USAJMO-2010-1":
    "Call a permutation good if every partial-sum condition holds. For which n does one exist? Parity is the first door; it isn't the last.",
  "HARP-USAJMO-2010-4":
    "Triangles with vertices on y = x², integer coordinates, and area 2ⁿ. Build one for every n — a construction problem that rewards patience.",
  "HARP-USAJMO-2012-1":
    "AP = AQ, two points on BC, and a triangle that wants to be shown isosceles. Cyclic quadrilaterals hiding in plain sight.",
  "HARP-USAJMO-2014-1":
    "A minimum of three rational expressions versus abc, all variables at least 1. Prove the inequality; one of the three has to cooperate.",
  "HARP-USAJMO-2015-4":
    "A functional equation over the rationals with an arithmetic-progression twist. Show f is linear — and be careful about what 'linear' means on ℚ.",
  "HARP-USAJMO-2019-4":
    "Obtuse triangle, A-excircle, and a claim about tangency. Mostly angle chasing, with one lemma you'll want to state cleanly.",
  "HARP-AIME-1990-13":
    "Powers of 9 up to 9⁴⁰⁰⁰, and you're told the biggest has 3817 digits starting with 9. Count how many begin with 9 — digit counts do the counting.",
  "HARP-AIME-1999-15":
    "Fold a paper triangle along its midpoint triangle and I become a pyramid. Find my volume from nothing but the original coordinates.",
  "HARP-AIME_I-2001-14":
    "Nineteen houses, no two neighbors get mail together, never three in a row without mail. A recurrence — let it build.",
  "HARP-AIME_I-2005-13":
    "A lattice path with diagonal steps allowed and no right-angle turns. Count paths to (5,5) by tracking the last move.",
  "HARP-AIME_II-2004-14":
    "A string of n sevens with plus signs inserted to total 7000. For how many n is that possible? Divide by 7 and think in 1s, 11s, and 111s.",
  "HARP-AIME_II-2006-13":
    "Numbers under 1000 that are a sum of consecutive odd integers in exactly five ways. Divisor-counting wearing a sequence's clothes.",
  "HARP-USAJMO-2014-2":
    "Angle A is 60°, and O and H are in a relationship. Prove where line OH lands, then bound the area of a pentagon it creates.",
  "HARP-USAMO-1977-4":
    "A skew quadrilateral with congruent opposite sides. Prove the midpoint line of the diagonals is perpendicular to both — and the converse.",
  "HARP-USAMO-1978-4":
    "All six dihedral angles equal forces a regular tetrahedron. Prove it, then decide whether five is enough — a counterexample awaits.",
  "HARP-USAMO-1984-1":
    "A quartic with a known root-product of −32. Vieta, done cleverly, hands you k. Old-school USAMO, unusually approachable.",
  "HARP-USAMO-1990-1":
    "Six-digit plates, any two differing in at least two places. Maximize the fleet — a coding-theory bound with a matching construction.",
  "HARP-USAMO-1994-4":
    "Partial sums dominate √n; prove the sum of squares beats a harmonic-ish bound. Smoothing and a little Cauchy–Schwarz.",
  "HARP-USAMO-2005-1":
    "Arrange all divisors of n greater than 1 in a circle so neighbors share a factor. Which composite n allow it? Almost all — find the exceptions.",
  "HARP-USAMO-2005-4":
    "Cut lengths off four table legs so the table still stands flat. Count the 4-tuples — a coplanarity condition turned into arithmetic.",
  "HARP-USAMO-2007-1":
    "A sequence forced by divisibility of partial sums. Prove it eventually goes constant, and find where it settles.",
  "HARP-USAMO-2013-4":
    "A minimum of square roots equals a sum of square roots. Find every solution — an equality case hiding a Cauchy–Schwarz.",
  "HARP-USAMO-2018-4":
    "Shift each aᵢ by i·k and show at least half the residues mod p are distinct. Count collisions across all k and average.",
  "HARP-USAMO-2019-1":
    "A function iterated f(n) times equals n²/f(f(n)). Determine all possible f(1000) — start by proving f is injective.",
  "HARP-USAMO-1975-5":
    "A shuffled deck with three aces; you deal until the second one appears. Expected position — symmetry beats summation here.",
  "HARP-USAMO-1980-2":
    "Monotone sequence of n distinct reals; maximize the number of three-term arithmetic progressions. Each middle term has a budget.",
  "HARP-USAMO-1997-5":
    "Three symmetric fractions bounded by 1/abc. Prove it — the key is a³ + b³ ≥ ab(a + b), applied with conviction.",
  "HARP-USAMO-2000-2":
    "Triangles where a strange identity in the tangent lengths and inradius holds. Prove they're all equilateral — an inequality masquerading as an equation.",
  "HARP-USAMO-2002-5":
    "Walk from a to b through integers where each consecutive product is divisible by the consecutive sum. Show a path always exists.",
  "HARP-USAMO-2009-5":
    "Trapezoid in a circle, a point inside, rays meeting the circle again. Prove three lines concur — heavy geometry, worth the effort.",
  "HARP-USAMO-2015-5":
    "a⁴ + b⁴ = c⁴ + d⁴ = e⁵ with distinct positive integers. Show ac + bd is composite — a factoring identity you'll have to find.",
  "HARP-USAMO-2017-5":
    "Label the lattice points with positive integers so that same labels stay far apart. Find every c that makes it possible.",
  "HARP-USAMO-1975-3":
    "A degree-n polynomial with P(k) = k/(k+1) for k = 0, …, n. Find P(n+1) — clear the denominator and let finite differences work.",
  "HARP-USAMO-1976-3":
    "a² + b² + c² = a²b² in integers. Find all solutions — mod 4 says more than you'd expect.",
  "HARP-USAMO-1983-3":
    "Sets that are unions of two closed intervals, every three sharing a point. Prove some point lies in at least half — Helly with a twist.",
  "HARP-USAMO-1996-6":
    "Is there a set X of integers where a + 2b = n has exactly one solution for every n? Yes — and the construction uses base −2 or base 4.",
  "HARP-USAMO-1998-3":
    "Tangents of shifted angles summing to at least n − 1. Prove a product of tangents is at least nⁿ⁺¹ — substitute and let AM–GM finish.",
  "HARP-USAMO-2005-3":
    "Construct C₁ and B₁ from points on BC so two quadrilaterals are cyclic. Prove four points are concyclic — the good kind of hard.",
  "HARP-USAMO-2009-6":
    "Two nonconstant rational sequences linked by a recurrence. Prove the ratio of consecutive gaps is a square — algebraic number theory in miniature.",
  "HARP-USAMO-2017-3":
    "Scalene triangle, incenter, circumcircle, and a circle on diameter DM. Prove two circles are tangent — the final boss of the deck.",
};

function fallbackName(problem: Pick<DeckCard, "topic" | "number">): string {
  const topic = problem.topic.replace(/\b\w/g, (c) => c.toUpperCase());
  return `${topic} ${problem.number}`;
}

export function getProfile(
  problem: Pick<DeckCard, "id" | "topic" | "number" | "level" | "bio">,
): ProblemProfile {
  return {
    name: NAMES[problem.id] ?? fallbackName(problem),
    level: problem.level,
    bio: BIOS[problem.id] ?? problem.bio,
  };
}
