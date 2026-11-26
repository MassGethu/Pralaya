# Climatology blend for b3_roll4

The served model and checkpoint stay fixed. The blend uses a seasonal-mean prior fitted on 2005–2019 (7 coefficients per cell) for each weather channel. The coefficients describe a mean and three annual harmonics. Decode the request's last-input phase with `atan2` and advance it by one 365-day cycle step per lead. For leads 1–10, interpolate from that seasonal field (or the rung 4 reference) toward the raw model rollout with weight `a` in [0.3, 1]. Leads 11–14 use the original rollout. Apply the existing physical clipping after interpolation. The adapter applies the shock once, before the model rollout. Without `postprocess/clim_blend.pt`, the model takes the original inference path.

The official scoring reference uses the separate training-only, 15-day-smoothed kit climatology. The split selector keeps every input and target in its year. Half-year fitting and scoring count only windows contained entirely in the corresponding half. Full-year gates use all 354 validation windows, including those that straddle July 1. We use the kit-weighted skill for each window, averaged over channels and windows, and report pooled skill as context. CSI uses the mean of kit window skills at days 1, 4 and 8. The audit also records pooled CSI skills at each lead and both versions of day-1 25 mm/day CSI. The spatial variance gate requires every channel mean in [0.4, 2.5] and at least 90% of windows with all six channels in band. Bootstrap intervals resample paired consecutive windows in blocks of 10, with 2,000 draws. The target outcome also requires positive full-year skill at day 4 and day 8.

If no rung passes the release gates, choose one research candidate for the single test run using validation only. Rank by the number of passing validation checks, counting positive D4/D8 skill as one check. Break ties by the smaller of the two held-out D8 gains, then by earlier rung.

## Rung 1 rule

Fit latitude-weighted least-squares model weights for each lead and channel, bounded to [0.3, 1]. Keep rain at unity unless the fitted rain improves the fit-fold objective and passes the 10 mm/day and 25 mm/day CSI guards on that fold. The fitter considers shrinkage strengths 1, 0.75, 0.5 and 0.25 on the fitting windows, reverts day 1 to raw if needed, and selects by mean D4/D8 gain among tables that protect day 1. Evaluate each fitted table on the opposite half and fit once on the full validation year for the release gates.

### Rung 1 validation

| Scored windows | n | Raw skill D1 / D4 / D8 | Candidate skill D1 / D4 / D8 | Paired gain, 95% CI D1 / D4 / D8 |
|---|---:|---|---|---|
| Jan–Jun | 170 | +0.223 / -0.005 / -0.121 | +0.226 / +0.021 / -0.049 | [+0.002, +0.004] / [+0.017, +0.033] / [+0.052, +0.090] |
| Jul–Dec | 172 | +0.254 / +0.035 / -0.108 | +0.255 / +0.067 / -0.037 | [-0.002, +0.004] / [+0.022, +0.039] / [+0.043, +0.097] |
| Full year | 354 | +0.239 / +0.015 / -0.116 | +0.242 / +0.045 / -0.039 | [+0.001, +0.004] / [+0.024, +0.036] / [+0.061, +0.093] |

Pooled RMSE skill D1/D4/D8 was +0.299 / +0.092 / -0.058 → +0.302 / +0.113 / +0.004.
10 mm/day window CSI skill was +0.0710 → +0.0710. Pooled 10 mm/day CSI skills D1/D4/D8 were +0.176 / +0.094 / +0.007 → +0.176 / +0.094 / +0.007.
Day-1 25 mm/day CSI was 0.2705 → 0.2705 (window average) and 0.3691 → 0.3691 (pooled).
In channel order t2m, tp, u10, v10, msl, tcwv, mean day-8 variance ratios were 1.013 / 0.849 / 0.885 / 0.938 / 0.953 / 0.944 → 1.010 / 0.849 / 0.764 / 0.756 / 0.927 / 0.896.
All six channels were in band in 48.9% → 43.5% of windows. Across channel-window pairs the share was 89.9% → 87.6%. Rain was in band in 54.0% → 54.0% of windows.

