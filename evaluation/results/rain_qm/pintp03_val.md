## e3_rainstab on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.298 | +0.298 | 0.534 / 0.436 / 0.277 | +0.174 |
| 4 | +0.118 | +0.278 | 0.347 / 0.228 / 0.277 | +0.097 |
| 8 | +0.030 | +0.270 | 0.294 / 0.212 / 0.277 | +0.023 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.503 / 1.889 / 1.722  (SS best +0.127, vs pers +0.204)
- tp: 6.558 / 9.366 / 6.838  (SS best +0.041, vs pers +0.300)
- u10: 1.415 / 1.973 / 1.67  (SS best +0.153, vs pers +0.283)
- v10: 1.301 / 1.939 / 1.46  (SS best +0.109, vs pers +0.329)
- msl: 239.8 / 328.5 / 278.4  (SS best +0.139, vs pers +0.270)
- tcwv: 5.291 / 7.366 / 6.138  (SS best +0.138, vs pers +0.282)

Aggregate: SS per-window +0.0917 (proxy 22.9/30), CSI skill +0.0738 (proxy 11.1/15), anti-blur proxy 10.0/10 (in-band 87%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.008, 'tp': 0.608, 'u10': 0.741, 'v10': 0.734, 'msl': 0.948, 'tcwv': 0.885}
Invalid windows: 0; CPU 10-step rollout median 36 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.9/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.89), propagates 98%, stable 93% (max 12.89 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.90), propagates 57%, stable 95% (max 8.53 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.092 [+0.080, +0.104], worst -0.187
- skill day 1: +0.239 [+0.224, +0.252], worst -0.180
- skill day 4: +0.048 [+0.032, +0.066], worst -0.643
- skill day 8: -0.012 [-0.028, +0.005], worst -0.426
- CSI skill per window: +0.074 [+0.055, +0.092], worst -0.265
- day-4 skill vs persistence: +0.248 [+0.231, +0.264], worst -0.162; windows beating persistence 99% [97%, 100%]
- day-8 in-band fraction: 0.87 [0.84, 0.90], worst 0.33
- causality proxy per window: 13.9 [13.7, 14.2], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 15.4, median 33.4, p95 45.0
- warm_ocean: stable 93% [88%, 97%]; unstable by channel {'t2m': 0, 'tp': 25, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-10 12.89 std (tp), 2020-05-06 12.09 std (tp), 2020-05-08 11.99 std (tp)
- monsoon_stall: stable 95% [91%, 98%]; unstable by channel {'t2m': 0, 'tp': 18, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-25 8.53 std (tp), 2020-06-05 8.49 std (tp), 2020-05-31 7.79 std (tp)
- worst windows (per-window skill): 2020-02-11 -0.187, 2020-02-10 -0.165, 2020-10-03 -0.098, 2020-05-06 -0.087, 2020-09-10 -0.075
- worst windows (day-8 skill): 2020-10-28 -0.426, 2020-10-03 -0.362, 2020-09-11 -0.316, 2020-10-02 -0.305, 2020-09-10 -0.282

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.127 | +0.041 | +0.153 | +0.109 | +0.139 | +0.138 |
| all | 1152 | 8 | +0.047 | -0.025 | +0.048 | +0.029 | +0.048 | +0.030 |
| ocean (lsm<0.5) | 416 | 4 | +0.060 | +0.052 | +0.179 | +0.134 | +0.199 | +0.143 |
| ocean (lsm<0.5) | 416 | 8 | +0.045 | -0.023 | +0.052 | +0.033 | +0.056 | +0.031 |
| land below 1000 m | 391 | 4 | +0.091 | +0.031 | +0.102 | +0.052 | +0.195 | +0.149 |
| land below 1000 m | 391 | 8 | +0.033 | -0.032 | +0.045 | +0.019 | +0.072 | +0.031 |
| highlands >=2000 m | 287 | 4 | +0.164 | +0.006 | +0.054 | +0.005 | +0.104 | -0.053 |
| highlands >=2000 m | 287 | 8 | +0.061 | -0.009 | +0.015 | +0.011 | +0.038 | -0.020 |
| Bay of Bengal box | 144 | 4 | +0.007 | +0.065 | +0.204 | +0.165 | +0.222 | +0.135 |
| Bay of Bengal box | 144 | 8 | +0.006 | -0.034 | +0.050 | +0.043 | +0.058 | +0.031 |
| Arabian Sea box | 120 | 4 | -0.003 | +0.056 | +0.196 | +0.120 | +0.211 | +0.178 |
| Arabian Sea box | 120 | 8 | -0.006 | +0.002 | +0.078 | +0.034 | +0.078 | +0.021 |
| north of 28N | 360 | 4 | +0.149 | -0.023 | +0.039 | +0.003 | +0.102 | +0.041 |
| north of 28N | 360 | 8 | +0.054 | -0.012 | +0.016 | +0.010 | +0.037 | +0.010 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 27% of cells below 0; (14.5, 83.5) -0.23, bias -0.0179 sea 0 m; (13.5, 83.5) -0.21, bias +0.0003 sea 0 m; (15.5, 83.5) -0.20, bias -0.0338 sea 0 m
- day 4 tp: 48% of cells below 0; (27.5, 74.5) -0.52, bias +0.175 land 336 m; (20.5, 67.5) -0.52, bias +0.121 sea 0 m; (25.5, 76.5) -0.44, bias +0.949 land 314 m
- day 4 u10: 28% of cells below 0; (35.5, 72.5) -1.06, bias +0.0789 land 3025 m; (29.5, 95.5) -1.00, bias -0.0672 land 3567 m; (35.5, 73.5) -0.97, bias -0.0105 land 3315 m
- day 4 v10: 28% of cells below 0; (37.5, 71.5) -0.52, bias +0.037 land 3637 m; (37.5, 70.5) -0.40, bias +0.0215 land 2435 m; (27.5, 86.5) -0.38, bias -0.0318 land 2434 m
- day 4 msl: 0% of cells below 0; (37.5, 65.5) -0.01, bias -135 land 377 m; (37.5, 71.5) -0.01, bias -40.4 land 3637 m; (6.5, 97.5) -0.01, bias -4.26 sea 0 m
- day 4 tcwv: 23% of cells below 0; (35.5, 78.5) -0.32, bias -0.168 land 5170 m; (36.5, 86.5) -0.30, bias +0.615 land 4842 m; (35.5, 79.5) -0.29, bias +0.0413 land 4987 m
- day 8 t2m: 29% of cells below 0; (16.5, 75.5) -0.15, bias +0.0093 land 576 m; (17.5, 75.5) -0.14, bias -0.102 land 556 m; (18.5, 75.5) -0.14, bias -0.1 land 563 m
- day 8 tp: 81% of cells below 0; (37.5, 78.5) -0.34, bias +0.536 land 2067 m; (37.5, 77.5) -0.27, bias +0.594 land 2491 m; (20.5, 66.5) -0.24, bias -0.0925 sea 0 m
- day 8 u10: 24% of cells below 0; (29.5, 95.5) -0.51, bias -0.0659 land 3567 m; (35.5, 73.5) -0.46, bias -0.0289 land 3315 m; (35.5, 72.5) -0.42, bias +0.038 land 3025 m
- day 8 v10: 26% of cells below 0; (37.5, 71.5) -0.19, bias +0.0063 land 3637 m; (25.5, 98.5) -0.13, bias -0.0236 land 1723 m; (27.5, 86.5) -0.13, bias -0.0376 land 2434 m
- day 8 msl: 12% of cells below 0; (6.5, 80.5) -0.09, bias +3.92 land 172 m; (7.5, 80.5) -0.09, bias +6.61 land 195 m; (9.5, 96.5) -0.07, bias -43.4 sea 0 m
- day 8 tcwv: 29% of cells below 0; (33.5, 85.5) -0.18, bias +0.363 land 5088 m; (31.5, 82.5) -0.17, bias +0.416 land 5122 m; (32.5, 84.5) -0.16, bias +0.296 land 4904 m
