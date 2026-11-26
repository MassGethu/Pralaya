## b2_unet_b1 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.311 | +0.311 | 0.541 / 0.436 / 0.277 | +0.186 |
| 4 | +0.043 | +0.216 | 0.340 / 0.228 / 0.277 | +0.086 |
| 8 | -0.159 | +0.129 | 0.264 / 0.212 / 0.277 | -0.018 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.68 / 1.889 / 1.722  (SS best +0.024, vs pers +0.111)
- tp: 6.935 / 9.366 / 6.838  (SS best -0.014, vs pers +0.260)
- u10: 1.484 / 1.973 / 1.67  (SS best +0.112, vs pers +0.248)
- v10: 1.429 / 1.939 / 1.46  (SS best +0.021, vs pers +0.263)
- msl: 260 / 328.5 / 278.4  (SS best +0.066, vs pers +0.209)
- tcwv: 5.847 / 7.366 / 6.138  (SS best +0.048, vs pers +0.206)

Aggregate: SS per-window -0.0074 (proxy 0.0/30), CSI skill +0.0633 (proxy 9.5/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.11899995803833, 'tp': 0.9210000038146973, 'u10': 0.9980000257492065, 'v10': 1.1069999933242798, 'msl': 1.0520000457763672, 'tcwv': 0.9850000143051147}
Invalid windows: 0; CPU 10-step rollout median 32 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.7/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.95, min 0.80), propagates 97%, stable 71% (max 19.46 std), far frac max 0.030
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.93, min 0.68), propagates 81%, stable 81% (max 16.12 std), far frac max 0.082

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: -0.007 [-0.024, +0.011], worst -0.357
- skill day 1: +0.258 [+0.241, +0.272], worst -0.055
- skill day 4: -0.045 [-0.066, -0.017], worst -0.588
- skill day 8: -0.236 [-0.264, -0.204], worst -0.998
- CSI skill per window: +0.063 [+0.043, +0.080], worst -0.294
- day-4 skill vs persistence: +0.176 [+0.151, +0.199], worst -0.352; windows beating persistence 89% [84%, 94%]
- day-8 in-band fraction: 0.90 [0.88, 0.92], worst 0.50
- causality proxy per window: 13.7 [13.5, 13.9], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 0.0, median 11.7, p95 27.1
- warm_ocean: stable 71% [60%, 79%]; unstable by channel {'t2m': 0, 'tp': 104, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-29 19.46 std (tp), 2020-05-07 16.22 std (tp), 2020-09-26 14.95 std (tp)
- monsoon_stall: stable 81% [73%, 88%]; unstable by channel {'t2m': 0, 'tp': 68, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-07 16.12 std (tp), 2020-06-13 14.84 std (tp), 2020-06-17 14.72 std (tp)
- worst windows (per-window skill): 2020-12-18 -0.357, 2020-10-03 -0.353, 2020-10-04 -0.347, 2020-10-05 -0.332, 2020-05-01 -0.288
- worst windows (day-8 skill): 2020-12-18 -0.998, 2020-05-01 -0.782, 2020-10-27 -0.781, 2020-10-26 -0.696, 2020-04-26 -0.694

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.024 | -0.014 | +0.112 | +0.021 | +0.066 | +0.047 |
| all | 1152 | 8 | -0.249 | -0.139 | -0.089 | -0.164 | -0.079 | -0.232 |
| ocean (lsm<0.5) | 416 | 4 | -0.192 | -0.004 | +0.144 | +0.043 | +0.157 | +0.058 |
| ocean (lsm<0.5) | 416 | 8 | -0.597 | -0.126 | -0.068 | -0.162 | -0.051 | -0.207 |
| land below 1000 m | 391 | 4 | +0.040 | -0.013 | +0.048 | -0.029 | +0.167 | +0.053 |
| land below 1000 m | 391 | 8 | -0.251 | -0.161 | -0.138 | -0.180 | -0.082 | -0.247 |
| highlands >=2000 m | 287 | 4 | +0.048 | -0.086 | -0.023 | -0.081 | +0.002 | -0.181 |
| highlands >=2000 m | 287 | 8 | -0.202 | -0.160 | -0.178 | -0.164 | -0.084 | -0.520 |
| Bay of Bengal box | 144 | 4 | -0.213 | -0.009 | +0.171 | +0.044 | +0.194 | +0.041 |
| Bay of Bengal box | 144 | 8 | -0.648 | -0.155 | -0.074 | -0.206 | -0.046 | -0.263 |
| Arabian Sea box | 120 | 4 | -0.255 | +0.001 | +0.138 | +0.057 | +0.162 | +0.096 |
| Arabian Sea box | 120 | 8 | -0.636 | -0.080 | -0.080 | -0.082 | -0.033 | -0.131 |
| north of 28N | 360 | 4 | +0.042 | -0.097 | -0.030 | -0.073 | +0.010 | -0.049 |
| north of 28N | 360 | 8 | -0.198 | -0.149 | -0.175 | -0.157 | -0.084 | -0.303 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 66% of cells below 0; (10.5, 86.5) -0.54, bias +0.0923 sea 0 m; (11.5, 87.5) -0.52, bias +0.137 sea 0 m; (13.5, 86.5) -0.52, bias +0.104 sea 0 m
- day 4 tp: 70% of cells below 0; (20.5, 67.5) -1.00, bias -0.0571 sea 0 m; (20.5, 66.5) -0.90, bias -0.244 sea 0 m; (25.5, 75.5) -0.90, bias +0.92 land 350 m
- day 4 u10: 45% of cells below 0; (29.5, 95.5) -1.49, bias -0.111 land 3567 m; (35.5, 73.5) -1.45, bias -0.137 land 3315 m; (26.5, 97.5) -1.30, bias +0.0245 land 1110 m
- day 4 v10: 62% of cells below 0; (27.5, 96.5) -0.86, bias +0.124 land 1479 m; (26.5, 95.5) -0.85, bias +0.164 land 742 m; (23.5, 97.5) -0.78, bias +0.156 land 880 m
- day 4 msl: 22% of cells below 0; (6.5, 100.5) -0.17, bias +3.31 land 106 m; (6.5, 99.5) -0.15, bias +4.92 sea 27 m; (28.5, 88.5) -0.13, bias -86.9 land 4620 m
- day 4 tcwv: 42% of cells below 0; (30.5, 83.5) -0.72, bias -0.622 land 5096 m; (30.5, 84.5) -0.69, bias -0.515 land 5130 m; (30.5, 85.5) -0.65, bias -0.507 land 5138 m
- day 8 t2m: 96% of cells below 0; (7.5, 100.5) -1.31, bias -0.217 sea 45 m; (8.5, 100.5) -1.22, bias -0.0389 sea 30 m; (6.5, 100.5) -1.18, bias -0.367 land 106 m
- day 8 tp: 99% of cells below 0; (37.5, 92.5) -0.82, bias +0.387 land 3124 m; (36.5, 93.5) -0.81, bias +0.784 land 3633 m; (37.5, 96.5) -0.80, bias +0.755 land 3603 m
- day 8 u10: 89% of cells below 0; (35.5, 73.5) -2.41, bias -0.237 land 3315 m; (29.5, 95.5) -2.34, bias -0.164 land 3567 m; (30.5, 95.5) -1.83, bias -0.326 land 4382 m
- day 8 v10: 100% of cells below 0; (27.5, 96.5) -1.38, bias +0.12 land 1479 m; (7.5, 80.5) -1.24, bias -0.365 land 195 m; (27.5, 95.5) -1.15, bias +0.135 land 765 m
- day 8 msl: 95% of cells below 0; (6.5, 100.5) -0.37, bias +10.7 land 106 m; (6.5, 99.5) -0.33, bias +11.9 sea 27 m; (33.5, 65.5) -0.28, bias +106 land 2349 m
- day 8 tcwv: 99% of cells below 0; (30.5, 85.5) -1.82, bias -0.965 land 5138 m; (30.5, 84.5) -1.82, bias -0.974 land 5130 m; (30.5, 83.5) -1.75, bias -1.2 land 5096 m
