## b1_onestep_s2 on test (353 windows, init 2021-01-03..2021-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.294 | +0.294 | 0.531 / 0.426 / 0.260 | +0.184 |
| 4 | +0.037 | +0.215 | 0.320 / 0.209 / 0.261 | +0.080 |
| 8 | -0.158 | +0.138 | 0.243 / 0.196 / 0.262 | -0.025 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.749 / 1.934 / 1.779  (SS best +0.017, vs pers +0.096)
- tp: 7.011 / 9.249 / 6.788  (SS best -0.033, vs pers +0.242)
- u10: 1.585 / 2.073 / 1.672  (SS best +0.052, vs pers +0.235)
- v10: 1.418 / 1.956 / 1.464  (SS best +0.031, vs pers +0.275)
- msl: 276.6 / 353.6 / 284.9  (SS best +0.029, vs pers +0.218)
- tcwv: 5.855 / 7.559 / 6.701  (SS best +0.126, vs pers +0.225)

Aggregate: SS per-window -0.0194 (proxy 0.0/30), CSI skill +0.0565 (proxy 8.5/15), anti-blur proxy 10.0/10 (in-band 86%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 0.9940000176429749, 'tp': 1.1150000095367432, 'u10': 0.7329999804496765, 'v10': 0.8889999985694885, 'msl': 0.9610000252723694, 'tcwv': 1.003000020980835}
Invalid windows: 0; CPU 10-step rollout median 35 ms
Shocks (353 windows): null exact=True ok=True; causality proxy 13.9/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.98, min 0.89), propagates 98%, stable 86% (max 14.55 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.97), propagates 60%, stable 96% (max 14.85 std), far frac max 0.000