| Shock | Nonzero | Localized | Propagates | Stable |
|---|---:|---:|---:|---:|
| warm_ocean | 354 → 354 | 354 → 354 | 334 → 321 | 303 → 303 |
| monsoon_stall | 354 → 354 | 354 → 354 | 227 → 178 | 317 → 317 |

Shock counts are out of 354. Zero shock was bit-identical. Full-year shrinkage strength was 1 and first-lead persistence level was 0.

**Result:** half-year skill passed, positive full-year D4/D8 skill failed, rain CSI passed, variance failed, causality failed.

## Rung 2 rule

Fit latitude-weighted least-squares weights separately for ocean and land (land fraction at least 0.5), for each lead and channel, bounded to [0.3, 1]. Compare shrinkage strengths 1, 0.75, 0.5 and 0.25 on the fitting fold, ranked by average D4/D8 gain among tables that protect day 1. Rain requires lower fit-fold MSE and both CSI guards to keep its fitted weights. If a per-lead fit fails the day-1 guard, retain the raw day-1 forecast. Apply the same rules to both cross-fits and the full-year fit.

### Rung 2 validation

| Scored windows | n | Raw skill D1 / D4 / D8 | Candidate skill D1 / D4 / D8 | Paired gain, 95% CI D1 / D4 / D8 |
|---|---:|---|---|---|
| Jan–Jun | 170 | +0.223 / -0.005 / -0.121 | +0.226 / +0.021 / -0.049 | [+0.002, +0.004] / [+0.018, +0.033] / [+0.052, +0.090] |
| Jul–Dec | 172 | +0.254 / +0.035 / -0.108 | +0.257 / +0.069 / -0.037 | [-0.000, +0.005] / [+0.024, +0.041] / [+0.043, +0.096] |
| Full year | 354 | +0.239 / +0.015 / -0.116 | +0.243 / +0.046 / -0.038 | [+0.002, +0.005] / [+0.026, +0.037] / [+0.062, +0.093] |

Pooled RMSE skill D1/D4/D8 was +0.299 / +0.092 / -0.058 → +0.303 / +0.114 / +0.005.
10 mm/day window CSI skill was +0.0710 → +0.0710. Pooled 10 mm/day CSI skills D1/D4/D8 were +0.176 / +0.094 / +0.007 → +0.176 / +0.094 / +0.007.
Day-1 25 mm/day CSI was 0.2705 → 0.2705 (window average) and 0.3691 → 0.3691 (pooled).
In channel order t2m, tp, u10, v10, msl, tcwv, mean day-8 variance ratios were 1.013 / 0.849 / 0.885 / 0.938 / 0.953 / 0.944 → 1.009 / 0.849 / 0.767 / 0.758 / 0.925 / 0.896.
All six channels were in band in 48.9% → 43.8% of windows. Across channel-window pairs the share was 89.9% → 87.8%. Rain was in band in 54.0% → 54.0% of windows.

| Shock | Nonzero | Localized | Propagates | Stable |
|---|---:|---:|---:|---:|
| warm_ocean | 354 → 354 | 354 → 354 | 334 → 321 | 303 → 303 |
| monsoon_stall | 354 → 354 | 354 → 354 | 227 → 176 | 317 → 317 |

Shock counts are out of 354. Zero shock was bit-identical. Full-year shrinkage strength was 1 and first-lead persistence level was 0.

**Result:** half-year skill passed, positive full-year D4/D8 skill failed, rain CSI passed, variance failed, causality failed.

## Rung 3 rule

Use regional exponential weights a(k) = exp(-k·rate), with one nonnegative rate per channel and region. Fit the latitude-weighted sum of squared errors over ten leads. The grid includes rate zero and 300 log-spaced rates from 0.001 up to −log(0.3)/10. The upper bound keeps every model weight at or above 0.3. The fitting-fold strength grid scales the rates and preserves the exponential form. The CSI guard still applies to rain. Rank by the same day-1 and D4/D8 rule. Disable the day-1 override to preserve the exponential profile.

