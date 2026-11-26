# Experiments after b3_roll4 (pre-registered)

> **Current status (added 27 Nov; the pre-registered text below is unchanged):** shipped `e3_rainstab`, sha256
> `90605130…68d88db`, promoted in round 2 (see the end of this file). Rollback to e3: `git checkout 3578dd2 --
> model/bundle/pralaya.pt`. The "Baseline and rollback" section below describes the state when round 1 was registered.

Written and committed **before** any of these runs was evaluated. The rule below decides promotion and is not edited
afterwards; results are appended in the log at the end.

## Baseline and rollback
Shipped: `b3_roll4` (`model/bundle/pralaya.pt`, sha256 `20ebabfd…b4e4`). It stays the bundle unless a candidate passes
the promotion rule. Rollback = restore that file (`git checkout <sha> -- model/bundle/pralaya.pt`).

## Runs (one change each, so effects can be attributed)
All fine-tune from `runs/b3_roll4/best.pt`, 12 epochs, lr 1e-4, batch 32, seed 0, same data split. Except for the
control, each run differs from `c0_cont4` in exactly one thing.

| id | change vs control | hypothesis |
|---|---|---|
| `c0_cont4` | none (K=4, more epochs at low lr) | control: how much is just extra training |
| `b4_roll8` | rollout K=8 instead of 4 | longer rollout training reduces day-4..8 drift |
| `e1_ocean` | t2m loss weight 4 on ocean cells | ocean t2m is the weakest field (negative skill already at day 1) |
| `e2_rainstab` | hinge penalty on the response to random kit-like shocks above 3 std (weight 1) | shock instability is almost all rain; penalising only excess response keeps normal responses |
| `h1_multiscale` | 2 coarse-grid branches (1/2 and 1/4 grid), new layers start at zero | plan hypothesis: multi-scale architecture |
| `h2_structloss` | + 0.5 x spatial-gradient loss | plan hypothesis: structure-aware loss (less blur) |
| `h3_transport` | semi-Lagrangian advection of the last state by its own 10 m wind as an extra input, new layer starts at zero | plan hypothesis: wind-guided transport |

Each hypothesis gets one pre-set setting, with no tuning on val. A null result therefore means "this setting did
not help", not "the idea cannot work".

Random shocks for `e2_rainstab`: a 13 x 13 cell box at a random position. Either warm/moist (t2m +1..3 K, tcwv
+5..15 %) or weak wind (u10, v10 −20..40 %), applied to the last input day. These are not the grader's fixed boxes.

## Evaluation (val 2020, all 354 windows, every window shocked)
`python -m evaluation.evaluate --split val` and `python -m evaluation.trace --split val` for every run, then
`python -m evaluation.compare`. Reported against `b3_roll4` on the same windows:
- per-window skill and the paired per-window difference (95% block-bootstrap CI);
- skill by lead (1..10) and channel;
- day-4 skill vs persistence;
- CSI skill, and heavy-rain CSI, frequency bias and POD at 10/25/50 mm/day;
- spatial variance ratio by lead;
- both shock diagnostics, including the first day the response exceeds 5 std;
- worst windows.

## Promotion rule (val only)
A candidate replaces `b3_roll4` only if all of these hold on val:
1. It passes every gate in SELECTION.md.
2. S ≥ S(b3_roll4) + 1.0. The 1.0 margin is the seed tie band.
3. The paired per-window skill difference vs b3_roll4 has a 95% CI lower bound > 0.
4. No-harm checks against b3_roll4:
   - both shock stable fractions are not lower by more than 2 pp;
   - heavy-rain (25 mm/day) CSI at day 1 is not lower by more than 10% relative;
   - the day-8 variance-in-band fraction is not lower by more than 0.02.
5. Seeds: the same recipe, fine-tuned from `b3_roll4_s1` and `b3_roll4_s2`, must keep a 3-seed mean S ≥ the
   b3 3-seed mean + 1.0.

If more than one candidate passes, the higher S wins. A combination of passing changes is a new candidate and
goes through the same rule.

Test 2021 was already seen, so any 2021 numbers from here on are labelled **follow-up evaluation** and never
used for promotion.

---
## Log

