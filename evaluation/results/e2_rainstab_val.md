## e2_rainstab on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.299 | +0.299 | 0.532 / 0.436 / 0.277 | +0.171 |
| 4 | +0.097 | +0.261 | 0.341 / 0.228 / 0.277 | +0.088 |
| 8 | -0.059 | +0.204 | 0.281 / 0.212 / 0.277 | +0.005 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.565 / 1.889 / 1.722  (SS best +0.091, vs pers +0.172)
- tp: 6.7 / 9.366 / 6.838  (SS best +0.020, vs pers +0.285)
- u10: 1.452 / 1.973 / 1.67  (SS best +0.131, vs pers +0.264)
- v10: 1.337 / 1.939 / 1.46  (SS best +0.085, vs pers +0.311)
- msl: 243.5 / 328.5 / 278.4  (SS best +0.125, vs pers +0.259)
- tcwv: 5.345 / 7.366 / 6.138  (SS best +0.129, vs pers +0.274)

Aggregate: SS per-window +0.0451 (proxy 11.3/30), CSI skill +0.0696 (proxy 10.4/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0, 'tp': 0.8550000190734863, 'u10': 0.8949999809265137, 'v10': 0.9169999957084656, 'msl': 1.0420000553131104, 'tcwv': 0.921999990940094}
Invalid windows: 0; CPU 10-step rollout median 25 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.9/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.90), propagates 96%, stable 84% (max 17.79 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.90), propagates 71%, stable 88% (max 18.56 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.045 [+0.026, +0.063], worst -0.392
- skill day 1: +0.237 [+0.222, +0.251], worst -0.241
- skill day 4: +0.017 [-0.002, +0.038], worst -0.694
- skill day 8: -0.119 [-0.156, -0.085], worst -1.155
- CSI skill per window: +0.070 [+0.048, +0.089], worst -0.232
- day-4 skill vs persistence: +0.221 [+0.197, +0.242], worst -0.480; windows beating persistence 94% [91%, 96%]
- day-8 in-band fraction: 0.90 [0.88, 0.92], worst 0.50
- causality proxy per window: 13.9 [13.6, 14.1], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 1.7, median 21.6, p95 40.4
- warm_ocean: stable 84% [77%, 90%]; unstable by channel {'t2m': 0, 'tp': 56, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-08 17.79 std (tp), 2020-05-01 16.18 std (tp), 2020-05-09 14.89 std (tp)
- monsoon_stall: stable 88% [81%, 94%]; unstable by channel {'t2m': 0, 'tp': 43, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-05 18.56 std (tp), 2020-05-19 12.42 std (tp), 2020-06-07 11.98 std (tp)
- worst windows (per-window skill): 2020-05-04 -0.392, 2020-05-01 -0.380, 2020-10-28 -0.319, 2020-04-27 -0.300, 2020-02-11 -0.284
- worst windows (day-8 skill): 2020-10-28 -1.155, 2020-05-01 -1.136, 2020-04-27 -0.938, 2020-05-04 -0.894, 2020-04-26 -0.779

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.091 | +0.020 | +0.131 | +0.085 | +0.125 | +0.129 |
| all | 1152 | 8 | -0.094 | -0.100 | -0.032 | -0.065 | +0.001 | -0.064 |
| ocean (lsm<0.5) | 416 | 4 | -0.233 | +0.029 | +0.155 | +0.109 | +0.179 | +0.135 |
| ocean (lsm<0.5) | 416 | 8 | -0.582 | -0.105 | -0.022 | -0.063 | -0.037 | -0.059 |
| land below 1000 m | 391 | 4 | +0.068 | +0.011 | +0.089 | +0.028 | +0.191 | +0.144 |
| land below 1000 m | 391 | 8 | -0.139 | -0.105 | -0.062 | -0.091 | +0.020 | -0.055 |
| highlands >=2000 m | 287 | 4 | +0.150 | -0.006 | +0.023 | -0.015 | +0.089 | -0.112 |
| highlands >=2000 m | 287 | 8 | -0.001 | -0.042 | -0.046 | -0.035 | +0.007 | -0.286 |
| Bay of Bengal box | 144 | 4 | -0.290 | +0.028 | +0.164 | +0.132 | +0.210 | +0.129 |
| Bay of Bengal box | 144 | 8 | -0.621 | -0.132 | -0.053 | -0.092 | -0.024 | -0.083 |
| Arabian Sea box | 120 | 4 | -0.252 | +0.039 | +0.182 | +0.101 | +0.182 | +0.167 |
| Arabian Sea box | 120 | 8 | -0.621 | -0.066 | +0.008 | +0.000 | -0.021 | -0.043 |
| north of 28N | 360 | 4 | +0.134 | -0.049 | +0.016 | -0.017 | +0.088 | +0.016 |
| north of 28N | 360 | 8 | -0.012 | -0.044 | -0.044 | -0.041 | +0.006 | -0.121 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 54% of cells below 0; (18.5, 86.5) -0.75, bias -0.0918 sea 0 m; (17.5, 85.5) -0.73, bias -0.059 sea 0 m; (12.5, 86.5) -0.66, bias +0.0597 sea 0 m
- day 4 tp: 58% of cells below 0; (27.5, 73.5) -0.77, bias +0.236 land 275 m; (27.5, 74.5) -0.73, bias +0.351 land 336 m; (27.5, 72.5) -0.59, bias +0.042 land 217 m
- day 4 u10: 36% of cells below 0; (29.5, 95.5) -1.69, bias -0.103 land 3567 m; (35.5, 72.5) -1.52, bias +0.0988 land 3025 m; (26.5, 97.5) -1.39, bias +0.15 land 1110 m
- day 4 v10: 40% of cells below 0; (37.5, 71.5) -0.80, bias +0.0796 land 3637 m; (27.5, 86.5) -0.58, bias +0.0319 land 2434 m; (27.5, 85.5) -0.56, bias +0.0573 land 1642 m
- day 4 msl: 5% of cells below 0; (6.5, 96.5) -0.07, bias -2.51 sea 2 m; (6.5, 97.5) -0.06, bias -0.4 sea 0 m; (6.5, 98.5) -0.05, bias -10.5 sea 1 m
- day 4 tcwv: 25% of cells below 0; (33.5, 85.5) -0.62, bias +0.892 land 5088 m; (35.5, 82.5) -0.60, bias -0.0137 land 4950 m; (33.5, 86.5) -0.55, bias +0.794 land 5070 m
- day 8 t2m: 86% of cells below 0; (15.5, 82.5) -1.23, bias -0.444 sea 0 m; (17.5, 85.5) -1.20, bias -0.175 sea 0 m; (14.5, 82.5) -1.17, bias -0.431 sea 0 m
- day 8 tp: 93% of cells below 0; (20.5, 67.5) -1.06, bias +1.43 sea 0 m; (20.5, 66.5) -0.90, bias +1.16 sea 0 m; (19.5, 67.5) -0.67, bias +1.17 sea 0 m
- day 8 u10: 74% of cells below 0; (29.5, 95.5) -3.37, bias -0.261 land 3567 m; (35.5, 72.5) -2.74, bias +0.152 land 3025 m; (35.5, 73.5) -2.36, bias -0.0162 land 3315 m
- day 8 v10: 89% of cells below 0; (37.5, 71.5) -1.09, bias +0.0523 land 3637 m; (37.5, 70.5) -1.01, bias -0.0079 land 2435 m; (25.5, 98.5) -0.86, bias -0.0393 land 1723 m
- day 8 msl: 58% of cells below 0; (6.5, 83.5) -0.30, bias +46.6 sea 0 m; (9.5, 96.5) -0.27, bias -73.2 sea 0 m; (6.5, 80.5) -0.25, bias +19.7 land 172 m
- day 8 tcwv: 82% of cells below 0; (36.5, 86.5) -1.23, bias +1.48 land 4842 m; (32.5, 88.5) -1.16, bias +1.36 land 4913 m; (33.5, 85.5) -1.11, bias +1.42 land 5088 m
