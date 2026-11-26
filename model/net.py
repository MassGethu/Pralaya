"""PRALAYA Climate Core: a compact residual CNN that maps 3 daily states to the next day.

The module is self-contained: normalisation constants and static geography live in registered buffers, so a
checkpoint carries everything inference needs. All public inputs and outputs are in PHYSICAL units
(K, mm/day, m/s, m/s, Pa, kg/m2), channel order t2m, tp, u10, v10, msl, tcwv, grid [32 lat south->north, 36 lon west->east].
"""
from __future__ import annotations

import math

import torch
from torch import nn
import torch.nn.functional as F

NC, NLAT, NLON, T_IN = 6, 32, 36, 3
TP = 1                                # precipitation channel index
DAY_ANGLE = 2.0 * math.pi / 365.0     # contract: doy_sincos = [sin(2 pi doy/365), cos(2 pi doy/365)]
LAT0 = 6.5                            # southern row centre, 1 degree spacing
SEC_PER_DAY, M_PER_DEG = 86400.0, 111_000.0


def advance_sincos(sc: torch.Tensor, days: int = 1) -> torch.Tensor:
    """Rotate [B,2] (sin, cos) of a day-of-year angle forward by `days` days."""
    a = DAY_ANGLE * days
    s, c = sc[:, 0], sc[:, 1]
    return torch.stack([s * math.cos(a) + c * math.sin(a), c * math.cos(a) - s * math.sin(a)], dim=1)


class ResBlock(nn.Module):
    def __init__(self, ch: int):
        super().__init__()
        self.c1 = nn.Conv2d(ch, ch, 3, padding=1, padding_mode="replicate")
        self.c2 = nn.Conv2d(ch, ch, 3, padding=1, padding_mode="replicate")

    def forward(self, x):
        return x + self.c2(F.gelu(self.c1(F.gelu(x))))


class ScaleBranch(nn.Module):
    """Coarse-grid path: average-pool by 2**level, 2 residual blocks, upsample back. Output conv starts at zero."""

    def __init__(self, ch: int, level: int):
        super().__init__()
        self.factor = 2 ** level
        self.blocks = nn.Sequential(ResBlock(ch), ResBlock(ch))
        self.out = nn.Conv2d(ch, ch, 1)
        nn.init.zeros_(self.out.weight)
        nn.init.zeros_(self.out.bias)

    def forward(self, h):
        z = self.blocks(F.avg_pool2d(h, self.factor, ceil_mode=True))
        return self.out(F.interpolate(z, size=h.shape[-2:], mode="bilinear", align_corners=False))


