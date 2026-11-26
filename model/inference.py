"""Loader contract for serve.py / inference_adapter.py (owned by Mass).

    forecast = load_cpu(Path("model/bundle"))
    rollout = forecast(history, doy_sincos, steps)   # [3,6,32,36] already shocked, [2], int -> [steps,6,32,36]

The adapter owns the physical perturbation; this wrapper never applies one (perturbation=None).
"""
from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

import numpy as np

from .forecaster import Forecaster

CHECKPOINT_NAME = "pralaya.pt"


def load_cpu(bundle_dir: Path) -> Callable[[np.ndarray, np.ndarray, int], np.ndarray]:
    ckpt = Path(bundle_dir) / CHECKPOINT_NAME
    if not ckpt.is_file():
        raise FileNotFoundError(f"checkpoint not found: {ckpt}")
    fc = Forecaster(ckpt)

    def forecast(history: np.ndarray, doy_sincos: np.ndarray, steps: int) -> np.ndarray:
        return fc.simulate(history, doy_sincos, steps, None)

    forecast.model_id = fc.model_id  # type: ignore[attr-defined]
    return forecast
