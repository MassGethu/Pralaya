# Model interface (Jarvis -> Mass)

Source of truth for data facts: `kit/API_CONTRACT.md` and `monsoon_r1/contract.py` (kit v1.0.0). Everything below was
verified against `india_climate_train.nc` (sha256 `f37bdb…903b`, 122,831,709 bytes).

## Verified data facts
| Item | Value |
|---|---|
| Archive | `data` [time 6209, channel 6, lat 32, lon 36] float32, no packing/scale, no NaN/Inf, no missing days |
| Dates | 2005-01-01 .. 2021-12-31, daily, proleptic Gregorian |
| Channels (axis 1) | 0 `t2m` K, 1 `tp` mm/day, 2 `u10` m/s, 3 `v10` m/s, 4 `msl` Pa, 5 `tcwv` kg/m2 |
| Grid | lat 6.5..37.5 step 1 (row 0 = SOUTH), lon 65.5..100.5 step 1 (col 0 = WEST) |
| Static | `static` [2,32,36]: 0 `land_sea_mask` (fraction 0..1, 1 = land), 1 `orography_m` (m, -0.16..5284) |
| `stats.json` | exactly the full-archive 2005-2021 mean/std (includes our val/test years); the model uses train-only stats |
| doy_sincos | `[sin(2*pi*doy/365), cos(2*pi*doy/365)]` of the LAST input day; forecast step k is doy+k. We use 1-based doy (Jan 1 = 1); kit does not state 0- vs 1-based (1 day = 1 deg of phase, negligible) |

## Ownership of each transformation
| Step | Owner | Where |
|---|---|---|
| JSON parse/encode, `/health`, `/simulate`, `inference_ms`, input shape errors -> HTTP 4xx | Mass | `serve.py` |
| Copy inputs, add perturbation once to `init_states[-1]` (null == zeros, bit-identical), clip shocked rain at 0 | Jarvis | `model/forecaster.py` |
| Normalisation, static geography, seasonal advance, autoregressive rollout, rain >= 0 | Jarvis | `model/net.py` |

## How serve.py should call it
```python
from model import Forecaster
FC = Forecaster()                    # loads model/assets/pralaya.pt on CPU, torch threads = 4, at import time
out = FC.simulate(init_states, doy_sincos, steps, perturbation)   # perturbation: None or [6,32,36]
# out: np.float32 [steps,6,32,36] physical units -> out.tolist()
```
- `Forecaster(path)` takes an explicit checkpoint path if we swap candidates; default `model/assets/pralaya.pt`.
- `FC.model_id` is the checkpoint ID, so it can go in `/health` `model_name`.
- It raises `ValueError` on bad shapes/NaN, so map that to HTTP 422.
- It is deterministic, keeps no state between calls and never mutates its inputs.
- `serve.py` must NOT import `train.py` or `evaluation/` (repo_scan treats every module serve.py imports as inference code).

## Checkpoint format (`model/assets/pralaya.pt`, loaded with `torch.load(..., weights_only=True)`)
`{"state_dict", "config": {"width", "blocks"}, "mean" [6], "std" [6], "static" [2,32,36], "meta": {"model_id", "train_years", ...}}`.
Self-contained: no stats.json, no climatology and no archive are needed at inference. Expected size ~3.5 MB (no LFS needed).

## Measured (MacBook Pro M5 Pro, untrained net of the same size, 0.86 M params)
- 10-step CPU rollout, 4 torch threads: 25 ms. `.tolist()` + JSON encode: about 13 ms, 1.28 MB.
- Training: MPS about 320 samples/s versus CPU about 36 samples/s (B=64, 2-step) -> train on MPS, load on CPU.

## Repo-scan constraints we must respect (`monsoon_r1.repo_scan`)
- No date literals (yyyy-mm-dd / yyyymmdd) in serve.py or anything it imports (3 or more = flag).
- No `.nc` in the repo (warn, -2 pts) and no `.npy`/`.npz` with more than 400 daily 32x36 rows (critical).
- Training code must live in files serve.py does not import (`train.py`, `evaluation/`).