class PralayaNet(nn.Module):
    """next_state = last_state + learned residual (in normalised space), rain clamped non-negative.

    Optional experiment switches (both off by default, so older checkpoints load unchanged):
      ms_levels > 0: multi-scale branches on 1/2, 1/4, ... grids added to the body output.
      advect: wind-guided transport. The last state is moved back along its own u10/v10 for one day
        (semi-Lagrangian, a learned speed scale per channel) and the advective tendency is a further input.
    """

    def __init__(self, mean, std, static, width: int = 96, blocks: int = 5, ms_levels: int = 0, advect: bool = False):
        super().__init__()
        self.config = {"width": width, "blocks": blocks}
        if ms_levels:
            self.config["ms_levels"] = ms_levels
        if advect:
            self.config["advect"] = True
        mean = torch.as_tensor(mean, dtype=torch.float32).view(1, NC, 1, 1)
        std = torch.as_tensor(std, dtype=torch.float32).view(1, NC, 1, 1)
        static = torch.as_tensor(static, dtype=torch.float32)               # [2, 32, 36] land_sea_mask, orography_m
        lat = torch.linspace(-1, 1, NLAT).view(NLAT, 1).expand(NLAT, NLON)
        lon = torch.linspace(-1, 1, NLON).view(1, NLON).expand(NLAT, NLON)
        geo = torch.stack([static[0], static[1] / 1000.0, lat, lon])         # [4, 32, 36]
        self.register_buffer("mean", mean)
        self.register_buffer("std", std)
        self.register_buffer("static", static)
        self.register_buffer("geo", geo)
        cin = T_IN * NC + geo.shape[0] + 2
        self.stem = nn.Conv2d(cin, width, 3, padding=1, padding_mode="replicate")
        self.body = nn.Sequential(*[ResBlock(width) for _ in range(blocks)])
        self.head = nn.Conv2d(width, NC, 3, padding=1, padding_mode="replicate")
        nn.init.zeros_(self.head.weight)                                     # start exactly at persistence
        self.branches = nn.ModuleList([ScaleBranch(width, lv) for lv in range(1, ms_levels + 1)])
        if advect:
            cosl = torch.cos(torch.deg2rad(torch.linspace(LAT0, LAT0 + NLAT - 1, NLAT))).view(1, NLAT, 1)
            self.register_buffer("cos_lat", cosl)
            self.adv_speed = nn.Parameter(torch.full((NC,), 0.5))
            self.adv_stem = nn.Conv2d(NC, width, 3, padding=1, padding_mode="replicate")
            nn.init.zeros_(self.adv_stem.weight)
            nn.init.zeros_(self.adv_stem.bias)
        nn.init.zeros_(self.head.bias)

    def normalise(self, x):
        return (x - self.mean) / self.std

    def step(self, window: torch.Tensor, sc_target: torch.Tensor) -> torch.Tensor:
        """window [B,3,6,32,36] physical, sc_target [B,2] for the day being predicted -> [B,6,32,36] physical."""
        b = window.shape[0]
        xn = self.normalise(window.reshape(b * T_IN, NC, NLAT, NLON)).reshape(b, T_IN * NC, NLAT, NLON)
        cond = torch.cat([self.geo.unsqueeze(0).expand(b, -1, -1, -1),
                          sc_target.view(b, 2, 1, 1).expand(b, 2, NLAT, NLON)], dim=1)
        h0 = self.stem(torch.cat([xn, cond], dim=1))
        if hasattr(self, "adv_stem"):
            h0 = h0 + self.adv_stem(self.advect_tendency(window[:, -1], xn[:, -NC:]))
        h = self.body(h0)
        for br in self.branches:
            h = h + br(h0)
        nxt = xn[:, -NC:] + self.head(F.gelu(h))
        out = nxt * self.std + self.mean
        return torch.cat([out[:, :TP], F.relu(out[:, TP:TP + 1]), out[:, TP + 1:]], dim=1)

    def advect_tendency(self, last_phys: torch.Tensor, last_norm: torch.Tensor) -> torch.Tensor:
        """Backtrace each cell one day along the last day's 10 m wind; return advected - current (normalised)."""
        b = last_phys.shape[0]
        u, v = last_phys[:, 2], last_phys[:, 3]                                   # m/s
        dx = u * SEC_PER_DAY / (M_PER_DEG * self.cos_lat)                       # grid cells per day (1 deg cells)
        dy = v * SEC_PER_DAY / M_PER_DEG
        jj = torch.arange(NLON, device=u.device, dtype=u.dtype).view(1, 1, NLON)
        ii = torch.arange(NLAT, device=u.device, dtype=u.dtype).view(1, NLAT, 1)
        outs = []
        for c in range(NC):
            k = self.adv_speed[c]
            gx = 2 * (jj - k * dx) / (NLON - 1) - 1
            gy = 2 * (ii - k * dy) / (NLAT - 1) - 1
            grid = torch.stack([gx.expand(b, NLAT, NLON), gy.expand(b, NLAT, NLON)], dim=-1)
            outs.append(F.grid_sample(last_norm[:, c:c + 1], grid, mode="bilinear", padding_mode="border",
                                      align_corners=True))
        return torch.cat(outs, dim=1) - last_norm

    def rollout(self, init: torch.Tensor, sc_last: torch.Tensor, steps: int) -> torch.Tensor:
        """init [B,3,6,32,36] physical (oldest first), sc_last [B,2] for init[:, -1] -> [B,steps,6,32,36] physical."""
        window, sc, outs = init, sc_last, []
        for _ in range(steps):
            sc = advance_sincos(sc, 1)
            nxt = self.step(window, sc)
            outs.append(nxt)
            window = torch.cat([window[:, 1:], nxt.unsqueeze(1)], dim=1)
        return torch.stack(outs, dim=1)
