# PRALAYA inference and dashboard contract

The organizer problem statement sets the submission rules. The v1.0.0 release contract defines the API and is byte-identical to the GitHub addendum. The wheel, release contract, dataset and `stats.json` match `SHA256SUMS.txt`. [Organizer release](https://github.com/OfficialAbhinavSingh/yug-monsoon-kit/releases/tag/v1.0.0) · [Round 1 addendum](https://github.com/OfficialAbhinavSingh/yug-monsoon-kit/blob/main/docs/R1_CONTRACT.md)

## Official API

Start from the repository root with `python serve.py --port 8000`. The listener binds to `0.0.0.0`. `POST /health` returns HTTP 200 with `{"status":"ready","model_name":"PRALAYA"}` after a CPU load and a successful ten-step warm-up. The grader polls every two seconds for up to 120 seconds.

| `POST /simulate` field | Shape | Meaning |
| --- | --- | --- |
| `init_states` | `[3,6,32,36]` | Three consecutive days, oldest first, in raw physical units |
| `doy_sincos` | `[2]` | `[sin(2πdoy/365), cos(2πdoy/365)]` for the last input day |
| `steps` | Integer | Requested lead count. The scored run requests 10. The wheel defines a maximum of 14. |
| `perturbation` | `null` or `[6,32,36]` | Physical delta applied once to the last day of this request's history |

The response has `rollout` with shape `[steps,6,32,36]` and finite numeric `inference_ms`. Index 0 is the day after the final input. The physical wire format is nested JSON numbers. The official schema validator additionally sends `init_states` and `perturbation` as `{"b64": "…", "shape": […]}` containing little-endian float32 values. The server accepts both input encodings and returns lists.

| Index | Channel | Unit |
| --- | --- | --- |
| 0 | `t2m` | K |
| 1 | `tp` | mm/day |
| 2 | `u10` | m/s, eastward component |
| 3 | `v10` | m/s, northward component |
| 4 | `msl` | Pa |
| 5 | `tcwv` | kg/m² |

Array index `[row, col]` has centre coordinates `lat = 6.5 + row` and `lon = 65.5 + col`, in degrees. Latitude increases south to north through 37.5°N and longitude west to east through 100.5°E. Both static fields use the same grid, in order `land_sea_mask`, `orography_m`. Daily precipitation is a sum in mm/day. The other dynamic channels are daily means of four UTC samples.

The downloaded NetCDF matches these coordinates and both channel orders. It contains float32 `data(time, channel, lat, lon)` and `static(static_channel, lat, lon)`, with 6,209 days on a proleptic Gregorian calendar through 31 December 2021. Both arrays have NaN fill sentinels, with zero nonfinite values in the file. The land–sea mask ranges from 0 to 1 and orography from about −0.156 to 5283.937 m. Compare the extracted bundle arrays against these source arrays after any model preprocessing.

The adapter rejects nonfinite forecasts. For finite forecasts it clips rain to at least 0 mm/day and `t2m` to `233.15–333.15` K, with a warning that counts clipped cells by channel. Team regressions require exact equality of the `rollout` between `null` and all-zero shock, and of Prime when requested again after Branch. The addendum states normalized zero-shock error below `1e-3`. The kit's helper accepts `≤ 1e-3`. Exact equality satisfies both.

The release contract names `inference_ms` without defining its boundary. The starter starts the timer before reading the JSON body and stops after converting the forecast to lists, before encoding the HTTP response. PRALAYA follows that convention. The separate client timing includes request encoding, server response encoding and reading the response body. Each of the eight ten-step calls has a 5-second wall-time limit, with no retries or redirects and under 80 MB per response.

The addendum includes public-address and 48-hour hosting guidance alongside the default offline execution instructions. The problem statement and release both specify offline launch from the repo and no required public inference URL. The local validator permits loopback. The evaluator has 4 CPU cores, 6 GB RAM, no GPU and a read-only repo with writes confined to `/tmp`. Available inference libraries include CPU PyTorch, NumPy, SciPy, pandas, xarray, scikit-learn, LightGBM, ONNX Runtime, FastAPI, Flask and Uvicorn. The addendum also lists Gunicorn. PRALAYA's HTTP layer uses NumPy, FastAPI and Uvicorn.

## Model handoff to Jarvis

Target `jarvis/model`. Provide a CPU-loadable checkpoint with the commit SHA, checkpoint ID and exact load command. The loader interface, perturbation ownership and seasonal convention below are confirmed.

- `model/inference.py` exports `load_cpu(bundle_dir: pathlib.Path)`. It wraps `model.Forecaster` and returns `forecast(history, doy_sincos, steps)`. The default checkpoint is `model/bundle/pralaya.pt`. The checkpoint supplies the architecture config, weights, normalization parameters, both static grids and checkpoint ID. The server supports `--bundle PATH` for local checks of a staged bundle.
- Mass's adapter has sole ownership of parsing and applying the physical perturbation. The model receives a writable request-local NumPy float32 `[3,6,32,36]` history with the shock already applied if requested, a float32 `[2]` seasonal pair, and an integer lead count. It returns a NumPy array `[steps,6,32,36]` in physical units.
- Jarvis owns CPU loading, model-space channels and dtype, normalization, inverse transforms, autoregressive feedback and seasonal advance. The model conditions on the target day and advances the seasonal phase by `2π/365` once before each forecast step. The first step uses the input phase plus `2π/365`. The encoding uses a one-based day of year and a fixed 365-day cycle. The wire supplies no calendar year. Load all assets eagerly and use deterministic CPU evaluation with local rollout state.
- Use the verified NetCDF metadata above and compare the bundled fields to the oriented source arrays. Report the extraction command and any transformation applied. Download the official `india_climate_train.nc` and `stats.json`, verify both with the release manifest and keep daily histories outside Git. Include the root training command and the actual normalization provenance.
- Report the chronological held-out split and metric definitions alongside day 1, 4 and 8 latitude-weighted RMSE skill versus the better of persistence and climatology, separate day-4 persistence skill, day 1, 4 and 8 heavy-rain CSI at 10 mm/day, day-8 variance ratios, and the kit's shock diagnostics. The wheel implements these in `monsoon_r1.scoring`. Its diagnostics measure standardized response magnitude, day-1 locality, late outward spread and stability for the two published shock recipes.

## Dashboard handoff to Hridhin

Target `hridhin/dashboard`. Start `python serve.py --dev --port 8000` and use `http://localhost:8000`. The development server identifies itself as `PRALAYA-dev-persistence`. Use a local dashboard proxy to forward `/health` and `/simulate` so the browser can use the same origin. The server has no browser-origin configuration requirement for the judge.

Send the same original `init_states`, `doy_sincos` and `steps` to both timelines. Prime sends `null`. Branch sends the localized physical delta. Compute signed `Branch - Prime` differences and agriculture indicators from the same returned rollouts. When rendering a north-up grid, map the final array row to its northern latitude.

Generate a synthetic development request with the command below. For a Branch check, use a zero-initialized `[6,32,36]` delta and set channel 0 to `+3` K over a local patch. Ask Jarvis to identify a permitted live demo history and matching seasonal pair. Keep that history outside the submitted repo.

```sh
python scripts/check_inference.py --write-request /tmp/pralaya-synthetic-request.json
curl --fail --silent -H 'Content-Type: application/json' \
  --data-binary @/tmp/pralaya-synthetic-request.json \
  http://localhost:8000/simulate
```

## Repeatable verification

Install the checksum-verified official wheel with its `[serve]` extra in a local development environment. The release server does not import the wheel. Start a fresh process for each candidate and record Git SHA, clean status, checkpoint ID, bundle file hashes, readiness time, peak memory, platform and enforced limits. Keep the previous verified artifact available for rollback.

```sh
python serve.py --dev --port 8000
# In another terminal from the repo root
python -m monsoon_r1.schema_validator http://localhost:8000
python scripts/check_inference.py http://localhost:8000 --dev --stats /path/to/stats.json
python -c "from monsoon_r1.repo_scan import scan; import json; print(json.dumps(scan('.'), indent=1))"
```

For a trained candidate, use `python serve.py --port 8000` and omit `--dev` from the HTTP check. Supply `--request /path/to/held-out-history.json` to run the published shock recipes on a permitted local history. The check records eight sequential HTTP timings and response sizes, validates shape/units, and tests deterministic and exact zero-shock behavior. Held-out prediction skill is measured separately against observations.

For the release rehearsal, mount a clean checkout read-only in a CPU container with `--network none --cpus 4 --memory 6g --tmpfs /tmp`, and run the HTTP client in the same container. Verify the actual weight bytes, including any LFS objects, and bundle only the model assets needed at inference. Compare the live demo and scientific evidence to the same checkpoint.
