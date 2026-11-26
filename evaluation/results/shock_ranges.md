# Shock ranges for stress tests and scenario ensembles (`b3_roll4`, val 2020)

354 windows for trust; 122 JJAS windows for impacts (days 1-7, land cells, cos-lat weights, same definitions as the dashboard). Trusted = >= 95% of windows within the kit's 5 std limit and all outputs valid.

## Bay of Bengal temperature (t2m add, tcwv +5 %/K)

Box [8, 20, 82, 94] (lat0, lat1, lon0, lon1). Bay of Bengal marine heatwaves reach about +1 to +3 K; cool anomalies after cyclones are about -1 to -2 K. +3 K is the kit's own warm_ocean shock. 4-5 K are outside the plausible range and tested only to find where the model stops being trustworthy.

**Recommended range: -1 to 1 K** (physically plausible -2 to 3; model trusted at [-1, -0.5, 0.5, 1]).

| magnitude | plausible | stable | valid | p95 max std | central India Δ7-day rain mm, median [p10, p90] | Odisha coast Δ rain | west coast Δ rain | central India Δt2m K |
|---|---|---|---|---|---|---|---|---|
| -3 K | no | 83.9% | 100% | 7.66 | -1.9 [-9.0, +5.7] | -3.5 [-15.3, +5.4] | -1.4 [-10.6, +2.4] | -0.15 |
| -2 K | yes | 90.1% | 100% | 6.64 | -0.7 [-5.1, +3.8] | -1.2 [-9.4, +4.6] | -1.0 [-6.6, +2.6] | -0.10 |
| -1 K | yes | 96.6% | 100% | 4.12 | -0.3 [-2.5, +2.1] | -0.2 [-5.1, +3.4] | -0.3 [-2.9, +1.5] | -0.05 |
| -0.5 K | yes | 98.6% | 100% | 2.29 | -0.2 [-1.3, +1.1] | -0.1 [-2.2, +1.6] | -0.1 [-1.4, +0.7] | -0.03 |
| 0.5 K | yes | 98.9% | 100% | 2.26 | +0.1 [-1.2, +1.0] | +0.1 [-1.7, +1.9] | +0.2 [-0.8, +1.2] | +0.03 |
| 1 K | yes | 96.3% | 100% | 3.87 | +0.3 [-2.6, +2.0] | +0.2 [-3.2, +3.4] | +0.4 [-1.4, +2.2] | +0.05 |
| 1.5 K | yes | 93.8% | 100% | 5.27 | +0.3 [-3.4, +2.6] | +0.4 [-4.7, +4.8] | +0.8 [-2.1, +3.3] | +0.08 |
| 2 K | yes | 91.2% | 100% | 6.49 | +0.4 [-4.2, +3.2] | +0.3 [-5.1, +5.9] | +1.1 [-2.5, +4.5] | +0.11 |
| 2.5 K | yes | 86.7% | 100% | 8.53 | +0.5 [-4.9, +3.9] | +0.3 [-5.9, +6.6] | +1.5 [-2.5, +4.9] | +0.14 |
| 3 K | yes | 85.6% | 100% | 9.14 | +0.5 [-5.4, +4.2] | +0.4 [-7.2, +7.8] | +2.0 [-2.3, +6.0] | +0.15 |
| 4 K | no | 79.7% | 100% | 9.12 | +1.0 [-5.9, +5.7] | +0.5 [-8.9, +8.4] | +2.8 [-2.2, +8.2] | +0.20 |
| 5 K | no | 77.4% | 100% | 9.41 | +1.4 [-6.3, +6.6] | +0.7 [-10.1, +9.4] | +3.8 [-2.2, +10.3] | +0.24 |

## Arabian Sea 10 m wind (u10, v10 percent)

Box [8, 20, 65, 75] (lat0, lat1, lon0, lon1). Monsoon breaks weaken the low-level jet over the Arabian Sea by up to about half; active spells strengthen it by about a third. -40 % is the kit's monsoon_stall shock.

**Recommended range: -20 to 30 %** (physically plausible -50 to 30; model trusted at [-20, -10, 10, 20, 30]).

| magnitude | plausible | stable | valid | p95 max std | central India Δ7-day rain mm, median [p10, p90] | Odisha coast Δ rain | west coast Δ rain | central India Δt2m K |
|---|---|---|---|---|---|---|---|---|
| -60 % | no | 83.9% | 100% | 7.21 | +0.4 [-4.0, +4.4] | +0.6 [-2.8, +4.3] | +2.6 [-13.7, +14.0] | +0.02 |
| -50 % | yes | 86.7% | 100% | 6.53 | +0.6 [-3.2, +4.6] | +0.7 [-2.6, +3.6] | +2.1 [-11.6, +12.2] | +0.02 |
| -40 % | yes | 89.5% | 100% | 6.35 | +0.8 [-2.5, +4.0] | +0.5 [-3.1, +3.1] | +1.6 [-10.1, +11.8] | +0.01 |
| -30 % | yes | 94.1% | 100% | 5.65 | +0.6 [-1.8, +3.3] | +0.4 [-3.0, +2.8] | +1.2 [-6.6, +9.5] | +0.01 |
| -20 % | yes | 97.2% | 100% | 4.29 | +0.4 [-1.3, +2.0] | +0.2 [-1.6, +1.6] | +0.9 [-5.5, +5.6] | +0.01 |
| -10 % | yes | 99.7% | 100% | 2.46 | +0.2 [-0.7, +1.1] | +0.1 [-1.0, +0.8] | +0.3 [-3.9, +2.9] | +0.00 |
| 10 % | yes | 98.9% | 100% | 2.52 | -0.1 [-1.2, +1.1] | -0.1 [-0.7, +0.9] | -0.3 [-3.1, +4.3] | -0.00 |
| 20 % | yes | 97.2% | 100% | 4.00 | -0.1 [-1.8, +2.3] | -0.2 [-1.7, +1.5] | -0.1 [-5.2, +7.7] | -0.01 |
| 30 % | yes | 96.0% | 100% | 4.67 | -0.2 [-2.6, +3.7] | -0.2 [-2.5, +2.7] | -0.6 [-8.6, +8.8] | -0.02 |
| 40 % | no | 92.9% | 100% | 5.58 | +0.1 [-3.3, +5.3] | -0.0 [-2.9, +3.4] | -0.6 [-11.8, +10.8] | -0.03 |

## Inverse stress tests (thresholds fixed before running)

| threshold | eligible JJAS windows | crossed by a plausible, trusted shock | crossed by any tested shock | largest-margin plausible, trusted crossing (example) | no tested shock qualifies: closest approach |
|---|---|---|---|---|---|
| coastal Odisha 7-day rain >= 115 mm (observed JJAS 2020 90th percentile of 7-day totals) | 114 | 2 | 7 | 2020-08-19: bob_temp 0.5 (114.55 -> 116.198) | 2020-09-19: base 68.051, closest 94.293 at bob_temp 5 |
| central India 7-day rain at least 50 % below the base forecast | 122 | 0 | 1 | none | 2020-06-12: base 95.013, closest 80.035 at bob_temp 5 |
| west coast heavy-rain share (>= 10 mm/day) up by >= 20 points | 119 | 0 | 4 | none | 2020-08-30: base 0.172, closest 0.369 at bob_temp 5 |
| central India 7-day mean t2m >= 1 K above the base forecast | 122 | 0 | 0 | none | 2020-06-01: base 303.856, closest 304.566 at bob_temp 5 |