### Diagnosis of b3_roll4 on val (`python -m evaluation.trace`, full output in `evaluation/results/trace_b3_roll4_val.md`)
- **First failure is ocean t2m at day 1.** Skill vs the better baseline is already negative on day 1 over the ocean,
  in both the Bay of Bengal and Arabian Sea boxes. Over the ocean, t2m barely moves from day to day, so persistence
  is very hard to beat there. Over land, t2m skill stays positive until day 5.
- **Next to fail:** rain north of 28N (day 3) and highland tcwv (day 3). Then rain everywhere (day 5), and all
  channels by days 6–8 except msl (day 8).
- **Worst val windows:**
  - 2020-05-04 and 2020-05-06: Bay of Bengal convection before cyclone Amphan. Rain first, from day 2–3. The model
    gives 10 mm/day where 139 mm/day fell at 6.5N 94.5E.
  - 2020-02-10/11: a winter western disturbance. msl over the northwest from day 1, and spurious rain in the
    southern Arabian Sea.
  - 2020-10-28: msl at the north-east corner.
- **Shock instability is rain only, in the box, and comes from amplifying rain the model already forecasts.**
  - Every >5 std case is tp. The median distance from the shock box is 0 cells.
  - warm_ocean: 51/354 windows exceed 5 std. The first exceedance is mostly on days 5–7, building through 3 std
    a few days earlier.
  - monsoon_stall: 37/354 windows exceed 5 std, earlier (days 1–4). 14 of these windows are already above 3 std
    on day 1.
  - At the first >5 std cell, the base forecast already has 21–28 mm/day, and the shock adds about 40 mm/day.
    Observed rain at that cell is >= 25 mm/day in only 16 % (warm) / 38 % (stall) of these cases.
- **Heavy rain is already under-forecast.** At 25 mm/day, the frequency bias is 0.80 / 0.55 / 0.45 at days
  1 / 4 / 8. At 50 mm/day it is 0.53 / 0.18 / 0.13. A rain-stability fix must not reduce this further; rule 4b
  checks day-1 CSI at 25 mm/day.
- **Spatial variance is healthy.** Day-8 variance ratio is 0.85–1.01 for every channel (kit band 0.4–2.5), and
  90 % of windows are in band.

### First results (val; full table `evaluation/results/compare_val.md`)
| id | S (Δ vs b3) | paired Δ skill vs b3 [CI] | stable warm / stall | verdict |
|---|---|---|---|---|
| c0_cont4 (control) | 44.14 (−1.78) | −0.0035 [−0.0087, +0.0015] | 77.4 % / 84.5 % | not promoted |
| b4_roll8 | 47.11 (+1.19) | +0.0059 [−0.0002, +0.0136] | 87.0 % / 92.1 % | not promoted (rule 3: CI lower bound −0.0002) |
| e1_ocean | 44.87 (−1.05) | −0.0004 [−0.0051, +0.0045] | 78.0 % / 84.5 % | not promoted |

- **Attribution against the control:**
  - Continuing K=4 training at low lr *hurts*. Shock stability drops by 8 and 5 pp, and S drops by 1.8.
  - **K=8** reverses this. It gains +3.0 S over the control, with days 5–10 better by +0.01 to +0.04 and both
    shocks more stable than b3.
  - **The ocean weight** fixes what it targets. Ocean t2m skill goes from −0.069 to **+0.011** at day 1, −0.247 to
    −0.115 at day 4, and −0.579 to −0.361 at day 8; the Bay of Bengal box at day 8 goes from −0.575 to −0.376.
    Other channels are unchanged.
  - Its stability loss equals the control's, so that loss comes from the extra K=4 training, not from the weight.

### Pre-registered follow-up (written before it ran): `e3_roll8_ocean`
K=8 and ocean t2m weight 4 together: `--rollout 4` → `--rollout 8`, plus `--ocean-t2m-weight 4`. Same base, lr
and epochs. These are the two changes that each improved their target. It is a new candidate under the same
promotion rule.

### `e2_rainstab` (val)
S 45.58 (−0.35 vs b3). Paired Δ skill −0.0010 [−0.0060, +0.0036]. Stable 84.2 % / 87.9 %. **Not promoted**
(fails rules 2 and 3; 4a–4c pass).
- **Against the control,** the stability penalty works. Unstable windows fall from 80 to 56 (warm) and from 55
  to 43 (stall). It does not get back to b3 (51 / 37), because the same extra training that hurts the control
  hurts here too.
