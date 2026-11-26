## ensemble(e3_rainstab,e3_rainstab_s1,e3_rainstab_s2) on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.329 | +0.329 | 0.551 / 0.436 / 0.277 | +0.204 |
| 4 | +0.132 | +0.289 | 0.364 / 0.228 / 0.277 | +0.120 |
| 8 | +0.011 | +0.256 | 0.299 / 0.212 / 0.277 | +0.030 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.499 / 1.889 / 1.722  (SS best +0.129, vs pers +0.206)
- tp: 6.322 / 9.366 / 6.838  (SS best +0.075, vs pers +0.325)
- u10: 1.399 / 1.973 / 1.67  (SS best +0.162, vs pers +0.291)
- v10: 1.273 / 1.939 / 1.46  (SS best +0.129, vs pers +0.344)
- msl: 237 / 328.5 / 278.4  (SS best +0.149, vs pers +0.279)
- tcwv: 5.226 / 7.366 / 6.138  (SS best +0.149, vs pers +0.290)

Aggregate: SS per-window +0.1040 (proxy 26.0/30), CSI skill +0.0853 (proxy 12.8/15), anti-blur proxy 10.0/10 (in-band 87%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 0.996, 'tp': 0.492, 'u10': 0.799, 'v10': 0.774, 'msl': 0.909, 'tcwv': 0.859}
Invalid windows: 0; CPU 10-step rollout median 160 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.9/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.90), propagates 95%, stable 99% (max 5.18 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.92), propagates 45%, stable 100% (max 5.94 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.104 [+0.092, +0.118], worst -0.193
- skill day 1: +0.277 [+0.261, +0.290], worst -0.231
- skill day 4: +0.064 [+0.048, +0.083], worst -0.690
- skill day 8: -0.029 [-0.048, -0.008], worst -0.595
- CSI skill per window: +0.085 [+0.064, +0.105], worst -0.187
- day-4 skill vs persistence: +0.258 [+0.239, +0.275], worst -0.222; windows beating persistence 99% [97%, 100%]
- day-8 in-band fraction: 0.87 [0.85, 0.89], worst 0.50
- causality proxy per window: 13.9 [13.6, 14.1], worst 11.2
- grader-like draw (5 random windows), forecast points /45: p05 17.8, median 37.3, p95 45.0
- warm_ocean: stable 99% [98%, 100%]; unstable by channel {'t2m': 0, 'tp': 2, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-13 5.18 std (tp), 2020-05-06 5.03 std (tp), 2020-05-10 4.49 std (tp)
- monsoon_stall: stable 100% [99%, 100%]; unstable by channel {'t2m': 0, 'tp': 1, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-28 5.94 std (tp), 2020-05-30 4.35 std (tp), 2020-09-10 4.19 std (tp)
- worst windows (per-window skill): 2020-02-11 -0.193, 2020-02-10 -0.176, 2020-05-06 -0.144, 2020-10-03 -0.129, 2020-10-28 -0.108
- worst windows (day-8 skill): 2020-10-28 -0.595, 2020-10-03 -0.467, 2020-05-01 -0.388, 2020-10-04 -0.367, 2020-10-02 -0.337

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.129 | +0.075 | +0.162 | +0.128 | +0.149 | +0.149 |
| all | 1152 | 8 | -0.011 | +0.001 | +0.026 | +0.019 | +0.044 | -0.013 |
| ocean (lsm<0.5) | 416 | 4 | +0.009 | +0.084 | +0.184 | +0.151 | +0.226 | +0.155 |
| ocean (lsm<0.5) | 416 | 8 | -0.144 | +0.002 | +0.030 | +0.025 | +0.047 | -0.022 |
| land below 1000 m | 391 | 4 | +0.106 | +0.069 | +0.125 | +0.079 | +0.217 | +0.155 |
| land below 1000 m | 391 | 8 | -0.038 | -0.004 | +0.017 | -0.005 | +0.063 | -0.000 |
| highlands >=2000 m | 287 | 4 | +0.165 | +0.043 | +0.066 | +0.026 | +0.105 | -0.010 |
| highlands >=2000 m | 287 | 8 | +0.030 | +0.010 | +0.012 | +0.010 | +0.038 | -0.077 |
| Bay of Bengal box | 144 | 4 | -0.051 | +0.097 | +0.203 | +0.173 | +0.255 | +0.156 |
| Bay of Bengal box | 144 | 8 | -0.201 | -0.011 | +0.017 | +0.024 | +0.052 | -0.041 |
| Arabian Sea box | 120 | 4 | -0.045 | +0.087 | +0.212 | +0.151 | +0.230 | +0.171 |
| Arabian Sea box | 120 | 8 | -0.215 | +0.021 | +0.068 | +0.052 | +0.069 | -0.041 |
| north of 28N | 360 | 4 | +0.149 | +0.011 | +0.055 | +0.022 | +0.105 | +0.071 |
| north of 28N | 360 | 8 | +0.014 | +0.012 | +0.005 | +0.005 | +0.036 | -0.004 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 34% of cells below 0; (12.5, 85.5) -0.40, bias +0.082 sea 0 m; (13.5, 85.5) -0.40, bias +0.08 sea 0 m; (13.5, 86.5) -0.38, bias +0.0332 sea 0 m
- day 4 tp: 28% of cells below 0; (27.5, 74.5) -0.23, bias +0.0267 land 336 m; (37.5, 92.5) -0.18, bias -0.133 land 3124 m; (20.5, 67.5) -0.17, bias -0.228 sea 0 m
- day 4 u10: 22% of cells below 0; (29.5, 95.5) -0.73, bias -0.0431 land 3567 m; (26.5, 97.5) -0.70, bias +0.072 land 1110 m; (35.5, 73.5) -0.68, bias -0.0167 land 3315 m
- day 4 v10: 20% of cells below 0; (37.5, 71.5) -0.32, bias +0.0586 land 3637 m; (37.5, 70.5) -0.30, bias +0.0121 land 2435 m; (27.5, 96.5) -0.28, bias -0.0261 land 1479 m
- day 4 msl: 0% of cells below 0; (37.5, 100.5) -0.01, bias -111 land 3449 m; (36.5, 83.5) -0.00, bias -95.6 land 3654 m; (36.5, 84.5) -0.00, bias -97.9 land 4115 m
- day 4 tcwv: 19% of cells below 0; (35.5, 78.5) -0.26, bias +0 land 5170 m; (37.5, 74.5) -0.26, bias +0.546 land 4433 m; (35.5, 79.5) -0.26, bias +0.0604 land 4987 m
- day 8 t2m: 76% of cells below 0; (13.5, 85.5) -0.57, bias +0.0908 sea 0 m; (12.5, 85.5) -0.57, bias +0.0946 sea 0 m; (13.5, 86.5) -0.56, bias +0.0035 sea 0 m
- day 8 tp: 56% of cells below 0; (36.5, 80.5) -0.16, bias +0.409 land 2969 m; (37.5, 78.5) -0.14, bias +0.342 land 2067 m; (36.5, 85.5) -0.14, bias +0.244 land 4598 m
- day 8 u10: 46% of cells below 0; (26.5, 97.5) -1.07, bias +0.171 land 1110 m; (35.5, 73.5) -0.99, bias -0.0524 land 3315 m; (35.5, 72.5) -0.87, bias -0.0405 land 3025 m
- day 8 v10: 45% of cells below 0; (37.5, 71.5) -0.45, bias +0.0553 land 3637 m; (27.5, 97.5) -0.35, bias -0.0984 land 2097 m; (37.5, 70.5) -0.35, bias -0.037 land 2435 m
- day 8 msl: 17% of cells below 0; (7.5, 79.5) -0.13, bias +15.8 sea 45 m; (6.5, 78.5) -0.10, bias +28.5 sea 0 m; (6.5, 79.5) -0.10, bias +21.2 sea 37 m
- day 8 tcwv: 63% of cells below 0; (37.5, 72.5) -0.47, bias +1.08 land 4245 m; (37.5, 73.5) -0.46, bias +0.931 land 4423 m; (37.5, 74.5) -0.42, bias +0.869 land 4433 m
