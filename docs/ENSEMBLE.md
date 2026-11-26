# 3-seed ensemble + shock-preserving blend (round 5, pre-registered)

Written and committed **before** any fit or score of the ensemble. The rules below are not edited afterwards; results
are appended at the end.

## Why

Averaging independently trained seeds usually lowers RMSE. The risks are smoother fields (anti-blur, tp variance is
already 0.460 with the blend) and a weaker shock response.

## Members

The three e3_rainstab seeds from round 2 (`docs/EXPERIMENTS.md`, rule 5), same architecture and recipe:

| Seed | Checkpoint (gitignored `runs/`) | sha256 |
|---|---|---|
| 0 (shipped bundle) | `runs/e3_rainstab/best.pt` | `90605130265bb9282ee0e2bdd5fec698c0f3ac4b2df8802f0a8be94eb68d88db` |
| 1 | `runs/e3_rainstab_s1/best.pt` | `16eb4c26c50c99f05fec…` (full hash in the results) |
| 2 | `runs/e3_rainstab_s2/best.pt` | `560bbcc38aedf57f559b…` (full hash in the results) |

## Method

The ensemble forecast is the mean of the three members' own 10-day rollouts (each member rolls out autoregressively),
for shocked and unshocked requests alike (`scripts/ensemble.py`). The rung-4 blend is **refitted on the ensemble's
rollouts** with Mass's unchanged code at floor 0.3 (a blend fitted on one model is never used with another), then
applied in the shock-preserving way of `docs/BLEND_DELTA.md`. Scoring is `evaluation/evaluate.py` unchanged, all 354
val 2020 windows, both kit shocks on every window. The unblended ensemble is also scored, for context only.

## Gates (candidate = ensemble + shock-preserving blend)

| Gate | Pass rule |
|---|---|
| G1 spread | warm_ocean and monsoon_stall "propagates" each within 5 pp of the unblended shipped model (97.7 % / 57.1 %); causality points within 1.0 of it (13.92). |
| G2 variance | Anti-blur 10/10; every channel's day-8 variance ratio in [0.4, 2.5]. |
| G3 null | Zero shock bit-identical to the unperturbed run. |
| G4 gain | S ≥ 58.85 + 0.5, i.e. beats the single-model shock-preserving blend (step 2) by at least 0.5. |
| G5 cost | Checked only if G1–G4 pass and the serving change exists: a shocked 14-step call (six member rollouts) under 1.0 s in the offline 4-CPU container. |

**Fallback (once).** If any of G1–G4 fails at floor 0.3, refit at floor 0.5 and re-check all gates once. If a gate
still fails, the ensemble is recorded as tested, not shipped, and the step-2 single-model blend stays the candidate.

**Follow-up.** Only if a setting passes, it is scored once on 2021; that does not change the decision.

**Shipping needs** the same approvals as step 2 (mentor, Mass) plus bundling two more checkpoints (≈ 3.5 MB each).

## Results — TESTED, NOT SHIPPED (G1 fails at floor 0.3 and at the 0.5 fallback)

Scored 27 Nov 04:20–04:33 IST on all 354 val 2020 windows, both kit shocks on every window. Full member hashes:
seed 1 `16eb4c26c50c99f05fecdbcac50798f74a3fc1998e7b065903ecb89e4d0641d1`, seed 2
`560bbcc38aedf57f559b7ef74a7a5dbc9504a9b56cd85c39efada4a934a813b9`. Refitted blend artifacts (outside the repo): floor 0.3
`8dec0557d80d4fe11f351e7d7edf3b76426bd35818b8a89ba8b28ab9353b494e`, floor 0.5
`860b526579b47a08d8464028ff37308466f6fc09542f90e4b4682b4800e25e31`. Reports: `evaluation/results/ensemble/`.

| Val 2020 | Shipped seed 0 | Step-2 blend | Ensemble, unblended (context) | Ensemble + blend, floor 0.3 | Floor 0.5 (fallback) |
|---|---|---|---|---|---|
| **S / 70** | 51.11 | 58.85 | 62.66 | **65.82** | 65.80 |
| RMSE / 30 | 16.11 | 24.10 | 26.00 | 29.16 | 29.14 |
| CSI / 15 | 11.07 | 10.81 | 12.79 | 12.79 | 12.79 |
| Anti-blur / 10 | 10.0 | 10.0 | 10.0 | 10.0 | 10.0 |
| Causality / 15 | 13.92 | 13.95 | 13.87 | 13.87 | 13.87 |
| Propagates warm_ocean / monsoon_stall | 97.7 % / 57.1 % | 97.7 % / 57.3 % | 95.5 % / 44.9 % | 95.5 % / 44.9 % | 95.5 % / 44.9 % |
| tp day-8 variance ratio | 0.608 | 0.460 | 0.492 | 0.492 | 0.492 |
| Mean RMSE skill per window | 0.064 | 0.096 | 0.104 | 0.117 | — |

| Gate | Floor 0.3 | Floor 0.5 |
|---|---|---|
| G1 spread | warm_ocean −2.2 pp (ok), monsoon_stall −12.2 pp, causality −0.06 (ok). **FAIL** | same. **FAIL** |
| G2 variance | 10/10, lowest tp 0.492. PASS | 10/10, lowest tp 0.492. PASS |
| G3 null | bit-identical. PASS | bit-identical. PASS |
| G4 gain | +6.97 over step 2. PASS | +6.95. PASS |

**Why G1 fails.** The ensemble itself, not the blend: the unblended ensemble already propagates the monsoon_stall shock
in only 44.9 % of windows. The three seeds move the stall's effect differently, so their average partly cancels. The
shock-preserving blend leaves the shock effect untouched, so the floor cannot change it (the fallback was expected to
fail the same way and did). The refitted blend left rain unblended (CSI and tp variance equal to the unblended ensemble).

**What this does and does not mean.** The kit's own causality points barely move (−0.06); the failure is our stricter
pre-registered spread rule, taken from the mentor's point 1. Shipping the ensemble anyway would be a new decision that
changes a rule after seeing the result; it would need the mentor and Mass, and must be recorded as such, not as a pass.
Following the stop rule, 2021 was not scored.
