## a3_anomaly on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.291 | +0.291 | 0.538 / 0.436 / 0.277 | +0.182 |
| 4 | +0.108 | +0.270 | 0.349 / 0.228 / 0.277 | +0.099 |
| 8 | -0.013 | +0.238 | 0.300 / 0.212 / 0.277 | +0.032 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.511 / 1.889 / 1.722  (SS best +0.122, vs pers +0.200)
- tp: 6.615 / 9.366 / 6.838  (SS best +0.033, vs pers +0.294)
- u10: 1.437 / 1.973 / 1.67  (SS best +0.140, vs pers +0.272)
- v10: 1.316 / 1.939 / 1.46  (SS best +0.099, vs pers +0.321)
- msl: 241.7 / 328.5 / 278.4  (SS best +0.132, vs pers +0.264)
- tcwv: 5.401 / 7.366 / 6.138  (SS best +0.120, vs pers +0.267)

Aggregate: SS per-window +0.0690 (proxy 17.3/30), CSI skill +0.0782 (proxy 11.7/15), anti-blur proxy 10.0/10 (in-band 89%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0019999742507935, 'tp': 0.6570000052452087, 'u10': 0.8100000023841858, 'v10': 0.8309999704360962, 'msl': 0.9679999947547913, 'tcwv': 0.9120000004768372}
Invalid windows: 0; CPU 10-step rollout median 55 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.6/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.95, min 0.70), propagates 83%, stable 93% (max 12.91 std), far frac max 0.002
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.92), propagates 53%, stable 98% (max 11.39 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.069 [+0.055, +0.082], worst -0.279
- skill day 1: +0.232 [+0.217, +0.244], worst -0.264
- skill day 4: +0.033 [+0.016, +0.050], worst -0.937
- skill day 8: -0.058 [-0.082, -0.034], worst -0.621
- CSI skill per window: +0.078 [+0.058, +0.100], worst -0.240
- day-4 skill vs persistence: +0.233 [+0.212, +0.250], worst -0.133; windows beating persistence 96% [94%, 98%]
- day-8 in-band fraction: 0.89 [0.87, 0.91], worst 0.50
- causality proxy per window: 13.6 [13.4, 13.9], worst 11.2
- grader-like draw (5 random windows), forecast points /45: p05 8.3, median 28.4, p95 43.2
- warm_ocean: stable 93% [87%, 97%]; unstable by channel {'t2m': 0, 'tp': 25, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-15 12.91 std (tp), 2020-05-08 7.65 std (tp), 2020-05-14 7.01 std (tp)
- monsoon_stall: stable 98% [96%, 99%]; unstable by channel {'t2m': 0, 'tp': 8, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-30 11.39 std (tp), 2020-09-20 7.65 std (tp), 2020-09-03 7.35 std (tp)
- worst windows (per-window skill): 2020-02-11 -0.279, 2020-05-04 -0.233, 2020-11-29 -0.189, 2020-10-03 -0.188, 2020-02-10 -0.185
- worst windows (day-8 skill): 2020-05-04 -0.621, 2020-10-03 -0.514, 2020-10-28 -0.480, 2020-10-02 -0.476, 2020-05-01 -0.457

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.123 | +0.033 | +0.140 | +0.099 | +0.132 | +0.120 |
| all | 1152 | 8 | -0.013 | -0.032 | +0.007 | -0.018 | +0.031 | -0.053 |
| ocean (lsm<0.5) | 416 | 4 | -0.156 | +0.038 | +0.161 | +0.120 | +0.190 | +0.115 |
| ocean (lsm<0.5) | 416 | 8 | -0.275 | -0.033 | +0.010 | -0.015 | -0.001 | -0.068 |
| land below 1000 m | 391 | 4 | +0.109 | +0.029 | +0.101 | +0.052 | +0.197 | +0.141 |
| land below 1000 m | 391 | 8 | -0.046 | -0.035 | -0.004 | -0.033 | +0.038 | -0.034 |
| highlands >=2000 m | 287 | 4 | +0.166 | +0.009 | +0.046 | +0.000 | +0.092 | -0.063 |
| highlands >=2000 m | 287 | 8 | +0.038 | -0.012 | +0.005 | -0.018 | +0.041 | -0.106 |
| Bay of Bengal box | 144 | 4 | -0.244 | +0.023 | +0.169 | +0.130 | +0.219 | +0.086 |
| Bay of Bengal box | 144 | 8 | -0.383 | -0.056 | -0.013 | -0.025 | +0.004 | -0.078 |
| Arabian Sea box | 120 | 4 | -0.121 | +0.060 | +0.177 | +0.142 | +0.185 | +0.150 |
| Arabian Sea box | 120 | 8 | -0.256 | -0.012 | +0.031 | +0.013 | +0.010 | -0.087 |
| north of 28N | 360 | 4 | +0.152 | -0.024 | +0.033 | -0.002 | +0.091 | +0.047 |
| north of 28N | 360 | 8 | +0.028 | -0.008 | -0.001 | -0.017 | +0.032 | +0.005 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 42% of cells below 0; (14.5, 84.5) -0.76, bias -0.0493 sea 0 m; (14.5, 83.5) -0.73, bias -0.0315 sea 0 m; (13.5, 84.5) -0.67, bias -0.0867 sea 0 m
- day 4 tp: 49% of cells below 0; (27.5, 74.5) -0.42, bias +0.0861 land 336 m; (19.5, 67.5) -0.34, bias +0.222 sea 0 m; (25.5, 68.5) -0.34, bias -0.142 land 63 m
- day 4 u10: 29% of cells below 0; (26.5, 97.5) -1.45, bias +0.0693 land 1110 m; (29.5, 95.5) -1.30, bias -0.0453 land 3567 m; (35.5, 71.5) -1.17, bias -0.0113 land 3002 m
- day 4 v10: 29% of cells below 0; (37.5, 70.5) -0.84, bias -0.214 land 2435 m; (37.5, 71.5) -0.69, bias -0.138 land 3637 m; (26.5, 95.5) -0.62, bias +0.0993 land 742 m
- day 4 msl: 1% of cells below 0; (36.5, 70.5) -0.03, bias -84.1 land 3087 m; (6.5, 95.5) -0.02, bias +9.75 sea 5 m; (35.5, 68.5) -0.02, bias -95.4 land 2321 m
- day 4 tcwv: 23% of cells below 0; (35.5, 78.5) -0.50, bias -0.299 land 5170 m; (36.5, 86.5) -0.47, bias +0.848 land 4842 m; (36.5, 87.5) -0.45, bias +0.812 land 4859 m
- day 8 t2m: 76% of cells below 0; (14.5, 81.5) -0.80, bias -0.336 sea 0 m; (8.5, 82.5) -0.78, bias -0.494 sea 1 m; (13.5, 81.5) -0.77, bias -0.231 sea 0 m
- day 8 tp: 82% of cells below 0; (16.5, 65.5) -0.35, bias -0.257 sea 0 m; (17.5, 89.5) -0.27, bias +1.66 sea 0 m; (21.5, 95.5) -0.25, bias +0.858 land 253 m
- day 8 u10: 55% of cells below 0; (27.5, 97.5) -1.58, bias +0.0932 land 2097 m; (26.5, 97.5) -1.54, bias +0.131 land 1110 m; (29.5, 95.5) -1.44, bias -0.0777 land 3567 m
- day 8 v10: 77% of cells below 0; (37.5, 71.5) -1.53, bias -0.294 land 3637 m; (37.5, 70.5) -1.43, bias -0.363 land 2435 m; (26.5, 95.5) -0.73, bias +0.0915 land 742 m
- day 8 msl: 36% of cells below 0; (6.5, 95.5) -0.17, bias -1.51 sea 5 m; (33.5, 72.5) -0.14, bias -182 land 570 m; (7.5, 95.5) -0.13, bias -2.24 sea 0 m
- day 8 tcwv: 79% of cells below 0; (31.5, 82.5) -0.68, bias +0.409 land 5122 m; (31.5, 81.5) -0.67, bias +0.713 land 5070 m; (35.5, 78.5) -0.66, bias -0.742 land 5170 m
