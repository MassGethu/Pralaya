## e1_ocean on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.298 | +0.298 | 0.530 / 0.436 / 0.277 | +0.168 |
| 4 | +0.096 | +0.260 | 0.337 / 0.228 / 0.277 | +0.083 |
| 8 | -0.058 | +0.205 | 0.276 / 0.212 / 0.277 | -0.002 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.55 / 1.889 / 1.722  (SS best +0.100, vs pers +0.179)
- tp: 6.704 / 9.366 / 6.838  (SS best +0.019, vs pers +0.284)
- u10: 1.464 / 1.973 / 1.67  (SS best +0.123, vs pers +0.258)
- v10: 1.332 / 1.939 / 1.46  (SS best +0.088, vs pers +0.313)
- msl: 244.3 / 328.5 / 278.4  (SS best +0.123, vs pers +0.257)
- tcwv: 5.379 / 7.366 / 6.138  (SS best +0.124, vs pers +0.270)

Aggregate: SS per-window +0.0457 (proxy 11.4/30), CSI skill +0.0651 (proxy 9.8/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0049999952316284, 'tp': 0.8410000205039978, 'u10': 0.906000018119812, 'v10': 0.902999997138977, 'msl': 1.0329999923706055, 'tcwv': 0.921999990940094}
Invalid windows: 0; CPU 10-step rollout median 26 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.7/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.87), propagates 95%, stable 78% (max 20.42 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.88), propagates 71%, stable 84% (max 20.30 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.046 [+0.028, +0.062], worst -0.325
- skill day 1: +0.237 [+0.222, +0.250], worst -0.231
- skill day 4: +0.016 [-0.002, +0.037], worst -0.674
- skill day 8: -0.116 [-0.147, -0.086], worst -1.150
- CSI skill per window: +0.065 [+0.045, +0.084], worst -0.234
- day-4 skill vs persistence: +0.221 [+0.198, +0.241], worst -0.409; windows beating persistence 95% [92%, 97%]
- day-8 in-band fraction: 0.90 [0.88, 0.92], worst 0.33
- causality proxy per window: 13.7 [13.4, 13.9], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 2.6, median 20.6, p95 40.0
- warm_ocean: stable 78% [70%, 85%]; unstable by channel {'t2m': 0, 'tp': 78, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-09 20.42 std (tp), 2020-05-10 18.33 std (tp), 2020-05-01 17.7 std (tp)
- monsoon_stall: stable 84% [75%, 92%]; unstable by channel {'t2m': 0, 'tp': 55, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-05 20.3 std (tp), 2020-06-07 16.59 std (tp), 2020-06-10 13.86 std (tp)
- worst windows (per-window skill): 2020-04-27 -0.325, 2020-10-28 -0.310, 2020-05-04 -0.302, 2020-02-10 -0.290, 2020-02-11 -0.268
- worst windows (day-8 skill): 2020-10-28 -1.150, 2020-04-27 -0.983, 2020-05-04 -0.726, 2020-10-26 -0.723, 2020-04-26 -0.695

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.100 | +0.020 | +0.123 | +0.088 | +0.123 | +0.124 |
| all | 1152 | 8 | -0.069 | -0.101 | -0.039 | -0.060 | +0.002 | -0.079 |
| ocean (lsm<0.5) | 416 | 4 | -0.115 | +0.028 | +0.147 | +0.113 | +0.179 | +0.127 |
| ocean (lsm<0.5) | 416 | 8 | -0.361 | -0.104 | -0.031 | -0.057 | -0.022 | -0.080 |
| land below 1000 m | 391 | 4 | +0.073 | +0.012 | +0.080 | +0.027 | +0.186 | +0.140 |
| land below 1000 m | 391 | 8 | -0.113 | -0.113 | -0.067 | -0.090 | +0.017 | -0.065 |
| highlands >=2000 m | 287 | 4 | +0.148 | -0.010 | +0.024 | -0.014 | +0.087 | -0.107 |
| highlands >=2000 m | 287 | 8 | -0.000 | -0.039 | -0.038 | -0.033 | +0.007 | -0.288 |
| Bay of Bengal box | 144 | 4 | -0.172 | +0.044 | +0.159 | +0.140 | +0.212 | +0.130 |
| Bay of Bengal box | 144 | 8 | -0.421 | -0.124 | -0.064 | -0.077 | -0.002 | -0.096 |
| Arabian Sea box | 120 | 4 | -0.149 | +0.021 | +0.170 | +0.102 | +0.180 | +0.156 |
| Arabian Sea box | 120 | 8 | -0.404 | -0.073 | -0.002 | -0.005 | -0.002 | -0.071 |
| north of 28N | 360 | 4 | +0.132 | -0.056 | +0.014 | -0.017 | +0.086 | +0.022 |
| north of 28N | 360 | 8 | -0.011 | -0.036 | -0.041 | -0.040 | +0.004 | -0.121 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 50% of cells below 0; (18.5, 86.5) -0.47, bias -0.118 sea 0 m; (13.5, 84.5) -0.47, bias +0.114 sea 0 m; (13.5, 86.5) -0.46, bias +0.107 sea 0 m
- day 4 tp: 58% of cells below 0; (27.5, 74.5) -0.66, bias +0.298 land 336 m; (27.5, 73.5) -0.64, bias +0.177 land 275 m; (20.5, 67.5) -0.56, bias -0.0368 sea 0 m
- day 4 u10: 37% of cells below 0; (29.5, 95.5) -1.54, bias -0.08 land 3567 m; (35.5, 73.5) -1.44, bias -0.0086 land 3315 m; (35.5, 72.5) -1.41, bias +0.0784 land 3025 m
- day 4 v10: 42% of cells below 0; (37.5, 71.5) -0.81, bias +0.103 land 3637 m; (27.5, 86.5) -0.59, bias +0.0179 land 2434 m; (37.5, 70.5) -0.56, bias +0.0582 land 2435 m
- day 4 msl: 6% of cells below 0; (36.5, 76.5) -0.07, bias -86.9 land 4472 m; (36.5, 74.5) -0.06, bias -82.5 land 4223 m; (6.5, 97.5) -0.05, bias -0.384 sea 0 m
- day 4 tcwv: 25% of cells below 0; (35.5, 82.5) -0.61, bias +0.11 land 4950 m; (36.5, 86.5) -0.54, bias +0.736 land 4842 m; (35.5, 81.5) -0.54, bias +0.167 land 4809 m
- day 8 t2m: 85% of cells below 0; (17.5, 84.5) -0.84, bias +0.0062 sea 4 m; (17.5, 85.5) -0.84, bias -0.187 sea 0 m; (15.5, 82.5) -0.82, bias -0.287 sea 0 m
- day 8 tp: 94% of cells below 0; (20.5, 67.5) -0.94, bias +0.669 sea 0 m; (20.5, 68.5) -0.67, bias +0.878 sea 0 m; (21.5, 94.5) -0.61, bias +1.58 land 496 m
- day 8 u10: 75% of cells below 0; (29.5, 95.5) -3.00, bias -0.209 land 3567 m; (35.5, 72.5) -2.57, bias +0.0969 land 3025 m; (35.5, 73.5) -2.52, bias -0.053 land 3315 m
- day 8 v10: 89% of cells below 0; (37.5, 71.5) -1.09, bias +0.0895 land 3637 m; (37.5, 70.5) -0.96, bias +0.0317 land 2435 m; (27.5, 95.5) -0.94, bias +0.218 land 765 m
- day 8 msl: 56% of cells below 0; (9.5, 96.5) -0.29, bias -72.1 sea 0 m; (10.5, 96.5) -0.26, bias -75.8 sea 0 m; (8.5, 96.5) -0.25, bias -50.4 sea 0 m
- day 8 tcwv: 88% of cells below 0; (36.5, 86.5) -1.22, bias +1.43 land 4842 m; (35.5, 82.5) -1.14, bias +0.418 land 4950 m; (32.5, 88.5) -1.07, bias +0.951 land 4913 m
