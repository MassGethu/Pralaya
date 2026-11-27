"""Request validation and the physical-unit boundary for the forecast model."""

import base64
import logging
import math
from collections.abc import Callable
from pathlib import Path
from threading import Lock

import numpy as np


STATE_SHAPE = (6, 32, 36)
HISTORY_SHAPE = (3, *STATE_SHAPE)
MAX_STEPS = 14  # monsoon_r1.contract.MAX_STEPS in the organizer's v1.0.0 wheel
DEVELOPMENT_NAME = "PRALAYA-dev-persistence"
LOGGER = logging.getLogger(__name__)
Forecast = Callable[[np.ndarray, np.ndarray, int], np.ndarray]


def _numeric_lists(value: object, shape: tuple[int, ...]) -> bool:
    if not isinstance(value, list) or len(value) != shape[0]:
        return False
    if len(shape) == 1:
        return all(type(item) in (int, float) for item in value)
    return all(_numeric_lists(item, shape[1:]) for item in value)


def _array(value: object, shape: tuple[int, ...], field: str) -> np.ndarray:
    if isinstance(value, dict) and len(shape) > 1:
        encoded = value.get("b64")
        byte_count = math.prod(shape) * 4
        if (
            value.get("shape") != list(shape)
            or not isinstance(encoded, str)
            or len(encoded) != 4 * ((byte_count + 2) // 3)
        ):
            raise ValueError(f"{field} must encode shape {list(shape)} as little-endian float32")
        raw = base64.b64decode(encoded, validate=True)
        if len(raw) != byte_count:
            raise ValueError(f"{field} has an invalid base64 array length")
        array = np.frombuffer(raw, dtype="<f4").reshape(shape).astype(np.float32)
    else:
        if not _numeric_lists(value, shape):
            raise ValueError(f"{field} must be a numeric list of shape {list(shape)}")
        with np.errstate(over="ignore", invalid="ignore"):
            array = np.asarray(value, dtype=np.float32)
    if not np.isfinite(array).all():
        raise ValueError(f"{field} must contain finite float32 values")
    return array


def prepare_simulation(body: object) -> tuple[np.ndarray, np.ndarray, int, np.ndarray | None]:
    if not isinstance(body, dict):
        raise ValueError("request must be a JSON object")
    steps = body.get("steps")
    if type(steps) is not int or not 1 <= steps <= MAX_STEPS:
        raise ValueError(f"steps must be an integer between 1 and {MAX_STEPS}")
    history = _array(body.get("init_states"), HISTORY_SHAPE, "init_states")
    season = _array(body.get("doy_sincos"), (2,), "doy_sincos")
    if body.get("perturbation") is not None:
        delta = _array(body["perturbation"], STATE_SHAPE, "perturbation")
        if np.any(delta):
            return apply_perturbation(history, delta), season, steps, history
    return history, season, steps, None


def parse_simulation(body: object) -> tuple[np.ndarray, np.ndarray, int]:
    history, season, steps, _ = prepare_simulation(body)
    return history, season, steps


def apply_perturbation(history: np.ndarray, delta: np.ndarray) -> np.ndarray:
    shocked = history.copy()
    with np.errstate(over="ignore", invalid="ignore"):
        shocked[-1] += delta
    if not np.isfinite(shocked[-1]).all():
        raise ValueError("perturbed last state must contain finite float32 values")
    return shocked


def _persistence(history: np.ndarray, season: np.ndarray, steps: int) -> np.ndarray:
    return np.repeat(history[-1:], steps, axis=0)


class Inference:
    def __init__(self, bundle_dir: Path, development: bool) -> None:
        self._lock = Lock()
        self.model_name = DEVELOPMENT_NAME if development else "PRALAYA"
        self._forecast: Forecast = _persistence if development else self._load(bundle_dir)
        self.model_id = getattr(self._forecast, "model_id", self.model_name)
        self._calibration = None
        if not development:
            from model.calibration import Calibration

            self._calibration = Calibration.load_optional(bundle_dir)
        # Exercise the actual 10-step inference path before starting the listener.
        air = np.array([295, 4, 2, 1, 100500, 35], dtype=np.float32)
        history = np.broadcast_to(air[None, :, None, None], HISTORY_SHAPE).copy()
        self.run(history, np.array([0, 1], dtype=np.float32), 10)

    @staticmethod
    def _load(bundle_dir: Path) -> Forecast:
        if not bundle_dir.is_dir():
            raise FileNotFoundError(f"Trained PRALAYA bundle directory is missing: {bundle_dir}")
        try:
            from model.inference import load_cpu

            return load_cpu(bundle_dir)
        except Exception as exc:
            raise RuntimeError(f"Unable to load the trained PRALAYA bundle at {bundle_dir}: {exc}") from exc

    def _raw(self, history: np.ndarray, season: np.ndarray, steps: int, forecast: Forecast | None = None) -> np.ndarray:
        rollout = np.array((forecast or self._forecast)(history, season, steps), dtype=np.float64)
        if rollout.shape != (steps, *STATE_SHAPE):
            raise ValueError(f"forecast returned an unexpected shape: {rollout.shape}")
        if not np.isfinite(rollout).all():
            raise ValueError("forecast returned nonfinite values")
        return rollout

    def run(self, history: np.ndarray, season: np.ndarray, steps: int, prime_history: np.ndarray | None = None) -> np.ndarray:
        # Copy model output before releasing the lock in case the backend reuses storage.
        with self._lock:
            response = getattr(self._forecast, "response", None)
            if response is not None and prime_history is not None:
                # Ensemble: Prime is the member mean; the shock response is the first member's own.
                prime = self._raw(prime_history, season, steps)
                rollout = prime + (self._raw(history, season, steps, response)
                                   - self._raw(prime_history, season, steps, response))
            else:
                rollout = self._raw(history, season, steps)
                if self._calibration is not None and prime_history is not None:
                    prime = self._raw(prime_history, season, steps)
                else:
                    prime = rollout
        if self._calibration is not None:
            last = history[-1] if prime_history is None else prime_history[-1]
            self._calibration.apply(rollout, prime, last, season)
        if not np.isfinite(rollout).all():
            raise ValueError("forecast returned nonfinite values")
        temperature = rollout[:, 0]
        rain = rollout[:, 1]
        clipped_temperature = np.count_nonzero((temperature < 233.15) | (temperature > 333.15))
        clipped_rain = np.count_nonzero(rain < 0)
        np.clip(temperature, 233.15, 333.15, out=temperature)
        np.maximum(rain, 0, out=rain)
        if clipped_temperature or clipped_rain:
            LOGGER.warning(
                "Clipped %d forecast cells (t2m=%d, tp=%d)",
                clipped_temperature + clipped_rain, clipped_temperature, clipped_rain,
            )
        return rollout
