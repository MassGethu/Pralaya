# Model selection rule (fixed before any test-2021 scoring)

The selection rule was recorded after reviewing seed-0 validation results, before reviewing seeds 1 and 2 and before full 2021 skill scoring. A prior check of 2021 temperature ranges informed validity testing. Candidate selection used 2020 results.

## Splits
- Train 2005–2019. Normalisation and climatology use train years only.
- **Val 2020: selection only.** All numbers used to choose come from here.
- **Test 2021: scored once, after the choice below is committed.** Every candidate is reported on test, but the
  shipped checkpoint does not change because of test results, even if another candidate scores higher there.
- The grader's hidden windows are from 2023–24, which are not in the archive. Test 2021 is our closest
  stand-in, not a leaderboard estimate.

## Candidates (all are reported, none dropped)
| id | recipe |
|---|---|
| `b1_onestep`, `b1_onestep_s1`, `b1_onestep_s2` | one-step residual CNN, 40 epochs, lr 1e-3, seeds 0/1/2 |
| `b3_roll4`, `b3_roll4_s1`, `b3_roll4_s2` | K=4 rollout fine-tune of the same-seed b1 best checkpoint, 12 epochs, lr 3e-4 |

All other hyperparameters are the same (width 96, 5 blocks, batch 32, wd 1e-4). In each run, `best.pt` is picked
by the training-time val score (every 2nd val window).

## Evaluation (`python -m evaluation.evaluate --split val`)
All 354 val windows; shock tests on all 354 windows (`--shock-stride 1`); `--doy-shift 0`; CPU inference path.

## Gates: a candidate must pass all of these
1. 0 invalid windows (finite, rain ≥ 0, 233.15 ≤ t2m ≤ 333.15).
2. Day-4 skill vs persistence: per-window mean > 0 **and** the lower end of its 95% CI > 0.
3. Null shock exactly equal to no shock.
4. Both shock types localized in ≥ 95% of windows.
5. Median CPU 10-step rollout < 1 s.

## Ranking
Score S = RMSE-skill proxy (/30) + CSI proxy (/15) + anti-blur proxy (/10) + causality proxy (/15). Max 70, all on val.
- Highest S wins.
- If the top candidates are within **1.0 point**, pick the one with the higher **5th percentile of the 5-window
  grader draw** (the grader averages only 5 windows, so the downside matters more than the mean). If those also
  tie within 0.5, pick the higher mean shock-stable fraction.

## Reported for every candidate, val and test
Means with 95% moving-block-bootstrap CIs (block 10 windows, 2000 resamples), worst windows, 5-window grader-draw
spread, shock stability CIs with the unstable channel, region skill table, and the spread across seeds
(mean ± sd over 3 seeds) for each recipe.

## Outcome (added after the fact; the rule above was not edited)
- Val (`ed10825`): every candidate passed the gates. `b3_roll4` was selected: its S (45.92) was within 1.0 of `b3_roll4_s1` (45.21), and it had the higher 5-window p05 (2.83 vs 1.79).
  See `evaluation/results/selection_val.md`.
- Test (`e50d790`, scored once afterwards): `b3_roll4` S 46.77; all six candidates in `evaluation/results/report_test.md`.
- Later: `b3_roll4` was replaced by `e3_roll8_ocean` under the separate, pre-registered rule in
  [EXPERIMENTS.md](EXPERIMENTS.md) (val only), and `e3_roll8_ocean` by `e3_rainstab` in round 2 under the same rules.
