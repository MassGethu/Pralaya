## b3_roll4 on val (354 windows, init 2020-01-03..2020-12-21)

| lead | SS vs best ref | SS vs persistence | CSI model / pers / clim | CSI skill |
|---|---|---|---|---|
| 1 | +0.299 | +0.299 | 0.535 / 0.436 / 0.277 | +0.176 |
| 4 | +0.092 | +0.257 | 0.345 / 0.228 / 0.277 | +0.094 |
| 8 | -0.058 | +0.204 | 0.282 / 0.212 / 0.277 | +0.007 |

Day-4 per channel (RMSE model / persistence / climatology):
- t2m: 1.573 / 1.889 / 1.722  (SS best +0.086, vs pers +0.167)
- tp: 6.681 / 9.366 / 6.838  (SS best +0.023, vs pers +0.287)
- u10: 1.474 / 1.973 / 1.67  (SS best +0.117, vs pers +0.253)
- v10: 1.339 / 1.939 / 1.46  (SS best +0.083, vs pers +0.309)
- msl: 245.5 / 328.5 / 278.4  (SS best +0.118, vs pers +0.253)
- tcwv: 5.368 / 7.366 / 6.138  (SS best +0.126, vs pers +0.271)

Aggregate: SS per-window +0.0461 (proxy 11.5/30), CSI skill +0.0710 (proxy 10.7/15), anti-blur proxy 10.0/10 (in-band 90%), day-4 beats persistence: True
Day-8 variance ratio: {'t2m': 1.0130000114440918, 'tp': 0.8489999771118164, 'u10': 0.8849999904632568, 'v10': 0.9380000233650208, 'msl': 0.953000009059906, 'tcwv': 0.9440000057220459}
Invalid windows: 0; CPU 10-step rollout median 25 ms
Shocks (354 windows): null exact=True ok=True; causality proxy 13.8/15
- warm_ocean: nonzero 100%, localized 100% (day-1 near frac mean 0.97, min 0.89), propagates 94%, stable 86% (max 20.17 std), far frac max 0.000
- monsoon_stall: nonzero 100%, localized 100% (day-1 near frac mean 0.99, min 0.91), propagates 64%, stable 90% (max 16.88 std), far frac max 0.000
