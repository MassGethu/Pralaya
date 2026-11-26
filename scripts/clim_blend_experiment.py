"""Fit and audit the seasonal blend with the fixed kit data splits."""

from __future__ import annotations

import argparse
import base64
import json
import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch
import xarray as xr
from monsoon_r1 import scoring as S
from monsoon_r1.contract import CHANNELS, lat_weights

from evaluation.data import clim_index, climatology, doy, sincos, split_mask, window_starts
from evaluation.evaluate import LEADS, SHOCK_BOX, STEPS
from evaluation.uncertainty import ci
from inference_adapter import clip_forecast, parse_simulation
from model.forecaster import Forecaster
from postprocess.clim_blend import ClimBlend, DAY_ANGLE, MIN_ALPHA, harmonic_basis


ROOT = Path(__file__).resolve().parents[1]
KEYS = ("nonzero", "localized", "propagates", "stable")
FIELDS = ("coefficients", "alpha", "land", "persistence")
LEAD_IDX = np.array(LEADS) - 1
TOL = 1e-12


def read_split(path, split):
    with xr.open_dataset(path) as dataset:
        dates = dataset.time.values.astype("datetime64[D]")
        ids = np.flatnonzero(split_mask(dates, split))
        if len(ids) == 0 or (np.diff(dates[ids]).astype(int) != 1).any():
            raise ValueError(f"missing or non-consecutive days in {split}")
        section = dataset.isel(time=slice(ids[0], ids[-1] + 1))
        if tuple(dataset.channel.values) != tuple(CHANNELS):
            raise ValueError("unexpected dataset channels")
        return (section.data.values.astype(np.float32), section.time.values.astype("datetime64[D]"),
                dataset.static.values[0] >= 0.5)


def train_reference(path, output):
    data, dates, land = read_split(path, "train")
    angles = DAY_ANGLE * np.array([doy(date) for date in dates])
    basis = harmonic_basis(angles, 3)
    coefficients = (np.linalg.pinv(basis) @ data.reshape(len(data), -1)).reshape(7, *data.shape[1:])
    kit = climatology(data, dates)
    # The kit baseline stays outside the repository and never enters inference.
    np.savez(output, coefficients=coefficients, kit=kit, land=land)


def encode(values):
    return {"shape": list(values.shape), "b64": base64.b64encode(values.astype("<f4").tobytes()).decode()}


def collect(path, split, std, output, include_shocks, ckpt):
    data, dates, _ = read_split(path, split)
    starts = window_starts(dates, split, STEPS)
    model = Forecaster(ckpt)
    print(f"collecting {split} rollouts from {model.model_id} ({ckpt})", flush=True)

    def forecast(history, season, steps):
        return model.simulate(history, season, steps, None)
    size = (len(starts), STEPS, *data.shape[1:])
    raw, truth = np.empty(size, np.float32), np.empty(size, np.float32)
    shock = {name: np.empty(size, np.float32) for name in SHOCK_BOX} if include_shocks else {}
    last = np.empty((len(starts), *data.shape[1:]), np.float32)
    seasons = np.empty((len(starts), 2), np.float32)
    indices = np.empty((len(starts), STEPS), int)
    exact = True
    zero = encode(np.zeros(data.shape[1:], np.float32))
    for row, i in enumerate(starts):
        history = data[i:i + 3]
        season = sincos(dates[i + 2])
        request = {"init_states": encode(history), "doy_sincos": season.tolist(), "steps": STEPS}
        raw[row] = forecast(*parse_simulation(request))
        for name, rollouts in shock.items():
            delta = S.make_shock(name, history[-1], std)
            shock_inputs = parse_simulation({**request, "perturbation": encode(delta)})
            rollouts[row] = forecast(*shock_inputs)
        if include_shocks:
            zero_inputs = parse_simulation({**request, "perturbation": zero})
            zero_output = forecast(*zero_inputs)
            exact &= (raw[row].tobytes() == zero_output.tobytes() and
                      history.tobytes() == zero_inputs[0].tobytes())
        last[row], seasons[row] = history[-1], season
        truth[row] = data[i + 3:i + 3 + STEPS]
        indices[row] = [clim_index(day) for day in dates[i + 3:i + 3 + STEPS]]
        if (row + 1) % 100 == 0:
            print(f"{split}: {row + 1}/{len(starts)} windows cached", flush=True)
    np.savez(output, raw=raw, truth=truth, last=last, seasons=seasons, indices=indices,
             first=dates[starts], final=dates[starts + 2 + STEPS], zero_exact=exact,
             model_id=model.model_id, **shock)


