"""Spatial error maps (RMSE, bias, skill) per variable and lead, a region table and a list of weak cells.

Skill per cell or region is 1 - RMSE_model / min(RMSE_persistence, RMSE_climatology), the kit definition
applied locally. Regions come from the static fields and the kit's shock boxes.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from monsoon_r1.contract import BOX_ARABIAN_SEA, BOX_BAY_OF_BENGAL, CHANNELS, LAT, LON
from monsoon_r1.scoring import box_mask

UNITS = {"t2m": "K", "tp": "mm/day", "u10": "m/s", "v10": "m/s", "msl": "Pa", "tcwv": "kg/m2"}
WEAK_CELLS = 5


def regions(static: np.ndarray) -> dict[str, np.ndarray]:
    lsm, oro = static[0], static[1]
    return {
        "all": np.ones_like(lsm, dtype=bool),
        "ocean (lsm<0.5)": lsm < 0.5,
        "land below 1000 m": (lsm >= 0.5) & (oro < 1000),
        "highlands >=2000 m": oro >= 2000,
        "Bay of Bengal box": box_mask(BOX_BAY_OF_BENGAL),
        "Arabian Sea box": box_mask(BOX_ARABIAN_SEA),
        "north of 28N": np.broadcast_to((LAT >= 28)[:, None], lsm.shape),
    }


def mse_maps(P, T, PE, CL, leads) -> dict[str, np.ndarray]:
    """Arrays [W, steps, 6, 32, 36] -> per-cell maps [L, 6, 32, 36] (mean over windows)."""
    ks = [ld - 1 for ld in leads]
    err = P[:, ks] - T[:, ks]
    return {"mse": (err ** 2).mean(axis=0), "bias": err.mean(axis=0),
            "mse_pers": ((PE[:, ks] - T[:, ks]) ** 2).mean(axis=0),
            "mse_clim": ((CL[:, ks] - T[:, ks]) ** 2).mean(axis=0)}


def skill(mse, mse_pers, mse_clim) -> np.ndarray:
    ref = np.minimum(mse_pers, mse_clim)
    with np.errstate(divide="ignore", invalid="ignore"):
        return 1.0 - np.sqrt(mse) / np.sqrt(ref)


def region_table(m: dict, static: np.ndarray, leads) -> dict:
    w = np.cos(np.deg2rad(LAT))[:, None] * np.ones((1, len(LON)))
    out = {}
    for name, mask in regions(static).items():
        ww = w * mask
        def reg(a):                                    # [L, 6, 32, 36] -> [L, 6], lat-weighted mean
            return (a * ww).sum(axis=(-2, -1)) / ww.sum()
        mse, mp, mc = reg(m["mse"]), reg(m["mse_pers"]), reg(m["mse_clim"])
        sk = skill(mse, mp, mc)
        out[name] = {"cells": int(mask.sum()),
                     "skill": {ld: dict(zip(CHANNELS, sk[i].round(3).tolist())) for i, ld in enumerate(leads)},
                     "rmse": {ld: dict(zip(CHANNELS, np.sqrt(mse[i]).round(4).tolist())) for i, ld in enumerate(leads)},
                     "bias": {ld: dict(zip(CHANNELS, reg(m["bias"])[i].round(4).tolist())) for i, ld in enumerate(leads)}}
    return out


def weak_cells(m: dict, static: np.ndarray, leads, k: int = WEAK_CELLS) -> dict:
    """Per lead and channel: cells where skill < 0 (fraction) and the k worst cells with location."""
    sk = skill(m["mse"], m["mse_pers"], m["mse_clim"])
    out = {}
    for i, ld in enumerate(leads):
        for c, ch in enumerate(CHANNELS):
            s = sk[i, c]
            order = np.argsort(np.where(np.isfinite(s), s, np.inf), axis=None)[:k]
            worst = []
            for flat in order:
                r, col = np.unravel_index(flat, s.shape)
                worst.append({"lat": float(LAT[r]), "lon": float(LON[col]), "skill": round(float(s[r, col]), 3),
                              "bias": round(float(m["bias"][i, c, r, col]), 4),
                              "land": bool(static[0, r, col] >= 0.5), "oro_m": round(float(static[1, r, col]))})
            out[f"{ld}/{ch}"] = {"neg_skill_frac": float((s < 0).mean()), "worst": worst}
    return out


def plot_maps(m: dict, leads, title: str, path: Path) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    sk = skill(m["mse"], m["mse_pers"], m["mse_clim"])
    ext = [LON[0] - 0.5, LON[-1] + 0.5, LAT[0] - 0.5, LAT[-1] + 0.5]
    for kind in ("rmse", "bias", "skill"):
        fig, axes = plt.subplots(len(leads), len(CHANNELS), figsize=(3.1 * len(CHANNELS), 2.9 * len(leads)),
                                 constrained_layout=True)
        for i, ld in enumerate(leads):
            for c, ch in enumerate(CHANNELS):
                ax = axes[i, c]
                if kind == "rmse":
                    a, cmap, lim = np.sqrt(m["mse"][i, c]), "viridis", None
                elif kind == "bias":
                    a, cmap = m["bias"][i, c], "RdBu_r"
                    v = float(np.nanpercentile(np.abs(a), 99)) or 1.0
                    lim = (-v, v)
                else:
                    a, cmap, lim = sk[i, c], "RdBu", (-0.5, 0.5)
                im = ax.imshow(a, origin="lower", extent=ext, cmap=cmap,
                               vmin=None if lim is None else lim[0], vmax=None if lim is None else lim[1])
                ax.set_title(f"{ch} day {ld}" + ("" if kind == "skill" else f" [{UNITS[ch]}]"), fontsize=9)
                ax.tick_params(labelsize=6)
                fig.colorbar(im, ax=ax, shrink=0.8)
        fig.suptitle(f"{title}: {kind}" + (" = 1 - RMSE / min(persistence, climatology)" if kind == "skill" else ""))
        path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(path.with_name(f"{path.stem}_{kind}.png"), dpi=90)
        plt.close(fig)
