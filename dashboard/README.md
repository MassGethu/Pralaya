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

It needs `numpy`, `xarray` and `netCDF4`. This is the team's single demo-input tool (agreed with Jarvis).

Seasonal encoding, confirmed with Jarvis: `doy` is the 1-based day of year (1 January = 1) of the **last** of the three input days. Do not advance it for the forecast; the model rotates the season forward once per step.

Demo windows come from 2021, the held-out test year: no 2021 data trained the model or chose the checkpoint. Use monsoon dates so the contract shocks produce a visible rain response. Prepared inputs (Indian land-mean rain on the last input day): `2021-07-22` (14.9 mm/day, the wettest July–August 2021 day, recommended), `2021-08-17` (12.1 mm/day) and `2021-07-15` (8.3 mm/day). The output is `{"init_states": [3,6,32,36], "doy_sincos": [sin, cos], "meta": {...}}`, with the official encoding `doy_sincos = [sin(2π·doy/365), cos(2π·doy/365)]` for the last input day. The tool refuses to write inside the repository. In the dashboard, use **Load input JSON**. A request body Mass shares (one with `init_states` and `doy_sincos`) also loads directly.

`public/static/static_fields.json` holds only the kit's static fields (`land_sea_mask`, `orography_m`), exported with `--export-static`. It contains no weather data.

## Demo flow

The screen has three parts: the scenario steps on the left, one large map in the middle, and the farm impact on the right. The step tracker in the header and the amber hint at the top left always say what to do next.

1. **Load input JSON.** The card shows the last input day, `doy_sincos`, and shape and unit checks.
2. **Run Prime.** Sends `perturbation: null` with `steps: 10`. The map shows Timeline Prime.
3. **Pick a shock.** Start from a preset, or drag a box on the map with **Draw shock box** selected (exact latitude/longitude is under "Edit box"). Choose variables as an additive physical delta or a percent of the final input day. The preview table shows the exact Δ per channel before you send it.
4. **Run Branch.** Sends the same input, `doy_sincos` and `steps` as Prime plus the `[6,32,36]` delta, which is non-zero only in the selected cells and channels. The map switches to **Difference** (Branch − Prime) and briefly rings amber.
5. Compare with the view switch above the map: **Prime**, **Swipe** (drag the divider, or press `[` / `]`), **Branch** or **Difference**. The variable rail on the right changes the weather variable. The timeline at the bottom steps through the days (click, ← / →, or ▶ to play); the amber bar under each day is that day's ripple reach, scaled to the largest day.
6. **Draw farm region** sets the agricultural region separately from the shock box (for example, shock the ocean and read rain over land). The right column shows the headline cards, the cumulative rainfall chart (Absolute / Change), all indicators, ripple reach, and the initial shock at day 0.
7. **Zero check** sends an all-zero tensor and reports the max |Branch − Prime| per channel against the contract tolerance (1e-3 × channel std).

## Conventions

- Grid: 32 × 36, 1° cells. Row 0 is 6.5°N (south) and column 0 is 65.5°E (west). Maps draw north up; hovering shows `[row, col]`. Verified: SW corner → `[0,0]`, NE corner → `[31,35]`, Delhi → `[22,12]`, land fraction 1.0.
- Channels: `t2m` K, `tp` mm/day, `u10` and `v10` m/s, `msl` Pa, `tcwv` kg/m². Conversions happen only for display: °C, and hPa for pressure. Wind speed is derived per timeline from `u10` and `v10` before differencing.
- Boxes select cells whose centres fall inside them, the same rule as the kit's `box_mask`.
- A negative rain shock is capped so the shocked state stays at or above 0 mm/day.
- The coastline is the 0.5 contour of the kit's `land_sea_mask` (marching squares), drawn from the repo's static fields; no map tiles or downloads.
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

Design references (patterns only, no assets): Ventusky (map-first layout, floating layer rail, classed rain legend, timeline play control), NASA Worldview (A/B swipe comparison), Zoom Earth (glass panels) and Copernicus Climate Pulse (headline cards, highlighted series over a dashed reference, selected-point callout, absolute/anomaly toggle). Static fields derive from the official kit's `india_climate_train.nc`: modified ERA5 (Copernicus Climate Change Service, Hersbach et al. 2020), CC BY 4.0, via WeatherBench 2. City markers use public coordinates. The dashboard needs no map tiles or other network assets.
