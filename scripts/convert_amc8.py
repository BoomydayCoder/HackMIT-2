"""Convert AoPS wikitext for the 2023 AMC 8 into data/amc8-2023.json.

Inputs (fetched from artofproblemsolving.com/wiki with ?action=raw):
  answers.txt            lines like "#D" (answer key, problems 1..25)
  solutions_raw.json     {"1": wikitext of "2023 AMC 8 Problems/Problem 1", ...}

Usage: python3 scripts/convert_amc8.py answers.txt solutions_raw.json data/amc8-2023.json
"""

import json
import re
import sys

CHOICE_RE = re.compile(r"\\textbf\{\s*\(([A-E])\)\s*\}(?:\\ |~|\s)*")
# Choices that are diagrams or span several <imath> blocks and can't be parsed.
ANSWER_OVERRIDES = {
    2: "\\text{choice (E) in the source figure}",
    16: "132\\text{ Ps, } 134\\text{ Qs, } 134\\text{ Rs}",
}
CHOICES_RE = re.compile(r"<imath>\s*(\\textbf\{\s*\(A\)\s*\}.*?)</imath>", re.S)
SOURCE_URL = "https://artofproblemsolving.com/wiki/index.php/2023_AMC_8_Problems/Problem_{n}"


def to_dollar_math(text: str) -> str:
    text = re.sub(r"<imath>(.*?)</imath>", lambda m: f"${m.group(1).strip()}$", text, flags=re.S)
    text = re.sub(r"<cmath>(.*?)</cmath>", lambda m: f"$${m.group(1).strip()}$$", text, flags=re.S)
    text = re.sub(r"<asy>.*?</asy>", "[diagram omitted — see source]", text, flags=re.S)
    text = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]+)\]\]", r"\1", text)  # [[link|label]] -> label
    text = re.sub(r"'''(.*?)'''", r"\1", text)
    text = re.sub(r"''(.*?)''", r"\1", text)
    text = re.sub(r"<br\s*/?>", "\n", text)
    return text


def parse_choices(block: str) -> dict[str, str]:
    """Return {letter: latex} from the answer-choice math line."""
    ms = CHOICES_RE.findall(block)
    if not ms:
        return {}
    parts = re.split(r"\\qquad|\\quad|\\hspace\{[^}]*\}", " ".join(ms))
    choices = {}
    for part in parts:
        cm = CHOICE_RE.match(part.strip())
        if cm:
            choices[cm.group(1)] = part.strip()[cm.end():].strip()
    return choices


def sections(wikitext: str) -> list[tuple[str, str]]:
    out: list[tuple[str, list[str]]] = []
    for line in wikitext.splitlines():
        m = re.match(r"^==+\s*(.*?)\s*==+\s*$", line)
        if m:
            out.append((m.group(1).strip(), []))
        elif out:
            out[-1][1].append(line)
    return [(t, "\n".join(b).strip()) for t, b in out]


def clean_solution(body: str, answer: str) -> str:
    # \boxed{\textbf{(D)}\ 18} -> \boxed{18}
    body = CHOICE_RE.sub("", body)
    body = re.sub(r"^~.*$", "", body, flags=re.M)  # author signatures
    body = re.sub(r"^(Solution by|Note:? edited by|\(?answer to anonymous|Anonymous question).*$", "", body, flags=re.M | re.I)
    body = re.sub(r"https?://\S+", "", body)
    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    return to_dollar_math(body)


def convert(n: int, wikitext: str, answer: str) -> dict:
    secs = sections(wikitext)
    problem_block = next(b for t, b in secs if t.lower().startswith("problem"))
    choices = parse_choices(problem_block)
    statement = CHOICES_RE.sub("", problem_block)
    statement = re.sub(r"<imath>\s*\\textbf\{\s*\([B-E]\)\s*\}.*?</imath>", "", statement, flags=re.S)
    statement = to_dollar_math(statement).strip()
    statement = re.sub(r"\n{3,}", "\n\n", statement)

    solutions = [
        clean_solution(b, answer)
        for t, b in secs
        if re.match(r"solution(\s*\d+)?(\s*\(.*\))?$", t, flags=re.I) and "video" not in t.lower()
    ]
    solutions = [s for s in solutions if len(s) > 40]
    solution = "\n\n".join(
        f"Solution {i + 1}.\n{s}" if len(solutions) > 1 else s for i, s in enumerate(solutions[:2])
    )
    answer_latex = ANSWER_OVERRIDES.get(n) or choices.get(answer, "")
    solution = f"Answer: ${answer_latex}$\n\n{solution}" if answer_latex else solution

    return {
        "id": f"AMC8-2023-{n}",
        "set": "AMC 8 2023",
        "number": str(n),
        "topic": "amc 8",
        "statement": statement,
        "solution": solution,
        "answer": answer_latex,
        "proposer": "MAA",
        "sourceUrl": SOURCE_URL.format(n=n),
    }


def main(answers_path: str, solutions_path: str, out_path: str) -> None:
    answers = [line.strip().lstrip("#") for line in open(answers_path) if line.strip()]
    raw = json.load(open(solutions_path))
    problems = [convert(n, raw[str(n)], answers[n - 1]) for n in range(1, 26)]
    json.dump(problems, open(out_path, "w"), indent=2, ensure_ascii=False)
    print(f"wrote {len(problems)} problems to {out_path}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
