"""Audit of india_climate_train.nc: structure, units, coverage, value ranges and static fields.

    python -m evaluation.audit            # writes docs/DATA_AUDIT.md

Every check is printed PASS / FAIL with the measured value. The physical bounds are loose sanity limits for
South Asia, not kit rules; the kit validity rules (rain >= 0, 233.15 <= t2m <= 333.15) are checked separately.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import xarray as xr

from evaluation.data import DEFAULT_NC, SPLITS, channel_stats, split_mask, years

ROOT = Path(__file__).resolve().parents[1]
KIT_STATS = ROOT.parent / "kit" / "stats.json"
EXPECTED_SHA = "f37bdb"          # prefix from kit SHA256SUMS.txt
CHANNELS = ["t2m", "tp", "u10", "v10", "msl", "tcwv"]
UNITS = "t2m K | tp mm/day | u10 m/s | v10 m/s | msl Pa | tcwv kg/m2"
BOUNDS = {"t2m": (200.0, 330.0), "tp": (0.0, 1000.0), "u10": (-50.0, 50.0), "v10": (-50.0, 50.0),
          "msl": (90000.0, 108000.0), "tcwv": (0.0, 100.0)}
KIT_T2M = (233.15, 333.15)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def audit(nc: Path) -> list[str]:
    checks: list[tuple[str, bool, str]] = []

    def check(name: str, ok: bool, value) -> None:
        checks.append((name, bool(ok), str(value)))

    digest = sha256(nc)
    check("file sha256 matches kit SHA256SUMS", digest.startswith(EXPECTED_SHA), f"{digest[:12]}…, {nc.stat().st_size:,} bytes")
    with xr.open_dataset(nc) as ds:
        da, st = ds["data"], ds["static"]
        check("data dims", da.dims == ("time", "channel", "lat", "lon"), da.dims)
        check("data shape", da.shape[1:] == (6, 32, 36), da.shape)
        check("data dtype float32, no packing", da.dtype == np.float32 and da.encoding.get("scale_factor") is None,
              f"{da.dtype}, scale_factor={da.encoding.get('scale_factor')}")
        check("channel order", list(ds["channel"].values) == CHANNELS, [str(c) for c in ds["channel"].values])
        check("units attribute", da.attrs.get("units") == UNITS, da.attrs.get("units"))
        lat, lon = ds["lat"].values, ds["lon"].values
        check("lat 6.5..37.5 step 1, south -> north", np.allclose(lat, np.arange(6.5, 38.0)), f"{lat[0]}..{lat[-1]}, n={len(lat)}")
        check("lon 65.5..100.5 step 1, west -> east", np.allclose(lon, np.arange(65.5, 101.0)), f"{lon[0]}..{lon[-1]}, n={len(lon)}")
        check("static channels", list(ds["static_channel"].values) == ["land_sea_mask", "orography_m"],
              [str(c) for c in ds["static_channel"].values])
        t = ds["time"].values.astype("datetime64[D]")
        x, s = da.values.astype(np.float32), st.values.astype(np.float32)

    gaps = np.diff(t).astype(int)
    check("time daily, no gaps or duplicates", (gaps == 1).all(), f"{t[0]}..{t[-1]}, {len(t)} days, max step {gaps.max()} d")
    y = years(t)
    per_year = {int(k): int(v) for k, v in zip(*np.unique(y, return_counts=True))}
    check("every year complete (365/366 days)",
          all(n == (366 if (k % 4 == 0 and (k % 100 or k % 400 == 0)) else 365) for k, n in per_year.items()), per_year)
    check("no NaN/Inf in data", np.isfinite(x).all(), int((~np.isfinite(x)).sum()))
    check("no NaN/Inf in static", np.isfinite(s).all(), int((~np.isfinite(s)).sum()))

    rows = ["| channel | unit | min | p01 | mean | p99 | max | sanity bounds | ok |", "|---|---|---|---|---|---|---|---|---|"]
    unit = dict(zip(CHANNELS, ["K", "mm/day", "m/s", "m/s", "Pa", "kg/m2"]))
    for c, ch in enumerate(CHANNELS):
        v = x[:, c]
        lo, hi = BOUNDS[ch]
        ok = lo <= v.min() and v.max() <= hi
        check(f"{ch} within sanity bounds {lo}..{hi}", ok, f"{v.min():.4g}..{v.max():.4g}")
        rows.append(f"| {ch} | {unit[ch]} | {v.min():.4g} | {np.percentile(v, 1):.4g} | {v.mean():.4g} | "
                    f"{np.percentile(v, 99):.4g} | {v.max():.4g} | {lo:g}..{hi:g} | {'yes' if ok else 'NO'} |")
    check("tp >= 0 everywhere (kit rule)", x[:, 1].min() >= 0, f"min {x[:, 1].min():.4g}")
    t2 = x[:, 0]
    check("observed t2m inside kit validity 233.15..333.15", KIT_T2M[0] <= t2.min() and t2.max() <= KIT_T2M[1],
          f"{t2.min():.2f}..{t2.max():.2f} K")
    check("tp zero share (dry cells) plausible", 0.05 < (x[:, 1] == 0).mean() < 0.9, f"{(x[:, 1] == 0).mean():.1%} exactly 0")
    check("t2m seasonal cycle (north JJA warmer than DJF)",
          x[np.isin(t.astype("datetime64[M]").astype(int) % 12 + 1, [6, 7, 8]), 0, 20:].mean()
          > x[np.isin(t.astype("datetime64[M]").astype(int) % 12 + 1, [12, 1, 2]), 0, 20:].mean(), "rows 20+ (>= 26.5N)")

    lsm, oro = s
    check("land_sea_mask fraction in 0..1", 0 <= lsm.min() and lsm.max() <= 1, f"{lsm.min():.3g}..{lsm.max():.3g}")
    check("orography_m plausible (max near Himalaya 4-6 km)", -50 < oro.min() and 4000 < oro.max() < 6500,
          f"{oro.min():.3g}..{oro.max():.4g} m")
    r, c = np.unravel_index(oro.argmax(), oro.shape)
    check("orography max is in the north (Tibet/Himalaya)", lat[r] > 27, f"max at lat {lat[r]}, lon {lon[c]}")
    check("Bay of Bengal (15N, 88E) is sea", lsm[np.argmin(abs(lat - 15.5)), np.argmin(abs(lon - 88.5))] < 0.5,
          f"lsm {lsm[np.argmin(abs(lat - 15.5)), np.argmin(abs(lon - 88.5))]:.2f}")
    check("central India (22N, 78E) is land", lsm[np.argmin(abs(lat - 22.5)), np.argmin(abs(lon - 78.5))] > 0.5,
          f"lsm {lsm[np.argmin(abs(lat - 22.5)), np.argmin(abs(lon - 78.5))]:.2f}")
    check("land share plausible", 0.4 < (lsm >= 0.5).mean() < 0.8, f"{(lsm >= 0.5).mean():.1%} of cells land")

    if KIT_STATS.is_file():
        ks = json.loads(KIT_STATS.read_text())
        fm, fs = channel_stats(x)
        check("stats.json = full-archive (2005-2021) mean/std",
              np.allclose(fm, ks["mean"], rtol=1e-4) and np.allclose(fs, ks["std"], rtol=1e-3),
              "so our model uses its own train-only stats instead")
    split_rows = ["| split | years | days |", "|---|---|---|"]
    for name, (y0, y1) in SPLITS.items():
        split_rows.append(f"| {name} | {y0}-{y1} | {int(split_mask(t, name).sum())} |")

    n_fail = sum(not ok for _, ok, _ in checks)
    lines = ["# Data audit: india_climate_train.nc", "",
             "Generated by `python -m evaluation.audit`. Organizer data (ERA5 via WeatherBench 2, see ATTRIBUTION.md).", "",
             f"**{len(checks) - n_fail}/{len(checks)} checks pass.**", "",
             "| check | result | measured |", "|---|---|---|"]
    lines += [f"| {n} | {'PASS' if ok else '**FAIL**'} | {v} |" for n, ok, v in checks]
    lines += ["", "## Value ranges (all 6209 days, all cells)", ""] + rows
    lines += ["", "## Static fields", "",
              f"- land_sea_mask: fraction 0..1 (1 = land), {(lsm >= 0.5).mean():.1%} of cells land, "
              f"{((lsm > 0.01) & (lsm < 0.99)).mean():.1%} coastal (fractional).",
              f"- orography_m: {oro.min():.3g}..{oro.max():.4g} m, {(oro >= 2000).mean():.1%} of cells at or above 2000 m.",
              "- Both are bundled inside the checkpoint (`static` buffer); nothing is read from the archive at inference.",
              "", "## Splits used by training and evaluation", ""] + split_rows
    return lines


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", default=str(DEFAULT_NC))
    ap.add_argument("--out", default=str(ROOT / "docs" / "DATA_AUDIT.md"))
    a = ap.parse_args(argv)
    lines = audit(Path(a.data))
    Path(a.out).write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