- **First >5 std day (rain-shock trace):** for monsoon_stall, early crossings on days 1–3 fall from 13 windows (b3)
  to 7. The crossings that remain move later. warm_ocean is about the same as b3: mostly days 5–7.
- **Heavy rain is not suppressed.** At 25 mm/day, day-1 CSI is 0.367 vs 0.369 (bias 0.81 vs 0.80). At day 8,
  CSI is 0.082 vs 0.066 and bias 0.56 vs 0.45. At 50 mm/day, day-8 bias is 0.22 vs 0.13. Day-8 p99.9 rain is
  49.6 vs 45.2 mm/day (obs 76.1). The penalty only acts on the shocked response above 3 std, so the
  unperturbed rain forecast keeps (and slightly increases) its heavy tail.

### `h1_multiscale` (plan hypothesis: multi-scale architecture) (val)
S 44.28 (−1.65 vs b3, +0.14 vs control). Paired Δ skill −0.0027 [−0.0081, +0.0024]. Stable 79.1 % / 83.9 %.
**Not promoted** (fails rules 2, 3 and 4a).
- **Evidence: no effect at this setting.** Lead, channel, variance and heavy-rain numbers are within ±0.003 of
  the control at every lead. Its losses against b3 are the control's (extra K=4 training).
- **The branches did train, but stayed small.** The 1×1 output conv of each branch moved from 0 to a norm of
  0.13, against 11.9 for the last body conv.
- **Limitation, not a disproof:** the new layers started at zero and trained for 12 epochs at lr 1e-4. That is
  probably too little to learn a coarse-scale path. A fair test would train from scratch or give the new layers
  a higher lr. That is a second setting and was not pre-registered.

### `h2_structloss` (plan hypothesis: structure-aware loss) (val)
S 44.97 (−0.95 vs b3, +0.83 vs control). Paired Δ skill +0.0001 [−0.0050, +0.0051]. Stable 78.8 % / 84.2 %.
**Not promoted** (fails rules 2, 3 and 4a).
- **The blur part of the hypothesis cannot be tested here.** b3 and every candidate already get the full 10/10
  blur points. Spatial variance did not rise: rain variance ratio at day 8 is 0.80, against 0.83 for the
  control and 0.85 for b3.
- **What the gradient loss did:** skill is slightly higher than the control at every lead (+0.002 to +0.006). Its
  rmse points are 11.54 (control 10.64, b3 11.52), so it acts as a mild regulariser rather than a sharpener.
- **Shock stability** is the same as the control's.

### `h3_transport` (plan hypothesis: wind-guided transport) (val)
S 44.09 (−1.83 vs b3, −0.05 vs control). Paired Δ skill −0.0034 [−0.0086, +0.0016]. Stable 78.8 % / 84.5 %.
**Not promoted** (fails rules 2, 3 and 4a).
- **Evidence: no effect.** Every lead, channel, variance and heavy-rain number equals the control's to ±0.001.
- **The network barely uses the advected input.** Its input conv `adv_stem` grew from 0 to a norm of 0.18, against
  8.0 for the main stem. The per-channel advection speeds `adv_speed` stayed at their 0.5 start (0.46–0.51).
- **Blocker for a fair test** (same as h1): zero-initialised new layers fine-tuned for 12 epochs at lr 1e-4. Also,
  the plain CNN already sees 3 × 3 neighbourhoods across 5 blocks, which covers a day of 10 m wind transport
  (~4–8 m/s ≈ 3–7 cells/day). An explicit advection term adds little at this resolution.

### Hypothesis summary
| hypothesis | run | evidence | status |
|---|---|---|---|
| longer rollout reduces drift | b4_roll8 | days 5–10 better, more stable; S +1.19, CI just touches 0 | **supported, short of promotion** |
| ocean t2m weighting | e1_ocean | ocean t2m day-1 skill −0.07 → +0.01; S cost from extra K=4 training | **supported for its target** |
| rain-stability penalty | e2_rainstab | 24 / 12 fewer unstable windows than control; heavy rain kept | **supported vs control**, not vs b3 |
| multi-scale architecture | h1_multiscale | = control | **null at this setting**; new layers under-trained |
| structure-aware loss | h2_structloss | +0.83 S vs control via rmse; blur already 10/10 | **blur part untestable**; mild regulariser |
| wind-guided transport | h3_transport | = control; advection input unused | **null at this setting** |

