"""a4_rainhead: two-part rain head (p(tp >= 1 mm) x wet-day amount). No dataset or network needed.

    .venv/bin/python -m pytest tests/test_rain_head.py -q
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import pytest
import torch

from model.forecaster import load_model
from model.net import NC, RAIN_LOGIT_INIT, TP, PralayaNet
from tests.test_model import doy_sincos, synthetic

ROOT = Path(__file__).resolve().parents[1]
CKPT = ROOT / "model" / "bundle" / "pralaya.pt"
P_INIT = 1.0 / (1.0 + math.exp(-RAIN_LOGIT_INIT))


def _ckpt() -> dict:
    return torch.load(CKPT, map_location="cpu", weights_only=True)


def _rain_head_from(ck: dict) -> PralayaNet:
    net = PralayaNet(ck["mean"], ck["std"], ck["static"], **{**ck["config"], "rain_head": True})
    missing, unexpected = net.load_state_dict(ck["state_dict"], strict=False)
    assert not unexpected
    assert sorted(missing) == ["rain_logit.bias", "rain_logit.weight"]
    return net.eval()


def _inputs():
    x = torch.from_numpy(synthetic())[None]
    sc = torch.from_numpy(doy_sincos(200))[None]
    return x, sc


def test_old_checkpoint_loads_unchanged():
    ck = _ckpt()
    assert "rain_head" not in ck["config"]
    net, _ = load_model(CKPT)                                   # strict load
    assert not hasattr(net, "rain_logit")
    assert set(net.state_dict()) == set(ck["state_dict"])
    x, sc = _inputs()
    with torch.no_grad():
        out, amount, logit = net.rollout_parts(x, sc, 3)
    assert logit is None
    assert torch.equal(out, net.rollout(x, sc, 3))
    assert torch.equal(out[:, :, TP:TP + 1], amount)


def test_untrained_rain_head_starts_at_parent():
    ck = _ckpt()
    old, _ = load_model(CKPT)
    new = _rain_head_from(ck)
    x, sc = _inputs()
    with torch.no_grad():
        ref = old.step(x, sc)
        out, amount, logit = new.step_parts(x, sc)
    assert torch.allclose(logit, torch.full_like(logit, RAIN_LOGIT_INIT))
    keep = [c for c in range(NC) if c != TP]
    assert torch.allclose(out[:, keep], ref[:, keep], atol=1e-4, rtol=0)   # non-rain channels unchanged
    assert torch.allclose(amount, ref[:, TP:TP + 1], atol=1e-4, rtol=0)      # amount head IS the old tp head
    assert torch.allclose(out[:, TP:TP + 1], P_INIT * ref[:, TP:TP + 1], atol=1e-4, rtol=0)


def test_rain_head_checkpoint_round_trip(tmp_path):
    from train import save_ckpt

    net = _rain_head_from(_ckpt())
    save_ckpt(tmp_path / "pralaya.pt", net, {"model_id": "a4_rainhead_test"})
    back, meta = load_model(tmp_path / "pralaya.pt")
    assert back.config.get("rain_head") is True and meta["model_id"] == "a4_rainhead_test"
    x, sc = _inputs()
    with torch.no_grad():
        assert torch.equal(back.rollout(x, sc, 4), net.rollout(x, sc, 4))


def test_served_adapter_runs_rain_head_checkpoint(tmp_path):
    """serve.py's Inference (unchanged) loads a rain-head bundle and returns a valid 10-day rollout."""
    from inference_adapter import Inference
    from train import save_ckpt

    net = _rain_head_from(_ckpt())
    save_ckpt(tmp_path / "pralaya.pt", net, {"model_id": "a4_rainhead_test"})
    inference = Inference(tmp_path, development=False)
    out = inference.run(synthetic(), doy_sincos(200), 10)
    assert out.shape == (10, NC, 32, 36)
    assert np.isfinite(out).all()
    assert (out[:, TP] >= 0).all()
