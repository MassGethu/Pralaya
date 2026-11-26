## e3_roll8_ocean on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.298 | +0.298 | 0.533 / 0.436 / 0.277 | +0.172 |
| 4 | +0.118 | +0.278 | 0.344 / 0.228 / 0.277 | +0.092 |
| 8 | +0.034 | +0.273 | 0.291 / 0.212 / 0.277 | +0.019 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.504 / 1.889 / 1.722  (SS best +0.126, vs pers +0.203)
- tp: 6.5 / 9.366 / 6.838  (SS best +0.049, vs pers +0.306)
- u10: 1.415 / 1.973 / 1.67  (SS best +0.153, vs pers +0.283)
- v10: 1.306 / 1.939 / 1.46  (SS best +0.106, vs pers +0.326)
- msl: 239.5 / 328.5 / 278.4  (SS best +0.140, vs pers +0.271)
- tcwv: 5.308 / 7.366 / 6.138  (SS best +0.135, vs pers +0.279)

Aggregate: SS per-window +0.0946 (proxy 23.6/30), CSI skill +0.0695 (proxy 10.4/15), anti-blur proxy 10.0/10 (in-band 85%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.008, 'tp': 0.478, 'u10': 0.748, 'v10': 0.744, 'msl': 0.958, 'tcwv': 0.891}
Invalid windows: 0; CPU 10-step rollout median 54 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.3/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.90), propagates 79%, stable 99% (max 5.58 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.92), propagates 31%, stable 99% (max 6.65 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.095 [+0.083, +0.107], worst -0.157
- skill day 1: +0.240 [+0.226, +0.253], worst -0.156
- skill day 4: +0.049 [+0.033, +0.068], worst -0.508
- skill day 8: -0.006 [-0.021, +0.009], worst -0.342
- CSI skill per window: +0.069 [+0.050, +0.088], worst -0.236
- day-4 skill vs persistence: +0.250 [+0.233, +0.266], worst -0.097; windows beating persistence 99% [97%, 100%]
- day-8 in-band fraction: 0.85 [0.82, 0.88], worst 0.33
- causality proxy per window: 13.3 [13.0, 13.5], worst 11.2
- grader-like draw (5 random windows), forecast points /45: p05 16.8, median 33.6, p95 45.0
- warm_ocean: stable 99% [98%, 100%]; unstable by channel {'t2m': 0, 'tp': 3, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-11-19 5.58 std (tp), 2020-05-11 5.26 std (tp), 2020-05-13 5.1 std (tp)
- monsoon_stall: stable 99% [97%, 100%]; unstable by channel {'t2m': 0, 'tp': 5, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-09-06 6.65 std (tp), 2020-06-11 5.98 std (tp), 2020-06-25 5.57 std (tp)
- worst windows (per-window skill): 2020-02-10 -0.157, 2020-02-11 -0.132, 2020-10-03 -0.091, 2020-09-10 -0.089, 2020-05-04 -0.073
- worst windows (day-8 skill): 2020-10-03 -0.342, 2020-09-11 -0.314, 2020-10-02 -0.288, 2020-09-10 -0.287, 2020-05-01 -0.281

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.126 | +0.049 | +0.153 | +0.106 | +0.140 | +0.135 |
| all | 1152 | 8 | +0.048 | +0.011 | +0.044 | +0.027 | +0.049 | +0.023 |
| ocean (lsm<0.5) | 416 | 4 | +0.057 | +0.060 | +0.180 | +0.130 | +0.201 | +0.140 |
| ocean (lsm<0.5) | 416 | 8 | +0.039 | +0.009 | +0.047 | +0.031 | +0.055 | +0.027 |
| land below 1000 m | 391 | 4 | +0.090 | +0.037 | +0.093 | +0.047 | +0.195 | +0.147 |
| land below 1000 m | 391 | 8 | +0.034 | +0.014 | +0.041 | +0.017 | +0.072 | +0.020 |
| highlands >=2000 m | 287 | 4 | +0.164 | +0.022 | +0.055 | +0.006 | +0.105 | -0.053 |
| highlands >=2000 m | 287 | 8 | +0.062 | +0.017 | +0.016 | +0.011 | +0.039 | -0.007 |
| Bay of Bengal box | 144 | 4 | +0.005 | +0.076 | +0.205 | +0.161 | +0.230 | +0.139 |
| Bay of Bengal box | 144 | 8 | +0.005 | +0.008 | +0.040 | +0.042 | +0.058 | +0.034 |
| Arabian Sea box | 120 | 4 | -0.008 | +0.062 | +0.193 | +0.120 | +0.202 | +0.176 |
| Arabian Sea box | 120 | 8 | -0.011 | +0.015 | +0.071 | +0.034 | +0.073 | +0.014 |
| north of 28N | 360 | 4 | +0.149 | -0.005 | +0.038 | +0.003 | +0.104 | +0.042 |
| north of 28N | 360 | 8 | +0.056 | +0.014 | +0.016 | +0.009 | +0.040 | +0.015 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 27% of cells below 0; (14.5, 83.5) -0.22, bias -0.0274 sea 0 m; (13.5, 83.5) -0.21, bias -0.0074 sea 0 m; (15.5, 83.5) -0.20, bias -0.0439 sea 0 m
- day 4 tp: 39% of cells below 0; (25.5, 76.5) -0.33, bias +0.668 land 314 m; (20.5, 67.5) -0.30, bias -0.235 sea 0 m; (25.5, 75.5) -0.27, bias +0.458 land 350 m
- day 4 u10: 29% of cells below 0; (35.5, 72.5) -1.03, bias +0.0825 land 3025 m; (35.5, 73.5) -0.94, bias -0.0084 land 3315 m; (29.5, 95.5) -0.86, bias -0.0403 land 3567 m
- day 4 v10: 29% of cells below 0; (37.5, 71.5) -0.54, bias +0.0503 land 3637 m; (27.5, 96.5) -0.41, bias +0.0165 land 1479 m; (37.5, 70.5) -0.38, bias +0.0345 land 2435 m
- day 4 msl: 1% of cells below 0; (6.5, 97.5) -0.01, bias -5.04 sea 0 m; (6.5, 96.5) -0.01, bias -4.54 sea 2 m; (37.5, 65.5) -0.01, bias -135 land 377 m
- day 4 tcwv: 24% of cells below 0; (35.5, 78.5) -0.36, bias -0.248 land 5170 m; (35.5, 79.5) -0.30, bias -0.0591 land 4987 m; (35.5, 82.5) -0.30, bias -0.0571 land 4950 m
- day 8 t2m: 31% of cells below 0; (17.5, 75.5) -0.15, bias -0.138 land 556 m; (16.5, 75.5) -0.15, bias -0.0322 land 576 m; (18.5, 75.5) -0.14, bias -0.136 land 563 m
- day 8 tp: 36% of cells below 0; (17.5, 95.5) -0.06, bias +1.4 land 82 m; (16.5, 95.5) -0.05, bias +1.34 land 11 m; (15.5, 97.5) -0.05, bias +2.04 sea 86 m
- day 8 u10: 24% of cells below 0; (35.5, 73.5) -0.36, bias -0.023 land 3315 m; (29.5, 95.5) -0.33, bias -0.0346 land 3567 m; (35.5, 72.5) -0.31, bias +0.0362 land 3025 m
- day 8 v10: 27% of cells below 0; (37.5, 71.5) -0.16, bias +0.0106 land 3637 m; (27.5, 86.5) -0.13, bias -0.0252 land 2434 m; (25.5, 98.5) -0.11, bias -0.0098 land 1723 m
- day 8 msl: 11% of cells below 0; (9.5, 96.5) -0.07, bias -41.2 sea 0 m; (10.5, 96.5) -0.07, bias -45.6 sea 0 m; (11.5, 95.5) -0.06, bias -48.6 sea 0 m
- day 8 tcwv: 27% of cells below 0; (33.5, 85.5) -0.12, bias +0.36 land 5088 m; (33.5, 84.5) -0.11, bias +0.35 land 5005 m; (37.5, 72.5) -0.11, bias +0.443 land 4245 m
