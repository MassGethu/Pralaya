"""Inference adapter: load a PRALAYA checkpoint on CPU and run the official simulate-endpoint semantics.

serve.py (Mass) parses JSON and applies the shock, then calls model.inference.load_cpu; the numerics live here:
  * perturbation: the release path (load_cpu) passes None; the optional argument is for local evaluation only
  * admissibility: rain in the shocked last state is clipped at 0 before the model sees it
  * normalisation, rollout and seasonal advance: inside PralayaNet
No dates, archives or network access are used here.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import torch

from .net import NC, NLAT, NLON, T_IN, TP, PralayaNet

BUNDLE_DIR = Path(__file__).resolve().parent / "bundle"
DEFAULT_CKPT = BUNDLE_DIR / "pralaya.pt"


def load_model(path: str | Path = DEFAULT_CKPT) -> tuple[PralayaNet, dict]:
    ck = torch.load(Path(path), map_location="cpu", weights_only=True)
    net = PralayaNet(ck["mean"], ck["std"], ck["static"], **ck["config"])
    net.load_state_dict(ck["state_dict"])
    net.eval()
    return net, ck.get("meta", {})


ENSEMBLE_FILE = "ensemble.json"


def ensemble_members(path: str | Path) -> list[Path]:
    """Checkpoints averaged for `path`: just `path`, unless an ensemble.json beside it lists members."""
    path = Path(path)
    spec = path.parent / ENSEMBLE_FILE
    if path.name != "pralaya.pt" or not spec.is_file():
        return [path]
    names = json.loads(spec.read_text())["members"]
    if not names or names[0] != path.name or len(set(names)) != len(names) or any("/" in n for n in names):
        raise ValueError("ensemble.json must list distinct bundle files, starting with pralaya.pt")
    return [path.parent / name for name in names]


class Forecaster:
    def __init__(self, path: str | Path = DEFAULT_CKPT, threads: int = 4):
        torch.set_num_threads(threads)
        members = ensemble_members(path)
        loaded = [load_model(member) for member in members]
        self.nets = [net for net, _ in loaded]
        self.net, self.meta = loaded[0]
        self.model_id = str(self.meta.get("model_id", "pralaya"))
        if len(self.nets) > 1:
            self.model_id += f"-ens{len(self.nets)}"

    def simulate(self, init_states, doy_sincos, steps: int, perturbation=None, member: int | None = None) -> np.ndarray:
        """init_states [3,6,32,36], doy_sincos [2] (last input day), perturbation [6,32,36] or None.
        Returns float32 [steps,6,32,36] in physical units. Never mutates its inputs."""
        init = np.array(init_states, dtype=np.float32, copy=True)
        if init.shape != (T_IN, NC, NLAT, NLON):
            raise ValueError(f"init_states shape {init.shape} != {(T_IN, NC, NLAT, NLON)}")
        sc = np.asarray(doy_sincos, dtype=np.float32).reshape(-1)
        if sc.shape != (2,) or not np.isfinite(sc).all():
            raise ValueError("doy_sincos must be two finite numbers")
        if not np.isfinite(init).all():
            raise ValueError("init_states contains NaN/Inf")
        steps = int(steps)
        if steps < 1:
            raise ValueError("steps must be >= 1")
        if perturbation is not None:
            p = np.asarray(perturbation, dtype=np.float32)
            if p.shape != (NC, NLAT, NLON) or not np.isfinite(p).all():
                raise ValueError(f"perturbation must be finite {(NC, NLAT, NLON)}")
            init[-1] = init[-1] + p
        init[:, TP] = np.maximum(init[:, TP], 0.0)
        x, season = torch.from_numpy(init)[None], torch.from_numpy(sc)[None]
        with torch.inference_mode():
            # Each member rolls out on its own; only the outputs are averaged.
            nets = self.nets if member is None else [self.nets[member]]
            out = sum(net.rollout(x, season, steps)[0] for net in nets) / len(nets)
        return out.numpy().astype(np.float32)
