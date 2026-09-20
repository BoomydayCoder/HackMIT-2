/**
 * Key ideas of a solution: the techniques it leans on, tagged from the
 * official solution text with a lexicon of technique names and the phrases
 * that signal them. Solutions never leave the server, so the tags are computed
 * in `getDeck()` and shipped on each card in place of the solution.
 */

const LEXICON: [idea: string, patterns: RegExp[]][] = [
  ["casework", [/\bcasework\b/, /\bcases?\b/, /\bwlog\b/, /\bwithout loss of generality\b/]],
  ["induction", [/\binduct/, /\binductive\b/]],
  ["contradiction", [/\bcontradiction\b/, /\bsuppose (?:for the sake|not|otherwise)\b/, /\bassume (?:the contrary|not)\b/]],
  ["pigeonhole", [/\bpigeonhole\b/]],
  ["invariant", [/\binvariant\b/, /\bmonovariant\b/]],
  ["extremal argument", [/\bextremal\b/, /\bsmallest such\b/, /\blargest such\b/, /\bminimal counterexample\b/]],
  ["parity", [/\bparity\b/, /\b(?:even|odd) (?:number|integer)s?\b/, /\bboth (?:even|odd)\b/]],
  ["modular arithmetic", [/\bmod(?:ulo|ular)?\b/, /\bpmod\b/, /\bcongruen/, /\bresidues?\b/, /\bremainders?\b/]],
  ["divisibility", [/\bdivis(?:ible|ibility|ors?)\b/, /\bmultiple of\b/, /\bfactors? of\b/]],
  ["primes & factorization", [/\bprime/, /\bfactori[sz]/, /\bprime factor/]],
  ["gcd & lcm", [/\bgcd\b/, /\blcm\b/, /\bgreatest common\b/, /\bleast common\b/, /\brelatively prime\b/, /\bcoprime\b/]],
  ["Diophantine equations", [/\binteger solutions?\b/, /\bdiophantine\b/, /\bpositive integers? (?:such that|satisfying)\b/]],
  ["digits & bases", [/\bdigits?\b/, /\bbase \$?\d/, /\bunits digit\b/]],
  ["factoring", [/\bfactor(?:s|ed|ing)?\b/, /\bdifference of squares\b/, /\bsimon'?s favou?rite\b/]],
  ["substitution", [/\bsubstitut/, /\blet \$?[a-z]\$? ?=/, /\bset \$?[a-z]\$? ?=/]],
  ["systems of equations", [/\bsystem of equations\b/, /\bsimultaneous\b/, /\badding (?:the|these|both) equations\b/, /\bsubtracting (?:the|these|both) equations\b/]],
  ["polynomials & roots", [/\bpolynomial/, /\broots?\b/, /\bvieta/, /\bcoefficients?\b/]],
  ["inequalities & bounding", [/\bam-?gm\b/, /\bcauchy/, /\binequalit/, /\bat most\b/, /\bat least\b/, /\bupper bound\b/, /\blower bound\b/, /\bbound(?:ed|ing|s)?\b/]],
  ["sequences & recursion", [/\brecursi/, /\brecurrence\b/, /\bsequence\b/, /\bfibonacci\b/, /\barithmetic (?:sequence|progression)\b/, /\bgeometric (?:sequence|series|progression)\b/]],
  ["telescoping", [/\btelescop/]],
  ["functional equations", [/\bfunctional equation\b/, /\bplug(?:ging)? in \$?[a-z] ?=/, /\bf\(0\)/, /\bf\(1\)/]],
  ["logarithms & exponents", [/\blog(?:arithm)?s?\b/, /\bexponents?\b/, /\bpowers? of\b/]],
  ["trigonometry", [/\bsin\b/, /\bcos\b/, /\btan\b/, /\btrig/, /\blaw of (?:sines|cosines)\b/]],
  ["complex numbers", [/\bcomplex number/, /\broots of unity\b/, /\bimaginary\b/, /\bde moivre\b/]],
  ["counting & bijections", [/\bbinom\b/, /\bchoose\b/, /\bcombination/, /\bpermutation/, /\bbijection\b/, /\bways to\b/, /\bnumber of ways\b/, /\bcount(?:ing)?\b/]],
  ["complementary counting", [/\bcomplement/, /\bsubtract(?:ing)? (?:the|those|these) (?:cases|ways)\b/, /\btotal (?:number of ways|minus)\b/]],
  ["inclusion-exclusion", [/\binclusion/, /\bexclusion\b/, /\bovercount/, /\bdouble[- ]count/]],
  ["stars and bars", [/\bstars and bars\b/, /\bballs and urns\b/, /\bnonnegative integer solutions\b/]],
  ["probability", [/\bprobabilit/, /\brandom/, /\bchance\b/]],
  ["expected value", [/\bexpected value\b/, /\bexpectation\b/, /\blinearity of expectation\b/]],
  ["symmetry", [/\bsymmetr/, /\bby the same (?:argument|reasoning|logic)\b/]],
  ["graph theory", [/\bgraph\b/, /\bvertices\b/, /\bedges?\b/, /\bcolou?ring\b/]],
  ["generating functions", [/\bgenerating function/, /\broots of unity filter\b/]],
  ["angle chasing", [/\bangle/, /\binscribed\b/, /\bcyclic quadrilateral\b/, /\bcircumcircle\b/]],
  ["similar triangles", [/\bsimilar\b/, /\bsimilarity\b/, /\bratio of (?:the )?sides\b/]],
  ["Pythagorean theorem", [/\bpythagor/, /\bright triangle\b/, /\bhypotenuse\b/]],
  ["coordinates", [/\bcoordinate/, /\bx-axis\b/, /\by-axis\b/, /\bslope\b/, /\bdistance formula\b/]],
  ["area & volume", [/\barea\b/, /\bvolume\b/, /\bheron/, /\bshoelace\b/, /\bsurface area\b/]],
  ["circles & power of a point", [/\bpower of a point\b/, /\btangent/, /\bchord/, /\bradius\b/, /\bcircle\b/]],
  ["vectors & transformations", [/\bvector/, /\breflect/, /\brotat/, /\btranslat/, /\bhomothety\b/, /\bdilation\b/]],
  ["mass points & ratios", [/\bmass points?\b/, /\bmenelaus\b/, /\bceva\b/, /\bratio\b/]],
  ["3D geometry", [/\bsphere\b/, /\bcube\b/, /\bpyramid\b/, /\btetrahedron\b/, /\bprism\b/, /\bcylinder\b/, /\bcone\b/]],
  ["graphing & functions", [/\bgraph(?:ing)? (?:of|the|each)\b/, /\bpiecewise\b/, /\babsolute value\b/, /\bintercept/]],
  ["optimization", [/\bmaximi[sz]/, /\bminimi[sz]/, /\bmaximum\b/, /\bminimum\b/, /\boptimal\b/]],
  ["rates & word problems", [/\brate\b/, /\bspeed\b/, /\bper hour\b/, /\bpercent/, /\baverage\b/, /\bmean\b/]],
];

/** Fallback when no technique keyword is present: the solution just computes. */
export const DIRECT_COMPUTATION = "direct computation";

/** Technique tags found in a solution, in lexicon order; never empty. */
export function extractKeyIdeas(solution: string): string[] {
  const text = solution.toLowerCase().replace(/\s+/g, " ");
  const ideas = LEXICON.filter(([, patterns]) => patterns.some((pattern) => pattern.test(text))).map(
    ([idea]) => idea,
  );
  return ideas.length > 0 ? ideas : [DIRECT_COMPUTATION];
}

/** |A ∩ B| / |A ∪ B|; 0 when either set is empty. */
export function jaccard(a: readonly string[], b: readonly string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const idea of setA) if (setB.has(idea)) shared += 1;
  return shared / (setA.size + setB.size - shared);
}
