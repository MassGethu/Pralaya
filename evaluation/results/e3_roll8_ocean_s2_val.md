## e3_roll8_ocean_s2 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.297 | +0.297 | 0.537 / 0.436 / 0.277 | +0.179 |
| 4 | +0.099 | +0.262 | 0.354 / 0.228 / 0.277 | +0.107 |
| 8 | -0.027 | +0.227 | 0.294 / 0.212 / 0.277 | +0.024 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.561 / 1.889 / 1.722  (SS best +0.094, vs pers +0.174)
- tp: 6.563 / 9.366 / 6.838  (SS best +0.040, vs pers +0.299)
- u10: 1.449 / 1.973 / 1.67  (SS best +0.133, vs pers +0.266)
- v10: 1.32 / 1.939 / 1.46  (SS best +0.096, vs pers +0.319)
- msl: 243.2 / 328.5 / 278.4  (SS best +0.127, vs pers +0.260)
- tcwv: 5.477 / 7.366 / 6.138  (SS best +0.108, vs pers +0.256)

Aggregate: SS per-window +0.0617 (proxy 15.4/30), CSI skill +0.0764 (proxy 11.5/15), anti-blur proxy 10.0/10 (in-band 88%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0099999904632568, 'tp': 0.5519999861717224, 'u10': 0.8410000205039978, 'v10': 0.8029999732971191, 'msl': 1.0230000019073486, 'tcwv': 0.8899999856948853}
Invalid windows: 0; CPU 10-step rollout median 39 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.8/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.85), propagates 98%, stable 97% (max 11.51 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.92), propagates 44%, stable 97% (max 8.33 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.062 [+0.046, +0.078], worst -0.227
- skill day 1: +0.241 [+0.225, +0.254], worst -0.263
- skill day 4: +0.024 [+0.008, +0.045], worst -0.572
- skill day 8: -0.080 [-0.107, -0.056], worst -0.741
- CSI skill per window: +0.076 [+0.057, +0.096], worst -0.299
- day-4 skill vs persistence: +0.226 [+0.204, +0.246], worst -0.361; windows beating persistence 97% [94%, 98%]
- day-8 in-band fraction: 0.88 [0.85, 0.90], worst 0.50
- causality proxy per window: 13.8 [13.6, 14.1], worst 11.2
- grader-like draw (5 random windows), forecast points /45: p05 5.3, median 26.7, p95 42.3
- warm_ocean: stable 97% [95%, 99%]; unstable by channel {'t2m': 0, 'tp': 9, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-06 11.51 std (tp), 2020-05-07 11.31 std (tp), 2020-05-13 6.99 std (tp)
- monsoon_stall: stable 97% [95%, 99%]; unstable by channel {'t2m': 0, 'tp': 9, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-31 8.33 std (tp), 2020-06-21 7.66 std (tp), 2020-06-22 7.07 std (tp)
- worst windows (per-window skill): 2020-05-06 -0.227, 2020-10-03 -0.222, 2020-04-27 -0.219, 2020-02-11 -0.173, 2020-02-10 -0.171
- worst windows (day-8 skill): 2020-10-28 -0.741, 2020-04-27 -0.672, 2020-10-03 -0.568, 2020-05-02 -0.483, 2020-05-05 -0.451

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.094 | +0.040 | +0.133 | +0.096 | +0.127 | +0.108 |
| all | 1152 | 8 | -0.082 | -0.015 | -0.010 | -0.013 | +0.001 | -0.042 |
| ocean (lsm<0.5) | 416 | 4 | -0.167 | +0.048 | +0.154 | +0.116 | +0.188 | +0.117 |
| ocean (lsm<0.5) | 416 | 8 | -0.450 | -0.013 | -0.002 | -0.006 | -0.015 | -0.051 |
| land below 1000 m | 391 | 4 | +0.067 | +0.032 | +0.093 | +0.049 | +0.176 | +0.115 |
| land below 1000 m | 391 | 8 | -0.114 | -0.020 | -0.023 | -0.039 | -0.010 | -0.024 |
| highlands >=2000 m | 287 | 4 | +0.147 | +0.015 | +0.041 | +0.009 | +0.094 | -0.102 |
| highlands >=2000 m | 287 | 8 | -0.011 | -0.018 | -0.045 | -0.032 | +0.014 | -0.192 |
| Bay of Bengal box | 144 | 4 | -0.258 | +0.054 | +0.159 | +0.135 | +0.222 | +0.135 |
| Bay of Bengal box | 144 | 8 | -0.528 | -0.012 | -0.020 | -0.000 | -0.007 | -0.040 |
| Arabian Sea box | 120 | 4 | -0.205 | +0.045 | +0.195 | +0.125 | +0.185 | +0.120 |
| Arabian Sea box | 120 | 8 | -0.506 | -0.021 | +0.020 | +0.003 | +0.004 | -0.085 |
| north of 28N | 360 | 4 | +0.129 | -0.006 | +0.031 | +0.003 | +0.094 | +0.008 |
| north of 28N | 360 | 8 | -0.029 | -0.011 | -0.045 | -0.033 | +0.011 | -0.043 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 52% of cells below 0; (14.5, 85.5) -1.01, bias -0.0999 sea 0 m; (15.5, 85.5) -0.90, bias -0.0849 sea 0 m; (13.5, 85.5) -0.79, bias -0.156 sea 0 m
- day 4 tp: 46% of cells below 0; (27.5, 74.5) -0.42, bias +0.14 land 336 m; (27.5, 73.5) -0.38, bias +0.11 land 275 m; (26.5, 74.5) -0.32, bias +0.166 land 372 m
- day 4 u10: 32% of cells below 0; (35.5, 72.5) -1.71, bias +0.0422 land 3025 m; (35.5, 73.5) -1.59, bias +0.0146 land 3315 m; (29.5, 95.5) -1.55, bias +0.0104 land 3567 m
- day 4 v10: 32% of cells below 0; (27.5, 96.5) -0.69, bias -0.0456 land 1479 m; (37.5, 70.5) -0.48, bias -0.0367 land 2435 m; (27.5, 85.5) -0.45, bias -0.0598 land 1642 m
- day 4 msl: 1% of cells below 0; (6.5, 100.5) -0.03, bias +11.4 land 106 m; (37.5, 71.5) -0.03, bias -46.6 land 3637 m; (6.5, 99.5) -0.02, bias +6.6 sea 27 m
- day 4 tcwv: 27% of cells below 0; (36.5, 91.5) -0.45, bias -0.0913 land 4486 m; (36.5, 77.5) -0.44, bias -0.313 land 4299 m; (36.5, 92.5) -0.41, bias +0.112 land 4008 m
- day 8 t2m: 85% of cells below 0; (14.5, 85.5) -1.25, bias -0.316 sea 0 m; (13.5, 85.5) -1.15, bias -0.392 sea 0 m; (15.5, 85.5) -1.10, bias -0.277 sea 0 m
- day 8 tp: 72% of cells below 0; (27.5, 73.5) -0.37, bias +0.266 land 275 m; (19.5, 67.5) -0.35, bias +0.31 sea 0 m; (16.5, 65.5) -0.34, bias -0.348 sea 0 m
- day 8 u10: 71% of cells below 0; (35.5, 72.5) -2.70, bias +0.0793 land 3025 m; (29.5, 95.5) -2.50, bias +0.104 land 3567 m; (35.5, 73.5) -1.96, bias +0.0391 land 3315 m
- day 8 v10: 74% of cells below 0; (25.5, 98.5) -0.98, bias -0.069 land 1723 m; (27.5, 98.5) -0.85, bias -0.133 land 2634 m; (27.5, 96.5) -0.78, bias -0.0021 land 1479 m
- day 8 msl: 52% of cells below 0; (7.5, 79.5) -0.24, bias +3.6 sea 45 m; (7.5, 78.5) -0.22, bias -23.3 sea 4 m; (9.5, 100.5) -0.21, bias -54.8 sea 15 m
- day 8 tcwv: 73% of cells below 0; (35.5, 84.5) -0.65, bias +0.418 land 5022 m; (36.5, 77.5) -0.64, bias -0.33 land 4299 m; (36.5, 91.5) -0.64, bias -0.465 land 4486 m
