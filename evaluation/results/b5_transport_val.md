## b5_transport on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.294 | +0.294 | 0.534 / 0.436 / 0.277 | +0.175 |
| 4 | +0.107 | +0.269 | 0.361 / 0.228 / 0.277 | +0.116 |
| 8 | -0.020 | +0.233 | 0.297 / 0.212 / 0.277 | +0.027 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.562 / 1.889 / 1.722  (SS best +0.093, vs pers +0.173)
- tp: 6.566 / 9.366 / 6.838  (SS best +0.040, vs pers +0.299)
- u10: 1.426 / 1.973 / 1.67  (SS best +0.146, vs pers +0.277)
- v10: 1.311 / 1.939 / 1.46  (SS best +0.102, vs pers +0.324)
- msl: 242.6 / 328.5 / 278.4  (SS best +0.129, vs pers +0.262)
- tcwv: 5.327 / 7.366 / 6.138  (SS best +0.132, vs pers +0.277)

Aggregate: SS per-window +0.0637 (proxy 15.9/30), CSI skill +0.0846 (proxy 12.7/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.00600004196167, 'tp': 0.7379999756813049, 'u10': 0.8309999704360962, 'v10': 0.8199999928474426, 'msl': 0.9860000014305115, 'tcwv': 0.953000009059906}
Invalid windows: 0; CPU 10-step rollout median 26 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.7/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.96, min 0.82), propagates 99%, stable 86% (max 12.88 std), far frac max 0.003
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.93), propagates 59%, stable 89% (max 9.39 std), far frac max 0.002

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.064 [+0.050, +0.078], worst -0.382
- skill day 1: +0.237 [+0.223, +0.250], worst -0.307
- skill day 4: +0.029 [+0.013, +0.051], worst -1.085
- skill day 8: -0.075 [-0.097, -0.053], worst -0.742
- CSI skill per window: +0.085 [+0.063, +0.105], worst -0.263
- day-4 skill vs persistence: +0.232 [+0.213, +0.251], worst -0.548; windows beating persistence 97% [95%, 98%]
- day-8 in-band fraction: 0.90 [0.87, 0.92], worst 0.50
- causality proxy per window: 13.7 [13.6, 13.9], worst 11.2
- grader-like draw (5 random windows), forecast points /45: p05 8.1, median 27.9, p95 43.6
- warm_ocean: stable 86% [79%, 91%]; unstable by channel {'t2m': 0, 'tp': 51, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-23 12.88 std (tp), 2020-06-29 10.64 std (tp), 2020-05-30 10.19 std (tp)
- monsoon_stall: stable 89% [82%, 95%]; unstable by channel {'t2m': 0, 'tp': 38, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-07-15 9.39 std (tp), 2020-07-20 8.72 std (tp), 2020-07-01 8.54 std (tp)
- worst windows (per-window skill): 2020-02-11 -0.382, 2020-02-10 -0.290, 2020-05-06 -0.249, 2020-09-10 -0.217, 2020-05-01 -0.211
- worst windows (day-8 skill): 2020-05-01 -0.742, 2020-04-22 -0.564, 2020-10-28 -0.544, 2020-09-10 -0.485, 2020-10-03 -0.459

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.093 | +0.040 | +0.146 | +0.102 | +0.129 | +0.132 |
| all | 1152 | 8 | -0.081 | -0.042 | +0.005 | -0.018 | +0.034 | -0.021 |
| ocean (lsm<0.5) | 416 | 4 | -0.152 | +0.050 | +0.175 | +0.130 | +0.200 | +0.140 |
| ocean (lsm<0.5) | 416 | 8 | -0.422 | -0.039 | +0.019 | -0.010 | +0.022 | -0.023 |
| land below 1000 m | 391 | 4 | +0.066 | +0.031 | +0.087 | +0.035 | +0.207 | +0.143 |
| land below 1000 m | 391 | 8 | -0.111 | -0.058 | -0.044 | -0.057 | +0.058 | -0.004 |
| highlands >=2000 m | 287 | 4 | +0.143 | +0.003 | +0.040 | -0.009 | +0.081 | -0.110 |
| highlands >=2000 m | 287 | 8 | -0.015 | -0.007 | -0.004 | -0.009 | +0.031 | -0.256 |
| Bay of Bengal box | 144 | 4 | -0.205 | +0.039 | +0.194 | +0.155 | +0.224 | +0.132 |
| Bay of Bengal box | 144 | 8 | -0.472 | -0.064 | +0.007 | -0.012 | +0.027 | -0.048 |
| Arabian Sea box | 120 | 4 | -0.203 | +0.075 | +0.177 | +0.135 | +0.206 | +0.184 |
| Arabian Sea box | 120 | 8 | -0.446 | -0.030 | +0.035 | +0.026 | +0.035 | +0.008 |
| north of 28N | 360 | 4 | +0.130 | -0.028 | +0.029 | -0.011 | +0.083 | +0.028 |
| north of 28N | 360 | 8 | -0.027 | -0.001 | -0.015 | -0.016 | +0.030 | -0.057 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 54% of cells below 0; (14.5, 84.5) -0.60, bias +0.0956 sea 0 m; (15.5, 84.5) -0.53, bias +0.0103 sea 0 m; (14.5, 82.5) -0.53, bias +0.121 sea 0 m
- day 4 tp: 49% of cells below 0; (27.5, 74.5) -0.34, bias -0.031 land 336 m; (16.5, 65.5) -0.33, bias -0.236 sea 0 m; (25.5, 75.5) -0.32, bias +0.619 land 350 m
- day 4 u10: 32% of cells below 0; (35.5, 73.5) -1.55, bias -0.0704 land 3315 m; (35.5, 71.5) -1.49, bias +0.103 land 3002 m; (35.5, 72.5) -1.34, bias +0.0359 land 3025 m
- day 4 v10: 38% of cells below 0; (26.5, 95.5) -0.78, bias +0.147 land 742 m; (37.5, 70.5) -0.67, bias -0.0893 land 2435 m; (37.5, 71.5) -0.58, bias +0.0338 land 3637 m
- day 4 msl: 3% of cells below 0; (6.5, 96.5) -0.07, bias +17.3 sea 2 m; (28.5, 65.5) -0.06, bias -98 land 1204 m; (6.5, 97.5) -0.05, bias +20.8 sea 0 m
- day 4 tcwv: 25% of cells below 0; (35.5, 78.5) -0.51, bias -0.13 land 5170 m; (35.5, 79.5) -0.49, bias +0.055 land 4987 m; (29.5, 83.5) -0.47, bias -0.0271 land 4731 m
- day 8 t2m: 86% of cells below 0; (6.5, 79.5) -1.04, bias +0.684 sea 37 m; (7.5, 100.5) -0.90, bias +0.621 sea 45 m; (14.5, 82.5) -0.82, bias +0.241 sea 0 m
- day 8 tp: 81% of cells below 0; (17.5, 95.5) -0.35, bias +2.08 land 82 m; (20.5, 65.5) -0.32, bias -0.033 sea 0 m; (36.5, 94.5) -0.31, bias -0.0129 land 3414 m
- day 8 u10: 61% of cells below 0; (35.5, 71.5) -2.18, bias +0.166 land 3002 m; (35.5, 73.5) -2.16, bias -0.103 land 3315 m; (35.5, 72.5) -1.99, bias +0.0334 land 3025 m
- day 8 v10: 75% of cells below 0; (26.5, 95.5) -1.40, bias +0.258 land 742 m; (25.5, 94.5) -0.93, bias +0.23 land 896 m; (27.5, 96.5) -0.78, bias +0.0042 land 1479 m
- day 8 msl: 30% of cells below 0; (6.5, 97.5) -0.22, bias +16.4 sea 0 m; (6.5, 96.5) -0.22, bias +4.17 sea 2 m; (6.5, 100.5) -0.21, bias -22.4 land 106 m
- day 8 tcwv: 67% of cells below 0; (28.5, 91.5) -0.94, bias +2.29 land 4483 m; (29.5, 84.5) -0.93, bias +0.988 land 5027 m; (28.5, 89.5) -0.92, bias +2.08 land 4614 m