### Uncertainty (mean [95% block-bootstrap CI], worst window)
- per-window skill: -0.019 [-0.039, -0.003], worst -0.278
- skill day 1: +0.241 [+0.228, +0.255], worst -0.110
- skill day 4: -0.054 [-0.078, -0.035], worst -0.417
- skill day 8: -0.245 [-0.279, -0.214], worst -0.796
- CSI skill per window: +0.057 [+0.040, +0.076], worst -0.271
- day-4 skill vs persistence: +0.181 [+0.162, +0.201], worst -0.282; windows beating persistence 92% [88%, 95%]
- day-8 in-band fraction: 0.86 [0.83, 0.89], worst 0.33
- causality proxy per window: 13.9 [13.6, 14.1], worst 11.2
- grader-like draw (5 random windows), forecast points /45: p05 0.0, median 9.8, p95 21.3
- warm_ocean: stable 86% [76%, 93%]; unstable by channel {'t2m': 0, 'tp': 49, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-10-11 14.55 std (tp), 2021-11-20 11.79 std (tp), 2021-10-08 11.62 std (tp)
- monsoon_stall: stable 96% [92%, 99%]; unstable by channel {'t2m': 0, 'tp': 15, 'u10': 0, 'v10': 0, 'msl': 0, 'tcwv': 0}; worst 2021-05-19 14.85 std (tp), 2021-05-13 10.13 std (tp), 2021-05-14 8.27 std (tp)
- worst windows (per-window skill): 2021-03-31 -0.278, 2021-07-15 -0.267, 2021-09-16 -0.249, 2021-08-27 -0.246, 2021-10-16 -0.239
- worst windows (day-8 skill): 2021-09-16 -0.796, 2021-07-15 -0.759, 2021-01-19 -0.746, 2021-04-01 -0.716, 2021-11-18 -0.692

### Skill by region (1 - RMSE / min(persistence, climatology))

| region | cells | lead | t2m | tp | u10 | v10 | msl | tcwv |
|---|---|---|---|---|---|---|---|---|
| all | 1152 | 4 | +0.017 | -0.033 | +0.052 | +0.031 | +0.029 | +0.126 |
| all | 1152 | 8 | -0.261 | -0.129 | -0.162 | -0.136 | -0.158 | -0.105 |
| ocean (lsm<0.5) | 416 | 4 | -0.456 | -0.007 | +0.074 | +0.062 | +0.088 | +0.155 |
| ocean (lsm<0.5) | 416 | 8 | -0.943 | -0.058 | -0.161 | -0.117 | -0.184 | -0.061 |
| land below 1000 m | 391 | 4 | -0.003 | -0.076 | +0.033 | -0.048 | +0.040 | +0.121 |
| land below 1000 m | 391 | 8 | -0.312 | -0.195 | -0.143 | -0.208 | -0.159 | -0.109 |
| highlands >=2000 m | 287 | 4 | +0.080 | -0.071 | -0.095 | -0.063 | +0.015 | -0.174 |
| highlands >=2000 m | 287 | 8 | -0.153 | -0.350 | -0.223 | -0.162 | -0.144 | -0.543 |
| Bay of Bengal box | 144 | 4 | -0.441 | -0.019 | +0.077 | +0.063 | +0.073 | +0.143 |
| Bay of Bengal box | 144 | 8 | -0.837 | -0.085 | -0.149 | -0.171 | -0.214 | -0.064 |
| Arabian Sea box | 120 | 4 | -0.385 | +0.026 | +0.075 | +0.112 | +0.145 | +0.214 |
| Arabian Sea box | 120 | 8 | -0.823 | -0.018 | -0.174 | +0.004 | -0.158 | +0.004 |
| north of 28N | 360 | 4 | +0.062 | -0.058 | -0.060 | -0.064 | +0.012 | -0.002 |
| north of 28N | 360 | 8 | -0.185 | -0.290 | -0.174 | -0.164 | -0.144 | -0.311 |

### Weak cells (share of cells with skill < 0; worst 3 cells: lat, lon, skill, bias)
- day 4 t2m: 66% of cells below 0; (6.5, 78.5) -1.04, bias -0.327 sea 0 m; (6.5, 79.5) -0.97, bias -0.234 sea 37 m; (18.5, 86.5) -0.86, bias +0.0054 sea 0 m
- day 4 tp: 70% of cells below 0; (27.5, 69.5) -3.42, bias +0.797 land 76 m; (26.5, 69.5) -3.10, bias +0.929 land 62 m; (26.5, 70.5) -2.54, bias +1.06 land 142 m
- day 4 u10: 49% of cells below 0; (26.5, 97.5) -1.88, bias +0.226 land 1110 m; (27.5, 97.5) -1.69, bias +0.214 land 2097 m; (35.5, 72.5) -1.41, bias +0.0908 land 3025 m
- day 4 v10: 64% of cells below 0; (27.5, 96.5) -1.07, bias +0.0887 land 1479 m; (36.5, 70.5) -1.03, bias +0.105 land 3087 m; (27.5, 87.5) -0.76, bias +0.165 land 2856 m
- day 4 msl: 24% of cells below 0; (28.5, 65.5) -0.16, bias -124 land 1204 m; (34.5, 65.5) -0.15, bias -86.3 land 2725 m; (27.5, 65.5) -0.15, bias -117 land 1152 m
- day 4 tcwv: 38% of cells below 0; (37.5, 75.5) -0.71, bias +0.491 land 4119 m; (34.5, 79.5) -0.71, bias -0.638 land 5249 m; (36.5, 78.5) -0.69, bias +1.3 land 3912 m
- day 8 t2m: 98% of cells below 0; (6.5, 78.5) -2.20, bias -0.801 sea 0 m; (6.5, 79.5) -2.12, bias -0.581 sea 37 m; (10.5, 74.5) -1.87, bias -0.789 sea 0 m
- day 8 tp: 93% of cells below 0; (28.5, 65.5) -5.21, bias +0.712 land 1204 m; (27.5, 69.5) -4.79, bias +1.24 land 76 m; (26.5, 69.5) -4.33, bias +1.38 land 62 m
- day 8 u10: 99% of cells below 0; (26.5, 97.5) -3.83, bias +0.418 land 1110 m; (27.5, 97.5) -3.30, bias +0.364 land 2097 m; (29.5, 95.5) -2.59, bias +0.178 land 3567 m
- day 8 v10: 92% of cells below 0; (27.5, 96.5) -2.34, bias +0.275 land 1479 m; (36.5, 70.5) -1.89, bias +0.147 land 3087 m; (26.5, 98.5) -1.63, bias +0.264 land 1975 m
- day 8 msl: 99% of cells below 0; (7.5, 80.5) -0.55, bias +83.2 land 195 m; (7.5, 79.5) -0.54, bias +64.7 sea 45 m; (9.5, 100.5) -0.52, bias -111 sea 15 m
- day 8 tcwv: 86% of cells below 0; (35.5, 77.5) -1.76, bias -0.344 land 5116 m; (34.5, 79.5) -1.76, bias -1.53 land 5249 m; (34.5, 78.5) -1.69, bias -1.45 land 5207 m
