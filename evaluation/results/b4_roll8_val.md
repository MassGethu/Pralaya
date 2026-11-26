## b4_roll8 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.292 | +0.292 | 0.530 / 0.436 / 0.277 | +0.167 |
| 4 | +0.098 | +0.261 | 0.344 / 0.228 / 0.277 | +0.093 |
| 8 | -0.030 | +0.226 | 0.288 / 0.212 / 0.277 | +0.015 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.574 / 1.889 / 1.722  (SS best +0.086, vs pers +0.167)
- tp: 6.648 / 9.366 / 6.838  (SS best +0.028, vs pers +0.290)
- u10: 1.453 / 1.973 / 1.67  (SS best +0.130, vs pers +0.264)
- v10: 1.326 / 1.939 / 1.46  (SS best +0.092, vs pers +0.316)
- msl: 244.9 / 328.5 / 278.4  (SS best +0.120, vs pers +0.255)
- tcwv: 5.346 / 7.366 / 6.138  (SS best +0.129, vs pers +0.274)

Aggregate: SS per-window +0.0520 (proxy 13.0/30), CSI skill +0.0686 (proxy 10.3/15), anti-blur proxy 10.0/10 (in-band 89%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0399999618530273, 'tp': 0.7440000176429749, 'u10': 0.8799999952316284, 'v10': 0.8080000281333923, 'msl': 1.1160000562667847, 'tcwv': 0.949999988079071}
Invalid windows: 0; CPU 10-step rollout median 45 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.8/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.88), propagates 96%, stable 87% (max 19.75 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.90), propagates 62%, stable 92% (max 7.78 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.052 [+0.037, +0.068], worst -0.339
- skill day 1: +0.230 [+0.215, +0.243], worst -0.181
- skill day 4: +0.016 [-0.002, +0.037], worst -0.808
- skill day 8: -0.090 [-0.115, -0.062], worst -0.920
- CSI skill per window: +0.069 [+0.048, +0.089], worst -0.230
- day-4 skill vs persistence: +0.221 [+0.199, +0.241], worst -0.375; windows beating persistence 94% [90%, 96%]
- day-8 in-band fraction: 0.89 [0.87, 0.91], worst 0.33
- causality proxy per window: 13.8 [13.6, 14.1], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 3.2, median 23.3, p95 41.2
- warm_ocean: stable 87% [80%, 93%]; unstable by channel {'t2m': 0, 'tp': 46, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-08 19.75 std (tp), 2020-05-09 19.64 std (tp), 2020-05-10 18.82 std (tp)
- monsoon_stall: stable 92% [86%, 97%]; unstable by channel {'t2m': 0, 'tp': 28, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-25 7.78 std (tp), 2020-05-31 7.49 std (tp), 2020-07-17 6.81 std (tp)
- worst windows (per-window skill): 2020-05-04 -0.339, 2020-02-11 -0.314, 2020-10-28 -0.237, 2020-02-10 -0.215, 2020-05-01 -0.214
- worst windows (day-8 skill): 2020-10-28 -0.920, 2020-04-26 -0.776, 2020-05-04 -0.742, 2020-05-01 -0.686, 2020-04-27 -0.659

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.086 | +0.028 | +0.130 | +0.092 | +0.121 | +0.129 |
| all | 1152 | 8 | -0.088 | -0.051 | -0.001 | -0.027 | +0.024 | -0.035 |
| ocean (lsm<0.5) | 416 | 4 | -0.226 | +0.034 | +0.155 | +0.118 | +0.182 | +0.134 |
| ocean (lsm<0.5) | 416 | 8 | -0.530 | -0.052 | +0.007 | -0.023 | +0.019 | -0.038 |
| land below 1000 m | 391 | 4 | +0.070 | +0.022 | +0.087 | +0.038 | +0.204 | +0.143 |
| land below 1000 m | 391 | 8 | -0.112 | -0.064 | -0.019 | -0.041 | +0.079 | -0.015 |
| highlands >=2000 m | 287 | 4 | +0.138 | +0.006 | +0.016 | -0.028 | +0.072 | -0.102 |
| highlands >=2000 m | 287 | 8 | -0.020 | +0.008 | -0.038 | -0.037 | -0.001 | -0.249 |
| Bay of Bengal box | 144 | 4 | -0.282 | +0.035 | +0.164 | +0.145 | +0.211 | +0.122 |
| Bay of Bengal box | 144 | 8 | -0.553 | -0.075 | -0.016 | -0.025 | +0.037 | -0.063 |
| Arabian Sea box | 120 | 4 | -0.235 | +0.052 | +0.185 | +0.114 | +0.185 | +0.181 |
| Arabian Sea box | 120 | 8 | -0.549 | -0.009 | +0.035 | +0.012 | +0.030 | -0.019 |
| north of 28N | 360 | 4 | +0.124 | -0.025 | +0.013 | -0.024 | +0.076 | +0.025 |
| north of 28N | 360 | 8 | -0.025 | -0.002 | -0.032 | -0.034 | +0.007 | -0.085 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 55% of cells below 0; (11.5, 86.5) -0.67, bias +0.0507 sea 0 m; (12.5, 87.5) -0.65, bias +0.0321 sea 0 m; (14.5, 65.5) -0.64, bias -0.102 sea 0 m
- day 4 tp: 54% of cells below 0; (20.5, 66.5) -0.63, bias -0.0466 sea 0 m; (20.5, 65.5) -0.57, bias -0.131 sea 0 m; (25.5, 76.5) -0.57, bias +0.997 land 314 m
- day 4 u10: 36% of cells below 0; (35.5, 72.5) -1.45, bias +0.109 land 3025 m; (29.5, 95.5) -1.33, bias -0.0421 land 3567 m; (35.5, 73.5) -1.28, bias +0.0005 land 3315 m
- day 4 v10: 42% of cells below 0; (37.5, 71.5) -0.61, bias +0.033 land 3637 m; (27.5, 86.5) -0.57, bias -0.0432 land 2434 m; (27.5, 96.5) -0.55, bias -0.0202 land 1479 m
- day 4 msl: 4% of cells below 0; (6.5, 98.5) -0.05, bias -3.23 sea 1 m; (6.5, 97.5) -0.05, bias +6.99 sea 0 m; (36.5, 74.5) -0.04, bias -56.7 land 4223 m
- day 4 tcwv: 25% of cells below 0; (35.5, 78.5) -0.53, bias -0.386 land 5170 m; (33.5, 85.5) -0.52, bias +0.518 land 5088 m; (33.5, 86.5) -0.48, bias +0.362 land 5070 m
- day 8 t2m: 87% of cells below 0; (14.5, 65.5) -1.11, bias -0.161 sea 0 m; (15.5, 65.5) -1.03, bias -0.194 sea 0 m; (14.5, 82.5) -1.02, bias -0.445 sea 0 m
- day 8 tp: 83% of cells below 0; (20.5, 95.5) -0.46, bias +1.59 land 273 m; (21.5, 95.5) -0.43, bias +1.46 land 253 m; (21.5, 94.5) -0.42, bias +1.39 land 496 m
- day 8 u10: 62% of cells below 0; (29.5, 95.5) -2.08, bias -0.107 land 3567 m; (35.5, 72.5) -2.01, bias +0.147 land 3025 m; (35.5, 73.5) -1.89, bias -0.0463 land 3315 m
- day 8 v10: 79% of cells below 0; (25.5, 98.5) -0.73, bias -0.074 land 1723 m; (37.5, 71.5) -0.72, bias -0.0155 land 3637 m; (27.5, 96.5) -0.72, bias -0.0497 land 1479 m
- day 8 msl: 27% of cells below 0; (6.5, 80.5) -0.20, bias +10.4 land 172 m; (33.5, 100.5) -0.19, bias +302 land 4190 m; (33.5, 99.5) -0.18, bias +331 land 4377 m
- day 8 tcwv: 79% of cells below 0; (33.5, 85.5) -0.88, bias +0.89 land 5088 m; (32.5, 88.5) -0.82, bias +0.428 land 4913 m; (33.5, 86.5) -0.81, bias +0.625 land 5070 m
