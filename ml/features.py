"""Hand-made problem features, mirroring lib/recommend.ts exactly.

The web app falls back to these features when no trained embeddings exist, and
the model's problem tower consumes them as input, so the two implementations
must stay in lock step: same tokenizer, same FNV-1a hash, same layout.
"""

import re

TOPICS = ("algebra", "combinatorics", "geometry", "number theory")
TEXT_DIM = 64
MAX_LEVEL = 9
ELO_SCALE = 2500
FEATURE_DIM = len(TOPICS) + 2 + TEXT_DIM

_TEX = re.compile(r"\\[a-z]+")
_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def tokenize(statement: str) -> list[str]:
    text = _NON_ALNUM.sub(" ", _TEX.sub(" ", statement.lower()))
    return [token for token in text.split(" ") if len(token) >= 2]


def fnv1a(token: str) -> int:
    hash_ = 0x811C9DC5
    for char in token:
        # JS uses charCodeAt (UTF-16 code units); tokens are ASCII after tokenize.
        hash_ ^= ord(char)
        hash_ = (hash_ * 0x01000193) & 0xFFFFFFFF
    return hash_


def content_features(problem: dict) -> list[float]:
    topic = [1.0 if entry == problem["topic"] else 0.0 for entry in TOPICS]
    scalars = [problem["level"] / MAX_LEVEL, problem["elo"] / ELO_SCALE]
    text = [0.0] * TEXT_DIM
    for token in tokenize(problem["statement"]):
        text[fnv1a(token) % TEXT_DIM] += 1.0
    norm = sum(value * value for value in text) ** 0.5 or 1.0
    return topic + scalars + [value / norm for value in text]
