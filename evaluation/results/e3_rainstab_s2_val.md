## e3_rainstab_s2 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.295 | +0.295 | 0.536 / 0.436 / 0.277 | +0.178 |
| 4 | +0.106 | +0.268 | 0.357 / 0.228 / 0.277 | +0.111 |
| 8 | -0.022 | +0.231 | 0.289 / 0.212 / 0.277 | +0.016 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.54 / 1.889 / 1.722  (SS best +0.106, vs pers +0.185)
- tp: 6.498 / 9.366 / 6.838  (SS best +0.050, vs pers +0.306)
- u10: 1.44 / 1.973 / 1.67  (SS best +0.138, vs pers +0.270)
- v10: 1.312 / 1.939 / 1.46  (SS best +0.101, vs pers +0.323)
- msl: 243.5 / 328.5 / 278.4  (SS best +0.126, vs pers +0.259)
- tcwv: 5.417 / 7.366 / 6.138  (SS best +0.117, vs pers +0.265)

Aggregate: SS per-window +0.0673 (proxy 16.8/30), CSI skill +0.0765 (proxy 11.5/15), anti-blur proxy 10.0/10 (in-band 87%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 0.9959999918937683, 'tp': 0.5680000185966492, 'u10': 0.8410000205039978, 'v10': 0.8080000281333923, 'msl': 0.8980000019073486, 'tcwv': 0.8650000095367432}
Invalid windows: 0; CPU 10-step rollout median 25 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.9/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.87), propagates 96%, stable 99% (max 7.59 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.92), propagates 50%, stable 98% (max 6.13 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.067 [+0.052, +0.082], worst -0.215
- skill day 1: +0.239 [+0.223, +0.251], worst -0.307
- skill day 4: +0.033 [+0.016, +0.052], worst -0.656
- skill day 8: -0.069 [-0.095, -0.047], worst -0.591
- CSI skill per window: +0.077 [+0.056, +0.098], worst -0.339
- day-4 skill vs persistence: +0.233 [+0.212, +0.252], worst -0.235; windows beating persistence 97% [94%, 99%]
- day-8 in-band fraction: 0.87 [0.85, 0.89], worst 0.33
- causality proxy per window: 13.9 [13.7, 14.2], worst 11.2
- grader-like draw (5 random windows), forecast points /45: p05 5.9, median 27.8, p95 43.7
- warm_ocean: stable 99% [97%, 100%]; unstable by channel {'t2m': 0, 'tp': 4, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-06 7.59 std (tp), 2020-05-07 7.01 std (tp), 2020-10-10 5.64 std (tp)
- monsoon_stall: stable 98% [96%, 99%]; unstable by channel {'t2m': 0, 'tp': 7, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-08-06 6.13 std (tp), 2020-05-31 6.07 std (tp), 2020-06-22 6.05 std (tp)
- worst windows (per-window skill): 2020-10-03 -0.215, 2020-02-10 -0.212, 2020-02-11 -0.212, 2020-04-27 -0.185, 2020-05-02 -0.169
- worst windows (day-8 skill): 2020-05-02 -0.591, 2020-10-03 -0.572, 2020-04-27 -0.524, 2020-10-28 -0.510, 2020-04-30 -0.503

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.106 | +0.050 | +0.138 | +0.101 | +0.126 | +0.118 |
| all | 1152 | 8 | -0.062 | -0.016 | -0.010 | -0.015 | +0.003 | -0.033 |
| ocean (lsm<0.5) | 416 | 4 | -0.138 | +0.059 | +0.161 | +0.124 | +0.189 | +0.128 |
| ocean (lsm<0.5) | 416 | 8 | -0.410 | -0.013 | -0.005 | -0.011 | -0.013 | -0.031 |
| land below 1000 m | 391 | 4 | +0.088 | +0.043 | +0.095 | +0.046 | +0.192 | +0.122 |
| land below 1000 m | 391 | 8 | -0.085 | -0.024 | -0.020 | -0.035 | +0.005 | -0.026 |
| highlands >=2000 m | 287 | 4 | +0.152 | +0.011 | +0.043 | +0.015 | +0.086 | -0.094 |
| highlands >=2000 m | 287 | 8 | +0.001 | -0.011 | -0.027 | -0.007 | +0.011 | -0.195 |
| Bay of Bengal box | 144 | 4 | -0.218 | +0.062 | +0.175 | +0.150 | +0.229 | +0.139 |
| Bay of Bengal box | 144 | 8 | -0.491 | -0.035 | -0.036 | -0.014 | -0.013 | -0.055 |
| Arabian Sea box | 120 | 4 | -0.168 | +0.063 | +0.192 | +0.120 | +0.178 | +0.138 |
| Arabian Sea box | 120 | 8 | -0.432 | +0.017 | +0.039 | +0.013 | +0.012 | -0.044 |
| north of 28N | 360 | 4 | +0.137 | -0.021 | +0.033 | +0.007 | +0.087 | +0.027 |
| north of 28N | 360 | 8 | -0.015 | -0.003 | -0.030 | -0.015 | +0.010 | -0.043 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 49% of cells below 0; (14.5, 85.5) -0.93, bias +0.0104 sea 0 m; (15.5, 85.5) -0.80, bias +0.0057 sea 0 m; (12.5, 85.5) -0.74, bias -0.0261 sea 0 m
- day 4 tp: 42% of cells below 0; (37.5, 82.5) -0.42, bias +0.0932 land 1548 m; (37.5, 83.5) -0.34, bias +0.0877 land 1833 m; (37.5, 81.5) -0.30, bias +0.069 land 1419 m
- day 4 u10: 31% of cells below 0; (29.5, 95.5) -1.52, bias -0.0163 land 3567 m; (35.5, 72.5) -1.42, bias +0.0113 land 3025 m; (35.5, 73.5) -1.39, bias -0.0006 land 3315 m
- day 4 v10: 32% of cells below 0; (27.5, 96.5) -0.82, bias -0.057 land 1479 m; (23.5, 97.5) -0.52, bias +0.203 land 880 m; (6.5, 100.5) -0.49, bias -0.185 land 106 m
- day 4 msl: 4% of cells below 0; (6.5, 96.5) -0.11, bias +49.3 sea 2 m; (6.5, 100.5) -0.09, bias +37.3 land 106 m; (6.5, 94.5) -0.09, bias +34.2 sea 4 m
- day 4 tcwv: 26% of cells below 0; (35.5, 78.5) -0.51, bias +0.317 land 5170 m; (35.5, 79.5) -0.51, bias +0.393 land 4987 m; (37.5, 95.5) -0.45, bias +1.24 land 3361 m
- day 8 t2m: 83% of cells below 0; (14.5, 85.5) -1.17, bias -0.153 sea 0 m; (13.5, 85.5) -1.14, bias -0.214 sea 0 m; (12.5, 85.5) -1.11, bias -0.2 sea 0 m
- day 8 tp: 71% of cells below 0; (37.5, 82.5) -0.95, bias +0.341 land 1548 m; (37.5, 83.5) -0.75, bias +0.292 land 1833 m; (37.5, 81.5) -0.72, bias +0.248 land 1419 m
- day 8 u10: 70% of cells below 0; (29.5, 95.5) -2.27, bias +0.0202 land 3567 m; (35.5, 72.5) -2.04, bias +0.0074 land 3025 m; (26.5, 97.5) -2.02, bias +0.286 land 1110 m
- day 8 v10: 73% of cells below 0; (27.5, 96.5) -0.83, bias -0.0698 land 1479 m; (6.5, 100.5) -0.65, bias -0.325 land 106 m; (27.5, 97.5) -0.65, bias -0.0607 land 2097 m
- day 8 msl: 49% of cells below 0; (7.5, 79.5) -0.31, bias +31 sea 45 m; (7.5, 78.5) -0.24, bias +3.9 sea 4 m; (6.5, 78.5) -0.24, bias +36.5 sea 0 m
- day 8 tcwv: 71% of cells below 0; (35.5, 84.5) -0.81, bias +0.73 land 5022 m; (36.5, 85.5) -0.78, bias +0.345 land 4598 m; (36.5, 77.5) -0.73, bias +0.294 land 4299 m
