"""Write a /simulate request body for a live demo from the LOCAL training archive (output is gitignored, never shipped).

  python -m evaluation.make_demo_input --last-day 2021-07-15                       # Prime request
  python -m evaluation.make_demo_input --last-day 2021-07-15 --shock warm_ocean     # Branch request (official recipe)

Writes demo_inputs/<last-day>[_<shock>].json = {"init_states": [3,6,32,36], "doy_sincos": [s, c], "steps": 10,
"perturbation": null | [6,32,36]}; POST it to /simulate as-is. The 3 input days are last-day-2 .. last-day.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from monsoon_r1 import scoring as S

from evaluation.data import DEFAULT_NC, load_archive, sincos

ROOT = Path(__file__).resolve().parents[1]


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--last-day", required=True, help="last input day, YYYY-MM-DD within the archive")
    ap.add_argument("--shock", default=None, choices=[None, "warm_ocean", "monsoon_stall", "null"])
    ap.add_argument("--steps", type=int, default=10)
    ap.add_argument("--data", default=str(DEFAULT_NC))
    a = ap.parse_args(argv)
    arc = load_archive(a.data)
    hit = np.where(arc.dates == np.datetime64(a.last_day))[0]
    if len(hit) == 0 or hit[0] < 2:
        raise SystemExit(f"{a.last_day} not available as a last input day (archive {arc.dates[0]}..{arc.dates[-1]})")
    i = int(hit[0])
    init = arc.data[i - 2:i + 1]
    pert = None
    if a.shock:
        pert = S.make_shock(a.shock, init[-1], S.STD_DEFAULT).tolist()
    body = {"init_states": init.tolist(), "doy_sincos": sincos(arc.dates[i]).tolist(), "steps": a.steps, "perturbation": pert}
    out = ROOT / "demo_inputs" / f"{a.last_day}{'_' + a.shock if a.shock else ''}.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(body))
    print(f"wrote {out} (inputs {arc.dates[i - 2]}..{arc.dates[i]}, doy_sincos {body['doy_sincos']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
