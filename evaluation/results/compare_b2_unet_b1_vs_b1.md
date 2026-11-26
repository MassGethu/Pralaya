# Candidates vs `b1_onestep` on val 2020 (354 windows, every window shocked)

Paired difference = candidate minus base per window (grader-style skill), mean [95% block-bootstrap CI].
Promotion rules 1-4 from docs/EXPERIMENTS.md; rule 5 (3 seeds) is checked only for candidates passing 1-4.

| id | S /70 (ΔS) | per-window skill | paired Δ skill [CI] | worst window | day-4 vs pers | CSI skill | heavy 25 mm d1 CSI / bias | day-8 in band | stable warm / stall | first >5σ day (warm) | rules 1-4 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| b1_onestep | 38.67 (+0.00) | +0.0161 | – | -0.351 | +0.187 | +0.0749 | 0.374 / 0.79 | 0.897 | 69.8% / 78.0% | {'2': 2, '3': 8, '4': 7, '5': 15, '6': 25, '7': 21, '8': 8, '9': 9, '10': 12} | base |
| b2_unet_b1 | 33.18 (-5.49) | -0.0074 | -0.0235 [-0.0360, -0.0084] | -0.357 | +0.176 | +0.0633 | 0.360 / 0.75 | 0.903 | 70.6% / 80.8% | {'2': 1, '3': 4, '4': 8, '5': 15, '6': 19, '7': 20, '8': 15, '9': 11, '10': 11} | fail: 2_S_margin, 3_paired_ci_above_0 |

## Skill by lead (mean over channels)

| id | d1 | d2 | d3 | d4 | d5 | d6 | d7 | d8 | d9 | d10 |
|---|---|---|---|---|---|---|---|---|---|---|
| b1_onestep | +0.311 | +0.249 | +0.141 | +0.056 | -0.008 | -0.050 | -0.088 | -0.121 | -0.149 | -0.170 |
| b2_unet_b1 | +0.311 | +0.250 | +0.136 | +0.043 | -0.027 | -0.081 | -0.123 | -0.159 | -0.183 | -0.200 |

## Skill by channel at days 1 / 4 / 8

| id | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|
| b1_onestep | +0.22 / +0.03 / -0.23 | +0.29 / -0.02 / -0.14 | +0.32 / +0.10 / -0.07 | +0.34 / +0.06 / -0.08 | +0.36 / +0.08 / -0.05 | +0.33 / +0.07 / -0.16 |
| b2_unet_b1 | +0.22 / +0.02 / -0.25 | +0.29 / -0.01 / -0.14 | +0.32 / +0.11 / -0.09 | +0.34 / +0.02 / -0.16 | +0.37 / +0.07 / -0.08 | +0.33 / +0.05 / -0.23 |

## Day-8 spatial variance ratio (kit band 0.4-2.5)

| id | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|
| b1_onestep | 0.97 | 0.84 | 0.96 | 0.88 | 1.00 | 0.96 |
| b2_unet_b1 | 1.12 | 0.92 | 1.00 | 1.11 | 1.05 | 0.99 |

## Worst 3 windows (init day, grader-style skill)

- b1_onestep: 2020-10-28 -0.350; 2020-05-06 -0.273; 2020-02-10 -0.270
- b2_unet_b1: 2020-12-18 -0.357; 2020-10-03 -0.353; 2020-10-04 -0.347
