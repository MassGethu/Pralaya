# Grid and units (for the dashboard / impact module)

Verified from `india_climate_train.nc` and `monsoon_r1/contract.py` (kit v1.0.0).

- Arrays are `[..., 6, 32, 36]` = `[channel, lat row, lon col]`.
- `lat[i] = 6.5 + i` for i = 0..31 (**row 0 is the SOUTH edge**, 6.5°N; row 31 is 37.5°N).
  Render with origin "lower", or flip rows for image-style (top = north) drawing.
- `lon[j] = 65.5 + j` for j = 0..35 (col 0 = 65.5°E WEST, col 35 = 100.5°E).
- Values are 1° cell **centres**; cell (i, j) spans lat 6+i .. 7+i, lon 65+j .. 66+j.
- Channels: 0 `t2m` K, 1 `tp` mm/day, 2 `u10` m/s (eastward), 3 `v10` m/s (northward), 4 `msl` Pa, 5 `tcwv` kg/m².
  Display conversions only: °C = K − 273.15, hPa = Pa / 100, wind speed = sqrt(u10² + v10²).
- Static fields (not sent by the API): `land_sea_mask` is a land fraction 0..1 (1 = land); `orography_m` is in metres.

## Alignment checks
| Index (row, col) | lat, lon | What you should see |
|---|---|---|
| (0, 16) | 6.5°N, 81.5°E | land_sea_mask 0.42 (southern Sri Lanka coast) |
| (28, 16) | 34.5°N, 81.5°E | orography max 5284 m (western Tibet / Ladakh) |

## Official shock boxes (inclusive, on cell centres)
- warm_ocean (Bay of Bengal): lat 8..20, lon 82..94 -> rows 2..13, cols 17..28. Change: +3 K t2m, +15% tcwv.
- monsoon_stall (Arabian Sea): lat 8..20, lon 65..75 -> rows 2..13, cols 0..9. Change: −40% u10 and v10.

The model's live input must come from a permitted 3-day state, not a shipped archive (coordinate with Mass).