### `e3_roll8_ocean` (val), passes rules 1–4
S **49.37 (+3.45 vs b3)**. Paired Δ skill **+0.0129 [+0.0065, +0.0204]**. Stable 88.1 % / 88.4 %. Heavy 25 mm/day
day-1 CSI 0.364 (b3 0.369, −1.4 % relative). Day-8 in band 0.897. Worst window −0.241 (b3 −0.348).

Rule 5 is pending. Recipe for it, fixed before it runs: the same command with `--init runs/b3_roll4_s{1,2}/best.pt
--seed {1,2}`, names `e3_roll8_ocean_s1` and `e3_roll8_ocean_s2`. The two runs train side by side on MPS.

### Rule 5 (seeds) and outcome
| seed | b3_roll4 S | e3_roll8_ocean S | Δ |
|---|---|---|---|
| 0 | 45.92 | 49.37 | +3.45 |
| 1 | 45.21 | 48.41 | +3.20 |
| 2 | 44.33 | 50.69 | +6.36 |
| mean ± sd | 45.16 ± 0.80 | **49.49 ± 1.14** | +4.33 (needed ≥ +1.0) |

- **Rule 5 passes,** and all three e3 seeds pass the gates. `e3_roll8_ocean` (seed 0) is the only candidate that
  passed rules 1–5, so **it is promoted.**
- We ship seed 0, as registered. Seed 2 scores higher on val, but picking it would be one more selection on val.
- **Release:**
  - `model/bundle/pralaya.pt` = `runs/e3_roll8_ocean/best.pt`, sha256 `d29656ae…0c7a90`, 3,470,551 bytes.
  - Same architecture config as b3 (`{"width": 96, "blocks": 5}`), so serving code needs no change.
  - Rollback: `git checkout 0175183 -- model/bundle/pralaya.pt` (b3_roll4, sha256 `20ebabfd…b4e4`).
- **Checks on main 385e70f with the new bundle:**
  - all 31 of main's tests;
  - the official schema validator;
  - `scripts/check_inference.py`;
  - `repo_scan` 15/15 with no flags;
  - peak RSS 242 MB;
  - identical forecasts for repeated requests.

### Follow-up evaluation on test 2021 (already seen; not used for promotion)
| | S /70 | per-window skill [95% CI] | day-4 vs persistence | stable warm / stall |
|---|---|---|---|---|
| b3_roll4 | 46.77 | +0.043 [+0.031, +0.056] | +0.222 | 86.1 % / 95.2 % |
| e3_roll8_ocean | **50.92** | +0.059 [+0.048, +0.071] | +0.232 | 89.5 % / 97.2 % |
| e3_rainstab | 50.72 | +0.059 [+0.049, +0.071] | +0.230 | 95.8 % / 97.7 % |

The gain on 2021 (+4.15 S) is the same size as on val (+3.45). Most of it is RMSE points (10.82 → 14.75).

e3_rainstab was scored on 2021 once, after its round-2 promotion. Its S is 0.20 below e3's: CSI points 12.2 → 11.8,
while warm-Bay stability rises (89.5 → 95.8 %). This does not change the promotion, which used val only.
Files: `e3_rainstab_test.md`, `trace_e3_rainstab_test.md`.

### Reproducible failure cases (shipped e3, val)
`python -m evaluation.trace --ckpt model/bundle/pralaya.pt --split val` writes `trace_e3_roll8_ocean_val.md`, with
the worst windows, the first negative lead by region and channel, and the shock first-crossing cells.
- **Worst windows:**
  - 2020-10-28 (msl, NE corner, skill −0.241);
  - 2020-02-10 and 2020-02-11 (western disturbance: msl from day 1, then spurious rain at 8.5N 65.5E, 31.7
    forecast vs 0.3 observed);
  - 2020-05-06 and 2020-05-04 (pre-Amphan Bay of Bengal: 9.1 forecast vs 139.3 mm/day observed at 6.5N 94.5E).
  - These are the same five as b3, and all score better (b3 worst was −0.348).
- **First failures:**
  - Ocean t2m is still the first field to fail, at day 1 (−0.020; b3 −0.066).
  - Rain north of 28N and highland tcwv fail at day 3, as with b3.
  - msl now holds to day 10 (b3: day 8).
