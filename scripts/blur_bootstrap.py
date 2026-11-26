"""How much anti-blur could 5 judge windows cost? (docs/BLEND_DELTA.md, risks)

  python -m scripts.blur_bootstrap --fits DIR --out evaluation/results/blend_delta/blur_bootstrap_val.json

DIR holds the cached val 2020 rollouts and blend artifacts written by `scripts.clim_blend_experiment prepare/val`
(single model) and `scripts.ensemble prepare/val`: DIR/delta/fit/{validation.npz, rung4_floor0.3.pt} and
DIR/ens/fit/{validation.npz, rung4_floor0.3.pt}. For each candidate it computes the kit's day-8 variance ratio per
window (unshocked forecasts, blend and clipping as served), then scores the kit's anti-blur points on 20,000 random
draws of 5 windows, the number of real windows the judge uses. Diagnostic only; it changes no decision on its own.
"""
from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

import numpy as np
from monsoon_r1 import scoring as S

from inference_adapter import clip_forecast
from postprocess.clim_blend import ClimBlend
from scripts.blend_delta_score import pin_tp

CHANNELS = ["t2m", "tp", "u10", "v10", "msl", "tcwv"]
DAY8 = 7
JUDGE_WINDOWS = 5
DRAWS = 20_000
CANDIDATES = [  # name, cache folder, blend artifact (None = unblended), rain pinned to the model
    ("shipped seed 0", "delta", None, False),
    ("step-2 blend", "delta", "delta/fit/rung4_floor0.3.pt", False),
    ("step-2, rain unblended", "delta", "delta/fit/rung4_floor0.3.pt", True),
    ("ensemble raw", "ens", None, False),
    ("ensemble + blend 0.3", "ens", "ens/fit/rung4_floor0.3.pt", False),
]


def day8_ratios(cache, blend: ClimBlend | None) -> np.ndarray:
    """[windows, 6] kit variance ratio at day 8 of the served (blended, clipped) unshocked forecast."""
    out_ratios = []
    for w in range(cache["raw"].shape[0]):
        out = cache["raw"][w].astype(np.float64).copy()
        if blend is not None:
            blend.apply(out, cache["last"][w].astype(np.float64), cache["seasons"][w])
        out = clip_forecast(out)
        out_ratios.append(S.variance_ratio(out[DAY8], cache["truth"][w, DAY8]))
    return np.array(out_ratios)


def summarise(ratios: np.ndarray, rng: np.random.Generator) -> dict:
    draws = rng.integers(0, len(ratios), size=(DRAWS, JUDGE_WINDOWS))
    pts = np.array([S.anti_blur_points(ratios[d]) for d in draws])
    tp = ratios[:, 1]
    return {
        "mean_ratio": dict(zip(CHANNELS, np.nanmean(ratios, 0).round(3).tolist())),
        "tp_frac_windows_below_0.4": round(float((tp < S.BLUR_MIN_RATIO).mean()), 3),
        "tp_median": round(float(np.nanmedian(tp)), 3),
        "anti_blur_all_windows": round(S.anti_blur_points(ratios), 3),
        "5win_expected_points": round(float(pts.mean()), 3),
        "5win_p_below_10": round(float((pts < 10 - 1e-9).mean()), 3),
        "5win_p05_points": round(float(np.percentile(pts, 5)), 3),
        "5win_worst_points": round(float(pts.min()), 3),
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--fits", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    rng = np.random.default_rng(0)
    result = {"split": "val", "draws": DRAWS, "windows_per_draw": JUDGE_WINDOWS, "candidates": {}}
    for name, folder, blend_file, pin in CANDIDATES:
        cache_file = args.fits / folder / "fit" / "validation.npz"
        if not cache_file.is_file():
            raise SystemExit(f"cache not found: {cache_file}")
        cache = np.load(cache_file)
        blend = None if blend_file is None else ClimBlend.load_optional(args.fits / blend_file)
        if blend_file is not None and blend is None:
            raise SystemExit(f"blend artifact not found: {args.fits / blend_file}")
        if pin:
            blend = pin_tp(blend)
        result["candidates"][name] = row = summarise(day8_ratios(cache, blend), rng)
        print(name, json.dumps(row), flush=True)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=1) + "\n")
    return 0


if __name__ == "__main__":
    logging.getLogger("inference_adapter").setLevel(logging.ERROR)
    raise SystemExit(main())
