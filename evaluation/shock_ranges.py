"""Bounded, physically interpretable shock ranges for inverse stress tests and scenario ensembles.

    python -m evaluation.shock_ranges [--ckpt model/bundle/pralaya.pt] [--split val]

Two shock families in the dashboard's ShockSpec format (box in degrees + channel components):
  * bob_temp: Bay of Bengal box (kit), t2m add dT, tcwv percent = MOIST_PCT_PER_K * dT
  * as_wind:  Arabian Sea box (kit), u10 and v10 percent change
For every magnitude on a grid that extends past the plausible range, over all val windows:
  * trust: share of windows whose response stays within the kit's 5 std stability limit, and validity
  * impact (JJAS windows, days 1-7, land cells of each impact region, cos-lat weights, as dashboard/src/impact.ts):
    cumulative rain, heavy-rain share (>= 10 mm/day), dry days (< 2.5 mm/day), mean t2m
Inverse stress test (thresholds fixed here, before running): for each JJAS window whose base forecast does not
already cross a threshold, the smallest tested magnitude that crosses it, and whether it is plausible and trusted.
Writes evaluation/results/shock_ranges.{json,md}.
"""
from __future__ import annotations

import argparse
import json

import numpy as np
from monsoon_r1 import scoring as S
from monsoon_r1.contract import BOX_ARABIAN_SEA, BOX_BAY_OF_BENGAL, LAT, LON

from evaluation.data import DEFAULT_NC, load_archive, sincos, window_starts
from evaluation.evaluate import ROOT, grader_std
from model.forecaster import DEFAULT_CKPT, Forecaster

STEPS, DAYS = 10, 7                     # forecast length; impact window = days 1..7 (dashboard default)
DRY, HEAVY = 2.5, 10.0                  # mm/day, dashboard defaults
MOIST_PCT_PER_K = 5.0                   # kit warm_ocean ratio (+15 % tcwv for +3 K); below Clausius-Clapeyron ~7 %/K
TRUST_MIN = 0.95                        # share of windows that must stay within the 5 std limit
JJAS = (6, 7, 8, 9)
RESULTS = ROOT / "evaluation" / "results"

FAMILIES = {
    "bob_temp": {
        "label": "Bay of Bengal temperature (t2m add, tcwv +5 %/K)", "box_deg": [8, 20, 82, 94], "unit": "K",
        "grid": [-3, -2, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5],
        "plausible": [-2.0, 3.0],
        "why": "Bay of Bengal marine heatwaves reach about +1 to +3 K; cool anomalies after cyclones are about -1 to -2 K. "
               "+3 K is the kit's own warm_ocean shock. 4-5 K are outside the plausible range and tested only to "
               "find where the model stops being trustworthy.",
    },
    "as_wind": {
        "label": "Arabian Sea 10 m wind (u10, v10 percent)", "box_deg": [8, 20, 65, 75], "unit": "%",
        "grid": [-60, -50, -40, -30, -20, -10, 10, 20, 30, 40],
        "plausible": [-50.0, 30.0],
        "why": "Monsoon breaks weaken the low-level jet over the Arabian Sea by up to about half; active spells "
               "strengthen it by about a third. -40 % is the kit's monsoon_stall shock.",
    },
}
IMPACT_REGIONS = {                      # degrees, cell centres inside, land (lsm >= 0.5) only
    "central_india": [18, 26, 74, 84],  # dashboard default impact box
    "odisha_coast": [17, 23, 82, 88],
    "west_coast": [8, 20, 72, 77],
}


def box_mask_deg(lat0, lat1, lon0, lon1) -> np.ndarray:
    return ((LAT >= lat0) & (LAT <= lat1))[:, None] & ((LON >= lon0) & (LON <= lon1))[None, :]


def perturbation(family: str, mag: float, last: np.ndarray) -> np.ndarray:
    d = np.zeros((6, 32, 36), np.float32)
    m = box_mask_deg(*FAMILIES[family]["box_deg"])
    if family == "bob_temp":
        d[0][m] = mag
        d[5][m] = MOIST_PCT_PER_K * mag / 100.0 * last[5][m]
    else:
        d[2][m] = mag / 100.0 * last[2][m]
        d[3][m] = mag / 100.0 * last[3][m]
    return d


