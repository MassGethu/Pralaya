## e3_roll8_ocean on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.294 | +0.294 | 0.532 / 0.436 / 0.277 | +0.171 |
| 4 | +0.102 | +0.265 | 0.347 / 0.228 / 0.277 | +0.097 |
| 8 | -0.029 | +0.226 | 0.289 / 0.212 / 0.277 | +0.017 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.554 / 1.889 / 1.722  (SS best +0.098, vs pers +0.177)
- tp: 6.614 / 9.366 / 6.838  (SS best +0.033, vs pers +0.294)
- u10: 1.446 / 1.973 / 1.67  (SS best +0.134, vs pers +0.267)
- v10: 1.324 / 1.939 / 1.46  (SS best +0.093, vs pers +0.317)
- msl: 242.2 / 328.5 / 278.4  (SS best +0.130, vs pers +0.263)
- tcwv: 5.364 / 7.366 / 6.138  (SS best +0.126, vs pers +0.272)

Aggregate: SS per-window +0.0590 (proxy 14.7/30), CSI skill +0.0728 (proxy 10.9/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.009, 'tp': 0.716, 'u10': 0.823, 'v10': 0.87, 'msl': 1.005, 'tcwv': 0.926}
Invalid windows: 0; CPU 10-step rollout median 53 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.7/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.89), propagates 96%, stable 88% (max 16.27 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.89), propagates 58%, stable 88% (max 14.91 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.059 [+0.044, +0.074], worst -0.241
- skill day 1: +0.234 [+0.219, +0.247], worst -0.195
- skill day 4: +0.025 [+0.008, +0.045], worst -0.647
- skill day 8: -0.083 [-0.107, -0.059], worst -0.951
- CSI skill per window: +0.073 [+0.053, +0.092], worst -0.276
- day-4 skill vs persistence: +0.229 [+0.207, +0.248], worst -0.222; windows beating persistence 95% [93%, 97%]
- day-8 in-band fraction: 0.90 [0.88, 0.92], worst 0.33
- causality proxy per window: 13.7 [13.5, 13.9], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 5.4, median 25.2, p95 42.4
- warm_ocean: stable 88% [81%, 94%]; unstable by channel {'t2m': 0, 'tp': 42, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-08 16.27 std (tp), 2020-05-09 15.76 std (tp), 2020-05-01 15.14 std (tp)
- monsoon_stall: stable 88% [81%, 94%]; unstable by channel {'t2m': 0, 'tp': 41, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-19 14.91 std (tp), 2020-06-07 12.33 std (tp), 2020-06-06 11.31 std (tp)
- worst windows (per-window skill): 2020-10-28 -0.241, 2020-02-10 -0.221, 2020-02-11 -0.218, 2020-05-06 -0.204, 2020-05-04 -0.169
- worst windows (day-8 skill): 2020-10-28 -0.951, 2020-10-27 -0.611, 2020-10-26 -0.589, 2020-04-27 -0.486, 2020-08-02 -0.465

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.098 | +0.033 | +0.134 | +0.094 | +0.130 | +0.126 |
| all | 1152 | 8 | -0.057 | -0.061 | -0.007 | -0.025 | +0.031 | -0.053 |
| ocean (lsm<0.5) | 416 | 4 | -0.132 | +0.046 | +0.161 | +0.118 | +0.189 | +0.132 |
| ocean (lsm<0.5) | 416 | 8 | -0.366 | -0.060 | +0.003 | -0.019 | +0.011 | -0.049 |
| land below 1000 m | 391 | 4 | +0.063 | +0.018 | +0.075 | +0.035 | +0.190 | +0.139 |
| land below 1000 m | 391 | 8 | -0.101 | -0.077 | -0.044 | -0.057 | +0.050 | -0.046 |
| highlands >=2000 m | 287 | 4 | +0.152 | +0.001 | +0.040 | -0.005 | +0.094 | -0.093 |
| highlands >=2000 m | 287 | 8 | +0.012 | -0.010 | -0.015 | -0.023 | +0.031 | -0.234 |
| Bay of Bengal box | 144 | 4 | -0.179 | +0.062 | +0.177 | +0.143 | +0.226 | +0.134 |
| Bay of Bengal box | 144 | 8 | -0.423 | -0.079 | -0.027 | -0.021 | +0.033 | -0.037 |
| Arabian Sea box | 120 | 4 | -0.168 | +0.050 | +0.184 | +0.116 | +0.189 | +0.168 |
| Arabian Sea box | 120 | 8 | -0.400 | -0.019 | +0.050 | +0.029 | +0.033 | -0.057 |
| north of 28N | 360 | 4 | +0.136 | -0.026 | +0.026 | -0.007 | +0.094 | +0.027 |
| north of 28N | 360 | 8 | -0.000 | -0.009 | -0.025 | -0.027 | +0.031 | -0.102 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 53% of cells below 0; (15.5, 83.5) -0.50, bias -0.095 sea 0 m; (11.5, 86.5) -0.48, bias +0.162 sea 0 m; (14.5, 65.5) -0.48, bias +0.0064 sea 0 m
- day 4 tp: 52% of cells below 0; (25.5, 76.5) -0.54, bias +0.793 land 314 m; (20.5, 67.5) -0.47, bias -0.28 sea 0 m; (27.5, 72.5) -0.45, bias -0.257 land 217 m
- day 4 u10: 35% of cells below 0; (35.5, 72.5) -1.56, bias +0.111 land 3025 m; (35.5, 73.5) -1.43, bias -0.009 land 3315 m; (29.5, 95.5) -1.30, bias -0.0532 land 3567 m
- day 4 v10: 37% of cells below 0; (37.5, 71.5) -0.76, bias +0.0631 land 3637 m; (27.5, 96.5) -0.61, bias +0.0197 land 1479 m; (27.5, 97.5) -0.54, bias +0.057 land 2097 m
- day 4 msl: 3% of cells below 0; (9.5, 96.5) -0.07, bias -25.3 sea 0 m; (6.5, 97.5) -0.06, bias -5.44 sea 0 m; (6.5, 96.5) -0.06, bias -5.03 sea 2 m
- day 4 tcwv: 25% of cells below 0; (35.5, 78.5) -0.49, bias -0.317 land 5170 m; (35.5, 82.5) -0.42, bias -0.0818 land 4950 m; (35.5, 79.5) -0.42, bias -0.0834 land 4987 m
- day 8 t2m: 83% of cells below 0; (11.5, 86.5) -0.85, bias +0.407 sea 0 m; (12.5, 85.5) -0.80, bias +0.414 sea 0 m; (12.5, 86.5) -0.80, bias +0.366 sea 0 m
- day 8 tp: 87% of cells below 0; (20.5, 67.5) -0.58, bias +0.127 sea 0 m; (17.5, 95.5) -0.55, bias +1.97 land 82 m; (16.5, 95.5) -0.47, bias +2.14 land 11 m
- day 8 u10: 65% of cells below 0; (35.5, 72.5) -2.57, bias +0.159 land 3025 m; (35.5, 73.5) -2.41, bias -0.0395 land 3315 m; (29.5, 95.5) -2.30, bias -0.115 land 3567 m
- day 8 v10: 78% of cells below 0; (37.5, 71.5) -0.96, bias +0.0458 land 3637 m; (27.5, 96.5) -0.77, bias -0.0007 land 1479 m; (27.5, 95.5) -0.72, bias +0.163 land 765 m
- day 8 msl: 32% of cells below 0; (9.5, 96.5) -0.28, bias -70.1 sea 0 m; (10.5, 96.5) -0.26, bias -75.8 sea 0 m; (10.5, 95.5) -0.24, bias -76.5 sea 0 m
- day 8 tcwv: 85% of cells below 0; (35.5, 78.5) -0.78, bias -0.597 land 5170 m; (33.5, 77.5) -0.78, bias -0.251 land 4810 m; (35.5, 77.5) -0.73, bias -0.637 land 5116 m
