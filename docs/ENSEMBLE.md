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

## Results

(appended after scoring)
