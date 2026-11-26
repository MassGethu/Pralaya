"""3-seed e3_rainstab ensemble with the shock-preserving blend refitted on it (docs/ENSEMBLE.md).

  python -m scripts.ensemble prepare --seeds A.pt B.pt C.pt --data NC --stats STATS --output FIT
  python -m scripts.ensemble val --rung 4 --floor 0.3 --seeds A.pt B.pt C.pt --data NC --stats STATS --output FIT
  python -m scripts.ensemble raw --seeds A.pt B.pt C.pt --split val --data NC --out RAW.json
  python -m scripts.ensemble delta --seeds A.pt B.pt C.pt --blend FIT/rung4_floor0.3.pt --split val --data NC --out D.json

`prepare`/`val` run Mass's unchanged scripts.clim_blend_experiment with the ensemble in place of the single model;
`raw` and `delta` run evaluation.evaluate unchanged with the ensemble (unblended) or the ensemble + shock-preserving
blend. The ensemble output is the mean of the seeds' own rollouts, for shocked and unshocked requests alike.
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import numpy as np

from model.forecaster import Forecaster


class EnsembleForecaster:
    """Forecaster-compatible mean of several checkpoints' rollouts."""

    def __init__(self, paths: list[str]):
        if len(paths) < 2:
            raise ValueError("an ensemble needs at least two checkpoints")
        self._members = [Forecaster(p) for p in paths]
        self.meta = self._members[0].meta
        self.model_id = "ensemble(" + ",".join(m.model_id for m in self._members) + ")"

    def simulate(self, init_states, doy_sincos, steps, perturbation=None) -> np.ndarray:
        runs = [np.asarray(m.simulate(init_states, doy_sincos, steps, perturbation), dtype=np.float64)
                for m in self._members]
        return np.mean(runs, axis=0).astype(np.float32)


def _split_seeds(argv: list[str]) -> tuple[list[str], list[str]]:
    """Pull `--seeds a b c` out of argv; return (seeds, remaining argv)."""
    if "--seeds" not in argv:
        raise SystemExit("--seeds A.pt B.pt [C.pt ...] is required")
    i = argv.index("--seeds")
    j = i + 1
    while j < len(argv) and not argv[j].startswith("--"):
        j += 1
    seeds = argv[i + 1:j]
    for s in seeds:
        if not Path(s).is_file():
            raise SystemExit(f"checkpoint not found: {s}")
    return seeds, argv[:i] + argv[j:]


def main(argv=None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if not argv:
        raise SystemExit(__doc__)
    seeds, rest = _split_seeds(argv)
    phase, rest = rest[0], rest[1:]
    factory = lambda _ckpt=None: EnsembleForecaster(seeds)  # noqa: E731 - every caller builds by name
    if phase in ("prepare", "val", "test"):
        from scripts import clim_blend_experiment as X
        X.Forecaster = factory
        sys.argv = ["clim_blend_experiment", phase, *rest]
        return X.main() or 0
    if phase == "raw":
        from scripts import clim_blend_score as R
        R.Forecaster = factory
        return R.main(rest)
    if phase == "delta":
        from scripts import blend_delta_score as B
        B.Forecaster = factory
        return B.main(rest)
    raise SystemExit(f"unknown phase {phase!r}")


if __name__ == "__main__":
    logging.getLogger("inference_adapter").setLevel(logging.ERROR)
    raise SystemExit(main())
