"""Compare experiment candidates with b3_roll4 on the same val windows and apply docs/EXPERIMENTS.md rules 1-4.

    python -m evaluation.compare --base b3_roll4 c0_cont4 b4_roll8 e1_ocean ...

Needs evaluation/results/<id>_val.json (evaluation.evaluate) and trace_<id>_val.{json,_windows.npz}
(evaluation.trace) for the base and every candidate. Writes results/compare_val.{json,md}.
Rule 5 (seed replication) is checked separately once seeds exist.
"""
from __future__ import annotations

import argparse
import json

import numpy as np
from monsoon_r1.contract import CHANNELS

from evaluation.select import RESULTS, row
from evaluation.uncertainty import ci

S_MARGIN, STABLE_DROP, HEAVY_REL_DROP, INBAND_DROP = 1.0, 0.02, 0.10, 0.02
HEAVY_THR, HEAVY_LEAD = 25.0, 1


def load(cid: str, split: str = "val") -> dict:
    ev = json.loads((RESULTS / f"{cid}_{split}.json").read_text())
    tr = json.loads((RESULTS / f"trace_{cid}_{split}.json").read_text())
    npz = np.load(RESULTS / f"trace_{cid}_{split}_windows.npz")
    return {"id": cid, "row": row(ev), "ev": ev, "tr": tr, "win": {k: npz[k] for k in npz.files}}


def heavy(tr: dict, thr: float = HEAVY_THR, lead: int = HEAVY_LEAD) -> dict:
    rows = tr["heavy_rain"]["thresholds"][str(thr) if str(thr) in tr["heavy_rain"]["thresholds"] else thr]
    return next(r for r in rows if r["lead"] == lead)


def summarise(c: dict) -> dict:
    r, tr, ev = c["row"], c["tr"], c["ev"]
    sh = tr["shock_trace"]
    return {
        "S": r["S"], "points": r["points"], "gates": r["gates"], "eligible": r["eligible"],
        "ss": r["ss"]["mean"], "ss_min": r["ss"]["min"], "d4p": r["d4p"]["mean"], "csi": r["csi"]["mean"],
        "lead_mean": {ld: float(np.mean(list(d.values()))) for ld, d in tr["skill_by_lead_channel"].items()},
        "lead_channel": tr["skill_by_lead_channel"],
        "heavy25_d1": heavy(tr), "heavy50_d1": heavy(tr, 50.0),
        "inband8": ev["aggregate"]["day8_variance_in_band_frac"], "vr8": ev["aggregate"]["day8_variance_ratio"],
        "stable": {k: r["stable"][k]["frac"] for k in r["stable"]},
        "propagates": {k: ev["shocks"][k]["propagates"] for k in ("warm_ocean", "monsoon_stall")},
        "first5": {k: sh[k]["first_5std_day_counts"] for k in sh},
        "worst": [(w["init_day"], w["grader_skill"]) for w in tr["worst_windows"][:3]],
    }


