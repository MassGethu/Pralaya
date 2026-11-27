## a3_anomaly on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.295 | +0.295 | 0.538 / 0.436 / 0.277 | +0.182 |
| 4 | +0.122 | +0.282 | 0.349 / 0.228 / 0.277 | +0.099 |
| 8 | +0.024 | +0.266 | 0.300 / 0.212 / 0.277 | +0.032 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.462 / 1.889 / 1.722  (SS best +0.151, vs pers +0.226)
- tp: 6.615 / 9.366 / 6.838  (SS best +0.033, vs pers +0.294)
- u10: 1.408 / 1.973 / 1.67  (SS best +0.157, vs pers +0.286)
- v10: 1.299 / 1.939 / 1.46  (SS best +0.111, vs pers +0.330)
- msl: 238.6 / 328.5 / 278.4  (SS best +0.143, vs pers +0.274)
- tcwv: 5.305 / 7.366 / 6.138  (SS best +0.136, vs pers +0.280)

Aggregate: SS per-window +0.0920 (proxy 23.0/30), CSI skill +0.0782 (proxy 11.7/15), anti-blur proxy 10.0/10 (in-band 87%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.006, 'tp': 0.657, 'u10': 0.747, 'v10': 0.736, 'msl': 0.941, 'tcwv': 0.888}
Invalid windows: 0; CPU 10-step rollout median 37 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.6/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.95, min 0.70), propagates 83%, stable 93% (max 12.91 std), far frac max 0.002
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.92), propagates 53%, stable 98% (max 11.39 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.092 [+0.080, +0.104], worst -0.202
- skill day 1: +0.238 [+0.225, +0.250], worst -0.230
- skill day 4: +0.054 [+0.037, +0.072], worst -0.835
- skill day 8: -0.016 [-0.034, +0.003], worst -0.427
- CSI skill per window: +0.078 [+0.058, +0.100], worst -0.240
- day-4 skill vs persistence: +0.252 [+0.235, +0.268], worst -0.059; windows beating persistence 98% [96%, 99%]
- day-8 in-band fraction: 0.87 [0.84, 0.90], worst 0.33
- causality proxy per window: 13.6 [13.4, 13.9], worst 11.2
- grader-like draw (5 random windows), forecast points /45: p05 15.3, median 33.8, p95 45.0
- warm_ocean: stable 93% [87%, 97%]; unstable by channel {'t2m': 0, 'tp': 25, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-15 12.91 std (tp), 2020-05-08 7.65 std (tp), 2020-05-14 7.01 std (tp)
- monsoon_stall: stable 98% [96%, 99%]; unstable by channel {'t2m': 0, 'tp': 8, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-30 11.39 std (tp), 2020-09-20 7.65 std (tp), 2020-09-03 7.35 std (tp)
- worst windows (per-window skill): 2020-02-11 -0.202, 2020-02-10 -0.152, 2020-05-04 -0.152, 2020-10-03 -0.108, 2020-10-04 -0.077
- worst windows (day-8 skill): 2020-05-04 -0.427, 2020-10-03 -0.379, 2020-05-01 -0.340, 2020-09-11 -0.340, 2020-10-02 -0.339

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.151 | +0.033 | +0.157 | +0.111 | +0.143 | +0.136 |
| all | 1152 | 8 | +0.037 | -0.032 | +0.044 | +0.020 | +0.047 | +0.025 |
| ocean (lsm<0.5) | 416 | 4 | +0.069 | +0.038 | +0.181 | +0.133 | +0.207 | +0.131 |
| ocean (lsm<0.5) | 416 | 8 | +0.019 | -0.033 | +0.047 | +0.023 | +0.040 | +0.024 |
| land below 1000 m | 391 | 4 | +0.129 | +0.029 | +0.113 | +0.060 | +0.206 | +0.155 |
| land below 1000 m | 391 | 8 | +0.023 | -0.035 | +0.044 | +0.013 | +0.063 | +0.026 |
| highlands >=2000 m | 287 | 4 | +0.179 | +0.009 | +0.060 | +0.010 | +0.103 | -0.017 |
| highlands >=2000 m | 287 | 8 | +0.050 | -0.012 | +0.017 | +0.007 | +0.044 | +0.018 |
| Bay of Bengal box | 144 | 4 | +0.021 | +0.023 | +0.199 | +0.155 | +0.228 | +0.110 |
| Bay of Bengal box | 144 | 8 | -0.019 | -0.056 | +0.045 | +0.033 | +0.038 | +0.026 |
| Arabian Sea box | 120 | 4 | +0.028 | +0.060 | +0.188 | +0.141 | +0.206 | +0.163 |
| Arabian Sea box | 120 | 8 | -0.020 | -0.012 | +0.055 | +0.023 | +0.050 | +0.010 |
| north of 28N | 360 | 4 | +0.166 | -0.024 | +0.046 | +0.007 | +0.101 | +0.066 |
| north of 28N | 360 | 8 | +0.044 | -0.008 | +0.018 | +0.008 | +0.040 | +0.045 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 16% of cells below 0; (14.5, 84.5) -0.22, bias -0.0234 sea 0 m; (14.5, 83.5) -0.21, bias -0.0213 sea 0 m; (13.5, 84.5) -0.20, bias -0.0374 sea 0 m
- day 4 tp: 49% of cells below 0; (27.5, 74.5) -0.42, bias +0.0861 land 336 m; (19.5, 67.5) -0.34, bias +0.222 sea 0 m; (25.5, 68.5) -0.34, bias -0.142 land 63 m
- day 4 u10: 24% of cells below 0; (26.5, 97.5) -0.99, bias +0.0557 land 1110 m; (29.5, 95.5) -0.93, bias -0.0358 land 3567 m; (35.5, 71.5) -0.82, bias -0.0095 land 3002 m
- day 4 v10: 24% of cells below 0; (37.5, 70.5) -0.65, bias -0.18 land 2435 m; (37.5, 71.5) -0.51, bias -0.116 land 3637 m; (26.5, 95.5) -0.46, bias +0.085 land 742 m
- day 4 msl: 1% of cells below 0; (36.5, 70.5) -0.01, bias -71.9 land 3087 m; (37.5, 70.5) -0.01, bias -81.3 land 2435 m; (36.5, 69.5) -0.00, bias -83.4 land 1863 m
- day 4 tcwv: 20% of cells below 0; (35.5, 78.5) -0.35, bias -0.223 land 5170 m; (34.5, 78.5) -0.34, bias +0.0039 land 5207 m; (34.5, 77.5) -0.33, bias +0.212 land 4904 m
- day 8 t2m: 31% of cells below 0; (17.5, 75.5) -0.14, bias -0.279 land 556 m; (18.5, 75.5) -0.14, bias -0.322 land 563 m; (8.5, 82.5) -0.13, bias -0.294 sea 1 m
- day 8 tp: 82% of cells below 0; (16.5, 65.5) -0.35, bias -0.257 sea 0 m; (17.5, 89.5) -0.27, bias +1.66 sea 0 m; (21.5, 95.5) -0.25, bias +0.858 land 253 m
- day 8 u10: 20% of cells below 0; (27.5, 97.5) -0.35, bias +0.0354 land 2097 m; (29.5, 95.5) -0.32, bias -0.0301 land 3567 m; (26.5, 97.5) -0.31, bias +0.0575 land 1110 m
- day 8 v10: 28% of cells below 0; (37.5, 71.5) -0.31, bias -0.105 land 3637 m; (37.5, 70.5) -0.28, bias -0.135 land 2435 m; (26.5, 95.5) -0.12, bias +0.0487 land 742 m
- day 8 msl: 5% of cells below 0; (37.5, 68.5) -0.05, bias -207 land 707 m; (35.5, 68.5) -0.05, bias -138 land 2321 m; (33.5, 72.5) -0.05, bias -143 land 570 m
- day 8 tcwv: 23% of cells below 0; (31.5, 82.5) -0.18, bias +0.238 land 5122 m; (31.5, 81.5) -0.18, bias +0.373 land 5070 m; (31.5, 83.5) -0.15, bias +0.0913 land 5054 m
