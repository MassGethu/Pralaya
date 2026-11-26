# Candidates vs `e3_roll8_ocean` on val 2020 (354 windows, every window shocked)

Paired difference = candidate minus base per window (grader-style skill), mean [95% block-bootstrap CI].
Promotion rules 1-4 from docs/EXPERIMENTS.md; rule 5 (3 seeds) is checked only for candidates passing 1-4.

| id | S /70 (ΔS) | per-window skill | paired Δ skill [CI] | worst window | day-4 vs pers | CSI skill | heavy 25 mm d1 CSI / bias | day-8 in band | stable warm / stall | first >5σ day (warm) | rules 1-4 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| e3_roll8_ocean | 49.37 (+0.00) | +0.0590 | – | -0.241 | +0.229 | +0.0728 | 0.364 / 0.79 | 0.897 | 88.1% / 88.4% | {'1': 1, '3': 3, '4': 3, '5': 8, '6': 5, '7': 8, '8': 7, '9': 4, '10': 3} | base |
| b2_unet_b1 | 33.18 (-16.19) | -0.0074 | -0.0664 [-0.0795, -0.0512] | -0.357 | +0.176 | +0.0633 | 0.360 / 0.75 | 0.903 | 70.6% / 80.8% | {'2': 1, '3': 4, '4': 8, '5': 15, '6': 19, '7': 20, '8': 15, '9': 11, '10': 11} | fail: 2_S_margin, 3_paired_ci_above_0, 4a_stable_not_lower |

## Skill by lead (mean over channels)

| id | d1 | d2 | d3 | d4 | d5 | d6 | d7 | d8 | d9 | d10 |
|---|---|---|---|---|---|---|---|---|---|---|
| e3_roll8_ocean | +0.294 | +0.254 | +0.167 | +0.102 | +0.054 | +0.019 | -0.009 | -0.029 | -0.046 | -0.060 |
| b2_unet_b1 | +0.311 | +0.250 | +0.136 | +0.043 | -0.027 | -0.081 | -0.123 | -0.159 | -0.183 | -0.200 |

## Skill by channel at days 1 / 4 / 8

| id | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|
| e3_roll8_ocean | +0.21 / +0.10 / -0.06 | +0.28 / +0.03 / -0.06 | +0.29 / +0.13 / -0.01 | +0.32 / +0.09 / -0.03 | +0.35 / +0.13 / +0.03 | +0.31 / +0.13 / -0.05 |
| b2_unet_b1 | +0.22 / +0.02 / -0.25 | +0.29 / -0.01 / -0.14 | +0.32 / +0.11 / -0.09 | +0.34 / +0.02 / -0.16 | +0.37 / +0.07 / -0.08 | +0.33 / +0.05 / -0.23 |

## Day-8 spatial variance ratio (kit band 0.4-2.5)

| id | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|
| e3_roll8_ocean | 1.01 | 0.72 | 0.82 | 0.87 | 1.00 | 0.93 |
| b2_unet_b1 | 1.12 | 0.92 | 1.00 | 1.11 | 1.05 | 0.99 |

## Worst 3 windows (init day, grader-style skill)

- e3_roll8_ocean: 2020-10-28 -0.241; 2020-02-10 -0.221; 2020-02-11 -0.218
- b2_unet_b1: 2020-12-18 -0.357; 2020-10-03 -0.353; 2020-10-04 -0.347
