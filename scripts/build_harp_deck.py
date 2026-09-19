"""Build the MathMatch demo deck from the HARP proof-based archive.

Usage: python3 scripts/build_harp_deck.py [count]
Writes data/harp-deck.json.
"""

import json
import re
import sys
import zipfile
from collections import defaultdict

ARCHIVE = "data/harp/HARP_proof-based.jsonl.zip"
MEMBER = "HARP_proof-based.jsonl"
OUTPUT = "data/harp-deck.json"

TOPICS = {
    "algebra": "algebra",
    "counting_and_probability": "combinatorics",
    "geometry": "geometry",
    "number_theory": "number theory",
    "precalculus": "algebra",
    "prealgebra": "algebra",
}

# HARP levels in the proof split run 6-9.
ELO_BY_LEVEL = {6: 1200, 7: 1400, 8: 1600, 9: 1800}

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


def bio(record):
    text = record["problem"].lower()
    for pattern, phrase in BIO_HINTS:
        if re.search(pattern, text):
            return f"Proof problem on {phrase}."
    return f"Proof problem in {TOPICS[record['subject']]}."


def usable(record):
    return not re.search(r"\[asy\]|\\includegraphics|as shown|diagram|figure",
                         record["problem"], re.IGNORECASE)


def main():
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 50

    with zipfile.ZipFile(ARCHIVE) as archive:
        records = [json.loads(line) for line in archive.read(MEMBER).decode().splitlines()]

    by_subject = defaultdict(list)
    for record in records:
        record["level"] = int(record["level"])
        if usable(record):
            by_subject[record["subject"]].append(record)

    for subject in by_subject:
        by_subject[subject].sort(key=lambda r: (r["level"], -int(r["year"]), int(r["number"])))

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
            "set": f"{record['contest']} {record['year']}",
            "topic": TOPICS[record["subject"]],
            "elo": ELO_BY_LEVEL[record["level"]],
            "bio": bio(record),
            "statement": record["problem"],
            "solution": solutions[0],
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
