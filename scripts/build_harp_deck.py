"""Build the MathMatch problem pool from the HARP archives.

Usage: python3 scripts/build_harp_deck.py [count] [mixed|easy|proof]
"mixed" (default) spans levels 1-9 by drawing short-answer problems from the
main split and proof problems from the USAMO/USAJMO split; "easy" keeps only
level 1-2 AMC/AJHSME warm-ups; "proof" keeps only the proof split. Every
problem is answered by writing a proof. Writes data/harp-deck.json.
"""

import json
import random
import re
import sys
import zipfile
from collections import defaultdict

PROOF_ARCHIVE = "data/harp/HARP_proof-based.jsonl.zip"
PROOF_MEMBER = "HARP_proof-based.jsonl"
MAIN_ARCHIVE = "data/harp/HARP.jsonl.zip"
MAIN_MEMBER = "HARP.jsonl"
OUTPUT = "data/harp-deck.json"

EASY_CONTESTS = ("AJHSME", "AMC_8", "AMC_10", "AMC_10A", "AMC_10B")
EASY_LEVELS = (1, 2)
MAX_STATEMENT = 320
MAX_PROOF_STATEMENT = 520

TOPICS = {
    "algebra": "algebra",
    "counting_and_probability": "combinatorics",
    "geometry": "geometry",
    "number_theory": "number theory",
    "precalculus": "algebra",
    "prealgebra": "algebra",
}

# Display rating derived from HARP's stored difficulty level, nudged by the
# contest the problem came from. A demo heuristic, not a calibrated rating.
ELO_BY_LEVEL = {1: 800, 2: 900, 3: 1000, 4: 1100, 5: 1250, 6: 1450, 7: 1650, 8: 1850, 9: 2050}

ELO_BY_CONTEST = {
    "AJHSME": -50,
    "AMC_8": -50,
    "AMC_10": 0,
    "AMC_12": 50,
    "AHSME": 50,
    "AIME": 150,
    "USAJMO": 0,
    "USAMO": 100,
}

BIO_HINTS = [
    (r"\bprime|divisib|modulo|\bmod\b|integer solutions", "primes and divisibility"),
    (r"inequalit|\bAM-GM\b|\bmaximi[sz]|minimi[sz]", "an inequality to pin down"),
    (r"polynomial", "polynomials"),
    (r"sequence|recurrence|\ba_n\b", "a sequence that misbehaves"),
    (r"triangle", "triangles"),
    (r"circle|circumcircle|incircle|cyclic", "circles and cyclic points"),
    (r"tetrahedron|sphere|cube|solid", "solid geometry"),
    (r"color|colour", "a colouring argument"),
    (r"graph|vertices|edges", "graphs"),
    (r"game|player|strategy", "a two-player game"),
    (r"permutation|subset|combinat|counting|arrangement", "counting under constraints"),
    (r"probabilit|random", "probability"),
    (r"function|f\(x\)", "a functional equation"),
]


EASY_PHRASES = {
    "a sequence that misbehaves": "a sequence",
    "an inequality to pin down": "a largest-or-smallest value",
    "a colouring argument": "colouring",
    "a functional equation": "a function",
    "counting under constraints": "counting",
    "a two-player game": "a game",
}


def lead_for(level):
    if level <= 2:
        return "Warm-up"
    if level <= 5:
        return "Problem"
    return "Proof problem"


def bio(record, lead):
    text = record["problem"].lower()
    for pattern, phrase in BIO_HINTS:
        if re.search(pattern, text):
            if lead == "Warm-up":
                phrase = EASY_PHRASES.get(phrase, phrase)
            return f"{lead} on {phrase}."
    return f"{lead} in {TOPICS[record['subject']]}."


def elo_for(record):
    contest = record["contest"]
    family = next((key for key in ELO_BY_CONTEST if contest.startswith(key)), None)
    return ELO_BY_LEVEL[record["level"]] + (ELO_BY_CONTEST[family] if family else 0)


def usable(record):
    return not re.search(r"\[asy\]|\\includegraphics|as shown|diagram|figure|"
                         r"which of the following|\\text\{\(",
                         record["problem"], re.IGNORECASE)


def load(archive_path, member):
    with zipfile.ZipFile(archive_path) as archive:
        records = [json.loads(line) for line in archive.read(member).decode().splitlines()]
    for record in records:
        record["level"] = int(record["level"])
    return records


def wanted(record, mode):
    if not usable(record):
        return False
    if mode == "easy":
        return (record["level"] in EASY_LEVELS
                and record["contest"] in EASY_CONTESTS
                and len(record["problem"]) <= MAX_STATEMENT
                and record["problem"].rstrip().endswith("?"))
    if record.get("answer") is not None:
        return (len(record["problem"]) <= MAX_STATEMENT
                and record["problem"].rstrip().endswith("?"))
    return len(record["problem"]) <= MAX_PROOF_STATEMENT


def pick(records, count, mode):
    """Round-robin over (level, topic) buckets so the pool spans the difficulty range."""
    buckets = defaultdict(list)
    for record in records:
        if wanted(record, mode):
            buckets[(record["level"], TOPICS[record["subject"]])].append(record)

    rng = random.Random(7)
    for bucket in buckets.values():
        rng.shuffle(bucket)

    keys = sorted(buckets)
    selected = []
    depth = 0
    while len(selected) < count:
        added = False
        for key in keys:
            if depth < len(buckets[key]) and len(selected) < count:
                selected.append(buckets[key][depth])
                added = True
        if not added:
            break
        depth += 1
    return selected


def main():
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    mode = sys.argv[2] if len(sys.argv) > 2 else "mixed"

    records = []
    if mode != "proof":
        records += load(MAIN_ARCHIVE, MAIN_MEMBER)
    if mode in ("mixed", "proof"):
        records += load(PROOF_ARCHIVE, PROOF_MEMBER)

    problems = []
    for record in pick(records, count, mode):
        solutions = [record[key] for key in sorted(record) if key.startswith("solution_")]
        problems.append({
            "id": f"HARP-{record['contest']}-{record['year']}-{record['number']}",
            "number": str(record["number"]),
            "set": f"{record['contest'].replace('_', ' ')} {record['year']}",
            "topic": TOPICS[record["subject"]],
            "level": record["level"],
            "elo": elo_for(record),
            "bio": bio(record, lead_for(record["level"])),
            "statement": record["problem"],
            "solution": solutions[0],
            **({"answer": record["answer"]} if record.get("answer") else {}),
            "proposer": "HARP",
            "sourceUrl": "https://github.com/aadityasingh/HARP",
        })

    problems.sort(key=lambda p: (p["elo"], p["id"]))
    with open(OUTPUT, "w", encoding="utf-8") as handle:
        json.dump(problems, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print(f"wrote {len(problems)} problems to {OUTPUT}")


if __name__ == "__main__":
    main()
