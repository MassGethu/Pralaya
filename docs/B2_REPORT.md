# B2 (compact U-Net): report for validation

> **Record on main (added 27 Nov).** Copied unchanged from branch `mass/b2-unet` at `224672a`. Not promoted. The U-Net code, the result files under `evaluation/results/` and the `docs/EXPERIMENTS.md` section this report cites live only on that branch.

- **Owner / Mac:** Mass (Apple M5, 16 GB).
- **Branch:** `mass/b2-unet`, pushed, head `1d7e76f`. Not merged anywhere.
- **Base:** pre-registration commit `dccd2c0` (tip of `origin/jarvis/model` at 00:10 IST).
- **Worktree:** `/Users/massgethu/Pralaya-b2`. The manager's checkout `/Users/massgethu/Pralaya` was not used for
  work, and its branch was not switched.
- **Verdict: not promoted.** The one-step stage `b2_unet_b1` scored S 33.18 on val 2020, against 38.67 for
  `b1_onestep`, and the paired CI is below 0. The chain was stopped at the stage-1 check, so the pre-registered
  candidate `b2_unet` was never trained.

## 1. Timeline (IST, 27 Nov 2026)
| time | step |
|---|---|
| 00:10 | `git fetch`; `origin/jarvis/model` = `dccd2c0`; worktree `mass/b2-unet` created from it |
| 00:12 | golden output of the shipped e3 bundle saved with the *unchanged* code (`tests/golden/bundle_golden_2step.npy`) |
| 00:14 | U-Net code + tests committed (`16f39c9`), 38/38 pytest pass, pushed; chain-check rule fixed (section 4) |
| 00:18 | kit checksums verified, kit copied to `/Users/massgethu/kit`, reference `runs/*` copied into the worktree |
| 00:19 | pytest 38/38 pass again with the data present; 1-epoch smoke run: val 0.5526 → 0.4454, no NaN |
| 00:19:53–00:25:41 | `b2_unet_b1` trained (40 epochs, 5.8 min) |
| 00:26 | `b2_unet_b3` started while `b2_unet_b1` was evaluated |
| 00:28 | check failed (S 33.18 < 35.2); `b2_unet_b3` killed at epoch 5/12; **no training since** |
| 00:30 | results + write-up committed (`1d7e76f`) and pushed |

## 2. Code change (`git diff dccd2c0..1d7e76f`)
- **`model/net.py`:**
  - new `UNetCore`, used when `PralayaNet(arch="unet")`;
  - grid 32×36 → 16×18 → 8×9 and back, with skip connections;
  - widths 48/96/128, one ResBlock per level each way plus one at the bottom;
  - stride-2 3×3 conv down; bilinear up, then a 1×1 conv merges each skip;
  - replicate padding.
- **Kept from `PralayaNet`:**
  - same inputs (18 + 4 geo + 2 sin/cos channels);
  - residual on the last state, rain ReLU;
  - head weight and bias start at zero, so step 0 is persistence.
- **Config:** `{"arch": "unet", "widths": [48, 96, 128]}`. The CNN config is unchanged; `arch` is written only for
  the U-Net.
  - The buffer setup moved into a helper `_register_inputs`, with the same buffers in the same order.
- **`train.py`:** `--arch {cnn,unet}`, default `cnn`.
  - With `--init`, the checkpoint's own arch is used.
  - An `--arch` that does not match the checkpoint is an error.
  - The start line logs the arch.
- **`model/inference.py`, `model/forecaster.py`:** unchanged. They already rebuild from `**ck["config"]`.
- **`tests/test_unet.py` (6 tests):**
  - the shipped CNN checkpoint without `arch` gives **bit-identical** output to the golden file made from
    `dccd2c0`, with the same state-dict keys and order;
  - the U-Net parameter count is within ±20 % of 856,422;
  - 32×36 / 16×18 / 8×9 shapes;
  - persistence at init through a 10-step rollout, with rain ≥ 0;
  - gradients reach the head; `advect` and an unknown arch are rejected;
  - a U-Net checkpoint round-trips through `load_model` / `load_cpu`.
- **Parameters:** U-Net **904,326**, CNN **856,422** (+5.6 %; band 685k–1,028k).
- **Not touched:** `model/bundle/` (`git diff dccd2c0..HEAD -- model/bundle` is empty), `main`, and every other
  branch.

## 3. Training run
`python train.py --name b2_unet_b1 --arch unet --epochs 40 --rollout 1 --lr 1e-3 --seed 0`, which is the b1 recipe
from docs/TRAINING.md with only the architecture changed (batch 32, wd 1e-4, no ocean or heavy-rain weight, no init).

| | `b1_onestep` | `b2_unet_b1` |
|---|---|---|
| best epoch | 28 | 23 |
| training-time val score (lower is better) | 0.4213 | 0.4304 |
| train loss at best epoch | 0.0456 | 0.0387 |
| wall time | 6.3 min (Jarvis) | 5.8 min (Mass), ~9 s/epoch |

The checkpoint is gitignored and stays on Mass's Mac: `runs/b2_unet_b1/best.pt`, sha256
`5237a4ef2b79284dc8862beddc78617083da6adef398b88cf192029f8567cb34`.

## 4. Chain check (decision rule and result)
- **Your instruction:** "stop if one-step is clearly worse than b1".
- **How "clearly worse" was defined:** fixed at 00:14, before any B2 training. Stop if `b2_unet_b1` fails a
  SELECTION gate or has **S < 35.2**. That is b1's S of 38.67 minus B1's seed sd of 3.5; the B1 seeds scored 38.67,
  33.10 and 32.25.
- **This rule is not in the pre-registration.** It was stated in the session log before training.
- **Result:** all gates pass, S = 33.18 < 35.2, so stop. The paired skill difference against B1 is also wholly
  below 0.
