## b3_roll4 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.299 | +0.299 | 0.535 / 0.436 / 0.277 | +0.176 |
| 4 | +0.092 | +0.257 | 0.345 / 0.228 / 0.277 | +0.094 |
| 8 | -0.058 | +0.204 | 0.282 / 0.212 / 0.277 | +0.007 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.573 / 1.889 / 1.722  (SS best +0.086, vs pers +0.167)
- tp: 6.681 / 9.366 / 6.838  (SS best +0.023, vs pers +0.287)
- u10: 1.474 / 1.973 / 1.67  (SS best +0.117, vs pers +0.253)
- v10: 1.339 / 1.939 / 1.46  (SS best +0.083, vs pers +0.309)
- msl: 245.5 / 328.5 / 278.4  (SS best +0.118, vs pers +0.253)
- tcwv: 5.368 / 7.366 / 6.138  (SS best +0.126, vs pers +0.271)

Aggregate: SS per-window +0.0461 (proxy 11.5/30), CSI skill +0.0710 (proxy 10.7/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0130000114440918, 'tp': 0.8489999771118164, 'u10': 0.8849999904632568, 'v10': 0.9380000233650208, 'msl': 0.953000009059906, 'tcwv': 0.9440000057220459}
Invalid windows: 0; CPU 10-step rollout median 114 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.8/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.89), propagates 94%, stable 86% (max 20.17 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.91), propagates 64%, stable 90% (max 16.88 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.046 [+0.029, +0.063], worst -0.348
- skill day 1: +0.239 [+0.224, +0.252], worst -0.240
- skill day 4: +0.015 [-0.003, +0.034], worst -0.581
- skill day 8: -0.116 [-0.147, -0.087], worst -1.145
- CSI skill per window: +0.071 [+0.051, +0.089], worst -0.230
- day-4 skill vs persistence: +0.219 [+0.195, +0.239], worst -0.474; windows beating persistence 96% [94%, 98%]
- day-8 in-band fraction: 0.90 [0.88, 0.92], worst 0.33
- causality proxy per window: 13.8 [13.5, 14.0], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 2.8, median 21.6, p95 39.4
- warm_ocean: stable 86% [77%, 92%]; unstable by channel {'t2m': 0, 'tp': 51, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-09 20.17 std (tp), 2020-05-08 17.78 std (tp), 2020-05-06 15.26 std (tp)
- monsoon_stall: stable 90% [82%, 95%]; unstable by channel {'t2m': 0, 'tp': 37, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-19 16.88 std (tp), 2020-10-14 13.26 std (tp), 2020-06-07 12.54 std (tp)
- worst windows (per-window skill): 2020-05-04 -0.348, 2020-10-28 -0.326, 2020-05-06 -0.279, 2020-02-10 -0.251, 2020-02-11 -0.231
- worst windows (day-8 skill): 2020-10-28 -1.145, 2020-05-04 -0.859, 2020-04-26 -0.777, 2020-10-26 -0.770, 2020-10-27 -0.650

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.086 | +0.023 | +0.117 | +0.083 | +0.118 | +0.125 |
| all | 1152 | 8 | -0.105 | -0.084 | -0.042 | -0.061 | -0.004 | -0.055 |
| ocean (lsm<0.5) | 416 | 4 | -0.234 | +0.030 | +0.137 | +0.105 | +0.171 | +0.129 |
| ocean (lsm<0.5) | 416 | 8 | -0.573 | -0.089 | -0.037 | -0.059 | -0.025 | -0.049 |
| land below 1000 m | 391 | 4 | +0.054 | +0.014 | +0.077 | +0.026 | +0.173 | +0.142 |
| land below 1000 m | 391 | 8 | -0.180 | -0.092 | -0.059 | -0.085 | -0.005 | -0.045 |
| highlands >=2000 m | 287 | 4 | +0.151 | +0.009 | +0.039 | +0.001 | +0.087 | -0.107 |
| highlands >=2000 m | 287 | 8 | +0.007 | -0.028 | -0.034 | -0.031 | +0.008 | -0.295 |
| Bay of Bengal box | 144 | 4 | -0.311 | +0.033 | +0.149 | +0.128 | +0.200 | +0.129 |
| Bay of Bengal box | 144 | 8 | -0.657 | -0.120 | -0.077 | -0.070 | -0.003 | -0.060 |
| Arabian Sea box | 120 | 4 | -0.247 | +0.033 | +0.166 | +0.106 | +0.186 | +0.162 |
| Arabian Sea box | 120 | 8 | -0.590 | -0.053 | +0.002 | -0.020 | +0.014 | -0.036 |
| north of 28N | 360 | 4 | +0.134 | -0.029 | +0.026 | -0.005 | +0.086 | +0.016 |
| north of 28N | 360 | 8 | -0.009 | -0.027 | -0.039 | -0.037 | +0.006 | -0.133 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 55% of cells below 0; (11.5, 86.5) -0.68, bias +0.0811 sea 0 m; (13.5, 83.5) -0.67, bias -0.0507 sea 0 m; (10.5, 86.5) -0.67, bias +0.0047 sea 0 m
- day 4 tp: 55% of cells below 0; (27.5, 74.5) -0.59, bias +0.239 land 336 m; (27.5, 73.5) -0.55, bias +0.0997 land 275 m; (26.5, 74.5) -0.45, bias +0.255 land 372 m
- day 4 u10: 36% of cells below 0; (35.5, 73.5) -1.55, bias -0.0141 land 3315 m; (35.5, 72.5) -1.44, bias +0.0705 land 3025 m; (29.5, 95.5) -1.43, bias -0.0784 land 3567 m
- day 4 v10: 37% of cells below 0; (37.5, 71.5) -0.80, bias +0.119 land 3637 m; (27.5, 96.5) -0.56, bias +0.0104 land 1479 m; (37.5, 70.5) -0.53, bias +0.0796 land 2435 m
- day 4 msl: 6% of cells below 0; (36.5, 76.5) -0.08, bias -137 land 4472 m; (36.5, 74.5) -0.07, bias -135 land 4223 m; (36.5, 83.5) -0.06, bias -168 land 3654 m
- day 4 tcwv: 26% of cells below 0; (35.5, 82.5) -0.61, bias -0.371 land 4950 m; (35.5, 78.5) -0.61, bias -0.561 land 5170 m; (35.5, 83.5) -0.53, bias -0.445 land 5005 m
- day 8 t2m: 88% of cells below 0; (11.5, 85.5) -1.31, bias +0.303 sea 0 m; (11.5, 86.5) -1.29, bias +0.272 sea 0 m; (7.5, 83.5) -1.28, bias -0.343 sea 0 m
- day 8 tp: 93% of cells below 0; (17.5, 95.5) -0.62, bias +2.03 land 82 m; (20.5, 67.5) -0.58, bias +0.628 sea 0 m; (20.5, 95.5) -0.51, bias +1.6 land 273 m
- day 8 u10: 75% of cells below 0; (29.5, 95.5) -2.95, bias -0.207 land 3567 m; (35.5, 73.5) -2.87, bias -0.106 land 3315 m; (35.5, 72.5) -2.55, bias +0.0443 land 3025 m
- day 8 v10: 88% of cells below 0; (27.5, 96.5) -1.04, bias -0.0338 land 1479 m; (37.5, 71.5) -0.97, bias +0.117 land 3637 m; (27.5, 95.5) -0.90, bias +0.208 land 765 m
- day 8 msl: 59% of cells below 0; (9.5, 96.5) -0.30, bias -77.1 sea 0 m; (10.5, 96.5) -0.27, bias -79.7 sea 0 m; (8.5, 96.5) -0.25, bias -57.2 sea 0 m
- day 8 tcwv: 85% of cells below 0; (35.5, 82.5) -1.19, bias -0.384 land 4950 m; (35.5, 78.5) -1.16, bias -1.09 land 5170 m; (35.5, 77.5) -1.14, bias -1.22 land 5116 m
