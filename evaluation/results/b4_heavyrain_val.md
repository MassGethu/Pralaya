## b4_heavyrain on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.292 | +0.292 | 0.538 / 0.436 / 0.277 | +0.182 |
| 4 | +0.093 | +0.258 | 0.367 / 0.228 / 0.277 | +0.124 |
| 8 | -0.056 | +0.206 | 0.317 / 0.212 / 0.277 | +0.055 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.567 / 1.889 / 1.722  (SS best +0.090, vs pers +0.170)
- tp: 6.865 / 9.366 / 6.838  (SS best -0.004, vs pers +0.267)
- u10: 1.458 / 1.973 / 1.67  (SS best +0.127, vs pers +0.261)
- v10: 1.333 / 1.939 / 1.46  (SS best +0.087, vs pers +0.313)
- msl: 242.7 / 328.5 / 278.4  (SS best +0.128, vs pers +0.261)
- tcwv: 5.353 / 7.366 / 6.138  (SS best +0.128, vs pers +0.273)

Aggregate: SS per-window +0.0320 (proxy 8.0/30), CSI skill +0.0953 (proxy 14.3/15), anti-blur proxy 10.0/10 (in-band 93%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.027999997138977, 'tp': 1.7799999713897705, 'u10': 0.8450000286102295, 'v10': 0.9110000133514404, 'msl': 1.003000020980835, 'tcwv': 0.949999988079071}
Invalid windows: 0; CPU 10-step rollout median 26 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.9/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.90), propagates 96%, stable 88% (max 14.16 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.89), propagates 64%, stable 91% (max 11.96 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.032 [+0.016, +0.049], worst -0.305
- skill day 1: +0.230 [+0.215, +0.243], worst -0.211
- skill day 4: +0.004 [-0.015, +0.024], worst -0.736
- skill day 8: -0.138 [-0.164, -0.111], worst -1.111
- CSI skill per window: +0.095 [+0.075, +0.118], worst -0.240
- day-4 skill vs persistence: +0.213 [+0.190, +0.233], worst -0.340; windows beating persistence 95% [92%, 97%]
- day-8 in-band fraction: 0.93 [0.91, 0.95], worst 0.50
- causality proxy per window: 13.9 [13.6, 14.1], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 4.3, median 20.9, p95 37.1
- warm_ocean: stable 88% [82%, 94%]; unstable by channel {'t2m': 0, 'tp': 41, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-09 14.16 std (tp), 2020-05-05 13.3 std (tp), 2020-05-10 12.94 std (tp)
- monsoon_stall: stable 91% [84%, 96%]; unstable by channel {'t2m': 0, 'tp': 32, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-07 11.96 std (tp), 2020-06-05 11.46 std (tp), 2020-06-06 11.16 std (tp)
- worst windows (per-window skill): 2020-10-28 -0.305, 2020-02-10 -0.299, 2020-02-11 -0.298, 2020-05-04 -0.262, 2020-05-06 -0.224
- worst windows (day-8 skill): 2020-10-28 -1.111, 2020-10-26 -0.719, 2020-10-27 -0.666, 2020-05-04 -0.607, 2020-05-01 -0.541

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.090 | -0.004 | +0.127 | +0.088 | +0.128 | +0.128 |
| all | 1152 | 8 | -0.077 | -0.132 | -0.034 | -0.048 | +0.012 | -0.055 |
| ocean (lsm<0.5) | 416 | 4 | -0.159 | +0.012 | +0.152 | +0.111 | +0.180 | +0.132 |
| ocean (lsm<0.5) | 416 | 8 | -0.470 | -0.129 | -0.026 | -0.046 | -0.021 | -0.062 |
| land below 1000 m | 391 | 4 | +0.055 | -0.020 | +0.076 | +0.030 | +0.178 | +0.144 |
| land below 1000 m | 391 | 8 | -0.123 | -0.147 | -0.064 | -0.070 | +0.016 | -0.031 |
| highlands >=2000 m | 287 | 4 | +0.147 | -0.050 | +0.034 | -0.004 | +0.098 | -0.115 |
| highlands >=2000 m | 287 | 8 | +0.004 | -0.092 | -0.029 | -0.027 | +0.022 | -0.300 |
| Bay of Bengal box | 144 | 4 | -0.212 | +0.029 | +0.172 | +0.138 | +0.213 | +0.128 |
| Bay of Bengal box | 144 | 8 | -0.522 | -0.147 | -0.062 | -0.049 | -0.004 | -0.076 |
| Arabian Sea box | 120 | 4 | -0.175 | +0.024 | +0.180 | +0.115 | +0.191 | +0.161 |
| Arabian Sea box | 120 | 8 | -0.447 | -0.051 | +0.013 | -0.015 | +0.026 | -0.069 |
| north of 28N | 360 | 4 | +0.130 | -0.090 | +0.023 | -0.007 | +0.097 | +0.019 |
| north of 28N | 360 | 8 | -0.010 | -0.093 | -0.036 | -0.032 | +0.022 | -0.099 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 55% of cells below 0; (11.5, 86.5) -0.58, bias +0.157 sea 0 m; (12.5, 86.5) -0.56, bias +0.144 sea 0 m; (10.5, 86.5) -0.55, bias +0.125 sea 0 m
- day 4 tp: 67% of cells below 0; (27.5, 74.5) -0.84, bias +0.622 land 336 m; (25.5, 76.5) -0.79, bias +1.78 land 314 m; (25.5, 75.5) -0.76, bias +1.49 land 350 m
- day 4 u10: 36% of cells below 0; (35.5, 72.5) -1.68, bias +0.124 land 3025 m; (29.5, 95.5) -1.45, bias -0.0902 land 3567 m; (35.5, 73.5) -1.41, bias +0.0012 land 3315 m
- day 4 v10: 39% of cells below 0; (37.5, 71.5) -0.74, bias +0.0491 land 3637 m; (27.5, 96.5) -0.60, bias +0.0044 land 1479 m; (26.5, 95.5) -0.57, bias +0.128 land 742 m
- day 4 msl: 3% of cells below 0; (6.5, 98.5) -0.09, bias -23.1 sea 1 m; (6.5, 97.5) -0.08, bias -11.8 sea 0 m; (6.5, 96.5) -0.08, bias -11.5 sea 2 m
- day 4 tcwv: 26% of cells below 0; (33.5, 85.5) -0.58, bias +0.757 land 5088 m; (35.5, 78.5) -0.57, bias -0.317 land 5170 m; (33.5, 86.5) -0.55, bias +0.696 land 5070 m
- day 8 t2m: 85% of cells below 0; (6.5, 82.5) -1.07, bias +0.578 sea 6 m; (11.5, 86.5) -1.02, bias +0.452 sea 0 m; (11.5, 85.5) -0.98, bias +0.451 sea 0 m
- day 8 tp: 95% of cells below 0; (20.5, 67.5) -1.48, bias +2.11 sea 0 m; (20.5, 66.5) -1.26, bias +1.61 sea 0 m; (20.5, 95.5) -1.00, bias +3.49 land 273 m
- day 8 u10: 74% of cells below 0; (35.5, 72.5) -2.95, bias +0.178 land 3025 m; (29.5, 95.5) -2.50, bias -0.134 land 3567 m; (35.5, 73.5) -2.23, bias -0.0115 land 3315 m
- day 8 v10: 86% of cells below 0; (27.5, 96.5) -1.00, bias -0.0565 land 1479 m; (37.5, 71.5) -0.93, bias +0.0382 land 3637 m; (27.5, 86.5) -0.85, bias -0.152 land 2434 m
- day 8 msl: 47% of cells below 0; (9.5, 96.5) -0.31, bias -79.7 sea 0 m; (7.5, 98.5) -0.30, bias -55.7 sea 16 m; (6.5, 98.5) -0.30, bias -55 sea 1 m
- day 8 tcwv: 82% of cells below 0; (35.5, 77.5) -1.00, bias -0.758 land 5116 m; (36.5, 86.5) -0.98, bias +1.19 land 4842 m; (35.5, 78.5) -0.97, bias -0.757 land 5170 m
