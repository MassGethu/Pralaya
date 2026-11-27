# Paired forecast calibration

The bundle serves a 3-seed `e3_rainstab` ensemble (`a5b_ens3_resp0`, promoted 27 Nov; [evidence](EXPERIMENTS.md#a5b_ens3_resp0-result-passes-all-six-gates-promoted)). `model/bundle/ensemble.json` lists the members `pralaya.pt` (seed 0), `member_s1.pt` and `member_s2.pt`. `calibration.pt` is tied to the ensemble's fingerprint: the SHA-256 of the members' SHA-256s, in order (`model.calibration.bundle_fingerprint`). Both services load the calibration from the same bundle. A bundle containing only `pralaya.pt` uses the raw single model.

Prime is the mean of the three members' raw forecasts. For leads 1–10 it is blended toward a fitted seasonal reference and the last observed day. The seasonal coefficients use training years 2005–2019. The model weights vary by lead, channel and land/sea class and were fitted on 2020. Rainfall stays at weight 1. Branch adds **seed 0's** paired response, `seed-0 raw Branch − seed-0 raw Prime`, to calibrated Prime before physical clipping. The shock response is therefore the single model's. The neural rollout still receives the shock only once, on the last input day. A shocked request runs 5 rollouts and an unshocked request runs 3.

## Served release (`a5b_ens3_resp0`)

| Local kit proxy | Single calibrated, 2020 | **Served, 2020** | Single calibrated, 2021 | **Served, 2021** |
| --- | ---: | ---: | ---: | ---: |
| Overall score /70 | 57.92 | **65.92** | 56.92 | **64.93** |
| RMSE points /30 | 22.92 | 29.16 | 21.00 | 27.24 |
| Heavy-rain CSI points /15 | 11.07 | 12.79 | 11.84 | 13.58 |
| Anti-blur points /10 | 10 | 10 | 10 | 10 |
| Causality points /15 | 13.92 | 13.97 | 14.08 | 14.10 |
| Shock propagation, warm Bay / Arabian Sea wind | 97.7% / 57.1% | 97.7% / 57.6% | 96.9% / 60.6% | 96.9% / 60.9% |
| Shock stability, warm Bay / Arabian Sea wind | 92.9% / 94.9% | 93.5% / 96.0% | 95.8% / 97.7% | 96.3% / 98.0% |
| Day-8 windows with every channel in band | 0.870 | 0.858 | 0.856 | 0.844 |
| Day-8 rain variance ratio | 0.608 | 0.492 | 0.759 | 0.616 |

Paired per-window skill against the single calibrated model: +0.0250 [+0.0218, +0.0276] on 354 windows in 2020 and +0.0250 [+0.0219, +0.0285] on 353 windows in 2021 (block bootstrap). Invalid windows: 0. The calibration weights are fitted on 2020, so the 2020 score is partly in-sample; quote the 2021 follow-up (64.93) as the cleaner estimate. Local estimates use the organizer's scoring functions and the official kit's shock scales. Full reports: `evaluation/results/a5b/`.

Checks at promotion: 36 pytest, contract check, official schema validator and repo scan 15/15. Requests took 100–167 ms on an Apple M5 with 245 MB RSS. The served ensemble then passed its own four-core, 6 GiB ARM64 Linux container rehearsal with networking disabled and a read-only repository (only `/tmp` writable): `/health` was ready in 1.2 s, requests took 0.22–0.38 s, peak cgroup memory was 276 MB, and the official validator and repo scan (15/15) passed. A separate run of the same rehearsal, reported in the brief update `0240825`, took 0.32–0.59 s at 265 MiB peak. Native x86 timing has not been measured. The 2021 served report is `evaluation/results/a5b/served_test.json`; the brief's worked example (window ending 15 July 2021) is `evaluation/results/a5b/worked_example_2021-07-15.json`.

The averaged shock response (`a5_ens3`) was tested first and failed the pre-registered propagation gate (Arabian Sea wind −12.2 pp), which is why Branch keeps seed 0's response. The same result was found independently on `jarvis/blend-delta` ([ENSEMBLE.md](ENSEMBLE.md)).

## Earlier release decision (single calibrated `e3_rainstab`, 27 Nov 03:38, `cce926d`)

The earlier blend applied the calibration to both runs and damped the shock. Applying the full paired blend instead scored 58.85/70 on 2020, but the share of day-8 windows with every channel in the variance band fell by 3.8 percentage points. The release kept rain unchanged and retained the fitted non-rain weights. The fixed gate allowed a drop of at most two points in the in-band share. The selected configuration dropped 1.6 points and kept all six mean variance ratios in the kit band for 10/10 anti-blur points. It also passed the existing validity, forecast skill, rain, spread, stability and zero-shock checks.

| Local kit proxy | Raw 2020 | Calibrated 2020 | Raw 2021 | Calibrated 2021 |
| --- | ---: | ---: | ---: | ---: |
| Overall score /70 | 51.11 | 57.92 | 50.72 | 56.92 |
| Mean day-8 skill vs stronger baseline, per window | −0.068 | −0.012 | −0.072 | −0.018 |
| Heavy-rain CSI points /15 | 11.07 | 11.07 | 11.84 | 11.84 |
| Shock propagation, warm Bay / Arabian Sea wind | 97.7% / 57.1% | 97.7% / 57.1% | 96.9% / 60.6% | 96.9% / 60.6% |
| Shock stability, warm Bay / Arabian Sea wind | 92.9% / 94.9% | 92.9% / 94.9% | 95.8% / 97.7% | 95.8% / 97.7% |
| Invalid windows | 0 / 354 | 0 / 354 | 0 / 353 | 0 / 353 |

The four-core, 6 GiB ARM64 Linux rehearsal of that release passed with networking disabled and a read-only repository. The official validator passed; the eight-case check took 143–275 ms per request with 270 MiB peak cgroup memory, and the repo scan scored 15/15. The x86-64 image on this ARM Mac timed out under emulation; the uncalibrated raw model also took about 7.4 s per ten-day forward run under the same emulator. That release's `calibration.pt` had SHA-256 `63f66f445f85d33c72e08df774ffca97fed66bbc9f65cd434e5fbac27bda040e` (`b97d7d8`).

## Reproduce the served evaluation

```sh
python -m evaluation.evaluate --ckpt model/bundle/pralaya.pt --served --split val \
  --data /path/to/india_climate_train.nc --out /tmp/pralaya-calibrated-val.json
```

Keep the kit's `stats.json` at `../kit/stats.json` when running the evaluator so it uses the supplied shock scales. Pass `--split test` and a separate output file for the follow-up. The evaluator without `--served` scores the raw model. To compare two served bundles window by window, run `python scripts/paired_served_eval.py <release>/pralaya.pt <candidate>/pralaya.pt val /path/to/india_climate_train.nc`.

## Refit the calibration

The fit is the rung-4, floor-0.3 seasonal blend described in [CLIMBLEND.md](CLIMBLEND.md#e3_rainstab-refit-shipping-model-result--tested-not-shipped). Run it on the bundle so the rollouts are the ensemble mean (the cache directory must be outside the repository):

```sh
python scripts/clim_blend_experiment.py prepare --data /path/to/india_climate_train.nc \
  --stats /path/to/stats.json --output /path/to/blend-cache --ckpt model/bundle/pralaya.pt
python scripts/clim_blend_experiment.py val --rung 4 --floor 0.3 --data /path/to/india_climate_train.nc \
  --stats /path/to/stats.json --output /path/to/blend-cache --ckpt model/bundle/pralaya.pt
```

This writes `rung4_floor0.3.pt` and its report. Then pin both rain weights to 1 at every lead and bind the file to the bundle, from the repository root:

```sh
python - <<'EOF'
from pathlib import Path
import torch
from model.calibration import bundle_fingerprint

pack = torch.load("/path/to/blend-cache/rung4_floor0.3.pt", weights_only=True)
pack["alpha"][:, 1] = 1.0  # channel 1 is rain; keep it at the raw model's value
pack["checkpoint_sha256"] = bundle_fingerprint(Path("model/bundle"))
torch.save(pack, "model/bundle/calibration.pt")
EOF
```

The loader refuses a file whose rain weights are not 1 or whose fingerprint does not match the bundle. The fit report for the served file is `evaluation/results/a5b/fit_rung4_floor0.3_ens3.json`.

- `pralaya.pt` (seed 0) SHA-256 `90605130265bb9282ee0e2bdd5fec698c0f3ac4b2df8802f0a8be94eb68d88db`
- `member_s1.pt` SHA-256 `16eb4c26c50c99f05fecdbcac50798f74a3fc1998e7b065903ecb89e4d0641d1`
- `member_s2.pt` SHA-256 `560bbcc38aedf57f559b7ef74a7a5dbc9504a9b56cd85c39efada4a934a813b9`
- Ensemble fingerprint `42535a9847e9be44dd7a34f5bcd74fe406f150725e9e8b6b37c88fd9fb608e7d`
- `calibration.pt` SHA-256 `1f9d56217bf1bd5fc77de4d2626d13fbcc25f5103c7565ff0d28d0201bc96b3a`
