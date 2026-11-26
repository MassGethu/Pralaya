## b1_onestep_s1 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.313 | +0.313 | 0.540 / 0.436 / 0.277 | +0.185 |
| 4 | +0.055 | +0.227 | 0.336 / 0.228 / 0.277 | +0.082 |
| 8 | -0.142 | +0.141 | 0.286 / 0.212 / 0.277 | +0.012 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.64 / 1.889 / 1.722  (SS best +0.048, vs pers +0.132)
- tp: 7.032 / 9.366 / 6.838  (SS best -0.028, vs pers +0.249)
- u10: 1.518 / 1.973 / 1.67  (SS best +0.091, vs pers +0.231)
- v10: 1.39 / 1.939 / 1.46  (SS best +0.048, vs pers +0.283)
- msl: 249.1 / 328.5 / 278.4  (SS best +0.105, vs pers +0.242)
- tcwv: 5.721 / 7.366 / 6.138  (SS best +0.068, vs pers +0.223)

Aggregate: SS per-window -0.0042 (proxy 0.0/30), CSI skill +0.0647 (proxy 9.7/15), anti-blur proxy 10.0/10 (in-band 92%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.055999994277954, 'tp': 1.6030000448226929, 'u10': 0.9779999852180481, 'v10': 0.9399999976158142, 'msl': 1.1490000486373901, 'tcwv': 1.003999948501587}
Invalid windows: 0; CPU 10-step rollout median 115 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.4/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.71), propagates 96%, stable 67% (max 18.22 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.92), propagates 75%, stable 77% (max 21.24 std), far frac max 0.001

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: -0.004 [-0.024, +0.013], worst -0.408
- skill day 1: +0.256 [+0.240, +0.269], worst -0.250
- skill day 4: -0.033 [-0.054, -0.011], worst -0.858
- skill day 8: -0.236 [-0.269, -0.204], worst -1.372
- CSI skill per window: +0.065 [+0.044, +0.084], worst -0.282
- day-4 skill vs persistence: +0.184 [+0.159, +0.205], worst -0.280; windows beating persistence 91% [85%, 95%]
- day-8 in-band fraction: 0.92 [0.90, 0.94], worst 0.50
- causality proxy per window: 13.4 [13.1, 13.7], worst 7.5
- grader-like draw (5 random windows), forecast points /45: p05 0.0, median 11.9, p95 28.7
- warm_ocean: stable 67% [57%, 75%]; unstable by channel {'t2m': 0, 'tp': 116, 'u10': 0, 'v10': 1, 'msl': 0, 'tcwv': 0}; worst 2020-04-29 18.22 std (tp), 2020-10-07 14.97 std (tp), 2020-09-29 13.12 std (tp)
- monsoon_stall: stable 77% [66%, 86%]; unstable by channel {'t2m': 0, 'tp': 82, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-28 21.24 std (tp), 2020-06-12 16.72 std (tp), 2020-07-23 16.24 std (tp)
- worst windows (per-window skill): 2020-02-10 -0.408, 2020-10-28 -0.403, 2020-02-11 -0.392, 2020-10-03 -0.304, 2020-04-29 -0.293
- worst windows (day-8 skill): 2020-10-28 -1.372, 2020-10-29 -0.956, 2020-01-22 -0.874, 2020-04-29 -0.813, 2020-03-01 -0.795

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.048 | -0.028 | +0.091 | +0.048 | +0.105 | +0.068 |
| all | 1152 | 8 | -0.235 | -0.170 | -0.101 | -0.101 | -0.041 | -0.203 |
| ocean (lsm<0.5) | 416 | 4 | -0.262 | -0.013 | +0.114 | +0.071 | +0.161 | +0.076 |
| ocean (lsm<0.5) | 416 | 8 | -0.674 | -0.172 | -0.092 | -0.085 | -0.069 | -0.204 |
| land below 1000 m | 391 | 4 | +0.024 | -0.044 | +0.050 | -0.017 | +0.163 | +0.075 |
| land below 1000 m | 391 | 8 | -0.253 | -0.167 | -0.128 | -0.168 | -0.027 | -0.199 |
| highlands >=2000 m | 287 | 4 | +0.106 | -0.080 | -0.017 | -0.034 | +0.072 | -0.114 |
| highlands >=2000 m | 287 | 8 | -0.164 | -0.154 | -0.123 | -0.127 | -0.032 | -0.312 |
| Bay of Bengal box | 144 | 4 | -0.335 | -0.024 | +0.130 | +0.080 | +0.216 | +0.066 |
| Bay of Bengal box | 144 | 8 | -0.688 | -0.216 | -0.107 | -0.086 | -0.036 | -0.278 |
| Arabian Sea box | 120 | 4 | -0.266 | +0.005 | +0.131 | +0.090 | +0.136 | +0.103 |
| Arabian Sea box | 120 | 8 | -0.695 | -0.125 | -0.071 | -0.041 | -0.065 | -0.154 |
| north of 28N | 360 | 4 | +0.084 | -0.105 | -0.025 | -0.041 | +0.070 | -0.025 |
| north of 28N | 360 | 8 | -0.182 | -0.181 | -0.127 | -0.130 | -0.035 | -0.204 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 63% of cells below 0; (13.5, 85.5) -0.89, bias +0.188 sea 0 m; (12.5, 85.5) -0.80, bias +0.185 sea 0 m; (13.5, 86.5) -0.79, bias +0.141 sea 0 m
- day 4 tp: 77% of cells below 0; (37.5, 92.5) -0.85, bias +0.0889 land 3124 m; (37.5, 95.5) -0.84, bias +0.145 land 3361 m; (37.5, 94.5) -0.83, bias +0.0383 land 2966 m
- day 4 u10: 43% of cells below 0; (35.5, 73.5) -1.81, bias -0.0438 land 3315 m; (35.5, 72.5) -1.75, bias -0.159 land 3025 m; (26.5, 97.5) -1.35, bias +0.0464 land 1110 m
- day 4 v10: 56% of cells below 0; (27.5, 96.5) -1.06, bias -0.129 land 1479 m; (25.5, 94.5) -0.82, bias -0.0683 land 896 m; (37.5, 71.5) -0.81, bias -0.0749 land 3637 m
- day 4 msl: 10% of cells below 0; (6.5, 100.5) -0.21, bias -42.6 land 106 m; (6.5, 99.5) -0.17, bias -36.5 sea 27 m; (6.5, 95.5) -0.15, bias +10.9 sea 5 m
- day 4 tcwv: 34% of cells below 0; (35.5, 79.5) -0.62, bias +0.185 land 4987 m; (35.5, 81.5) -0.62, bias +0.59 land 4809 m; (35.5, 80.5) -0.60, bias +0.395 land 4787 m
- day 8 t2m: 97% of cells below 0; (13.5, 85.5) -1.41, bias +0.414 sea 0 m; (7.5, 77.5) -1.40, bias +0.785 sea 11 m; (9.5, 75.5) -1.37, bias +0.507 sea 4 m
- day 8 tp: 97% of cells below 0; (37.5, 93.5) -2.64, bias +0.406 land 2858 m; (37.5, 92.5) -2.31, bias +0.747 land 3124 m; (37.5, 94.5) -1.97, bias +0.28 land 2966 m
- day 8 u10: 90% of cells below 0; (35.5, 72.5) -3.67, bias -0.328 land 3025 m; (35.5, 73.5) -2.82, bias -0.0945 land 3315 m; (25.5, 96.5) -2.17, bias +0.291 land 432 m
- day 8 v10: 96% of cells below 0; (27.5, 96.5) -2.28, bias -0.258 land 1479 m; (27.5, 97.5) -2.10, bias -0.391 land 2097 m; (37.5, 71.5) -1.64, bias -0.112 land 3637 m
- day 8 msl: 79% of cells below 0; (6.5, 100.5) -0.50, bias -64.6 land 106 m; (6.5, 99.5) -0.44, bias -53.7 sea 27 m; (7.5, 100.5) -0.38, bias -63 sea 45 m
- day 8 tcwv: 96% of cells below 0; (35.5, 81.5) -1.20, bias +1.48 land 4809 m; (35.5, 82.5) -1.14, bias +1.51 land 4950 m; (37.5, 72.5) -1.09, bias +0.848 land 4245 m