### Rung 3 validation

| Scored windows | n | Raw skill D1 / D4 / D8 | Candidate skill D1 / D4 / D8 | Paired gain, 95% CI D1 / D4 / D8 |
|---|---:|---|---|---|
| Jan–Jun | 170 | +0.223 / -0.005 / -0.121 | +0.224 / +0.022 / -0.051 | [-0.002, +0.003] / [+0.018, +0.035] / [+0.052, +0.087] |
| Jul–Dec | 172 | +0.254 / +0.035 / -0.108 | +0.246 / +0.066 / -0.034 | [-0.014, -0.003] / [+0.019, +0.039] / [+0.049, +0.096] |
| Full year | 354 | +0.239 / +0.015 / -0.116 | +0.238 / +0.046 / -0.040 | [-0.005, +0.001] / [+0.024, +0.037] / [+0.062, +0.091] |

Pooled RMSE skill D1/D4/D8 was +0.299 / +0.092 / -0.058 → +0.298 / +0.113 / +0.004.
10 mm/day window CSI skill was +0.0710 → +0.0710. Pooled 10 mm/day CSI skills D1/D4/D8 were +0.176 / +0.094 / +0.007 → +0.176 / +0.094 / +0.007.
Day-1 25 mm/day CSI was 0.2705 → 0.2705 (window average) and 0.3691 → 0.3691 (pooled).
In channel order t2m, tp, u10, v10, msl, tcwv, mean day-8 variance ratios were 1.013 / 0.849 / 0.885 / 0.938 / 0.953 / 0.944 → 1.009 / 0.849 / 0.776 / 0.773 / 0.926 / 0.902.
All six channels were in band in 48.9% → 44.6% of windows. Across channel-window pairs the share was 89.9% → 88.1%. Rain was in band in 54.0% → 54.0% of windows.

| Shock | Nonzero | Localized | Propagates | Stable |
|---|---:|---:|---:|---:|
| warm_ocean | 354 → 354 | 354 → 354 | 334 → 324 | 303 → 303 |
| monsoon_stall | 354 → 354 | 354 → 354 | 227 → 182 | 317 → 317 |

Shock counts are out of 354. Zero shock was bit-identical. Full-year shrinkage strength was 1 and first-lead persistence level was 0.

**Result:** half-year skill failed, positive full-year D4/D8 skill failed, rain CSI passed, variance failed, causality failed.

## Rung 4 rule

Fit a decaying persistence share in the blend reference. Compare first-day shares 0.25, 0.5, 0.75 and 1 on the fitting fold, and taper linearly to zero on day 9. Fit the regional lead/channel weights against each mixture of persistence and the seasonal-mean prior, with the same 0.3 floor and rain and day-1 guards as rung 2. Choose the mix and shrinkage strength by fit-fold D4/D8 skill. In a shocked request, persistence takes the adapter’s already-perturbed last input state.

### Rung 4 validation

| Scored windows | n | Raw skill D1 / D4 / D8 | Candidate skill D1 / D4 / D8 | Paired gain, 95% CI D1 / D4 / D8 |
|---|---:|---|---|---|
| Jan–Jun | 170 | +0.223 / -0.005 / -0.121 | +0.228 / +0.024 / -0.044 | [+0.003, +0.006] / [+0.020, +0.036] / [+0.058, +0.096] |
| Jul–Dec | 172 | +0.254 / +0.035 / -0.108 | +0.262 / +0.071 / -0.011 | [+0.006, +0.010] / [+0.025, +0.046] / [+0.074, +0.120] |
| Full year | 354 | +0.239 / +0.015 / -0.116 | +0.245 / +0.050 / -0.033 | [+0.005, +0.007] / [+0.029, +0.042] / [+0.067, +0.099] |

