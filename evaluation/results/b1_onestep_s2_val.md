## b1_onestep_s2 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.296 | +0.296 | 0.540 / 0.436 / 0.277 | +0.186 |
| 4 | +0.046 | +0.218 | 0.341 / 0.228 / 0.277 | +0.089 |
| 8 | -0.157 | +0.130 | 0.270 / 0.212 / 0.277 | -0.010 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.701 / 1.889 / 1.722  (SS best +0.012, vs pers +0.099)
- tp: 6.973 / 9.366 / 6.838  (SS best -0.020, vs pers +0.256)
- u10: 1.511 / 1.973 / 1.67  (SS best +0.095, vs pers +0.234)
- v10: 1.377 / 1.939 / 1.46  (SS best +0.057, vs pers +0.290)
- msl: 261.6 / 328.5 / 278.4  (SS best +0.060, vs pers +0.204)
- tcwv: 5.718 / 7.366 / 6.138  (SS best +0.068, vs pers +0.224)

Aggregate: SS per-window -0.0141 (proxy 0.0/30), CSI skill +0.0566 (proxy 8.5/15), anti-blur proxy 10.0/10 (in-band 89%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0099999904632568, 'tp': 1.1480000019073486, 'u10': 0.7519999742507935, 'v10': 0.9110000133514404, 'msl': 1.0269999504089355, 'tcwv': 1.0080000162124634}
Invalid windows: 0; CPU 10-step rollout median 111 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.8/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.90), propagates 97%, stable 88% (max 14.82 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.94), propagates 56%, stable 92% (max 16.96 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: -0.014 [-0.031, +0.003], worst -0.444
- skill day 1: +0.241 [+0.227, +0.254], worst -0.273
- skill day 4: -0.045 [-0.067, -0.019], worst -0.839
- skill day 8: -0.239 [-0.272, -0.209], worst -1.489
- CSI skill per window: +0.057 [+0.037, +0.073], worst -0.362
- day-4 skill vs persistence: +0.178 [+0.160, +0.195], worst -0.314; windows beating persistence 92% [88%, 95%]
- day-8 in-band fraction: 0.89 [0.87, 0.91], worst 0.33
- causality proxy per window: 13.8 [13.5, 14.0], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 0.0, median 9.8, p95 23.5
- warm_ocean: stable 88% [80%, 94%]; unstable by channel {'t2m': 0, 'tp': 42, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-04-27 14.82 std (tp), 2020-04-28 14.38 std (tp), 2020-04-29 13.35 std (tp)
- monsoon_stall: stable 92% [86%, 96%]; unstable by channel {'t2m': 0, 'tp': 29, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-05-31 16.96 std (tp), 2020-06-01 11.63 std (tp), 2020-09-20 9.21 std (tp)
- worst windows (per-window skill): 2020-10-28 -0.444, 2020-02-10 -0.359, 2020-06-01 -0.323, 2020-02-11 -0.280, 2020-04-27 -0.244
- worst windows (day-8 skill): 2020-10-28 -1.489, 2020-04-27 -0.796, 2020-01-23 -0.784, 2020-06-01 -0.768, 2020-09-20 -0.684

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.012 | -0.020 | +0.095 | +0.057 | +0.060 | +0.068 |
| all | 1152 | 8 | -0.295 | -0.148 | -0.115 | -0.135 | -0.117 | -0.133 |
| ocean (lsm<0.5) | 416 | 4 | -0.442 | +0.014 | +0.125 | +0.090 | +0.114 | +0.082 |
| ocean (lsm<0.5) | 416 | 8 | -0.972 | -0.087 | -0.101 | -0.119 | -0.190 | -0.121 |
| land below 1000 m | 391 | 4 | +0.006 | -0.053 | +0.047 | -0.038 | +0.117 | +0.083 |
| land below 1000 m | 391 | 8 | -0.332 | -0.192 | -0.132 | -0.206 | -0.111 | -0.098 |
| highlands >=2000 m | 287 | 4 | +0.078 | -0.140 | -0.044 | -0.047 | +0.027 | -0.221 |
| highlands >=2000 m | 287 | 8 | -0.163 | -0.403 | -0.196 | -0.141 | -0.091 | -0.566 |
| Bay of Bengal box | 144 | 4 | -0.602 | +0.072 | +0.172 | +0.148 | +0.185 | +0.067 |
| Bay of Bengal box | 144 | 8 | -1.009 | -0.099 | -0.060 | -0.094 | -0.099 | -0.143 |
| Arabian Sea box | 120 | 4 | -0.410 | -0.017 | +0.091 | +0.060 | +0.054 | +0.125 |
| Arabian Sea box | 120 | 8 | -1.007 | -0.067 | -0.180 | -0.127 | -0.339 | -0.074 |
| north of 28N | 360 | 4 | +0.060 | -0.163 | -0.037 | -0.057 | +0.028 | -0.100 |
| north of 28N | 360 | 8 | -0.214 | -0.388 | -0.170 | -0.142 | -0.094 | -0.341 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 67% of cells below 0; (15.5, 85.5) -1.66, bias +0.242 sea 0 m; (14.5, 85.5) -1.58, bias +0.185 sea 0 m; (13.5, 85.5) -1.47, bias +0.115 sea 0 m
- day 4 tp: 67% of cells below 0; (20.5, 67.5) -1.76, bias +2.12 sea 0 m; (20.5, 66.5) -1.62, bias +1.66 sea 0 m; (20.5, 65.5) -1.37, bias +1.27 sea 0 m
- day 4 u10: 45% of cells below 0; (26.5, 97.5) -2.11, bias +0.288 land 1110 m; (27.5, 97.5) -1.93, bias +0.283 land 2097 m; (29.5, 95.5) -1.68, bias +0.131 land 3567 m
- day 4 v10: 59% of cells below 0; (27.5, 96.5) -1.24, bias +0.155 land 1479 m; (26.5, 91.5) -0.92, bias +0.177 land 857 m; (27.5, 95.5) -0.92, bias +0.146 land 765 m
- day 4 msl: 26% of cells below 0; (28.5, 65.5) -0.24, bias -151 land 1204 m; (27.5, 65.5) -0.20, bias -128 land 1152 m; (8.5, 75.5) -0.19, bias +18.1 sea 0 m
- day 4 tcwv: 41% of cells below 0; (36.5, 78.5) -1.00, bias +1.53 land 3912 m; (36.5, 79.5) -0.89, bias +2.08 land 3397 m; (36.5, 77.5) -0.84, bias +0.886 land 4299 m
- day 8 t2m: 98% of cells below 0; (15.5, 85.5) -1.79, bias +0.141 sea 0 m; (14.5, 85.5) -1.78, bias +0.0815 sea 0 m; (10.5, 74.5) -1.73, bias -0.837 sea 0 m
- day 8 tp: 99% of cells below 0; (25.5, 65.5) -1.67, bias +1.32 land 205 m; (26.5, 65.5) -1.53, bias +1.35 land 753 m; (25.5, 66.5) -1.48, bias +1.55 land 195 m
- day 8 u10: 92% of cells below 0; (26.5, 97.5) -4.19, bias +0.5 land 1110 m; (27.5, 97.5) -3.70, bias +0.477 land 2097 m; (29.5, 95.5) -3.37, bias +0.301 land 3567 m
- day 8 v10: 99% of cells below 0; (27.5, 96.5) -2.58, bias +0.353 land 1479 m; (36.5, 70.5) -1.71, bias +0.11 land 3087 m; (26.5, 91.5) -1.71, bias +0.283 land 857 m
- day 8 msl: 93% of cells below 0; (9.5, 75.5) -0.83, bias +52 sea 4 m; (8.5, 75.5) -0.79, bias +52.8 sea 0 m; (10.5, 76.5) -0.76, bias +56.5 land 337 m
- day 8 tcwv: 89% of cells below 0; (36.5, 79.5) -1.78, bias +3.52 land 3397 m; (36.5, 78.5) -1.75, bias +2.5 land 3912 m; (34.5, 88.5) -1.74, bias -1.09 land 5075 m