def indicators(roll: np.ndarray, cells: np.ndarray, wts: np.ndarray) -> dict:
    tp = roll[:DAYS, 1][:, cells]                                    # [days, n]
    daily = (tp * wts).sum(axis=1) / wts.sum()
    return {"cum_rain": float(daily.sum()), "heavy_share": float((tp >= HEAVY).mean()),
            "dry_days": int((daily < DRY).sum()), "mean_t2m": float(((roll[:DAYS, 0][:, cells] * wts).sum(axis=1) / wts.sum()).mean())}


def thresholds(obs_cum: dict) -> dict:
    """Fixed before running. Each is a function (base, shocked) -> crossed?"""
    p90 = obs_cum["odisha_coast"]
    return {
        "odisha_wet_week": {"dir": 1, "metric": "cum_rain", "region": "odisha_coast", "text": f"coastal Odisha 7-day rain >= {p90:.0f} mm "
                            "(observed JJAS 2020 90th percentile of 7-day totals)",
                            "base_ok": lambda b: b["cum_rain"] < p90, "crossed": lambda b, s: s["cum_rain"] >= p90},
        "central_india_deficit": {"dir": -1, "metric": "cum_rain", "region": "central_india", "text": "central India 7-day rain at least 50 % below the base forecast",
                                  "base_ok": lambda b: b["cum_rain"] >= 5.0,
                                  "crossed": lambda b, s: s["cum_rain"] <= 0.5 * b["cum_rain"]},
        "west_coast_heavy": {"dir": 1, "metric": "heavy_share", "region": "west_coast", "text": "west coast heavy-rain share (>= 10 mm/day) up by >= 20 points",
                             "base_ok": lambda b: b["heavy_share"] <= 0.8,
                             "crossed": lambda b, s: s["heavy_share"] - b["heavy_share"] >= 0.20},
        "central_india_heat": {"dir": 1, "metric": "mean_t2m", "region": "central_india", "text": "central India 7-day mean t2m >= 1 K above the base forecast",
                               "base_ok": lambda b: True, "crossed": lambda b, s: s["mean_t2m"] - b["mean_t2m"] >= 1.0},
    }


