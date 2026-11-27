## h1_multiscale on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.297 | +0.297 | 0.530 / 0.436 / 0.277 | +0.167 |
| 4 | +0.095 | +0.259 | 0.337 / 0.228 / 0.277 | +0.083 |
| 8 | -0.060 | +0.203 | 0.277 / 0.212 / 0.277 | -0.001 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.558 / 1.889 / 1.722  (SS best +0.095, vs pers +0.175)
- tp: 6.7 / 9.366 / 6.838  (SS best +0.020, vs pers +0.285)
- u10: 1.465 / 1.973 / 1.67  (SS best +0.123, vs pers +0.258)
- v10: 1.332 / 1.939 / 1.46  (SS best +0.088, vs pers +0.313)
- msl: 244.5 / 328.5 / 278.4  (SS best +0.122, vs pers +0.256)
- tcwv: 5.377 / 7.366 / 6.138  (SS best +0.124, vs pers +0.270)

Aggregate: SS per-window +0.0434 (proxy 10.8/30), CSI skill +0.0648 (proxy 9.7/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0099999904632568, 'tp': 0.8510000109672546, 'u10': 0.9110000133514404, 'v10': 0.9079999923706055, 'msl': 1.0290000438690186, 'tcwv': 0.925000011920929}
Invalid windows: 0; CPU 10-step rollout median 33 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.7/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.87), propagates 96%, stable 79% (max 18.69 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.88), propagates 72%, stable 84% (max 19.97 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.043 [+0.026, +0.060], worst -0.324
- skill day 1: +0.236 [+0.220, +0.249], worst -0.232
- skill day 4: +0.014 [-0.004, +0.035], worst -0.685
- skill day 8: -0.120 [-0.151, -0.091], worst -1.143
- CSI skill per window: +0.065 [+0.044, +0.083], worst -0.227
- day-4 skill vs persistence: +0.219 [+0.195, +0.239], worst -0.413; windows beating persistence 93% [90%, 96%]
- day-8 in-band fraction: 0.90 [0.88, 0.92], worst 0.33
- causality proxy per window: 13.7 [13.4, 13.9], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 2.1, median 19.9, p95 39.4
- warm_ocean: stable 79% [71%, 86%]; unstable by channel {'t2m': 0, 'tp': 74, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-10 18.69 std (tp), 2020-05-09 18.31 std (tp), 2020-05-08 17.47 std (tp)
- monsoon_stall: stable 84% [75%, 92%]; unstable by channel {'t2m': 0, 'tp': 57, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-05 19.97 std (tp), 2020-06-07 15.48 std (tp), 2020-06-10 13.35 std (tp)
- worst windows (per-window skill): 2020-04-27 -0.324, 2020-10-28 -0.311, 2020-05-04 -0.304, 2020-02-10 -0.283, 2020-02-11 -0.274
- worst windows (day-8 skill): 2020-10-28 -1.143, 2020-04-27 -0.985, 2020-10-26 -0.761, 2020-05-04 -0.740, 2020-04-26 -0.728

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.095 | +0.020 | +0.123 | +0.088 | +0.122 | +0.124 |
| all | 1152 | 8 | -0.082 | -0.100 | -0.040 | -0.060 | +0.002 | -0.078 |
| ocean (lsm<0.5) | 416 | 4 | -0.234 | +0.029 | +0.146 | +0.113 | +0.180 | +0.127 |
| ocean (lsm<0.5) | 416 | 8 | -0.552 | -0.103 | -0.033 | -0.058 | -0.024 | -0.079 |
| land below 1000 m | 391 | 4 | +0.074 | +0.013 | +0.080 | +0.027 | +0.185 | +0.141 |
| land below 1000 m | 391 | 8 | -0.128 | -0.112 | -0.068 | -0.089 | +0.016 | -0.064 |
| highlands >=2000 m | 287 | 4 | +0.154 | -0.008 | +0.024 | -0.014 | +0.086 | -0.103 |
| highlands >=2000 m | 287 | 8 | +0.008 | -0.035 | -0.037 | -0.032 | +0.008 | -0.278 |
| Bay of Bengal box | 144 | 4 | -0.290 | +0.044 | +0.158 | +0.141 | +0.213 | +0.129 |
| Bay of Bengal box | 144 | 8 | -0.612 | -0.127 | -0.069 | -0.080 | -0.005 | -0.096 |
| Arabian Sea box | 120 | 4 | -0.246 | +0.022 | +0.170 | +0.103 | +0.181 | +0.156 |
| Arabian Sea box | 120 | 8 | -0.565 | -0.072 | -0.000 | -0.004 | -0.001 | -0.069 |
| north of 28N | 360 | 4 | +0.138 | -0.054 | +0.014 | -0.017 | +0.085 | +0.024 |
| north of 28N | 360 | 8 | -0.002 | -0.036 | -0.040 | -0.039 | +0.005 | -0.119 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 53% of cells below 0; (18.5, 86.5) -0.74, bias -0.128 sea 0 m; (17.5, 85.5) -0.69, bias -0.0753 sea 0 m; (11.5, 86.5) -0.66, bias +0.139 sea 0 m
- day 4 tp: 57% of cells below 0; (27.5, 74.5) -0.63, bias +0.265 land 336 m; (27.5, 73.5) -0.60, bias +0.144 land 275 m; (20.5, 67.5) -0.56, bias -0.0745 sea 0 m
- day 4 u10: 37% of cells below 0; (29.5, 95.5) -1.52, bias -0.0777 land 3567 m; (35.5, 73.5) -1.45, bias -0.0143 land 3315 m; (35.5, 72.5) -1.41, bias +0.0727 land 3025 m
- day 4 v10: 42% of cells below 0; (37.5, 71.5) -0.78, bias +0.101 land 3637 m; (27.5, 86.5) -0.57, bias +0.0211 land 2434 m; (27.5, 96.5) -0.55, bias +0.0106 land 1479 m
- day 4 msl: 6% of cells below 0; (36.5, 76.5) -0.07, bias -89.8 land 4472 m; (36.5, 74.5) -0.06, bias -84 land 4223 m; (6.5, 97.5) -0.05, bias +0.793 sea 0 m
- day 4 tcwv: 25% of cells below 0; (35.5, 82.5) -0.59, bias +0.137 land 4950 m; (36.5, 86.5) -0.54, bias +0.764 land 4842 m; (35.5, 81.5) -0.52, bias +0.185 land 4809 m
- day 8 t2m: 85% of cells below 0; (18.5, 86.5) -1.16, bias -0.285 sea 0 m; (17.5, 85.5) -1.15, bias -0.222 sea 0 m; (11.5, 86.5) -1.13, bias +0.286 sea 0 m
- day 8 tp: 94% of cells below 0; (20.5, 67.5) -0.84, bias +0.563 sea 0 m; (21.5, 94.5) -0.61, bias +1.57 land 496 m; (20.5, 68.5) -0.59, bias +0.774 sea 0 m
- day 8 u10: 75% of cells below 0; (29.5, 95.5) -2.92, bias -0.207 land 3567 m; (35.5, 73.5) -2.57, bias -0.0686 land 3315 m; (35.5, 72.5) -2.53, bias +0.0801 land 3025 m
- day 8 v10: 88% of cells below 0; (37.5, 71.5) -1.01, bias +0.0858 land 3637 m; (27.5, 95.5) -0.95, bias +0.226 land 765 m; (37.5, 70.5) -0.92, bias +0.0334 land 2435 m
- day 8 msl: 56% of cells below 0; (9.5, 96.5) -0.30, bias -73.1 sea 0 m; (10.5, 96.5) -0.27, bias -76.7 sea 0 m; (8.5, 96.5) -0.26, bias -50.5 sea 0 m
- day 8 tcwv: 88% of cells below 0; (36.5, 86.5) -1.21, bias +1.5 land 4842 m; (35.5, 82.5) -1.06, bias +0.462 land 4950 m; (32.5, 88.5) -1.03, bias +0.916 land 4913 m
