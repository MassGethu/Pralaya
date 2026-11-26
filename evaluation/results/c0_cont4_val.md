## c0_cont4 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.297 | +0.297 | 0.530 / 0.436 / 0.277 | +0.168 |
| 4 | +0.095 | +0.259 | 0.337 / 0.228 / 0.277 | +0.083 |
| 8 | -0.061 | +0.202 | 0.277 / 0.212 / 0.277 | -0.001 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.565 / 1.889 / 1.722  (SS best +0.091, vs pers +0.172)
- tp: 6.7 / 9.366 / 6.838  (SS best +0.020, vs pers +0.285)
- u10: 1.464 / 1.973 / 1.67  (SS best +0.123, vs pers +0.258)
- v10: 1.332 / 1.939 / 1.46  (SS best +0.088, vs pers +0.313)
- msl: 244.4 / 328.5 / 278.4  (SS best +0.122, vs pers +0.256)
- tcwv: 5.378 / 7.366 / 6.138  (SS best +0.124, vs pers +0.270)

Aggregate: SS per-window +0.0426 (proxy 10.6/30), CSI skill +0.0654 (proxy 9.8/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0080000162124634, 'tp': 0.8330000042915344, 'u10': 0.9079999923706055, 'v10': 0.902999997138977, 'msl': 1.034999966621399, 'tcwv': 0.9240000247955322}
Invalid windows: 0; CPU 10-step rollout median 48 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.7/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.87), propagates 95%, stable 77% (max 19.62 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.88), propagates 73%, stable 84% (max 20.46 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.043 [+0.025, +0.059], worst -0.324
- skill day 1: +0.236 [+0.220, +0.249], worst -0.229
- skill day 4: +0.013 [-0.005, +0.034], worst -0.685
- skill day 8: -0.121 [-0.152, -0.091], worst -1.142
- CSI skill per window: +0.065 [+0.045, +0.084], worst -0.230
- day-4 skill vs persistence: +0.218 [+0.195, +0.238], worst -0.422; windows beating persistence 93% [90%, 96%]
- day-8 in-band fraction: 0.90 [0.88, 0.92], worst 0.33
- causality proxy per window: 13.7 [13.4, 13.9], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 1.9, median 19.9, p95 39.4
- warm_ocean: stable 77% [70%, 84%]; unstable by channel {'t2m': 0, 'tp': 80, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-09 19.62 std (tp), 2020-05-10 18.57 std (tp), 2020-05-08 17.27 std (tp)
- monsoon_stall: stable 84% [76%, 92%]; unstable by channel {'t2m': 0, 'tp': 55, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-06-05 20.46 std (tp), 2020-06-07 16.29 std (tp), 2020-06-10 13.77 std (tp)
- worst windows (per-window skill): 2020-04-27 -0.324, 2020-05-04 -0.310, 2020-10-28 -0.310, 2020-02-10 -0.283, 2020-02-11 -0.278
- worst windows (day-8 skill): 2020-10-28 -1.142, 2020-04-27 -0.974, 2020-05-04 -0.745, 2020-10-26 -0.734, 2020-04-26 -0.730

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.091 | +0.020 | +0.123 | +0.088 | +0.122 | +0.124 |
| all | 1152 | 8 | -0.091 | -0.100 | -0.039 | -0.060 | +0.001 | -0.078 |
| ocean (lsm<0.5) | 416 | 4 | -0.247 | +0.029 | +0.147 | +0.113 | +0.179 | +0.127 |
| ocean (lsm<0.5) | 416 | 8 | -0.579 | -0.103 | -0.031 | -0.056 | -0.024 | -0.079 |
| land below 1000 m | 391 | 4 | +0.071 | +0.013 | +0.080 | +0.027 | +0.186 | +0.140 |
| land below 1000 m | 391 | 8 | -0.135 | -0.111 | -0.067 | -0.089 | +0.016 | -0.065 |
| highlands >=2000 m | 287 | 4 | +0.151 | -0.010 | +0.024 | -0.014 | +0.087 | -0.106 |
| highlands >=2000 m | 287 | 8 | +0.001 | -0.035 | -0.037 | -0.033 | +0.007 | -0.285 |
| Bay of Bengal box | 144 | 4 | -0.308 | +0.044 | +0.159 | +0.140 | +0.211 | +0.130 |
| Bay of Bengal box | 144 | 8 | -0.640 | -0.123 | -0.066 | -0.078 | -0.004 | -0.097 |
| Arabian Sea box | 120 | 4 | -0.255 | +0.022 | +0.170 | +0.102 | +0.181 | +0.157 |
| Arabian Sea box | 120 | 8 | -0.587 | -0.074 | -0.001 | -0.004 | -0.002 | -0.069 |
| north of 28N | 360 | 4 | +0.135 | -0.056 | +0.014 | -0.017 | +0.085 | +0.022 |
| north of 28N | 360 | 8 | -0.010 | -0.034 | -0.040 | -0.039 | +0.004 | -0.121 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 53% of cells below 0; (18.5, 86.5) -0.76, bias -0.106 sea 0 m; (17.5, 85.5) -0.72, bias -0.0573 sea 0 m; (11.5, 86.5) -0.70, bias +0.151 sea 0 m
- day 4 tp: 58% of cells below 0; (27.5, 74.5) -0.65, bias +0.298 land 336 m; (27.5, 73.5) -0.62, bias +0.174 land 275 m; (20.5, 67.5) -0.57, bias -0.0289 sea 0 m
- day 4 u10: 37% of cells below 0; (29.5, 95.5) -1.53, bias -0.0781 land 3567 m; (35.5, 73.5) -1.44, bias -0.0092 land 3315 m; (35.5, 72.5) -1.42, bias +0.0796 land 3025 m
- day 4 v10: 42% of cells below 0; (37.5, 71.5) -0.79, bias +0.101 land 3637 m; (27.5, 86.5) -0.58, bias +0.0191 land 2434 m; (37.5, 70.5) -0.56, bias +0.0572 land 2435 m
- day 4 msl: 6% of cells below 0; (36.5, 76.5) -0.07, bias -86.6 land 4472 m; (36.5, 74.5) -0.06, bias -81.8 land 4223 m; (6.5, 96.5) -0.06, bias -0.966 sea 2 m
- day 4 tcwv: 25% of cells below 0; (35.5, 82.5) -0.60, bias +0.11 land 4950 m; (36.5, 86.5) -0.54, bias +0.75 land 4842 m; (33.5, 85.5) -0.54, bias +0.726 land 5088 m
- day 8 t2m: 86% of cells below 0; (15.5, 82.5) -1.23, bias -0.445 sea 0 m; (11.5, 86.5) -1.21, bias +0.301 sea 0 m; (14.5, 82.5) -1.19, bias -0.368 sea 0 m
- day 8 tp: 94% of cells below 0; (20.5, 67.5) -0.92, bias +0.653 sea 0 m; (20.5, 68.5) -0.64, bias +0.855 sea 0 m; (20.5, 66.5) -0.60, bias +0.348 sea 0 m
- day 8 u10: 75% of cells below 0; (29.5, 95.5) -2.95, bias -0.204 land 3567 m; (35.5, 72.5) -2.56, bias +0.1 land 3025 m; (35.5, 73.5) -2.49, bias -0.0534 land 3315 m
- day 8 v10: 88% of cells below 0; (37.5, 71.5) -1.05, bias +0.0847 land 3637 m; (27.5, 95.5) -0.95, bias +0.221 land 765 m; (37.5, 70.5) -0.95, bias +0.0264 land 2435 m
- day 8 msl: 56% of cells below 0; (9.5, 96.5) -0.30, bias -73.2 sea 0 m; (10.5, 96.5) -0.27, bias -77 sea 0 m; (8.5, 96.5) -0.26, bias -51.1 sea 0 m
- day 8 tcwv: 88% of cells below 0; (36.5, 86.5) -1.20, bias +1.45 land 4842 m; (35.5, 82.5) -1.12, bias +0.413 land 4950 m; (32.5, 88.5) -1.07, bias +0.972 land 4913 m