- **Shocks:**
  - 42 of 354 windows exceed 5 std for warm_ocean, and 41 for monsoon_stall (b3: 51 and 37). All are rain inside
    the box.
  - The stall shock is 1.1 pp less stable than b3 (allowed: 2 pp).

---
## Round 2: pre-registration (written 2026-11-27 00:10 IST, before any of these runs was trained)
Baseline to beat: **`e3_roll8_ocean`**, shipped on main `08958a8`. Seed 0, val 2020 only, one change each. No
tuning on val, and no inner-holdout retrain. `model/bundle` is not touched and nothing is pushed to main.

### Earlier plan hypotheses, re-labelled
- `h1_multiscale` (old B2) and `h3_transport` (old B5) were **weak attempts**. The new layers started at zero, got
  12 epochs at lr 1e-4 and barely trained (output-layer norms 0.13 and 0.18). Their nulls do not test the ideas.
- Round 2 retests both fairly (b2_unet, b5_transport), with full training from scratch.

### Runs
| id | Mac / branch | recipe | change |
|---|---|---|---|
| `b4_heavyrain` | Jarvis / `jarvis/model` | e3's exact recipe: `--init runs/b3_roll4/best.pt --rollout 8 --lr 1e-4 --epochs 12 --ocean-t2m-weight 4 --seed 0` | `--heavy-rain-weight 4`: tp squared error ×4 where observed rain ≥ 10 mm/day (`--heavy-rain-thresh 10`, the kit's rain threshold). Applied at every rollout step, not renormalised. No gradient loss |
| `b5_transport` | Hridhin / `hridhin/b5-transport` | full chain from scratch with `--advect`: `b5_transport_b1` (40 ep, K=1, lr 1e-3) → `b5_transport_b3` (12 ep, K=4, lr 3e-4) → `b5_transport` (12 ep, K=8, lr 1e-4, `--ocean-t2m-weight 4`) | wind-guided transport input (B5) |
| `b2_unet` | Mass / `mass/b2-unet` | compact U-Net through the same chain: `b2_unet_b1` → `b2_unet_b3` → `b2_unet` | U-Net architecture (B2) |
| `e3_rainstab` (conditional) | Jarvis / `jarvis/model` | e3's exact recipe + `--stab-weight 1` (tau 3, the e2 setting) | rain-stability hinge on top of e3 |

- **`b2_unet` specification:**
  - Grid: 32×36 → 16×18 → 8×9, with skip connections.
  - Parameters within ±20 % of the width-96 / 5-block CNN (856,422), so 685k–1,028k.
  - Output head initialised at zero, so the untrained net equals persistence.
  - Same inputs, residual output and rain ReLU as `PralayaNet`.
  - Fair B2 vs B1: `b2_unet_b1` is compared with `b1_onestep` on val. This is reported, not used for promotion.
- **`e3_rainstab` is run only if `b4_heavyrain` finishes before 02:00 IST.** Otherwise it is recorded as "not run
  (time)". The setting is fixed here.
- **Why heavy-rain weight 4:**
  - In e3 at 25 mm/day, the frequency bias is 0.79 at day 1, and the shipped model forecasts too few heavy-rain
    days by day 8.
  - Plain MSE pulls wet cells toward the conditional mean.
  - The value 4 matches the ocean t2m weight that worked in round 1. It is chosen here and not tuned.

### Promotion rule (round-1 rules restated against e3)
1. Passes every SELECTION gate.
2. S ≥ S(e3) + 1.0 = **50.37**.
3. The paired per-window skill difference vs e3 has a 95 % CI lower bound > 0.
4. No harm vs e3:
   - both stable fractions not lower by more than 2 pp;
   - heavy-rain 25 mm/day day-1 CSI not lower by more than 10 % relative;
   - day-8 in-band fraction not lower by more than 0.02.
5. Seeds: the 3-seed mean S ≥ e3's 3-seed mean (49.49) + 1.0 = **50.49**.
   - Fine-tune candidates (b4, e3_rainstab) use `--init runs/b3_roll4_s{1,2}/best.pt --seed {1,2}`.
   - From-scratch candidates (b2, b5) rerun their whole chain with `--seed {1,2}`.

- At most one winner: the highest S among runs passing 1–4. Only that run gets seeds.
- If no run wins, e3 ships unchanged.
- Compared with `python -m evaluation.compare --base e3_roll8_ocean --out compare_<id>_vs_e3 <id>`.
- Reported vs e3: S; the paired CI; stable %; heavy-rain CSI and POD at 25 and 50 mm/day on days 1 and 8; day-8
  in-band fraction.