Pooled RMSE skill D1/D4/D8 was +0.299 / +0.092 / -0.058 → +0.303 / +0.116 / +0.009.
10 mm/day window CSI skill was +0.0710 → +0.0710. Pooled 10 mm/day CSI skills D1/D4/D8 were +0.176 / +0.094 / +0.007 → +0.176 / +0.094 / +0.007.
Day-1 25 mm/day CSI was 0.2705 → 0.2705 (window average) and 0.3691 → 0.3691 (pooled).
In channel order t2m, tp, u10, v10, msl, tcwv, mean day-8 variance ratios were 1.013 / 0.849 / 0.885 / 0.938 / 0.953 / 0.944 → 1.009 / 0.849 / 0.759 / 0.751 / 0.923 / 0.895.
All six channels were in band in 48.9% → 44.1% of windows. Across channel-window pairs the share was 89.9% → 87.6%. Rain was in band in 54.0% → 54.0% of windows.

| Shock | Nonzero | Localized | Propagates | Stable |
|---|---:|---:|---:|---:|
| warm_ocean | 354 → 354 | 354 → 354 | 334 → 317 | 303 → 303 |
| monsoon_stall | 354 → 354 | 354 → 354 | 227 → 173 | 317 → 317 |

Shock counts are out of 354. Zero shock was bit-identical. Full-year shrinkage strength was 1 and first-lead persistence level was 0.5.

**Result:** half-year skill passed, positive full-year D4/D8 skill failed, rain CSI passed, variance failed, causality failed.

## Frozen setting and verdict

**NOT PROMOTED.** All four rungs with the 0.3 floor failed validation. Rung 4 passed two of five validation checks, tied with rungs 1 and 2, and had the largest minimum held-out D8 gain (+0.07638). The default blend path remains empty.

Frozen artifact SHA-256 is `8123899396eeed71d2b7acae521d8e279cd3c39e67534589d18aaa7c25972d93` (391,433 bytes). The shipped model SHA-256 is `20ebabfda43bbc40b61989a4d75eadfd9e05abe273fae4ff661cee841b39b4e4`.

### Full model-weight table

Each cell gives ocean / land. Weights are shown to six decimal places. The persistence column gives the share of the last input in the blend reference.

| Day | t2m | tp | u10 | v10 | msl | tcwv | Persistence |
|---:|---|---|---|---|---|---|---:|
| 1 | 0.471807 / 0.886229 | 1.000000 / 1.000000 | 0.963034 / 0.924207 | 0.928441 / 0.893709 | 0.890767 / 0.939985 | 0.984849 / 0.964946 | 0.5000 |
| 2 | 0.328426 / 0.778078 | 1.000000 / 1.000000 | 0.872645 / 0.846926 | 0.884885 / 0.812307 | 0.807800 / 0.839005 | 0.931310 / 0.884446 | 0.4375 |
| 3 | 0.300000 / 0.645819 | 1.000000 / 1.000000 | 0.769153 / 0.737218 | 0.824023 / 0.733833 | 0.752161 / 0.765896 | 0.836291 / 0.788793 | 0.3750 |
| 4 | 0.300000 / 0.532833 | 1.000000 / 1.000000 | 0.672263 / 0.640286 | 0.724030 / 0.633633 | 0.720605 / 0.704271 | 0.712176 / 0.700801 | 0.3125 |
| 5 | 0.300000 / 0.452336 | 1.000000 / 1.000000 | 0.559984 / 0.521124 | 0.610260 / 0.509452 | 0.649523 / 0.611549 | 0.585696 / 0.623225 | 0.2500 |
| 6 | 0.300000 / 0.406260 | 1.000000 / 1.000000 | 0.477089 / 0.401592 | 0.509093 / 0.397727 | 0.558393 / 0.563212 | 0.468269 / 0.525181 | 0.1875 |
| 7 | 0.300000 / 0.372498 | 1.000000 / 1.000000 | 0.401960 / 0.305762 | 0.417672 / 0.300000 | 0.470825 / 0.516654 | 0.371700 / 0.420265 | 0.1250 |
| 8 | 0.300000 / 0.352303 | 1.000000 / 1.000000 | 0.376943 / 0.300000 | 0.333033 / 0.300000 | 0.408534 / 0.485940 | 0.311840 / 0.323006 | 0.0625 |
| 9 | 0.300000 / 0.347623 | 1.000000 / 1.000000 | 0.386159 / 0.300000 | 0.300000 / 0.300000 | 0.355626 / 0.427931 | 0.304654 / 0.300000 | 0.0000 |
| 10 | 0.300000 / 0.310962 | 1.000000 / 1.000000 | 0.355858 / 0.300000 | 0.300000 / 0.300000 | 0.300000 / 0.300000 | 0.312789 / 0.300000 | 0.0000 |

