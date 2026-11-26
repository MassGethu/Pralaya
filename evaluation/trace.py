"""Failure tracing: where and when a checkpoint first goes wrong, plus per-window arrays for paired comparison.

    python -m evaluation.trace --ckpt runs/b3_roll4/best.pt --split val

Writes evaluation/results/trace_<model_id>_<split>.{json,md} and trace_<model_id>_<split>_windows.npz.

  * first failure: for every region and channel, the first lead (1..10) whose region skill
    (1 - RMSE / min(persistence, climatology)) is negative.
  * worst windows: for the 5 lowest per-window skill windows, the first lead where that window's skill turns
    negative, and at that lead the worst channel, the worst region and the cell with the largest error.
  * shock trace: for each kit shock and window, the first forecast day the response exceeds 5 std
    (the kit stability limit) and also 3 std, its channel, cell, distance from the box, and the base, shocked
    and observed values there.
  * heavy rain: per lead, CSI / frequency bias / POD at 10, 25, 50 mm/day, and high quantiles of predicted vs
    observed rain. Used to check that a rain-stability fix does not suppress real heavy rain.
  * spatial variance: variance ratio (model / truth) per lead and channel, mean over windows.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from monsoon_r1 import scoring as S
from monsoon_r1.contract import CHANNELS, LAT, LON

from evaluation import spatial
from evaluation.data import DEFAULT_NC, clim_index, load_archive, sincos, window_starts
from evaluation.evaluate import ROOT, SHOCK_BOX, grader_std, train_climatology
from model.forecaster import Forecaster

STEPS = 10
ALL_LEADS = tuple(range(1, STEPS + 1))
GRADER_LEADS = (1, 4, 8)
RAIN_THRESHOLDS = (10.0, 25.0, 50.0)
STABLE_STD, EARLY_STD = 5.0, 3.0
N_WORST = 5
RESULTS = ROOT / "evaluation" / "results"


def box_distance(box) -> np.ndarray:
    """Grid-cell distance of every cell to the nearest box cell (the kit's teleport-check distance)."""
    m = S.box_mask(box)
    ii, jj = np.indices(m.shape)
    bi, bj = np.where(m)
    return np.sqrt(((ii[..., None] - bi) ** 2 + (jj[..., None] - bj) ** 2)).min(axis=-1)


def cell(r: int, c: int) -> dict:
    return {"lat": float(LAT[r]), "lon": float(LON[c])}


def rollouts(fc: Forecaster, arc, starts, clim):
    P, T, PE, CL = [], [], [], []
    for i in starts:
        init = arc.data[i:i + 3]
        P.append(fc.simulate(init, sincos(arc.dates[i + 2]), STEPS, None))
        T.append(arc.data[i + 3:i + 3 + STEPS])
        PE.append(np.repeat(init[-1:], STEPS, axis=0))
        CL.append(np.stack([clim[clim_index(arc.dates[i + 3 + k])] for k in range(STEPS)]))
    return map(np.stack, (P, T, PE, CL))


def first_failure(regions_tab: dict) -> dict:
    out = {}
    for reg, d in regions_tab.items():
        out[reg] = {}
        for ch in CHANNELS:
            neg = [ld for ld in ALL_LEADS if d["skill"][ld][ch] < 0]
            out[reg][ch] = {"first_negative_lead": neg[0] if neg else None,
                            "skill_by_lead": [d["skill"][ld][ch] for ld in ALL_LEADS]}
    return out


def window_skill(P, T, PE, CL):
    """[W, 10, 6] kit skill per window, lead and channel; and the grader-style per-window mean over leads 1/4/8."""
    W = P.shape[0]
    sk = np.full((W, STEPS, len(CHANNELS)), np.nan, np.float32)
    for w in range(W):
        for k in range(STEPS):
            sk[w, k] = S.skill_vs_best_ref(P[w, k], T[w, k], PE[w, k], CL[w, k])["ss"]
    grader = np.nanmean(sk[:, [ld - 1 for ld in GRADER_LEADS]], axis=(1, 2))
    return sk, grader


def trace_worst(sk, grader, P, T, PE, CL, static, init_days) -> list[dict]:
    regs = {k: v for k, v in spatial.regions(static).items() if k != "all"}
    wlat = np.cos(np.deg2rad(LAT))[:, None] * np.ones((1, len(LON)))
    out = []
    for w in np.argsort(grader)[:N_WORST]:
        mean_by_lead = np.nanmean(sk[w], axis=1)
        neg = np.where(mean_by_lead < 0)[0]
        k = int(neg[0]) if len(neg) else int(np.argmin(mean_by_lead))
        c = int(np.nanargmin(sk[w, k]))
        reg_sk = {}
        for name, m in regs.items():
            ww = wlat * m
            def rm(a):
                return float(np.sqrt(((a[k, c] - T[w, k, c]) ** 2 * ww).sum() / ww.sum()))
            ref = min(rm(PE[w]), rm(CL[w]))
            reg_sk[name] = round(1 - rm(P[w]) / ref, 3) if ref > 0 else None
        worst_reg = min((v, n) for n, v in reg_sk.items() if v is not None)[1]
        err = np.abs(P[w, k, c] - T[w, k, c])
        r, col = np.unravel_index(err.argmax(), err.shape)
        out.append({"init_day": init_days[w], "grader_skill": round(float(grader[w]), 4),
                    "skill_by_lead": [round(float(x), 3) for x in mean_by_lead],
                    "first_negative_lead": k + 1 if len(neg) else None, "lead_traced": k + 1,
                    "worst_channel": CHANNELS[c], "worst_channel_skill": round(float(sk[w, k, c]), 3),
                    "region_skill": reg_sk, "worst_region": worst_reg,
                    "max_error_cell": {**cell(r, col), "pred": round(float(P[w, k, c, r, col]), 2),
                                       "obs": round(float(T[w, k, c, r, col]), 2),
                                       "persistence": round(float(PE[w, k, c, r, col]), 2)}})
    return out


def shock_trace(fc: Forecaster, arc, starts, std) -> tuple[dict, dict]:
    summ, arrays = {}, {}
    for name, box in SHOCK_BOX.items():
        dist = box_distance(box)
        recs, zmax = [], []
        for i in starts:
            init, sc = arc.data[i:i + 3], sincos(arc.dates[i + 2])
            base = fc.simulate(init, sc, STEPS, None)
            shock = fc.simulate(init, sc, STEPS, S.make_shock(name, init[-1], std))
            truth = arc.data[i + 3:i + 3 + STEPS]
            z = np.abs((shock - base) / std[None, :, None, None])
            peak = z.reshape(STEPS, -1).max(axis=1)
            zmax.append(peak)
            rec = {"init_day": str(arc.dates[i + 2]), "max_std": round(float(peak.max()), 2)}
            for thr, key in ((EARLY_STD, "first_3std"), (STABLE_STD, "first_5std")):
                hit = np.where(peak > thr)[0]
                if not len(hit):
                    rec[key] = None
                    continue
                k = int(hit[0])
                c, r, col = np.unravel_index(z[k].argmax(), z[k].shape)
                rec[key] = {"day": k + 1, "channel": CHANNELS[c], **cell(r, col), "box_dist_cells": round(float(dist[r, col]), 1),
                            "base": round(float(base[k, c, r, col]), 2), "shock": round(float(shock[k, c, r, col]), 2),
                            "obs": round(float(truth[k, c, r, col]), 2),
                            "base_tp": round(float(base[k, 1, r, col]), 2), "obs_tp": round(float(truth[k, 1, r, col]), 2)}
            recs.append(rec)
        unstable = [r for r in recs if r["first_5std"]]
        f5 = [r["first_5std"] for r in unstable]
        hot = {}
        for f in f5:
            hot[(f["lat"], f["lon"])] = hot.get((f["lat"], f["lon"]), 0) + 1
        summ[name] = {
            "windows": len(recs), "unstable": len(unstable), "stable_frac": round(1 - len(unstable) / len(recs), 4),
            "first_5std_day_counts": {d: sum(f["day"] == d for f in f5) for d in ALL_LEADS if any(f["day"] == d for f in f5)},
            "first_5std_channel_counts": {ch: sum(f["channel"] == ch for f in f5) for ch in CHANNELS if any(f["channel"] == ch for f in f5)},
            "first_5std_median_box_dist": float(np.median([f["box_dist_cells"] for f in f5])) if f5 else None,
            "first_5std_obs_tp_ge25_frac": float(np.mean([f["obs_tp"] >= 25 for f in f5])) if f5 else None,
            "first_5std_base_tp_median": float(np.median([f["base_tp"] for f in f5])) if f5 else None,
            "first_5std_shock_minus_base_median": float(np.median([f["shock"] - f["base"] for f in f5])) if f5 else None,
            "first_3std_day_counts_in_unstable": {d: sum(r["first_3std"]["day"] == d for r in unstable)
                                                  for d in ALL_LEADS if any(r["first_3std"]["day"] == d for r in unstable)},
            "hotspots": [{"lat": k[0], "lon": k[1], "windows": v} for k, v in sorted(hot.items(), key=lambda kv: -kv[1])[:5]],
            "peak_std_by_day_mean": np.mean(zmax, axis=0).round(3).tolist(),
            "peak_std_by_day_p95": np.percentile(zmax, 95, axis=0).round(3).tolist(),
            "worst": sorted(unstable, key=lambda r: -r["max_std"])[:N_WORST],
        }
        arrays[f"shock_{name}_peak_std"] = np.array(zmax, np.float32)
    return summ, arrays


def heavy_rain(P, T) -> dict:
    out = {"thresholds": {}, "quantiles": {}}
    for thr in RAIN_THRESHOLDS:
        rows = []
        for k in range(STEPS):
            p, t = P[:, k, 1] >= thr, T[:, k, 1] >= thr
            h, m, f = int((p & t).sum()), int((~p & t).sum()), int((p & ~t).sum())
            rows.append({"lead": k + 1, "obs": int(t.sum()), "pred": int(p.sum()), "csi": round(h / max(h + m + f, 1), 4),
                         "freq_bias": round(int(p.sum()) / max(int(t.sum()), 1), 3), "pod": round(h / max(h + m, 1), 4)})
        out["thresholds"][thr] = rows
    for ld in GRADER_LEADS:
        p, t = P[:, ld - 1, 1].ravel(), T[:, ld - 1, 1].ravel()
        out["quantiles"][ld] = {q: {"pred": round(float(np.percentile(p, q)), 2), "obs": round(float(np.percentile(t, q)), 2)}
                                for q in (99.0, 99.9, 100.0)}
    return out


def variance_ratio(P, T) -> dict:
    vr = np.stack([[S.variance_ratio(P[w, k], T[w, k]) for k in range(STEPS)] for w in range(P.shape[0])])  # [W,10,6]
    return {"by_lead": {ld: dict(zip(CHANNELS, np.nanmean(vr[:, ld - 1], axis=0).round(3).tolist())) for ld in ALL_LEADS},
            "day8_in_band_frac": float(((vr[:, 7] >= S.BLUR_MIN_RATIO) & (vr[:, 7] <= S.BLUR_MAX_RATIO)).mean())}, vr


def trace(ckpt: str, split: str, data_path: str) -> tuple[dict, dict]:
    arc = load_archive(data_path)
    fc = Forecaster(ckpt)
    clim = train_climatology(arc, RESULTS / "clim_train.npy")
    std = grader_std()
    starts = window_starts(arc.dates, split, STEPS)
    init_days = [str(arc.dates[i + 2]) for i in starts]
    P, T, PE, CL = rollouts(fc, arc, starts, clim)
    m = spatial.mse_maps(P, T, PE, CL, ALL_LEADS)
    regions_tab = spatial.region_table(m, arc.static, ALL_LEADS)
    sk, grader = window_skill(P, T, PE, CL)
    vr_summary, vr = variance_ratio(P, T)
    res = {"ckpt": ckpt, "model_id": fc.model_id, "split": split, "windows": len(starts),
           "first_failure": first_failure(regions_tab),
           "skill_by_lead_channel": {ld: regions_tab["all"]["skill"][ld] for ld in ALL_LEADS},
           "worst_windows": trace_worst(sk, grader, P, T, PE, CL, arc.static, init_days),
           "heavy_rain": heavy_rain(P, T), "variance_ratio": vr_summary}
    del P, T, PE, CL
    res["shock_trace"], shock_arrays = shock_trace(fc, arc, starts, std)
    arrays = {"init_days": np.array(init_days), "skill": sk, "grader_skill": grader, "variance_ratio": vr, **shock_arrays}
    return res, arrays


def md(res: dict) -> str:
    L = [f"# Failure trace: `{res['model_id']}` on {res['split']} ({res['windows']} windows)", "",
         "## First lead with negative skill (region x channel; '-' = never within 10 days)", "",
         "| region | " + " | ".join(CHANNELS) + " |", "|---|" + "---|" * len(CHANNELS)]
    for reg, d in res["first_failure"].items():
        L.append(f"| {reg} | " + " | ".join(str(d[ch]["first_negative_lead"] or "-") for ch in CHANNELS) + " |")
    L += ["", "## Skill by lead and channel (all cells)", "", "| lead | " + " | ".join(CHANNELS) + " |",
          "|---|" + "---|" * len(CHANNELS)]
    for ld, d in res["skill_by_lead_channel"].items():
        L.append(f"| {ld} | " + " | ".join(f"{d[ch]:+.3f}" for ch in CHANNELS) + " |")
    L += ["", "## Worst windows: first lead, variable and region that go wrong", "",
          "| init day | grader skill | first negative lead | worst channel (skill) | worst region | max-error cell (pred / obs / persistence) |",
          "|---|---|---|---|---|---|"]
    for w in res["worst_windows"]:
        e = w["max_error_cell"]
        L.append(f"| {w['init_day']} | {w['grader_skill']:+.3f} | {w['first_negative_lead']} | {w['worst_channel']} "
                 f"({w['worst_channel_skill']:+.2f}) | {w['worst_region']} ({w['region_skill'][w['worst_region']]:+.2f}) | "
                 f"{e['lat']}N {e['lon']}E: {e['pred']} / {e['obs']} / {e['persistence']} |")
    L += ["", "## Shock responses: when they first exceed 5 std (kit stability limit)", ""]
    for name, s in res["shock_trace"].items():
        L += [f"**{name}**: {s['unstable']}/{s['windows']} windows exceed 5 std (stable {s['stable_frac']:.1%}).",
              f"- First day > 5 std: {s['first_5std_day_counts']}; channel: {s['first_5std_channel_counts']}; "
              f"median distance from box {s['first_5std_median_box_dist']} cells.",
              f"- Same windows first exceeded 3 std on day: {s['first_3std_day_counts_in_unstable']}.",
              f"- At the first > 5 std cell: base-forecast rain median {s['first_5std_base_tp_median']} mm/day, "
              f"shock minus base median {s['first_5std_shock_minus_base_median']}, observed rain >= 25 mm/day in "
              f"{(s['first_5std_obs_tp_ge25_frac'] or 0):.0%} of cases.",
              f"- Hotspots: {', '.join(f'{h['lat']}N {h['lon']}E ({h['windows']})' for h in s['hotspots'])}.",
              f"- Mean peak response by day (std): {s['peak_std_by_day_mean']}; p95: {s['peak_std_by_day_p95']}.", ""]
    L += ["## Heavy rain (pooled cells x windows)", "", "| threshold | lead | obs | pred | CSI | freq bias | POD |",
          "|---|---|---|---|---|---|---|"]
    for thr, rows in res["heavy_rain"]["thresholds"].items():
        for r in rows:
            if r["lead"] in GRADER_LEADS:
                L.append(f"| {thr:g} | {r['lead']} | {r['obs']} | {r['pred']} | {r['csi']:.3f} | {r['freq_bias']:.2f} | {r['pod']:.3f} |")
    L += ["", "| lead | p99 pred / obs | p99.9 pred / obs | max pred / obs |", "|---|---|---|---|"]
    for ld, q in res["heavy_rain"]["quantiles"].items():
        L.append(f"| {ld} | " + " | ".join(f"{q[k]['pred']} / {q[k]['obs']}" for k in (99.0, 99.9, 100.0)) + " |")
    L += ["", "## Spatial variance ratio (model / truth; kit band 0.4-2.5)", "", "| lead | " + " | ".join(CHANNELS) + " |",
          "|---|" + "---|" * len(CHANNELS)]
    for ld in GRADER_LEADS + (10,):
        d = res["variance_ratio"]["by_lead"][ld]
        L.append(f"| {ld} | " + " | ".join(f"{d[ch]:.2f}" for ch in CHANNELS) + " |")
    L.append(f"\nDay-8 in-band fraction: {res['variance_ratio']['day8_in_band_frac']:.3f}")
    return "\n".join(L) + "\n"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ckpt", required=True)
    ap.add_argument("--split", default="val", choices=["val", "test"])
    ap.add_argument("--data", default=str(DEFAULT_NC))
    a = ap.parse_args(argv)
    res, arrays = trace(a.ckpt, a.split, a.data)
    stem = RESULTS / f"trace_{res['model_id']}_{a.split}"
    stem.with_suffix(".json").write_text(json.dumps(res, indent=1, default=float))
    np.savez_compressed(f"{stem}_windows.npz", **arrays)
    text = md(res)
    stem.with_suffix(".md").write_text(text)
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
