"""Apply a fitted harmonic climatology correction in physical units."""

from pathlib import Path

import numpy as np


BLEND_PATH = Path(__file__).with_suffix(".pt")
HORIZON = 10
MIN_ALPHA = 0.3
STATE_SHAPE = (6, 32, 36)
DAY_ANGLE = 2 * np.pi / 365


def harmonic_basis(phase: np.ndarray, harmonics: int) -> np.ndarray:
    angles = phase[:, None] * np.arange(1, harmonics + 1)
    return np.column_stack((np.ones(len(phase)), np.sin(angles), np.cos(angles)))


class ClimBlend:
    def __init__(self, coefficients, alpha, land, persistence):
        if coefficients.shape not in ((5, *STATE_SHAPE), (7, *STATE_SHAPE)):
            raise ValueError("unexpected climatology coefficient shape")
        if alpha.shape != (HORIZON, STATE_SHAPE[0], 2) or land.shape != STATE_SHAPE[1:]:
            raise ValueError("unexpected blend weight or land mask shape")
        if persistence.shape != (HORIZON,) or land.dtype != np.bool_:
            raise ValueError("unexpected persistence weights or land mask type")
        if not np.isfinite(coefficients).all():
            raise ValueError("climatology coefficients must be finite")
        if not np.all((alpha >= MIN_ALPHA) & (alpha <= 1)):
            raise ValueError("model weights must be in [0.3, 1]")
        if not np.all((persistence >= 0) & (persistence <= 1)):
            raise ValueError("persistence weights must be in [0, 1]")
        self.coefficients = coefficients.astype(np.float64)
        self.alpha = alpha
        self.land = land
        self.persistence = persistence
        self._grid_alpha = np.where(land, alpha[:, :, 1, None, None], alpha[:, :, 0, None, None])

    @classmethod
    def load_optional(cls, path: Path):
        if not path.is_file():
            return None
        import torch

        pack = torch.load(path, map_location="cpu", weights_only=True)
        fields = ("coefficients", "alpha", "land", "persistence")
        return cls(*(pack[field].numpy() for field in fields))

    def apply(self, rollout: np.ndarray, last: np.ndarray, season: np.ndarray) -> None:
        steps = min(len(rollout), HORIZON)
        phase = np.arctan2(float(season[0]), float(season[1])) + DAY_ANGLE * np.arange(1, steps + 1)
        basis = harmonic_basis(phase, (len(self.coefficients) - 1) // 2)
        reference = np.einsum("kb,bchw->kchw", basis, self.coefficients)
        persistence = self.persistence[:steps, None, None, None]
        reference += persistence * (last - reference)
        forecast = rollout[:steps]
        alpha = self._grid_alpha[:steps]
        # Unity weights are an exact bypass, including for rain.
        np.copyto(forecast, reference + alpha * (forecast - reference), where=alpha != 1)
