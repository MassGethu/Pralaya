# How PRALAYA is trained and evaluated

## Data (see [DATA_AUDIT.md](DATA_AUDIT.md))
`india_climate_train.nc` from the organizer kit: 2005-01-01 … 2021-12-31, daily, 6 channels on a 32 × 36 grid,
plus 2 static fields. The audit (`python -m evaluation.audit`) passes 30/30 checks covering structure, units, coverage, ranges and static fields.

## Chronological split: we did not train on everything
| split | years | days | windows (3 in + 10 out) | used for |
|---|---|---|---|---|
| train | 2005–2019 | 5,478 | 5,472–5,475 (depends on rollout K) | weights, normalisation mean/std, climatology baseline |
| val | 2020 | 366 | 354 | early stopping and model selection only |
| test | 2021 | 365 | 353 | full skill scoring after the selection commit (`ed10825`) |

- A window counts only if its inputs **and** all its target days fall in the same split, so no target leaks across a year boundary.
- Normalisation uses train years only. The kit's `stats.json` covers 2005–2021, which includes val and test, so the model does not use it.
- The climatology baseline in evaluation is also built from train years only.
- The grader's hidden windows are from 2023–24, outside the archive. Test 2021 is our closest stand-in for them.
- Before full scoring, a 2021 temperature-range check informed validity testing. Training and candidate selection used data through 2020.

## Model
`model/net.py` `PralayaNet` is a residual CNN: width 96, 5 residual blocks, replicate padding, 0.86 M parameters.
- **Input:** 3 normalised days (18 channels), 4 geography channels (land-sea mask, orography/1000, lat, lon) and sin/cos of the target day.
- **Output:** the next day as a residual on the last day. The head starts at zero, so an untrained model equals persistence.
- **Rain:** ReLU, so rain is never negative.
- **Rollout:** autoregressive, one day per step. The season encoding advances by 2π/365 per step.

## Recipe (the shipped `e3_rainstab`; previous releases `e3_roll8_ocean`, `b3_roll4`)
| stage | command | what it does |
|---|---|---|
| b1 | `python train.py --name b1_onestep --epochs 40 --rollout 1 --lr 1e-3 --seed 0` | one-step training from scratch |
| b3 | `python train.py --name b3_roll4 --epochs 12 --rollout 4 --lr 3e-4 --init runs/b1_onestep/best.pt --seed 0` | fine-tunes through a 4-day rollout, which reduces drift and shock blow-up |
| e3 | `python train.py --name e3_roll8_ocean --epochs 12 --rollout 8 --lr 1e-4 --init runs/b3_roll4/best.pt --seed 0 --ocean-t2m-weight 4` | fine-tunes through an 8-day rollout with ocean t2m weighted 4× in the loss (best epoch 3); previous release |
| **e3_rainstab (shipped)** | `python train.py --name e3_rainstab --epochs 12 --rollout 8 --lr 1e-4 --init runs/b3_roll4/best.pt --seed 0 --ocean-t2m-weight 4 --stab-weight 1` | e3's recipe plus the shock-stability hinge (`--stab-tau 3` default), also from b3 (best epoch 3) |

How e3 and e3_rainstab were chosen, and the other experiments, are in [EXPERIMENTS.md](EXPERIMENTS.md). Optional `train.py` flags
used only by those experiments: `--heavy-rain-weight/--heavy-rain-thresh`, `--stab-tau`, `--grad-loss`, `--ms-levels`, `--advect`, `--anomaly/--clim-coef` (a3_anomaly), `--max-batches` (timing probes).

