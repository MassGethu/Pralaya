## b1_onestep on test (353 windows, init 2021-01-03..2021-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.307 | +0.307 | 0.531 / 0.426 / 0.260 | +0.183 |
| 4 | +0.040 | +0.218 | 0.324 / 0.209 / 0.261 | +0.086 |
| 8 | -0.129 | +0.160 | 0.267 / 0.196 / 0.262 | +0.008 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.712 / 1.934 / 1.779  (SS best +0.038, vs pers +0.115)
- tp: 7.181 / 9.249 / 6.788  (SS best -0.058, vs pers +0.224)
- u10: 1.562 / 2.073 / 1.672  (SS best +0.066, vs pers +0.246)
- v10: 1.415 / 1.956 / 1.464  (SS best +0.033, vs pers +0.277)
- msl: 275 / 353.6 / 284.9  (SS best +0.035, vs pers +0.222)
- tcwv: 5.877 / 7.559 / 6.701  (SS best +0.123, vs pers +0.223)

Aggregate: SS per-window +0.0013 (proxy 0.3/30), CSI skill +0.0651 (proxy 9.8/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 0.9639999866485596, 'tp': 1.4859999418258667, 'u10': 0.9020000100135803, 'v10': 0.8690000176429749, 'msl': 0.9139999747276306, 'tcwv': 1.003999948501587}
Invalid windows: 0; CPU 10-step rollout median 35 ms
Shocks (353 windows): null exact=True ok=True; causality proxy 13.5/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.77), propagates 97%, stable 66% (max 23.59 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.93), propagates 75%, stable 83% (max 13.64 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.001 [-0.012, +0.016], worst -0.411
- skill day 1: +0.254 [+0.242, +0.268], worst -0.065
- skill day 4: -0.046 [-0.066, -0.028], worst -0.469
- skill day 8: -0.204 [-0.233, -0.176], worst -1.107
- CSI skill per window: +0.065 [+0.048, +0.086], worst -0.333
- day-4 skill vs persistence: +0.184 [+0.164, +0.207], worst -0.263; windows beating persistence 91% [88%, 95%]
- day-8 in-band fraction: 0.90 [0.87, 0.92], worst 0.33
- causality proxy per window: 13.5 [13.2, 13.8], worst 7.5
- grader-like draw (5 random windows), forecast points /45: p05 0.0, median 13.1, p95 26.0
- warm_ocean: stable 66% [55%, 76%]; unstable by channel {'t2m': 0, 'tp': 121, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-05-19 23.59 std (tp), 2021-05-17 20.77 std (tp), 2021-11-10 18.07 std (tp)
- monsoon_stall: stable 83% [76%, 90%]; unstable by channel {'t2m': 0, 'tp': 59, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-06-10 13.64 std (tp), 2021-10-11 13.09 std (tp), 2021-05-14 13.0 std (tp)
- worst windows (per-window skill): 2021-11-18 -0.411, 2021-01-16 -0.345, 2021-12-19 -0.233, 2021-11-29 -0.225, 2021-10-16 -0.213
- worst windows (day-8 skill): 2021-11-18 -1.107, 2021-01-16 -1.102, 2021-11-13 -0.716, 2021-11-29 -0.704, 2021-06-02 -0.647

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.038 | -0.058 | +0.066 | +0.033 | +0.035 | +0.123 |
| all | 1152 | 8 | -0.192 | -0.141 | -0.121 | -0.106 | -0.094 | -0.121 |
| ocean (lsm<0.5) | 416 | 4 | -0.328 | -0.051 | +0.088 | +0.060 | +0.146 | +0.143 |
| ocean (lsm<0.5) | 416 | 8 | -0.758 | -0.148 | -0.119 | -0.091 | -0.086 | -0.122 |
| land below 1000 m | 391 | 4 | -0.001 | -0.070 | +0.043 | -0.040 | +0.077 | +0.120 |
| land below 1000 m | 391 | 8 | -0.258 | -0.135 | -0.128 | -0.180 | -0.099 | -0.102 |
| highlands >=2000 m | 287 | 4 | +0.099 | -0.058 | -0.070 | -0.042 | -0.004 | -0.141 |
| highlands >=2000 m | 287 | 8 | -0.102 | -0.113 | -0.118 | -0.090 | -0.083 | -0.398 |
| Bay of Bengal box | 144 | 4 | -0.317 | -0.068 | +0.077 | +0.047 | +0.158 | +0.107 |
| Bay of Bengal box | 144 | 8 | -0.716 | -0.157 | -0.187 | -0.130 | -0.089 | -0.163 |
| Arabian Sea box | 120 | 4 | -0.262 | -0.014 | +0.084 | +0.097 | +0.201 | +0.203 |
| Arabian Sea box | 120 | 8 | -0.708 | -0.107 | -0.083 | -0.032 | -0.035 | -0.063 |
| north of 28N | 360 | 4 | +0.082 | -0.061 | -0.056 | -0.046 | -0.003 | +0.054 |
| north of 28N | 360 | 8 | -0.111 | -0.104 | -0.118 | -0.102 | -0.089 | -0.147 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 65% of cells below 0; (6.5, 77.5) -0.72, bias -0.336 sea 0 m; (18.5, 86.5) -0.69, bias -0.319 sea 0 m; (17.5, 85.5) -0.68, bias -0.326 sea 0 m
- day 4 tp: 79% of cells below 0; (17.5, 65.5) -3.71, bias +0.617 sea 0 m; (17.5, 66.5) -2.87, bias +0.514 sea 0 m; (27.5, 69.5) -2.77, bias +0.322 land 76 m
- day 4 u10: 45% of cells below 0; (29.5, 95.5) -1.83, bias -0.178 land 3567 m; (26.5, 97.5) -1.31, bias +0.149 land 1110 m; (35.5, 73.5) -1.25, bias -0.102 land 3315 m
- day 4 v10: 61% of cells below 0; (27.5, 96.5) -0.90, bias -0.0053 land 1479 m; (26.5, 95.5) -0.73, bias +0.119 land 742 m; (36.5, 70.5) -0.68, bias -0.148 land 3087 m
- day 4 msl: 24% of cells below 0; (9.5, 100.5) -0.18, bias +6.07 sea 15 m; (8.5, 100.5) -0.15, bias -5.86 sea 30 m; (6.5, 100.5) -0.15, bias -23 land 106 m
- day 4 tcwv: 31% of cells below 0; (35.5, 78.5) -0.76, bias -0.317 land 5170 m; (35.5, 79.5) -0.70, bias -0.0986 land 4987 m; (35.5, 80.5) -0.60, bias +0.053 land 4787 m
- day 8 t2m: 93% of cells below 0; (6.5, 77.5) -1.46, bias -0.649 sea 0 m; (11.5, 74.5) -1.38, bias -0.0726 sea 11 m; (9.5, 74.5) -1.34, bias -0.164 sea 0 m
- day 8 tp: 99% of cells below 0; (16.5, 65.5) -1.89, bias +0.983 sea 0 m; (28.5, 65.5) -1.88, bias +0.344 land 1204 m; (17.5, 65.5) -1.85, bias +0.946 sea 0 m
- day 8 u10: 94% of cells below 0; (29.5, 95.5) -3.99, bias -0.373 land 3567 m; (35.5, 73.5) -2.79, bias -0.192 land 3315 m; (35.5, 72.5) -2.51, bias -0.0233 land 3025 m
- day 8 v10: 94% of cells below 0; (36.5, 70.5) -2.04, bias -0.344 land 3087 m; (27.5, 96.5) -1.46, bias -0.0147 land 1479 m; (36.5, 71.5) -1.31, bias -0.254 land 3787 m
- day 8 msl: 96% of cells below 0; (37.5, 80.5) -0.43, bias -458 land 1461 m; (37.5, 82.5) -0.38, bias -479 land 1548 m; (6.5, 100.5) -0.37, bias -39.6 land 106 m
- day 8 tcwv: 95% of cells below 0; (35.5, 78.5) -1.45, bias -0.603 land 5170 m; (35.5, 79.5) -1.19, bias -0.0816 land 4987 m; (37.5, 73.5) -1.18, bias +1.4 land 4423 m
