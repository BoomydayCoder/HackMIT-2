"""Trains the taste model and exports problem embeddings for the web app.

    python3 -m ml.train                       # train on .data/accounts.json
    python3 -m ml.train --synthetic 60        # pad with fake users for a dry run
    python3 -m ml.train --epochs 200 --dim 32 --out data/problem-embeddings.json

Each step samples a user, hides one of their interactions and asks the model to
predict its label from the rest (leave-one-out). Users are split 80/20 for
validation. The report compares the trained model against the untrained
content-feature baseline the app uses before any export exists.
"""

import argparse
import json
import random

import torch
from torch.nn import functional as F

from ml.dataset import Dataset, Interaction, add_synthetic_users, load_dataset, summarize
from ml.features import content_features
from ml.model import TasteModel

MIN_HISTORY = 3


def encode_problems(dataset: Dataset) -> tuple[dict[str, int], torch.Tensor]:
    index = {problem["id"]: position for position, problem in enumerate(dataset.problems)}
    features = torch.tensor([content_features(problem) for problem in dataset.problems])
    return index, features


def leave_one_out(
    histories: list[list[Interaction]],
    index: dict[str, int],
    rng: random.Random,
    explicit_only: bool = False,
) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
    """Builds a padded batch: one held-out target per user history."""
    longest = max(len(history) for history in histories) - 1
    ids = torch.zeros(len(histories), longest, dtype=torch.long)
    labels = torch.zeros(len(histories), longest)
    mask = torch.zeros(len(histories), longest)
    targets = torch.zeros(len(histories), dtype=torch.long)
    target_labels = torch.zeros(len(histories))
    for row, history in enumerate(histories):
        candidates = [entry for entry in history if entry.explicit] if explicit_only else history
        held_out = rng.choice(candidates or history)
        rest = [entry for entry in history if entry is not held_out]
        for column, entry in enumerate(rest):
            ids[row, column] = index[entry.problem]
            labels[row, column] = entry.label
            mask[row, column] = 1.0
        targets[row] = index[held_out.problem]
        target_labels[row] = held_out.label
    return ids, labels, mask, targets, target_labels


def evaluate(
    embed,
    histories: list[list[Interaction]],
    index: dict[str, int],
    features: torch.Tensor,
    rounds: int = 5,
    seed: int = 1,
) -> dict[str, float]:
    """Sign accuracy and correlation of predicted vs. true label on held-out explicit reviews."""
    rng = random.Random(seed)
    predictions, truths = [], []
    with torch.no_grad():
        vectors = embed(features)
        for _ in range(rounds):
            ids, labels, mask, targets, target_labels = leave_one_out(histories, index, rng, explicit_only=True)
            predictions.append(TasteModel.predict(vectors[ids], labels, mask, vectors[targets]))
            truths.append(target_labels)
    predicted = torch.cat(predictions)
    truth = torch.cat(truths)
    decisive = truth != 0
    accuracy = (torch.sign(predicted[decisive]) == torch.sign(truth[decisive])).float().mean().item()
    stacked = torch.stack([predicted, truth])
    correlation = torch.corrcoef(stacked)[0, 1].item() if predicted.std() > 0 else 0.0
    return {"sign_accuracy": accuracy, "correlation": correlation}


def train(dataset: Dataset, epochs: int, dim: int, lr: float, seed: int) -> tuple[TasteModel, dict]:
    torch.manual_seed(seed)
    rng = random.Random(seed)
    index, features = encode_problems(dataset)
    histories = [history for history in dataset.by_user().values() if len(history) >= MIN_HISTORY]
    if not histories:
        raise SystemExit(f"Need users with at least {MIN_HISTORY} interactions; have none.")
    rng.shuffle(histories)
    split = max(1, int(len(histories) * 0.8)) if len(histories) > 1 else 1
    train_set, valid_set = histories[:split], histories[split:] or histories[:split]

    model = TasteModel(embedding_dim=dim)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    for epoch in range(1, epochs + 1):
        model.train()
        ids, labels, mask, targets, target_labels = leave_one_out(train_set, index, rng)
        prediction = model(features[ids], labels, mask, features[targets])
        loss = F.mse_loss(prediction, target_labels)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        if epoch % max(1, epochs // 10) == 0 or epoch == epochs:
            model.eval()
            metrics = evaluate(model.problems, valid_set, index, features)
            print(f"epoch {epoch:4d}  loss {loss.item():.4f}  valid {metrics}")

    model.eval()
    report = {
        "users": len(histories),
        "baseline": evaluate(lambda x: x, valid_set, index, features),
        "trained": evaluate(model.problems, valid_set, index, features),
    }
    return model, report


def export(model: TasteModel, dataset: Dataset, path: str) -> None:
    _, features = encode_problems(dataset)
    with torch.no_grad():
        vectors = model.problems(features)
    payload = {
        "dim": vectors.shape[1],
        "problems": {
            problem["id"]: [round(value, 4) for value in vector.tolist()]
            for problem, vector in zip(dataset.problems, vectors)
        },
    }
    with open(path, "w", encoding="utf8") as handle:
        json.dump(payload, handle)
        handle.write("\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--epochs", type=int, default=300)
    parser.add_argument("--dim", type=int, default=32)
    parser.add_argument("--lr", type=float, default=3e-3)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--synthetic", type=int, default=0, help="add N fake users")
    parser.add_argument("--out", default="data/problem-embeddings.json")
    parser.add_argument("--no-export", action="store_true")
    args = parser.parse_args()

    data = load_dataset()
    if args.synthetic:
        add_synthetic_users(data, args.synthetic, seed=args.seed)
    print(summarize(data))
    trained, summary = train(data, args.epochs, args.dim, args.lr, args.seed)
    print(json.dumps(summary, indent=2))
    if not args.no_export:
        export(trained, data, args.out)
        print(f"wrote {args.out}")
