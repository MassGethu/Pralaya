# B5 (`b5_transport`) validation report

**Verdict: not promoted.** On val 2020, B5 beats e3 on S (52.35 vs 49.37), but it fails two rules:
- rule 3: the paired CI includes 0;
- rule 4a: warm-ocean stability is 2.5 pp lower, and the limit is 2 pp.

Seeds were not run, because only a run that passes rules 1–4 gets seeds.

- Branch `hridhin/b5-transport`. The results commit is `6f65cfb`, pushed at 01:03 IST.
- Pre-registration: `docs/EXPERIMENTS.md`, "Round 2" (`dccd2c0`).
- Result write-up: `docs/EXPERIMENTS.md`, "Round 2 result: b5_transport".

## 1. Setup
- **Bundle check.** All 40 entries in `pralaya_parallel/CHECKSUMS.sha256` passed.
  - `kit/` was placed next to the checkout, at `~/Documents/kit`.
  - `runs/*` was copied into the worktree's gitignored `runs/`.
- **Branch.** `git worktree add ../Pralaya-b5 -b hridhin/b5-transport dccd2c0`. At that time `dccd2c0` was the tip
  of `origin/jarvis/model`.
- **Environment.**
  - Apple M5, with MPS available.
  - Python 3.12.15.
  - From `requirements-train.txt`: torch 2.15.0, numpy 2.5.5, xarray 2026.9.0, netCDF4 1.7.5.1.post1, pandas 3.1.1
    and scipy 1.18.1.
  - Kit wheel: `monsoon-r1-kit` 1.0.0.
- **pytest: 32/32 passed.** There is one deviation.
  - `tests/test_scenario_service.py` needs `fastapi` and `uvicorn`, and no requirements file lists them.
  - They were installed unpinned (fastapi 0.165.0, uvicorn 0.54.0).
  - Training and evaluation do not import them.
- **Smoke run.** One epoch with `--advect` at 00:10 IST took about 18 s per epoch. The run was then deleted.

## 2. Training (seed 0; pre-registered commands and names, run one after another)
| stage | flags | ran (IST) | best epoch | training-time val score (CNN, same stage) |
|---|---|---|---|---|
| `b5_transport_b1` | `--epochs 40 --rollout 1 --lr 1e-3 --seed 0 --advect` | 00:11–00:21 | 24 | 0.4267 (`b1_onestep` 0.4213) |
| `b5_transport_b3` | `--epochs 12 --rollout 4 --lr 3e-4 --init runs/b5_transport_b1/best.pt --seed 0 --advect` | 00:21–00:33 | 6 | 0.4081 (`b3_roll4` 0.4094) |
| `b5_transport` | `--epochs 12 --rollout 8 --lr 1e-4 --init runs/b5_transport_b3/best.pt --seed 0 --ocean-t2m-weight 4 --advect` | 00:33–00:57 | 3 | 0.4010 (`e3_roll8_ocean` 0.4041) |

`best.pt` sha256:
- `b5_transport_b1`: `a5dc65a5db5f33fb0891a6e6d16fc70cecd2497a656387267d100d7ad4a19e22`
- `b5_transport_b3`: `6fa6e141d590751cf90c1488700bf3d2a433eda95accdc48e125248044c095d6`
- `b5_transport`: `39801fff1fd9b67101cb1f365e1602d1ee2713b5872ceee23eb7b71e243d6a3f`

Model details:
- **Parameters: 861,708.** That is the width-96 CNN's 856,422 plus 5,286 for `adv_stem` and `adv_speed`.
- **Checkpoint config:** `{"width": 96, "blocks": 5, "advect": true}`.
- **Checkpoint meta:** train years 2005–2019, rollout 8, seed 0, epoch 3.

## 3. Was the transport input used? Yes
| after | `adv_stem` weight norm | `adv_speed` (t2m, tp, u10, v10, msl, tcwv) |
|---|---|---|
| init | 0 | 0.5 for all |
| b1 | 4.758 | 0.589, 0.330, 0.446, 0.457, 0.662, 0.595 |
| b3 | 4.727 | 0.590, 0.330, 0.454, 0.463, 0.663, 0.604 |
| final | 4.719 | 0.590, 0.330, 0.453, 0.465, 0.663, 0.603 |

