## b1_onestep on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.311 | +0.311 | 0.542 / 0.436 / 0.277 | +0.189 |
| 4 | +0.056 | +0.226 | 0.345 / 0.228 / 0.277 | +0.094 |
| 8 | -0.121 | +0.157 | 0.290 / 0.212 / 0.277 | +0.018 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.665 / 1.889 / 1.722  (SS best +0.033, vs pers +0.119)
- tp: 6.951 / 9.366 / 6.838  (SS best -0.017, vs pers +0.258)
- u10: 1.503 / 1.973 / 1.67  (SS best +0.100, vs pers +0.238)
- v10: 1.366 / 1.939 / 1.46  (SS best +0.064, vs pers +0.295)
- msl: 256.4 / 328.5 / 278.4  (SS best +0.079, vs pers +0.220)
- tcwv: 5.685 / 7.366 / 6.138  (SS best +0.074, vs pers +0.228)

Aggregate: SS per-window +0.0161 (proxy 4.0/30), CSI skill +0.0749 (proxy 11.2/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 0.9660000205039978, 'tp': 0.8370000123977661, 'u10': 0.9599999785423279, 'v10': 0.8820000290870667, 'msl': 0.996999979019165, 'tcwv': 0.9589999914169312}
Invalid windows: 0; CPU 10-step rollout median 25 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.4/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.83), propagates 96%, stable 70% (max 21.31 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.87), propagates 71%, stable 78% (max 20.44 std), far frac max 0.000