- **The partial `b2_unet_b3`** (5/12 epochs) exists in `runs/` but was not evaluated and is not a result.

## 5. Results (val 2020, 354 windows, every window shocked)
| | `b1_onestep` | `b2_unet_b1` | `e3_roll8_ocean` |
|---|---|---|---|
| SELECTION gates | pass | pass | pass |
| S /70 | 38.67 | **33.18** | 49.37 |
| points rmse / csi / blur / causal | 4.03 / 11.23 / 10 / 13.40 | 0.00 / 9.49 / 10 / 13.69 | 14.75 / 10.92 / 10 / 13.70 |
| per-window skill [95 % CI] | +0.0161 [−0.0005, +0.0327] | −0.0074 [−0.0243, +0.0107] | +0.0590 [+0.0440, +0.0739] |
| paired Δ skill of B2 vs this column | −0.0235 [−0.0360, −0.0084] | – | −0.0664 [−0.0795, −0.0512] |
| stable warm / stall | 69.8 % / 78.0 % | 70.6 % / 80.8 % | 88.1 % / 88.4 % |
| heavy 25 mm CSI / POD, d1 | 0.374 / 0.487 | 0.360 / 0.463 | 0.364 / 0.478 |
| heavy 25 mm CSI / POD, d8 | 0.067 / 0.097 | 0.064 / 0.094 | 0.080 / 0.106 |
| heavy 50 mm CSI / POD, d1 | 0.240 / 0.300 | 0.248 / 0.308 | 0.235 / 0.289 |
| heavy 50 mm CSI / POD, d8 | 0.010 / 0.012 | 0.007 / 0.008 | 0.002 / 0.003 |
| day-8 in-band fraction / rain variance ratio | 0.897 / 0.84 | 0.903 / 0.92 | 0.897 / 0.72 |
| median CPU 10-step rollout | 113 ms | 32 ms | 23 ms |

- **Rules 1–4 vs e3 (stage 1, not like-for-like):** fails 2 (S margin), 3 (paired CI) and 4a (stability).
- **Rule 5 (seeds):** not reached. No seeds were run for B2, by design: only a run that passes rules 1–4 gets seeds.

**Honest reading:**
- The U-Net is worse than B1 seed 0 on the same windows, mostly in RMSE and CSI.
- 33.18 is inside B1's own seed spread (34.7 ± 3.5), so this does not prove U-Nets are worse in general. It shows
  no sign of being better.
- A lower train loss with a worse val score suggests mild overfitting.
- Rollout fine-tuning of the U-Net was not tested.

## 6. Deviations from the instructions (please check each)
1. **Run names** follow the pre-registration (`b2_unet_b1`, `b2_unet_b3`, `b2_unet`), not the prompt's
   `b2_unet_onestep`, `_roll4` and `_roll8_ocean`. The prompt said the pre-registration wins.
2. **The kit was copied, not moved** (README step 1 says `mv`), so the manager's checkout keeps
   `pralaya_parallel/kit`. The checksums match at both places.
3. **The worktree** was created with `git worktree add … -b mass/b2-unet dccd2c0`, not `git checkout -b` in the main
   checkout, because the manager uses that checkout.
4. **Python:** the provided venv (`…/scratchpad/venv312`, Python 3.12.16, torch 2.15.0, numpy 2.5.5, xarray
   2026.9.0, monsoon_r1 kit), not a fresh `.venv`. The README says 3.12.15.
5. **The chain-check threshold** (S < 35.2) was chosen by us before training. It is not pre-registered (section 4).
6. **Stage 2 started before the stage-1 evaluation finished,** to save time, and was killed when the check failed.
   It never ran alongside another training job.
7. **Extra committed files:**
   - `trace_b1_onestep_val*` (made from the included B1 checkpoint, as the README asks);
   - `compare_b2_unet_b1_vs_b1.*` (the B2-vs-B1 comparison);
   - `compare_b2_unet_b1_vs_e3.*` (stage 1 against e3; there is no `compare_b2_unet_vs_e3` because `b2_unet` was
     never trained);
   - `tests/golden/bundle_golden_2step.npy`.
8. **Test 2021 was never evaluated.**

## 7. How to validate (commands, run in a checkout of `mass/b2-unet`)
```bash
git fetch origin && git log --oneline dccd2c0..origin/mass/b2-unet       # expect 16f39c9, 1d7e76f
git diff dccd2c0..origin/mass/b2-unet -- model/bundle                     # expect empty
git diff --stat dccd2c0..origin/mass/b2-unet                              # net.py, train.py, tests, results, docs only
python -m pytest -q                                                       # expect 38 passed
python -m pytest tests/test_unet.py -q -s                                 # prints params: unet=904,326 cnn=856,422
```
Recompute the comparisons from the committed JSON/npz (no checkpoint needed):
```bash
python -m evaluation.compare --base b1_onestep     --out check_b2_vs_b1 b2_unet_b1   # S 33.18, paired −0.0235 [−0.0360, −0.0084]
python -m evaluation.compare --base e3_roll8_ocean --out check_b2_vs_e3 b2_unet_b1   # fails rules 2, 3, 4a
```
(`--out` is a name inside `evaluation/results/`; use a throwaway name and delete the files afterwards.)

Full re-evaluation needs `runs/b2_unet_b1/best.pt` from Mass's Mac (sha256 above), on val only:
```bash
python -m evaluation.evaluate --ckpt runs/b2_unet_b1/best.pt --split val
python -m evaluation.trace    --ckpt runs/b2_unet_b1/best.pt --split val
```
The full write-up is in `docs/EXPERIMENTS.md`, section "Round 2 results: `b2_unet`".