- Round 1's `h3_transport` layer reached only 0.18.
- Here the input is learned in stage 1 and kept through both fine-tunes.
- Rain is moved at about a third of the 10 m wind speed, and msl and tcwv at about two thirds.

## 4. Val 2020 evaluation (354 windows, every window shocked)
These three commands were run:
```bash
.venv/bin/python -m evaluation.evaluate --ckpt runs/b5_transport/best.pt --split val
.venv/bin/python -m evaluation.trace    --ckpt runs/b5_transport/best.pt --split val
.venv/bin/python -m evaluation.compare  --base e3_roll8_ocean --out compare_b5_transport_vs_e3 b5_transport
```

| rule | e3 | b5_transport | pass |
|---|---|---|---|
| 1. SELECTION gates | all | all | yes |
| 2. S ≥ 50.37 | 49.37 | **52.35** (rmse 15.93, csi 12.69, blur 10.0, causal 13.73) | yes |
| 3. paired Δ skill, CI lower bound > 0 | – | +0.0047 [−0.0021, +0.0132] | **no** |
| 4a. stable warm / stall, each ≤ 2 pp lower | 88.1 % / 88.4 % | 85.6 % / 89.3 % | **no** (warm −2.5 pp) |
| 4b. heavy 25 mm/day day-1 CSI ≥ 0.9 × e3 | 0.364 | 0.372 | yes |
| 4c. day-8 in-band fraction ≥ e3 − 0.02 | 0.897 | 0.895 | yes |

Also reported:
- **Heavy rain CSI / POD.**

  | | 25 mm/day | 50 mm/day |
  |---|---|---|
  | day 1 | 0.372 / 0.485 (e3 0.364 / 0.478) | 0.236 / 0.288 (e3 0.235 / 0.289) |
  | day 8 | 0.069 / 0.088 (e3 0.080 / 0.106) | 0.001 / 0.001 (e3 0.002 / 0.003) |

- **Worst window:** 2020-02-11, at −0.382. E3's worst window is −0.241.
- **Windows above 5σ under the warm-ocean shock:** 51, against 42 for e3.
- **Skill by lead:** equal to e3 at day 1 and better at every later lead. It crosses zero at day 8 instead of day 7.
- **Intermediate stages vs e3:** S 31.12 (b1) and 45.64 (b3). Both fail, as expected for stages that have not been
  fine-tuned. The files are `compare_b5_transport_b{1,3}_vs_e3.md`.

## 5. Re-check after the push
| | committed S | re-scored S | points | stable warm / stall |
|---|---|---|---|---|
| `b5_transport` | 52.3549 | 52.3549 | identical | 85.59 % / 89.27 % (identical) |
| `e3_roll8_ocean` | 49.3715 | 49.3715 | identical | 88.14 % / 88.42 % (identical) |

The re-check confirms two things:
- B5's committed result is reproducible.
- The e3 base in git was scored at the same shock scale.

**Re-scoring trap.** `evaluation/evaluate.py` `grader_std()` reads `../kit/stats.json`.
- If that file is missing, the function silently falls back to the kit's default std. That changes the shock size.
- In a first re-check run from a folder without `kit/` beside it, B5's warm-ocean stable fraction came out at
  88.4 %, which would wrongly pass rule 4a.
- The committed numbers use the correct `stats.json`.
- To re-score B5, keep `kit/` next to the checkout.

## 6. In plain language
The network now gets an extra input showing where the air came from one day earlier, following the surface wind.
- It clearly uses that input, and the final model is better on average: lower error, and better rain detection
  after day 2.
- The gain is not consistent from one forecast to the next. Per window, it is too small to rule out zero.
- Under a warm-ocean shock, the model blows up slightly more often than the shipped model. It misses the 2-point
  allowance by half a point.
- Its worst single forecast, the February western-disturbance case, got worse.

By the pre-registered rules, B5 does not replace e3.

## 7. Where everything is
- **Committed on the branch:**
  - `docs/EXPERIMENTS.md`, section "Round 2 result: b5_transport";
  - 21 files under `evaluation/results/`: `b5_transport*_val.*`, `trace_b5_transport*_val*` and
    `compare_b5_transport*_vs_e3.*`;
  - this report.
- **On Hridhin's Mac only (gitignored):** checkpoints and logs in `runs/b5_transport{_b1,_b3,}/`.
- **Not touched:** `model/bundle/`, main and every other branch.
- **Not evaluated:** test 2021.
