## e3_rainstab on test (353 windows, init 2021-01-03..2021-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.293 | +0.293 | 0.530 / 0.426 / 0.260 | +0.181 |
| 4 | +0.107 | +0.273 | 0.329 / 0.209 / 0.261 | +0.092 |
| 8 | +0.033 | +0.282 | 0.282 / 0.196 / 0.262 | +0.028 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.557 / 1.934 / 1.779  (SS best +0.125, vs pers +0.195)
- tp: 6.521 / 9.249 / 6.788  (SS best +0.039, vs pers +0.295)
- u10: 1.48 / 2.073 / 1.672  (SS best +0.115, vs pers +0.286)
- v10: 1.331 / 1.956 / 1.464  (SS best +0.091, vs pers +0.320)
- msl: 259 / 353.6 / 284.9  (SS best +0.091, vs pers +0.268)
- tcwv: 5.476 / 7.559 / 6.701  (SS best +0.183, vs pers +0.276)

Aggregate: SS per-window +0.0878 (proxy 21.9/30), CSI skill +0.0762 (proxy 11.4/15), anti-blur proxy 10.0/10 (in-band 83%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.013, 'tp': 0.591, 'u10': 0.705, 'v10': 0.767, 'msl': 0.884, 'tcwv': 0.902}
Invalid windows: 0; CPU 10-step rollout median 55 ms
Shocks (353 windows): null exact=True ok=True; causality proxy 14.1/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.75), propagates 97%, stable 97% (max 8.30 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.92), propagates 61%, stable 98% (max 6.45 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.088 [+0.080, +0.096], worst -0.070
- skill day 1: +0.239 [+0.227, +0.253], worst -0.066
- skill day 4: +0.036 [+0.020, +0.052], worst -0.255
- skill day 8: -0.012 [-0.022, -0.002], worst -0.273
- CSI skill per window: +0.076 [+0.059, +0.095], worst -0.290
- day-4 skill vs persistence: +0.249 [+0.232, +0.268], worst -0.150; windows beating persistence 98% [96%, 99%]
- day-8 in-band fraction: 0.83 [0.80, 0.87], worst 0.33
- causality proxy per window: 14.1 [13.9, 14.4], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 18.7, median 32.3, p95 43.5
- warm_ocean: stable 97% [94%, 99%]; unstable by channel {'t2m': 0, 'tp': 12, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-06-05 8.3 std (tp), 2021-11-05 8.26 std (tp), 2021-05-22 7.96 std (tp)
- monsoon_stall: stable 98% [96%, 99%]; unstable by channel {'t2m': 0, 'tp': 7, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-05-14 6.45 std (tp), 2021-09-10 6.43 std (tp), 2021-05-13 6.35 std (tp)
- worst windows (per-window skill): 2021-03-16 -0.070, 2021-06-23 -0.041, 2021-03-15 -0.035, 2021-10-16 -0.026, 2021-03-11 -0.023
- worst windows (day-8 skill): 2021-06-26 -0.273, 2021-06-02 -0.233, 2021-06-03 -0.211, 2021-06-29 -0.194, 2021-03-16 -0.186

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.125 | +0.039 | +0.115 | +0.091 | +0.091 | +0.183 |
| all | 1152 | 8 | +0.050 | +0.021 | +0.028 | +0.024 | +0.019 | +0.056 |
| ocean (lsm<0.5) | 416 | 4 | +0.006 | +0.043 | +0.132 | +0.116 | +0.193 | +0.194 |
| ocean (lsm<0.5) | 416 | 8 | -0.017 | +0.021 | +0.031 | +0.030 | +0.065 | +0.063 |
| land below 1000 m | 391 | 4 | +0.074 | +0.042 | +0.099 | +0.036 | +0.133 | +0.187 |
| land below 1000 m | 391 | 8 | +0.040 | +0.021 | +0.025 | +0.010 | +0.033 | +0.055 |
| highlands >=2000 m | 287 | 4 | +0.172 | +0.001 | +0.011 | -0.005 | +0.054 | -0.029 |
| highlands >=2000 m | 287 | 8 | +0.061 | +0.014 | +0.008 | +0.002 | +0.005 | -0.023 |
| Bay of Bengal box | 144 | 4 | +0.031 | +0.056 | +0.127 | +0.119 | +0.184 | +0.155 |
| Bay of Bengal box | 144 | 8 | -0.015 | +0.026 | +0.000 | +0.015 | +0.038 | +0.040 |
| Arabian Sea box | 120 | 4 | +0.030 | +0.044 | +0.149 | +0.143 | +0.244 | +0.249 |
| Arabian Sea box | 120 | 8 | +0.010 | +0.040 | +0.074 | +0.062 | +0.127 | +0.099 |
| north of 28N | 360 | 4 | +0.148 | -0.001 | +0.018 | -0.002 | +0.053 | +0.121 |
| north of 28N | 360 | 8 | +0.058 | +0.015 | +0.010 | +0.003 | +0.004 | +0.035 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 33% of cells below 0; (6.5, 80.5) -0.26, bias +0.0547 land 172 m; (6.5, 100.5) -0.23, bias +0.0617 land 106 m; (7.5, 80.5) -0.21, bias +0.0733 land 195 m
- day 4 tp: 34% of cells below 0; (17.5, 65.5) -2.24, bias +0.353 sea 0 m; (28.5, 65.5) -2.08, bias +0.196 land 1204 m; (29.5, 65.5) -1.84, bias +0.136 land 1166 m
- day 4 u10: 26% of cells below 0; (29.5, 95.5) -0.94, bias -0.0761 land 3567 m; (25.5, 96.5) -0.71, bias -0.012 land 432 m; (35.5, 72.5) -0.66, bias +0.0613 land 3025 m
- day 4 v10: 37% of cells below 0; (27.5, 96.5) -0.49, bias -0.0481 land 1479 m; (27.5, 86.5) -0.41, bias -0.0272 land 2434 m; (37.5, 71.5) -0.35, bias +0.0382 land 3637 m
- day 4 msl: 3% of cells below 0; (37.5, 100.5) -0.05, bias -80.2 land 3449 m; (24.5, 100.5) -0.04, bias -41 land 1798 m; (25.5, 100.5) -0.04, bias -23.1 land 2081 m
- day 4 tcwv: 21% of cells below 0; (35.5, 82.5) -0.31, bias +0.0439 land 4950 m; (35.5, 83.5) -0.30, bias -0.156 land 5005 m; (36.5, 86.5) -0.29, bias +0.435 land 4842 m
- day 8 t2m: 38% of cells below 0; (6.5, 100.5) -0.15, bias +0.0707 land 106 m; (8.5, 80.5) -0.13, bias +0.174 land 54 m; (19.5, 88.5) -0.13, bias -0.0676 sea 0 m
- day 8 tp: 23% of cells below 0; (28.5, 65.5) -0.22, bias +0.208 land 1204 m; (31.5, 67.5) -0.05, bias +0.469 land 2021 m; (37.5, 92.5) -0.05, bias -0.0756 land 3124 m
- day 8 u10: 33% of cells below 0; (29.5, 95.5) -0.58, bias -0.0792 land 3567 m; (25.5, 96.5) -0.38, bias -0.0225 land 432 m; (25.5, 95.5) -0.33, bias +0.0077 land 673 m
- day 8 v10: 39% of cells below 0; (27.5, 96.5) -0.23, bias -0.0542 land 1479 m; (28.5, 95.5) -0.17, bias -0.0321 land 1944 m; (27.5, 97.5) -0.16, bias -0.0653 land 2097 m
- day 8 msl: 26% of cells below 0; (6.5, 100.5) -0.10, bias -40.2 land 106 m; (8.5, 99.5) -0.07, bias -32.5 land 76 m; (10.5, 98.5) -0.07, bias -45.8 sea 56 m
- day 8 tcwv: 23% of cells below 0; (35.5, 77.5) -0.18, bias -0.186 land 5116 m; (37.5, 71.5) -0.18, bias +0.613 land 3637 m; (35.5, 78.5) -0.17, bias -0.146 land 5170 m
