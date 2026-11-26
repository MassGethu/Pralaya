## b5_transport_b1 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.304 | +0.304 | 0.536 / 0.436 / 0.277 | +0.177 |
| 4 | +0.050 | +0.222 | 0.324 / 0.228 / 0.277 | +0.065 |
| 8 | -0.149 | +0.136 | 0.260 / 0.212 / 0.277 | -0.024 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.684 / 1.889 / 1.722  (SS best +0.022, vs pers +0.108)
- tp: 6.995 / 9.366 / 6.838  (SS best -0.023, vs pers +0.253)
- u10: 1.508 / 1.973 / 1.67  (SS best +0.098, vs pers +0.236)
- v10: 1.398 / 1.939 / 1.46  (SS best +0.043, vs pers +0.279)
- msl: 256 / 328.5 / 278.4  (SS best +0.081, vs pers +0.221)
- tcwv: 5.645 / 7.366 / 6.138  (SS best +0.080, vs pers +0.234)

Aggregate: SS per-window -0.0038 (proxy 0.0/30), CSI skill +0.0543 (proxy 8.1/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.031000018119812, 'tp': 0.9620000123977661, 'u10': 1.0240000486373901, 'v10': 0.9950000047683716, 'msl': 1.2230000495910645, 'tcwv': 0.9570000171661377}
Invalid windows: 0; CPU 10-step rollout median 26 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.0/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.84), propagates 97%, stable 58% (max 19.93 std), far frac max 0.004
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.95), propagates 57%, stable 80% (max 24.41 std), far frac max 0.001

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: -0.004 [-0.021, +0.014], worst -0.377
- skill day 1: +0.249 [+0.236, +0.261], worst -0.192
- skill day 4: -0.035 [-0.054, -0.011], worst -0.453
- skill day 8: -0.225 [-0.259, -0.193], worst -1.313
- CSI skill per window: +0.054 [+0.031, +0.074], worst -0.292
- day-4 skill vs persistence: +0.184 [+0.164, +0.204], worst -0.351; windows beating persistence 92% [88%, 95%]
- day-8 in-band fraction: 0.90 [0.89, 0.92], worst 0.33
- causality proxy per window: 13.0 [12.7, 13.2], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 0.0, median 10.6, p95 27.6
- warm_ocean: stable 58% [45%, 70%]; unstable by channel {'t2m': 0, 'tp': 149, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-09-20 19.93 std (tp), 2020-10-21 18.41 std (tp), 2020-09-19 17.46 std (tp)
- monsoon_stall: stable 80% [70%, 89%]; unstable by channel {'t2m': 0, 'tp': 70, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-13 24.41 std (tp), 2020-06-25 17.57 std (tp), 2020-06-16 15.93 std (tp)
- worst windows (per-window skill): 2020-10-27 -0.377, 2020-10-28 -0.374, 2020-09-10 -0.319, 2020-11-11 -0.280, 2020-05-01 -0.262
- worst windows (day-8 skill): 2020-10-28 -1.312, 2020-10-27 -1.214, 2020-05-01 -1.018, 2020-11-11 -0.981, 2020-09-19 -0.715

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.022 | -0.023 | +0.097 | +0.043 | +0.081 | +0.080 |
| all | 1152 | 8 | -0.250 | -0.174 | -0.118 | -0.150 | -0.065 | -0.139 |
| ocean (lsm<0.5) | 416 | 4 | -0.470 | -0.017 | +0.132 | +0.068 | +0.139 | +0.101 |
| ocean (lsm<0.5) | 416 | 8 | -1.107 | -0.188 | -0.102 | -0.147 | -0.167 | -0.130 |
| land below 1000 m | 391 | 4 | +0.010 | -0.032 | +0.021 | -0.040 | +0.163 | +0.078 |
| land below 1000 m | 391 | 8 | -0.264 | -0.173 | -0.164 | -0.212 | -0.024 | -0.131 |
| highlands >=2000 m | 287 | 4 | +0.095 | -0.037 | -0.023 | -0.027 | +0.031 | -0.183 |
| highlands >=2000 m | 287 | 8 | -0.116 | -0.080 | -0.156 | -0.057 | -0.053 | -0.419 |
| Bay of Bengal box | 144 | 4 | -0.597 | +0.016 | +0.163 | +0.104 | +0.193 | +0.106 |
| Bay of Bengal box | 144 | 8 | -1.182 | -0.198 | -0.098 | -0.136 | -0.124 | -0.158 |
| Arabian Sea box | 120 | 4 | -0.454 | -0.068 | +0.105 | +0.059 | +0.111 | +0.134 |
| Arabian Sea box | 120 | 8 | -1.106 | -0.126 | -0.120 | -0.114 | -0.155 | -0.114 |
| north of 28N | 360 | 4 | +0.077 | -0.058 | -0.030 | -0.042 | +0.036 | -0.033 |
| north of 28N | 360 | 8 | -0.145 | -0.083 | -0.142 | -0.079 | -0.050 | -0.208 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 66% of cells below 0; (14.5, 84.5) -1.61, bias +0.4 sea 0 m; (13.5, 84.5) -1.57, bias +0.373 sea 0 m; (17.5, 85.5) -1.47, bias +0.0587 sea 0 m
- day 4 tp: 70% of cells below 0; (20.5, 67.5) -1.27, bias +1.06 sea 0 m; (19.5, 67.5) -1.14, bias +1.22 sea 0 m; (20.5, 66.5) -1.00, bias +0.568 sea 0 m
- day 4 u10: 45% of cells below 0; (35.5, 73.5) -2.06, bias -0.159 land 3315 m; (35.5, 71.5) -1.72, bias +0.0511 land 3002 m; (35.5, 72.5) -1.64, bias -0.0317 land 3025 m
- day 4 v10: 60% of cells below 0; (37.5, 70.5) -0.82, bias -0.118 land 2435 m; (6.5, 100.5) -0.75, bias -0.394 land 106 m; (27.5, 96.5) -0.69, bias -0.0438 land 1479 m
- day 4 msl: 16% of cells below 0; (6.5, 65.5) -0.24, bias -26.6 sea 0 m; (6.5, 66.5) -0.22, bias -28 sea 0 m; (6.5, 67.5) -0.16, bias -26.7 sea 0 m
- day 4 tcwv: 36% of cells below 0; (35.5, 84.5) -0.91, bias -1.42 land 5022 m; (35.5, 85.5) -0.81, bias -1.32 land 5063 m; (35.5, 86.5) -0.73, bias -1.24 land 5055 m
- day 8 t2m: 94% of cells below 0; (12.5, 84.5) -2.00, bias +0.351 sea 0 m; (17.5, 84.5) -1.99, bias -0.389 sea 4 m; (13.5, 84.5) -1.97, bias +0.434 sea 0 m
- day 8 tp: 97% of cells below 0; (24.5, 65.5) -2.82, bias +1.08 sea 11 m; (20.5, 67.5) -1.83, bias +2.75 sea 0 m; (23.5, 65.5) -1.73, bias +1.72 sea 0 m
- day 8 u10: 95% of cells below 0; (35.5, 73.5) -3.60, bias -0.277 land 3315 m; (35.5, 72.5) -2.83, bias -0.0529 land 3025 m; (35.5, 71.5) -2.83, bias +0.05 land 3002 m
- day 8 v10: 97% of cells below 0; (10.5, 77.5) -1.38, bias -0.704 land 425 m; (24.5, 98.5) -1.32, bias -0.318 land 1466 m; (37.5, 70.5) -1.32, bias -0.112 land 2435 m
- day 8 msl: 76% of cells below 0; (6.5, 65.5) -0.59, bias -45.7 sea 0 m; (10.5, 100.5) -0.58, bias -139 sea 3 m; (6.5, 66.5) -0.57, bias -45.4 sea 0 m
- day 8 tcwv: 97% of cells below 0; (35.5, 84.5) -2.03, bias -2.77 land 5022 m; (35.5, 85.5) -2.00, bias -2.81 land 5063 m; (35.5, 86.5) -1.89, bias -2.76 land 5055 m
