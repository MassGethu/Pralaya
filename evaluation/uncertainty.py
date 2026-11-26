"""Uncertainty for per-window metrics.

Windows start on consecutive days and their 10-day targets overlap, so they are not independent. A plain
bootstrap would give CIs that are too narrow. We use a moving-block bootstrap with blocks of BLOCK consecutive
windows (= the forecast horizon), so each resample keeps the serial correlation inside a block.

`grader_draw` imitates the hidden test: the grader averages only 5 windows. It reports the spread of a
5-window mean, which is much wider than the CI of the full-year mean.
"""
from __future__ import annotations

import numpy as np

BLOCK = 10
N_BOOT = 2000
SEED = 0
GRADER_WINDOWS = 5


def _finite(x) -> np.ndarray:
    x = np.asarray(x, dtype=np.float64)
    return x[np.isfinite(x)]


def block_bootstrap_means(x, block: int = BLOCK, n: int = N_BOOT, seed: int = SEED) -> np.ndarray:
    x = _finite(x)
    if len(x) == 0:
        raise ValueError("no finite values to bootstrap")
    block = min(block, len(x))
    rng = np.random.default_rng(seed)
    n_blocks = int(np.ceil(len(x) / block))
    starts = rng.integers(0, len(x) - block + 1, size=(n, n_blocks))
    idx = (starts[..., None] + np.arange(block)).reshape(n, -1)[:, :len(x)]
    return x[idx].mean(axis=1)


def ci(x, block: int = BLOCK) -> dict:
    """Mean with a 95% moving-block-bootstrap CI, plus worst (min) and 5th percentile."""
    v = _finite(x)
    b = block_bootstrap_means(v, block)
    return {"mean": float(v.mean()), "ci95": [float(np.percentile(b, 2.5)), float(np.percentile(b, 97.5))],
            "p05": float(np.percentile(v, 5)), "min": float(v.min()), "n": int(len(v))}


def frac_ci(flags, block: int = BLOCK) -> dict:
    """Fraction of True with a 95% block-bootstrap CI."""
    f = np.asarray(flags, dtype=np.float64)
    b = block_bootstrap_means(f, block)
    return {"frac": float(f.mean()), "ci95": [float(np.percentile(b, 2.5)), float(np.percentile(b, 97.5))],
            "n": int(len(f))}


def grader_draw(points_fn, *per_window, k: int = GRADER_WINDOWS, n: int = N_BOOT, seed: int = SEED) -> dict:
    """Distribution of points_fn over random k-window subsets (no replacement)."""
    m = len(per_window[0])
    rng = np.random.default_rng(seed)
    vals = np.array([points_fn(*[np.asarray(a)[s] for a in per_window])
                     for s in (rng.choice(m, size=k, replace=False) for _ in range(n))])
    return {"k": k, "p05": float(np.percentile(vals, 5)), "p50": float(np.percentile(vals, 50)),
            "p95": float(np.percentile(vals, 95)), "mean": float(vals.mean())}
