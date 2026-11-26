## b3_roll4_s2 on test (353 windows, init 2021-01-03..2021-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.288 | +0.288 | 0.527 / 0.426 / 0.260 | +0.177 |
| 4 | +0.079 | +0.249 | 0.332 / 0.209 / 0.261 | +0.096 |
| 8 | -0.063 | +0.210 | 0.291 / 0.196 / 0.262 | +0.040 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.656 / 1.934 / 1.779  (SS best +0.069, vs pers +0.143)
- tp: 6.66 / 9.249 / 6.788  (SS best +0.019, vs pers +0.280)
- u10: 1.521 / 2.073 / 1.672  (SS best +0.091, vs pers +0.266)
- v10: 1.366 / 1.956 / 1.464  (SS best +0.067, vs pers +0.302)
- msl: 265.1 / 353.6 / 284.9  (SS best +0.070, vs pers +0.250)
- tcwv: 5.642 / 7.559 / 6.701  (SS best +0.158, vs pers +0.254)

Aggregate: SS per-window +0.0309 (proxy 7.7/30), CSI skill +0.0786 (proxy 11.8/15), anti-blur proxy 10.0/10 (in-band 89%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0069999694824219, 'tp': 1.1299999952316284, 'u10': 0.8379999995231628, 'v10': 0.8690000176429749, 'msl': 0.9509999752044678, 'tcwv': 1.0709999799728394}
Invalid windows: 0; CPU 10-step rollout median 35 ms
Shocks (353 windows): null exact=True ok=True; causality proxy 13.7/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.82), propagates 92%, stable 94% (max 9.79 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.96), propagates 45%, stable 99% (max 9.04 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.031 [+0.018, +0.046], worst -0.192
- skill day 1: +0.234 [+0.221, +0.249], worst -0.098
- skill day 4: -0.004 [-0.021, +0.012], worst -0.379
- skill day 8: -0.137 [-0.164, -0.111], worst -0.726
- CSI skill per window: +0.079 [+0.062, +0.100], worst -0.265
- day-4 skill vs persistence: +0.215 [+0.196, +0.239], worst -0.275; windows beating persistence 95% [92%, 98%]
- day-8 in-band fraction: 0.89 [0.87, 0.92], worst 0.50
- causality proxy per window: 13.7 [13.4, 13.9], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 4.8, median 18.8, p95 33.9
- warm_ocean: stable 94% [88%, 98%]; unstable by channel {'t2m': 0, 'tp': 22, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-11-20 9.79 std (tp), 2021-11-02 8.29 std (tp), 2021-11-03 8.0 std (tp)
- monsoon_stall: stable 99% [97%, 100%]; unstable by channel {'t2m': 0, 'tp': 5, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-05-15 9.04 std (tp), 2021-05-13 7.51 std (tp), 2021-06-22 6.75 std (tp)
- worst windows (per-window skill): 2021-11-13 -0.192, 2021-11-12 -0.157, 2021-07-27 -0.153, 2021-06-23 -0.144, 2021-06-24 -0.135
- worst windows (day-8 skill): 2021-11-12 -0.726, 2021-11-13 -0.652, 2021-01-16 -0.550, 2021-11-18 -0.471, 2021-06-29 -0.460

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.069 | +0.019 | +0.091 | +0.067 | +0.070 | +0.158 |
| all | 1152 | 8 | -0.117 | -0.046 | -0.047 | -0.061 | -0.074 | -0.031 |
| ocean (lsm<0.5) | 416 | 4 | -0.435 | +0.006 | +0.105 | +0.090 | +0.113 | +0.165 |
| ocean (lsm<0.5) | 416 | 8 | -0.900 | -0.056 | -0.045 | -0.057 | -0.099 | -0.026 |
| land below 1000 m | 391 | 4 | +0.030 | +0.044 | +0.074 | +0.010 | +0.082 | +0.171 |
| land below 1000 m | 391 | 8 | -0.161 | -0.031 | -0.053 | -0.081 | -0.096 | -0.018 |
| highlands >=2000 m | 287 | 4 | +0.152 | +0.022 | +0.012 | -0.008 | +0.060 | -0.096 |
| highlands >=2000 m | 287 | 8 | +0.001 | -0.031 | -0.048 | -0.058 | -0.051 | -0.278 |
| Bay of Bengal box | 144 | 4 | -0.390 | +0.001 | +0.087 | +0.095 | +0.110 | +0.130 |
| Bay of Bengal box | 144 | 8 | -0.808 | -0.099 | -0.114 | -0.110 | -0.125 | -0.061 |
| Arabian Sea box | 120 | 4 | -0.333 | +0.009 | +0.122 | +0.103 | +0.161 | +0.225 |
| Arabian Sea box | 120 | 8 | -0.806 | -0.010 | +0.018 | +0.011 | -0.013 | +0.032 |
| north of 28N | 360 | 4 | +0.127 | +0.015 | +0.016 | -0.007 | +0.053 | +0.078 |
| north of 28N | 360 | 8 | -0.015 | -0.023 | -0.048 | -0.054 | -0.061 | -0.103 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 56% of cells below 0; (6.5, 79.5) -0.74, bias -0.169 sea 37 m; (8.5, 65.5) -0.74, bias -0.0953 sea 0 m; (9.5, 65.5) -0.72, bias -0.132 sea 0 m
- day 4 tp: 38% of cells below 0; (18.5, 66.5) -3.02, bias +0.798 sea 0 m; (18.5, 65.5) -2.73, bias +0.682 sea 0 m; (17.5, 65.5) -2.47, bias +0.707 sea 0 m
- day 4 u10: 32% of cells below 0; (25.5, 96.5) -1.22, bias -0.0943 land 432 m; (35.5, 73.5) -1.17, bias -0.0883 land 3315 m; (35.5, 72.5) -1.17, bias -0.0509 land 3025 m
- day 4 v10: 45% of cells below 0; (27.5, 96.5) -0.88, bias -0.065 land 1479 m; (36.5, 76.5) -0.54, bias +0.247 land 4472 m; (28.5, 82.5) -0.49, bias -0.0526 land 2047 m
- day 4 msl: 12% of cells below 0; (9.5, 100.5) -0.10, bias -49.7 sea 15 m; (10.5, 100.5) -0.10, bias -49.6 sea 3 m; (8.5, 100.5) -0.09, bias -46.4 sea 30 m
- day 4 tcwv: 26% of cells below 0; (34.5, 78.5) -0.56, bias -0.774 land 5207 m; (33.5, 79.5) -0.51, bias -0.842 land 5077 m; (34.5, 79.5) -0.50, bias -0.577 land 5249 m
- day 8 t2m: 88% of cells below 0; (6.5, 79.5) -2.04, bias -0.634 sea 37 m; (6.5, 78.5) -1.77, bias -0.611 sea 0 m; (7.5, 79.5) -1.62, bias -0.328 sea 45 m
- day 8 tp: 74% of cells below 0; (17.5, 65.5) -0.55, bias +0.54 sea 0 m; (18.5, 65.5) -0.48, bias +0.474 sea 0 m; (16.5, 65.5) -0.33, bias +0.461 sea 0 m
- day 8 u10: 82% of cells below 0; (29.5, 95.5) -2.59, bias +0.178 land 3567 m; (35.5, 71.5) -2.49, bias -0.278 land 3002 m; (26.5, 97.5) -2.48, bias +0.377 land 1110 m
- day 8 v10: 85% of cells below 0; (25.5, 98.5) -1.04, bias -0.0552 land 1723 m; (27.5, 96.5) -0.98, bias -0.0567 land 1479 m; (27.5, 98.5) -0.97, bias -0.245 land 2634 m
- day 8 msl: 91% of cells below 0; (9.5, 100.5) -0.37, bias -86.8 sea 15 m; (8.5, 100.5) -0.36, bias -83.8 sea 30 m; (28.5, 65.5) -0.32, bias -117 land 1204 m
- day 8 tcwv: 74% of cells below 0; (34.5, 78.5) -1.46, bias -1.81 land 5207 m; (33.5, 79.5) -1.38, bias -2.13 land 5077 m; (36.5, 73.5) -1.28, bias -2.04 land 4107 m
