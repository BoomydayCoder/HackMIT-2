"""Two-tower taste model.

Problem tower: an MLP over the hand-made content features, producing a unit
embedding per problem. User tower: parameter-free, the label-weighted sum of the
embeddings of the problems the user has interacted with. Scoring is the cosine
between the two. Keeping the user tower parameter-free means the exported
problem embeddings plug straight into lib/recommend.ts, whose `tasteVector` and
`affinity` are exactly this user tower and scorer.
"""

import torch
from torch import nn
from torch.nn import functional as F

from ml.features import FEATURE_DIM


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
        # Cosine lives in [-1, 1]; the label scale lets the fit use the full range.
        self.scale = nn.Parameter(torch.tensor(2.0))

    @staticmethod
    def taste(embeddings: torch.Tensor, labels: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        """labels/mask: (batch, history); embeddings: (batch, history, dim)."""
        weights = (labels * mask).unsqueeze(-1)
        return (weights * embeddings).sum(dim=1)

    def forward(
        self,
        history: torch.Tensor,
        history_labels: torch.Tensor,
        history_mask: torch.Tensor,
        target: torch.Tensor,
    ) -> torch.Tensor:
        """Predicts the label of `target` from a user's history. Shapes:
        history (batch, n, FEATURE_DIM), history_labels/mask (batch, n), target (batch, FEATURE_DIM)."""
        taste = self.taste(self.problems(history), history_labels, history_mask)
        return self.scale * F.cosine_similarity(taste, self.problems(target), dim=-1, eps=1e-6)
