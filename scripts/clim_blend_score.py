"""Score the served path with and without the seasonal blend using evaluation/evaluate.py (kit scoring).

  python -m scripts.clim_blend_score --split val --out /tmp/e3_raw.json
  python -m scripts.clim_blend_score --split val --blend /tmp/fit/rung4_floor0.3.pt --out /tmp/e3_blend.json

Both runs wrap model.forecaster.Forecaster the way inference_adapter.Inference.run serves a request: a nonzero
perturbation is added to the last input day, the optional blend uses that already-perturbed day as persistence,
and the result is clipped with inference_adapter.clip_forecast. Only the forecaster is swapped; every score, shock
and variance ratio comes from evaluation.evaluate unchanged.
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

ROOT = Path(__file__).resolve().parents[1]


class ServedForecaster:
    """Forecaster-compatible wrapper reproducing the adapter's post-model steps."""

    def __init__(self, ckpt, blend: ClimBlend | None):
        self._fc = Forecaster(ckpt)
        self.model_id = self._fc.model_id
        self.meta = self._fc.meta
        self._blend = blend

    def simulate(self, init_states, doy_sincos, steps, perturbation=None):
        last = np.array(init_states[-1], dtype=np.float32, copy=True)
        if perturbation is not None and np.any(perturbation):
            last += np.asarray(perturbation, dtype=np.float32)
        rollout = np.array(self._fc.simulate(init_states, doy_sincos, steps, perturbation), dtype=np.float64)
        if self._blend is not None:
            self._blend.apply(rollout, last, np.asarray(doy_sincos, dtype=np.float32))
        return clip_forecast(rollout)


def points(res: dict) -> dict:
    a, s = res["aggregate"], res["shocks"]
    parts = {"rmse": a["rmse_points_proxy"], "csi": a["csi_points_proxy"], "blur": a["anti_blur_points_proxy"],
             "causality": s["causality_points_proxy_mean"]}
    return {**parts, "S": float(sum(parts.values()))}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ckpt", default=str(ROOT / "model" / "bundle" / "pralaya.pt"))
    ap.add_argument("--blend", type=Path, default=None, help="blend artifact; omit for the unblended served path")
    ap.add_argument("--split", default="val", choices=["val", "test"])
    ap.add_argument("--data", default=str(DEFAULT_NC))
    ap.add_argument("--out", required=True, type=Path)
    a = ap.parse_args(argv)
    logging.getLogger("inference_adapter").setLevel(logging.ERROR)
    blend = None
    if a.blend is not None:
        blend = ClimBlend.load_optional(a.blend)
        if blend is None:
            ap.error(f"blend artifact not found: {a.blend}")
    E.Forecaster = lambda ckpt: ServedForecaster(ckpt, blend)  # evaluate() builds its forecaster by name
    res = E.evaluate(a.ckpt, a.split, a.data)
    res["blend"] = str(a.blend) if a.blend else None
    res["points"] = points(res)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(res, indent=1, default=float))
    a.out.with_suffix(".md").write_text(E.summary(res) + "\n")
    print(E.summary(res).split("### Uncertainty")[0])
    print(json.dumps(res["points"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
