# PRALAYA

PRALAYA forecasts daily weather over India and lets users compare an unperturbed forecast with a forecast that starts from a localized atmospheric shock. The dashboard shows how the forecasts differ and calculates regional agricultural weather-stress indicators from the same rollouts.

**Brief:** [two-page project brief (PDF)](brief/PRALAYA_brief.pdf), covering model design, drift and blur, failure cases, the live visualization and agricultural impact. The brief reports 2021 follow-up results for the bundled `e3_rainstab` with paired calibration.

## Train

Download `india_climate_train.nc`, `stats.json`, `API_CONTRACT.md`, the kit wheel and `SHA256SUMS.txt`. Run `shasum -a 256 -c SHA256SUMS.txt` in the download directory and keep the dataset outside the repository. [Organizer's v1.0.0 release](https://github.com/OfficialAbhinavSingh/yug-monsoon-kit/releases/tag/v1.0.0)

From the repo root, run:

```sh
python -m pip install -r requirements-train.txt
python train.py --data /path/to/india_climate_train.nc --name b1_onestep --epochs 40 --rollout 1 --lr 1e-3 --seed 0
python train.py --data /path/to/india_climate_train.nc --name b3_roll4 --epochs 12 --rollout 4 --lr 3e-4 --init runs/b1_onestep/best.pt --seed 0
python train.py --data /path/to/india_climate_train.nc --name e3_rainstab --epochs 12 --rollout 8 --lr 1e-4 --init runs/b3_roll4/best.pt --seed 0 --ocean-t2m-weight 4 --stab-weight 1
```

The served ensemble adds seeds 1 and 2: repeat all three commands with `--seed 1` (then `--seed 2`), names ending `_s1` (`_s2`) and `--init` pointing at the same seed's previous run, for example:

```sh
python train.py --data /path/to/india_climate_train.nc --name e3_rainstab_s1 --epochs 12 --rollout 8 --lr 1e-4 --init runs/b3_roll4_s1/best.pt --seed 1 --ocean-t2m-weight 4 --stab-weight 1
```

To assemble the bundle, copy `runs/e3_rainstab/best.pt` to `model/bundle/pralaya.pt` and the seed 1 and 2 checkpoints to `model/bundle/member_s1.pt` and `member_s2.pt`; `model/bundle/ensemble.json` lists the three files with `pralaya.pt` first. Then refit `model/bundle/calibration.pt` and pin its rain weights as described in [Refit the calibration](docs/CALIBRATION.md#refit-the-calibration). The server refuses a calibration file that does not match the bundle.

Training uses 2005–2019 for fitting and normalization and 2020 for checkpoint selection. The server loads `e3_rainstab` from `model/bundle/pralaya.pt`. The raw model scored 51.11/70 on 2020 validation, up from 49.37 for `e3_roll8_ocean`. Its three-seed mean is 50.85 ± 1.54. The bundled calibration improves Prime's non-rain fields while retaining the model's response to each shock. The served forecast averages the three `e3_rainstab` seeds (`model/bundle/ensemble.json`), calibrates that mean, and takes each shock's response from seed 0 alone, so the response is the single model's. It scored 65.92/70 on 2020 validation (partly in-sample for the calibration weights) and 64.93/70 on the 2021 follow-up, up from 57.92 and 56.92 for the single calibrated model, with shock propagation and stability equal or higher ([evidence](docs/EXPERIMENTS.md#a5b_ens3_resp0-result-passes-all-six-gates-promoted)). These are local estimates using the kit scoring functions. [Training recipe](docs/TRAINING.md) · [Calibration evidence](docs/CALIBRATION.md)

## Serve and validate

The organizer's offline environment provides CPU PyTorch, NumPy, FastAPI and Uvicorn. For a local run, install PyTorch and the verified wheel with the server extra before launching from the repo root:

```sh
python -m pip install torch '/path/to/monsoon_r1_kit-1.0.0-py3-none-any.whl[serve]'
python serve.py --port 8000
```

In a second terminal from the repo root, run:

```sh
python -m monsoon_r1.schema_validator http://localhost:8000
python tests/test_contract.py
python scripts/check_inference.py http://localhost:8000 --stats /path/to/stats.json
python -c "from monsoon_r1.repo_scan import scan; import json; print(json.dumps(scan('.'), indent=1))"
```

See the [API contract](docs/CONTRACTS.md) for payloads, units and grid orientation.

## Run the dashboard

With the inference server running and Node.js 20 or later installed, open a new terminal:

```sh
cd dashboard
npm ci
npm run dev
```

Open `http://localhost:5317`. Vite forwards forecast calls to `http://127.0.0.1:8000`. Use the [dashboard instructions](dashboard/README.md) to generate a local demo input and run Prime and Branch.

## Run scenario analysis

In a separate terminal from the repository root, run `python -m scripts.scenario_service --port 8001`. Use the same checkpoint bundle for both servers. After running Prime, open **Scenarios** in the dashboard drawer for inverse rainfall search, ensemble summaries, and agricultural water-shortfall comparisons. [Scenario API contract](docs/CONTRACTS.md#local-scenario-service)

## Data attribution

`india_climate_train.nc` and `stats.json` from the organizer kit contain modified Copernicus Climate Change Service information (ERA5, Hersbach et al. 2020), accessed through Google WeatherBench 2 (Rasp et al. 2024). ERA5 is licensed under CC BY 4.0. The fields were aggregated into daily values and regridded to a 32 × 36 grid with 1° spacing covering 6.5°N–37.5°N and 65.5°E–100.5°E. Source: `NOTICE` in the organizer's v1.0.0 wheel.