@dataclass
class Windows:
    cache: dict
    smooth: np.ndarray
    kit: np.ndarray
    raw: np.ndarray

    @classmethod
    def load(cls, cache_file, fit):
        with np.load(cache_file) as source:
            cache = dict(source)
        seasons = cache["seasons"].astype(float)
        phase = np.arctan2(seasons[:, :1], seasons[:, 1:2]) + DAY_ANGLE * np.arange(1, STEPS + 1)
        basis = harmonic_basis(phase.ravel(), (len(fit["coefficients"]) - 1) // 2)
        smooth = np.einsum("kb,bchw->kchw", basis, fit["coefficients"]).reshape(cache["raw"].shape)
        return cls(cache, smooth, fit["kit"][cache["indices"]], clip_batch(cache["raw"].astype(float)))

    @property
    def truth(self):
        return self.cache["truth"]

    @property
    def last(self):
        return self.cache["last"]

    def predict(self, blend, ids, source="raw", shock_name=None, std=None):
        result = self.cache[source][ids].astype(float)
        for row, idx in enumerate(ids):
            last = self.last[idx]
            if shock_name is not None:
                last = last + S.make_shock(shock_name, last, std)
            blend.apply(result[row], last, self.cache["seasons"][idx])
            clip_forecast(result[row])
        return result


def clip_batch(raw):
    for rollout in raw:
        clip_forecast(rollout)
    return raw


@dataclass
class ReferenceScores:
    truth: np.ndarray
    window_rmse: np.ndarray
    pooled_rmse: np.ndarray
    csi_window: np.ndarray
    csi_pooled: np.ndarray

    @classmethod
    def build(cls, windows, ids):
        truth = windows.truth[ids][:, LEAD_IDX]
        last = windows.last[ids, None]
        clim = windows.kit[ids][:, LEAD_IDX]
        persist = np.broadcast_to(last, truth.shape)
        rmse_persist, rmse_clim = window_rmse(persist, truth), window_rmse(clim, truth)
        rmse = np.minimum(rmse_persist, rmse_clim)
        pooled = np.sqrt(np.minimum(np.mean(rmse_persist**2, axis=0), np.mean(rmse_clim**2, axis=0)))
        csi_window = best_csi(csi_windows(persist, truth), csi_windows(clim, truth))
        csi_pooled = best_csi(csi_leads(persist, truth), csi_leads(clim, truth))
        return cls(truth, rmse, pooled, csi_window, csi_pooled)

    def score(self, forecast):
        selected = forecast[:, LEAD_IDX]
        error = window_rmse(selected, self.truth)
        # Vectorized equivalent of the kit skill formula per channel.
        with np.errstate(divide="ignore", invalid="ignore"):
            window = np.nanmean(np.where(self.window_rmse > 0, 1 - error / self.window_rmse, np.nan), axis=-1)
            pooled = np.nanmean(np.where(self.pooled_rmse > 0,
                                        1 - np.mean(error**2, axis=0)**0.5 / self.pooled_rmse, np.nan), axis=-1)
        csi_raw = csi_windows(selected, self.truth)
        csi_pool = csi_leads(selected, self.truth)
        csi = csi_skills(csi_raw, self.csi_window)
        pooled_csi = csi_skills(csi_pool, self.csi_pooled)
        at_25 = np.array([S.csi(p, t, 25) for p, t in zip(selected[:, 0, 1], self.truth[:, 0, 1])])
        return WindowScores(window, pooled, csi, pooled_csi, csi_pool, at_25,
                            S.csi(selected[:, 0, 1], self.truth[:, 0, 1], 25))


@dataclass
class WindowScores:
    skill: np.ndarray
    pooled: np.ndarray
    csi: np.ndarray
    pooled_csi: np.ndarray
    csi_raw: np.ndarray
    heavy: np.ndarray
    pooled_heavy: float

    def rain_passes(self, raw):
        return bool(np.nanmean(self.csi) + TOL >= np.nanmean(raw.csi) - 0.005
                    and np.all(self.pooled_csi + TOL >= raw.pooled_csi - 0.005)
                    and np.nanmean(self.heavy) + TOL >= np.nanmean(raw.heavy)
                    and self.pooled_heavy + TOL >= raw.pooled_heavy)


def window_rmse(pred, truth):
    # Same latitude weights and reductions as scoring.rmse_lat, retaining the window and lead axes.
    return np.sqrt(np.mean((pred - truth)**2 * lat_weights()[:, None], axis=(-2, -1)))


def csi_windows(pred, truth):
    return np.array([S.csi(p[:, 1], t[:, 1]) for p, t in zip(pred, truth)])


def csi_leads(pred, truth):
    return np.array([S.csi(p[:, 1], t[:, 1]) for p, t in zip(pred.swapaxes(0, 1), truth.swapaxes(0, 1))])


def best_csi(first, second):
    return np.fmax(first, second)


def csi_skills(candidate, reference):
    return np.array([S.csi_skill(p, r, r) for p, r in zip(candidate, reference)])


def least_squares(windows, ids, land, rung, persistence, region, floor=MIN_ALPHA):
    mask = np.ones_like(land, dtype=bool) if rung == 1 else (land == region)
    weights = np.broadcast_to(lat_weights()[:, None], land.shape)[mask]
    smooth = windows.smooth[ids][..., mask]
    last = windows.last[ids, None][..., mask]
    reference = smooth + persistence[None, :, None, None] * (last - smooth)
    anomaly = windows.cache["raw"][ids][..., mask] - reference
    target = windows.truth[ids][..., mask] - reference
    cross = np.einsum("nkcx,nkcx,x->kc", anomaly, target, weights)
    square = np.einsum("nkcx,nkcx,x->kc", anomaly, anomaly, weights)
    if rung != 3:
        return np.clip(np.divide(cross, square, out=np.ones_like(cross), where=square > 0), floor, 1)
    # Bound the rate using the last fitted lead so every earlier weight also meets the floor.
    max_rate = np.nextafter(-np.log(floor) / STEPS, 0)
    rates = np.r_[0, np.geomspace(0.001, max_rate, 300)]
    alpha = np.exp(-np.arange(1, STEPS + 1)[:, None] * rates)
    objective = (alpha**2).T @ square - 2 * alpha.T @ cross
    return alpha[:, np.argmin(objective, axis=0)]


def fit_rung(windows, fit, ids, rung, floor=MIN_ALPHA):
    ref = ReferenceScores.build(windows, ids)
    raw = ref.score(windows.raw[ids])
    best = None
    mix_levels = (0.25, 0.5, 0.75, 1) if rung == 4 else (0,)
    for mix in mix_levels:
        persistence = mix * np.maximum(0, (9 - np.arange(1, STEPS + 1)) / 8)
        ocean = least_squares(windows, ids, fit["land"], rung, persistence, 0, floor)
        land = least_squares(windows, ids, fit["land"], rung, persistence, 1, floor) if rung > 1 else ocean
        alpha = np.stack((ocean, land), axis=-1)
        for strength in (1, 0.75, 0.5, 0.25):
            # Temper exponential shrinkage by scaling its rate, keeping an exponential profile.
            weights = alpha**strength if rung == 3 else 1 - strength * (1 - alpha)
            fitted = ClimBlend(fit["coefficients"], weights, fit["land"], persistence)
            predicted = windows.predict(fitted, ids)
            score = ref.score(predicted)
            raw_rain = windows.raw[ids, :, 1]
            improves_rain = np.mean((predicted[:, :, 1] - windows.truth[ids, :, 1])**2) < np.mean(
                (raw_rain - windows.truth[ids, :, 1])**2)
            if not improves_rain or not score.rain_passes(raw):
                weights[:, 1] = 1
                fitted = ClimBlend(fit["coefficients"], weights, fit["land"], persistence)
                predicted[:, :, 1] = raw_rain
                score = ref.score(predicted)
            gain = np.nanmean(score.skill - raw.skill, axis=0)
            if gain[0] < -0.005 and rung != 3:
                weights[0] = 1
                fitted = ClimBlend(fit["coefficients"], weights, fit["land"], persistence)
                predicted[:, 0] = windows.raw[ids, 0]
                score = ref.score(predicted)
                gain = np.nanmean(score.skill - raw.skill, axis=0)
            # Rank by long-lead gain, preferring settings that protect day one.
            rank = (gain[0] >= -0.005, float(gain[1:].mean()))
            if best is None or rank > best[0]:
                best = rank, fitted, {"strength": strength, "persistence_level": mix}
    return best[1:]


def shocks(windows, prime, ids, std, blend=None):
    scores = {}
    for name, box in SHOCK_BOX.items():
        if blend is None:
            changed = clip_batch(windows.cache[name][ids].astype(float))
        else:
            changed = windows.predict(blend, ids, name, name, std)
        checks = [S.causality_checks(a, b, box, std) for a, b in zip(prime, changed)]
        scores[name] = {key: int(sum(item[key] for item in checks)) for key in KEYS}
    return scores


def summarize(windows, ids, prediction, new, baseline):
    ratios = np.stack([S.variance_ratio(p[7], t[7]) for p, t in zip(prediction, windows.truth[ids])])
    in_band = (ratios >= S.BLUR_MIN_RATIO) & (ratios <= S.BLUR_MAX_RATIO)
    return {
        "windows": len(ids), "skill": np.nanmean(new.skill, axis=0).tolist(), "pooled_skill": new.pooled.tolist(),
        "paired_ci": [ci(column) for column in (new.skill - baseline.skill).T],
        "csi_skill": float(np.nanmean(new.csi)), "csi_skill_by_lead_pooled": new.pooled_csi.tolist(),
        "csi_by_lead_pooled": new.csi_raw.tolist(),
        "csi_25": float(np.nanmean(new.heavy)), "csi_25_pooled": new.pooled_heavy,
        "variance": np.nanmean(ratios, axis=0).tolist(), "in_band": float(in_band.all(axis=1).mean()),
        "in_band_cells": float(in_band.mean()), "in_band_per_channel": in_band.mean(axis=0).tolist(),
        "rain_pass": new.rain_passes(baseline),
    }


def score_pair(windows, ids, predicted):
    reference = ReferenceScores.build(windows, ids)
    raw = windows.raw[ids]
    baseline, candidate = reference.score(raw), reference.score(predicted)
    return {"raw": summarize(windows, ids, raw, baseline, baseline),
            "candidate": summarize(windows, ids, predicted, candidate, baseline)}


def save_artifact(path, blend):
    torch.save({field: torch.from_numpy(getattr(blend, field)) for field in FIELDS}, path)


def check_rung(args, windows, fit, std, output):
    ids = np.arange(len(windows.raw))
    cutoff = np.datetime64("2020-07-01")
    halves = (ids[windows.cache["final"] < cutoff], ids[windows.cache["first"] >= cutoff])
    results = {"rung": args.rung, "floor": args.floor, "model_id": str(windows.cache["model_id"]), "cross": {}}
    for label, training, held_out in zip(("Jan–Jun", "Jul–Dec"), halves[::-1], halves):
        blend, settings = fit_rung(windows, fit, training, args.rung, args.floor)
        predicted = windows.predict(blend, held_out)
        results["cross"][label] = {**score_pair(windows, held_out, predicted), "settings": settings}
        print(f"rung {args.rung}: scored {label}", flush=True)
    blend, settings = fit_rung(windows, fit, ids, args.rung, args.floor)
    predicted = windows.predict(blend, ids)
    results.update(score_pair(windows, ids, predicted))
    results["settings"] = settings
    results["raw"]["shocks"] = shocks(windows, windows.raw, ids, std)
    results["candidate"]["shocks"] = shocks(windows, predicted, ids, std, blend)
    results["candidate"]["zero_exact"] = bool(windows.cache["zero_exact"])
    results["alpha"] = blend.alpha.tolist()
    results["persistence"] = blend.persistence.tolist()

    crossed = [entry["candidate"] for entry in results["cross"].values()]
    differences = [np.array([p["mean"] for p in entry["paired_ci"]]) for entry in crossed + [results["candidate"]]]
    after = results["candidate"]
    raw_shocks = results["raw"]["shocks"]
    results["gates"] = {
        "skill": bool(all(gain[0] >= -0.005 for gain in differences) and
                      all((gain[1:] > 0).all() for gain in differences[:2])),
        "positive_day4_day8": all(value > 0 for value in after["skill"][1:]),
        "rain": after["rain_pass"],
        "variance": all(S.BLUR_MIN_RATIO <= ratio <= S.BLUR_MAX_RATIO for ratio in after["variance"])
                    and after["in_band"] >= 0.9,
        "causality": after["zero_exact"] and all(after["shocks"][name][key] >= raw_shocks[name][key]
                                               for name in SHOCK_BOX for key in KEYS),
    }
    save_artifact(output / f"rung{args.rung}_floor{args.floor:g}.pt", blend)
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("phase", choices=("prepare", "val", "test"))
    parser.add_argument("--data", required=True, type=Path)
    parser.add_argument("--stats", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--rung", type=int, choices=range(1, 5))
    parser.add_argument("--artifact", type=Path)
    parser.add_argument("--ckpt", type=Path, default=ROOT / "model" / "bundle" / "pralaya.pt",
                        help="checkpoint whose raw rollouts the blend is fitted to")
    parser.add_argument("--floor", type=float, default=MIN_ALPHA, help="minimum model weight (>= 0.3)")
    args = parser.parse_args()
    output = args.output.resolve()
    if output.is_relative_to(ROOT):
        parser.error("the experiment cache must be outside the repository")
    output.mkdir(parents=True, exist_ok=True)
    if not MIN_ALPHA <= args.floor <= 1:
        parser.error(f"--floor must be in [{MIN_ALPHA}, 1]")
    std = np.array(json.loads(args.stats.read_text())["std"], np.float32)
    logging.getLogger("inference_adapter").setLevel(logging.ERROR)
    train = output / "train_reference.npz"
    validation = output / "validation.npz"
    if args.phase == "prepare":
        train_reference(args.data, train)
        collect(args.data, "val", std, validation, include_shocks=True, ckpt=args.ckpt)
        return
    with np.load(train) as source:
        fit = dict(source)
    if args.phase == "val":
        if args.rung is None:
            parser.error("val requires --rung")
        report = output / f"rung{args.rung}_floor{args.floor:g}.json"
        result = check_rung(args, Windows.load(validation, fit), fit, std, output)
    else:
        report = output / "test.json"
        if args.artifact is None or not args.artifact.is_file():
            parser.error("test requires one existing frozen --artifact")
        if report.exists():
            parser.error("a test report already exists")
        blend = ClimBlend.load_optional(args.artifact)
        test = output / "test_windows.npz"
        collect(args.data, "test", std, test, include_shocks=False, ckpt=args.ckpt)
        windows = Windows.load(test, fit)
        ids = np.arange(len(windows.raw))
        result = score_pair(windows, ids, windows.predict(blend, ids))
    report.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n")
    print(f"Wrote {report}", flush=True)


if __name__ == "__main__":
    main()
