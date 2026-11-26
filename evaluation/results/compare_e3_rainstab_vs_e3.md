# Candidates vs `e3_roll8_ocean` on val 2020 (354 windows, every window shocked)

Paired difference = candidate minus base per window (grader-style skill), mean [95% block-bootstrap CI].
Promotion rules 1-4 from docs/EXPERIMENTS.md; rule 5 (3 seeds) is checked only for candidates passing 1-4.

| id | S /70 (ΔS) | per-window skill | paired Δ skill [CI] | worst window | day-4 vs pers | CSI skill | heavy 25 mm d1 CSI / bias | day-8 in band | stable warm / stall | first >5σ day (warm) | rules 1-4 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| e3_roll8_ocean | 49.37 (+0.00) | +0.0590 | – | -0.241 | +0.229 | +0.0728 | 0.364 / 0.79 | 0.897 | 88.1% / 88.4% | {'1': 1, '3': 3, '4': 3, '5': 8, '6': 5, '7': 8, '8': 7, '9': 4, '10': 3} | base |
| e3_rainstab | 51.11 (+1.74) | +0.0644 | +0.0055 [+0.0014, +0.0097] | -0.253 | +0.229 | +0.0738 | 0.365 / 0.79 | 0.885 | 92.9% / 94.9% | {'1': 1, '3': 3, '4': 4, '5': 1, '6': 3, '7': 1, '8': 7, '9': 4, '10': 1} | **PASS** |

## Skill by lead (mean over channels)

| id | d1 | d2 | d3 | d4 | d5 | d6 | d7 | d8 | d9 | d10 |
|---|---|---|---|---|---|---|---|---|---|---|
| e3_roll8_ocean | +0.294 | +0.254 | +0.167 | +0.102 | +0.054 | +0.019 | -0.009 | -0.029 | -0.046 | -0.060 |
| e3_rainstab | +0.295 | +0.256 | +0.171 | +0.104 | +0.056 | +0.025 | +0.001 | -0.015 | -0.031 | -0.047 |

## Skill by channel at days 1 / 4 / 8

| id | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|
| e3_roll8_ocean | +0.21 / +0.10 / -0.06 | +0.28 / +0.03 / -0.06 | +0.29 / +0.13 / -0.01 | +0.32 / +0.09 / -0.03 | +0.35 / +0.13 / +0.03 | +0.31 / +0.13 / -0.05 |
| e3_rainstab | +0.21 / +0.10 / -0.06 | +0.28 / +0.04 / -0.03 | +0.29 / +0.14 / +0.01 | +0.32 / +0.10 / -0.01 | +0.35 / +0.13 / +0.03 | +0.31 / +0.13 / -0.04 |

## Day-8 spatial variance ratio (kit band 0.4-2.5)

| id | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|
| e3_roll8_ocean | 1.01 | 0.72 | 0.82 | 0.87 | 1.00 | 0.93 |
| e3_rainstab | 1.01 | 0.61 | 0.80 | 0.83 | 0.98 | 0.90 |

## Worst 3 windows (init day, grader-style skill)

- e3_roll8_ocean: 2020-10-28 -0.241; 2020-02-10 -0.221; 2020-02-11 -0.218
- e3_rainstab: 2020-02-11 -0.253; 2020-10-28 -0.211; 2020-02-10 -0.203
