"""Training/evaluation data access. NOT imported by the inference server (it reads the training archive).

Split (chronological, by calendar year; every input+target window lies entirely inside one split):
  train 2005-2019 | val 2020 (candidate selection) | test 2021 (untouched until final reporting)
"""
from __future__ import annotations

import datetime as dt
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import xarray as xr

SPLITS = {"train": (2005, 2019), "val": (2020, 2020), "test": (2021, 2021)}
DEFAULT_NC = Path(__file__).resolve().parents[2] / "kit" / "india_climate_train.nc"
DAY_ANGLE = 2.0 * np.pi / 365.0


@dataclass(frozen=True)
class Archive:
    data: np.ndarray      # [N, 6, 32, 36] float32 physical units
    dates: np.ndarray     # [N] datetime64[D]
    static: np.ndarray    # [2, 32, 36] land_sea_mask, orography_m
    lat: np.ndarray
    lon: np.ndarray


def load_archive(path: str | Path = DEFAULT_NC) -> Archive:
    path = Path(path)
    if not path.is_file():
        raise FileNotFoundError(f"dataset not found: {path} (pass --data)")
    with xr.open_dataset(path) as ds:
        if list(ds["channel"].values) != ["t2m", "tp", "u10", "v10", "msl", "tcwv"]:
            raise ValueError(f"unexpected channel order {list(ds['channel'].values)}")
        if ds["data"].dims != ("time", "channel", "lat", "lon"):
            raise ValueError(f"unexpected dims {ds['data'].dims}")
        lat, lon = ds["lat"].values, ds["lon"].values
        if not (lat[0] < lat[-1] and lon[0] < lon[-1]):
            raise ValueError("expected lat south->north and lon west->east")
        arc = Archive(ds["data"].values.astype(np.float32), ds["time"].values.astype("datetime64[D]"),
                      ds["static"].values.astype(np.float32), lat, lon)
    if not np.isfinite(arc.data).all():
        raise ValueError("dataset contains NaN/Inf")
    if (np.diff(arc.dates).astype(int) != 1).any():
        raise ValueError("dataset has missing days")
    return arc


def years(dates: np.ndarray) -> np.ndarray:
    return dates.astype("datetime64[Y]").astype(int) + 1970


def doy(d: np.datetime64) -> int:
    """1-based day of year (Jan 1 = 1), the conventional tm_yday."""
    return int((d - d.astype("datetime64[Y]")).astype(int)) + 1


def sincos(d: np.datetime64) -> np.ndarray:
    a = DAY_ANGLE * doy(d)
    return np.array([np.sin(a), np.cos(a)], dtype=np.float32)


def window_starts(dates: np.ndarray, split: str, horizon: int, stride: int = 1) -> np.ndarray:
    """Indices i such that days i..i+2 (inputs) and i+3..i+2+horizon (targets) all fall in `split`."""
    y0, y1 = SPLITS[split]
    y = years(dates)
    inside = (y >= y0) & (y <= y1)
    n = len(dates) - (2 + horizon)
    ok = [i for i in range(0, n) if inside[i] and inside[i + 2 + horizon]]
    return np.array(ok[::stride], dtype=np.int64)


def channel_stats(data: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    d = data.astype(np.float64)
    return d.mean(axis=(0, 2, 3)).astype(np.float32), d.std(axis=(0, 2, 3)).astype(np.float32)


def split_mask(dates: np.ndarray, split: str) -> np.ndarray:
    y0, y1 = SPLITS[split]
    y = years(dates)
    return (y >= y0) & (y <= y1)


def climatology(data: np.ndarray, dates: np.ndarray, smooth_days: int = 15) -> np.ndarray:
    """Training-only seasonal climatology [366,6,32,36], same definition as monsoon_r1.stats.climatology."""
    from monsoon_r1.stats import climatology as kit_clim
    ymd = np.array([int(str(d).replace("-", "")) for d in dates])
    return kit_clim(data, ymd, smooth_days)


def clim_index(d: np.datetime64) -> int:
    """Index into a 366-slot climatology (Feb 29 has its own slot), same as monsoon_r1.stats._doy_index."""
    py = d.astype(dt.date)
    return (dt.date(2000, py.month, py.day) - dt.date(2000, 1, 1)).days
