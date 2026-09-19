"""Build the MathMatch demo deck from the HARP archives.

Usage: python3 scripts/build_harp_deck.py [count] [easy|proof]
"easy" pulls level 1-2 AMC/AJHSME problems (still solved by writing a proof),
"proof" pulls the USAMO/USAJMO proof split. Writes data/harp-deck.json.
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

TOPICS = {
    "algebra": "algebra",
    "counting_and_probability": "combinatorics",
    "geometry": "geometry",
    "number_theory": "number theory",
    "precalculus": "algebra",
    "prealgebra": "algebra",
}

ELO_BY_LEVEL = {1: 800, 2: 900, 3: 1000, 4: 1050, 5: 1100, 6: 1200, 7: 1400, 8: 1600, 9: 1800}

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


def bio(record, lead):
    text = record["problem"].lower()
    for pattern, phrase in BIO_HINTS:
        if re.search(pattern, text):
            if lead == "Warm-up":
                phrase = EASY_PHRASES.get(phrase, phrase)
            return f"{lead} on {phrase}."
    return f"{lead} in {TOPICS[record['subject']]}."


def usable(record):
    return not re.search(r"\[asy\]|\\includegraphics|as shown|diagram|figure|"
                         r"which of the following|\\text\{\(",
                         record["problem"], re.IGNORECASE)


def main():
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    mode = sys.argv[2] if len(sys.argv) > 2 else "easy"
    easy = mode == "easy"
    archive_path, member = ((MAIN_ARCHIVE, MAIN_MEMBER) if easy
                            else (PROOF_ARCHIVE, PROOF_MEMBER))
    lead = "Warm-up" if easy else "Proof problem"

    with zipfile.ZipFile(archive_path) as archive:
        records = [json.loads(line) for line in archive.read(member).decode().splitlines()]

    by_subject = defaultdict(list)
    for record in records:
        record["level"] = int(record["level"])
        if easy and (record["level"] not in EASY_LEVELS
                     or record["contest"] not in EASY_CONTESTS
                     or len(record["problem"]) > 320
                     or not record["problem"].rstrip().endswith("?")):
            continue
        if usable(record):
            by_subject[record["subject"]].append(record)

    for subject in by_subject:
        if easy:
            random.Random(7).shuffle(by_subject[subject])
            by_subject[subject].sort(key=lambda r: r["level"])
            del by_subject[subject][count:]
        else:
            by_subject[subject].sort(
                key=lambda r: (r["level"], -int(r["year"]), int(r["number"])))

    selected = []
    subjects = sorted(by_subject)
    index = 0
    while len(selected) < count:
        added = False
        for subject in subjects:
            bucket = by_subject[subject]
            if index < len(bucket) and len(selected) < count:
                selected.append(bucket[index])
                added = True
        if not added:
            break
        index += 1

    problems = []
    for record in selected:
        solutions = [record[key] for key in sorted(record) if key.startswith("solution_")]
        problems.append({
            "id": f"HARP-{record['contest']}-{record['year']}-{record['number']}",
            "number": str(record["number"]),
            "set": f"{record['contest'].replace('_', ' ')} {record['year']}",
            "topic": TOPICS[record["subject"]],
            "elo": ELO_BY_LEVEL[record["level"]] + (100 if "10" in record["contest"] else 0),
            "bio": bio(record, lead),
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