def run(ckpt: str, split: str, data_path: str) -> dict:
    arc = load_archive(data_path)
    fc = Forecaster(ckpt)
    std = grader_std()
    starts = window_starts(arc.dates, split, STEPS)
    land = arc.static[0] >= 0.5
    wlat = np.cos(np.deg2rad(LAT))[:, None] * np.ones((1, len(LON)))
    regs = {}
    for name, b in IMPACT_REGIONS.items():
        m = box_mask_deg(*b) & land
        regs[name] = (m.ravel(), wlat.ravel()[m.ravel()])
    months = arc.dates.astype("datetime64[M]").astype(int) % 12 + 1
    jjas = [j for j, i in enumerate(starts) if months[i + 2] in JJAS]

    obs_cum = {}
    for name, (cells, w) in regs.items():
        tot = [indicators(arc.data[i + 3:i + 3 + STEPS].reshape(STEPS, 6, -1), cells, w)["cum_rain"] for i in np.array(starts)[jjas]]
        obs_cum[name] = float(np.percentile(tot, 90))
    thr = thresholds(obs_cum)

    recs = []                                                          # per window
    for j, i in enumerate(starts):
        init, sc = arc.data[i:i + 3], sincos(arc.dates[i + 2])
        base = fc.simulate(init, sc, STEPS, None)
        rec = {"init_day": str(arc.dates[i + 2]), "jjas": j in jjas,
               "base": {r: indicators(base.reshape(STEPS, 6, -1), *regs[r]) for r in regs}, "shocks": {}}
        for fam, f in FAMILIES.items():
            for mag in f["grid"]:
                out = fc.simulate(init, sc, STEPS, perturbation(fam, mag, init[-1]))
                z = np.abs((out - base) / std[None, :, None, None]).max()
                rec["shocks"][(fam, mag)] = {"max_std": float(z), "valid": not S.validity(out, STEPS),
                                             **{r: indicators(out.reshape(STEPS, 6, -1), *regs[r]) for r in regs}}
        recs.append(rec)

    fams = {}
    for fam, f in FAMILIES.items():
        rows = []
        for mag in f["grid"]:
            s = [r["shocks"][(fam, mag)] for r in recs]
            sj = [recs[j]["shocks"][(fam, mag)] for j in jjas]
            bj = [recs[j]["base"] for j in jjas]
            row = {"mag": mag, "plausible": f["plausible"][0] <= mag <= f["plausible"][1],
                   "stable_frac": float(np.mean([x["max_std"] <= S.STABLE_MAX_STD for x in s])),
                   "valid_frac": float(np.mean([x["valid"] for x in s])),
                   "max_std_p95": float(np.percentile([x["max_std"] for x in s], 95))}
            for r in regs:
                d = np.array([x[r]["cum_rain"] - b[r]["cum_rain"] for x, b in zip(sj, bj)])
                dt = np.array([x[r]["mean_t2m"] - b[r]["mean_t2m"] for x, b in zip(sj, bj)])
                row[r] = {"d_cum_rain_median": float(np.median(d)), "d_cum_rain_p10": float(np.percentile(d, 10)),
                          "d_cum_rain_p90": float(np.percentile(d, 90)), "d_t2m_median": float(np.median(dt))}
            row["trusted"] = row["stable_frac"] >= TRUST_MIN and row["valid_frac"] == 1.0
            rows.append(row)
        trusted = [r["mag"] for r in rows if r["trusted"]]
        ok = {r["mag"]: r["trusted"] for r in rows}
        lo_p, hi_p = f["plausible"]
        hi = 0.0
        for m in sorted(x for x in ok if x > 0):              # contiguous from zero: stop at the first bad magnitude
            if m > hi_p or not ok[m]:
                break
            hi = m
        lo = 0.0
        for m in sorted((x for x in ok if x < 0), reverse=True):
            if m < lo_p or not ok[m]:
                break
            lo = m
        fams[fam] = {**{k: v for k, v in f.items() if k != "grid"}, "rows": rows,
                     "trusted_mags": [m for m in ok if ok[m]], "recommended_range": [lo, hi]}

    inverse = {}
    for tid, t in thr.items():
        reg, per = t["region"], []
        for j in jjas:
            r = recs[j]
            b = r["base"][reg]
            if not t["base_ok"](b):
                continue
            best = None
            for fam, f in FAMILIES.items():
                for mag in sorted(f["grid"], key=abs):                    # smallest crossing magnitude per family
                    s = r["shocks"][(fam, mag)]
                    if t["crossed"](b, s[reg]):
                        cand = {"family": fam, "mag": mag, "plausible": f["plausible"][0] <= mag <= f["plausible"][1],
                                "stable_this_window": s["max_std"] <= S.STABLE_MAX_STD,
                                "trusted_mag": next(x["trusted"] for x in fams[fam]["rows"] if x["mag"] == mag),
                                "base": round(b[t["metric"]], 3), "shocked": round(s[reg][t["metric"]], 3)}
                        rank = (not (cand["plausible"] and cand["trusted_mag"] and cand["stable_this_window"]), abs(mag) / max(abs(x) for x in f["grid"]))
                        if best is None or rank < best[0]:
                            best = (rank, cand)
                        break
            # closest approach: the most extreme value any tested shock reached in the threshold's direction
            vals = [(t["dir"] * r["shocks"][(fam, mag)][reg][t["metric"]], fam, mag)
                    for fam, f in FAMILIES.items() for mag in f["grid"]]
            v, fam_c, mag_c = max(vals)
            per.append({"init_day": r["init_day"], "base": round(b[t["metric"]], 3), "crossing": best[1] if best else None,
                        "closest": {"family": fam_c, "mag": mag_c, "value": round(t["dir"] * v, 3)}})
        ok = [p for p in per if p["crossing"] and p["crossing"]["plausible"] and p["crossing"]["trusted_mag"]
              and p["crossing"]["stable_this_window"]]
        any_cross = [p for p in per if p["crossing"]]
        inverse[tid] = {"text": t["text"], "eligible_windows": len(per), "crossed_plausible_trusted": len(ok),
                        "crossed_any_tested": len(any_cross),
                        "windows": per,
                        "example": max(ok, key=lambda p: t["dir"] * (p["crossing"]["shocked"] - p["crossing"]["base"])) if ok else None,
                        "no_shock_qualifies_example": max((p for p in per if not p["crossing"]),
                                                          key=lambda p: t["dir"] * (p["closest"]["value"] - p["base"]), default=None)}
    return {"ckpt": ckpt, "model_id": fc.model_id, "split": split, "windows": len(starts), "jjas_windows": len(jjas),
            "impact_days": DAYS, "regions_deg": IMPACT_REGIONS, "obs_jjas_p90_7day_rain": obs_cum,
            "families": fams, "inverse": inverse}


