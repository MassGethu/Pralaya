"""Per-lead, land/sea quantile mapping of rain (tp) on top of the shock-preserving blend (docs/RAIN_QM.md).

  python -m scripts.rain_qm --blend FIT/rung4_floor0.3.pt --out QM.npz

Fits on all val 2020 windows (blended, unshocked forecasts vs truth) and writes the pre-registered cross-half check
next to the artifact (QM.json). Scoring is done by scripts.blend_delta_score --rain-qm QM.npz.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from monsoon_r1 import scoring as S

from evaluation.data import DEFAULT_NC, clim_index, load_archive, sincos, window_starts
from evaluation.evaluate import LEADS, STEPS, train_climatology
from postprocess.clim_blend import ClimBlend

ROOT = Path(__file__).resolve().parents[1]
HORIZON = 10
LEVELS = np.linspace(0.0, 1.0, 101)
TP = 1
RAMP = np.arange(len(LEVELS)) * 1e-9  # makes repeated quantiles (many dry cells) strictly increasing


class RainQM:
    """Map forecast rain to observed rain quantile by quantile, per lead day and land/sea."""

    def __init__(self, pred_q: np.ndarray, obs_q: np.ndarray, land: np.ndarray):
        if pred_q.shape != (HORIZON, 2, len(LEVELS)) or obs_q.shape != pred_q.shape:
            raise ValueError("unexpected quantile table shape")
        if land.dtype != np.bool_ or not (np.isfinite(pred_q).all() and np.isfinite(obs_q).all()):
            raise ValueError("quantile tables must be finite and the land mask boolean")
        self.pred_q, self.obs_q, self.land = pred_q, obs_q, land

    @classmethod
    def load(cls, path: Path) -> "RainQM":
        with np.load(path) as pack:
            return cls(pack["pred_q"], pack["obs_q"], pack["land"])

    def save(self, path: Path) -> None:
        np.savez(path, pred_q=self.pred_q, obs_q=self.obs_q, land=self.land, levels=LEVELS)

    def apply(self, rollout: np.ndarray) -> None:
        """In place on rollout[:, TP]; leads past HORIZON stay unchanged."""
        for d in range(min(len(rollout), HORIZON)):
            rain = rollout[d, TP]
            for region, mask in ((0, ~self.land), (1, self.land)):
                rain[mask] = self._map(rain[mask], d, region)

    def _map(self, x: np.ndarray, d: int, region: int) -> np.ndarray:
        qp, qo = self.pred_q[d, region] + RAMP, self.obs_q[d, region]
        y = np.interp(x, qp, qo)
        above = x > qp[-1]
        y[above] = qo[-1] + (x[above] - qp[-1])
        return y


def fit(pred_tp: np.ndarray, true_tp: np.ndarray, land: np.ndarray) -> RainQM:
    """pred_tp, true_tp: [W, >=HORIZON, 32, 36]."""
    pred_q = np.empty((HORIZON, 2, len(LEVELS)))
    obs_q = np.empty_like(pred_q)
    for d in range(HORIZON):
        for region, mask in ((0, ~land), (1, land)):
            pred_q[d, region] = np.quantile(pred_tp[:, d][:, mask], LEVELS)
            obs_q[d, region] = np.quantile(true_tp[:, d][:, mask], LEVELS)
    return RainQM(pred_q, obs_q, land)


def collect(ckpt: str, blend: ClimBlend, data: str):
    """Blended, unshocked val forecasts plus truth, persistence and climatology, as evaluate() builds them."""
    from scripts.blend_delta_score import DeltaForecaster

    arc = load_archive(data)
    fc = DeltaForecaster(ckpt, blend)
    clim = train_climatology(arc, ROOT / "evaluation" / "results" / "clim_train.npy")
    starts = window_starts(arc.dates, "val", STEPS)
    P, T, PE, CL = [], [], [], []
    for i in starts:
        init = arc.data[i:i + 3]
        P.append(fc.simulate(init, sincos(arc.dates[i + 2]), STEPS, None))
        T.append(arc.data[i + 3:i + 3 + STEPS])
        PE.append(np.repeat(init[-1:], STEPS, axis=0))
        CL.append(np.stack([clim[clim_index(arc.dates[i + 3 + k])] for k in range(STEPS)]))
    first_target = arc.dates[starts + 3]
    land = arc.static[0] >= 0.5
    return tuple(map(np.stack, (P, T, PE, CL))), first_target, land


def forecast_points(P, T, PE, CL) -> dict:
    """RMSE + CSI proxy points exactly as evaluation.evaluate aggregates them per window."""
    ss_w, csi_w = [], []
    ks = [ld - 1 for ld in LEADS]
    for w in range(len(P)):
        per = [S.skill_vs_best_ref(P[w, k], T[w, k], PE[w, k], CL[w, k]) for k in ks]
        ss_w.append(float(np.nanmean([r["ss"] for r in per])))
        csi_w.append(S.csi_skill(S.csi(P[w, ks, TP], T[w, ks, TP]), S.csi(PE[w, ks, TP], T[w, ks, TP]),
                                 S.csi(CL[w, ks, TP], T[w, ks, TP])))
    fp = S.forecast_points(ss_w, csi_w)
    return {"rmse": fp["rmse_pts"], "csi": fp["csi_pts"], "forecast": fp["points"]}


def mapped(P: np.ndarray, qm: RainQM) -> np.ndarray:
    out = P.copy()
    for w in range(len(out)):
        qm.apply(out[w])
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ckpt", default=str(ROOT / "model" / "bundle" / "pralaya.pt"))
    ap.add_argument("--blend", type=Path, required=True)
    ap.add_argument("--data", default=str(DEFAULT_NC))
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args(argv)
    blend = ClimBlend.load_optional(a.blend)
    if blend is None:
        ap.error(f"blend artifact not found: {a.blend}")
    (P, T, PE, CL), first_target, land = collect(a.ckpt, blend, a.data)
    first_half = first_target.astype("datetime64[M]").astype(int) % 12 < 6

    halves = {}
    for name, held in (("jan_jun", first_half), ("jul_dec", ~first_half)):
        qm = fit(P[~held, :, TP], T[~held, :, TP], land)
        before = forecast_points(P[held], T[held], PE[held], CL[held])
        after = forecast_points(mapped(P[held], qm), T[held], PE[held], CL[held])
        halves[name] = {"windows": int(held.sum()), "blend": before, "blend_qm": after,
                        "pass": after["forecast"] >= before["forecast"]}
        print(name, json.dumps(halves[name]))

    qm = fit(P[:, :, TP], T[:, :, TP], land)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    qm.save(a.out)
    report = {"blend": str(a.blend), "artifact": str(a.out), "cross_half": halves,
              "G6_pass": all(h["pass"] for h in halves.values())}
    a.out.with_suffix(".json").write_text(json.dumps(report, indent=1, default=float))
    print("G6 cross-half:", "PASS" if report["G6_pass"] else "FAIL")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
