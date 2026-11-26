## b3_roll4 on test (353 windows, init 2021-01-03..2021-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.294 | +0.294 | 0.530 / 0.426 / 0.260 | +0.181 |
| 4 | +0.086 | +0.256 | 0.332 / 0.209 / 0.261 | +0.096 |
| 8 | -0.039 | +0.227 | 0.289 / 0.196 / 0.262 | +0.037 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.616 / 1.934 / 1.779  (SS best +0.091, vs pers +0.164)
- tp: 6.711 / 9.249 / 6.788  (SS best +0.011, vs pers +0.274)
- u10: 1.502 / 2.073 / 1.672  (SS best +0.102, vs pers +0.275)
- v10: 1.377 / 1.956 / 1.464  (SS best +0.059, vs pers +0.296)
- msl: 264.3 / 353.6 / 284.9  (SS best +0.072, vs pers +0.253)
- tcwv: 5.513 / 7.559 / 6.701  (SS best +0.177, vs pers +0.271)

Aggregate: SS per-window +0.0433 (proxy 10.8/30), CSI skill +0.0808 (proxy 12.1/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0210000276565552, 'tp': 1.0130000114440918, 'u10': 0.8299999833106995, 'v10': 0.9200000166893005, 'msl': 0.9089999794960022, 'tcwv': 0.9929999709129333}
Invalid windows: 0; CPU 10-step rollout median 35 ms
Shocks (353 windows): null exact=True ok=True; causality proxy 13.8/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.96, min 0.72), propagates 94%, stable 86% (max 17.85 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.91), propagates 62%, stable 95% (max 9.43 std), far frac max 0.001

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: +0.043 [+0.031, +0.056], worst -0.205
- skill day 1: +0.238 [+0.225, +0.252], worst -0.109
- skill day 4: +0.004 [-0.016, +0.022], worst -0.394
- skill day 8: -0.112 [-0.137, -0.089], worst -0.743
- CSI skill per window: +0.081 [+0.065, +0.102], worst -0.333
- day-4 skill vs persistence: +0.222 [+0.203, +0.244], worst -0.267; windows beating persistence 95% [92%, 98%]
- day-8 in-band fraction: 0.90 [0.89, 0.92], worst 0.50
- causality proxy per window: 13.8 [13.6, 14.1], worst 9.4
- grader-like draw (5 random windows), forecast points /45: p05 5.4, median 22.0, p95 37.0
- warm_ocean: stable 86% [80%, 92%]; unstable by channel {'t2m': 0, 'tp': 48, 'u10': 0, 'v10': 1, 'msl': 0, 'tcwv': 0}; worst 2021-05-14 17.85 std (tp), 2021-05-15 16.46 std (tp), 2021-06-02 11.88 std (tp)
- monsoon_stall: stable 95% [92%, 98%]; unstable by channel {'t2m': 0, 'tp': 17, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-05-14 9.43 std (tp), 2021-05-16 8.87 std (tp), 2021-09-10 6.86 std (tp)
- worst windows (per-window skill): 2021-03-31 -0.205, 2021-11-18 -0.203, 2021-01-16 -0.175, 2021-10-16 -0.154, 2021-03-16 -0.152
- worst windows (day-8 skill): 2021-11-18 -0.744, 2021-03-31 -0.644, 2021-01-13 -0.573, 2021-10-17 -0.518, 2021-01-16 -0.502

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.091 | +0.011 | +0.102 | +0.059 | +0.072 | +0.177 |
| all | 1152 | 8 | -0.084 | -0.049 | -0.025 | -0.050 | -0.030 | +0.003 |
| ocean (lsm<0.5) | 416 | 4 | -0.323 | +0.011 | +0.117 | +0.081 | +0.179 | +0.189 |
| ocean (lsm<0.5) | 416 | 8 | -0.698 | -0.046 | -0.023 | -0.043 | -0.001 | +0.004 |
| land below 1000 m | 391 | 4 | +0.042 | +0.020 | +0.090 | +0.003 | +0.115 | +0.185 |
| land below 1000 m | 391 | 8 | -0.161 | -0.058 | -0.030 | -0.081 | -0.036 | +0.024 |
| highlands >=2000 m | 287 | 4 | +0.164 | -0.012 | +0.001 | -0.009 | +0.033 | -0.081 |
| highlands >=2000 m | 287 | 8 | +0.016 | -0.034 | -0.037 | -0.044 | -0.031 | -0.286 |
| Bay of Bengal box | 144 | 4 | -0.321 | +0.016 | +0.106 | +0.076 | +0.172 | +0.151 |
| Bay of Bengal box | 144 | 8 | -0.710 | -0.074 | -0.081 | -0.068 | -0.016 | -0.027 |
| Arabian Sea box | 120 | 4 | -0.235 | +0.001 | +0.126 | +0.113 | +0.243 | +0.246 |
| Arabian Sea box | 120 | 8 | -0.593 | -0.011 | +0.036 | +0.000 | +0.095 | +0.047 |
| north of 28N | 360 | 4 | +0.144 | -0.014 | +0.012 | -0.008 | +0.035 | +0.093 |
| north of 28N | 360 | 8 | +0.010 | -0.029 | -0.027 | -0.043 | -0.032 | -0.063 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 55% of cells below 0; (6.5, 77.5) -0.71, bias -0.327 sea 0 m; (18.5, 87.5) -0.61, bias -0.166 sea 0 m; (10.5, 74.5) -0.60, bias +0.0045 sea 0 m
- day 4 tp: 49% of cells below 0; (17.5, 65.5) -4.19, bias +0.742 sea 0 m; (28.5, 65.5) -4.08, bias +0.288 land 1204 m; (29.5, 65.5) -3.86, bias +0.16 land 1166 m
- day 4 u10: 32% of cells below 0; (29.5, 95.5) -1.47, bias -0.0949 land 3567 m; (26.5, 97.5) -1.12, bias +0.12 land 1110 m; (25.5, 96.5) -1.08, bias -0.0062 land 432 m
- day 4 v10: 46% of cells below 0; (27.5, 96.5) -0.68, bias -0.0549 land 1479 m; (27.5, 86.5) -0.57, bias +0.0385 land 2434 m; (37.5, 71.5) -0.56, bias +0.106 land 3637 m
- day 4 msl: 7% of cells below 0; (6.5, 100.5) -0.09, bias -35 land 106 m; (24.5, 100.5) -0.08, bias -61.7 land 1798 m; (34.5, 65.5) -0.08, bias -80.6 land 2725 m
- day 4 tcwv: 24% of cells below 0; (35.5, 82.5) -0.61, bias -0.38 land 4950 m; (35.5, 83.5) -0.60, bias -0.533 land 5005 m; (35.5, 78.5) -0.55, bias -0.476 land 5170 m
- day 8 t2m: 86% of cells below 0; (6.5, 77.5) -1.52, bias -0.58 sea 0 m; (6.5, 82.5) -1.37, bias +0.452 sea 6 m; (7.5, 77.5) -1.26, bias -0.196 sea 11 m
- day 8 tp: 80% of cells below 0; (28.5, 65.5) -1.04, bias +0.263 land 1204 m; (21.5, 96.5) -0.46, bias +0.666 land 647 m; (21.5, 95.5) -0.41, bias +0.321 land 253 m
- day 8 u10: 78% of cells below 0; (29.5, 95.5) -3.06, bias -0.21 land 3567 m; (28.5, 95.5) -2.18, bias -0.19 land 1944 m; (35.5, 73.5) -2.13, bias -0.116 land 3315 m
- day 8 v10: 91% of cells below 0; (27.5, 96.5) -1.41, bias -0.141 land 1479 m; (27.5, 97.5) -0.95, bias -0.104 land 2097 m; (26.5, 98.5) -0.94, bias +0.0545 land 1975 m
- day 8 msl: 71% of cells below 0; (6.5, 100.5) -0.29, bias -61.4 land 106 m; (10.5, 98.5) -0.25, bias -68.9 sea 56 m; (10.5, 97.5) -0.24, bias -69.5 sea 6 m
- day 8 tcwv: 64% of cells below 0; (35.5, 82.5) -1.22, bias -0.202 land 4950 m; (35.5, 83.5) -1.07, bias -0.477 land 5005 m; (35.5, 78.5) -1.06, bias -0.863 land 5170 m
