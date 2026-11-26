# PRALAYA dashboard — Multiverse Studio

Live dashboard for Track 2. It loads a three-day atmospheric state, runs Timeline Prime and a shocked Branch through the team's `/simulate` server, shows Prime, Branch and the signed difference by day and variable, and turns both rollouts into regional agricultural weather-stress indicators.

The dashboard never fabricates forecasts. Every map comes from a `/simulate` response, unless you explicitly switch on the developer fixture engine. The fixture puts a striped banner on the page and a dashed outline on every map.

## Run

Needs Node 20+.

```bash
cd dashboard
npm install
npm run dev                # http://localhost:5317, proxies /api/* to http://127.0.0.1:8000
```

Start the inference server separately from the repo root: `python serve.py --port 8000`.

| Variable | Default | Use |
| --- | --- | --- |
| `PRALAYA_API_URL` | `http://127.0.0.1:8000` | Where the dev proxy forwards `/api/*`, e.g. a teammate's Mac `http://192.168.x.y:8000` |
| `PRALAYA_UI_PORT` | `5317` | Dashboard port (Vite's default 5173 is often taken) |

The browser only talks to its own origin, so the official server needs no CORS change.

```bash
npm test                   # unit tests: grid orientation, shock tensor, impact formulas, zero difference
npm run typecheck
```

## Demo input (kept out of the repo)

Historical weather windows are not shipped. Make a local input from the official kit NetCDF, outside the repo:

```bash
python dashboard/tools/make_demo_input.py --nc ~/Documents/PRALAYA-data/india_climate_train.nc \
    --last-day 2021-07-15 --out ~/Documents/PRALAYA-data/demo_inputs/monsoon_2021-07-15.json
```

It needs `numpy`, `xarray` and `netCDF4`. The output is `{"init_states": [3,6,32,36], "doy_sincos": [sin, cos], "meta": {...}}`, with the official encoding `doy_sincos = [sin(2π·doy/365), cos(2π·doy/365)]` for the last input day. The tool refuses to write inside the repository. In the dashboard, use **Load input JSON**. A request body Mass shares (one with `init_states` and `doy_sincos`) also loads directly.

`public/static/static_fields.json` holds only the kit's static fields (`land_sea_mask`, `orography_m`), exported with `--export-static`. It contains no weather data.

## Demo flow

1. **Load input JSON.** The panel shows the last input day, `doy_sincos`, and shape and unit checks.
2. **Run Prime.** Sends `perturbation: null` with `steps: 10`.
3. **Shock.** Drag a box on any map (with **Draw shock box** selected) or type latitude and longitude. Pick variables, each as an additive physical delta or as a percent of the final input day. Presets reproduce the contract's warm Bay of Bengal and weaker Arabian Sea wind shocks. The preview table shows the exact Δ per channel before you send it.
4. **Run Branch.** Sends the same input, `doy_sincos` and `steps` as Prime, plus the `[6,32,36]` delta. The delta is non-zero only in the selected cells and channels.
5. Read **Branch − Prime** on the day slider. **Initial shock · day 0** shows the delta itself, kept separate from the forecast.
6. **Draw impact region** sets a separate agricultural region, for example a shock over the ocean with impact read over land.
7. **Zero-shock check** sends an all-zero tensor and reports the max |Branch − Prime| per channel against the contract tolerance (1e-3 × channel std).

## Conventions

- Grid: 32 × 36, 1° cells. Row 0 is 6.5°N (south) and column 0 is 65.5°E (west). Maps draw north up; hovering shows `[row, col]`. Verified: SW corner → `[0,0]`, NE corner → `[31,35]`, Delhi → `[22,12]`, land fraction 1.0.
- Channels: `t2m` K, `tp` mm/day, `u10` and `v10` m/s, `msl` Pa, `tcwv` kg/m². Conversions happen only for display: °C, and hPa for pressure. Wind speed is derived per timeline from `u10` and `v10` before differencing.
- Boxes select cells whose centres fall inside them, the same rule as the kit's `box_mask`.
- A negative rain shock is capped so the shocked state stays at or above 0 mm/day.
- Prime and Branch share one absolute colour scale (1st–99th percentile over both timelines and all days). The difference uses a zero-centred diverging scale, fixed across days.
- Race safety: each run has a run number. A late response from a superseded request is dropped. Loading a new input or switching engine clears all results. Editing the shock after a run flags the maps as showing the earlier Branch.

## Agricultural weather-stress indicators (`src/impact.ts`)

All indicators use the same region, days and thresholds for both timelines:

- **Region**: the impact box intersected with land cells (`land_sea_mask` ≥ 0.5).
- **Regional daily rainfall**: the cos(latitude)-weighted mean of `tp` over region cells.
- **Cumulative rainfall**: the sum of regional daily rainfall over the selected days (mm). The change is Branch − Prime, in mm and in % of Prime.
- **Dry day**: a day whose regional daily rainfall is below the dry threshold (default 2.5 mm/day). **Longest dry spell**: the longest consecutive run of dry days.
- **Heavy-rain exposure**: the share of (cell, day) pairs with `tp` ≥ the heavy threshold (default 10 mm/day, the contract's heavy-rain level).
- **Mean 2 m temperature**: the regional mean of the daily-mean `t2m` field. It is not a daily maximum.

These are weather-stress indicators that compare two simulated timelines. A change relative to Timeline Prime is not a climatological deficit, and none of these numbers is a crop yield, a loss estimate or a drought declaration. The 1° daily grid cannot resolve farm-scale conditions.

## Ripple reach (`src/ripple.ts`)

For each forecast day: the share of cells outside the shock box where |Branch − Prime| exceeds a variable-specific threshold. Thresholds: rain 1 mm/day, temperature 0.5 K, wind 0.5 m/s, pressure 0.5 hPa, moisture 1 kg/m². It describes the model's response, not physical causation, and it is not an official score.

## Attribution

Static fields derive from the official kit's `india_climate_train.nc`: modified ERA5 (Copernicus Climate Change Service, Hersbach et al. 2020), CC BY 4.0, via WeatherBench 2. City markers use public coordinates. The dashboard needs no map tiles or other network assets.
