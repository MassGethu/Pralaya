## h2_structloss on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.299 | +0.299 | 0.531 / 0.436 / 0.277 | +0.169 |
| 4 | +0.097 | +0.261 | 0.338 / 0.228 / 0.277 | +0.084 |
| 8 | -0.058 | +0.204 | 0.277 / 0.212 / 0.277 | +0.000 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.559 / 1.889 / 1.722  (SS best +0.094, vs pers +0.174)
- tp: 6.692 / 9.366 / 6.838  (SS best +0.021, vs pers +0.285)
- u10: 1.46 / 1.973 / 1.67  (SS best +0.126, vs pers +0.260)
- v10: 1.329 / 1.939 / 1.46  (SS best +0.090, vs pers +0.314)
- msl: 243.6 / 328.5 / 278.4  (SS best +0.125, vs pers +0.259)
- tcwv: 5.371 / 7.366 / 6.138  (SS best +0.125, vs pers +0.271)

Aggregate: SS per-window +0.0462 (proxy 11.5/30), CSI skill +0.0652 (proxy 9.8/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0080000162124634, 'tp': 0.8029999732971191, 'u10': 0.902999997138977, 'v10': 0.8980000019073486, 'msl': 1.031999945640564, 'tcwv': 0.925000011920929}
Invalid windows: 0; CPU 10-step rollout median 24 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.6/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.87), propagates 95%, stable 79% (max 19.51 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.89), propagates 70%, stable 84% (max 20.87 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.046 [+0.029, +0.063], worst -0.310
- skill day 1: +0.238 [+0.222, +0.251], worst -0.227
- skill day 4: +0.016 [-0.002, +0.037], worst -0.708
- skill day 8: -0.116 [-0.146, -0.086], worst -1.110
- CSI skill per window: +0.065 [+0.044, +0.084], worst -0.231
- day-4 skill vs persistence: +0.220 [+0.197, +0.241], worst -0.416; windows beating persistence 94% [91%, 96%]
- day-8 in-band fraction: 0.90 [0.88, 0.92], worst 0.33
- causality proxy per window: 13.6 [13.4, 13.9], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 2.6, median 20.8, p95 40.2
- warm_ocean: stable 79% [71%, 86%]; unstable by channel {'t2m': 0, 'tp': 75, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-09 19.51 std (tp), 2020-05-10 18.34 std (tp), 2020-05-01 18.19 std (tp)
- monsoon_stall: stable 84% [75%, 92%]; unstable by channel {'t2m': 0, 'tp': 56, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-05 20.87 std (tp), 2020-06-07 16.36 std (tp), 2020-06-10 14.61 std (tp)
- worst windows (per-window skill): 2020-04-27 -0.310, 2020-05-04 -0.307, 2020-10-28 -0.300, 2020-02-11 -0.282, 2020-02-10 -0.277
- worst windows (day-8 skill): 2020-10-28 -1.110, 2020-04-27 -0.933, 2020-05-04 -0.742, 2020-10-26 -0.714, 2020-04-26 -0.704

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.094 | +0.021 | +0.126 | +0.090 | +0.125 | +0.125 |
| all | 1152 | 8 | -0.085 | -0.099 | -0.035 | -0.056 | +0.005 | -0.077 |
| ocean (lsm<0.5) | 416 | 4 | -0.231 | +0.030 | +0.149 | +0.114 | +0.182 | +0.128 |
| ocean (lsm<0.5) | 416 | 8 | -0.558 | -0.102 | -0.028 | -0.054 | -0.019 | -0.077 |
| land below 1000 m | 391 | 4 | +0.074 | +0.013 | +0.083 | +0.030 | +0.188 | +0.141 |
| land below 1000 m | 391 | 8 | -0.127 | -0.110 | -0.063 | -0.085 | +0.021 | -0.064 |
| highlands >=2000 m | 287 | 4 | +0.152 | -0.009 | +0.027 | -0.011 | +0.090 | -0.099 |
| highlands >=2000 m | 287 | 8 | +0.004 | -0.032 | -0.032 | -0.028 | +0.010 | -0.268 |
| Bay of Bengal box | 144 | 4 | -0.294 | +0.046 | +0.161 | +0.142 | +0.215 | +0.130 |
| Bay of Bengal box | 144 | 8 | -0.621 | -0.124 | -0.064 | -0.075 | +0.002 | -0.096 |
| Arabian Sea box | 120 | 4 | -0.240 | +0.023 | +0.172 | +0.104 | +0.184 | +0.158 |
| Arabian Sea box | 120 | 8 | -0.569 | -0.073 | +0.002 | -0.001 | +0.001 | -0.069 |
| north of 28N | 360 | 4 | +0.136 | -0.055 | +0.017 | -0.014 | +0.088 | +0.025 |
| north of 28N | 360 | 8 | -0.007 | -0.030 | -0.035 | -0.035 | +0.007 | -0.112 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 53% of cells below 0; (18.5, 86.5) -0.73, bias -0.116 sea 0 m; (11.5, 86.5) -0.68, bias +0.149 sea 0 m; (12.5, 86.5) -0.68, bias +0.153 sea 0 m
- day 4 tp: 57% of cells below 0; (27.5, 74.5) -0.66, bias +0.278 land 336 m; (27.5, 73.5) -0.63, bias +0.153 land 275 m; (20.5, 67.5) -0.54, bias -0.0885 sea 0 m
- day 4 u10: 36% of cells below 0; (29.5, 95.5) -1.48, bias -0.0847 land 3567 m; (35.5, 73.5) -1.35, bias -0.0109 land 3315 m; (26.5, 97.5) -1.29, bias +0.126 land 1110 m
- day 4 v10: 40% of cells below 0; (37.5, 71.5) -0.76, bias +0.103 land 3637 m; (27.5, 86.5) -0.52, bias +0.0153 land 2434 m; (37.5, 70.5) -0.52, bias +0.0549 land 2435 m
- day 4 msl: 6% of cells below 0; (36.5, 76.5) -0.07, bias -83.6 land 4472 m; (6.5, 96.5) -0.05, bias -0.716 sea 2 m; (6.5, 97.5) -0.05, bias -0.268 sea 0 m
- day 4 tcwv: 25% of cells below 0; (35.5, 82.5) -0.58, bias +0.0719 land 4950 m; (35.5, 81.5) -0.51, bias +0.114 land 4809 m; (33.5, 85.5) -0.51, bias +0.698 land 5088 m
- day 8 t2m: 85% of cells below 0; (15.5, 82.5) -1.19, bias -0.415 sea 0 m; (11.5, 86.5) -1.17, bias +0.305 sea 0 m; (14.5, 82.5) -1.16, bias -0.336 sea 0 m
- day 8 tp: 94% of cells below 0; (20.5, 67.5) -0.98, bias +0.631 sea 0 m; (20.5, 68.5) -0.64, bias +0.828 sea 0 m; (20.5, 66.5) -0.60, bias +0.31 sea 0 m
- day 8 u10: 74% of cells below 0; (29.5, 95.5) -2.91, bias -0.214 land 3567 m; (35.5, 73.5) -2.31, bias -0.0479 land 3315 m; (35.5, 72.5) -2.27, bias +0.0958 land 3025 m
- day 8 v10: 87% of cells below 0; (37.5, 71.5) -1.00, bias +0.0973 land 3637 m; (37.5, 70.5) -0.86, bias +0.0319 land 2435 m; (27.5, 95.5) -0.85, bias +0.197 land 765 m
- day 8 msl: 53% of cells below 0; (9.5, 96.5) -0.29, bias -72 sea 0 m; (10.5, 96.5) -0.26, bias -75.9 sea 0 m; (8.5, 96.5) -0.24, bias -49.9 sea 0 m
- day 8 tcwv: 88% of cells below 0; (36.5, 86.5) -1.11, bias +1.33 land 4842 m; (35.5, 82.5) -1.06, bias +0.333 land 4950 m; (32.5, 88.5) -0.99, bias +0.82 land 4913 m
