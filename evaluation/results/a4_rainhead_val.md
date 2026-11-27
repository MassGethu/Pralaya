## a4_rainhead on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.261 | +0.261 | 0.531 / 0.436 / 0.277 | +0.168 |
| 4 | +0.085 | +0.250 | 0.341 / 0.228 / 0.277 | +0.089 |
| 8 | -0.042 | +0.216 | 0.282 / 0.212 / 0.277 | +0.007 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.616 / 1.889 / 1.722  (SS best +0.061, vs pers +0.144)
- tp: 6.556 / 9.366 / 6.838  (SS best +0.041, vs pers +0.300)
- u10: 1.478 / 1.973 / 1.67  (SS best +0.115, vs pers +0.251)
- v10: 1.348 / 1.939 / 1.46  (SS best +0.077, vs pers +0.304)
- msl: 246 / 328.5 / 278.4  (SS best +0.117, vs pers +0.251)
- tcwv: 5.539 / 7.366 / 6.138  (SS best +0.098, vs pers +0.248)

Aggregate: SS per-window +0.0388 (proxy 9.7/30), CSI skill +0.0599 (proxy 9.0/15), anti-blur proxy 10.0/10 (in-band 86%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0169999599456787, 'tp': 0.5120000243186951, 'u10': 0.8270000219345093, 'v10': 0.8109999895095825, 'msl': 0.9210000038146973, 'tcwv': 0.8849999904632568}
Invalid windows: 0; CPU 10-step rollout median 53 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.8/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.88), propagates 97%, stable 96% (max 12.53 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.93), propagates 45%, stable 98% (max 7.10 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.039 [+0.023, +0.055], worst -0.224
- skill day 1: +0.203 [+0.189, +0.215], worst -0.217
- skill day 4: +0.007 [-0.009, +0.028], worst -0.453
- skill day 8: -0.094 [-0.118, -0.070], worst -0.669
- CSI skill per window: +0.060 [+0.039, +0.079], worst -0.362
- day-4 skill vs persistence: +0.212 [+0.189, +0.233], worst -0.367; windows beating persistence 94% [91%, 96%]
- day-8 in-band fraction: 0.86 [0.84, 0.88], worst 0.33
- causality proxy per window: 13.8 [13.6, 14.1], worst 11.2
- grader-like draw (5 random windows), forecast points /45: p05 1.6, median 18.4, p95 37.0
- warm_ocean: stable 96% [93%, 99%]; unstable by channel {'t2m': 0, 'tp': 13, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-06 12.53 std (tp), 2020-05-10 10.53 std (tp), 2020-05-05 8.51 std (tp)
- monsoon_stall: stable 98% [96%, 99%]; unstable by channel {'t2m': 0, 'tp': 7, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-24 7.1 std (tp), 2020-09-09 6.58 std (tp), 2020-07-15 5.74 std (tp)
- worst windows (per-window skill): 2020-05-06 -0.224, 2020-02-10 -0.216, 2020-11-11 -0.215, 2020-10-03 -0.214, 2020-04-27 -0.195
- worst windows (day-8 skill): 2020-11-11 -0.669, 2020-04-27 -0.568, 2020-10-28 -0.555, 2020-05-01 -0.490, 2020-04-23 -0.460

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.062 | +0.041 | +0.115 | +0.077 | +0.117 | +0.098 |
| all | 1152 | 8 | -0.126 | -0.038 | -0.009 | -0.030 | +0.014 | -0.062 |
| ocean (lsm<0.5) | 416 | 4 | -0.240 | +0.048 | +0.143 | +0.105 | +0.151 | +0.117 |
| ocean (lsm<0.5) | 416 | 8 | -0.608 | -0.039 | +0.005 | -0.022 | -0.022 | -0.051 |
| land below 1000 m | 391 | 4 | +0.036 | +0.036 | +0.067 | +0.010 | +0.176 | +0.108 |
| land below 1000 m | 391 | 8 | -0.143 | -0.048 | -0.041 | -0.059 | +0.023 | -0.044 |
| highlands >=2000 m | 287 | 4 | +0.116 | +0.011 | -0.009 | -0.036 | +0.088 | -0.292 |
| highlands >=2000 m | 287 | 8 | -0.050 | +0.008 | -0.060 | -0.047 | +0.024 | -0.485 |
| Bay of Bengal box | 144 | 4 | -0.270 | +0.055 | +0.150 | +0.131 | +0.196 | +0.105 |
| Bay of Bengal box | 144 | 8 | -0.591 | -0.051 | -0.013 | -0.029 | +0.026 | -0.059 |
| Arabian Sea box | 120 | 4 | -0.300 | +0.055 | +0.172 | +0.111 | +0.143 | +0.155 |
| Arabian Sea box | 120 | 8 | -0.678 | -0.023 | +0.044 | +0.012 | -0.036 | -0.041 |
| north of 28N | 360 | 4 | +0.104 | -0.005 | -0.008 | -0.037 | +0.086 | -0.067 |
| north of 28N | 360 | 8 | -0.061 | +0.009 | -0.050 | -0.048 | +0.023 | -0.185 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 59% of cells below 0; (17.5, 85.5) -0.81, bias -0.0981 sea 0 m; (13.5, 86.5) -0.69, bias -0.111 sea 0 m; (12.5, 86.5) -0.67, bias -0.0849 sea 0 m
- day 4 tp: 43% of cells below 0; (37.5, 93.5) -1.01, bias +0.271 land 2858 m; (37.5, 94.5) -0.67, bias +0.205 land 2966 m; (37.5, 92.5) -0.49, bias +0.231 land 3124 m
- day 4 u10: 40% of cells below 0; (35.5, 72.5) -3.49, bias +0.346 land 3025 m; (35.5, 73.5) -2.31, bias +0.203 land 3315 m; (29.5, 95.5) -2.27, bias -0.135 land 3567 m
- day 4 v10: 49% of cells below 0; (36.5, 71.5) -1.43, bias +0.244 land 3787 m; (37.5, 71.5) -0.97, bias +0.185 land 3637 m; (36.5, 70.5) -0.90, bias +0.0698 land 3087 m
- day 4 msl: 6% of cells below 0; (6.5, 80.5) -0.13, bias +19 land 172 m; (6.5, 100.5) -0.13, bias -3.98 land 106 m; (7.5, 98.5) -0.11, bias +8.49 sea 16 m
- day 4 tcwv: 30% of cells below 0; (35.5, 78.5) -1.42, bias +0.036 land 5170 m; (35.5, 79.5) -1.42, bias +0.394 land 4987 m; (30.5, 83.5) -1.41, bias -0.29 land 5096 m
- day 8 t2m: 90% of cells below 0; (9.5, 73.5) -1.19, bias -0.819 sea 0 m; (14.5, 82.5) -1.11, bias -0.411 sea 0 m; (17.5, 85.5) -1.08, bias -0.251 sea 0 m
- day 8 tp: 77% of cells below 0; (37.5, 93.5) -0.70, bias +0.266 land 2858 m; (17.5, 95.5) -0.40, bias +1.18 land 82 m; (37.5, 94.5) -0.39, bias +0.195 land 2966 m
- day 8 u10: 65% of cells below 0; (35.5, 72.5) -5.34, bias +0.537 land 3025 m; (35.5, 73.5) -3.38, bias +0.307 land 3315 m; (35.5, 71.5) -3.15, bias +0.349 land 3002 m
- day 8 v10: 81% of cells below 0; (36.5, 71.5) -1.72, bias +0.274 land 3787 m; (36.5, 70.5) -1.11, bias +0.0526 land 3087 m; (34.5, 75.5) -1.00, bias -0.382 land 3717 m
- day 8 msl: 47% of cells below 0; (8.5, 79.5) -0.56, bias +84.6 sea 21 m; (6.5, 100.5) -0.42, bias -19.4 land 106 m; (6.5, 79.5) -0.41, bias +26.2 sea 37 m
- day 8 tcwv: 84% of cells below 0; (30.5, 83.5) -1.90, bias -0.185 land 5096 m; (31.5, 82.5) -1.90, bias +1.05 land 5122 m; (35.5, 78.5) -1.87, bias -0.0464 land 5170 m
