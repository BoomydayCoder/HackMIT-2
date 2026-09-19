"""Extract IMO 2023 Shortlist problems and solutions from the official PDF.

Usage: python3 scripts/extract_shortlist.py /path/to/IMO2023SL.pdf data/imo-2023-shortlist.json
"""
import json
import re
import sys

import pymupdf

SOURCE_URL = "https://www.imo-official.org/assets/documents/problems/2023/IMO2023SL.pdf"
TOPICS = {"A": "algebra", "C": "combinatorics", "G": "geometry", "N": "number theory"}

MATHA = {
    "`": "+", "p": "(", "q": ")", "“": "=", "´": "−", "¨": "·", "ď": "≤", "ě": "≥",
    "ą": ">", "ă": "<", "˝": "°", "P": "∈", "˚": "*", "?": "√", "ˆ": "×", "Ø": "→",
    "|": "|", "”": "≡", "t": "{", "u": "}", "{": "/", "‰": "≠", "d": "√", "„": "∼",
    "K": "⊥", "r": "[", "s": "]", "ñ": "⇒", "Ñ": "→", "X": "∩", "ð": "⇐", "ù": "=",
    "\\": "∖", "‚": "∅", "ı": "≢", "1": "′", "R": "ℝ", "Z": "ℤ", "Y": "∪", "H": "∅",
    "–": "∓", "8": "∞", "˘": "∓", "2": "∞", "\u200c": "",
}
MATHB = {"=": "∠", "l": "∤", ">": "arc ", "t": "⌊", "u": "⌋", "r": "⌈", "s": "⌉"}
MATHX = {
    "`": "(", "˘": ")", "ˆ": "(", "˙": ")", "ÿ": "∑", "ś": "∏", "d": "√", "Z": "∑", "^": "",
    "Y": "∏", "]": "", "a": "{", "’": "}", "´": "(", "¯": ")", "˜": "(", "¸": ")", "ź": "",
    "#": "|", "$": "|", "&": "|", "%": "|", "Q": "|", "U": "|", "ř": "∑", "P": "(",
    "T": ")", "»": "√", "–": "√", "ﬁ": "(", "ﬂ": ")", "l": "", "m": "", "n": "", "o": "_",
    "\"": "|", "c": "|", "X": "√", "\\": "",
}
MSBM = {"Z": "ℤ", "R": "ℝ", "F": "𝔽", "Q": "ℚ", "N": "ℕ", "C": "ℂ"}
SUP = str.maketrans("0123456789+-=()n", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿ")
SUB = str.maketrans("0123456789+-=()", "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎")


def map_span(text, font):
    if font.startswith("TeX-matha"):
        return "".join(MATHA.get(c, c) for c in text)
    if font.startswith("TeX-mathb"):
        return "".join(MATHB.get(c, c) for c in text)
    if font.startswith("TeX-mathx"):
        return "".join(MATHX.get(c, c) for c in text)
    if font.startswith("MSBM"):
        return "".join(MSBM.get(c, c) for c in text)
    return text


def script_wrap(text, kind):
    text = text.strip()
    if not text:
        return ""
    table = SUP if kind == "sup" else SUB
    conv = text.translate(table)
    if all(ord(c) > 127 or c.isspace() for c in conv) and conv != text:
        return conv
    return ("^" if kind == "sup" else "_") + (text if len(text) == 1 else "{" + text + "}")


def line_text(line):
    spans = [s for s in line["spans"] if s["text"].strip() or s["text"]]
    if not spans:
        return ""
    base = max(spans, key=lambda s: s["size"])
    base_size, base_y = base["size"], base["origin"][1]
    out = []
    buf, kind = "", None
    for s in spans:
        t = map_span(s["text"], s["font"])
        small = s["size"] < base_size - 1.5 and base_size >= 9.5
        k = None
        if small:
            dy = base_y - s["origin"][1]
            k = "sup" if dy > 1.5 else ("sub" if dy < -0.8 else None)
        if k != kind:
            if kind:
                out.append(script_wrap(buf, kind))
            elif buf:
                out.append(buf)
            buf, kind = "", k
        buf += t
    if kind:
        out.append(script_wrap(buf, kind))
    else:
        out.append(buf)
    return "".join(out)


def page_lines(page):
    d = page.get_text("dict")
    lines = []
    for b in d["blocks"]:
        for l in b.get("lines", []):
            txt = line_text(l).strip()
            if txt:
                lines.append((l["bbox"][1], l["bbox"][0], txt))
    lines.sort()
    return [t for _, _, t in lines]


HEADER = re.compile(r"^(Shortlisted problems(\s*[–-]\s*solutions)?\s*\d*|\d+\s*Chiba, Japan.*|\d+)$")
LABEL = re.compile(r"^([ACGN]\d)\.\s*(.*)$")


def clean_lines(lines):
    out = []
    for t in lines:
        t = re.sub(r"\s+", " ", t).strip()
        t = re.sub(r"\s*Chiba, Japan, 2nd–13th July 2023\s*", " ", t).strip()
        if not t or HEADER.match(t) or t in ("()", "(", ")"):
            continue
        out.append(t)
    return out


def join_lines(lines):
    text = "\n".join(lines)
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    text = re.sub(r"([^\n.:])\n(?!\s*(Solution|Comment|Lemma|Claim|Proof|•|\(|[A-Z][a-z]+ \d))", r"\1 ", text)
    text = re.sub(r"\s+([,.;:)])", r"\1", text)
    text = re.sub(r"\(\s+", "(", text)
    text = re.sub(r"\n{2,}", "\n\n", text)
    return text.strip()


def split_by_label(lines):
    sections = {}
    cur = None
    for t in lines:
        m = LABEL.match(t)
        if m:
            cur = m.group(1)
            sections[cur] = [m.group(2)] if m.group(2) else []
        elif cur:
            sections[cur].append(t)
    return sections


def main(pdf_path, out_path):
    doc = pymupdf.open(pdf_path)
    pages = [clean_lines(page_lines(p)) for p in doc]
    sol_start = next(i for i, ls in enumerate(pages) if ls and ls[0] == "Solutions" and i > 3)
    prob_start = next(i for i, ls in enumerate(pages) if ls and ls[0] == "Problems")
    prob_lines = [t for ls in pages[prob_start:sol_start] for t in ls if t not in ("Problems", "Algebra", "Combinatorics", "Geometry", "Number Theory")]
    sol_lines = [t for ls in pages[sol_start:] for t in ls if t != "Solutions"]
    probs = split_by_label(prob_lines)
    sols = split_by_label(sol_lines)
    result = []
    for label in probs:
        body = probs[label]
        proposer = ""
        if body and re.fullmatch(r"\([A-Za-z .]+\)", body[-1]):
            proposer = body[-1].strip("()")
            body = body[:-1]
        statement = join_lines(body)
        sol_body = sols.get(label, [])
        stmt_len = len(body)
        solution = join_lines(sol_body[stmt_len:]) if len(sol_body) > stmt_len else join_lines(sol_body)
        solution = re.sub(r"^\([A-Za-z .]+\)\s*", "", solution)
        result.append({
            "id": f"IMO-SL-2023-{label}",
            "number": label,
            "topic": TOPICS[label[0]],
            "statement": statement,
            "solution": solution,
            "proposer": proposer,
            "sourceUrl": SOURCE_URL,
        })
    with open(out_path, "w") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"wrote {len(result)} problems to {out_path}")
    for r in result:
        print(r["number"], len(r["statement"]), len(r["solution"]), r["proposer"])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
