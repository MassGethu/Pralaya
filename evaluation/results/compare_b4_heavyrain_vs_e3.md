# Candidates vs `e3_roll8_ocean` on val 2020 (354 windows, every window shocked)

Paired difference = candidate minus base per window (grader-style skill), mean [95% block-bootstrap CI].
Promotion rules 1-4 from docs/EXPERIMENTS.md; rule 5 (3 seeds) is checked only for candidates passing 1-4.

| id | S /70 (ΔS) | per-window skill | paired Δ skill [CI] | worst window | day-4 vs pers | CSI skill | heavy 25 mm d1 CSI / bias | day-8 in band | stable warm / stall | first >5σ day (warm) | rules 1-4 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| e3_roll8_ocean | 49.37 (+0.00) | +0.0590 | – | -0.241 | +0.229 | +0.0728 | 0.364 / 0.79 | 0.897 | 88.1% / 88.4% | {'1': 1, '3': 3, '4': 3, '5': 8, '6': 5, '7': 8, '8': 7, '9': 4, '10': 3} | base |
| b4_heavyrain | 46.14 (-3.23) | +0.0320 | -0.0270 [-0.0331, -0.0202] | -0.305 | +0.213 | +0.0953 | 0.364 / 0.81 | 0.927 | 88.4% / 91.0% | {'3': 2, '4': 2, '5': 6, '6': 8, '7': 9, '8': 4, '9': 3, '10': 7} | fail: 2_S_margin, 3_paired_ci_above_0 |

## Skill by lead (mean over channels)

| id | d1 | d2 | d3 | d4 | d5 | d6 | d7 | d8 | d9 | d10 |
|---|---|---|---|---|---|---|---|---|---|---|
| e3_roll8_ocean | +0.294 | +0.254 | +0.167 | +0.102 | +0.054 | +0.019 | -0.009 | -0.029 | -0.046 | -0.060 |
| b4_heavyrain | +0.292 | +0.250 | +0.161 | +0.093 | +0.042 | +0.002 | -0.031 | -0.056 | -0.076 | -0.095 |

## Skill by channel at days 1 / 4 / 8

| id | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|
| e3_roll8_ocean | +0.21 / +0.10 / -0.06 | +0.28 / +0.03 / -0.06 | +0.29 / +0.13 / -0.01 | +0.32 / +0.09 / -0.03 | +0.35 / +0.13 / +0.03 | +0.31 / +0.13 / -0.05 |
| b4_heavyrain | +0.21 / +0.09 / -0.08 | +0.28 / -0.00 / -0.13 | +0.29 / +0.13 / -0.03 | +0.32 / +0.09 / -0.05 | +0.35 / +0.13 / +0.01 | +0.31 / +0.13 / -0.06 |

## Day-8 spatial variance ratio (kit band 0.4-2.5)

| id | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|
| e3_roll8_ocean | 1.01 | 0.72 | 0.82 | 0.87 | 1.00 | 0.93 |
| b4_heavyrain | 1.03 | 1.78 | 0.85 | 0.91 | 1.00 | 0.95 |

## Worst 3 windows (init day, grader-style skill)

- e3_roll8_ocean: 2020-10-28 -0.241; 2020-02-10 -0.221; 2020-02-11 -0.218
- b4_heavyrain: 2020-10-28 -0.305; 2020-02-10 -0.299; 2020-02-11 -0.298
