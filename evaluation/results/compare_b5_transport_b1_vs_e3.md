# Candidates vs `e3_roll8_ocean` on val 2020 (354 windows, every window shocked)

Paired difference = candidate minus base per window (grader-style skill), mean [95% block-bootstrap CI].
Promotion rules 1-4 from docs/EXPERIMENTS.md; rule 5 (3 seeds) is checked only for candidates passing 1-4.

| id | S /70 (ΔS) | per-window skill | paired Δ skill [CI] | worst window | day-4 vs pers | CSI skill | heavy 25 mm d1 CSI / bias | day-8 in band | stable warm / stall | first >5σ day (warm) | rules 1-4 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| e3_roll8_ocean | 49.37 (+0.00) | +0.0590 | – | -0.241 | +0.229 | +0.0728 | 0.364 / 0.79 | 0.897 | 88.1% / 88.4% | {'1': 1, '3': 3, '4': 3, '5': 8, '6': 5, '7': 8, '8': 7, '9': 4, '10': 3} | base |
| b5_transport_b1 | 31.12 (-18.25) | -0.0038 | -0.0628 [-0.0747, -0.0497] | -0.377 | +0.184 | +0.0543 | 0.373 / 0.78 | 0.904 | 57.9% / 80.2% | {'1': 1, '2': 6, '3': 15, '4': 19, '5': 19, '6': 22, '7': 25, '8': 23, '9': 14, '10': 5} | fail: 2_S_margin, 3_paired_ci_above_0, 4a_stable_not_lower |

## Skill by lead (mean over channels)

| id | d1 | d2 | d3 | d4 | d5 | d6 | d7 | d8 | d9 | d10 |
|---|---|---|---|---|---|---|---|---|---|---|
| e3_roll8_ocean | +0.294 | +0.254 | +0.167 | +0.102 | +0.054 | +0.019 | -0.009 | -0.029 | -0.046 | -0.060 |
| b5_transport_b1 | +0.303 | +0.245 | +0.140 | +0.050 | -0.018 | -0.069 | -0.112 | -0.149 | -0.184 | -0.213 |

## Skill by channel at days 1 / 4 / 8

| id | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|
| e3_roll8_ocean | +0.21 / +0.10 / -0.06 | +0.28 / +0.03 / -0.06 | +0.29 / +0.13 / -0.01 | +0.32 / +0.09 / -0.03 | +0.35 / +0.13 / +0.03 | +0.31 / +0.13 / -0.05 |
| b5_transport_b1 | +0.20 / +0.02 / -0.25 | +0.29 / -0.02 / -0.17 | +0.32 / +0.10 / -0.12 | +0.34 / +0.04 / -0.15 | +0.35 / +0.08 / -0.07 | +0.32 / +0.08 / -0.14 |

## Day-8 spatial variance ratio (kit band 0.4-2.5)

| id | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|
| e3_roll8_ocean | 1.01 | 0.72 | 0.82 | 0.87 | 1.00 | 0.93 |
| b5_transport_b1 | 1.03 | 0.96 | 1.02 | 1.00 | 1.22 | 0.96 |

## Worst 3 windows (init day, grader-style skill)

- e3_roll8_ocean: 2020-10-28 -0.241; 2020-02-10 -0.221; 2020-02-11 -0.218
- b5_transport_b1: 2020-10-27 -0.377; 2020-10-28 -0.374; 2020-09-10 -0.319
