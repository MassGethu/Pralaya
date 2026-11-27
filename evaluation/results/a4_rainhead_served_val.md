## a4_rainhead on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.266 | +0.266 | 0.531 / 0.436 / 0.277 | +0.168 |
| 4 | +0.102 | +0.264 | 0.341 / 0.228 / 0.277 | +0.089 |
| 8 | +0.019 | +0.262 | 0.282 / 0.212 / 0.277 | +0.007 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.547 / 1.889 / 1.722  (SS best +0.102, vs pers +0.181)
- tp: 6.556 / 9.366 / 6.838  (SS best +0.041, vs pers +0.300)
- u10: 1.444 / 1.973 / 1.67  (SS best +0.136, vs pers +0.268)
- v10: 1.33 / 1.939 / 1.46  (SS best +0.089, vs pers +0.314)
- msl: 243.8 / 328.5 / 278.4  (SS best +0.124, vs pers +0.258)
- tcwv: 5.418 / 7.366 / 6.138  (SS best +0.117, vs pers +0.264)

Aggregate: SS per-window +0.0756 (proxy 18.9/30), CSI skill +0.0599 (proxy 9.0/15), anti-blur proxy 10.0/10 (in-band 85%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.01, 'tp': 0.512, 'u10': 0.752, 'v10': 0.725, 'msl': 0.91, 'tcwv': 0.879}
Invalid windows: 0; CPU 10-step rollout median 25 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.8/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.88), propagates 97%, stable 96% (max 12.53 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.93), propagates 45%, stable 98% (max 7.10 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.076 [+0.063, +0.090], worst -0.159
- skill day 1: +0.210 [+0.197, +0.223], worst -0.190
- skill day 4: +0.034 [+0.019, +0.053], worst -0.340
- skill day 8: -0.017 [-0.035, +0.001], worst -0.364
- CSI skill per window: +0.060 [+0.039, +0.079], worst -0.362
- day-4 skill vs persistence: +0.237 [+0.217, +0.254], worst -0.232; windows beating persistence 98% [96%, 99%]
- day-8 in-band fraction: 0.85 [0.82, 0.88], worst 0.33
- causality proxy per window: 13.8 [13.6, 14.1], worst 11.2
- grader-like draw (5 random windows), forecast points /45: p05 10.5, median 27.5, p95 43.9
- warm_ocean: stable 96% [93%, 99%]; unstable by channel {'t2m': 0, 'tp': 13, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-06 12.53 std (tp), 2020-05-10 10.53 std (tp), 2020-05-05 8.51 std (tp)
- monsoon_stall: stable 98% [96%, 99%]; unstable by channel {'t2m': 0, 'tp': 7, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-24 7.1 std (tp), 2020-09-09 6.58 std (tp), 2020-07-15 5.74 std (tp)
- worst windows (per-window skill): 2020-02-10 -0.159, 2020-10-03 -0.136, 2020-05-06 -0.111, 2020-09-10 -0.105, 2020-11-11 -0.095
- worst windows (day-8 skill): 2020-10-03 -0.364, 2020-11-11 -0.345, 2020-09-11 -0.332, 2020-09-10 -0.328, 2020-10-02 -0.324

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.102 | +0.041 | +0.136 | +0.089 | +0.125 | +0.117 |
| all | 1152 | 8 | +0.040 | -0.038 | +0.039 | +0.016 | +0.036 | +0.019 |
| ocean (lsm<0.5) | 416 | 4 | +0.041 | +0.048 | +0.162 | +0.115 | +0.174 | +0.129 |
| ocean (lsm<0.5) | 416 | 8 | -0.022 | -0.039 | +0.043 | +0.018 | +0.037 | +0.023 |
| land below 1000 m | 391 | 4 | +0.073 | +0.036 | +0.086 | +0.027 | +0.183 | +0.124 |
| land below 1000 m | 391 | 8 | +0.045 | -0.048 | +0.037 | +0.011 | +0.052 | +0.017 |
| highlands >=2000 m | 287 | 4 | +0.132 | +0.011 | +0.026 | -0.015 | +0.092 | -0.121 |
| highlands >=2000 m | 287 | 8 | +0.048 | +0.008 | +0.006 | +0.004 | +0.031 | -0.027 |
| Bay of Bengal box | 144 | 4 | +0.003 | +0.055 | +0.182 | +0.146 | +0.202 | +0.119 |
| Bay of Bengal box | 144 | 8 | -0.018 | -0.051 | +0.040 | +0.025 | +0.050 | +0.025 |
| Arabian Sea box | 120 | 4 | -0.042 | +0.055 | +0.177 | +0.111 | +0.169 | +0.162 |
| Arabian Sea box | 120 | 8 | -0.100 | -0.023 | +0.063 | +0.020 | +0.032 | +0.012 |
| north of 28N | 360 | 4 | +0.121 | -0.005 | +0.016 | -0.019 | +0.090 | +0.004 |
| north of 28N | 360 | 8 | +0.044 | +0.009 | +0.010 | +0.003 | +0.031 | +0.012 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 34% of cells below 0; (13.5, 86.5) -0.20, bias -0.039 sea 0 m; (13.5, 84.5) -0.20, bias -0.0027 sea 0 m; (14.5, 83.5) -0.19, bias -0.0482 sea 0 m
- day 4 tp: 43% of cells below 0; (37.5, 93.5) -1.01, bias +0.271 land 2858 m; (37.5, 94.5) -0.67, bias +0.205 land 2966 m; (37.5, 92.5) -0.49, bias +0.231 land 3124 m
- day 4 u10: 34% of cells below 0; (35.5, 72.5) -2.25, bias +0.245 land 3025 m; (29.5, 95.5) -1.44, bias -0.0964 land 3567 m; (35.5, 73.5) -1.42, bias +0.143 land 3315 m
- day 4 v10: 39% of cells below 0; (36.5, 71.5) -0.90, bias +0.182 land 3787 m; (37.5, 71.5) -0.60, bias +0.138 land 3637 m; (36.5, 70.5) -0.56, bias +0.0521 land 3087 m
- day 4 msl: 1% of cells below 0; (6.5, 100.5) -0.07, bias -4.28 land 106 m; (36.5, 70.5) -0.06, bias -113 land 3087 m; (37.5, 71.5) -0.06, bias -83.7 land 3637 m
- day 4 tcwv: 26% of cells below 0; (35.5, 79.5) -0.84, bias +0.279 land 4987 m; (35.5, 78.5) -0.84, bias +0.0322 land 5170 m; (30.5, 83.5) -0.81, bias -0.197 land 5096 m
- day 8 t2m: 42% of cells below 0; (9.5, 73.5) -0.23, bias -0.42 sea 0 m; (12.5, 86.5) -0.21, bias -0.0866 sea 0 m; (13.5, 86.5) -0.20, bias -0.0956 sea 0 m
- day 8 tp: 77% of cells below 0; (37.5, 93.5) -0.70, bias +0.266 land 2858 m; (17.5, 95.5) -0.40, bias +1.18 land 82 m; (37.5, 94.5) -0.39, bias +0.195 land 2966 m
- day 8 u10: 31% of cells below 0; (35.5, 72.5) -0.99, bias +0.148 land 3025 m; (35.5, 71.5) -0.54, bias +0.1 land 3002 m; (35.5, 73.5) -0.52, bias +0.0812 land 3315 m
- day 8 v10: 37% of cells below 0; (36.5, 71.5) -0.17, bias +0.0736 land 3787 m; (25.5, 98.5) -0.15, bias -0.0291 land 1723 m; (26.5, 98.5) -0.13, bias -0.0227 land 1975 m
- day 8 msl: 14% of cells below 0; (6.5, 100.5) -0.18, bias -18.5 land 106 m; (6.5, 80.5) -0.12, bias +19.2 land 172 m; (7.5, 99.5) -0.10, bias -26.2 land 49 m
- day 8 tcwv: 33% of cells below 0; (30.5, 83.5) -0.28, bias -0.0559 land 5096 m; (30.5, 82.5) -0.27, bias -0.229 land 4955 m; (33.5, 79.5) -0.27, bias +0.733 land 5077 m
