"""Calibrate the unperturbed forecast with a fitted seasonal reference."""

import hashlib
from pathlib import Path

import numpy as np


HORIZON = 10
GRID_SHAPE = (6, 32, 36)
DAY_ANGLE = 2 * np.pi / 365


class Calibration:
    def __init__(self, coefficients: np.ndarray, alpha: np.ndarray, land: np.ndarray, persistence: np.ndarray):
        if coefficients.shape != (7, *GRID_SHAPE) or alpha.shape != (HORIZON, GRID_SHAPE[0], 2):
            raise ValueError("invalid calibration coefficients or weights")
        if land.shape != GRID_SHAPE[1:] or land.dtype != np.bool_ or persistence.shape != (HORIZON,):
            raise ValueError("invalid calibration land mask or persistence weights")
        if not np.isfinite(coefficients).all() or not np.all((alpha >= 0.3) & (alpha <= 1)):
            raise ValueError("calibration coefficients or model weights are out of range")
        if not np.all(alpha[:, 1] == 1) or not np.all((persistence >= 0) & (persistence <= 1)):
            raise ValueError("calibration must leave rainfall unchanged and bound persistence weights")
        self.coefficients = coefficients.astype(np.float64)
        self.alpha = np.where(land, alpha[:, :, 1, None, None], alpha[:, :, 0, None, None])
        self.persistence = persistence

    @classmethod
    def load_optional(cls, bundle: Path):
        path = bundle / "calibration.pt"
        if not path.is_file():
            return None
        import torch

        pack = torch.load(path, map_location="cpu", weights_only=True)
        checkpoint_sha = hashlib.sha256((bundle / "pralaya.pt").read_bytes()).hexdigest()
        if pack["checkpoint_sha256"] != checkpoint_sha:
            raise ValueError("calibration was fitted for a different checkpoint")
        return cls(*(pack[key].numpy() for key in ("coefficients", "alpha", "land", "persistence")))

    def apply(self, forecast: np.ndarray, prime: np.ndarray, last: np.ndarray, season: np.ndarray) -> None:
        steps = min(len(forecast), HORIZON)
        phase = np.arctan2(float(season[0]), float(season[1])) + DAY_ANGLE * np.arange(1, steps + 1)
        angles = phase[:, None] * np.arange(1, 4)
        basis = np.column_stack((np.ones(steps), np.sin(angles), np.cos(angles)))
        reference = np.einsum("kb,bchw->kchw", basis, self.coefficients)
        reference += self.persistence[:steps, None, None, None] * (last - reference)
        alpha = self.alpha[:steps]
        raw_prime = prime[:steps]
        calibrated_prime = reference + alpha * (raw_prime - reference)
        # Keep the model response around the calibrated Prime and bypass unity weights exactly.
        raw_delta = forecast[:steps] - raw_prime
        np.copyto(forecast[:steps], calibrated_prime + raw_delta, where=alpha != 1)