def verdict(base: dict, cand: dict, diff_ci: dict) -> dict:
    b, c = summarise(base), summarise(cand)
    hb, hc = b["heavy25_d1"]["csi"], c["heavy25_d1"]["csi"]
    rules = {
        "1_gates": c["eligible"],
        "2_S_margin": c["S"] >= b["S"] + S_MARGIN,
        "3_paired_ci_above_0": diff_ci["ci95"][0] > 0,
        "4a_stable_not_lower": all(c["stable"][k] >= b["stable"][k] - STABLE_DROP for k in b["stable"]),
        "4b_heavy_rain_kept": hc >= hb * (1 - HEAVY_REL_DROP),
        "4c_inband_kept": c["inband8"] >= b["inband8"] - INBAND_DROP,
    }
    return {"rules": rules, "passes_1_to_4": all(rules.values())}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base", default="b3_roll4")
    ap.add_argument("candidates", nargs="+")
    a = ap.parse_args(argv)
    base = load(a.base)
    bs = summarise(base)
    out = {"base": a.base, "base_summary": bs, "candidates": {}}
    L = [f"# Candidates vs `{a.base}` on val 2020 ({base['ev']['windows']} windows, every window shocked)", "",
         "Paired difference = candidate minus base per window (grader-style skill), mean [95% block-bootstrap CI].",
         "Promotion rules 1-4 from docs/EXPERIMENTS.md; rule 5 (3 seeds) is checked only for candidates passing 1-4.", "",
         "| id | S /70 (ΔS) | per-window skill | paired Δ skill [CI] | worst window | day-4 vs pers | CSI skill | "
         "heavy 25 mm d1 CSI / bias | day-8 in band | stable warm / stall | first >5σ day (warm) | rules 1-4 |",
         "|---|---|---|---|---|---|---|---|---|---|---|---|"]

    def line(cid, s, dci, v):
        h = s["heavy25_d1"]
        dtxt = "–" if dci is None else f"{dci['mean']:+.4f} [{dci['ci95'][0]:+.4f}, {dci['ci95'][1]:+.4f}]"
        vtxt = "base" if v is None else ("**PASS**" if v["passes_1_to_4"] else
                                         "fail: " + ", ".join(k for k, ok in v["rules"].items() if not ok))
        return (f"| {cid} | {s['S']:.2f} ({s['S'] - bs['S']:+.2f}) | {s['ss']:+.4f} | {dtxt} | {s['ss_min']:+.3f} | "
                f"{s['d4p']:+.3f} | {s['csi']:+.4f} | {h['csi']:.3f} / {h['freq_bias']:.2f} | {s['inband8']:.3f} | "
                f"{s['stable']['warm_ocean']:.1%} / {s['stable']['monsoon_stall']:.1%} | {s['first5']['warm_ocean']} | {vtxt} |")

    L.append(line(a.base, bs, None, None))
    for cid in a.candidates:
        c = load(cid)
        if list(c["win"]["init_days"]) != list(base["win"]["init_days"]):
            raise SystemExit(f"{cid}: windows differ from {a.base}; comparison must use the same windows")
        dci = ci(c["win"]["grader_skill"] - base["win"]["grader_skill"])
        v = verdict(base, c, dci)
        cs = summarise(c)
        out["candidates"][cid] = {"summary": cs, "paired_diff": dci, "verdict": v}
        L.append(line(cid, cs, dci, v))
    L += ["", "## Skill by lead (mean over channels)", "", "| id | " + " | ".join(f"d{ld}" for ld in range(1, 11)) + " |",
          "|---|" + "---|" * 10]
    for cid, s in [(a.base, bs)] + [(k, v["summary"]) for k, v in out["candidates"].items()]:
        L.append(f"| {cid} | " + " | ".join(f"{s['lead_mean'][str(ld)]:+.3f}" for ld in range(1, 11)) + " |")
    L += ["", "## Skill by channel at days 1 / 4 / 8", "", "| id | " + " | ".join(CHANNELS) + " |", "|---|" + "---|" * 6]
    for cid, s in [(a.base, bs)] + [(k, v["summary"]) for k, v in out["candidates"].items()]:
        L.append(f"| {cid} | " + " | ".join(" / ".join(f"{s['lead_channel'][str(ld)][ch]:+.2f}" for ld in (1, 4, 8))
                                             for ch in CHANNELS) + " |")
    L += ["", "## Day-8 spatial variance ratio (kit band 0.4-2.5)", "", "| id | " + " | ".join(CHANNELS) + " |",
          "|---|" + "---|" * 6]
    for cid, s in [(a.base, bs)] + [(k, v["summary"]) for k, v in out["candidates"].items()]:
        L.append(f"| {cid} | " + " | ".join(f"{s['vr8'][ch]:.2f}" for ch in CHANNELS) + " |")
    L += ["", "## Worst 3 windows (init day, grader-style skill)", ""]
    for cid, s in [(a.base, bs)] + [(k, v["summary"]) for k, v in out["candidates"].items()]:
        L.append(f"- {cid}: " + "; ".join(f"{d} {v:+.3f}" for d, v in s["worst"]))
    (RESULTS / "compare_val.json").write_text(json.dumps(out, indent=1, default=float))
    (RESULTS / "compare_val.md").write_text("\n".join(L) + "\n")
    print("\n".join(L))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
