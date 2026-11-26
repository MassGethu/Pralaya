"""Anomaly-space PralayaNet (a3_anomaly): old checkpoints load unchanged and the served path runs the new one.

    .venv/bin/python -m pytest tests/test_anomaly.py -q
"""
from __future__ import annotations

import math
import shutil
from pathlib import Path

import numpy as np
import pytest
import torch

from model.forecaster import load_model
from model.inference import load_cpu
from model.net import NC, NLAT, NLON, PralayaNet, advance_sincos, harmonic_basis

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "model" / "bundle"
REF = ROOT / "tests" / "fixtures" / "e3_rainstab_ref_rollout.npy"   # bundle rollout from the pre-anomaly net.py (bc127f3), 4 Torch threads
BASE = np.array([295.0, 4.0, 2.0, 1.0, 100500.0, 35.0], dtype=np.float32)
SCALE = np.array([3.0, 2.0, 1.0, 1.0, 300.0, 5.0], dtype=np.float32)


def sincos(doy: float) -> np.ndarray:
    a = 2 * math.pi * doy / 365.0
    return np.array([math.sin(a), math.cos(a)], dtype=np.float32)


def synthetic() -> np.ndarray:
    lat = np.deg2rad(np.arange(6.5, 38.0))[:, None]
    lon = np.deg2rad(np.arange(65.5, 101.0))[None, :]
    x = np.stack([BASE[:, None, None] + SCALE[:, None, None] * np.sin(4 * lat + lon + 0.3 * d) for d in range(3)])
    x = x.astype(np.float32)
    x[:, 1] = np.maximum(x[:, 1], 0.0)
    return x


def coefficients(seed: int = 0) -> torch.Tensor:
    g = torch.Generator().manual_seed(seed)
    coef = torch.zeros(7, NC, NLAT, NLON)
    coef[0] = torch.from_numpy(BASE).view(NC, 1, 1)
    coef[1:] = torch.randn(6, NC, NLAT, NLON, generator=g) * torch.from_numpy(SCALE).view(1, NC, 1, 1)
    return coef


def anomaly_checkpoint(path: Path, perturb_head: bool) -> PralayaNet:
    ck = torch.load(BUNDLE / "pralaya.pt", map_location="cpu", weights_only=True)
    torch.manual_seed(0)
    net = PralayaNet(ck["mean"], ck["std"], ck["static"], anomaly=True, clim_coef=coefficients())
    if perturb_head:
        with torch.no_grad():
            net.head.weight.normal_(0, 1e-3)
    torch.save({"state_dict": net.state_dict(), "config": dict(net.config), "mean": net.mean.view(-1),
                "std": net.std.view(-1), "static": net.static, "meta": {"model_id": "a3_test"}}, path)
    return net.eval()


def test_old_checkpoint_loads_unchanged():
    net, _ = load_model(BUNDLE / "pralaya.pt")
    assert "anomaly" not in net.config and not hasattr(net, "clim_coef")
    out = load_cpu(BUNDLE)(synthetic(), sincos(160), 10)
    np.testing.assert_allclose(out, np.load(REF), rtol=2e-6, atol=2e-3)   # bit-identical at 4 threads here; slack for other BLAS builds


def test_harmonic_basis_matches_calibration_order():
    sc = torch.from_numpy(sincos(100.0))[None]
    a = 2 * math.pi * 100 / 365
    expect = [1, math.sin(a), math.sin(2 * a), math.sin(3 * a), math.cos(a), math.cos(2 * a), math.cos(3 * a)]
    np.testing.assert_allclose(harmonic_basis(sc)[0].numpy(), expect, atol=1e-6)


def test_zero_head_is_persisted_anomaly(tmp_path):
    net = anomaly_checkpoint(tmp_path / "a3.pt", perturb_head=False)
    sc = torch.from_numpy(sincos(200))[None]
    window = torch.from_numpy(synthetic())[None]
    out = net.step(window, sc)
    expect = net.normal(sc) + window[:, -1] - net.normal(advance_sincos(sc, -1))
    expect[:, 1] = expect[:, 1].clamp(min=0)
    torch.testing.assert_close(out, expect, rtol=1e-6, atol=1e-3)


def test_anomaly_checkpoint_roundtrip_keeps_coefficients(tmp_path):
    net = anomaly_checkpoint(tmp_path / "a3.pt", perturb_head=True)
    loaded, meta = load_model(tmp_path / "a3.pt")
    assert loaded.config["anomaly"] is True and meta["model_id"] == "a3_test"
    torch.testing.assert_close(loaded.clim_coef, net.clim_coef, rtol=0, atol=0)
    x, sc = torch.from_numpy(synthetic())[None], torch.from_numpy(sincos(30))[None]
    with torch.inference_mode():
        torch.testing.assert_close(loaded.rollout(x, sc, 5), net.rollout(x, sc, 5), rtol=0, atol=0)


def test_served_adapter_runs_anomaly_checkpoint_unchanged(tmp_path):
    from inference_adapter import Inference

    bundle = tmp_path / "bundle"
    bundle.mkdir()
    net = anomaly_checkpoint(bundle / "pralaya.pt", perturb_head=True)
    served = Inference(bundle, development=False)
    hist, sc = synthetic(), sincos(250)
    out = served.run(hist, sc, 10)
    assert out.shape == (10, NC, NLAT, NLON) and np.isfinite(out).all()
    with torch.inference_mode():
        raw = net.rollout(torch.from_numpy(hist)[None], torch.from_numpy(sc)[None], 10)[0].numpy()
    raw = raw.astype(np.float64)
    raw[:, 0] = np.clip(raw[:, 0], 233.15, 333.15)
    np.testing.assert_allclose(out, raw, rtol=1e-6, atol=1e-4)
