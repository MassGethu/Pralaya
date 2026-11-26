## e3_rainstab on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.295 | +0.295 | 0.534 / 0.436 / 0.277 | +0.174 |
| 4 | +0.104 | +0.266 | 0.347 / 0.228 / 0.277 | +0.097 |
| 8 | -0.015 | +0.237 | 0.294 / 0.212 / 0.277 | +0.023 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.553 / 1.889 / 1.722  (SS best +0.098, vs pers +0.178)
- tp: 6.558 / 9.366 / 6.838  (SS best +0.041, vs pers +0.300)
- u10: 1.446 / 1.973 / 1.67  (SS best +0.135, vs pers +0.267)
- v10: 1.319 / 1.939 / 1.46  (SS best +0.097, vs pers +0.320)
- msl: 242.7 / 328.5 / 278.4  (SS best +0.129, vs pers +0.261)
- tcwv: 5.364 / 7.366 / 6.138  (SS best +0.126, vs pers +0.272)

Aggregate: SS per-window +0.0644 (proxy 16.1/30), CSI skill +0.0738 (proxy 11.1/15), anti-blur proxy 10.0/10 (in-band 89%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.011, 'tp': 0.608, 'u10': 0.796, 'v10': 0.826, 'msl': 0.981, 'tcwv': 0.901}
Invalid windows: 0; CPU 10-step rollout median 54 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.9/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.89), propagates 98%, stable 93% (max 12.89 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.90), propagates 57%, stable 95% (max 8.53 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.064 [+0.052, +0.078], worst -0.253
- skill day 1: +0.235 [+0.219, +0.248], worst -0.204
- skill day 4: +0.027 [+0.010, +0.046], worst -0.722
- skill day 8: -0.068 [-0.090, -0.046], worst -0.872
- CSI skill per window: +0.074 [+0.055, +0.092], worst -0.265
- day-4 skill vs persistence: +0.229 [+0.208, +0.247], worst -0.263; windows beating persistence 95% [93%, 98%]
- day-8 in-band fraction: 0.89 [0.86, 0.91], worst 0.33
- causality proxy per window: 13.9 [13.7, 14.2], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 7.6, median 26.4, p95 42.5
- warm_ocean: stable 93% [88%, 97%]; unstable by channel {'t2m': 0, 'tp': 25, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-10 12.89 std (tp), 2020-05-06 12.09 std (tp), 2020-05-08 11.99 std (tp)
- monsoon_stall: stable 95% [91%, 98%]; unstable by channel {'t2m': 0, 'tp': 18, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-25 8.53 std (tp), 2020-06-05 8.49 std (tp), 2020-05-31 7.79 std (tp)
- worst windows (per-window skill): 2020-02-11 -0.253, 2020-10-28 -0.211, 2020-02-10 -0.203, 2020-05-06 -0.179, 2020-10-03 -0.137
- worst windows (day-8 skill): 2020-10-28 -0.872, 2020-11-11 -0.502, 2020-10-26 -0.499, 2020-10-27 -0.459, 2020-10-03 -0.415

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.098 | +0.041 | +0.135 | +0.097 | +0.128 | +0.126 |
| all | 1152 | 8 | -0.059 | -0.025 | +0.009 | -0.011 | +0.033 | -0.037 |
| ocean (lsm<0.5) | 416 | 4 | -0.127 | +0.052 | +0.160 | +0.122 | +0.186 | +0.131 |
| ocean (lsm<0.5) | 416 | 8 | -0.377 | -0.023 | +0.021 | -0.003 | +0.021 | -0.045 |
| land below 1000 m | 391 | 4 | +0.064 | +0.031 | +0.085 | +0.039 | +0.188 | +0.139 |
| land below 1000 m | 391 | 8 | -0.103 | -0.032 | -0.024 | -0.043 | +0.057 | -0.015 |
| highlands >=2000 m | 287 | 4 | +0.152 | +0.006 | +0.039 | -0.006 | +0.093 | -0.096 |
| highlands >=2000 m | 287 | 8 | +0.010 | -0.009 | -0.016 | -0.021 | +0.029 | -0.236 |
| Bay of Bengal box | 144 | 4 | -0.182 | +0.065 | +0.178 | +0.146 | +0.215 | +0.125 |
| Bay of Bengal box | 144 | 8 | -0.439 | -0.034 | +0.007 | -0.007 | +0.040 | -0.061 |
| Arabian Sea box | 120 | 4 | -0.154 | +0.056 | +0.188 | +0.114 | +0.199 | +0.166 |
| Arabian Sea box | 120 | 8 | -0.398 | +0.002 | +0.065 | +0.027 | +0.047 | -0.049 |
| north of 28N | 360 | 4 | +0.134 | -0.023 | +0.027 | -0.007 | +0.092 | +0.022 |
| north of 28N | 360 | 8 | -0.004 | -0.012 | -0.023 | -0.024 | +0.027 | -0.098 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 53% of cells below 0; (15.5, 83.5) -0.52, bias -0.0615 sea 0 m; (11.5, 86.5) -0.49, bias +0.157 sea 0 m; (12.5, 86.5) -0.49, bias +0.158 sea 0 m
- day 4 tp: 48% of cells below 0; (27.5, 74.5) -0.52, bias +0.175 land 336 m; (20.5, 67.5) -0.52, bias +0.121 sea 0 m; (25.5, 76.5) -0.44, bias +0.949 land 314 m
- day 4 u10: 34% of cells below 0; (35.5, 72.5) -1.61, bias +0.106 land 3025 m; (29.5, 95.5) -1.50, bias -0.0882 land 3567 m; (35.5, 73.5) -1.46, bias -0.0116 land 3315 m
- day 4 v10: 36% of cells below 0; (37.5, 71.5) -0.74, bias +0.0465 land 3637 m; (37.5, 70.5) -0.55, bias +0.0279 land 2435 m; (27.5, 86.5) -0.52, bias -0.0369 land 2434 m
- day 4 msl: 3% of cells below 0; (6.5, 96.5) -0.06, bias -7.65 sea 2 m; (6.5, 97.5) -0.05, bias -4.44 sea 0 m; (6.5, 98.5) -0.04, bias -12.8 sea 1 m
- day 4 tcwv: 25% of cells below 0; (33.5, 85.5) -0.45, bias +0.505 land 5088 m; (35.5, 78.5) -0.45, bias -0.222 land 5170 m; (36.5, 86.5) -0.45, bias +0.775 land 4842 m
- day 8 t2m: 83% of cells below 0; (11.5, 85.5) -0.89, bias +0.44 sea 0 m; (11.5, 86.5) -0.89, bias +0.407 sea 0 m; (12.5, 85.5) -0.85, bias +0.411 sea 0 m
- day 8 tp: 81% of cells below 0; (37.5, 78.5) -0.34, bias +0.536 land 2067 m; (37.5, 77.5) -0.27, bias +0.594 land 2491 m; (20.5, 66.5) -0.24, bias -0.0925 sea 0 m
- day 8 u10: 58% of cells below 0; (29.5, 95.5) -2.63, bias -0.193 land 3567 m; (35.5, 72.5) -2.58, bias +0.144 land 3025 m; (35.5, 73.5) -2.46, bias -0.0539 land 3315 m
- day 8 v10: 74% of cells below 0; (37.5, 71.5) -1.00, bias +0.0295 land 3637 m; (27.5, 96.5) -0.77, bias -0.0553 land 1479 m; (37.5, 70.5) -0.69, bias +0.0019 land 2435 m
- day 8 msl: 31% of cells below 0; (8.5, 78.5) -0.27, bias -2.48 sea 25 m; (7.5, 78.5) -0.26, bias -8.66 sea 4 m; (6.5, 80.5) -0.25, bias +2.85 land 172 m
- day 8 tcwv: 74% of cells below 0; (36.5, 86.5) -0.81, bias +1.25 land 4842 m; (35.5, 82.5) -0.81, bias +0.136 land 4950 m; (35.5, 83.5) -0.74, bias -0.294 land 5005 m
