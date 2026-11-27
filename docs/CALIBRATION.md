# Paired forecast calibration

The bundle contains the seed-0 `e3_rainstab` weights and a separate `calibration.pt` tied to the weights' SHA-256. Both services load the calibration from the same bundle. A bundle containing only the checkpoint uses the raw model.

For leads 1–10, Prime blends the raw forecast toward a fitted seasonal reference and the last observed day. The seasonal coefficients use training years 2005–2019. The model weights vary by lead, channel and land/sea class and were fitted on 2020. Rainfall stays at weight 1. Branch adds the raw model's paired response, `raw Branch − raw Prime`, to calibrated Prime before physical clipping. The neural rollout still receives the shock only once, on the last input day.

## Release decision

The earlier blend applied the calibration to both runs and damped the shock. Applying the full paired blend instead scored 58.85/70 on 2020, but the share of day-8 windows with every channel in the variance band fell by 3.8 percentage points. The release keeps rain unchanged and retains the fitted non-rain weights. The fixed gate allowed a drop of at most two points in the in-band share. The selected configuration dropped 1.6 points and kept all six mean variance ratios in the kit band for 10/10 anti-blur points. It also passed the existing validity, forecast skill, rain, spread, stability and zero-shock checks.

| Local kit proxy | Raw 2020 | Served 2020 | Raw 2021 | Served 2021 |
| --- | ---: | ---: | ---: | ---: |
| Overall score /70 | 51.11 | **57.92** | 50.72 | **56.92** |
| Mean day-8 skill vs stronger baseline, per window | −0.068 | −0.012 | −0.072 | −0.018 |
| Heavy-rain CSI points /15 | 11.07 | 11.07 | 11.84 | 11.84 |
| Shock propagation, warm Bay / Arabian Sea wind | 97.7% / 57.1% | 97.7% / 57.1% | 96.9% / 60.6% | 96.9% / 60.6% |
| Shock stability, warm Bay / Arabian Sea wind | 92.9% / 94.9% | 92.9% / 94.9% | 95.8% / 97.7% | 95.8% / 97.7% |
| Invalid windows | 0 / 354 | 0 / 354 | 0 / 353 | 0 / 353 |

The 2020 sample includes all 354 validation windows. The 353 test windows from 2021 were scored after selection as a follow-up. Local estimates use the organizer's scoring functions and the official kit's shock scales.

The four-core, 6 GiB ARM64 Linux rehearsal passed with networking disabled and a read-only repository. The official validator passed; the eight-case check took 143–275 ms per request with 270 MiB peak cgroup memory, and the repo scan scored 15/15. The x86-64 image on this ARM Mac timed out under emulation; the uncalibrated raw model also took about 7.4 s per ten-day forward run under the same emulator. Native x86 performance has not been measured.

## Reproduce the served evaluation

```sh
python -m evaluation.evaluate --ckpt model/bundle/pralaya.pt --served --split val \
  --data /path/to/india_climate_train.nc --out /tmp/pralaya-calibrated-val.json
```

Keep the kit's `stats.json` at `../kit/stats.json` when running the evaluator so it uses the supplied shock scales. Pass `--split test` and a separate output file for the follow-up. The evaluator without `--served` scores the raw model.

The existing fit is documented in [the seasonal blend experiment](https://github.com/MassGethu/Pralaya/blob/bd573d1/docs/CLIMBLEND.md#e3_rainstab-refit-shipping-model-result--tested-not-shipped). The release uses its floor-0.3 harmonic coefficients, persistence weights and non-rain weights, pins both rain weights to 1 at every lead and binds the file to the bundled checkpoint hash.

- `pralaya.pt` SHA-256 `90605130265bb9282ee0e2bdd5fec698c0f3ac4b2df8802f0a8be94eb68d88db`
- `calibration.pt` SHA-256 `63f66f445f85d33c72e08df774ffca97fed66bbc9f65cd434e5fbac27bda040e`
