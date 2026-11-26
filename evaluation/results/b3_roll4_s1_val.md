## b3_roll4_s1 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.295 | +0.295 | 0.533 / 0.436 / 0.277 | +0.172 |
| 4 | +0.086 | +0.251 | 0.352 / 0.228 / 0.277 | +0.103 |
| 8 | -0.061 | +0.202 | 0.298 / 0.212 / 0.277 | +0.029 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.639 / 1.889 / 1.722  (SS best +0.048, vs pers +0.132)
- tp: 6.663 / 9.366 / 6.838  (SS best +0.026, vs pers +0.289)
- u10: 1.445 / 1.973 / 1.67  (SS best +0.135, vs pers +0.268)
- v10: 1.368 / 1.939 / 1.46  (SS best +0.063, vs pers +0.294)
- msl: 243.3 / 328.5 / 278.4  (SS best +0.126, vs pers +0.260)
- tcwv: 5.408 / 7.366 / 6.138  (SS best +0.119, vs pers +0.266)

Aggregate: SS per-window +0.0428 (proxy 10.7/30), CSI skill +0.0716 (proxy 10.7/15), anti-blur proxy 10.0/10 (in-band 89%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0329999923706055, 'tp': 0.8519999980926514, 'u10': 0.7979999780654907, 'v10': 0.8259999752044678, 'msl': 0.9430000185966492, 'tcwv': 0.9639999866485596}
Invalid windows: 0; CPU 10-step rollout median 113 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.8/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.81), propagates 96%, stable 85% (max 17.60 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.91), propagates 62%, stable 91% (max 17.33 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.043 [+0.028, +0.058], worst -0.298
- skill day 1: +0.237 [+0.222, +0.249], worst -0.267
- skill day 4: +0.009 [-0.010, +0.029], worst -0.844
- skill day 8: -0.117 [-0.143, -0.092], worst -0.898
- CSI skill per window: +0.072 [+0.050, +0.090], worst -0.241
- day-4 skill vs persistence: +0.215 [+0.192, +0.233], worst -0.430; windows beating persistence 95% [92%, 97%]
- day-8 in-band fraction: 0.89 [0.87, 0.91], worst 0.50
- causality proxy per window: 13.8 [13.6, 14.0], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 1.8, median 21.2, p95 38.3
- warm_ocean: stable 85% [78%, 91%]; unstable by channel {'t2m': 0, 'tp': 53, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-04-29 17.6 std (tp), 2020-05-30 14.3 std (tp), 2020-04-30 13.39 std (tp)
- monsoon_stall: stable 91% [86%, 96%]; unstable by channel {'t2m': 0, 'tp': 31, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-30 17.33 std (tp), 2020-05-28 13.72 std (tp), 2020-05-19 11.18 std (tp)
- worst windows (per-window skill): 2020-04-29 -0.298, 2020-02-11 -0.292, 2020-10-29 -0.283, 2020-12-02 -0.268, 2020-04-30 -0.250
- worst windows (day-8 skill): 2020-04-29 -0.898, 2020-10-29 -0.777, 2020-11-11 -0.770, 2020-10-28 -0.762, 2020-04-30 -0.748

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.048 | +0.026 | +0.135 | +0.063 | +0.126 | +0.119 |
| all | 1152 | 8 | -0.178 | -0.057 | -0.022 | -0.067 | -0.007 | -0.036 |
| ocean (lsm<0.5) | 416 | 4 | -0.437 | +0.032 | +0.157 | +0.082 | +0.171 | +0.125 |
| ocean (lsm<0.5) | 416 | 8 | -0.869 | -0.054 | -0.014 | -0.065 | -0.045 | -0.037 |
| land below 1000 m | 391 | 4 | +0.031 | +0.018 | +0.096 | +0.014 | +0.174 | +0.131 |
| land below 1000 m | 391 | 8 | -0.207 | -0.061 | -0.044 | -0.084 | +0.000 | -0.018 |
| highlands >=2000 m | 287 | 4 | +0.126 | +0.004 | +0.032 | -0.004 | +0.099 | -0.092 |
| highlands >=2000 m | 287 | 8 | -0.063 | -0.058 | -0.045 | -0.050 | +0.004 | -0.264 |
| Bay of Bengal box | 144 | 4 | -0.540 | +0.037 | +0.176 | +0.079 | +0.189 | +0.099 |
| Bay of Bengal box | 144 | 8 | -0.929 | -0.075 | -0.023 | -0.106 | -0.037 | -0.079 |
| Arabian Sea box | 120 | 4 | -0.414 | +0.038 | +0.166 | +0.118 | +0.202 | +0.155 |
| Arabian Sea box | 120 | 8 | -0.791 | -0.021 | -0.016 | +0.006 | -0.003 | -0.005 |
| north of 28N | 360 | 4 | +0.101 | -0.023 | +0.025 | -0.012 | +0.096 | +0.013 |
| north of 28N | 360 | 8 | -0.091 | -0.045 | -0.043 | -0.050 | +0.002 | -0.088 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 61% of cells below 0; (13.5, 85.5) -1.61, bias +0.348 sea 0 m; (12.5, 85.5) -1.56, bias +0.358 sea 0 m; (13.5, 84.5) -1.48, bias +0.343 sea 0 m
- day 4 tp: 55% of cells below 0; (20.5, 67.5) -0.65, bias +0.261 sea 0 m; (19.5, 67.5) -0.61, bias +0.553 sea 0 m; (37.5, 95.5) -0.46, bias +0.179 land 3361 m
- day 4 u10: 31% of cells below 0; (35.5, 72.5) -1.47, bias -0.0923 land 3025 m; (35.5, 73.5) -1.44, bias +0.0305 land 3315 m; (29.5, 95.5) -1.30, bias -0.0063 land 3567 m
- day 4 v10: 43% of cells below 0; (27.5, 96.5) -0.71, bias -0.0015 land 1479 m; (37.5, 71.5) -0.66, bias +0.0752 land 3637 m; (26.5, 98.5) -0.61, bias +0.0687 land 1975 m
- day 4 msl: 4% of cells below 0; (6.5, 95.5) -0.09, bias -15.1 sea 5 m; (6.5, 100.5) -0.08, bias -31.6 land 106 m; (6.5, 99.5) -0.07, bias -34 sea 27 m
- day 4 tcwv: 25% of cells below 0; (35.5, 78.5) -0.57, bias -0.209 land 5170 m; (35.5, 77.5) -0.55, bias -0.271 land 5116 m; (35.5, 79.5) -0.54, bias -0.172 land 4987 m
- day 8 t2m: 90% of cells below 0; (9.5, 74.5) -1.91, bias +0.366 sea 0 m; (13.5, 85.5) -1.89, bias +0.588 sea 0 m; (10.5, 74.5) -1.89, bias +0.417 sea 0 m
- day 8 tp: 89% of cells below 0; (37.5, 95.5) -0.98, bias +0.535 land 3361 m; (36.5, 93.5) -0.95, bias +0.948 land 3633 m; (36.5, 94.5) -0.73, bias +0.364 land 3414 m
- day 8 u10: 75% of cells below 0; (35.5, 72.5) -2.35, bias -0.17 land 3025 m; (25.5, 96.5) -2.18, bias +0.286 land 432 m; (35.5, 73.5) -2.01, bias +0.0263 land 3315 m
- day 8 v10: 89% of cells below 0; (27.5, 96.5) -1.26, bias -0.0523 land 1479 m; (27.5, 86.5) -1.07, bias -0.141 land 2434 m; (27.5, 87.5) -1.05, bias -0.0658 land 2856 m
- day 8 msl: 57% of cells below 0; (6.5, 100.5) -0.28, bias -51.3 land 106 m; (7.5, 100.5) -0.25, bias -63.1 sea 45 m; (9.5, 94.5) -0.24, bias -59.2 sea 0 m
- day 8 tcwv: 75% of cells below 0; (35.5, 77.5) -1.08, bias -0.842 land 5116 m; (36.5, 85.5) -1.03, bias +1.99 land 4598 m; (36.5, 86.5) -1.00, bias +1.89 land 4842 m
