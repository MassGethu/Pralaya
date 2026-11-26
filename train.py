"""PRALAYA training entrypoint.

  python train.py --data ../kit/india_climate_train.nc --name b1_onestep --epochs 30
  python train.py --name b1_onestep --resume                    # continue an interrupted run
  python train.py --name b3_roll4 --rollout 4 --init runs/b1_onestep/best.pt --epochs 15 --lr 3e-4

Chronological split from evaluation/data.py: train 2005-2019, val 2020 (selection), test 2021 (held out).
Writes runs/<name>/{config.json, log.jsonl, train.log, last.pt, best.pt}. Each checkpoint is CPU-loadable by
model.forecaster.load_model and contains weights, config, train-only normalisation and static geography.
"""
from __future__ import annotations

import argparse
import json
import math
import random
import time
from pathlib import Path

import numpy as np
import torch

from evaluation.data import DEFAULT_NC, SPLITS, channel_stats, load_archive, sincos, split_mask, window_starts
from model.net import NC, PralayaNet

ROOT = Path(__file__).resolve().parent
VAL_LEADS = (1, 4, 8)
VAL_STEPS = 8


def pick_device(name: str) -> torch.device:
    if name != "auto":
        return torch.device(name)
    return torch.device("mps" if torch.backends.mps.is_available() else "cpu")


def lat_w(lat: np.ndarray, device) -> torch.Tensor:
    w = np.cos(np.deg2rad(lat))
    return torch.tensor(w / w.mean(), dtype=torch.float32, device=device).view(1, 1, -1, 1)


def save_ckpt(path: Path, net: PralayaNet, meta: dict) -> None:
    sd = {k: v.detach().cpu() for k, v in net.state_dict().items()}
    torch.save({"state_dict": sd, "config": dict(net.config), "mean": net.mean.view(-1).cpu(),
                "std": net.std.view(-1).cpu(), "static": net.static.cpu(), "meta": meta}, path)


def batch(data: torch.Tensor, sc_all: torch.Tensor, idx: torch.Tensor, k: int):
    """inputs days i..i+2, targets i+3..i+2+k, sin/cos of the last input day i+2."""
    offs = torch.arange(3 + k, device=data.device)
    seq = data[idx[:, None] + offs]                 # [B, 3+k, 6, 32, 36]
    return seq[:, :3], seq[:, 3:], sc_all[idx + 2]


