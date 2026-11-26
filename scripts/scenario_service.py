"""Local scenario search, ensemble summaries, and agricultural comparisons."""

import argparse
import hashlib
from pathlib import Path
from threading import Lock
from typing import Annotated, Literal

import numpy as np
import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, FiniteFloat, StrictInt, model_validator

from inference_adapter import STATE_SHAPE, Inference, parse_simulation


ROOT = Path(__file__).resolve().parents[1]
LAT = np.arange(STATE_SHAPE[1]) + 6.5
LON = np.arange(STATE_SHAPE[2]) + 65.5
Box = tuple[FiniteFloat, FiniteFloat, FiniteFloat, FiniteFloat]
RECIPES = {"warm_ocean": (8, 20, 82, 94), "monsoon_stall": (8, 20, 65, 75)}
Positive = Annotated[FiniteFloat, Field(gt=0)]
Nonnegative = Annotated[FiniteFloat, Field(ge=0)]
REFERENCE_ACTION = "No supplemental water"


class Shock(BaseModel):
    recipe: Literal["warm_ocean", "monsoon_stall"]
    strength: Annotated[FiniteFloat, Field(gt=0, le=1)]
    box: Box | None = None


class Action(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=64)]
    daily_supplement_mm: Nonnegative


class ScenarioRequest(BaseModel):
    init_states: list | dict
    doy_sincos: list
    steps: StrictInt = 10
    impact_box: Box
    day_start: StrictInt = 1
    day_end: StrictInt = 7
    deficit_mm: Positive
    candidates: Annotated[list[Shock], Field(min_length=1, max_length=32)] | None = None
    daily_water_target_mm: Positive | None = None
    actions: Annotated[list[Action], Field(max_length=8)] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_comparison(self):
        if not 1 <= self.day_start <= self.day_end <= self.steps:
            raise ValueError("analysis days must be inside the forecast horizon")
        if self.actions and self.daily_water_target_mm is None:
            raise ValueError("actions need a daily water target")
        if len({REFERENCE_ACTION, *(action.name for action in self.actions)}) != len(self.actions) + 1:
            raise ValueError("action names must be unique and distinct from the reference")
        return self


def mask_for(box: Box) -> np.ndarray:
    south, north, west, east = box
    if not (6 <= south <= north <= 38 and 65 <= west <= east <= 101):
        raise ValueError("box must use ordered bounds inside the model grid")
    mask = ((LAT >= south) & (LAT <= north))[:, None] & ((LON >= west) & (LON <= east))
    if not mask.any():
        raise ValueError("box must contain a grid cell centre")
    return mask


def build_delta(last: np.ndarray, shock: Shock) -> tuple[np.ndarray, float]:
    bounds = RECIPES[shock.recipe]
    mask = mask_for(shock.box or bounds)
    if (mask & ~mask_for(bounds)).any():
        raise ValueError(f"shock box must stay inside the {shock.recipe} region")
    delta = np.zeros(STATE_SHAPE, dtype=np.float32)
    if shock.recipe == "warm_ocean":
        delta[0, mask] = 3 * shock.strength
        delta[5, mask] = (0.15 * shock.strength) * last[5, mask]
    else:
        delta[2:4, mask] = (-0.4 * shock.strength) * last[2:4, mask]
    if not np.isfinite(delta).all() or not np.any(delta):
        raise ValueError("candidate shock must produce a finite, nonzero delta")
    return delta, shock.strength * float(np.sqrt(np.count_nonzero(mask)))


def score_actions(series: np.ndarray, request: ScenarioRequest) -> list[dict]:
    if request.daily_water_target_mm is None:
        return []
    actions = []
    options = [Action(name=REFERENCE_ACTION, daily_supplement_mm=0), *request.actions]
    for action in options:
        shortfall = np.maximum(request.daily_water_target_mm - series - action.daily_supplement_mm, 0).sum(axis=1)
        if not np.isfinite(shortfall).all():
            raise ValueError("water assumptions exceed the numeric range")
        actions.append({
            **action.model_dump(),
            "shortfall_mm_by_scenario": shortfall.tolist(),
            "average_shortfall_mm": float(shortfall.mean()),
            "worst_shortfall_mm": float(shortfall.max()),
        })
    return actions


