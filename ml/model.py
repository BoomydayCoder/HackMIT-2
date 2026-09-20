"""Two-tower taste model.

Problem tower: an MLP over the hand-made content features, producing a unit
embedding per problem. Scorer: parameter-free kernel regression over the user's
history: the similarity-weighted (clamped cosine) average of their labels,
shrunk toward neutral by PRIOR_WEIGHT. Keeping the scorer parameter-free means
the exported problem embeddings plug straight into lib/recommend.ts, whose
`similarProblems` uses the same embeddings for nearest-neighbour lists.
"""

import torch
from torch import nn
from torch.nn import functional as F

from ml.features import FEATURE_DIM

PRIOR_WEIGHT = 1.0


class ProblemTower(nn.Module):
    def __init__(self, embedding_dim: int = 32, hidden_dim: int = 128, dropout: float = 0.1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(FEATURE_DIM, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, embedding_dim),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return F.normalize(self.net(features), dim=-1)


class TasteModel(nn.Module):
    def __init__(self, embedding_dim: int = 32, hidden_dim: int = 128, dropout: float = 0.1):
        super().__init__()
        self.problems = ProblemTower(embedding_dim, hidden_dim, dropout)

    @staticmethod
    def predict(
        history: torch.Tensor, labels: torch.Tensor, mask: torch.Tensor, target: torch.Tensor
    ) -> torch.Tensor:
        """Predicted centred label of `target` (batch, dim) from a history of
        embeddings (batch, n, dim) with labels/mask (batch, n). Neutral is 0."""
        similarity = F.cosine_similarity(history, target.unsqueeze(1), dim=-1, eps=1e-6)
        weight = similarity.clamp(min=0) * mask
        return (weight * labels).sum(dim=1) / (PRIOR_WEIGHT + weight.sum(dim=1))

    def forward(
        self,
        history: torch.Tensor,
        history_labels: torch.Tensor,
        history_mask: torch.Tensor,
        target: torch.Tensor,
    ) -> torch.Tensor:
        """Predicts the label of `target` from a user's history. Shapes:
        history (batch, n, FEATURE_DIM), history_labels/mask (batch, n), target (batch, FEATURE_DIM)."""
        return self.predict(self.problems(history), history_labels, history_mask, self.problems(target))
