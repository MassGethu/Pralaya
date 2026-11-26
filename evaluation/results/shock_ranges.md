# Shock ranges for stress tests and scenario ensembles (`e3_rainstab`, val 2020)

354 windows for trust; 122 JJAS windows for impacts (days 1-7, land cells, cos-lat weights, same definitions as the dashboard). Trusted = >= 95% of windows within the kit's 5 std limit and all outputs valid.

## Bay of Bengal temperature (t2m add, tcwv +5 %/K)

Box [8, 20, 82, 94] (lat0, lat1, lon0, lon1). Bay of Bengal marine heatwaves reach about +1 to +3 K; cool anomalies after cyclones are about -1 to -2 K. +3 K is the kit's own warm_ocean shock. 4-5 K are outside the plausible range and tested only to find where the model stops being trustworthy.

**Recommended range: -2 to 2 K** (physically plausible -2 to 3; model trusted at [-2, -1, -0.5, 0.5, 1, 1.5, 2]).

| magnitude | plausible | stable | valid | p95 max std | central India Δ7-day rain mm, median [p10, p90] | Odisha coast Δ rain | west coast Δ rain | central India Δt2m K |
|---|---|---|---|---|---|---|---|---|
| -3 K | no | 93.2% | 100% | 5.16 | -0.8 [-7.3, +5.4] | -1.6 [-11.0, +7.4] | -1.3 [-9.1, +2.5] | -0.16 |
| -2 K | yes | 96.6% | 100% | 4.11 | -0.4 [-3.5, +3.9] | -0.4 [-7.5, +5.0] | -0.7 [-5.5, +2.1] | -0.11 |
| -1 K | yes | 99.2% | 100% | 2.45 | -0.2 [-1.7, +2.2] | -0.2 [-3.3, +2.4] | -0.3 [-2.4, +1.2] | -0.06 |
| -0.5 K | yes | 100.0% | 100% | 1.30 | -0.1 [-0.8, +1.1] | -0.1 [-1.6, +1.3] | -0.2 [-1.2, +0.7] | -0.03 |
| 0.5 K | yes | 99.4% | 100% | 1.46 | +0.1 [-1.0, +0.7] | +0.1 [-1.0, +1.3] | +0.2 [-0.6, +1.1] | +0.03 |
| 1 K | yes | 98.0% | 100% | 3.00 | +0.1 [-2.0, +1.5] | +0.2 [-2.0, +2.5] | +0.4 [-1.1, +2.0] | +0.06 |
| 1.5 K | yes | 96.3% | 100% | 4.03 | +0.2 [-2.8, +2.1] | +0.1 [-2.9, +3.7] | +0.7 [-1.5, +2.8] | +0.09 |
| 2 K | yes | 95.5% | 100% | 4.77 | +0.3 [-3.5, +2.3] | +0.2 [-4.2, +4.7] | +1.0 [-1.8, +3.4] | +0.12 |
| 2.5 K | yes | 94.1% | 100% | 5.35 | +0.5 [-4.3, +2.8] | +0.4 [-5.0, +5.5] | +1.4 [-1.9, +3.9] | +0.15 |
| 3 K | yes | 92.9% | 100% | 5.75 | +0.5 [-4.9, +3.3] | +0.6 [-5.6, +6.3] | +1.8 [-1.9, +4.6] | +0.17 |
| 4 K | no | 89.8% | 100% | 6.88 | +0.7 [-6.3, +4.9] | +0.6 [-6.7, +8.2] | +2.5 [-2.0, +6.5] | +0.22 |
| 5 K | no | 87.9% | 100% | 7.06 | +0.9 [-6.8, +5.7] | +0.7 [-7.2, +9.1] | +3.5 [-1.6, +8.9] | +0.27 |

## Arabian Sea 10 m wind (u10, v10 percent)