### Cutoffs (IST; submission 10:00)
- 00:15: this pre-registration is pushed.
- 03:00: seed-0 results for all runs are pushed.
- 05:30: seeds s1 and s2 for the single winner, run one after another.
- Anything late or failing is "not promoted", with one line on why.

### Round 2 results (seed 0, val 2020, vs `e3_roll8_ocean`)
**`b4_heavyrain`: not promoted.** It fails rule 2 (S 46.14, ΔS −3.23) and rule 3 (paired Δ skill −0.0270
[−0.0331, −0.0202]). Rule 4 would have passed: stable 88.4 / 91.0 % vs 88.1 / 88.4 %, heavy-25 d1 CSI 0.364 vs
0.364, day-8 in band 0.927 vs 0.897. The best checkpoint is epoch 3 (val_score 0.4120). Every epoch scored worse on
val_score than the b3 starting point (0.4094).

| vs e3 | S | paired Δ [CI] | stable warm / stall | CSI 25 d1 / d8 | POD 25 d1 / d8 | CSI 50 d1 / d8 | POD 50 d1 / d8 | freq bias 10 mm d8 | day-8 tp var ratio | day-8 in band |
|---|---|---|---|---|---|---|---|---|---|---|
| e3_roll8_ocean | 49.37 | – | 88.1 / 88.4 | 0.364 / 0.080 | 0.478 / 0.106 | 0.235 / 0.002 | 0.289 / 0.003 | 0.94 | 0.72 | 0.897 |
| b4_heavyrain | 46.14 | −0.0270 [−0.0331, −0.0202] | 88.4 / 91.0 | 0.364 / 0.098 | 0.481 / 0.152 | 0.225 / 0.007 | 0.271 / 0.008 | 1.77 | 1.78 | 0.927 |

- **What happened:** weighting wet cells ×4 made the model rain too often. At day 8 it forecasts 85k cells with
  ≥ 10 mm/day against 48k observed (frequency bias 1.77 vs 0.94), and the tp field is too variable (ratio 1.78 vs 0.72).
- **The cost:** tp skill falls (day 4 +0.03 → −0.00, day 8 −0.06 → −0.13), and that drives the S drop.
- **The gain is small:**
  - day-8 25 mm/day POD rises 0.106 → 0.152 and CSI 0.080 → 0.098;
  - 50 mm/day is still essentially unpredicted after day 1;
  - day-1 heavy rain is unchanged.
- **Conclusion:** a flat loss weight on wet cells trades many false alarms for a few extra heavy-rain hits. It does
  not beat e3.

**`e3_rainstab`: passes rules 1–4 (seed 0).** It ran because b4 finished at 00:16, before 02:00. The best checkpoint
has val_score 0.3999.
- Rule 2: S 51.11 (ΔS +1.74 ≥ 1.0).
- Rule 3: paired Δ skill +0.0055 [+0.0014, +0.0097].
- Rule 4:
  - stable 92.9 / 94.9 % vs 88.1 / 88.4 %;
  - heavy-25 d1 CSI 0.365 vs 0.364;
  - day-8 in band 0.885 vs 0.897 (−0.012, within 0.02).

| vs e3 | S | paired Δ [CI] | stable warm / stall | CSI 25 d1 / d8 | POD 25 d1 / d8 | CSI 50 d1 / d8 | POD 50 d1 / d8 | day-8 tp var ratio | day-8 in band |
|---|---|---|---|---|---|---|---|---|---|
| e3_roll8_ocean | 49.37 | – | 88.1 / 88.4 | 0.364 / 0.080 | 0.478 / 0.106 | 0.235 / 0.002 | 0.289 / 0.003 | 0.72 | 0.897 |
| e3_rainstab | 51.11 | +0.0055 [+0.0014, +0.0097] | 92.9 / 94.9 | 0.365 / 0.078 | 0.477 / 0.095 | 0.236 / 0.009 | 0.285 / 0.009 | 0.61 | 0.885 |

- **Where the gain comes from:**
  - The causal part: shocked forecasts stay stable much more often (+4.8 / +6.5 pp).
  - Slightly better late-lead skill: day 8 −0.015 vs −0.029; tp day 8 −0.03 vs −0.06.
