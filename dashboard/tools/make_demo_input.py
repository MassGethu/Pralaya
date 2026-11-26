"""Prepare a three-day dashboard input from the official kit NetCDF.

The output is a JSON file shaped like an official request body without `steps` and `perturbation`:
    {"init_states": [3][6][32][36], "doy_sincos": [sin, cos], "meta": {...}}

It must be written OUTSIDE the repository: historical weather windows are not shipped with the submission.
The dashboard loads the file through its file picker.

Usage (from any directory, with a Python that has numpy + xarray + netCDF4):
    python dashboard/tools/make_demo_input.py --nc ~/Documents/PRALAYA-data/india_climate_train.nc \
        --last-day <YYYY-MM-DD> --out ~/Documents/PRALAYA-data/demo_inputs/demo.json

    python dashboard/tools/make_demo_input.py --nc <path> --export-static dashboard/public/static/static_fields.json

`--last-day` is the LAST of the three input days. doy_sincos follows the official kit:
[sin(2*pi*doy/365), cos(2*pi*doy/365)] with doy = day of year of the last input day (1 = 1 January).
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
import xarray as xr

CHANNELS = ("t2m", "tp", "u10", "v10", "msl", "tcwv")
REPO_ROOT = Path(__file__).resolve().parents[2]


def doy_sincos(doy: int) -> list[float]:
    return [math.sin(2 * math.pi * doy / 365.0), math.cos(2 * math.pi * doy / 365.0)]


def check_grid(ds: xr.Dataset) -> None:
    lat, lon = ds["lat"].values, ds["lon"].values
    if lat.shape != (32,) or lon.shape != (36,):
        raise SystemExit(f"unexpected grid shape lat={lat.shape} lon={lon.shape}")
    if not (np.isclose(lat[0], 6.5) and np.isclose(lat[-1], 37.5) and np.isclose(lon[0], 65.5) and np.isclose(lon[-1], 100.5)):
        raise SystemExit(f"grid corners differ from the contract: lat {lat[0]}..{lat[-1]} lon {lon[0]}..{lon[-1]}")
    if tuple(str(c) for c in ds["channel"].values) != CHANNELS:
        raise SystemExit(f"channel order differs from the contract: {ds['channel'].values}")


def export_static(ds: xr.Dataset, out: Path) -> None:
    lsm = ds["static"].sel(static_channel="land_sea_mask").values.astype(float)
    oro = ds["static"].sel(static_channel="orography_m").values.astype(float)
    payload = {
        "description": "Static fields from the official kit NetCDF (variable `static`). Row 0 = 6.5N (south), col 0 = 65.5E (west).",
        "lat": [float(v) for v in ds["lat"].values],
        "lon": [float(v) for v in ds["lon"].values],
        "land_sea_mask": np.round(lsm, 3).tolist(),
        "orography_m": np.round(oro, 1).tolist(),
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"wrote static fields to {out}")


def export_window(ds: xr.Dataset, last_day: str, out: Path) -> None:
    resolved = out.expanduser().resolve()
    if REPO_ROOT in resolved.parents:
        raise SystemExit(f"refusing to write a historical weather window inside the repository: {resolved}")
    times = ds["time"].values
    idx = np.where(times == np.datetime64(last_day, "ns"))[0]
    if idx.size != 1:
        raise SystemExit(f"last day {last_day} not found in the NetCDF time axis")
    i = int(idx[0])
    if i < 2:
        raise SystemExit("need two earlier days before the last input day")
    window = ds["data"].isel(time=slice(i - 2, i + 1)).values.astype("f4")   # [3, 6, 32, 36], oldest first
    days = np.diff(times[i - 2:i + 1]).astype("timedelta64[D]").astype(int)
    if not np.all(days == 1):
        raise SystemExit("the three input days are not consecutive")
    if not np.all(np.isfinite(window)):
        raise SystemExit("window contains non-finite values")
    doy = int(ds["time"].dt.dayofyear.values[i])
    payload = {
        "init_states": window.tolist(),
        "doy_sincos": doy_sincos(doy),
        "meta": {
            "source": "official kit india_climate_train.nc (ERA5-derived, CC BY 4.0)",
            "last_input_day": str(np.datetime_as_string(times[i], unit="D")),
            "day_of_year": doy,
            "channels": list(CHANNELS),
        },
    }
    resolved.parent.mkdir(parents=True, exist_ok=True)
    resolved.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"wrote {resolved} (last input day {payload['meta']['last_input_day']}, doy {doy})")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--nc", required=True, type=Path)
    ap.add_argument("--last-day", help="last of the three input days, YYYY-MM-DD")
    ap.add_argument("--out", type=Path, help="output JSON path (outside the repo)")
    ap.add_argument("--export-static", type=Path, help="write land_sea_mask + orography JSON for the dashboard")
    a = ap.parse_args()
    ds = xr.open_dataset(a.nc.expanduser())
    check_grid(ds)
    if a.export_static:
        export_static(ds, a.export_static)
    if a.last_day:
        if not a.out:
            ap.error("--out is required with --last-day")
        export_window(ds, a.last_day, a.out)
    if not a.export_static and not a.last_day:
        ap.error("nothing to do: pass --last-day/--out and/or --export-static")
    return 0


if __name__ == "__main__":
    sys.exit(main())
