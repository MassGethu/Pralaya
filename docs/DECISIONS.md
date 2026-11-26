# PRALAYA decision log

Every agent reads this file and `docs/CONTRACTS.md` on the latest `origin` before starting a task, and appends here in the same commit as any change that sets or changes a convention another workstream depends on.

## Rules

1. **One interface file, one owner.** Cross-team interfaces live in `docs/CONTRACTS.md`, edited only by Mass. To change one, add a `PROPOSED:` entry below with status `proposed`. Nobody codes against it until Mass marks it `accepted`.
2. **Fetch before you write.** Run `git fetch --all` and read this file and `docs/CONTRACTS.md` at the start of every task, not just once per session.
3. **Stay in your own files.** Mass: `serve.py`, `inference_adapter.py`, root `.gitignore`, `README.md`, `docs/CONTRACTS.md`, `scripts/`, `tests/`. Jarvis: `model/`, `evaluation/`, `train.py`, `requirements-train.txt`. Hridhin: `dashboard/`. Editing another owner's file needs their OK, routed through Mass.
4. **Run the contract test before every push** that touches `model/`, `serve.py`, `inference_adapter.py` or the checkpoint: `python tests/test_contract.py` (see its docstring).
5. **Merge small and often.** Branch from `main` once it exists. Mass owns merges into `main`. Never rebase or force-push a branch someone has merged.
6. **Repo-scan hygiene.** Only `serve.py` may contain the text `/simulate` or a quoted `"simulate"` among `.py` files meant for inference. Any other `.py` that contains it, and everything that file imports, is scanned as inference code. Inference code must contain no date literals, no `date(20…)`/`datetime(20…)` calls, no plotting imports and no weather-API names. Never commit `.nc` files, LFS pointers for weights, or `.npy`/`.npz` arrays with more than 400 daily 32×36 fields.

## Entry format

One row per decision. Status is `proposed`, `accepted`, `done` (implemented and verified) or `superseded by #n`. Times are IST.

| # | Time | Branch@SHA | Owner | Decision | Affects | Status |
|---|---|---|---|---|---|---|

## Log

