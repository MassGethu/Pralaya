## b1_onestep_s1 on test (353 windows, init 2021-01-03..2021-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.307 | +0.307 | 0.531 / 0.426 / 0.260 | +0.183 |
| 4 | +0.041 | +0.219 | 0.318 / 0.209 / 0.261 | +0.077 |
| 8 | -0.159 | +0.139 | 0.266 / 0.196 / 0.262 | +0.005 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.681 / 1.934 / 1.779  (SS best +0.055, vs pers +0.131)
- tp: 7.147 / 9.249 / 6.788  (SS best -0.053, vs pers +0.227)
- u10: 1.593 / 2.073 / 1.672  (SS best +0.047, vs pers +0.231)
- v10: 1.431 / 1.956 / 1.464  (SS best +0.023, vs pers +0.269)
- msl: 269.4 / 353.6 / 284.9  (SS best +0.054, vs pers +0.238)
- tcwv: 5.892 / 7.559 / 6.701  (SS best +0.121, vs pers +0.220)

Aggregate: SS per-window -0.0144 (proxy 0.0/30), CSI skill +0.0642 (proxy 9.6/15), anti-blur proxy 10.0/10 (in-band 91%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0490000247955322, 'tp': 1.7480000257492065, 'u10': 0.949999988079071, 'v10': 1.0149999856948853, 'msl': 1.0880000591278076, 'tcwv': 1.0080000162124634}
Invalid windows: 0; CPU 10-step rollout median 35 ms
Shocks (353 windows): null exact=True ok=True; causality proxy 13.4/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.96, min 0.78), propagates 98%, stable 61% (max 13.57 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.90), propagates 75%, stable 79% (max 14.83 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: -0.014 [-0.028, +0.001], worst -0.280
- skill day 1: +0.251 [+0.238, +0.267], worst -0.307
- skill day 4: -0.048 [-0.066, -0.028], worst -0.490
- skill day 8: -0.247 [-0.273, -0.220], worst -0.816
- CSI skill per window: +0.064 [+0.049, +0.085], worst -0.301
- day-4 skill vs persistence: +0.184 [+0.164, +0.208], worst -0.369; windows beating persistence 92% [89%, 96%]
- day-8 in-band fraction: 0.91 [0.89, 0.93], worst 0.50
- causality proxy per window: 13.4 [13.0, 13.6], worst 7.5
- grader-like draw (5 random windows), forecast points /45: p05 0.0, median 11.3, p95 24.0
- warm_ocean: stable 61% [50%, 72%]; unstable by channel {'t2m': 0, 'tp': 136, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-11-17 13.57 std (tp), 2021-10-07 12.95 std (tp), 2021-05-12 12.78 std (tp)
- monsoon_stall: stable 79% [70%, 86%]; unstable by channel {'t2m': 0, 'tp': 75, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-05-19 14.83 std (tp), 2021-05-12 12.7 std (tp), 2021-06-10 12.5 std (tp)
- worst windows (per-window skill): 2021-01-16 -0.280, 2021-12-19 -0.269, 2021-01-10 -0.262, 2021-03-13 -0.236, 2021-06-23 -0.235
- worst windows (day-8 skill): 2021-01-16 -0.816, 2021-06-02 -0.736, 2021-06-14 -0.701, 2021-02-23 -0.692, 2021-01-10 -0.682

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.055 | -0.053 | +0.047 | +0.023 | +0.055 | +0.121 |
| all | 1152 | 8 | -0.205 | -0.200 | -0.171 | -0.139 | -0.086 | -0.150 |
| ocean (lsm<0.5) | 416 | 4 | -0.332 | -0.043 | +0.060 | +0.048 | +0.141 | +0.146 |
| ocean (lsm<0.5) | 416 | 8 | -0.736 | -0.180 | -0.185 | -0.126 | -0.077 | -0.120 |
| land below 1000 m | 391 | 4 | +0.005 | -0.060 | +0.049 | -0.035 | +0.086 | +0.108 |
| land below 1000 m | 391 | 8 | -0.282 | -0.229 | -0.126 | -0.198 | -0.133 | -0.176 |
| highlands >=2000 m | 287 | 4 | +0.127 | -0.100 | -0.075 | -0.070 | +0.025 | -0.114 |
| highlands >=2000 m | 287 | 8 | -0.113 | -0.202 | -0.164 | -0.144 | -0.062 | -0.319 |
| Bay of Bengal box | 144 | 4 | -0.310 | -0.105 | +0.030 | +0.034 | +0.132 | +0.093 |
| Bay of Bengal box | 144 | 8 | -0.634 | -0.221 | -0.299 | -0.218 | -0.123 | -0.216 |
| Arabian Sea box | 120 | 4 | -0.262 | +0.027 | +0.096 | +0.088 | +0.203 | +0.198 |
| Arabian Sea box | 120 | 8 | -0.625 | -0.151 | -0.078 | -0.013 | +0.027 | -0.061 |
| north of 28N | 360 | 4 | +0.101 | -0.091 | -0.052 | -0.067 | +0.024 | +0.050 |
| north of 28N | 360 | 8 | -0.133 | -0.204 | -0.145 | -0.151 | -0.068 | -0.215 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 62% of cells below 0; (11.5, 74.5) -0.76, bias +0.413 sea 11 m; (9.5, 75.5) -0.73, bias +0.422 sea 4 m; (7.5, 77.5) -0.71, bias +0.393 sea 11 m
- day 4 tp: 75% of cells below 0; (18.5, 66.5) -2.30, bias +0.481 sea 0 m; (17.5, 66.5) -1.90, bias +0.485 sea 0 m; (17.5, 65.5) -1.82, bias +0.513 sea 0 m
- day 4 u10: 48% of cells below 0; (35.5, 72.5) -1.34, bias -0.161 land 3025 m; (25.5, 96.5) -1.27, bias +0.133 land 432 m; (35.5, 73.5) -1.24, bias -0.0386 land 3315 m
- day 4 v10: 65% of cells below 0; (27.5, 96.5) -1.04, bias -0.0744 land 1479 m; (37.5, 71.5) -0.88, bias -0.0952 land 3637 m; (25.5, 94.5) -0.79, bias -0.0776 land 896 m
- day 4 msl: 16% of cells below 0; (6.5, 100.5) -0.18, bias -39 land 106 m; (13.5, 100.5) -0.15, bias -26 land 53 m; (7.5, 100.5) -0.14, bias -39.9 sea 45 m
- day 4 tcwv: 31% of cells below 0; (35.5, 82.5) -0.65, bias +0.538 land 4950 m; (35.5, 81.5) -0.64, bias +0.577 land 4809 m; (35.5, 80.5) -0.60, bias +0.367 land 4787 m
- day 8 t2m: 96% of cells below 0; (7.5, 77.5) -2.01, bias +0.825 sea 11 m; (9.5, 75.5) -1.94, bias +0.75 sea 4 m; (10.5, 75.5) -1.79, bias +0.702 sea 46 m
- day 8 tp: 98% of cells below 0; (31.5, 65.5) -3.73, bias +1.73 land 1247 m; (30.5, 65.5) -3.48, bias +1.2 land 1130 m; (29.5, 65.5) -3.43, bias +0.799 land 1166 m
- day 8 u10: 95% of cells below 0; (35.5, 72.5) -3.38, bias -0.364 land 3025 m; (28.5, 94.5) -2.43, bias +0.245 land 2159 m; (29.5, 95.5) -2.35, bias -0.0285 land 3567 m
- day 8 v10: 93% of cells below 0; (27.5, 96.5) -2.36, bias -0.121 land 1479 m; (27.5, 97.5) -1.82, bias -0.314 land 2097 m; (37.5, 71.5) -1.55, bias -0.143 land 3637 m
- day 8 msl: 87% of cells below 0; (6.5, 100.5) -0.47, bias -49.7 land 106 m; (24.5, 98.5) -0.40, bias -80.6 land 1466 m; (6.5, 99.5) -0.37, bias -47.8 sea 27 m
- day 8 tcwv: 95% of cells below 0; (37.5, 72.5) -1.35, bias +0.935 land 4245 m; (35.5, 81.5) -1.18, bias +1.28 land 4809 m; (35.5, 76.5) -1.10, bias -0.498 land 4733 m
