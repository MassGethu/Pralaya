"""Score the shock-preserving blend (docs/BLEND_DELTA.md) with evaluation/evaluate.py (kit scoring).

  python -m scripts.blend_delta_score --split val --blend /tmp/fit/rung4_floor0.3.pt --out /tmp/delta.json

Unshocked: clip(blend(raw, last)). Nonzero shock: clip(blend(base, last) + (shocked - base)), with `last` the
unperturbed last input day. Only the forecaster is swapped; every score comes from evaluation.evaluate unchanged.
"""
from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

import numpy as np

from evaluation import evaluate as E
from evaluation.data import DEFAULT_NC
from inference_adapter import clip_forecast
from model.forecaster import Forecaster
from postprocess.clim_blend import ClimBlend
from scripts.clim_blend_score import points

ROOT = Path(__file__).resolve().parents[1]


class DeltaForecaster:
    """Blend the unshocked rollout; add the raw model's shock response on top."""

    def __init__(self, ckpt, blend: ClimBlend, rain_qm=None):
        self._fc = Forecaster(ckpt)
        self._rain_qm = rain_qm
        self.model_id = self._fc.model_id
        self.meta = self._fc.meta
        self._blend = blend
        self._cache: tuple[bytes, np.ndarray] | None = None

    def _base(self, init_states, doy_sincos, steps) -> np.ndarray:
        key = np.asarray(init_states).tobytes() + np.asarray(doy_sincos).tobytes() + bytes([steps])
        if self._cache is None or self._cache[0] != key:
            self._cache = (key, np.array(self._fc.simulate(init_states, doy_sincos, steps, None), dtype=np.float64))
        return self._cache[1]

    def simulate(self, init_states, doy_sincos, steps, perturbation=None):
        base = self._base(init_states, doy_sincos, steps)
        out = base.copy()
        last = np.array(init_states[-1], dtype=np.float32, copy=True)
        self._blend.apply(out, last, np.asarray(doy_sincos, dtype=np.float32))
        if perturbation is not None and np.any(perturbation):
            shocked = np.array(self._fc.simulate(init_states, doy_sincos, steps, perturbation), dtype=np.float64)
            out += shocked - base
        out = clip_forecast(out)
        if self._rain_qm is not None:
            self._rain_qm.apply(out)  # monotone map of rain values, output stays >= 0
        return out


def pin_tp(blend: ClimBlend) -> ClimBlend:
    """Same blend with rain (tp) at model weight 1.0, i.e. rain left unblended (docs/RAIN_QM.md fallback)."""
    alpha = blend.alpha.copy()
    alpha[:, 1, :] = 1.0
    return ClimBlend(blend.coefficients, alpha, blend.land, blend.persistence)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ckpt", default=str(ROOT / "model" / "bundle" / "pralaya.pt"))
    ap.add_argument("--blend", type=Path, required=True)
    ap.add_argument("--split", default="val", choices=["val", "test"])
    ap.add_argument("--data", default=str(DEFAULT_NC))
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--rain-qm", type=Path, help="rain quantile-mapping artifact from scripts.rain_qm")
    ap.add_argument("--pin-tp", action="store_true", help="leave rain unblended (model weight 1.0)")
    a = ap.parse_args(argv)
    logging.getLogger("inference_adapter").setLevel(logging.ERROR)
    blend = ClimBlend.load_optional(a.blend)
    if blend is None:
        ap.error(f"blend artifact not found: {a.blend}")
    if a.pin_tp:
        blend = pin_tp(blend)
    rain_qm = None
    if a.rain_qm is not None:
        from scripts.rain_qm import RainQM
        rain_qm = RainQM.load(a.rain_qm)
    E.Forecaster = lambda ckpt: DeltaForecaster(ckpt, blend, rain_qm)  # evaluate() builds its forecaster by name
    res = E.evaluate(a.ckpt, a.split, a.data)
    res["blend"] = str(a.blend)
    res["method"] = "shock-preserving delta" + (" + pinned tp" if a.pin_tp else "") + (" + rain QM" if rain_qm else "")
    res["rain_qm"] = str(a.rain_qm) if a.rain_qm else None
    res["points"] = points(res)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(res, indent=1, default=float))
    a.out.with_suffix(".md").write_text(E.summary(res) + "\n")
    print(E.summary(res).split("### Uncertainty")[0])
    print(json.dumps(res["points"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
