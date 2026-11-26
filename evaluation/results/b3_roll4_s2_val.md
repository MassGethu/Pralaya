## b3_roll4_s2 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.293 | +0.293 | 0.533 / 0.436 / 0.277 | +0.173 |
| 4 | +0.087 | +0.252 | 0.351 / 0.228 / 0.277 | +0.102 |
| 8 | -0.056 | +0.205 | 0.297 / 0.212 / 0.277 | +0.028 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.621 / 1.889 / 1.722  (SS best +0.059, vs pers +0.142)
- tp: 6.602 / 9.366 / 6.838  (SS best +0.035, vs pers +0.295)
- u10: 1.466 / 1.973 / 1.67  (SS best +0.122, vs pers +0.257)
- v10: 1.339 / 1.939 / 1.46  (SS best +0.083, vs pers +0.309)
- msl: 246.8 / 328.5 / 278.4  (SS best +0.114, vs pers +0.249)
- tcwv: 5.456 / 7.366 / 6.138  (SS best +0.111, vs pers +0.259)

Aggregate: SS per-window +0.0393 (proxy 9.8/30), CSI skill +0.0731 (proxy 11.0/15), anti-blur proxy 10.0/10 (in-band 91%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0160000324249268, 'tp': 0.8379999995231628, 'u10': 0.859000027179718, 'v10': 0.8690000176429749, 'msl': 1.00600004196167, 'tcwv': 1.0399999618530273}
Invalid windows: 0; CPU 10-step rollout median 35 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.5/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.87), propagates 93%, stable 95% (max 10.37 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.94), propagates 38%, stable 97% (max 12.02 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.039 [+0.025, +0.057], worst -0.287
- skill day 1: +0.237 [+0.222, +0.250], worst -0.244
- skill day 4: +0.007 [-0.011, +0.030], worst -0.744
- skill day 8: -0.127 [-0.153, -0.099], worst -0.885
- CSI skill per window: +0.073 [+0.050, +0.096], worst -0.233
- day-4 skill vs persistence: +0.215 [+0.196, +0.234], worst -0.391; windows beating persistence 97% [94%, 99%]
- day-8 in-band fraction: 0.91 [0.89, 0.92], worst 0.50
- causality proxy per window: 13.5 [13.3, 13.8], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 2.4, median 20.3, p95 37.3
- warm_ocean: stable 95% [90%, 98%]; unstable by channel {'t2m': 0, 'tp': 19, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-11-29 10.37 std (tp), 2020-05-12 8.88 std (tp), 2020-11-27 8.44 std (tp)
- monsoon_stall: stable 97% [94%, 99%]; unstable by channel {'t2m': 0, 'tp': 10, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-01 12.02 std (tp), 2020-05-30 10.03 std (tp), 2020-08-06 6.12 std (tp)
- worst windows (per-window skill): 2020-02-11 -0.287, 2020-04-27 -0.281, 2020-02-10 -0.245, 2020-10-28 -0.218, 2020-05-06 -0.195
- worst windows (day-8 skill): 2020-10-28 -0.885, 2020-04-27 -0.809, 2020-05-01 -0.584, 2020-04-30 -0.540, 2020-10-27 -0.490

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.059 | +0.034 | +0.122 | +0.083 | +0.114 | +0.111 |
| all | 1152 | 8 | -0.147 | -0.035 | -0.021 | -0.042 | -0.032 | -0.060 |
| ocean (lsm<0.5) | 416 | 4 | -0.374 | +0.040 | +0.141 | +0.104 | +0.162 | +0.110 |
| ocean (lsm<0.5) | 416 | 8 | -0.785 | -0.037 | -0.016 | -0.034 | -0.082 | -0.076 |
| land below 1000 m | 391 | 4 | +0.031 | +0.029 | +0.088 | +0.029 | +0.165 | +0.134 |
| land below 1000 m | 391 | 8 | -0.188 | -0.035 | -0.029 | -0.073 | -0.026 | -0.028 |
| highlands >=2000 m | 287 | 4 | +0.136 | +0.018 | +0.050 | +0.006 | +0.085 | -0.114 |
| highlands >=2000 m | 287 | 8 | -0.028 | -0.023 | -0.043 | -0.061 | -0.014 | -0.255 |
| Bay of Bengal box | 144 | 4 | -0.472 | +0.057 | +0.152 | +0.132 | +0.212 | +0.086 |
| Bay of Bengal box | 144 | 8 | -0.839 | -0.045 | -0.046 | -0.018 | -0.028 | -0.141 |
| Arabian Sea box | 120 | 4 | -0.351 | +0.032 | +0.157 | +0.117 | +0.133 | +0.162 |
| Arabian Sea box | 120 | 8 | -0.789 | -0.007 | -0.007 | -0.013 | -0.120 | -0.008 |
| north of 28N | 360 | 4 | +0.117 | -0.007 | +0.031 | -0.001 | +0.082 | +0.007 |
| north of 28N | 360 | 8 | -0.050 | -0.015 | -0.054 | -0.053 | -0.019 | -0.084 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 59% of cells below 0; (14.5, 85.5) -1.44, bias +0.351 sea 0 m; (15.5, 85.5) -1.35, bias +0.398 sea 0 m; (13.5, 85.5) -1.17, bias +0.256 sea 0 m
- day 4 tp: 44% of cells below 0; (20.5, 66.5) -1.28, bias -0.0136 sea 0 m; (20.5, 65.5) -1.24, bias -0.0923 sea 0 m; (19.5, 67.5) -0.96, bias +0.375 sea 0 m
- day 4 u10: 32% of cells below 0; (35.5, 71.5) -1.54, bias -0.127 land 3002 m; (35.5, 72.5) -1.51, bias -0.069 land 3025 m; (35.5, 73.5) -1.51, bias -0.0898 land 3315 m
- day 4 v10: 39% of cells below 0; (27.5, 96.5) -0.84, bias -0.0258 land 1479 m; (28.5, 83.5) -0.62, bias -0.121 land 2832 m; (27.5, 86.5) -0.56, bias -0.12 land 2434 m
- day 4 msl: 5% of cells below 0; (28.5, 65.5) -0.06, bias -103 land 1204 m; (37.5, 71.5) -0.06, bias -44.6 land 3637 m; (37.5, 84.5) -0.05, bias -174 land 2303 m
- day 4 tcwv: 29% of cells below 0; (34.5, 78.5) -0.53, bias -0.627 land 5207 m; (33.5, 78.5) -0.46, bias -0.498 land 5056 m; (35.5, 78.5) -0.46, bias -0.272 land 5170 m
- day 8 t2m: 90% of cells below 0; (14.5, 85.5) -1.79, bias +0.445 sea 0 m; (15.5, 85.5) -1.74, bias +0.537 sea 0 m; (13.5, 85.5) -1.57, bias +0.315 sea 0 m
- day 8 tp: 78% of cells below 0; (16.5, 65.5) -0.57, bias +0.3 sea 0 m; (15.5, 65.5) -0.44, bias -0.0249 sea 0 m; (7.5, 78.5) -0.38, bias +2.58 sea 4 m
- day 8 u10: 70% of cells below 0; (35.5, 71.5) -3.12, bias -0.286 land 3002 m; (35.5, 72.5) -2.78, bias -0.141 land 3025 m; (29.5, 95.5) -2.72, bias +0.233 land 3567 m
- day 8 v10: 86% of cells below 0; (28.5, 83.5) -1.11, bias -0.219 land 2832 m; (25.5, 98.5) -1.05, bias -0.0537 land 1723 m; (27.5, 98.5) -0.94, bias -0.205 land 2634 m
- day 8 msl: 73% of cells below 0; (7.5, 72.5) -0.32, bias -30.2 sea 0 m; (9.5, 75.5) -0.32, bias -27.8 sea 4 m; (6.5, 73.5) -0.31, bias -60.7 sea 0 m
- day 8 tcwv: 79% of cells below 0; (34.5, 78.5) -1.35, bias -1.67 land 5207 m; (33.5, 79.5) -1.26, bias -2.02 land 5077 m; (33.5, 78.5) -1.13, bias -1.5 land 5056 m