- **Cost:**
  - Heavy rain gets rarer at longer leads: 25 mm/day frequency bias at day 8 is 0.31 vs 0.43, and POD falls 0.106 → 0.095.
  - The day-8 tp field is smoother (variance ratio 0.61 vs 0.72), but still inside the kit band.
- **Status:** a candidate, not yet promoted.
  - The winner is the highest S among runs passing 1–4, decided once b2_unet and b5_transport report (03:00).
  - If e3_rainstab wins, rule 5 needs its 3-seed mean ≥ 50.49, with
    `--init runs/b3_roll4_s{1,2}/best.pt --seed {1,2}`, run one after another (about 28 min each).

**`e3_rainstab` seeds (rule 5).** Jarvis approved starting them before the 03:00 b2/b5 results. Seeds 1 and 2 ran one
after another, 00:54–01:50, with `--init runs/b3_roll4_s{1,2}/best.pt --seed {1,2}`. They are compared in
`compare_e3_rainstab_seeds_vs_e3.*`.

| seed | S | paired Δ vs e3 [CI] | stable warm / stall | heavy-25 d1 CSI | day-8 in band |
|---|---|---|---|---|---|
| 0 | 51.11 | +0.0055 [+0.0014, +0.0097] | 92.9 / 94.9 | 0.365 | 0.885 |
| 1 | 49.19 | +0.0021 [−0.0057, +0.0102] | 95.5 / 97.2 | 0.369 | 0.879 |
| 2 | 52.24 | +0.0083 [+0.0007, +0.0157] | 98.9 / 98.0 | 0.371 | 0.873 |

- **Rule 5 passes:** the 3-seed mean S is **50.85 ± 1.54**, at least 49.49 + 1.0 = 50.49. For reference, e3's own
  mean is 49.49 ± 1.14.
- **The seeds disagree a lot:**
  - seed 1 alone is 0.18 below e3, and its CI includes 0;
  - every seed is more stable than e3 (+4.8 to +10.5 pp);
  - every seed has slightly better heavy-rain day-1 CSI.
- **Status:** e3_rainstab passes rules 1–5. It is promoted only if neither `b2_unet` nor `b5_transport` passes rules 1–4
  with a higher seed-0 S, which is decided at 03:00. `model/bundle` is unchanged until then.

### Round 2 outcome: `e3_rainstab` promoted
- `b2_unet`: not promoted (`mass/b2-unet` @ `1d7e76f`; chain stopped at the stage-1 check).
- `b5_transport`: not promoted (`hridhin/b5-transport` @ `6f65cfb`; fails rules 3 and 4a).
- `b4_heavyrain`: not promoted (fails rules 2 and 3).
- `e3_rainstab` is the only round-2 run passing rules 1–5, so **it is promoted.** We ship seed 0, as registered.
  Seed 2 scores higher, but picking it would be one more selection on val.
- **Release:**
  - `model/bundle/pralaya.pt` = `runs/e3_rainstab/best.pt`, sha256 `90605130…68d88db`
    (`90605130265bb9282ee0e2bdd5fec698c0f3ac4b2df8802f0a8be94eb68d88db`), 3,470,551 bytes.
  - Same architecture config as e3 (`{"width": 96, "blocks": 5}`), so serving code needs no change.
  - Rollback: `git checkout 3578dd2 -- model/bundle/pralaya.pt` (e3_roll8_ocean, sha256 `d29656ae…0c7a90`).
    Then restore `evaluation/results/shock_ranges_e3_roll8_ocean.*` as `shock_ranges.*`.
- **Checks on `jarvis/model` with the new bundle:**
  - all 33 tests;
  - `scripts/check_inference.py` against a live `serve.py`;
  - the official schema validator: all checks passed;
  - `monsoon_r1.repo_scan`: 15/15, no flags;
  - memprobe: peak 241 MB;
  - deterministic: identical repeated forecasts, and a null shock equals no shock.
- **Shock ranges regenerated** (`docs/SHOCK_RANGES.md`):
  - trusted Bay of Bengal −2 … +2 K and Arabian Sea wind −30 … +30 %;
  - the scenario service has an `e3_rainstab` profile with 13 defaults.
  - **The 2020-08-13 +1.5 K demo case no longer crosses.** The new demo is 2020-07-02, +2 K, 113.1 → 115.6 mm.
