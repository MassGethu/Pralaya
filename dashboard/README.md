# PRALAYA dashboard — Multiverse Studio

Live dashboard for Track 2. It loads a three-day atmospheric state, runs Timeline Prime and a shocked Branch through the team's `/simulate` server, shows Prime, Branch and the signed difference by day and variable, and turns both rollouts into regional agricultural weather-stress indicators.

The dashboard never fabricates forecasts. Every map comes from a `/simulate` response, unless you explicitly switch on the developer fixture engine. The fixture puts a striped banner on the page and a dashed outline on every map.

## Run

Needs Node 20+.

```bash
cd dashboard
npm ci
npm run dev                # http://localhost:5317, proxies /api/* to http://127.0.0.1:8000
```

Start the inference server separately from the repo root: `python serve.py --port 8000`.
Start the scenario service in a separate terminal from the same repo root: `python -m scripts.scenario_service --port 8001`. If you stage a checkpoint with `--bundle`, pass the same bundle directory to both commands.

| Variable | Default | Use |
| --- | --- | --- |
| `PRALAYA_API_URL` | `http://127.0.0.1:8000` | Where the dev proxy forwards `/api/*`, e.g. a teammate's Mac `http://192.168.x.y:8000` |
| `PRALAYA_SCENARIO_URL` | `http://127.0.0.1:8001` | Where the dev and preview proxies forward `/scenario-api/*` |
| `PRALAYA_UI_PORT` | `5317` | Dashboard port (Vite's default 5173 is often taken) |

The browser only talks to its own origin, so the official server needs no CORS change.

After loading a history and running Prime on the trained server, open **Scenarios** in the drawer or **Scenario analysis** in the command palette. Draw a farm region or keep the current one. Choose a deficit relative to Prime or a total rainfall threshold, set the day range, and run the search. The default search runs 13 recommended shocks for `e3_rainstab`, ten for `e3_roll8_ocean` and nine for `b3_roll4`. **Include larger plausible shocks** expands it to 16 and labels magnitudes outside the recommended range. The result shows the target, Prime rainfall, and the lowest-cost qualifying shock or closest miss. **Replay as Branch** sends the winning physical delta through the forecast server, checks the returned rollout, and opens Impact for the same days. Under **Preparedness assumptions**, set the daily water target and two daily supplements. The table shows total water supplied, average and worst shortfall, and the change in worst shortfall against no supplemental water. [Scenario contract](../docs/CONTRACTS.md#local-scenario-service)

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

It needs `numpy`, `xarray` and `netCDF4`. This is the team's single demo-input tool (agreed with Jarvis).

Seasonal encoding, confirmed with Jarvis: `doy` is the 1-based day of year (1 January = 1) of the **last** of the three input days. Do not advance it for the forecast; the model rotates the season forward once per step.

Demo windows come from 2021, the follow-up test year: no 2021 data trained the model or fitted the calibration. Use monsoon dates so the contract shocks produce a visible rain response. Prepared inputs (Indian land-mean rain on the last input day): `2021-07-22` (14.9 mm/day, the wettest July–August 2021 day, recommended), `2021-08-17` (12.1 mm/day) and `2021-07-15` (8.3 mm/day). The output is `{"init_states": [3,6,32,36], "doy_sincos": [sin, cos], "meta": {...}}`, with the official encoding `doy_sincos = [sin(2π·doy/365), cos(2π·doy/365)]` for the last input day. The tool refuses to write inside the repository. In the dashboard, use **Load input JSON**. A request body Mass shares (one with `init_states` and `doy_sincos`) also loads directly.

`public/static/static_fields.json` holds only the kit's static fields (`land_sea_mask`, `orography_m`), exported with `--export-static`. It contains no weather data.

## Demo flow

The command bar guides Load state → Run Prime → Pick a shock → Run Branch. The left rail selects the weather layer and opens Setup. The right drawer has Shock, Impact, Ripple, Scenarios, and Setup tabs. The bottom timeline scrubs forecast days and displays ripple reach.

1. **Load input JSON.** The panel shows the last input day, `doy_sincos`, and shape and unit checks. The dock labels the forecast days with real dates from the input's metadata.
2. **Run Prime.** Sends `perturbation: null` with `steps: 10`.
3. **Shock tab.** Start from a preset, or drag a box on the map with **Draw shock box** selected (exact latitude/longitude is under "Edit box"). Choose variables as an additive physical delta or a percent of the final input day. The preview table shows the exact Δ per channel before you send it.
4. **Run Branch.** Sends the same input, `doy_sincos` and `steps` as Prime plus the `[6,32,36]` delta, non-zero only in the selected cells and channels. The map switches to **Difference** (Branch − Prime), rings amber once, and the card opens the **Impact** tab.
5. **Show:** Prime, Branch, Difference or Swipe (drag the divider, or press `[` / `]`). **Weather layer** picks the variable. Step through days with the dock (click, ← / →, or ▶).
6. **Draw farm region** sets the agricultural region separately from the shock box. The Impact tab shows the headline cards, the cumulative rainfall chart (Absolute / Change) and all indicators. The Ripple tab shows reach per day and the initial shock at day 0.
7. **Zero check** sends an all-zero tensor and reports the max |Branch − Prime| per channel against the contract tolerance (1e-3 × channel std).

To reproduce the inverse-search demo with the served 3-seed `e3_rainstab` bundle, generate an input with `--last-day 2020-07-02`. After Prime, draw the coastal Odisha farm box (17°–23°N, 82°–88°E), choose **Total reaches threshold**, and set **117 mm** over days **1–7**. Prime gives **115.09 mm**, already at the observed JJAS 2020 p90 wet week (115 mm), and the +2 K Bay of Bengal shock moves the seven-day total to **117.53 mm**, the only tested shock that crosses. Change the target to **120 mm** to show the same shock as the closest miss, **2.47 mm** short. At the illustrative daily water target of **15 mm**, supplying **0, 14, or 28 mm** in total leaves a worst shortfall of **6.51, 2.01, or 0.00 mm** across the 13 tested shocks. (With the single-model release the same case read 113.15 → 115.60 mm at a 115 mm target.) [Range evidence](../docs/SHOCK_RANGES.md)

### Comparing futures

- **Map chips.** The shock and farm cards fold into one-line chips. Hover, keyboard focus or a click opens the full card. They open for 4 s after a Branch run, and every overlay fades and lets clicks through while you draw a box.
- **Difference readout.** On **Difference** with a Branch loaded, the top-left of the map shows the day's largest signed change in large type (orange drier, cyan wetter, as in the legend), where it is, and the ripple reach. A pulsing ring marks that cell. The number counts up from its previous value when the day changes (instant with reduced motion).
- **Futures shelf.** Under the layer list, each non-zero Branch for the current input is kept as a card (newest first, up to 8). A card shows the run number, name, the shock as applied, its peak rain change and a fingerprint: the biggest change on each forecast day, on a scale shared by all cards. Clicking a card restores that run exactly as the server returned it, with no new request. The shelf clears when the input or engine changes and is hidden below 900 px.
- **All futures.** With two or more Branches on the shelf, **All futures** on the map opens one small Difference map per Branch for the shown day, on one shared colour scale, with each shock box outlined. Click a tile to bring that future back on the main map.
- **Scenario futures strip.** Under a scenario search result, the **N futures** strip places every tested shock as a dot by its total rainfall change against Prime, one row per shock family, with Prime as a dashed zero line and the target zone shaded. Futures that reach the target are filled amber, and the chosen one is ringed and labelled. The rainfall ensemble chart plots change from Prime, with the deficit target line.

The opening film runs about 4.4 s: rain builds, then the PRALAYA title lands. **Skip**, Esc or Enter skips it, `?nointro` in the URL turns it off, and with reduced motion it shows only the still title.

Display switches: **Wind flow** animates particles through the displayed day's own `u10`/`v10` (off by default when the system asks for reduced motion, and dimmed in the Difference view). **Terrain** shades land from the kit's `orography_m`. **Smooth display** interpolates values between cell centres for drawing only; hovering always reports the true 1° cell values.

## Conventions

- Grid: 32 × 36, 1° cells. Row 0 is 6.5°N (south) and column 0 is 65.5°E (west). Maps draw north up; hovering shows `[row, col]`. Verified: SW corner → `[0,0]`, NE corner → `[31,35]`, Delhi → `[22,12]`, land fraction 1.0.
- Channels: `t2m` K, `tp` mm/day, `u10` and `v10` m/s, `msl` Pa, `tcwv` kg/m². Conversions happen only for display: °C, and hPa for pressure. Wind speed is derived per timeline from `u10` and `v10` before differencing.
- Boxes select cells whose centres fall inside them, the same rule as the kit's `box_mask`.
- A negative rain shock is capped so the shocked state stays at or above 0 mm/day.
- The coastline is the 0.5 contour of the kit's `land_sea_mask` (marching squares) and the shaded relief comes from `orography_m`, both from the repo's static fields; no map tiles or downloads.
- Dry rain (< 0.1 mm/day) and zero difference are drawn transparent so the terrain shows through.
- Rainfall maps use fixed classes (0, 0.1, 0.5, 1, 2, 5, 10, 20, 50 mm/day) with a stepped legend, as on operational rain maps; 10 mm/day is the contract's heavy-rain level. Other variables share one continuous absolute scale across Prime and Branch (1st–99th percentile over both timelines and all days). The difference uses a zero-centred diverging scale, fixed across days.
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

The panel chart shows cumulative regional rainfall with Branch highlighted over a dashed Prime reference ("Absolute"), or Branch − Prime cumulative ("Change vs Prime"), with a callout on the selected forecast day and dry-day marks per timeline.

## Ripple reach (`src/ripple.ts`)

For each forecast day: the share of cells outside the shock box where |Branch − Prime| exceeds a variable-specific threshold. Thresholds: rain 1 mm/day, temperature 0.5 K, wind 0.5 m/s, pressure 0.5 hPa, moisture 1 kg/m². It describes the model's response, not physical causation, and it is not an official score.

## Attribution

Design references (patterns only, no assets): Tempest storm-map concept (dark command layout, layer panel, event card), kepler.gl (docked time histogram), earth.nullschool (wind particles), Ventusky (icon layer list, stepped rain legend, play control), Zoom Earth (shaded land, glass panels), Copernicus Interactive Climate Atlas (selector panel, labelled timeline) and Copernicus Climate Pulse (headline cards, coloured header, highlighted series over a dashed reference). Static fields derive from the official kit's `india_climate_train.nc`: modified ERA5 (Copernicus Climate Change Service, Hersbach et al. 2020), CC BY 4.0, via WeatherBench 2. City markers use public coordinates. Maps and forecasts use local assets and services. Fonts (Tomorrow and Michroma, SIL Open Font License, licences in `public/fonts/licenses/`) are self-hosted, so the dashboard makes no external requests.