def md(res: dict) -> str:
    L = [f"# Shock ranges for stress tests and scenario ensembles (`{res['model_id']}`, {res['split']} 2020)", "",
         f"{res['windows']} windows for trust; {res['jjas_windows']} JJAS windows for impacts (days 1-{res['impact_days']}, "
         "land cells, cos-lat weights, same definitions as the dashboard). "
         f"Trusted = >= {TRUST_MIN:.0%} of windows within the kit's 5 std limit and all outputs valid.", ""]
    for fam, f in res["families"].items():
        L += [f"## {f['label']}", "", f"Box {f['box_deg']} (lat0, lat1, lon0, lon1). {f['why']}", "",
              f"**Recommended range: {f['recommended_range'][0]:g} to {f['recommended_range'][1]:g} {f['unit']}** "
              f"(physically plausible {f['plausible'][0]:g} to {f['plausible'][1]:g}; model trusted at {f['trusted_mags']}).", "",
              "| magnitude | plausible | stable | valid | p95 max std | central India Δ7-day rain mm, median [p10, p90] | "
              "Odisha coast Δ rain | west coast Δ rain | central India Δt2m K |", "|---|---|---|---|---|---|---|---|---|"]
        for r in f["rows"]:
            def dr(reg):
                x = r[reg]
                return f"{x['d_cum_rain_median']:+.1f} [{x['d_cum_rain_p10']:+.1f}, {x['d_cum_rain_p90']:+.1f}]"
            L.append(f"| {r['mag']:g} {f['unit']} | {'yes' if r['plausible'] else 'no'} | {r['stable_frac']:.1%} | "
                     f"{r['valid_frac']:.0%} | {r['max_std_p95']:.2f} | {dr('central_india')} | {dr('odisha_coast')} | "
                     f"{dr('west_coast')} | {r['central_india']['d_t2m_median']:+.2f} |")
        L.append("")
    L += ["## Inverse stress tests (thresholds fixed before running)", "",
          "| threshold | eligible JJAS windows | crossed by a plausible, trusted shock | crossed by any tested shock | "
          "largest-margin plausible, trusted crossing (example) | no tested shock qualifies: closest approach |", "|---|---|---|---|---|---|"]
    for tid, t in res["inverse"].items():
        e, n = t["example"], t["no_shock_qualifies_example"]
        etxt = (f"{e['init_day']}: {e['crossing']['family']} {e['crossing']['mag']:g} ({e['crossing']['base']} -> "
                f"{e['crossing']['shocked']})") if e else "none"
        ntxt = (f"{n['init_day']}: base {n['base']}, closest {n['closest']['value']} at {n['closest']['family']} "
                f"{n['closest']['mag']:g}") if n else "none"
        L.append(f"| {t['text']} | {t['eligible_windows']} | {t['crossed_plausible_trusted']} | {t['crossed_any_tested']} | "
                 f"{etxt} | {ntxt} |")
    return "\n".join(L) + "\n"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ckpt", default=str(DEFAULT_CKPT))
    ap.add_argument("--split", default="val", choices=["val", "test"])
    ap.add_argument("--data", default=str(DEFAULT_NC))
    a = ap.parse_args(argv)
    res = run(a.ckpt, a.split, a.data)
    (RESULTS / "shock_ranges.json").write_text(json.dumps(res, indent=1, default=float))
    text = md(res)
    (RESULTS / "shock_ranges.md").write_text(text)
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
