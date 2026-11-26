"""Local held-out benchmark using the official kit scoring functions (monsoon_r1.scoring).

  python -m evaluation.evaluate --ckpt runs/b1_onestep/best.pt --split val
  python -m evaluation.evaluate --ckpt model/bundle/pralaya.pt --split test --out evaluation/results/release_test.json

Runs the real inference path (model.Forecaster on CPU) on every 3-day window in the split whose 10 target days also
lie in the split. Persistence = last input day repeated. Climatology = training-years-only seasonal mean
(kit definition: calendar-day mean, 15-day circular smoothing). The grader's hidden windows are post-2023: these
numbers are LOCAL held-out evidence, not leaderboard scores.

Aggregation (documented local choices where the kit leaves it open):
  * skill: kit skill_vs_best_ref per (lead, channel); "pooled" = RMSE over all windows, then skill;
    "per-window" = skill on each window alone, mean over 3 leads x 6 channels, then mean over windows
    (closest to the grader's ss_by_window). Points proxy = 30 * clip(mean / 0.12, 0, 1).
  * CSI: tp > 10 mm/day; counts pooled over windows per lead; per-window CSI skill over leads 1, 4, 8 pooled.
  * anti-blur: kit variance_ratio at day 8 per window, kit anti_blur_points over windows.
  * shocks: kit make_shock + causality_checks with stats.json std (the grader's scale), on every window by default.
  * uncertainty: 95% moving-block-bootstrap CIs (evaluation/uncertainty.py), worst windows, and a "grader draw":
    the spread of the points proxy when only 5 random windows are averaged, as in the hidden test.
  * spatial: RMSE / bias / skill maps per variable and lead plus a region table (evaluation/spatial.py).
  * --doy-shift N: feed the season of (last input day + N days). Used only for the 0- vs 1-based doy sensitivity check.
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
from monsoon_r1 import scoring as S
from monsoon_r1.contract import BOX_ARABIAN_SEA, BOX_BAY_OF_BENGAL, CHANNELS

from evaluation.data import (DEFAULT_NC, clim_index, climatology, load_archive, sincos, split_mask,
                             window_starts)
from evaluation import spatial
from evaluation.uncertainty import ci, frac_ci, grader_draw
from model.forecaster import Forecaster

ROOT = Path(__file__).resolve().parents[1]
STEPS, LEADS = 10, (1, 4, 8)
KIT_STATS = ROOT.parent / "kit" / "stats.json"
SHOCK_BOX = {"warm_ocean": BOX_BAY_OF_BENGAL, "monsoon_stall": BOX_ARABIAN_SEA}


def train_climatology(arc, cache: Path) -> np.ndarray:
    if cache.is_file():
        return np.load(cache)
    m = split_mask(arc.dates, "train")
    clim = climatology(arc.data[m], arc.dates[m])
    cache.parent.mkdir(parents=True, exist_ok=True)
    np.save(cache, clim)
    return clim


def grader_std() -> np.ndarray:
    if KIT_STATS.is_file():
        return np.array(json.loads(KIT_STATS.read_text())["std"], dtype=np.float32)
    return S.STD_DEFAULT


def evaluate(ckpt: str, split: str, data_path: str, shock_stride: int = 1, stride: int = 1, doy_shift: int = 0,
             maps_png: Path | None = None) -> dict:
    t0 = time.time()
    arc = load_archive(data_path)
    fc = Forecaster(ckpt)
    clim = train_climatology(arc, ROOT / "evaluation" / "results" / "clim_train.npy")
    std = grader_std()
    starts = window_starts(arc.dates, split, STEPS, stride)
    P, T, PE, CL = [], [], [], []
    invalid, lat_ms = [], []
    for i in starts:
        init = arc.data[i:i + 3]
        t1 = time.perf_counter()
        out = fc.simulate(init, sincos(arc.dates[i + 2] + np.timedelta64(doy_shift, "D")), STEPS, None)
        lat_ms.append((time.perf_counter() - t1) * 1000)
        bad = S.validity(out, STEPS)
        if bad:
            invalid.append({"start": str(arc.dates[i]), "why": bad})
        P.append(out); T.append(arc.data[i + 3:i + 3 + STEPS])
        PE.append(np.repeat(init[-1:], STEPS, axis=0))
        CL.append(np.stack([clim[clim_index(arc.dates[i + 3 + k])] for k in range(STEPS)]))
    P, T, PE, CL = map(np.stack, (P, T, PE, CL))          # [W, 10, 6, 32, 36]

    init_days = [str(arc.dates[i + 2]) for i in starts]
    res: dict = {"ckpt": ckpt, "model_id": fc.model_id, "split": split, "windows": int(len(starts)), "doy_shift": doy_shift,
                 "first_init_day": str(arc.dates[starts[0] + 2]), "last_init_day": str(arc.dates[starts[-1] + 2]),
                 "invalid_windows": invalid, "cpu_rollout_ms_median": float(np.median(lat_ms)), "leads": {}}
    for ld in LEADS:
        k = ld - 1
        sk = S.skill_vs_best_ref(P[:, k], T[:, k], PE[:, k], CL[:, k])
        rp = S.rmse_lat(PE[:, k], T[:, k]); rc = S.rmse_lat(CL[:, k], T[:, k])
        cnt = {}
        for name, arr in (("model", P), ("persistence", PE), ("climatology", CL)):
            p, t = arr[:, k, 1] > S.RAIN_THRESH, T[:, k, 1] > S.RAIN_THRESH
            h, m, f = int((p & t).sum()), int((~p & t).sum()), int((p & ~t).sum())
            cnt[name] = {"hits": h, "misses": m, "false_alarms": f, "csi": h / max(h + m + f, 1)}
        res["leads"][ld] = {
            "rmse_model": dict(zip(CHANNELS, sk["rmse"].round(4).tolist())),
            "rmse_persistence": dict(zip(CHANNELS, rp.round(4).tolist())),
            "rmse_climatology": dict(zip(CHANNELS, rc.round(4).tolist())),
            "ss_best_ref": dict(zip(CHANNELS, sk["ss"].round(4).tolist())),
            "ss_persistence": dict(zip(CHANNELS, sk["ss_persist"].round(4).tolist())),
            "ss_climatology": dict(zip(CHANNELS, sk["ss_clim"].round(4).tolist())),
            "ss_best_ref_mean": float(np.nanmean(sk["ss"])), "ss_persistence_mean": float(np.nanmean(sk["ss_persist"])),
            "csi": cnt,
            "csi_skill": S.csi_skill(cnt["model"]["csi"], cnt["persistence"]["csi"], cnt["climatology"]["csi"]),
        }
    # per-window aggregation, closest to the grader's ss_by_window / csi_ss_by_window
    ss_w, csi_w, ratios, ss_lead_w, d4p_w = [], [], [], [], []
    for w in range(len(starts)):
        per = [S.skill_vs_best_ref(P[w, ld - 1], T[w, ld - 1], PE[w, ld - 1], CL[w, ld - 1]) for ld in LEADS]
        ss_lead_w.append([float(np.nanmean(r["ss"])) for r in per])
        d4p_w.append(float(np.nanmean(per[LEADS.index(4)]["ss_persist"])))
        ss_w.append(float(np.nanmean([r["ss"] for r in per])))
        ks = [ld - 1 for ld in LEADS]
        csi_w.append(S.csi_skill(S.csi(P[w, ks, 1], T[w, ks, 1]), S.csi(PE[w, ks, 1], T[w, ks, 1]),
                                 S.csi(CL[w, ks, 1], T[w, ks, 1])))
        ratios.append(S.variance_ratio(P[w, 7], T[w, 7]))
    fp = S.forecast_points(ss_w, csi_w)
    ratios = np.array(ratios)
    rmean = np.nanmean(ratios, axis=0)
    res["aggregate"] = {
        "ss_pooled_mean": float(np.nanmean([res["leads"][ld]["ss_best_ref_mean"] for ld in LEADS])),
        "ss_per_window_mean": fp["mean_ss"], "rmse_points_proxy": fp["rmse_pts"],
        "csi_skill_per_window_mean": fp["mean_csi_skill"], "csi_points_proxy": fp["csi_pts"],
        "day4_ss_persistence_mean": res["leads"][4]["ss_persistence_mean"],
        "beats_persistence_day4": bool(res["leads"][4]["ss_persistence_mean"] > 0),
        "day8_variance_ratio": dict(zip(CHANNELS, rmean.round(3).tolist())),
        "day8_variance_in_band_frac": float(((ratios >= S.BLUR_MIN_RATIO) & (ratios <= S.BLUR_MAX_RATIO)).mean()),
        "anti_blur_points_proxy": S.anti_blur_points(ratios),
    }
    res["uncertainty"] = uncertainty(ss_w, csi_w, ss_lead_w, d4p_w, ratios, init_days)
    m = spatial.mse_maps(P, T, PE, CL, LEADS)
    res["spatial"] = {"regions": spatial.region_table(m, arc.static, LEADS),
                      "weak_cells": spatial.weak_cells(m, arc.static, LEADS)}
    if maps_png is not None:
        spatial.plot_maps(m, LEADS, f"{fc.model_id} {split}", maps_png)
    del P, T, PE, CL
    res["shocks"] = shock_tests(fc, arc, starts[::shock_stride], std)
    res["eval_seconds"] = round(time.time() - t0, 1)
    return res


def uncertainty(ss_w, csi_w, ss_lead_w, d4p_w, ratios, init_days) -> dict:
    ss_w, csi_w, ss_lead_w, d4p_w = map(np.asarray, (ss_w, csi_w, ss_lead_w, d4p_w))
    inband = ((ratios >= S.BLUR_MIN_RATIO) & (ratios <= S.BLUR_MAX_RATIO)).mean(axis=1)

    def worst(x, n=5):
        order = np.argsort(np.where(np.isfinite(x), x, np.inf))[:n]
        return [{"init_day": init_days[j], "value": round(float(x[j]), 4)} for j in order]

    return {
        "method": "95% moving-block bootstrap (block 10 windows, 2000 resamples); min = worst window",
        "ss_per_window": ci(ss_w), "csi_skill_per_window": ci(csi_w),
        "ss_by_lead": {ld: ci(ss_lead_w[:, j]) for j, ld in enumerate(LEADS)},
        "day4_ss_persistence": ci(d4p_w), "day4_beats_persistence_frac": frac_ci(d4p_w > 0),
        "day8_in_band_frac": ci(inband),
        "grader_draw_forecast_points": grader_draw(lambda a, b: S.forecast_points(a, b)["points"], ss_w, csi_w),
        "worst_windows": {"ss_per_window": worst(ss_w), "csi_skill": worst(csi_w),
                          "day8_ss": worst(ss_lead_w[:, LEADS.index(8)]), "day4_ss_persistence": worst(d4p_w)},
    }


def shock_tests(fc: Forecaster, arc, starts, std) -> dict:
    out = {"windows": int(len(starts)), "null_exact": True, "null_ok": True}
    per = {name: [] for name in SHOCK_BOX}
    for i in starts:
        init, sc = arc.data[i:i + 3], sincos(arc.dates[i + 2])
        base = fc.simulate(init, sc, STEPS, None)
        zero = fc.simulate(init, sc, STEPS, np.zeros((6, 32, 36), np.float32))
        out["null_exact"] &= bool(np.array_equal(base, zero))
        out["null_ok"] &= S.null_consistent(base, zero, std)
        for name, box in SHOCK_BOX.items():
            d = S.make_shock(name, init[-1], std)
            shock = fc.simulate(init, sc, STEPS, d)
            r = S.causality_checks(base, shock, box, std)
            z = np.abs((shock - base) / std[None, :, None, None])
            r["max_abs_std"] = float(z.max())
            r["day_peak_resp_std"] = [round(float(z[k].max()), 3) for k in range(STEPS)]
            r["init_day"] = str(arc.dates[i + 2])
            r["worst_channel"] = CHANNELS[int(np.unravel_index(z.argmax(), z.shape)[1])]
            per[name].append(r)
    for name, rs in per.items():
        def frac(key):
            return float(np.mean([bool(r[key]) for r in rs]))
        out[name] = {"nonzero": frac("nonzero"), "localized": frac("localized"), "propagates": frac("propagates"),
                     "stable": frac("stable"), "no_teleport": frac("no_teleport"),
                     "near_frac_day1_mean": float(np.mean([r["near_frac_day1"] for r in rs])),
                     "near_frac_day1_min": float(np.min([r["near_frac_day1"] for r in rs])),
                     "far_frac_max": float(np.max([r["far_frac_max"] for r in rs])),
                     "max_abs_std": float(np.max([r["max_abs_std"] for r in rs])),
                     "peak_resp_std_by_day_mean": np.mean([r["day_peak_resp_std"] for r in rs], axis=0).round(3).tolist(),
                     "stable_ci": frac_ci([bool(r["stable"]) for r in rs]),
                     "propagates_ci": frac_ci([bool(r["propagates"]) for r in rs]),
                     "unstable_by_channel": {ch: int(sum((not r["stable"]) and r["worst_channel"] == ch for r in rs))
                                             for ch in CHANNELS},
                     "worst": sorted(({"init_day": r["init_day"], "max_abs_std": round(r["max_abs_std"], 2),
                                       "channel": r["worst_channel"]} for r in rs),
                                     key=lambda d: -d["max_abs_std"])[:5]}
    cpts = [S.causality_points([per["warm_ocean"][j], per["monsoon_stall"][j]], out["null_ok"]) for j in range(len(starts))]
    out["causality_points_proxy_mean"] = float(np.mean(cpts))
    out["causality_points_ci"] = ci(cpts)
    return out


def summary(res: dict) -> str:
    a, L = res["aggregate"], res["leads"]
    lines = [f"## {res['model_id']} on {res['split']} ({res['windows']} windows, init {res['first_init_day']}..{res['last_init_day']})",
             "", "| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |", "|---|---|---|---|---|"]
    for ld in LEADS:
        c = L[ld]["csi"]
        lines.append(f"| {ld} | {L[ld]['ss_best_ref_mean']:+.3f} | {L[ld]['ss_persistence_mean']:+.3f} | "
                     f"{c['model']['csi']:.3f} / {c['persistence']['csi']:.3f} / {c['climatology']['csi']:.3f} | {L[ld]['csi_skill']:+.3f} |")
    lines += ["", "Day-4 per channel (RMSE model / persistence / climatology):"]
    for ch in CHANNELS:
        lines.append(f"- {ch}: {L[4]['rmse_model'][ch]:.4g} / {L[4]['rmse_persistence'][ch]:.4g} / {L[4]['rmse_climatology'][ch]:.4g}"
                     f"  (SS best {L[4]['ss_best_ref'][ch]:+.3f}, vs pers {L[4]['ss_persistence'][ch]:+.3f})")
    s = res["shocks"]
    lines += ["", f"Aggregate: SS per-window {a['ss_per_window_mean']:+.4f} (proxy {a['rmse_points_proxy']:.1f}/30), "
              f"CSI skill {a['csi_skill_per_window_mean']:+.4f} (proxy {a['csi_points_proxy']:.1f}/15), "
              f"anti-blur proxy {a['anti_blur_points_proxy']:.1f}/10 (in-band {a['day8_variance_in_band_frac']:.0%}), "
              f"day-4 beats persistence: {a['beats_persistence_day4']}",
              f"Day-8 variance ratio: {a['day8_variance_ratio']}",
              f"Invalid windows: {len(res['invalid_windows'])}; CPU 10-step rollout median {res['cpu_rollout_ms_median']:.0f} ms",
              f"Shocks ({s['windows']} windows): null exact={s['null_exact']} ok={s['null_ok']}; causality proxy "
              f"{s['causality_points_proxy_mean']:.1f}/15"]
    for name in SHOCK_BOX:
        r = s[name]
        lines.append(f"- {name}: nonzero {r['nonzero']:.0%}, localized {r['localized']:.0%} (day-1 near frac mean "
                     f"{r['near_frac_day1_mean']:.2f}, min {r['near_frac_day1_min']:.2f}), propagates {r['propagates']:.0%}, "
                     f"stable {r['stable']:.0%} (max {r['max_abs_std']:.2f} std), far frac max {r['far_frac_max']:.3f}")
    return "\n".join(lines + uncertainty_lines(res) + spatial_lines(res))


def _ci(d: dict, fmt: str = "+.3f") -> str:
    return f"{d['mean']:{fmt}} [{d['ci95'][0]:{fmt}}, {d['ci95'][1]:{fmt}}], worst {d['min']:{fmt}}"


def uncertainty_lines(res: dict) -> list[str]:
    u, s = res["uncertainty"], res["shocks"]
    g = u["grader_draw_forecast_points"]
    out = ["", "### Uncertainty (mean [95% block-bootstrap CI], worst window)",
           f"- per-window skill: {_ci(u['ss_per_window'])}",
           *[f"- skill day {ld}: {_ci(u['ss_by_lead'][ld])}" for ld in LEADS],
           f"- CSI skill per window: {_ci(u['csi_skill_per_window'])}",
           f"- day-4 skill vs persistence: {_ci(u['day4_ss_persistence'])}; windows beating persistence "
           f"{u['day4_beats_persistence_frac']['frac']:.0%} [{u['day4_beats_persistence_frac']['ci95'][0]:.0%}, "
           f"{u['day4_beats_persistence_frac']['ci95'][1]:.0%}]",
           f"- day-8 in-band fraction: {_ci(u['day8_in_band_frac'], '.2f')}",
           f"- causality proxy per window: {_ci(s['causality_points_ci'], '.1f')}",
           f"- grader-like draw (5 random windows), forecast points /45: p05 {g['p05']:.1f}, median {g['p50']:.1f}, "
           f"p95 {g['p95']:.1f}"]
    for name in SHOCK_BOX:
        r = s[name]
        out.append(f"- {name}: stable {r['stable_ci']['frac']:.0%} [{r['stable_ci']['ci95'][0]:.0%}, "
                   f"{r['stable_ci']['ci95'][1]:.0%}]; unstable by channel {r['unstable_by_channel']}; worst "
                   + ", ".join(f"{w['init_day']} {w['max_abs_std']} std ({w['channel']})" for w in r["worst"][:3]))
    out.append("- worst windows (per-window skill): "
               + ", ".join(f"{w['init_day']} {w['value']:+.3f}" for w in u["worst_windows"]["ss_per_window"]))
    out.append("- worst windows (day-8 skill): "
               + ", ".join(f"{w['init_day']} {w['value']:+.3f}" for w in u["worst_windows"]["day8_ss"]))
    return out


def spatial_lines(res: dict) -> list[str]:
    reg, weak = res["spatial"]["regions"], res["spatial"]["weak_cells"]
    out = ["", "### Skill by region (1 - RMSE / min(persistence, climatology))", "",
           "| region | cells | lead | " + " | ".join(CHANNELS) + " |", "|---|---|---|" + "---|" * len(CHANNELS)]
    for name, r in reg.items():
        for ld in (4, 8):
            out.append(f"| {name} | {r['cells']} | {ld} | " + " | ".join(f"{r['skill'][ld][ch]:+.3f}" for ch in CHANNELS) + " |")
    out += ["", "### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)"]
    for ld in (4, 8):
        for ch in CHANNELS:
            w = weak[f"{ld}/{ch}"]
            out.append(f"- day {ld} {ch}: {w['neg_skill_frac']:.0%} of cells below 0; "
                       + "; ".join(f"({c['lat']}, {c['lon']}) {c['skill']:+.2f}, bias {c['bias']:+.3g}"
                                   f"{' land' if c['land'] else ' sea'} {c['oro_m']} m" for c in w["worst"][:3]))
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ckpt", required=True)
    ap.add_argument("--split", default="val", choices=["train", "val", "test"])
    ap.add_argument("--data", default=str(DEFAULT_NC))
    ap.add_argument("--stride", type=int, default=1)
    ap.add_argument("--shock-stride", type=int, default=1, help="1 = shock every window (no sampling)")
    ap.add_argument("--doy-shift", type=int, default=0)
    ap.add_argument("--maps", action="store_true", help="write RMSE/bias/skill PNGs to evaluation/results/maps/")
    ap.add_argument("--out", default=None)
    a = ap.parse_args(argv)
    tag = Path(a.ckpt).parent.name if Path(a.ckpt).parent.name != "bundle" else "bundle"
    maps = ROOT / "evaluation" / "results" / "maps" / f"{tag}_{a.split}" if a.maps else None
    res = evaluate(a.ckpt, a.split, a.data, a.shock_stride, a.stride, a.doy_shift, maps)
    out = Path(a.out) if a.out else ROOT / "evaluation" / "results" / f"{res['model_id']}_{a.split}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(res, indent=1, default=float))
    md = summary(res)
    out.with_suffix(".md").write_text(md + "\n")
    print(md)
    print(f"\nwrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