| # | Time | Branch@SHA | Owner | Decision | Affects | Status |
|---|---|---|---|---|---|---|
| 1 | 26 Nov 16:49 | jarvis/model@cc10402 | Jarvis | Chronological split by calendar year: train 2005–2019, validation 2020 for candidate selection, test 2021 untouched until final reporting. Every input and target window lies inside one split. | evaluation, brief | accepted |
| 2 | 26 Nov 16:49 | jarvis/model@cc10402 | Jarvis | Normalisation uses train-split mean and std, stored inside the checkpoint. The official `stats.json` covers 2005–2021 and is used only as the grader's scale for shock and null diagnostics. | model, evaluation | accepted |
| 3 | 26 Nov 16:49 | jarvis/model@cc10402 | Jarvis | Climatology baseline is training-years only, using the kit definition (366 calendar slots, 15-day circular smoothing). It is never shipped or used at inference. | evaluation, repo scan | accepted |
| 4 | 26 Nov 16:54 | jarvis/model@dd401a8 | Jarvis | Checkpoint `b1_onestep` (one-step residual CNN, epoch 28, 3.47 MB) is the first candidate. Committed without Git LFS. | release | accepted |
| 5 | 26 Nov 16:57 | mass/inference@734cb85 | Mass | `serve.py` and `inference_adapter.py` own JSON parsing (nested lists and base64), HTTP errors, `/health`, `inference_ms`, and output validity. | serve, model | accepted |
| 6 | 26 Nov 17:10 | mass/inference@4e3e6e2 | Mass, Jarvis | Loader interface: `model/inference.py` exports `load_cpu(bundle_dir)`, which wraps `model.Forecaster` and returns `forecast(history, doy_sincos, steps)`. The checkpoint lives at `model/bundle/pralaya.pt`. `model/assets/pralaya.pt` is removed, and `.gitignore` keeps `!model/bundle/pralaya.pt`. Supersedes `Forecaster.simulate` as the server-facing call in `docs/MODEL_INTERFACE.md`. | serve, model, release | accepted |
| 7 | 26 Nov 17:10 | mass/inference@4e3e6e2 | Mass | The adapter is the only owner of the perturbation. It adds the physical delta once to `init_states[-1]`, skips an all-zero delta, and passes no perturbation to the model (`load_cpu` always calls `simulate(..., None)`). | serve, model, dashboard | accepted |
| 8 | 26 Nov 17:10 | jarvis/model@dd401a8 | Jarvis | Seasonal convention: the model conditions on the target day. It advances the phase by 2π/365 once before each forecast step, so step 1 uses the input phase plus 2π/365. Day of year is 1-based. No leap-day handling, because there is no year on the wire. | model, dashboard | accepted |
| 9 | 26 Nov 17:10 | jarvis/model@dd401a8 | Jarvis | The forecaster clips input rain at ≥ 0 after the shock is applied. That is the only change made to input values. | model | accepted |
| 10 | 26 Nov 17:12 | mass/inference@4e3e6e2 | Mass | The adapter clips finite forecasts to the rain lower bound of 0 mm/day and the t2m range of 233.15–333.15 K. It logs the clipped count by channel and rejects nonfinite forecasts. | serve | done |
| 11 | 26 Nov 17:12 | jarvis/model (pending) | Jarvis | Remove the text `/simulate` from `evaluation/make_demo_input.py`, because the repo scan otherwise pulls `evaluation/data.py` into the inference set. Measured 12.5/15 on the merged tree before this fix. | repo scan | accepted; Jarvis implementing |
| 12 | 26 Nov 17:12 | all | Mass | `jarvis/model` and `mass/inference` have unrelated histories. Mass merges with `--allow-unrelated-histories` and combines both `.gitignore` files. After that, everyone branches from `main`. | git | accepted |
| 13 | 26 Nov 17:03 | hridhin/dashboard@a5631d2 | Hridhin | The dashboard calls the official server through a same-origin `/api` proxy (Vite). No CORS changes in `serve.py`. Demo inputs are JSON kept outside the repo; only the static fields ship, as `dashboard/public/static/static_fields.json`. | dashboard, serve, repo scan | accepted |
| 14 | 26 Nov 17:03 | hridhin/dashboard@a5631d2 | Hridhin | The signed map is Branch − Prime. Percent shocks are taken against the original final input day, using the kit's cell-centre box rule. | dashboard, brief | accepted |
| 15 | 26 Nov 19:13 | mass/scenario-integration | Mass | The loopback scenario service uses the same bundle and adapter as the forecast server. The dashboard integration uses a dedicated same-origin proxy. Inverse search scales the published recipes within their bounds and returns a replayable winning shock. Ensemble and action statistics are computed over the tested scenarios. | dashboard, scenario analysis, demo | accepted |
| 16 | 26 Nov 19:58 | jarvis/model@b51b660 | Mass, Jarvis | The scenario service accepts signed shocks within Jarvis's plausible ranges and defaults to the nine recommended nonzero magnitudes from the b3_roll4 validation study. It labels candidates by recommended amplitude range and supports a rainfall threshold crossing from below. The official forecast API keeps its existing physical-delta contract. | scenario analysis, dashboard | accepted |
| 17 | 26 Nov 21:00 | mass/scenario-integration@3dc0480 | Mass | The Scenarios tab uses the current farm region and live Prime. It compares regional Prime rainfall across both services and verifies a winning shock when replayed through the forecast server. | dashboard, demo | done |
| 18 | 26 Nov 23:17 | jarvis/model@3578dd2 | Mass, Jarvis | The e3 candidate uses the validation-backed scenario profile for the loaded checkpoint. Its default Bay of Bengal magnitudes include +1.5 K. The b3 profile remains available for rollback. | scenario analysis, dashboard, candidate | accepted |