@torch.no_grad()
def validate(net, data, sc_all, starts, w, device) -> dict:
    net.eval()
    se = torch.zeros(len(VAL_LEADS), NC, device=device)
    for chunk in torch.split(starts, 128):
        x, y, sc = batch(data, sc_all, chunk, VAL_STEPS)
        out = net.rollout(x, sc, VAL_STEPS)
        for j, ld in enumerate(VAL_LEADS):
            d = (out[:, ld - 1] - y[:, ld - 1]) / net.std.view(1, NC, 1, 1)
            se[j] += ((d ** 2) * w[0]).mean(dim=(2, 3)).sum(dim=0)
    rmse = torch.sqrt(se / len(starts)).cpu().numpy()          # normalised, lat-weighted, per lead x channel
    net.train()
    return {"val_score": float(rmse.mean()), "rmse_norm": rmse.round(4).tolist()}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", default=str(DEFAULT_NC))
    ap.add_argument("--name", required=True)
    ap.add_argument("--epochs", type=int, default=30)
    ap.add_argument("--rollout", type=int, default=1, help="training rollout length K (BPTT through K steps)")
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--lr", type=float, default=1e-3)
    ap.add_argument("--wd", type=float, default=1e-4)
    ap.add_argument("--width", type=int, default=96)
    ap.add_argument("--blocks", type=int, default=5)
    ap.add_argument("--rain-weight", type=float, default=1.0, help="loss weight of the tp channel")
    ap.add_argument("--init", default=None, help="checkpoint to fine-tune from")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--device", default="auto")
    ap.add_argument("--val-stride", type=int, default=2)
    ap.add_argument("--resume", action="store_true", help="continue runs/<name> from last.pt + resume.pt")
    args = ap.parse_args(argv)

    random.seed(args.seed); np.random.seed(args.seed); torch.manual_seed(args.seed)
    dev = pick_device(args.device)
    out_dir = ROOT / "runs" / args.name
    out_dir.mkdir(parents=True, exist_ok=True)
    logf = open(out_dir / "train.log", "a", buffering=1)

    def log(msg: str) -> None:
        line = f"[{time.strftime('%H:%M:%S')}] {msg}"
        print(line, flush=True); logf.write(line + "\n")

    arc = load_archive(args.data)
    mean, std = channel_stats(arc.data[split_mask(arc.dates, "train")])
    resume_state = None
    if args.resume:
        if not (out_dir / "resume.pt").is_file():
            raise SystemExit(f"--resume: {out_dir / 'resume.pt'} not found")
        args.init = str(out_dir / "last.pt")
        resume_state = torch.load(out_dir / "resume.pt", map_location="cpu", weights_only=False)
        args.epochs = resume_state["epochs"]                 # the LR schedule is fixed by the original run length
    if args.init:
        ck = torch.load(args.init, map_location="cpu", weights_only=True)
        net = PralayaNet(ck["mean"], ck["std"], ck["static"], **ck["config"])
        net.load_state_dict(ck["state_dict"])
        mean, std = ck["mean"].numpy(), ck["std"].numpy()
    else:
        net = PralayaNet(mean, std, arc.static, width=args.width, blocks=args.blocks)
    net = net.to(dev).train()

    data = torch.from_numpy(arc.data).to(dev)
    sc_all = torch.from_numpy(np.stack([sincos(d) for d in arc.dates])).to(dev)
    tr = torch.from_numpy(window_starts(arc.dates, "train", args.rollout)).to(dev)
    va = torch.from_numpy(window_starts(arc.dates, "val", VAL_STEPS, args.val_stride)).to(dev)
    w = lat_w(arc.lat, dev)
    cw = torch.ones(NC, device=dev); cw[1] = args.rain_weight; cw = (cw / cw.mean()).view(1, 1, NC, 1, 1)

    cfg = {**vars(args), "device": str(dev), "splits": SPLITS, "train_windows": len(tr), "val_windows": len(va),
           "params": sum(p.numel() for p in net.parameters()), "norm_mean": mean.tolist(), "norm_std": std.tolist()}
    (out_dir / "config.json").write_text(json.dumps(cfg, indent=1))
    log(f"start {args.name}: device={dev} train_windows={len(tr)} val_windows={len(va)} params={cfg['params']}")

    opt = torch.optim.AdamW(net.parameters(), lr=args.lr, weight_decay=args.wd)
    steps_per_epoch = math.ceil(len(tr) / args.batch)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=args.lr, total_steps=args.epochs * steps_per_epoch,
                                                pct_start=0.05 if args.init else 0.1)
    meta = {"model_id": args.name, "train_years": list(SPLITS["train"]), "rollout": args.rollout, "seed": args.seed}
    best, start_ep = math.inf, 1
    if resume_state is not None:
        opt.load_state_dict(resume_state["opt"]); sched.load_state_dict(resume_state["sched"])
        best, start_ep = resume_state["best"], resume_state["epoch"] + 1
        torch.set_rng_state(resume_state["rng"])
        log(f"resumed at epoch {start_ep} (best so far {best:.4f})")
    v0 = validate(net, data, sc_all, va, w, dev)
    log(f"epoch {start_ep - 1} val_score={v0['val_score']:.4f} (rmse_norm lead1/4/8 mean over ch: "
        f"{[round(float(np.mean(r)), 4) for r in v0['rmse_norm']]})")
    for ep in range(start_ep, args.epochs + 1):
        t0 = time.time(); tot = 0.0
        perm = tr[torch.randperm(len(tr), device=dev)]
        for chunk in torch.split(perm, args.batch):
            x, y, sc = batch(data, sc_all, chunk, args.rollout)
            out = net.rollout(x, sc, args.rollout)
            d = (out - y) / net.std.view(1, 1, NC, 1, 1)
            loss = ((d ** 2) * w.unsqueeze(1) * cw).mean()
            opt.zero_grad(set_to_none=True)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(net.parameters(), 1.0)
            opt.step(); sched.step()
            tot += float(loss.detach()) * len(chunk)
        v = validate(net, data, sc_all, va, w, dev)
        rec = {"epoch": ep, "train_loss": tot / len(tr), **v, "sec": round(time.time() - t0, 1), "lr": sched.get_last_lr()[0]}
        with open(out_dir / "log.jsonl", "a") as f:
            f.write(json.dumps(rec) + "\n")
        save_ckpt(out_dir / "last.pt", net, {**meta, "epoch": ep, "val_score": v["val_score"]})
        tag = ""
        if v["val_score"] < best:
            best = v["val_score"]; tag = " *best"
            save_ckpt(out_dir / "best.pt", net, {**meta, "epoch": ep, "val_score": best})
        torch.save({"opt": opt.state_dict(), "sched": sched.state_dict(), "epoch": ep, "best": best,
                    "epochs": args.epochs, "rng": torch.get_rng_state()}, out_dir / "resume.pt")
        log(f"epoch {ep}/{args.epochs} loss={rec['train_loss']:.4f} val_score={v['val_score']:.4f} "
            f"lead1/4/8={[round(float(np.mean(r)), 4) for r in v['rmse_norm']]} {rec['sec']}s{tag}")
    log(f"done best val_score={best:.4f} -> {out_dir / 'best.pt'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
