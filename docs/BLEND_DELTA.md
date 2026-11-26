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

## Results — G1–G4 PASS at floor 0.3 (G5 and approvals pending; not shipped)

Scored 27 Nov 03:44–03:47 IST on all 354 val 2020 windows, both kit shocks on every window. The refit is byte-identical
to Mass's frozen floor-0.3 artifact (sha256 `b6d350bceb3573652f955cae0b84cba678874efa33c7fcc1144a28d849aab1c9`), so it
is the same blend that failed G1 in `docs/CLIMBLEND.md`; only the shocked path differs. The unblended row reproduces
the recorded val S 51.11. Reports: `evaluation/results/blend_delta/`.

| Val 2020 | Unblended | Rung-4 blend (CLIMBLEND, failed) | Shock-preserving blend |
|---|---|---|---|
| S / 70 | 51.11 | 58.31 | **58.85** |
| RMSE / 30 | 16.11 | — | 24.10 |
| CSI / 15 | 11.07 | — | 10.81 |
| Anti-blur / 10 | 10.0 | 10.0 | 10.0 |
| Causality / 15 | 13.92 | 13.41 | 13.95 |

| Gate | Result |
|---|---|
| G1 spread | warm_ocean propagates 97.7% → 97.7% (0.0 pp); monsoon_stall 57.1% → 57.3% (+0.3 pp); causality points +0.03. **PASS** |
| G2 variance | anti-blur 10/10; day-8 ratios t2m 1.008, tp 0.460, u10 0.741, v10 0.734, msl 0.948, tcwv 0.885, all in [0.4, 2.5]. **PASS** |
| G3 null | zero shock bit-identical to the unperturbed run in the evaluator. **PASS** |
| G4 gain | +7.75 S. **PASS** |
| G5 cost | not yet checked: needs the serving change in `inference_adapter.py`, which waits for Mass and the mentor. |

The fallback (floor 0.5) was not needed and was not run.

**Follow-up, 2021 (scored once, after the gates were decided; does not change the decision):** unblended S 50.72,
shock-preserving blend S **57.49** (+6.77). Propagates 96.9% / 60.6% unblended vs 96.9% / 60.9% blended; anti-blur 10/10;
null bit-identical; tp day-8 variance ratio 0.759 → 0.591.

**Risks, stated plainly.**
- tp's day-8 variance ratio on val is 0.460, close to the 0.4 floor. If the hidden 2023–24 windows push it below 0.4, part
  of the anti-blur points would be lost. In 2021 it was 0.591. The share of windows with all six ratios in band falls
  from 88.5% to 84.7% on val.
- CSI points fall slightly (val 11.07 → 10.81, 2021 11.84 → 11.43): blending rain toward the seasonal normal costs some
  heavy-rain hits. The RMSE gain is far larger.
- A shocked request runs the model twice. G5 measures that cost once the serving change exists.
- The served-adapter version of G3 (as in `tests/test_clim_blend.py`) is not yet written.
