# Shock ranges for stress tests and scenario ensembles (`e3_roll8_ocean`, val 2020)

354 windows for trust; 122 JJAS windows for impacts (days 1-7, land cells, cos-lat weights, same definitions as the dashboard). Trusted = >= 95% of windows within the kit's 5 std limit and all outputs valid.

## Bay of Bengal temperature (t2m add, tcwv +5 %/K)

Box [8, 20, 82, 94] (lat0, lat1, lon0, lon1). Bay of Bengal marine heatwaves reach about +1 to +3 K; cool anomalies after cyclones are about -1 to -2 K. +3 K is the kit's own warm_ocean shock. 4-5 K are outside the plausible range and tested only to find where the model stops being trustworthy.

**Recommended range: -1 to 1.5 K** (physically plausible -2 to 3; model trusted at [-1, -0.5, 0.5, 1, 1.5]).

| magnitude | plausible | stable | valid | p95 max std | central India Δ7-day rain mm, median [p10, p90] | Odisha coast Δ rain | west coast Δ rain | central India Δt2m K |
|---|---|---|---|---|---|---|---|---|
| -3 K | no | 87.9% | 100% | 6.79 | -1.0 [-8.4, +5.2] | -2.7 [-12.4, +5.9] | -1.0 [-9.6, +3.0] | -0.15 |
| -2 K | yes | 92.7% | 100% | 6.24 | -0.7 [-4.4, +3.7] | -1.3 [-8.4, +4.0] | -0.8 [-5.8, +2.5] | -0.10 |
| -1 K | yes | 97.2% | 100% | 3.93 | -0.4 [-2.1, +1.8] | -0.6 [-4.1, +2.1] | -0.3 [-2.7, +1.5] | -0.05 |
| -0.5 K | yes | 99.7% | 100% | 2.21 | -0.2 [-1.0, +0.9] | -0.3 [-2.0, +1.0] | -0.1 [-1.2, +0.7] | -0.02 |
| 0.5 K | yes | 99.7% | 100% | 1.94 | +0.2 [-0.8, +0.9] | +0.2 [-1.1, +2.0] | +0.2 [-0.6, +1.1] | +0.03 |
| 1 K | yes | 96.9% | 100% | 3.29 | +0.3 [-1.6, +1.8] | +0.4 [-2.0, +3.5] | +0.4 [-1.2, +2.0] | +0.05 |
| 1.5 K | yes | 95.2% | 100% | 4.73 | +0.4 [-2.3, +2.8] | +0.6 [-3.4, +4.7] | +0.6 [-1.6, +2.6] | +0.08 |
| 2 K | yes | 93.5% | 100% | 5.92 | +0.6 [-2.7, +3.5] | +1.0 [-4.9, +6.1] | +0.9 [-2.0, +3.6] | +0.10 |
| 2.5 K | yes | 91.0% | 100% | 6.09 | +0.9 [-3.5, +4.2] | +1.4 [-5.3, +6.6] | +1.3 [-2.0, +4.5] | +0.13 |
| 3 K | yes | 88.1% | 100% | 6.86 | +1.0 [-4.6, +4.6] | +1.5 [-6.2, +7.8] | +1.7 [-2.4, +5.2] | +0.15 |
| 4 K | no | 82.8% | 100% | 8.41 | +1.2 [-5.1, +5.4] | +1.7 [-6.9, +9.4] | +2.5 [-2.6, +6.6] | +0.19 |
| 5 K | no | 79.1% | 100% | 9.62 | +1.8 [-6.0, +7.0] | +1.5 [-7.5, +10.6] | +3.5 [-2.4, +8.4] | +0.24 |

## Arabian Sea 10 m wind (u10, v10 percent)

Box [8, 20, 65, 75] (lat0, lat1, lon0, lon1). Monsoon breaks weaken the low-level jet over the Arabian Sea by up to about half; active spells strengthen it by about a third. -40 % is the kit's monsoon_stall shock.

**Recommended range: -20 to 30 %** (physically plausible -50 to 30; model trusted at [-20, -10, 10, 20, 30]).

| magnitude | plausible | stable | valid | p95 max std | central India Δ7-day rain mm, median [p10, p90] | Odisha coast Δ rain | west coast Δ rain | central India Δt2m K |
|---|---|---|---|---|---|---|---|---|
| -60 % | no | 85.9% | 100% | 6.85 | -0.2 [-4.4, +3.7] | +0.8 [-2.9, +4.1] | +2.6 [-9.3, +19.7] | +0.04 |
| -50 % | yes | 87.0% | 100% | 6.53 | +0.1 [-3.3, +3.5] | +0.8 [-2.5, +4.2] | +2.7 [-8.6, +15.5] | +0.03 |
| -40 % | yes | 88.4% | 100% | 5.83 | +0.3 [-2.8, +3.1] | +0.6 [-2.4, +3.3] | +1.8 [-6.3, +14.4] | +0.02 |
| -30 % | yes | 93.2% | 100% | 5.35 | +0.3 [-2.4, +3.0] | +0.5 [-1.8, +2.7] | +1.4 [-5.6, +11.2] | +0.01 |
| -20 % | yes | 96.9% | 100% | 4.35 | +0.2 [-1.5, +2.0] | +0.5 [-1.1, +1.8] | +0.5 [-5.1, +7.2] | +0.01 |
| -10 % | yes | 98.9% | 100% | 2.44 | +0.1 [-0.9, +1.0] | +0.2 [-0.6, +1.0] | +0.4 [-4.0, +3.3] | +0.00 |
| 10 % | yes | 99.2% | 100% | 2.60 | -0.0 [-0.9, +1.4] | -0.2 [-0.9, +0.6] | -0.4 [-2.8, +3.3] | -0.00 |
| 20 % | yes | 96.9% | 100% | 4.21 | +0.1 [-1.5, +2.7] | -0.4 [-1.5, +0.9] | -0.3 [-5.2, +5.3] | -0.01 |
| 30 % | yes | 95.8% | 100% | 4.54 | +0.2 [-2.1, +3.6] | -0.5 [-2.3, +1.3] | -0.5 [-7.1, +8.2] | -0.01 |
| 40 % | no | 92.9% | 100% | 5.65 | +0.7 [-2.5, +4.5] | -0.5 [-3.1, +1.5] | -1.4 [-8.9, +10.4] | -0.02 |

## Inverse stress tests (thresholds fixed before running)

| threshold | eligible JJAS windows | crossed by a plausible, trusted shock | crossed by any tested shock | largest-margin plausible, trusted crossing (example) | no tested shock qualifies: closest approach |
|---|---|---|---|---|---|
| coastal Odisha 7-day rain >= 115 mm (observed JJAS 2020 90th percentile of 7-day totals) | 114 | 4 | 5 | 2020-08-13: bob_temp 1.5 (106.933 -> 117.787) | 2020-09-30: base 76.819, closest 94.381 at bob_temp 4 |
| central India 7-day rain at least 50 % below the base forecast | 122 | 0 | 1 | none | 2020-07-29: base 90.317, closest 75.644 at bob_temp 5 |
| west coast heavy-rain share (>= 10 mm/day) up by >= 20 points | 120 | 0 | 5 | none | 2020-08-21: base 0.138, closest 0.335 at as_wind -60 |
| central India 7-day mean t2m >= 1 K above the base forecast | 122 | 0 | 0 | none | 2020-06-01: base 303.268, closest 303.842 at bob_temp 5 |
