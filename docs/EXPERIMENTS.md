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
