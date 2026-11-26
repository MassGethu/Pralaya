## b1_onestep on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.311 | +0.311 | 0.542 / 0.436 / 0.277 | +0.189 |
| 4 | +0.056 | +0.226 | 0.345 / 0.228 / 0.277 | +0.094 |
| 8 | -0.121 | +0.157 | 0.290 / 0.212 / 0.277 | +0.018 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.665 / 1.889 / 1.722  (SS best +0.033, vs pers +0.119)
- tp: 6.951 / 9.366 / 6.838  (SS best -0.017, vs pers +0.258)
- u10: 1.503 / 1.973 / 1.67  (SS best +0.100, vs pers +0.238)
- v10: 1.366 / 1.939 / 1.46  (SS best +0.064, vs pers +0.295)
- msl: 256.4 / 328.5 / 278.4  (SS best +0.079, vs pers +0.220)
- tcwv: 5.685 / 7.366 / 6.138  (SS best +0.074, vs pers +0.228)

Aggregate: SS per-window +0.0161 (proxy 4.0/30), CSI skill +0.0749 (proxy 11.2/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 0.9660000205039978, 'tp': 0.8370000123977661, 'u10': 0.9599999785423279, 'v10': 0.8820000290870667, 'msl': 0.996999979019165, 'tcwv': 0.9589999914169312}
Invalid windows: 0; CPU 10-step rollout median 113 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.4/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.83), propagates 96%, stable 70% (max 21.31 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.87), propagates 71%, stable 78% (max 20.44 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.016 [-0.001, +0.033], worst -0.351
- skill day 1: +0.255 [+0.239, +0.268], worst -0.223
- skill day 4: -0.026 [-0.043, -0.005], worst -0.642
- skill day 8: -0.181 [-0.213, -0.150], worst -1.226
- CSI skill per window: +0.075 [+0.053, +0.094], worst -0.223
- day-4 skill vs persistence: +0.187 [+0.166, +0.207], worst -0.286; windows beating persistence 92% [88%, 95%]
- day-8 in-band fraction: 0.90 [0.88, 0.92], worst 0.33
- causality proxy per window: 13.4 [13.1, 13.7], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 0.8, median 15.0, p95 32.2
- warm_ocean: stable 70% [60%, 78%]; unstable by channel {'t2m': 0, 'tp': 107, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-07 21.31 std (tp), 2020-05-05 20.84 std (tp), 2020-05-04 20.06 std (tp)
- monsoon_stall: stable 78% [67%, 88%]; unstable by channel {'t2m': 0, 'tp': 78, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-10 20.44 std (tp), 2020-05-19 18.91 std (tp), 2020-09-06 14.16 std (tp)
- worst windows (per-window skill): 2020-10-28 -0.350, 2020-05-06 -0.273, 2020-02-10 -0.270, 2020-10-27 -0.268, 2020-11-11 -0.259
- worst windows (day-8 skill): 2020-10-28 -1.226, 2020-10-27 -0.946, 2020-04-27 -0.847, 2020-10-26 -0.809, 2020-11-11 -0.796

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.033 | -0.017 | +0.100 | +0.064 | +0.079 | +0.074 |
| all | 1152 | 8 | -0.229 | -0.138 | -0.065 | -0.078 | -0.051 | -0.164 |
| ocean (lsm<0.5) | 416 | 4 | -0.265 | -0.010 | +0.131 | +0.090 | +0.146 | +0.091 |
| ocean (lsm<0.5) | 416 | 8 | -0.677 | -0.156 | -0.044 | -0.064 | -0.082 | -0.157 |
| land below 1000 m | 391 | 4 | +0.010 | -0.024 | +0.033 | -0.008 | +0.138 | +0.074 |
| land below 1000 m | 391 | 8 | -0.271 | -0.117 | -0.122 | -0.150 | -0.041 | -0.156 |
| highlands >=2000 m | 287 | 4 | +0.092 | -0.041 | -0.008 | -0.020 | +0.045 | -0.179 |
| highlands >=2000 m | 287 | 8 | -0.134 | -0.096 | -0.120 | -0.071 | -0.034 | -0.429 |
| Bay of Bengal box | 144 | 4 | -0.357 | +0.006 | +0.159 | +0.125 | +0.199 | +0.101 |
| Bay of Bengal box | 144 | 8 | -0.774 | -0.159 | -0.038 | -0.058 | -0.037 | -0.173 |
| Arabian Sea box | 120 | 4 | -0.286 | -0.004 | +0.131 | +0.081 | +0.108 | +0.126 |
| Arabian Sea box | 120 | 8 | -0.699 | -0.129 | -0.058 | -0.040 | -0.112 | -0.166 |
| north of 28N | 360 | 4 | +0.075 | -0.072 | -0.024 | -0.028 | +0.042 | -0.031 |
| north of 28N | 360 | 8 | -0.156 | -0.103 | -0.123 | -0.078 | -0.043 | -0.196 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 65% of cells below 0; (13.5, 84.5) -0.85, bias +0.0592 sea 0 m; (17.5, 85.5) -0.83, bias -0.28 sea 0 m; (16.5, 85.5) -0.82, bias -0.186 sea 0 m
- day 4 tp: 69% of cells below 0; (20.5, 66.5) -1.38, bias +0.921 sea 0 m; (20.5, 67.5) -1.33, bias +1.02 sea 0 m; (20.5, 65.5) -1.23, bias +0.767 sea 0 m
- day 4 u10: 44% of cells below 0; (29.5, 95.5) -1.88, bias -0.159 land 3567 m; (35.5, 73.5) -1.63, bias -0.0806 land 3315 m; (26.5, 97.5) -1.51, bias +0.165 land 1110 m
- day 4 v10: 52% of cells below 0; (26.5, 95.5) -0.75, bias +0.123 land 742 m; (27.5, 96.5) -0.71, bias +0.009 land 1479 m; (37.5, 70.5) -0.68, bias -0.0702 land 2435 m
- day 4 msl: 14% of cells below 0; (36.5, 83.5) -0.15, bias -217 land 3654 m; (37.5, 80.5) -0.15, bias -248 land 1461 m; (37.5, 82.5) -0.14, bias -280 land 1548 m
- day 4 tcwv: 36% of cells below 0; (35.5, 78.5) -0.80, bias -0.511 land 5170 m; (33.5, 86.5) -0.79, bias +1.26 land 5070 m; (33.5, 85.5) -0.76, bias +1.21 land 5088 m
- day 8 t2m: 94% of cells below 0; (17.5, 85.5) -1.51, bias -0.524 sea 0 m; (18.5, 86.5) -1.49, bias -0.543 sea 0 m; (15.5, 82.5) -1.47, bias -0.723 sea 0 m
- day 8 tp: 97% of cells below 0; (20.5, 66.5) -1.36, bias +1.6 sea 0 m; (20.5, 67.5) -1.28, bias +1.63 sea 0 m; (27.5, 74.5) -1.21, bias +0.96 land 336 m
- day 8 u10: 85% of cells below 0; (29.5, 95.5) -4.03, bias -0.383 land 3567 m; (35.5, 73.5) -3.16, bias -0.155 land 3315 m; (35.5, 72.5) -2.83, bias +0.0061 land 3025 m
- day 8 v10: 92% of cells below 0; (36.5, 70.5) -1.55, bias -0.279 land 3087 m; (37.5, 71.5) -1.39, bias -0.157 land 3637 m; (36.5, 71.5) -1.35, bias -0.235 land 3787 m
- day 8 msl: 83% of cells below 0; (6.5, 70.5) -0.48, bias +69.6 sea 0 m; (37.5, 80.5) -0.46, bias -436 land 1461 m; (6.5, 69.5) -0.45, bias +68 sea 0 m
- day 8 tcwv: 99% of cells below 0; (35.5, 78.5) -1.61, bias -0.965 land 5170 m; (33.5, 86.5) -1.61, bias +2.32 land 5070 m; (33.5, 85.5) -1.53, bias +2.27 land 5088 m
