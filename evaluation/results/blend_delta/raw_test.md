## e3_rainstab on test (353 windows, init 2021-01-03..2021-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.290 | +0.290 | 0.528 / 0.426 / 0.260 | +0.178 |
| 4 | +0.093 | +0.261 | 0.330 / 0.209 / 0.261 | +0.093 |
| 8 | -0.012 | +0.247 | 0.291 / 0.196 / 0.262 | +0.040 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.6 / 1.934 / 1.779  (SS best +0.101, vs pers +0.173)
- tp: 6.624 / 9.249 / 6.788  (SS best +0.024, vs pers +0.284)
- u10: 1.5 / 2.073 / 1.672  (SS best +0.103, vs pers +0.276)
- v10: 1.357 / 1.956 / 1.464  (SS best +0.073, vs pers +0.306)
- msl: 261.3 / 353.6 / 284.9  (SS best +0.083, vs pers +0.261)
- tcwv: 5.534 / 7.559 / 6.701  (SS best +0.174, vs pers +0.268)

Aggregate: SS per-window +0.0592 (proxy 14.8/30), CSI skill +0.0789 (proxy 11.8/15), anti-blur proxy 10.0/10 (in-band 88%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.012, 'tp': 0.759, 'u10': 0.748, 'v10': 0.842, 'msl': 0.919, 'tcwv': 0.94}
Invalid windows: 0; CPU 10-step rollout median 54 ms
Shocks (353 windows): null exact=True ok=True; causality proxy 14.1/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.75), propagates 97%, stable 96% (max 8.35 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.92), propagates 61%, stable 98% (max 6.45 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.059 [+0.049, +0.071], worst -0.118
- skill day 1: +0.234 [+0.221, +0.248], worst -0.090
- skill day 4: +0.016 [-0.002, +0.033], worst -0.349
- skill day 8: -0.072 [-0.090, -0.053], worst -0.466
- CSI skill per window: +0.079 [+0.062, +0.100], worst -0.333
- day-4 skill vs persistence: +0.230 [+0.211, +0.252], worst -0.235; windows beating persistence 95% [93%, 97%]
- day-8 in-band fraction: 0.88 [0.86, 0.90], worst 0.50
- causality proxy per window: 14.1 [13.8, 14.3], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 9.1, median 25.7, p95 40.1
- warm_ocean: stable 96% [93%, 98%]; unstable by channel {'t2m': 0, 'tp': 15, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-11-13 8.35 std (tp), 2021-06-05 8.3 std (tp), 2021-11-05 8.26 std (tp)
- monsoon_stall: stable 98% [95%, 99%]; unstable by channel {'t2m': 0, 'tp': 8, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-05-14 6.45 std (tp), 2021-09-10 6.43 std (tp), 2021-05-13 6.35 std (tp)
- worst windows (per-window skill): 2021-07-27 -0.118, 2021-03-16 -0.106, 2021-10-16 -0.105, 2021-05-12 -0.100, 2021-08-12 -0.099
- worst windows (day-8 skill): 2021-06-02 -0.466, 2021-05-12 -0.459, 2021-11-17 -0.403, 2021-06-26 -0.394, 2021-10-13 -0.378

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.101 | +0.024 | +0.103 | +0.073 | +0.083 | +0.174 |
| all | 1152 | 8 | -0.044 | -0.010 | -0.004 | -0.023 | -0.006 | +0.013 |
| ocean (lsm<0.5) | 416 | 4 | -0.224 | +0.031 | +0.119 | +0.097 | +0.184 | +0.182 |
| ocean (lsm<0.5) | 416 | 8 | -0.504 | -0.004 | +0.001 | -0.016 | +0.035 | +0.018 |
| land below 1000 m | 391 | 4 | +0.054 | +0.021 | +0.089 | +0.015 | +0.127 | +0.185 |
| land below 1000 m | 391 | 8 | -0.088 | -0.015 | -0.010 | -0.048 | +0.007 | +0.025 |
| highlands >=2000 m | 287 | 4 | +0.164 | -0.016 | -0.001 | -0.016 | +0.044 | -0.065 |
| highlands >=2000 m | 287 | 8 | +0.022 | -0.029 | -0.033 | -0.033 | -0.019 | -0.221 |
| Bay of Bengal box | 144 | 4 | -0.195 | +0.039 | +0.114 | +0.098 | +0.179 | +0.142 |
| Bay of Bengal box | 144 | 8 | -0.498 | -0.010 | -0.048 | -0.058 | +0.010 | -0.040 |
| Arabian Sea box | 120 | 4 | -0.164 | +0.029 | +0.130 | +0.123 | +0.238 | +0.237 |
| Arabian Sea box | 120 | 8 | -0.412 | +0.032 | +0.062 | +0.051 | +0.124 | +0.082 |
| north of 28N | 360 | 4 | +0.141 | -0.017 | +0.009 | -0.011 | +0.045 | +0.103 |
| north of 28N | 360 | 8 | +0.016 | -0.016 | -0.023 | -0.032 | -0.021 | -0.051 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 52% of cells below 0; (6.5, 73.5) -0.50, bias +0.0776 sea 0 m; (6.5, 80.5) -0.49, bias +0.104 land 172 m; (10.5, 100.5) -0.47, bias +0.202 sea 3 m
- day 4 tp: 44% of cells below 0; (17.5, 65.5) -2.96, bias +0.408 sea 0 m; (28.5, 65.5) -2.83, bias +0.221 land 1204 m; (29.5, 65.5) -2.55, bias +0.143 land 1166 m
- day 4 u10: 34% of cells below 0; (29.5, 95.5) -1.40, bias -0.0968 land 3567 m; (25.5, 96.5) -1.08, bias -0.0145 land 432 m; (35.5, 72.5) -1.05, bias +0.0825 land 3025 m
- day 4 v10: 45% of cells below 0; (27.5, 96.5) -0.70, bias -0.0582 land 1479 m; (27.5, 86.5) -0.58, bias -0.0324 land 2434 m; (27.5, 87.5) -0.50, bias -0.0439 land 2856 m
- day 4 msl: 6% of cells below 0; (6.5, 100.5) -0.08, bias -34.3 land 106 m; (37.5, 100.5) -0.06, bias -91.2 land 3449 m; (9.5, 100.5) -0.06, bias -14.9 sea 15 m
- day 4 tcwv: 23% of cells below 0; (35.5, 82.5) -0.45, bias +0.0606 land 4950 m; (35.5, 83.5) -0.43, bias -0.192 land 5005 m; (35.5, 81.5) -0.41, bias +0.228 land 4809 m
- day 8 t2m: 82% of cells below 0; (7.5, 77.5) -1.04, bias +0.469 sea 11 m; (13.5, 94.5) -0.91, bias +0.503 sea 0 m; (7.5, 76.5) -0.87, bias +0.37 sea 7 m
- day 8 tp: 65% of cells below 0; (28.5, 65.5) -0.60, bias +0.148 land 1204 m; (18.5, 65.5) -0.26, bias -0.0069 sea 0 m; (25.5, 87.5) -0.25, bias +1.4 land 64 m
- day 8 u10: 68% of cells below 0; (29.5, 95.5) -2.50, bias -0.188 land 3567 m; (35.5, 72.5) -1.99, bias +0.139 land 3025 m; (35.5, 73.5) -1.79, bias -0.0473 land 3315 m
- day 8 v10: 85% of cells below 0; (27.5, 96.5) -1.11, bias -0.129 land 1479 m; (27.5, 97.5) -0.83, bias -0.0964 land 2097 m; (28.5, 95.5) -0.78, bias -0.0466 land 1944 m
- day 8 msl: 53% of cells below 0; (6.5, 100.5) -0.20, bias -50.6 land 106 m; (10.5, 98.5) -0.20, bias -68.2 sea 56 m; (9.5, 100.5) -0.19, bias -25.6 sea 15 m
- day 8 tcwv: 59% of cells below 0; (35.5, 82.5) -0.85, bias +0.305 land 4950 m; (35.5, 81.5) -0.75, bias +0.676 land 4809 m; (37.5, 72.5) -0.71, bias +1.02 land 4245 m
