"""Apply the pre-registered a3_anomaly gates (docs/EXPERIMENTS.md, round 3) to two served val reports.

    python -m scripts.a3_gates BASE_served_val.json CANDIDATE_served_val.json

Both reports come from `python -m evaluation.evaluate --served --split val` on the same 354 windows and must
carry `uncertainty.ss_per_window_values` (per-window skill, in window order) for the paired CI.
"""
from __future__ import annotations

import json
import sys

import numpy as np

from evaluation.select import row
from evaluation.uncertainty import ci

S_MIN, SHOCK_DROP, INBAND_DROP, BLUR_FULL = 58.92, 0.02, 0.02, 10.0
SHOCKS = ("warm_ocean", "monsoon_stall")


def gates(base: dict, cand: dict) -> dict:
    rb, rc = row(base), row(cand)
    if base["first_init_day"] != cand["first_init_day"] or base["windows"] != cand["windows"]:
        raise SystemExit("reports cover different windows")
    diff = np.asarray(cand["uncertainty"]["ss_per_window_values"]) - np.asarray(base["uncertainty"]["ss_per_window_values"])
    paired = ci(diff)
    sb, sc = base["shocks"], cand["shocks"]
    shock = {f"{k}.{m}": (sc[k][m], sb[k][m]) for k in SHOCKS for m in ("propagates", "stable")}
    ab, ac = base["aggregate"], cand["aggregate"]
    out = {
        "S": {"value": rc["S"], "base": rb["S"], "pass": rc["S"] >= S_MIN},
        "paired_ci": {**paired, "pass": paired["ci95"][0] > 0},
        "shocks": {k: {"value": v, "base": b, "pass": v >= b - SHOCK_DROP} for k, (v, b) in shock.items()},
        "null_exact": {"value": bool(sc["null_exact"]), "pass": bool(sc["null_exact"])},
        "anti_blur": {"points": ac["anti_blur_points_proxy"], "in_band": ac["day8_variance_in_band_frac"],
                      "base_in_band": ab["day8_variance_in_band_frac"],
                      "pass": ac["anti_blur_points_proxy"] >= BLUR_FULL
                      and ac["day8_variance_in_band_frac"] >= ab["day8_variance_in_band_frac"] - INBAND_DROP},
        "points": rc["points"], "base_points": rb["points"],
    }
    out["shocks"]["pass"] = all(v["pass"] for v in out["shocks"].values())
    out["PASS"] = all(out[k]["pass"] for k in ("S", "paired_ci", "shocks", "null_exact", "anti_blur"))
    return out


def main(argv=None) -> int:
    a = sys.argv[1:] if argv is None else argv
    base, cand = (json.loads(open(p).read()) for p in a[:2])
    print(json.dumps(gates(base, cand), indent=1, default=float))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
