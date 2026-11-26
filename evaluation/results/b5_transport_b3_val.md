## b5_transport_b3 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.297 | +0.297 | 0.534 / 0.436 / 0.277 | +0.174 |
| 4 | +0.088 | +0.253 | 0.349 / 0.228 / 0.277 | +0.099 |
| 8 | -0.066 | +0.198 | 0.288 / 0.212 / 0.277 | +0.015 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.597 / 1.889 / 1.722  (SS best +0.073, vs pers +0.155)
- tp: 6.684 / 9.366 / 6.838  (SS best +0.022, vs pers +0.286)
- u10: 1.449 / 1.973 / 1.67  (SS best +0.133, vs pers +0.266)
- v10: 1.327 / 1.939 / 1.46  (SS best +0.091, vs pers +0.315)
- msl: 246.5 / 328.5 / 278.4  (SS best +0.115, vs pers +0.250)
- tcwv: 5.546 / 7.366 / 6.138  (SS best +0.097, vs pers +0.247)

Aggregate: SS per-window +0.0427 (proxy 10.7/30), CSI skill +0.0754 (proxy 11.3/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 0.9779999852180481, 'tp': 0.8220000267028809, 'u10': 0.8980000019073486, 'v10': 0.8709999918937683, 'msl': 0.9580000042915344, 'tcwv': 0.9819999933242798}
Invalid windows: 0; CPU 10-step rollout median 26 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.7/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.96, min 0.84), propagates 96%, stable 82% (max 18.53 std), far frac max 0.002
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.92), propagates 61%, stable 90% (max 10.90 std), far frac max 0.002

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.043 [+0.027, +0.058], worst -0.341
- skill day 1: +0.241 [+0.226, +0.253], worst -0.289
- skill day 4: +0.011 [-0.006, +0.031], worst -0.897
- skill day 8: -0.123 [-0.150, -0.099], worst -1.126
- CSI skill per window: +0.075 [+0.053, +0.095], worst -0.258
- day-4 skill vs persistence: +0.215 [+0.192, +0.235], worst -0.569; windows beating persistence 95% [92%, 97%]
- day-8 in-band fraction: 0.90 [0.88, 0.92], worst 0.33
- causality proxy per window: 13.7 [13.4, 13.9], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 3.2, median 21.4, p95 38.6
- warm_ocean: stable 82% [75%, 88%]; unstable by channel {'t2m': 0, 'tp': 63, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-04-28 18.53 std (tp), 2020-06-23 12.09 std (tp), 2020-05-06 11.27 std (tp)
- monsoon_stall: stable 90% [83%, 95%]; unstable by channel {'t2m': 0, 'tp': 37, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2020-07-16 10.9 std (tp), 2020-06-13 10.89 std (tp), 2020-09-20 9.64 std (tp)
- worst windows (per-window skill): 2020-05-01 -0.341, 2020-02-11 -0.328, 2020-02-10 -0.317, 2020-05-06 -0.315, 2020-04-29 -0.202
- worst windows (day-8 skill): 2020-05-01 -1.126, 2020-10-28 -0.771, 2020-04-28 -0.636, 2020-05-05 -0.599, 2020-04-22 -0.582

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.073 | +0.022 | +0.133 | +0.091 | +0.115 | +0.097 |
| all | 1152 | 8 | -0.159 | -0.066 | -0.018 | -0.044 | -0.008 | -0.104 |
| ocean (lsm<0.5) | 416 | 4 | -0.331 | +0.030 | +0.159 | +0.116 | +0.168 | +0.103 |
| ocean (lsm<0.5) | 416 | 8 | -0.775 | -0.074 | -0.002 | -0.037 | -0.037 | -0.090 |
| land below 1000 m | 391 | 4 | +0.051 | +0.014 | +0.073 | +0.025 | +0.177 | +0.107 |
| land below 1000 m | 391 | 8 | -0.186 | -0.067 | -0.079 | -0.093 | -0.002 | -0.112 |
| highlands >=2000 m | 287 | 4 | +0.141 | +0.002 | +0.044 | -0.003 | +0.080 | -0.131 |
| highlands >=2000 m | 287 | 8 | -0.056 | -0.008 | -0.024 | -0.019 | +0.006 | -0.303 |
| Bay of Bengal box | 144 | 4 | -0.426 | +0.027 | +0.186 | +0.134 | +0.194 | +0.103 |
| Bay of Bengal box | 144 | 8 | -0.880 | -0.097 | -0.004 | -0.057 | -0.024 | -0.135 |
| Arabian Sea box | 120 | 4 | -0.310 | +0.045 | +0.164 | +0.124 | +0.172 | +0.143 |
| Arabian Sea box | 120 | 8 | -0.679 | -0.033 | +0.006 | +0.015 | -0.023 | -0.044 |
| north of 28N | 360 | 4 | +0.122 | -0.035 | +0.025 | -0.011 | +0.075 | +0.014 |
| north of 28N | 360 | 8 | -0.079 | -0.003 | -0.043 | -0.035 | -0.004 | -0.116 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 57% of cells below 0; (17.5, 85.5) -1.00, bias +0.073 sea 0 m; (14.5, 84.5) -0.92, bias +0.0956 sea 0 m; (14.5, 86.5) -0.92, bias -0.0482 sea 0 m
- day 4 tp: 55% of cells below 0; (27.5, 74.5) -0.64, bias +0.161 land 336 m; (25.5, 75.5) -0.49, bias +0.713 land 350 m; (25.5, 76.5) -0.49, bias +0.918 land 314 m
- day 4 u10: 34% of cells below 0; (35.5, 73.5) -1.60, bias -0.0544 land 3315 m; (29.5, 95.5) -1.40, bias -0.114 land 3567 m; (35.5, 72.5) -1.38, bias +0.0173 land 3025 m
- day 4 v10: 39% of cells below 0; (26.5, 95.5) -0.76, bias +0.138 land 742 m; (27.5, 86.5) -0.64, bias +0.0208 land 2434 m; (37.5, 70.5) -0.62, bias -0.102 land 2435 m
- day 4 msl: 8% of cells below 0; (6.5, 100.5) -0.12, bias -28.4 land 106 m; (6.5, 96.5) -0.09, bias -4.64 sea 2 m; (6.5, 65.5) -0.09, bias -27 sea 0 m
- day 4 tcwv: 29% of cells below 0; (35.5, 84.5) -0.60, bias -0.871 land 5022 m; (35.5, 83.5) -0.57, bias -0.711 land 5005 m; (35.5, 78.5) -0.56, bias -0.478 land 5170 m
- day 8 t2m: 91% of cells below 0; (7.5, 100.5) -1.45, bias +0.11 sea 45 m; (6.5, 100.5) -1.42, bias +0.184 land 106 m; (6.5, 84.5) -1.42, bias -0.457 sea 0 m
- day 8 tp: 85% of cells below 0; (20.5, 65.5) -0.54, bias -0.386 sea 0 m; (20.5, 66.5) -0.47, bias -0.541 sea 0 m; (20.5, 67.5) -0.44, bias -0.507 sea 0 m
- day 8 u10: 69% of cells below 0; (29.5, 95.5) -2.67, bias -0.214 land 3567 m; (35.5, 73.5) -2.38, bias -0.0492 land 3315 m; (35.5, 72.5) -2.29, bias +0.0111 land 3025 m
- day 8 v10: 84% of cells below 0; (26.5, 95.5) -1.27, bias +0.232 land 742 m; (25.5, 94.5) -0.99, bias +0.269 land 896 m; (27.5, 96.5) -0.88, bias +0.0194 land 1479 m
- day 8 msl: 61% of cells below 0; (6.5, 65.5) -0.42, bias -63.4 sea 0 m; (6.5, 66.5) -0.40, bias -61.5 sea 0 m; (6.5, 100.5) -0.38, bias -57.3 land 106 m
- day 8 tcwv: 91% of cells below 0; (35.5, 84.5) -1.26, bias -1.6 land 5022 m; (35.5, 85.5) -1.08, bias -1.26 land 5063 m; (35.5, 83.5) -1.07, bias -1.17 land 5005 m
