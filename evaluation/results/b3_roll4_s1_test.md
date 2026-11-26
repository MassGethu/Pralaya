## b3_roll4_s1 on test (353 windows, init 2021-01-03..2021-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.288 | +0.288 | 0.529 / 0.426 / 0.260 | +0.180 |
| 4 | +0.073 | +0.245 | 0.334 / 0.209 / 0.261 | +0.099 |
| 8 | -0.076 | +0.199 | 0.279 / 0.196 / 0.262 | +0.024 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.685 / 1.934 / 1.779  (SS best +0.053, vs pers +0.129)
- tp: 6.665 / 9.249 / 6.788  (SS best +0.018, vs pers +0.279)
- u10: 1.523 / 2.073 / 1.672  (SS best +0.089, vs pers +0.265)
- v10: 1.407 / 1.956 / 1.464  (SS best +0.039, vs pers +0.281)
- msl: 260.4 / 353.6 / 284.9  (SS best +0.086, vs pers +0.264)
- tcwv: 5.669 / 7.559 / 6.701  (SS best +0.154, vs pers +0.250)

Aggregate: SS per-window +0.0204 (proxy 5.1/30), CSI skill +0.0736 (proxy 11.0/15), anti-blur proxy 10.0/10 (in-band 87%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.024999976158142, 'tp': 1.0809999704360962, 'u10': 0.7620000243186951, 'v10': 0.8209999799728394, 'msl': 0.8920000195503235, 'tcwv': 0.9900000095367432}
Invalid windows: 0; CPU 10-step rollout median 35 ms
Shocks (353 windows): null exact=True ok=True; causality proxy 13.8/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.96, min 0.76), propagates 92%, stable 86% (max 18.94 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.90), propagates 65%, stable 95% (max 10.61 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.020 [+0.006, +0.036], worst -0.280
- skill day 1: +0.232 [+0.220, +0.247], worst -0.265
- skill day 4: -0.016 [-0.037, +0.005], worst -0.500
- skill day 8: -0.155 [-0.181, -0.130], worst -0.620
- CSI skill per window: +0.074 [+0.057, +0.094], worst -0.287
- day-4 skill vs persistence: +0.206 [+0.187, +0.229], worst -0.258; windows beating persistence 94% [91%, 97%]
- day-8 in-band fraction: 0.87 [0.85, 0.90], worst 0.50
- causality proxy per window: 13.8 [13.6, 14.1], worst 7.5
- grader-like draw (5 random windows), forecast points /45: p05 1.5, median 15.9, p95 32.1
- warm_ocean: stable 86% [79%, 91%]; unstable by channel {'t2m': 0, 'tp': 49, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-05-07 18.94 std (tp), 2021-05-12 12.07 std (tp), 2021-05-15 11.33 std (tp)
- monsoon_stall: stable 95% [92%, 98%]; unstable by channel {'t2m': 0, 'tp': 17, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-05-30 10.61 std (tp), 2021-05-15 10.48 std (tp), 2021-05-14 8.2 std (tp)
- worst windows (per-window skill): 2021-12-19 -0.280, 2021-03-15 -0.228, 2021-02-24 -0.215, 2021-01-21 -0.201, 2021-03-16 -0.200
- worst windows (day-8 skill): 2021-01-20 -0.620, 2021-01-18 -0.616, 2021-02-23 -0.588, 2021-01-19 -0.577, 2021-10-15 -0.563

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.053 | +0.018 | +0.089 | +0.039 | +0.086 | +0.154 |
| all | 1152 | 8 | -0.161 | -0.053 | -0.067 | -0.088 | -0.044 | -0.044 |
| ocean (lsm<0.5) | 416 | 4 | -0.522 | +0.028 | +0.102 | +0.054 | +0.162 | +0.161 |
| ocean (lsm<0.5) | 416 | 8 | -0.971 | -0.054 | -0.070 | -0.089 | -0.035 | -0.040 |
| land below 1000 m | 391 | 4 | +0.004 | +0.004 | +0.079 | -0.002 | +0.108 | +0.162 |
| land below 1000 m | 391 | 8 | -0.249 | -0.050 | -0.062 | -0.096 | -0.062 | -0.036 |
| highlands >=2000 m | 287 | 4 | +0.143 | -0.001 | +0.001 | -0.012 | +0.063 | -0.065 |
| highlands >=2000 m | 287 | 8 | -0.027 | -0.050 | -0.059 | -0.055 | -0.035 | -0.245 |
| Bay of Bengal box | 144 | 4 | -0.520 | +0.017 | +0.102 | +0.053 | +0.172 | +0.118 |
| Bay of Bengal box | 144 | 8 | -0.902 | -0.075 | -0.122 | -0.140 | -0.075 | -0.103 |
| Arabian Sea box | 120 | 4 | -0.416 | +0.037 | +0.107 | +0.068 | +0.191 | +0.218 |
| Arabian Sea box | 120 | 8 | -0.757 | -0.027 | -0.019 | -0.029 | +0.050 | +0.026 |
| north of 28N | 360 | 4 | +0.116 | -0.010 | +0.010 | -0.012 | +0.059 | +0.104 |
| north of 28N | 360 | 8 | -0.055 | -0.053 | -0.051 | -0.055 | -0.040 | -0.090 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 59% of cells below 0; (10.5, 74.5) -1.12, bias +0.448 sea 0 m; (11.5, 74.5) -1.07, bias +0.42 sea 11 m; (9.5, 74.5) -1.03, bias +0.425 sea 0 m
- day 4 tp: 46% of cells below 0; (17.5, 65.5) -3.86, bias +0.724 sea 0 m; (18.5, 65.5) -3.35, bias +0.577 sea 0 m; (18.5, 66.5) -1.93, bias +0.44 sea 0 m
- day 4 u10: 31% of cells below 0; (29.5, 95.5) -1.38, bias -0.0339 land 3567 m; (35.5, 72.5) -1.24, bias -0.12 land 3025 m; (35.5, 73.5) -1.23, bias +0.0179 land 3315 m
- day 4 v10: 51% of cells below 0; (37.5, 71.5) -0.72, bias +0.081 land 3637 m; (27.5, 96.5) -0.69, bias +0.0045 land 1479 m; (26.5, 98.5) -0.58, bias +0.0496 land 1975 m
- day 4 msl: 6% of cells below 0; (7.5, 100.5) -0.09, bias -39.2 sea 45 m; (8.5, 100.5) -0.09, bias -36.6 sea 30 m; (6.5, 100.5) -0.09, bias -32.9 land 106 m
- day 4 tcwv: 23% of cells below 0; (35.5, 78.5) -0.52, bias -0.437 land 5170 m; (35.5, 77.5) -0.49, bias -0.465 land 5116 m; (35.5, 82.5) -0.49, bias +0.283 land 4950 m
- day 8 t2m: 90% of cells below 0; (10.5, 74.5) -2.48, bias +0.837 sea 0 m; (9.5, 74.5) -2.35, bias +0.785 sea 0 m; (9.5, 75.5) -2.30, bias +0.7 sea 4 m
- day 8 tp: 85% of cells below 0; (31.5, 65.5) -1.85, bias +0.927 land 1247 m; (30.5, 65.5) -1.51, bias +0.684 land 1130 m; (29.5, 65.5) -1.48, bias +0.517 land 1166 m
- day 8 u10: 89% of cells below 0; (35.5, 72.5) -2.29, bias -0.208 land 3025 m; (29.5, 95.5) -2.23, bias +0.0277 land 3567 m; (25.5, 96.5) -2.09, bias +0.262 land 432 m
- day 8 v10: 93% of cells below 0; (27.5, 96.5) -1.52, bias +0.0366 land 1479 m; (26.5, 98.5) -1.27, bias +0.0943 land 1975 m; (30.5, 79.5) -1.20, bias -0.218 land 3272 m
- day 8 msl: 76% of cells below 0; (7.5, 100.5) -0.35, bias -74.3 sea 45 m; (6.5, 100.5) -0.31, bias -60.9 land 106 m; (8.5, 100.5) -0.29, bias -71.6 sea 30 m
- day 8 tcwv: 79% of cells below 0; (35.5, 77.5) -1.24, bias -1.1 land 5116 m; (35.5, 78.5) -1.16, bias -0.898 land 5170 m; (36.5, 86.5) -0.97, bias +1.69 land 4842 m
