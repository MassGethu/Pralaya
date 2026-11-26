"""Team contract test: fails loudly if the model, the adapter or the checkpoint break the shared interface.

Run from the repo root before every push that touches model/, serve.py, inference_adapter.py or the checkpoint:

    python tests/test_contract.py            # plain Python, no extra dependencies
    python -m pytest tests/test_contract.py  # also works if pytest is installed

It checks the agreed interface in docs/DECISIONS.md (entries 6-10): the loader entry point, the bundle path,
the shock ownership, determinism, input immutability and output validity. It does not measure forecast skill.

Keep this file free of the endpoint route text, calendar date literals and plotting imports: the organiser's
repo scan would otherwise treat it as inference code.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

BUNDLE = ROOT / "model" / "bundle"
CHECKPOINT = BUNDLE / "pralaya.pt"
SHAPE = (6, 32, 36)
STEPS = 10
LAT = np.arange(6.5, 38.0, 1.0)
LON = np.arange(65.5, 101.0, 1.0)


def _history(phase: float = 0.0) -> np.ndarray:
    """A smooth, physically plausible 3-day history in API units (not real weather)."""
    lat = np.deg2rad(LAT)[:, None]
    lon = np.deg2rad(LON)[None, :]
    base = np.array([295, 4, 2, 1, 100500, 35], dtype=np.float32)
    scale = np.array([3, 2, 1, 1, 300, 5], dtype=np.float32)
    days = [base[:, None, None] + scale[:, None, None] * np.sin(4 * lat + lon + 0.3 * day + phase) for day in range(3)]
    history = np.stack(days).astype(np.float32)
    history[:, 1] = np.maximum(history[:, 1], 0)
    return history


def _season(doy: int = 160) -> np.ndarray:
    angle = 2 * np.pi * doy / 365
    return np.array([np.sin(angle), np.cos(angle)], dtype=np.float32)


def _warm_bay_delta(last_day: np.ndarray) -> np.ndarray:
    """The published warm-ocean recipe: +3 K t2m and +15 % of current tcwv over lat 8..20, lon 82..94."""
    box = ((LAT >= 8) & (LAT <= 20))[:, None] & ((LON >= 82) & (LON <= 94))[None, :]
    delta = np.zeros(SHAPE, dtype=np.float32)
    delta[0][box] = 3.0
    delta[5][box] = 0.15 * last_day[5][box]
    return delta


def _body(history: np.ndarray, perturbation) -> dict:
    return {"init_states": history.tolist(), "doy_sincos": _season().tolist(), "steps": STEPS, "perturbation": perturbation}


def test_checkpoint_is_real_and_tracked():
    assert CHECKPOINT.is_file(), f"missing checkpoint {CHECKPOINT.relative_to(ROOT)} (DECISIONS #6)"
    head = CHECKPOINT.read_bytes()[:200]
    assert not head.startswith(b"version https://git-lfs"), "checkpoint is a Git LFS pointer, not weights"
    assert CHECKPOINT.stat().st_size > 1024, "checkpoint under 1 KB: the repo scan would report no weights"
    probe = subprocess.run(["git", "check-ignore", "-q", str(CHECKPOINT)], cwd=ROOT, capture_output=True)
    if probe.returncode in (0, 1):  # 128 = not a git checkout, nothing to check
        assert probe.returncode == 1, ".gitignore ignores model/bundle/pralaya.pt; add !model/bundle/pralaya.pt"


def test_loader_contract():
    from model.inference import load_cpu

    forecast = load_cpu(BUNDLE)
    history = _history()
    original = history.copy()
    out = np.asarray(forecast(history, _season(), STEPS))
    assert out.shape == (STEPS, *SHAPE), f"forecast shape {out.shape}"
    assert np.isfinite(out).all(), "forecast has NaN or Inf"
    assert np.array_equal(history, original), "forecast mutated its input history"
    again = np.asarray(forecast(history, _season(), STEPS))
    assert np.array_equal(out, again), "forecast is not deterministic across calls"
    one = np.asarray(forecast(history, _season(), 1))
    assert one.shape == (1, *SHAPE) and np.array_equal(one[0], out[0]), "step 1 differs between 1-step and 10-step calls"


def test_adapter_end_to_end():
    from inference_adapter import Inference, parse_simulation

    engine = Inference(BUNDLE, development=False)
    assert engine.model_name == "PRALAYA"
    history = _history(phase=0.7)

    prime = engine.run(*parse_simulation(_body(history, None)))
    zero = engine.run(*parse_simulation(_body(history, np.zeros(SHAPE).tolist())))
    assert prime.shape == (STEPS, *SHAPE)
    assert np.array_equal(prime, zero), "null and all-zero shock must give bit-identical rollouts (DECISIONS #7)"

    assert np.isfinite(prime).all()
    assert prime[:, 1].min() >= 0, "negative rain left the adapter"
    assert prime[:, 0].min() >= 233.15 and prime[:, 0].max() <= 333.15, "t2m outside 233.15-333.15 K left the adapter"

    shocked = engine.run(*parse_simulation(_body(history, _warm_bay_delta(history[-1]).tolist())))
    assert np.isfinite(shocked).all()
    assert np.abs(shocked - prime).max() > 0, "warm-ocean shock produced no response"

    again = engine.run(*parse_simulation(_body(history, None)))
    assert np.array_equal(prime, again), "Prime changed after a shocked request"


def main() -> int:
    tests = [test_checkpoint_is_real_and_tracked, test_loader_contract, test_adapter_end_to_end]
    failed = 0
    for test in tests:
        try:
            test()
        except Exception as exc:  # report every failure, then exit non-zero
            failed += 1
            print(f"FAIL {test.__name__}: {type(exc).__name__}: {exc}")
        else:
            print(f"ok   {test.__name__}")
    print("contract test:", "PASSED" if not failed else f"{failed} FAILED")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