Box [8, 20, 65, 75] (lat0, lat1, lon0, lon1). Monsoon breaks weaken the low-level jet over the Arabian Sea by up to about half; active spells strengthen it by about a third. -40 % is the kit's monsoon_stall shock.

**Recommended range: -30 to 30 %** (physically plausible -50 to 30; model trusted at [-30, -20, -10, 10, 20, 30, 40]).

| magnitude | plausible | stable | valid | p95 max std | central India Δ7-day rain mm, median [p10, p90] | Odisha coast Δ rain | west coast Δ rain | central India Δt2m K |
|---|---|---|---|---|---|---|---|---|
| -60 % | no | 89.8% | 100% | 5.81 | +0.2 [-3.3, +3.5] | +0.6 [-2.4, +4.0] | +3.8 [-9.7, +17.2] | +0.03 |
| -50 % | yes | 92.1% | 100% | 5.38 | +0.2 [-2.5, +3.2] | +0.6 [-2.3, +3.0] | +3.8 [-8.8, +13.8] | +0.02 |
| -40 % | yes | 94.9% | 100% | 5.03 | +0.4 [-2.5, +2.9] | +0.6 [-2.0, +2.7] | +2.1 [-8.0, +12.0] | +0.01 |
| -30 % | yes | 97.7% | 100% | 4.31 | +0.3 [-1.7, +2.4] | +0.5 [-1.6, +2.4] | +1.5 [-5.3, +10.2] | +0.01 |
| -20 % | yes | 99.2% | 100% | 3.32 | +0.2 [-1.2, +1.6] | +0.4 [-1.0, +1.7] | +1.0 [-4.1, +6.4] | +0.00 |
| -10 % | yes | 99.7% | 100% | 1.90 | +0.1 [-0.7, +1.0] | +0.1 [-0.5, +0.8] | +0.5 [-2.7, +2.8] | -0.00 |
| 10 % | yes | 99.7% | 100% | 1.85 | -0.0 [-1.0, +1.0] | -0.1 [-0.9, +0.5] | -0.1 [-2.6, +3.4] | -0.00 |
| 20 % | yes | 99.2% | 100% | 2.94 | +0.1 [-1.6, +2.4] | -0.3 [-1.8, +0.8] | -0.2 [-5.2, +5.7] | -0.01 |
| 30 % | yes | 98.3% | 100% | 4.02 | +0.2 [-2.2, +3.4] | -0.5 [-2.3, +1.4] | -0.5 [-7.2, +7.4] | -0.02 |
| 40 % | no | 96.3% | 100% | 4.62 | +0.3 [-2.5, +4.4] | -0.5 [-3.1, +1.6] | -1.2 [-9.5, +9.7] | -0.02 |

## Inverse stress tests (thresholds fixed before running)

| threshold | eligible JJAS windows | crossed by a plausible, trusted shock | crossed by any tested shock | largest-margin plausible, trusted crossing (example) | no tested shock qualifies: closest approach |
|---|---|---|---|---|---|
| coastal Odisha 7-day rain >= 115 mm (observed JJAS 2020 90th percentile of 7-day totals) | 116 | 2 | 3 | 2020-08-03: bob_temp -2 (109.168 -> 123.945) | 2020-06-16: base 83.789, closest 106.044 at bob_temp -3 |
| central India 7-day rain at least 50 % below the base forecast | 122 | 1 | 1 | 2020-09-30: bob_temp -2 (25.559 -> 11.814) | 2020-08-12: base 118.06, closest 104.401 at bob_temp 4 |
| west coast heavy-rain share (>= 10 mm/day) up by >= 20 points | 120 | 1 | 3 | 2020-09-09: as_wind 30 (0.36 -> 0.567) | 2020-08-21: base 0.172, closest 0.36 at as_wind -60 |
| central India 7-day mean t2m >= 1 K above the base forecast | 122 | 0 | 0 | none | 2020-06-08: base 303.43, closest 304.101 at bob_temp 5 |
