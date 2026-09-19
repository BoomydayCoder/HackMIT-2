"""Turns account progress into (user, problem, label) interactions.

Explicit star reviews are the primary signal; solves and surrenders are weaker
implicit ones. Labels are in [-1, 1]: positive means the user liked it.

    python3 -m ml.dataset                # print a summary
    python3 -m ml.dataset --synthetic 40 # add 40 fake users for a dry run
"""

import argparse
import json
import os
import random
from dataclasses import dataclass, field

from ml.features import TOPICS

DECK_PATH = "data/harp-deck.json"
ACCOUNTS_PATH = os.path.join(os.environ.get("MATHMATCH_DATA_DIR", ".data"), "accounts.json")

NEUTRAL_STARS = 3
SOLVED_LABEL = 0.35
RETIRED_LABEL = -0.35


@dataclass
class Interaction:
    user: str
    problem: str
    label: float
    explicit: bool


@dataclass
class Dataset:
    problems: list[dict]
    interactions: list[Interaction] = field(default_factory=list)

    @property
    def users(self) -> list[str]:
        return sorted({entry.user for entry in self.interactions})

    def by_user(self) -> dict[str, list[Interaction]]:
        grouped: dict[str, list[Interaction]] = {}
        for entry in self.interactions:
            grouped.setdefault(entry.user, []).append(entry)
        return grouped


def load_problems(path: str = DECK_PATH) -> list[dict]:
    with open(path, encoding="utf8") as handle:
        return json.load(handle)


def interactions_from_progress(user: str, progress: dict) -> list[Interaction]:
    reviews = progress.get("reviews") or {}
    seen: dict[str, Interaction] = {}
    for problem_id, stars in reviews.items():
        if isinstance(stars, int) and 1 <= stars <= 5:
            seen[problem_id] = Interaction(user, problem_id, (stars - NEUTRAL_STARS) / 2, True)
    for problem_id in progress.get("solved") or []:
        seen.setdefault(problem_id, Interaction(user, problem_id, SOLVED_LABEL, False))
    for problem_id in progress.get("retired") or []:
        seen.setdefault(problem_id, Interaction(user, problem_id, RETIRED_LABEL, False))
    return list(seen.values())


def load_dataset(accounts_path: str = ACCOUNTS_PATH, deck_path: str = DECK_PATH) -> Dataset:
    dataset = Dataset(load_problems(deck_path))
    known = {problem["id"] for problem in dataset.problems}
    try:
        with open(accounts_path, encoding="utf8") as handle:
            users = json.load(handle).get("users", {})
    except FileNotFoundError:
        users = {}
    for key, record in users.items():
        for entry in interactions_from_progress(key, record.get("progress") or {}):
            if entry.problem in known:
                dataset.interactions.append(entry)
    return dataset


def add_synthetic_users(dataset: Dataset, count: int, seed: int = 0) -> None:
    """Fake users with a favourite topic and a comfort level, for smoke tests."""
    rng = random.Random(seed)
    for index in range(count):
        favourite = rng.choice(TOPICS)
        comfort = rng.randint(1, 9)
        for problem in rng.sample(dataset.problems, k=min(25, len(dataset.problems))):
            score = (1.0 if problem["topic"] == favourite else -0.4) - abs(problem["level"] - comfort) / 6
            stars = max(1, min(5, round(3 + score * 2 + rng.gauss(0, 0.5))))
            dataset.interactions.append(
                Interaction(f"synthetic-{index}", problem["id"], (stars - NEUTRAL_STARS) / 2, True)
            )


def summarize(dataset: Dataset) -> str:
    explicit = sum(entry.explicit for entry in dataset.interactions)
    return (
        f"{len(dataset.problems)} problems, {len(dataset.users)} users, "
        f"{len(dataset.interactions)} interactions ({explicit} explicit reviews)"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--synthetic", type=int, default=0, help="add N fake users")
    args = parser.parse_args()
    data = load_dataset()
    if args.synthetic:
        add_synthetic_users(data, args.synthetic)
    print(summarize(data))
