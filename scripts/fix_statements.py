"""Hand-corrected statements for problems whose display math did not survive PDF extraction."""
import json
import sys

OVERRIDES = {
    "A3": "Let $x_1, x_2, \\ldots, x_{2023}$ be distinct real positive numbers such that\n$$a_n = \\sqrt{(x_1 + x_2 + \\cdots + x_n)\\left(\\frac{1}{x_1} + \\frac{1}{x_2} + \\cdots + \\frac{1}{x_n}\\right)}$$\nis an integer for every $n = 1, 2, \\ldots, 2023$. Prove that $a_{2023} \\geq 3034$.",
    "A4": "Let $\\mathbb{R}_{>0}$ be the set of positive real numbers. Determine all functions $f: \\mathbb{R}_{>0} \\to \\mathbb{R}_{>0}$ such that\n$$x\\bigl(f(x) + f(y)\\bigr) \\geq \\bigl(f(f(x)) + y\\bigr) f(y)$$\nfor every $x, y \\in \\mathbb{R}_{>0}$.",
    "A5": "Let $a_1, a_2, \\ldots, a_{2023}$ be positive integers such that\n• $a_1, a_2, \\ldots, a_{2023}$ is a permutation of $1, 2, \\ldots, 2023$, and\n• $|a_1 - a_2|, |a_2 - a_3|, \\ldots, |a_{2022} - a_{2023}|$ is a permutation of $1, 2, \\ldots, 2022$.\nProve that $\\max(a_1, a_{2023}) \\geq 507$.",
    "A7": "Let $N$ be a positive integer. Prove that there exist three permutations $a_1, a_2, \\ldots, a_N$; $b_1, b_2, \\ldots, b_N$; and $c_1, c_2, \\ldots, c_N$ of $1, 2, \\ldots, N$ such that\n$$\\left|\\sqrt{a_k} + \\sqrt{b_k} + \\sqrt{c_k} - 2\\sqrt{N}\\right| < 2023$$\nfor every $k = 1, 2, \\ldots, N$.",
    "C3": "Let $n$ be a positive integer. We arrange $1 + 2 + \\cdots + n$ circles in a triangle with $n$ rows, such that the $i^{\\text{th}}$ row contains exactly $i$ circles (like bowling pins).\nIn this triangle, a ninja-path is a sequence of circles obtained by repeatedly going from a circle to one of the two circles directly below it. In terms of $n$, find the largest value of $k$ such that if one circle from every row is coloured red, we can always find a ninja-path in which at least $k$ of the circles are red.",
    "C6": "Let $N$ be a positive integer, and consider an $N \\times N$ grid. A right-down path is a sequence of grid cells such that each cell is either one cell to the right of or one cell below the previous cell in the sequence. A right-up path is a sequence of grid cells such that each cell is either one cell to the right of or one cell above the previous cell in the sequence.\nProve that the cells of the $N \\times N$ grid cannot be partitioned into less than $N$ right-down or right-up paths.",
    "G1": "Let $ABCDE$ be a convex pentagon such that $\\angle ABC = \\angle AED = 90^\\circ$. Suppose that the midpoint of $CD$ is the circumcentre of triangle $ABE$. Let $O$ be the circumcentre of triangle $ACD$.\nProve that line $AO$ passes through the midpoint of segment $BE$.",
    "G4": "Let $ABC$ be an acute-angled triangle with $AB < AC$. Denote its circumcircle by $\\Omega$ and denote the midpoint of arc $CAB$ by $S$. Let the perpendicular from $A$ to $BC$ meet $BS$ and $\\Omega$ at $D$ and $E \\neq A$ respectively. Let the line through $D$ parallel to $BC$ meet line $BE$ at $L$ and denote the circumcircle of triangle $BDL$ by $\\omega$. Let $\\omega$ meet $\\Omega$ again at $P \\neq B$.\nProve that the line tangent to $\\omega$ at $P$, and line $BS$ intersect on the internal bisector of $\\angle BAC$.",
    "G8": "Let $ABC$ be an equilateral triangle. Points $A_1, B_1, C_1$ lie inside triangle $ABC$ such that triangle $A_1B_1C_1$ is scalene, $BA_1 = A_1C$, $CB_1 = B_1A$, $AC_1 = C_1B$ and\n$$\\angle BA_1C + \\angle CB_1A + \\angle AC_1B = 480^\\circ.$$\nLines $BC_1$ and $CB_1$ intersect at $A_2$; lines $CA_1$ and $AC_1$ intersect at $B_2$; and lines $AB_1$ and $BA_1$ intersect at $C_2$.\nProve that the circumcircles of triangles $AA_1A_2$, $BB_1B_2$, $CC_1C_2$ have two common points.",
    "N7": "Let $a, b, c, d$ be positive integers satisfying\n$$\\frac{ab}{a+b} + \\frac{cd}{c+d} = \\frac{(a+b)(c+d)}{a+b+c+d}.$$\nDetermine all possible values of $a + b + c + d$.",
    "N8": "Let $\\mathbb{Z}_{>0}$ be the set of positive integers. Determine all functions $f: \\mathbb{Z}_{>0} \\to \\mathbb{Z}_{>0}$ such that\n$$f^{bf(a)}(a + 1) = (a + 1) f(b)$$\nholds for all $a, b \\in \\mathbb{Z}_{>0}$, where $f^k(n) = f(f(\\cdots f(n) \\cdots))$ denotes the composition of $f$ with itself $k$ times.",
}

path = sys.argv[1]
data = json.load(open(path))
for r in data:
    if r["number"] in OVERRIDES:
        r["statement"] = OVERRIDES[r["number"]]
json.dump(data, open(path, "w"), ensure_ascii=False, indent=2)
print(f"patched {len(OVERRIDES)} statements")
