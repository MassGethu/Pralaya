## e3_roll8_ocean_s1 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.297 | +0.297 | 0.533 / 0.436 / 0.277 | +0.172 |
| 4 | +0.096 | +0.259 | 0.346 / 0.228 / 0.277 | +0.095 |
| 8 | -0.038 | +0.219 | 0.279 / 0.212 / 0.277 | +0.002 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.567 / 1.889 / 1.722  (SS best +0.090, vs pers +0.170)
- tp: 6.584 / 9.366 / 6.838  (SS best +0.037, vs pers +0.297)
- u10: 1.461 / 1.973 / 1.67  (SS best +0.125, vs pers +0.260)
- v10: 1.325 / 1.939 / 1.46  (SS best +0.092, vs pers +0.316)
- msl: 242.9 / 328.5 / 278.4  (SS best +0.127, vs pers +0.261)
- tcwv: 5.503 / 7.366 / 6.138  (SS best +0.103, vs pers +0.253)

Aggregate: SS per-window +0.0586 (proxy 14.7/30), CSI skill +0.0663 (proxy 9.9/15), anti-blur proxy 10.0/10 (in-band 89%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 0.9959999918937683, 'tp': 0.5989999771118164, 'u10': 0.906000018119812, 'v10': 0.8180000185966492, 'msl': 0.9559999704360962, 'tcwv': 0.8880000114440918}
Invalid windows: 0; CPU 10-step rollout median 31 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.8/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.83), propagates 97%, stable 89% (max 15.92 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.89), propagates 56%, stable 95% (max 22.03 std), far frac max 0.001

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.059 [+0.044, +0.073], worst -0.269
- skill day 1: +0.239 [+0.224, +0.252], worst -0.270
- skill day 4: +0.021 [+0.006, +0.039], worst -0.851
- skill day 8: -0.085 [-0.109, -0.061], worst -0.727
- CSI skill per window: +0.066 [+0.047, +0.084], worst -0.233
- day-4 skill vs persistence: +0.225 [+0.204, +0.242], worst -0.337; windows beating persistence 96% [93%, 98%]
- day-8 in-band fraction: 0.89 [0.87, 0.90], worst 0.50
- causality proxy per window: 13.8 [13.6, 14.0], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 5.0, median 24.3, p95 41.0
- warm_ocean: stable 89% [83%, 94%]; unstable by channel {'t2m': 0, 'tp': 38, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-01 15.92 std (tp), 2020-05-07 15.07 std (tp), 2020-10-10 13.2 std (tp)
- monsoon_stall: stable 95% [92%, 97%]; unstable by channel {'t2m': 0, 'tp': 18, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-30 22.03 std (tp), 2020-05-28 20.71 std (tp), 2020-09-10 8.59 std (tp)
- worst windows (per-window skill): 2020-10-29 -0.269, 2020-02-11 -0.256, 2020-05-06 -0.219, 2020-02-10 -0.199, 2020-10-28 -0.199
- worst windows (day-8 skill): 2020-10-28 -0.727, 2020-05-01 -0.646, 2020-10-29 -0.637, 2020-10-03 -0.506, 2020-04-29 -0.457

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.090 | +0.037 | +0.125 | +0.092 | +0.127 | +0.103 |
| all | 1152 | 8 | -0.072 | -0.044 | -0.024 | -0.022 | +0.015 | -0.081 |
| ocean (lsm<0.5) | 416 | 4 | -0.144 | +0.048 | +0.145 | +0.114 | +0.189 | +0.117 |
| ocean (lsm<0.5) | 416 | 8 | -0.374 | -0.037 | -0.022 | -0.016 | -0.020 | -0.076 |
| land below 1000 m | 391 | 4 | +0.064 | +0.024 | +0.089 | +0.042 | +0.188 | +0.103 |
| land below 1000 m | 391 | 8 | -0.118 | -0.055 | -0.034 | -0.058 | +0.019 | -0.082 |
| highlands >=2000 m | 287 | 4 | +0.138 | +0.009 | +0.037 | +0.004 | +0.089 | -0.089 |
| highlands >=2000 m | 287 | 8 | -0.001 | -0.055 | -0.015 | -0.010 | +0.027 | -0.201 |
| Bay of Bengal box | 144 | 4 | -0.222 | +0.056 | +0.161 | +0.126 | +0.225 | +0.122 |
| Bay of Bengal box | 144 | 8 | -0.424 | -0.046 | -0.039 | -0.033 | -0.013 | -0.077 |
| Arabian Sea box | 120 | 4 | -0.167 | +0.059 | +0.175 | +0.124 | +0.190 | +0.125 |
| Arabian Sea box | 120 | 8 | -0.408 | -0.028 | +0.016 | +0.026 | +0.000 | -0.115 |
| north of 28N | 360 | 4 | +0.123 | -0.015 | +0.029 | -0.001 | +0.088 | +0.019 |
| north of 28N | 360 | 8 | -0.019 | -0.016 | -0.018 | -0.015 | +0.024 | -0.064 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 53% of cells below 0; (13.5, 85.5) -0.74, bias +0.0841 sea 0 m; (13.5, 86.5) -0.71, bias +0.0129 sea 0 m; (12.5, 85.5) -0.71, bias +0.0698 sea 0 m
- day 4 tp: 48% of cells below 0; (37.5, 95.5) -0.28, bias +0.0261 land 3361 m; (37.5, 96.5) -0.26, bias +0.166 land 3603 m; (37.5, 92.5) -0.22, bias -0.171 land 3124 m
- day 4 u10: 33% of cells below 0; (35.5, 72.5) -1.85, bias -0.167 land 3025 m; (35.5, 73.5) -1.46, bias -0.0405 land 3315 m; (29.5, 95.5) -1.32, bias -0.0167 land 3567 m
- day 4 v10: 35% of cells below 0; (37.5, 71.5) -0.69, bias +0.119 land 3637 m; (36.5, 71.5) -0.56, bias +0.115 land 3787 m; (36.5, 70.5) -0.56, bias +0.076 land 3087 m
- day 4 msl: 3% of cells below 0; (6.5, 95.5) -0.07, bias +10.9 sea 5 m; (6.5, 96.5) -0.05, bias +11.3 sea 2 m; (6.5, 100.5) -0.05, bias +4.56 land 106 m
- day 4 tcwv: 26% of cells below 0; (30.5, 83.5) -0.53, bias -0.705 land 5096 m; (35.5, 78.5) -0.52, bias -0.213 land 5170 m; (37.5, 72.5) -0.50, bias +1 land 4245 m
- day 8 t2m: 86% of cells below 0; (9.5, 75.5) -0.94, bias +0.083 sea 4 m; (13.5, 86.5) -0.92, bias +0.0592 sea 0 m; (13.5, 85.5) -0.89, bias +0.142 sea 0 m
- day 8 tp: 79% of cells below 0; (20.5, 65.5) -1.23, bias -0.172 sea 0 m; (20.5, 66.5) -0.96, bias -0.11 sea 0 m; (20.5, 67.5) -0.44, bias -0.167 sea 0 m
- day 8 u10: 73% of cells below 0; (35.5, 72.5) -2.99, bias -0.293 land 3025 m; (35.5, 73.5) -1.97, bias -0.105 land 3315 m; (25.5, 96.5) -1.80, bias +0.307 land 432 m
- day 8 v10: 76% of cells below 0; (27.5, 97.5) -0.96, bias -0.208 land 2097 m; (37.5, 71.5) -0.93, bias +0.164 land 3637 m; (27.5, 86.5) -0.84, bias -0.147 land 2434 m
- day 8 msl: 46% of cells below 0; (6.5, 95.5) -0.20, bias +43.4 sea 5 m; (6.5, 100.5) -0.19, bias +12.6 land 106 m; (6.5, 94.5) -0.16, bias +28.9 sea 4 m
- day 8 tcwv: 84% of cells below 0; (30.5, 83.5) -1.03, bias -1.31 land 5096 m; (37.5, 72.5) -0.96, bias +1.92 land 4245 m; (30.5, 84.5) -0.83, bias -1.04 land 5130 m
