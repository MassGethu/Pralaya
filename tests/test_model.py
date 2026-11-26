"""Model and loader tests on the shipped checkpoint. They need no dataset or network.

    .venv/bin/python -m pytest tests/test_model.py -q
"""
from __future__ import annotations

import re
import time
from pathlib import Path

import numpy as np
import pytest

from model.inference import load_cpu

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "model" / "bundle"
T2M_MIN, T2M_MAX = 233.15, 333.15          # kit validity range
MAX_STEPS = 14
SHAPE_IN, SHAPE_STEP = (3, 6, 32, 36), (6, 32, 36)
BASE = np.array([295.0, 4.0, 2.0, 1.0, 100500.0, 35.0], dtype=np.float32)
SCALE = np.array([3.0, 2.0, 1.0, 1.0, 300.0, 5.0], dtype=np.float32)


def doy_sincos(doy: int) -> np.ndarray:
    a = 2 * np.pi * doy / 365.0
    return np.array([np.sin(a), np.cos(a)], dtype=np.float32)


def synthetic(seed: int = 0, base: np.ndarray = BASE) -> np.ndarray:
    """Smooth, physically plausible 3-day history (same idea as the team's check_inference payload)."""
    lat = np.deg2rad(np.arange(6.5, 38.0))[:, None]
    lon = np.deg2rad(np.arange(65.5, 101.0))[None, :]
    days = [base[:, None, None] + SCALE[:, None, None] * np.sin(4 * lat + lon + 0.3 * (d + seed)) for d in range(3)]
    x = np.stack(days).astype(np.float32)
    x[:, 1] = np.maximum(x[:, 1], 0.0)
    return x


@pytest.fixture(scope="module")
def forecast():
    return load_cpu(BUNDLE)


def test_load_cpu_returns_callable_with_model_id(forecast):
    assert callable(forecast)
    assert isinstance(forecast.model_id, str) and forecast.model_id


def test_load_cpu_missing_bundle_raises(tmp_path):
    with pytest.raises(FileNotFoundError):
        load_cpu(tmp_path)


@pytest.mark.parametrize("steps", [1, 10, MAX_STEPS])
def test_output_shape_dtype_finite(forecast, steps):
    out = forecast(synthetic(), doy_sincos(160), steps)
    assert out.shape == (steps, *SHAPE_STEP)
    assert out.dtype == np.float32
    assert np.isfinite(out).all()


def test_deterministic(forecast):
    a = forecast(synthetic(), doy_sincos(200), 10)
    b = forecast(synthetic(), doy_sincos(200), 10)
    assert np.array_equal(a, b)


def test_inputs_not_mutated(forecast):
    hist, sc = synthetic(), doy_sincos(30)
    hist[-1, 1, :4, :4] = -1.0                  # negative rain: the model clips its own copy
    h0, s0 = hist.copy(), sc.copy()
    forecast(hist, sc, 10)
    assert np.array_equal(hist, h0) and np.array_equal(sc, s0)


@pytest.mark.parametrize("doy", [15, 105, 196, 288])
def test_rain_nonnegative_and_t2m_in_range(forecast, doy):
    out = forecast(synthetic(seed=doy), doy_sincos(doy), MAX_STEPS)
    assert out[:, 1].min() >= 0.0
    assert T2M_MIN <= out[:, 0].min() and out[:, 0].max() <= T2M_MAX


@pytest.mark.parametrize("t2m,doy", [(250.0, 15), (250.0, 196), (310.0, 140)])
def test_flat_extreme_t2m_stays_valid(forecast, t2m, doy):
    """Flat cold/hot input (the case that drove b1 to 206 K by day 14) must stay inside the validity range."""
    x = synthetic()
    x[:, 0] = t2m
    out = forecast(x, doy_sincos(doy), MAX_STEPS)
    assert T2M_MIN <= out[:, 0].min() and out[:, 0].max() <= T2M_MAX
    assert out[:, 1].min() >= 0.0


def test_list_inputs_accepted(forecast):
    a = forecast(synthetic().tolist(), doy_sincos(160).tolist(), 2)
    b = forecast(synthetic(), doy_sincos(160), 2)
    assert np.array_equal(a, b)


@pytest.mark.parametrize("bad", [np.zeros((2, 6, 32, 36), np.float32), np.zeros((3, 6, 36, 32), np.float32)])
def test_bad_shape_raises(forecast, bad):
    with pytest.raises(ValueError):
        forecast(bad, doy_sincos(1), 1)


def test_nan_input_raises(forecast):
    x = synthetic()
    x[0, 0, 0, 0] = np.nan
    with pytest.raises(ValueError):
        forecast(x, doy_sincos(1), 1)


def test_zero_steps_raises(forecast):
    with pytest.raises(ValueError):
        forecast(synthetic(), doy_sincos(1), 0)


def test_cpu_latency_10_steps(forecast):
    forecast(synthetic(), doy_sincos(160), 10)                       # warm-up
    t0 = time.perf_counter()
    forecast(synthetic(), doy_sincos(160), 10)
    assert time.perf_counter() - t0 < 1.0                             # grader limit is 5 s per HTTP call


INFERENCE_FILES = sorted((ROOT / "model").glob("*.py"))
DATE_RE = re.compile(r"\b(19|20)\d{2}-?(0[1-9]|1[0-2])-?(0[1-9]|[12]\d|3[01])\b")
ROUTE_RE = re.compile(r"[/'\"]simulate['\"]|/simulate\b")
TRAIN_IMPORT_RE = re.compile(r"^\s*(from|import)\s+(train|evaluation)\b", re.M)


@pytest.mark.parametrize("path", INFERENCE_FILES, ids=lambda p: p.name)
def test_inference_code_is_clean(path):
    src = path.read_text()
    assert not DATE_RE.search(src), "date literal in inference code"
    assert not ROUTE_RE.search(src), "route string in model code (repo_scan treats it as a server file)"
    assert not TRAIN_IMPORT_RE.search(src), "inference code imports training/evaluation code"