## 2021 holdout

The single 2021 run covered 353 windows. It had finished before the minimum model weight was added. The pre-floor candidate had 21 of 120 model weights below 0.3. We froze the revised candidate using 2020 alone before opening the pre-floor report. At the owner's direction, the revised candidate was left unscored on 2021.

| Split and comparison | Day 1 | Day 4 | Day 8 |
|---|---:|---:|---:|
| 2021 raw b3_roll4 | +0.238 | +0.004 | −0.112 |
| 2021 superseded pre-floor rung 4 | +0.243 | +0.036 | −0.032 |
| 2021 paired gain, 95% block-bootstrap CI | [+0.004, +0.007] | [+0.026, +0.038] | [+0.064, +0.097] |
| 2021 revised rung 4, with the 0.3 floor | Unscored | Unscored | Unscored |

In the superseded comparison, 10 mm/day CSI skill was 0.0808 for both rollouts, and day-1 25 mm/day CSI was 0.2488 for both (window average). The share of windows with all six day-8 variance ratios in band was 53.8% raw and 46.7% blended. Shock gates were evaluated on 2020 only.

## Release checks

With the frozen revised artifact temporarily installed, `python tests/test_contract.py` passed and pytest reported 34 passed. The kit validator on port 8020 reported health OK and all six schema cases passed. The kit repo scan returned 15.0/15 with no flags. Ten canonical 10-step HTTP calls took a median of 56.6 ms and a maximum of 59.3 ms with four Torch CPU threads. The artifact was removed and the server stopped. The default-path check exercises the actual checkpoint and compares output bytes to the original clipping path at 1, 10 and 14 steps.

## Limitations

- On 2020, all four candidates reduced day-8 error but still trailed the better reference on average by window. The pooled day-8 result for revised rung 4 was +0.009. Pooled skill weights large errors differently and cannot establish that the average window beats the baselines.
- The raw model met the all-channel variance band in 48.9% of 2020 windows. Every fitted rain weight stayed at unity under the CSI guard, and rain alone was in band in 54.0% of windows. The revised setting reached 44.1% for all six channels and also lost coverage when counting channel-window pairs.
- Both shock responses stayed nonzero, localized and equally stable. The raw model propagated each shock more often. The blend shrinks later model anomalies, including along paths where the kit measures outward response energy. This test covers the two kit perturbations and the supplied weather windows.
- The half-year checks span different monsoon regimes in one validation year. The block intervals account for overlapping windows but cannot establish performance across years. The request phase has no year, so we follow the kit's 365-day convention for all requests.

## Reproduce validation

Install the training dependencies and the verified v1.0.0 kit wheel. Use the external dataset and stats paths. Write the fit outputs to a directory outside the repository. The `prepare` phase reads the 2005–2019 and 2020 weather fields. The `val` phase reuses those prepared inputs and never opens the 2021 weather fields.

```sh
data=/path/to/india_climate_train.nc
stats=/path/to/stats.json
results=$(mktemp -d)
python -m scripts.clim_blend_experiment prepare --data "$data" --stats "$stats" --output "$results"
for rung in 1 2 3 4; do
  python -m scripts.clim_blend_experiment val --data "$data" --stats "$stats" --output "$results" --rung "$rung"
done
```

The chosen research setting is `rung4.pt`. It contains the seven coefficients per cell and channel, the model-weight table, the land mask, and the persistence weights. The default path is empty on this branch.
