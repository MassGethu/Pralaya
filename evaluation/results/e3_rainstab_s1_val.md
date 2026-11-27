## e3_rainstab_s1 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.296 | +0.296 | 0.533 / 0.436 / 0.277 | +0.173 |
| 4 | +0.098 | +0.261 | 0.344 / 0.228 / 0.277 | +0.093 |
| 8 | -0.039 | +0.218 | 0.281 / 0.212 / 0.277 | +0.005 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.567 / 1.889 / 1.722  (SS best +0.090, vs pers +0.171)
- tp: 6.537 / 9.366 / 6.838  (SS best +0.044, vs pers +0.302)
- u10: 1.449 / 1.973 / 1.67  (SS best +0.132, vs pers +0.266)
- v10: 1.323 / 1.939 / 1.46  (SS best +0.094, vs pers +0.318)
- msl: 242.6 / 328.5 / 278.4  (SS best +0.129, vs pers +0.262)
- tcwv: 5.537 / 7.366 / 6.138  (SS best +0.098, vs pers +0.248)

Aggregate: SS per-window +0.0611 (proxy 15.3/30), CSI skill +0.0664 (proxy 10.0/15), anti-blur proxy 10.0/10 (in-band 88%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 0.9900000095367432, 'tp': 0.5270000100135803, 'u10': 0.8479999899864197, 'v10': 0.7979999780654907, 'msl': 0.9100000262260437, 'tcwv': 0.8379999995231628}
Invalid windows: 0; CPU 10-step rollout median 25 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 14.0/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.82), propagates 96%, stable 95% (max 9.24 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.92), propagates 56%, stable 97% (max 18.26 std), far frac max 0.001

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.061 [+0.048, +0.075], worst -0.252
- skill day 1: +0.239 [+0.224, +0.252], worst -0.295
- skill day 4: +0.024 [+0.008, +0.042], worst -0.816
- skill day 8: -0.080 [-0.102, -0.058], worst -0.704
- CSI skill per window: +0.066 [+0.048, +0.083], worst -0.204
- day-4 skill vs persistence: +0.227 [+0.208, +0.243], worst -0.241; windows beating persistence 96% [93%, 98%]
- day-8 in-band fraction: 0.88 [0.86, 0.90], worst 0.50
- causality proxy per window: 14.0 [13.7, 14.2], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 5.8, median 24.8, p95 41.5
- warm_ocean: stable 95% [92%, 98%]; unstable by channel {'t2m': 0, 'tp': 16, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-04-29 9.24 std (tp), 2020-10-09 7.95 std (tp), 2020-10-28 7.44 std (tp)
- monsoon_stall: stable 97% [95%, 99%]; unstable by channel {'t2m': 0, 'tp': 10, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-28 18.26 std (tp), 2020-05-30 13.18 std (tp), 2020-05-19 7.3 std (tp)
- worst windows (per-window skill): 2020-10-29 -0.252, 2020-02-11 -0.241, 2020-02-10 -0.214, 2020-10-28 -0.184, 2020-05-06 -0.174
- worst windows (day-8 skill): 2020-10-28 -0.704, 2020-10-29 -0.668, 2020-11-11 -0.546, 2020-10-03 -0.505, 2020-05-01 -0.467

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.090 | +0.044 | +0.132 | +0.094 | +0.129 | +0.098 |
| all | 1152 | 8 | -0.075 | -0.030 | -0.016 | -0.019 | +0.016 | -0.109 |
| ocean (lsm<0.5) | 416 | 4 | -0.140 | +0.052 | +0.154 | +0.116 | +0.186 | +0.102 |
| ocean (lsm<0.5) | 416 | 8 | -0.391 | -0.030 | -0.016 | -0.013 | -0.014 | -0.122 |
| land below 1000 m | 391 | 4 | +0.062 | +0.035 | +0.093 | +0.040 | +0.192 | +0.108 |
| land below 1000 m | 391 | 8 | -0.114 | -0.033 | -0.017 | -0.050 | +0.023 | -0.090 |
| highlands >=2000 m | 287 | 4 | +0.140 | +0.020 | +0.042 | +0.005 | +0.091 | -0.091 |
| highlands >=2000 m | 287 | 8 | -0.006 | -0.027 | -0.007 | -0.008 | +0.025 | -0.210 |
| Bay of Bengal box | 144 | 4 | -0.207 | +0.067 | +0.173 | +0.129 | +0.221 | +0.089 |
| Bay of Bengal box | 144 | 8 | -0.442 | -0.050 | -0.028 | -0.033 | -0.000 | -0.160 |
| Arabian Sea box | 120 | 4 | -0.177 | +0.055 | +0.180 | +0.126 | +0.184 | +0.117 |
| Arabian Sea box | 120 | 8 | -0.456 | -0.011 | +0.022 | +0.035 | -0.008 | -0.142 |
| north of 28N | 360 | 4 | +0.123 | -0.007 | +0.032 | -0.002 | +0.090 | +0.020 |
| north of 28N | 360 | 8 | -0.025 | -0.010 | -0.010 | -0.015 | +0.021 | -0.082 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 53% of cells below 0; (13.5, 86.5) -0.67, bias +0.0264 sea 0 m; (13.5, 85.5) -0.67, bias +0.0854 sea 0 m; (12.5, 85.5) -0.64, bias +0.079 sea 0 m
- day 4 tp: 41% of cells below 0; (37.5, 95.5) -0.27, bias -0.001 land 3361 m; (37.5, 96.5) -0.25, bias +0.143 land 3603 m; (37.5, 92.5) -0.24, bias -0.144 land 3124 m
- day 4 u10: 32% of cells below 0; (35.5, 72.5) -1.74, bias -0.151 land 3025 m; (35.5, 73.5) -1.46, bias -0.038 land 3315 m; (29.5, 95.5) -1.39, bias -0.0249 land 3567 m
- day 4 v10: 35% of cells below 0; (37.5, 71.5) -0.64, bias +0.0955 land 3637 m; (37.5, 70.5) -0.57, bias -0.0196 land 2435 m; (27.5, 96.5) -0.56, bias -0.0172 land 1479 m
- day 4 msl: 3% of cells below 0; (6.5, 95.5) -0.08, bias +15.3 sea 5 m; (6.5, 96.5) -0.07, bias +18.2 sea 2 m; (6.5, 100.5) -0.05, bias +3.74 land 106 m
- day 4 tcwv: 26% of cells below 0; (35.5, 78.5) -0.55, bias -0.0955 land 5170 m; (35.5, 77.5) -0.53, bias -0.0475 land 5116 m; (35.5, 79.5) -0.51, bias -0.254 land 4987 m
- day 8 t2m: 86% of cells below 0; (13.5, 86.5) -0.88, bias -0.0039 sea 0 m; (10.5, 73.5) -0.85, bias +0.345 sea 0 m; (9.5, 73.5) -0.84, bias +0.308 sea 0 m
- day 8 tp: 75% of cells below 0; (37.5, 86.5) -0.43, bias +0.567 land 3526 m; (36.5, 93.5) -0.41, bias +0.499 land 3633 m; (37.5, 95.5) -0.39, bias +0.243 land 3361 m
- day 8 u10: 66% of cells below 0; (35.5, 72.5) -2.77, bias -0.273 land 3025 m; (35.5, 73.5) -1.90, bias -0.1 land 3315 m; (25.5, 96.5) -1.83, bias +0.281 land 432 m
- day 8 v10: 74% of cells below 0; (27.5, 97.5) -0.91, bias -0.196 land 2097 m; (37.5, 71.5) -0.88, bias +0.14 land 3637 m; (27.5, 96.5) -0.83, bias -0.0625 land 1479 m
- day 8 msl: 46% of cells below 0; (6.5, 100.5) -0.22, bias +10.7 land 106 m; (6.5, 95.5) -0.22, bias +37.9 sea 5 m; (6.5, 96.5) -0.18, bias +38.2 sea 2 m
- day 8 tcwv: 89% of cells below 0; (30.5, 83.5) -0.91, bias -0.971 land 5096 m; (37.5, 72.5) -0.90, bias +1.72 land 4245 m; (29.5, 84.5) -0.86, bias -0.597 land 5027 m
