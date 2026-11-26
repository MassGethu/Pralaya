# PRALAYA

PRALAYA forecasts daily weather over India and lets users compare an unperturbed forecast with a forecast that starts from a localized atmospheric shock. The dashboard shows how the forecasts differ and calculates regional agricultural weather-stress indicators from the same rollouts.

**Brief:** [two-page project brief (PDF)](brief/PRALAYA_brief.pdf), covering model design, drift and blur, failure cases, the live visualization and agricultural impact. It describes the shipped `e3_rainstab`; its 2021 numbers were scored once after promotion, as a follow-up only.

## Train

Download `india_climate_train.nc`, `stats.json`, `API_CONTRACT.md`, the kit wheel and `SHA256SUMS.txt`. Run `shasum -a 256 -c SHA256SUMS.txt` in the download directory and keep the dataset outside the repository. [Organizer's v1.0.0 release](https://github.com/OfficialAbhinavSingh/yug-monsoon-kit/releases/tag/v1.0.0)

From the repo root, run:

```sh
python -m pip install -r requirements-train.txt
python train.py --data /path/to/india_climate_train.nc --name b1_onestep --epochs 40 --rollout 1 --lr 1e-3 --seed 0
python train.py --data /path/to/india_climate_train.nc --name b3_roll4 --epochs 12 --rollout 4 --lr 3e-4 --init runs/b1_onestep/best.pt --seed 0
python train.py --data /path/to/india_climate_train.nc --name e3_rainstab --epochs 12 --rollout 8 --lr 1e-4 --init runs/b3_roll4/best.pt --seed 0 --ocean-t2m-weight 4 --stab-weight 1
# experiment a4_rainhead (not shipped): same recipe plus --rain-head; see docs/EXPERIMENTS.md, Round 3
```

Training uses 2005–2019 for fitting and normalization and 2020 for checkpoint and candidate selection. The selected run writes `runs/e3_rainstab/best.pt`. The server loads the bundled `e3_rainstab` from `model/bundle/pralaya.pt`. It scored 51.11/70 on 2020 validation, up from 49.37 for the previous release `e3_roll8_ocean`. Its 3-seed mean is 50.85 ± 1.54; seed 1 alone (49.19) is below e3. It fine-tunes from `b3_roll4` with e3's recipe plus the shock-stability loss. 2021 was scored once after promotion, as follow-up evaluation only (S 50.72, vs 50.92 for e3). [Training recipe](docs/TRAINING.md) · [Promotion evidence](docs/EXPERIMENTS.md) · [2021 follow-up (e3_rainstab)](evaluation/results/e3_rainstab_test.md)

A climatology blend (mentor-approved) raised val S from 51.11 to 58.3 on e3_rainstab (and 49.37 to 57.3 on e3), but failed our pre-registered shock-spread gate (G1) on both e3 and e3_rainstab, so it was not shipped. See [docs/CLIMBLEND.md](docs/CLIMBLEND.md).

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