- Shared settings: AdamW (wd 1e-4), OneCycle LR, batch 32, gradient clip 1.0.
- Loss: latitude-weighted MSE in normalised units.
- Device: Apple MPS (about 320 samples/s); the checkpoint loads on CPU.
- Each run writes `runs/<name>/{config.json, log.jsonl, train.log, last.pt, best.pt, resume.pt}` (gitignored). Use `--resume` to continue an interrupted run.
- `best.pt` is the epoch with the lowest training-time val score (every 2nd val window, leads 1/4/8).
- Seeds 1 and 2 use the same commands with `--seed 1|2`, `_s1|_s2` names and the same-seed `--init`.
- Release: copy the selected `runs/<id>/best.pt` to `model/bundle/pralaya.pt`. The checkpoint is self-contained (weights, config, train-only stats, static fields).

## Is it overfitting?
- **First release (`b3_roll4`).** S is 46.8 / 70 in 2021 and 45.9 on 2020 validation. Per-window skill is
  +0.046 on validation and +0.043 in 2021, with overlapping 95% intervals.
- **Seeds.** b3 scores 45.2 ± 0.8 on val and 43.3 ± 3.4 on test (3 seeds). The gain over b1 (34.7 ± 3.5, 33.0 ±
  0.6) holds on every seed and on both splits.
- **Previous release `e3_roll8_ocean`.**
  - Promoted on val only: S 49.4 (+3.5 over b3), 3-seed mean 49.5 ± 1.1 against b3's 45.2 ± 0.8
    ([EXPERIMENTS.md](EXPERIMENTS.md)).
  - *Follow-up evaluation on 2021*, which we had already seen, so it is not used for the choice: S 50.9, against
    46.8 for b3. Per-window skill is +0.059 [+0.048, +0.071] on test, the same as on val (+0.059 [+0.044, +0.074]).
- **Shipped `e3_rainstab`.**
  - Promoted on val only (round 2, [EXPERIMENTS.md](EXPERIMENTS.md)): S 51.11 (+1.74 over e3), paired per-window
    skill +0.0055 [+0.0014, +0.0097], stable 92.9 / 94.9 % (e3 88.1 / 88.4 %).
  - 3-seed mean 50.85 ± 1.54 against e3's 49.49 ± 1.14. The seeds vary a lot: **seed 1 (49.19) is below e3**,
    and its paired CI includes 0. We ship seed 0, as registered.
  - *Follow-up evaluation on 2021*, scored once after promotion: S 50.72, **0.20 below e3's 50.92** (fewer CSI
    points), with warm-Bay shock stability 95.8 % against 89.5 %. Per-window skill +0.059 [+0.049, +0.071].
- **Known weaknesses of the shipped model (honest).**
  - Skill against the better baseline (persistence or climatology) turns negative at day 8 for the mean over
    channels (−0.015; day 6 for rain).
  - Ocean t2m is still worse than persistence from day 1.
  - Rain causes every unstable shock response (25 warm_ocean and 18 monsoon_stall windows of 354).
  - Heavy rain is rarer at long leads than in e3: 25 mm/day day-8 frequency bias 0.31 (e3 0.43), POD 0.095.
  - Day-8 rain spatial variance is 0.61 of observed (e3 0.72). This is inside the kit band, but rain is smoother.
  - The grader averages only 5 windows, so the expected range is wide.
  - Details: `evaluation/results/compare_e3_rainstab_vs_e3.md`, `compare_e3_rainstab_seeds_vs_e3.md` and
    `trace_e3_rainstab_val.md`. The previous release's are `compare_val.md` and `trace_e3_roll8_ocean_val.md`. The first-release report is
    in [`evaluation/results/report_test.md`](../evaluation/results/report_test.md), with maps in
    `evaluation/results/maps/`.

## Selection and evaluation
- Rule: [SELECTION.md](SELECTION.md), fixed before test.
- Commands:
  - `python -m evaluation.evaluate --ckpt runs/<id>/best.pt --split val|test [--maps]`
  - `python -m evaluation.select --split val|test`
- Tests: `python -m pytest tests/test_model.py` (24 tests).
- Memory: `python evaluation/memprobe.py <checkout with serve.py>` (peak 248 MB of 6 GB).
