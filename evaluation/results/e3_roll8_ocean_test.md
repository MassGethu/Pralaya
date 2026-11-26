## e3_roll8_ocean on test (353 windows, init 2021-01-03..2021-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.290 | +0.290 | 0.527 / 0.426 / 0.260 | +0.176 |
| 4 | +0.093 | +0.262 | 0.330 / 0.209 / 0.261 | +0.094 |
| 8 | -0.015 | +0.246 | 0.290 / 0.196 / 0.262 | +0.039 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.599 / 1.934 / 1.779  (SS best +0.101, vs pers +0.173)
- tp: 6.675 / 9.249 / 6.788  (SS best +0.017, vs pers +0.278)
- u10: 1.493 / 2.073 / 1.672  (SS best +0.107, vs pers +0.280)
- v10: 1.356 / 1.956 / 1.464  (SS best +0.074, vs pers +0.307)
- msl: 261.4 / 353.6 / 284.9  (SS best +0.083, vs pers +0.261)
- tcwv: 5.505 / 7.559 / 6.701  (SS best +0.178, vs pers +0.272)

Aggregate: SS per-window +0.0590 (proxy 14.8/30), CSI skill +0.0816 (proxy 12.2/15), anti-blur proxy 10.0/10 (in-band 89%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0089999437332153, 'tp': 0.8429999947547913, 'u10': 0.7639999985694885, 'v10': 0.8690000176429749, 'msl': 0.9369999766349792, 'tcwv': 0.9599999785423279}
Invalid windows: 0; CPU 10-step rollout median 40 ms
Shocks (353 windows): null exact=True ok=True; causality proxy 13.9/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.74), propagates 95%, stable 90% (max 11.66 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.91), propagates 61%, stable 97% (max 9.68 std), far frac max 0.001

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.059 [+0.048, +0.071], worst -0.127
- skill day 1: +0.233 [+0.220, +0.248], worst -0.096
- skill day 4: +0.018 [+0.001, +0.034], worst -0.355
- skill day 8: -0.074 [-0.093, -0.055], worst -0.494
- CSI skill per window: +0.082 [+0.065, +0.102], worst -0.333
- day-4 skill vs persistence: +0.232 [+0.214, +0.254], worst -0.243; windows beating persistence 96% [93%, 98%]
- day-8 in-band fraction: 0.89 [0.86, 0.91], worst 0.50
- causality proxy per window: 13.9 [13.7, 14.1], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 10.0, median 26.1, p95 39.7
- warm_ocean: stable 90% [85%, 94%]; unstable by channel {'t2m': 0, 'tp': 37, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-05-15 11.66 std (tp), 2021-05-19 10.15 std (tp), 2021-06-11 8.39 std (tp)
- monsoon_stall: stable 97% [95%, 99%]; unstable by channel {'t2m': 0, 'tp': 10, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-05-28 9.68 std (tp), 2021-05-13 9.39 std (tp), 2021-10-05 7.81 std (tp)
- worst windows (per-window skill): 2021-09-17 -0.127, 2021-05-12 -0.112, 2021-10-16 -0.109, 2021-03-16 -0.105, 2021-07-27 -0.105
- worst windows (day-8 skill): 2021-05-12 -0.494, 2021-05-19 -0.429, 2021-06-26 -0.428, 2021-06-02 -0.424, 2021-05-13 -0.397

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.101 | +0.017 | +0.107 | +0.074 | +0.083 | +0.179 |
| all | 1152 | 8 | -0.038 | -0.021 | -0.002 | -0.036 | -0.007 | +0.016 |
| ocean (lsm<0.5) | 416 | 4 | -0.216 | +0.028 | +0.124 | +0.098 | +0.190 | +0.191 |
| ocean (lsm<0.5) | 416 | 8 | -0.469 | -0.011 | +0.004 | -0.030 | +0.035 | +0.024 |
| land below 1000 m | 391 | 4 | +0.053 | +0.008 | +0.094 | +0.018 | +0.125 | +0.185 |
| land below 1000 m | 391 | 8 | -0.079 | -0.036 | -0.009 | -0.062 | +0.004 | +0.024 |
| highlands >=2000 m | 287 | 4 | +0.164 | -0.029 | -0.003 | -0.016 | +0.043 | -0.069 |
| highlands >=2000 m | 287 | 8 | +0.023 | -0.036 | -0.033 | -0.035 | -0.018 | -0.229 |
| Bay of Bengal box | 144 | 4 | -0.184 | +0.044 | +0.116 | +0.097 | +0.184 | +0.153 |
| Bay of Bengal box | 144 | 8 | -0.449 | -0.029 | -0.056 | -0.079 | +0.004 | -0.020 |
| Arabian Sea box | 120 | 4 | -0.155 | +0.015 | +0.134 | +0.129 | +0.249 | +0.244 |
| Arabian Sea box | 120 | 8 | -0.401 | +0.031 | +0.073 | +0.039 | +0.134 | +0.074 |
| north of 28N | 360 | 4 | +0.141 | -0.011 | +0.008 | -0.011 | +0.044 | +0.110 |
| north of 28N | 360 | 8 | +0.017 | -0.027 | -0.025 | -0.034 | -0.020 | -0.050 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 52% of cells below 0; (6.5, 80.5) -0.48, bias +0.158 land 172 m; (6.5, 73.5) -0.45, bias +0.103 sea 0 m; (6.5, 100.5) -0.45, bias +0.0941 land 106 m
- day 4 tp: 45% of cells below 0; (17.5, 65.5) -3.37, bias +0.369 sea 0 m; (17.5, 66.5) -2.33, bias +0.38 sea 0 m; (18.5, 66.5) -2.31, bias +0.418 sea 0 m
- day 4 u10: 33% of cells below 0; (29.5, 95.5) -1.23, bias -0.0633 land 3567 m; (25.5, 96.5) -1.09, bias -0.0099 land 432 m; (35.5, 72.5) -1.05, bias +0.0913 land 3025 m
- day 4 v10: 44% of cells below 0; (27.5, 96.5) -0.68, bias -0.0441 land 1479 m; (27.5, 86.5) -0.61, bias -0.0085 land 2434 m; (27.5, 85.5) -0.52, bias -0.0026 land 1642 m
- day 4 msl: 6% of cells below 0; (24.5, 100.5) -0.09, bias -42.2 land 1798 m; (25.5, 100.5) -0.07, bias -21.7 land 2081 m; (37.5, 100.5) -0.07, bias -92.4 land 3449 m
- day 4 tcwv: 24% of cells below 0; (37.5, 72.5) -0.47, bias +0.738 land 4245 m; (35.5, 78.5) -0.43, bias -0.236 land 5170 m; (35.5, 83.5) -0.43, bias -0.324 land 5005 m
- day 8 t2m: 82% of cells below 0; (7.5, 77.5) -1.07, bias +0.395 sea 11 m; (7.5, 79.5) -0.93, bias +0.351 sea 45 m; (10.5, 75.5) -0.90, bias +0.39 sea 46 m
- day 8 tp: 67% of cells below 0; (28.5, 65.5) -0.51, bias +0.149 land 1204 m; (17.5, 65.5) -0.34, bias -0.0368 sea 0 m; (25.5, 94.5) -0.34, bias +2.44 land 896 m
- day 8 u10: 66% of cells below 0; (29.5, 95.5) -2.16, bias -0.102 land 3567 m; (35.5, 72.5) -1.97, bias +0.152 land 3025 m; (25.5, 96.5) -1.82, bias -0.0431 land 432 m
- day 8 v10: 87% of cells below 0; (27.5, 96.5) -1.06, bias -0.0982 land 1479 m; (27.5, 97.5) -0.85, bias -0.0425 land 2097 m; (26.5, 98.5) -0.82, bias +0.0728 land 1975 m
- day 8 msl: 55% of cells below 0; (6.5, 100.5) -0.22, bias -53 land 106 m; (9.5, 100.5) -0.21, bias -19.1 sea 15 m; (8.5, 100.5) -0.20, bias -31.4 sea 30 m
- day 8 tcwv: 60% of cells below 0; (37.5, 72.5) -0.94, bias +1.28 land 4245 m; (37.5, 73.5) -0.78, bias +0.92 land 4423 m; (35.5, 78.5) -0.78, bias -0.41 land 5170 m
