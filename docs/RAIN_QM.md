# Rain quantile mapping on the shock-preserving blend (round 4, pre-registered)

Written and committed **before** any fit or score of this method. The rules below are not edited afterwards; results
are appended at the end.

## Why

Heavy rain is under-forecast (val frequency bias at ≥ 25 mm/day 0.79 / 0.49 / 0.31 at days 1 / 4 / 8). The kit's CSI
(tp > 10 mm/day, leads 1, 4, 8) earns 15 points at a CSI skill of 0.10; we are at 0.072 with the shock-preserving blend
(10.81 / 15). The blend also lowered tp's day-8 variance ratio to 0.460, close to the 0.4 anti-blur floor.

## Baseline

The shock-preserving blend of `docs/BLEND_DELTA.md` (e3_rainstab, rung-4 floor-0.3 artifact `b6d350bc…aab1c9`):
val 2020 S **58.85**, CSI 10.81, RMSE 24.10, anti-blur 10, causality 13.95.

## Method (primary)

After the shock-preserving blend and the usual clipping, rain (tp) is passed through an empirical quantile map:
for each lead day 1–10 and for land and sea separately, 101 forecast quantiles (0, 1, …, 100 %) are mapped to the
matching observed quantiles, with linear interpolation and a constant offset above the top quantile. Leads 11–14 and
all other channels are unchanged. The tables (2 × 10 × 2 × 101 numbers plus the land mask) are fitted on the blended,
unshocked forecasts of all 354 val 2020 windows against the truth (`python -m scripts.rain_qm`). The map is monotone and
the same function is applied to shocked and unshocked forecasts.

## Fallback (once)

If any gate below fails, the fallback is: the same shock-preserving blend with rain left unblended (rain model weight
1.0, `--pin-tp`), no quantile map. It is gated once with the same rules, except G6, which does not apply to it. If it
also fails, step 4 is recorded as tested, nothing ships, and the step-2 blend stays the candidate.

## Gates (against the step-2 baseline unless stated)

| Gate | Pass rule |
|---|---|
| G1 spread | warm_ocean and monsoon_stall "propagates" fraction each within 5 pp of the **unblended** model (97.7 % / 57.1 %); causality points within 1.0 of unblended (13.92). |
| G2 variance | Anti-blur 10/10; every channel's day-8 variance ratio in [0.4, 2.5]. |
| G3 null | Zero shock bit-identical to the unperturbed run. |
| G4 gain | S ≥ 58.85 + 0.5 **and** CSI points above 10.81. |
| G6 held-out | Fit on val windows whose first target day is in Jan–Jun, score the Jul–Dec windows, and the reverse. On **both** held-out halves, RMSE + CSI points with the map ≥ without it. Computed by `scripts/rain_qm.py`. |

**Follow-up.** After the gates are decided, the chosen setting is scored once on 2021. It does not change the decision.

**Shipping needs** the step-2 blend to ship first, the mentor's OK for an extra rain post-processing step, and Mass's
agreement. Nothing in the served path changes here.

## Results

(appended after scoring)
