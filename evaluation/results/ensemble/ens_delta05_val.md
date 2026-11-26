## ensemble(e3_rainstab,e3_rainstab_s1,e3_rainstab_s2) on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.330 | +0.330 | 0.551 / 0.436 / 0.277 | +0.204 |
| 4 | +0.140 | +0.296 | 0.364 / 0.228 / 0.277 | +0.120 |
| 8 | +0.033 | +0.272 | 0.299 / 0.212 / 0.277 | +0.030 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.453 / 1.889 / 1.722  (SS best +0.156, vs pers +0.231)
- tp: 6.322 / 9.366 / 6.838  (SS best +0.075, vs pers +0.325)
- u10: 1.393 / 1.973 / 1.67  (SS best +0.166, vs pers +0.294)
- v10: 1.266 / 1.939 / 1.46  (SS best +0.133, vs pers +0.347)
- msl: 236.4 / 328.5 / 278.4  (SS best +0.151, vs pers +0.280)
- tcwv: 5.183 / 7.366 / 6.138  (SS best +0.156, vs pers +0.296)

Aggregate: SS per-window +0.1166 (proxy 29.1/30), CSI skill +0.0853 (proxy 12.8/15), anti-blur proxy 10.0/10 (in-band 86%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.002, 'tp': 0.492, 'u10': 0.76, 'v10': 0.735, 'msl': 0.908, 'tcwv': 0.866}
Invalid windows: 0; CPU 10-step rollout median 106 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.9/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.90), propagates 95%, stable 99% (max 5.18 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.92), propagates 45%, stable 100% (max 5.94 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.117 [+0.104, +0.130], worst -0.151
- skill day 1: +0.278 [+0.262, +0.290], worst -0.232
- skill day 4: +0.075 [+0.061, +0.093], worst -0.608
- skill day 8: -0.003 [-0.021, +0.014], worst -0.421
- CSI skill per window: +0.085 [+0.064, +0.105], worst -0.187
- day-4 skill vs persistence: +0.266 [+0.247, +0.283], worst -0.171; windows beating persistence 99% [97%, 100%]
- day-8 in-band fraction: 0.86 [0.83, 0.88], worst 0.33
- causality proxy per window: 13.9 [13.6, 14.1], worst 11.2
- grader-like draw (5 random windows), forecast points /45: p05 22.2, median 40.0, p95 45.0
- warm_ocean: stable 99% [98%, 100%]; unstable by channel {'t2m': 0, 'tp': 2, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-13 5.18 std (tp), 2020-05-06 5.03 std (tp), 2020-05-10 4.49 std (tp)
- monsoon_stall: stable 100% [99%, 100%]; unstable by channel {'t2m': 0, 'tp': 1, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-28 5.94 std (tp), 2020-05-30 4.35 std (tp), 2020-09-10 4.19 std (tp)
- worst windows (per-window skill): 2020-02-10 -0.151, 2020-02-11 -0.141, 2020-10-03 -0.106, 2020-05-06 -0.096, 2020-10-05 -0.064
- worst windows (day-8 skill): 2020-10-03 -0.421, 2020-10-04 -0.331, 2020-05-01 -0.327, 2020-10-28 -0.324, 2020-10-02 -0.320

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.156 | +0.075 | +0.166 | +0.133 | +0.151 | +0.156 |
| all | 1152 | 8 | +0.049 | +0.001 | +0.041 | +0.032 | +0.046 | +0.026 |
| ocean (lsm<0.5) | 416 | 4 | +0.106 | +0.084 | +0.187 | +0.155 | +0.226 | +0.161 |
| ocean (lsm<0.5) | 416 | 8 | +0.025 | +0.002 | +0.043 | +0.036 | +0.054 | +0.026 |
| land below 1000 m | 391 | 4 | +0.137 | +0.069 | +0.130 | +0.084 | +0.215 | +0.161 |
| land below 1000 m | 391 | 8 | +0.039 | -0.004 | +0.044 | +0.018 | +0.065 | +0.027 |
| highlands >=2000 m | 287 | 4 | +0.179 | +0.043 | +0.071 | +0.032 | +0.109 | +0.022 |
| highlands >=2000 m | 287 | 8 | +0.063 | +0.010 | +0.018 | +0.018 | +0.039 | +0.005 |
| Bay of Bengal box | 144 | 4 | +0.065 | +0.097 | +0.209 | +0.182 | +0.254 | +0.164 |
| Bay of Bengal box | 144 | 8 | -0.003 | -0.011 | +0.036 | +0.041 | +0.053 | +0.023 |
| Arabian Sea box | 120 | 4 | +0.049 | +0.087 | +0.212 | +0.149 | +0.231 | +0.175 |
| Arabian Sea box | 120 | 8 | -0.037 | +0.021 | +0.072 | +0.048 | +0.076 | +0.009 |
| north of 28N | 360 | 4 | +0.167 | +0.011 | +0.060 | +0.028 | +0.109 | +0.085 |
| north of 28N | 360 | 8 | +0.054 | +0.012 | +0.017 | +0.015 | +0.037 | +0.032 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 11% of cells below 0; (13.5, 85.5) -0.15, bias +0.0256 sea 0 m; (13.5, 86.5) -0.14, bias +0.0064 sea 0 m; (13.5, 84.5) -0.14, bias +0.0188 sea 0 m
- day 4 tp: 28% of cells below 0; (27.5, 74.5) -0.23, bias +0.0267 land 336 m; (37.5, 92.5) -0.18, bias -0.133 land 3124 m; (20.5, 67.5) -0.17, bias -0.228 sea 0 m
- day 4 u10: 18% of cells below 0; (29.5, 95.5) -0.52, bias -0.0349 land 3567 m; (26.5, 97.5) -0.49, bias +0.0603 land 1110 m; (35.5, 73.5) -0.47, bias -0.016 land 3315 m
- day 4 v10: 15% of cells below 0; (37.5, 71.5) -0.21, bias +0.0472 land 3637 m; (37.5, 70.5) -0.21, bias +0.0081 land 2435 m; (27.5, 96.5) -0.18, bias -0.0203 land 1479 m
- day 4 msl: 0% of cells below 0; (37.5, 100.5) +0.00, bias -105 land 3449 m; (36.5, 83.5) +0.01, bias -89.2 land 3654 m; (36.5, 84.5) +0.01, bias -90 land 4115 m
- day 4 tcwv: 16% of cells below 0; (35.5, 78.5) -0.18, bias +0.0092 land 5170 m; (35.5, 79.5) -0.18, bias +0.0617 land 4987 m; (36.5, 92.5) -0.17, bias +0.251 land 4008 m
- day 8 t2m: 37% of cells below 0; (13.5, 85.5) -0.22, bias +0.021 sea 0 m; (12.5, 85.5) -0.22, bias +0.0126 sea 0 m; (13.5, 86.5) -0.22, bias -0.0169 sea 0 m
- day 8 tp: 56% of cells below 0; (36.5, 80.5) -0.16, bias +0.409 land 2969 m; (37.5, 78.5) -0.14, bias +0.342 land 2067 m; (36.5, 85.5) -0.14, bias +0.244 land 4598 m
- day 8 u10: 22% of cells below 0; (26.5, 97.5) -0.32, bias +0.0909 land 1110 m; (35.5, 73.5) -0.28, bias -0.0346 land 3315 m; (29.5, 95.5) -0.25, bias -0.0251 land 3567 m
- day 8 v10: 20% of cells below 0; (37.5, 71.5) -0.13, bias +0.0242 land 3637 m; (6.5, 100.5) -0.09, bias -0.118 land 106 m; (25.5, 98.5) -0.09, bias +0.0049 land 1723 m
- day 8 msl: 12% of cells below 0; (7.5, 79.5) -0.06, bias +13.1 sea 45 m; (24.5, 100.5) -0.04, bias -86.1 land 1798 m; (6.5, 100.5) -0.04, bias +0.465 land 106 m
- day 8 tcwv: 31% of cells below 0; (37.5, 72.5) -0.14, bias +0.627 land 4245 m; (37.5, 73.5) -0.14, bias +0.533 land 4423 m; (37.5, 74.5) -0.13, bias +0.485 land 4433 m