def evaluate(request: ScenarioRequest, inference: Inference, land: np.ndarray, checkpoint: dict) -> dict:
    body = request.model_dump(include={"init_states", "doy_sincos", "steps"})
    history, season, steps = parse_simulation(body)
    area = mask_for(request.impact_box) & land
    if not area.any():
        raise ValueError("impact box must contain a land cell")
    weights = np.broadcast_to(np.cos(np.deg2rad(LAT))[:, None], area.shape)[area]
    window = slice(request.day_start - 1, request.day_end)

    def regional_rain(rollout: np.ndarray) -> np.ndarray:
        return np.average(rollout[window, 1][:, area], axis=1, weights=weights)

    specs = request.candidates or [
        Shock(recipe=recipe, strength=strength) for recipe in RECIPES for strength in (0.25, 0.5, 0.75, 1)
    ]
    deltas = [build_delta(history[-1], shock) for shock in specs]
    if len({delta.tobytes() for delta, _ in deltas}) != len(deltas):
        raise ValueError("candidate shocks must produce distinct deltas")

    reference = regional_rain(inference.run(history, season, steps))
    reference_total = float(reference.sum())
    results, rain = [], []
    best = None
    for index, (shock, (delta, cost)) in enumerate(zip(specs, deltas)):
        rollout = inference.run(*parse_simulation({**body, "perturbation": delta.tolist()}))
        daily = regional_rain(rollout)
        total = float(daily.sum())
        deficit = reference_total - total
        candidate = {
            "index": index, **shock.model_dump(), "cost": cost, "rain_mm": total,
            "deficit_mm": deficit, "qualifies": deficit >= request.deficit_mm,
            "daily_rain_mm": daily.tolist(),
        }
        results.append(candidate)
        rain.append(daily)
        rank = (cost, -deficit, index)
        if candidate["qualifies"] and (best is None or rank < best[0]):
            best = (rank, {**candidate, "perturbation": delta.tolist(), "rollout": rollout.tolist()})

    cumulative = np.cumsum(rain, axis=1)
    quantiles = np.quantile(cumulative, [0.1, 0.5, 0.9], axis=0)
    qualifying = sum(candidate["qualifies"] for candidate in results)
    history_digest = hashlib.sha256(history.astype("<f4", copy=False).tobytes())
    history_digest.update(season.astype("<f4", copy=False).tobytes())
    history_digest.update(bytes([steps]))
    return {
        "checkpoint": checkpoint, "history_sha256": history_digest.hexdigest(),
        "days": list(range(request.day_start, request.day_end + 1)), "land_cells": int(area.sum()),
        "deficit_threshold_mm": request.deficit_mm, "prime_daily_rain_mm": reference.tolist(),
        "prime_total_rain_mm": reference_total, "candidates": results,
        "best": best[1] if best else None,
        "ensemble": {
            "p10_cumulative_mm": quantiles[0].tolist(), "p50_cumulative_mm": quantiles[1].tolist(),
            "p90_cumulative_mm": quantiles[2].tolist(), "qualifying_count": qualifying,
            "scenario_count": len(results), "qualifying_fraction": qualifying / len(results),
        },
        "actions": score_actions(np.stack(rain), request),
    }


def create_app(bundle: Path) -> FastAPI:
    weights = bundle / "pralaya.pt"
    sha256 = hashlib.sha256(weights.read_bytes()).hexdigest()
    data = torch.load(weights, map_location="cpu", weights_only=True)
    land = data["static"][0].numpy() >= 0.5
    checkpoint = {"model_id": data["meta"]["model_id"], "sha256": sha256}
    del data
    inference = Inference(bundle, development=False)
    if hashlib.sha256(weights.read_bytes()).hexdigest() != sha256:
        raise RuntimeError("checkpoint changed during startup")
    app = FastAPI()
    search_lock = Lock()

    @app.post("/scenarios")
    def scenarios(request: ScenarioRequest):
        if not search_lock.acquire(blocking=False):
            raise HTTPException(503, "A scenario search is already running")
        try:
            return evaluate(request, inference, land, checkpoint)
        except (ValueError, OverflowError) as exc:
            raise HTTPException(422, str(exc)) from exc
        finally:
            search_lock.release()

    return app


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", type=Path, default=ROOT / "model" / "bundle")
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()
    uvicorn.run(create_app(args.bundle.resolve()), host="127.0.0.1", port=args.port)


if __name__ == "__main__":
    main()
