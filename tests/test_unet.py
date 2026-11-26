"""Experiment B2 (compact U-Net) tests. They need no dataset or network.

    python -m pytest tests/test_unet.py -q

- A checkpoint without "arch" (the shipped CNN) still rebuilds the CNN and gives bit-identical output.
  tests/golden/bundle_golden_2step.npy was written by the code at dccd2c0, before the U-Net was added.
- The untrained U-Net equals persistence, has the right shapes and stays within the parameter budget.
- A U-Net checkpoint round-trips through model.forecaster.load_model / model.inference.load_cpu.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest
import torch

from model.forecaster import load_model
from model.inference import load_cpu
from model.net import NC, NLAT, NLON, T_IN, PralayaNet, UNetCore
from test_model import BUNDLE, doy_sincos, synthetic

GOLDEN = Path(__file__).resolve().parent / "golden" / "bundle_golden_2step.npy"
CNN_PARAMS = 856_422                       # width 96, 5 blocks (docs/EXPERIMENTS.md round 2)
BUDGET = (0.8 * CNN_PARAMS, 1.2 * CNN_PARAMS)
MEAN = np.array([295.0, 3.0, 1.0, 0.5, 100800.0, 30.0], dtype=np.float32)
STD = np.array([5.0, 6.0, 3.0, 3.0, 400.0, 15.0], dtype=np.float32)


def static() -> np.ndarray:
    rng = np.random.default_rng(0)
    return np.stack([(rng.random((NLAT, NLON)) > 0.5).astype(np.float32),
                     rng.random((NLAT, NLON)).astype(np.float32) * 3000.0])


def n_params(net: torch.nn.Module) -> int:
    return sum(p.numel() for p in net.parameters())


def test_cnn_checkpoint_without_arch_is_bit_identical():
    ck = torch.load(BUNDLE / "pralaya.pt", map_location="cpu", weights_only=True)
    assert "arch" not in ck["config"]
    net, _ = load_model(BUNDLE / "pralaya.pt")
    assert not hasattr(net, "unet") and n_params(net) == CNN_PARAMS
    assert list(net.state_dict()) == list(ck["state_dict"])                # same keys, same order
    out = load_cpu(BUNDLE)(synthetic(), doy_sincos(160), 2)
    assert np.array_equal(out, np.load(GOLDEN))


def test_unet_param_count_in_budget():
    unet = PralayaNet(MEAN, STD, static(), arch="unet")
    cnn = PralayaNet(MEAN, STD, static())
    print(f"params: unet={n_params(unet):,} cnn={n_params(cnn):,}")
    assert n_params(cnn) == CNN_PARAMS
    assert BUDGET[0] <= n_params(unet) <= BUDGET[1]


def test_unet_grids_and_skip_shapes():
    core = UNetCore(T_IN * NC + 6)
    x = torch.randn(2, T_IN * NC + 6, NLAT, NLON)
    s1 = core.enc1(core.stem(x))
    s2 = core.enc2(core.down1(s1))
    z = core.bottom(core.down2(s2))
    assert s1.shape[-2:] == (32, 36) and s2.shape[-2:] == (16, 18) and z.shape[-2:] == (8, 9)
    assert core(x).shape == (2, core.stem.out_channels, NLAT, NLON)


def test_unet_starts_at_persistence_and_keeps_interface():
    torch.manual_seed(0)
    net = PralayaNet(MEAN, STD, static(), arch="unet").eval()
    x = torch.from_numpy(synthetic())[None]
    x[0, -1, 1, :3, :3] = -1.0                                             # negative rain in, clamped out
    sc = torch.from_numpy(doy_sincos(160))[None]
    with torch.no_grad():
        step = net.step(x, sc)
        roll = net.rollout(x, sc, 10)
    assert step.shape == (1, NC, NLAT, NLON) and roll.shape == (1, 10, NC, NLAT, NLON)
    want = x[:, -1].clone()
    want[:, 1] = want[:, 1].clamp_min(0.0)
    torch.testing.assert_close(step, want, rtol=1e-5, atol=1e-4)
    for k in range(10):                                                    # persistence holds through the rollout
        torch.testing.assert_close(roll[:, k], want, rtol=1e-5, atol=1e-3)
    assert roll[:, :, 1].min() >= 0.0


def test_unet_has_gradient_and_rejects_other_switches():
    net = PralayaNet(MEAN, STD, static(), arch="unet")
    x = torch.from_numpy(synthetic())[None]
    sc = torch.from_numpy(doy_sincos(100))[None]
    net.step(x, sc).sum().backward()
    assert net.head.weight.grad.abs().sum() > 0                            # zero head still learns
    with pytest.raises(ValueError):
        PralayaNet(MEAN, STD, static(), arch="unet", advect=True)
    with pytest.raises(ValueError):
        PralayaNet(MEAN, STD, static(), arch="transformer")


def test_unet_checkpoint_roundtrip(tmp_path):
    torch.manual_seed(1)
    net = PralayaNet(MEAN, STD, static(), arch="unet")
    with torch.no_grad():                                                  # leave persistence so the test means something
        net.head.weight.normal_(0, 1e-2)
    path = tmp_path / "pralaya.pt"
    torch.save({"state_dict": net.state_dict(), "config": dict(net.config), "mean": torch.from_numpy(MEAN),
                "std": torch.from_numpy(STD), "static": torch.from_numpy(static()), "meta": {"model_id": "b2_test"}},
               path)
    loaded, meta = load_model(path)
    assert loaded.config == {"arch": "unet", "widths": [48, 96, 128]} and meta["model_id"] == "b2_test"
    x, sc = synthetic(), doy_sincos(200)
    with torch.no_grad():
        ref = net.eval().rollout(torch.from_numpy(x)[None], torch.from_numpy(sc)[None], 4)[0].numpy()
    out = load_cpu(tmp_path)(x, sc, 4)
    assert np.array_equal(out, ref)
    assert not np.allclose(out[0], x[-1], atol=1e-3)
