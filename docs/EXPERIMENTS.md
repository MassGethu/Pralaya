# Experiments after b3_roll4 (pre-registered)

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
