"""Apply docs/SELECTION.md to the val results, and build the all-candidate report for any split.

    python -m evaluation.select --split val     # gates, ranking, chosen candidate -> results/selection_val.{json,md}
    python -m evaluation.select --split test    # same table on test, no re-selection -> results/report_test.{json,md}

Reads evaluation/results/<candidate>_<split>.json written by evaluation.evaluate.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

RESULTS = Path(__file__).resolve().parent / "results"
RECIPES = {"b1 one-step": ["b1_onestep", "b1_onestep_s1", "b1_onestep_s2"],
           "b3 K=4 rollout": ["b3_roll4", "b3_roll4_s1", "b3_roll4_s2"]}
CANDIDATES = [c for cs in RECIPES.values() for c in cs]
SHOCKS = ("warm_ocean", "monsoon_stall")
TIE_POINTS, TIE_P05 = 1.0, 0.5
LOCALIZED_MIN, CPU_MS_MAX = 0.95, 1000.0


def row(res: dict) -> dict:
    a, u, s = res["aggregate"], res["uncertainty"], res["shocks"]
    pts = {"rmse": a["rmse_points_proxy"], "csi": a["csi_points_proxy"], "blur": a["anti_blur_points_proxy"],
           "causal": s["causality_points_proxy_mean"]}
    d4 = u["day4_ss_persistence"]
    gates = {"no_invalid": len(res["invalid_windows"]) == 0,
             "day4_beats_persistence_ci": d4["mean"] > 0 and d4["ci95"][0] > 0,
             "null_exact": bool(s["null_exact"]),
             "localized": all(s[k]["localized"] >= LOCALIZED_MIN for k in SHOCKS),
             "cpu_fast": res["cpu_rollout_ms_median"] < CPU_MS_MAX}
    return {"id": res["model_id"], "windows": res["windows"], "shock_windows": s["windows"], "points": pts,
            "S": sum(pts.values()), "gates": gates, "eligible": all(gates.values()),
            "grader_p05": u["grader_draw_forecast_points"]["p05"],
            "grader_p50": u["grader_draw_forecast_points"]["p50"],
            "stable_mean": float(np.mean([s[k]["stable"] for k in SHOCKS])),
            "ss": u["ss_per_window"], "ss_lead": u["ss_by_lead"], "csi": u["csi_skill_per_window"], "d4p": d4,
            "stable": {k: s[k]["stable_ci"] for k in SHOCKS}, "max_std": {k: s[k]["max_abs_std"] for k in SHOCKS},
            "invalid": len(res["invalid_windows"])}


def choose(rows: list[dict]) -> tuple[str, str]:
    el = [r for r in rows if r["eligible"]]
    if not el:
        raise SystemExit("no candidate passes the gates; nothing selected")
    el.sort(key=lambda r: -r["S"])
    top = [r for r in el if el[0]["S"] - r["S"] <= TIE_POINTS]
    if len(top) == 1:
        return top[0]["id"], f"highest S ({top[0]['S']:.2f})"
    top.sort(key=lambda r: -r["grader_p05"])
    tied = [r for r in top if top[0]["grader_p05"] - r["grader_p05"] <= TIE_P05]
    if len(tied) == 1:
        return tied[0]["id"], (f"S within {TIE_POINTS} of best ({', '.join(r['id'] for r in top)}); "
                               f"highest 5-window p05 ({tied[0]['grader_p05']:.2f})")
    tied.sort(key=lambda r: -r["stable_mean"])
    return tied[0]["id"], (f"S and p05 tied ({', '.join(r['id'] for r in tied)}); highest shock-stable fraction "
                           f"({tied[0]['stable_mean']:.3f})")


def fmt_ci(d: dict, f: str = "+.3f") -> str:
    return f"{d['mean']:{f}} [{d['ci95'][0]:{f}}, {d['ci95'][1]:{f}}] (worst {d['min']:{f}})"


def spread(rows: dict[str, dict]) -> list[str]:
    out = ["", "### Spread across seeds (mean ± sd over 3 seeds)", "",
           "| recipe | S /70 | per-window skill | day-8 skill | CSI skill | warm_ocean stable | monsoon_stall stable |",
           "|---|---|---|---|---|---|---|"]
    for name, ids in RECIPES.items():
        rs = [rows[i] for i in ids if i in rows]
        if not rs:
            continue
        def ms(vals, f):
            v = np.array(vals, dtype=float)
            return f"{v.mean():{f}} ± {v.std(ddof=1) if len(v) > 1 else float('nan'):.3f}"
        out.append(f"| {name} (n={len(rs)}) | {ms([r['S'] for r in rs], '.2f')} | {ms([r['ss']['mean'] for r in rs], '+.4f')} | "
                   f"{ms([r['ss_lead']['8']['mean'] for r in rs], '+.3f')} | {ms([r['csi']['mean'] for r in rs], '+.4f')} | "
                   f"{ms([r['stable']['warm_ocean']['frac'] for r in rs], '.3f')} | "
                   f"{ms([r['stable']['monsoon_stall']['frac'] for r in rs], '.3f')} |")
    return out


def table(rows: list[dict], split: str) -> list[str]:
    out = [f"| candidate | windows / shocked | gates | S /70 (rmse+csi+blur+causal) | 5-win p05 / p50 /45 | "
           "per-window skill | day-1 / 4 / 8 skill | day-4 vs persistence | CSI skill | stable warm / stall | max std warm / stall |",
           "|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in rows:
        p, g = r["points"], r["gates"]
        failed = [k for k, v in g.items() if not v]
        out.append(
            f"| {r['id']} | {r['windows']} / {r['shock_windows']} | {'pass' if not failed else 'FAIL ' + ','.join(failed)} | "
            f"{r['S']:.2f} ({p['rmse']:.1f}+{p['csi']:.1f}+{p['blur']:.1f}+{p['causal']:.1f}) | "
            f"{r['grader_p05']:.1f} / {r['grader_p50']:.1f} | {fmt_ci(r['ss'], '+.4f')} | "
            f"{r['ss_lead']['1']['mean']:+.3f} / {r['ss_lead']['4']['mean']:+.3f} / {r['ss_lead']['8']['mean']:+.3f} | "
            f"{fmt_ci(r['d4p'])} | {fmt_ci(r['csi'], '+.4f')} | "
            f"{r['stable']['warm_ocean']['frac']:.0%} [{r['stable']['warm_ocean']['ci95'][0]:.0%}, {r['stable']['warm_ocean']['ci95'][1]:.0%}] / "
            f"{r['stable']['monsoon_stall']['frac']:.0%} [{r['stable']['monsoon_stall']['ci95'][0]:.0%}, {r['stable']['monsoon_stall']['ci95'][1]:.0%}] | "
            f"{r['max_std']['warm_ocean']:.1f} / {r['max_std']['monsoon_stall']:.1f} |")
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--split", default="val", choices=["val", "test"])
    a = ap.parse_args(argv)
    missing = [c for c in CANDIDATES if not (RESULTS / f"{c}_{a.split}.json").is_file()]
    if missing:
        raise SystemExit(f"missing results for {missing}; every candidate must be evaluated (no dropping)")
    rows = [row(json.loads((RESULTS / f"{c}_{a.split}.json").read_text())) for c in CANDIDATES]
    by_id = {r["id"]: r for r in rows}
    lines = [f"## All candidates on {a.split}", "",
             "Values are mean [95% block-bootstrap CI] (worst window). S and points are local proxies of the kit formulas, "
             "not leaderboard scores.", ""] + table(rows, a.split) + spread(by_id)
    out = {"split": a.split, "rows": rows}
    if a.split == "val":
        chosen, why = choose(rows)
        out.update({"selected": chosen, "reason": why})
        lines += ["", f"**Selected (val only, docs/SELECTION.md): `{chosen}`**: {why}."]
        name = "selection_val"
    else:
        sel = json.loads((RESULTS / "selection_val.json").read_text())["selected"]
        out["selected_on_val"] = sel
        lines += ["", f"Shipped checkpoint (chosen on val, not changed after test): `{sel}`."]
        name = "report_test"
    (RESULTS / f"{name}.json").write_text(json.dumps(out, indent=1, default=float))
    (RESULTS / f"{name}.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
