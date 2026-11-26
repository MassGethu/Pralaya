# Shock-preserving climatology blend (round 3, pre-registered)

Written and committed **before** any score of this method was computed. The rules below are not edited afterwards;
results are appended at the end.

## Why

The rung-4 climatology blend (`docs/CLIMBLEND.md`) raised val S from 51.11 to 58.3 on e3_rainstab but failed gate G1:
blending the shocked forecast toward the seasonal normal also shrinks the shock's own effect, so fewer shocks spread
outward (warm_ocean 97.7% → 82.8%, monsoon_stall 57.1% → 34.7%). That is the mentor's point 1 ("more weight on the
seasonal part weakens the shock").

## Method

Same model (`e3_rainstab`, bundle sha256 `90605130…68d88db`) and the same rung-4 blend artifact at floor 0.3, refitted
with Mass's unchanged code (`scripts/clim_blend_experiment.py prepare` then `val --rung 4 --floor 0.3`). If the refit
is not byte-identical to Mass's frozen artifact (sha256 `b6d350bc…aab1c9`), both hashes are recorded and the refit is used.

Only the way a shocked request is answered changes:

- **No shock, or an all-zero shock:** `out = clip(blend(raw(history), last))`, exactly as in `docs/CLIMBLEND.md`.
- **Nonzero shock:** run the model twice, `base = raw(history)` and `shocked = raw(history with the shock)`, then
  `out = clip(blend(base, last) + (shocked − base))`. The seasonal correction is applied to the unshocked state only;
  the shock's effect is the model's own response, not shrunk.

`last` is always the unperturbed last input day. Scoring wraps the forecaster in `scripts/blend_delta_score.py`, which
reuses `evaluation/evaluate.py` (kit `monsoon_r1.scoring`) unchanged on all 354 val 2020 windows, both kit shocks on
every window.

## Gates (same thresholds as `docs/CLIMBLEND.md`, plus G5)

| Gate | Pass rule |
|---|---|
| G1 spread | For warm_ocean and monsoon_stall, the "propagates" fraction drops by at most 5 percentage points versus the unblended model; total causality points drop by at most 1.0. |
| G2 variance | Kit anti-blur stays 10/10; every channel's day-8 variance ratio is in [0.4, 2.5]. |
| G3 null | A zero perturbation gives output bit-identical to the unperturbed run. |
| G4 gain | Blended S ≥ unblended S + 1.0 on val 2020. |
| G5 cost | A shocked 14-step call (two model runs) takes under 1.0 s in the offline 4-CPU container. Checked only if G1–G4 pass, once the serving change exists. |

G1 is expected to pass almost by construction, because the shocked-minus-unshocked difference equals the raw model's
except where clipping (rain ≥ 0, t2m range) cuts it. That is the point of the method, not a loophole: the gate still
checks it on every window.

**Fallback.** If any of G1–G4 fails at floor 0.3, refit once at floor 0.5 and re-check all gates once. If a gate still
fails, the method is recorded as tested, not shipped.

**Follow-up.** Only after the gates are decided, the frozen setting is scored once on 2021 as a follow-up. It does not
change the decision.

**Shipping needs, in addition to passing:** the mentor's OK for the two-run shocked path, and Mass's agreement, since the
serving change goes in `inference_adapter.py`. Until then nothing in the served path changes.

## Results

(appended after scoring)
