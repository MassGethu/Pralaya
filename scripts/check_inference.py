"""Measure eight sequential HTTP calls and check the Round 1 forecast contract."""

import argparse
import json
from pathlib import Path
from time import perf_counter

import numpy as np
import requests
from monsoon_r1 import contract, scoring


def synthetic_request(index: int = 0) -> dict:
    lat = np.deg2rad(contract.LAT)[:, None]
    lon = np.deg2rad(contract.LON)[None, :]
    base = np.array([295, 4, 2, 1, 100500, 35], dtype=np.float32)
    scale = np.array([3, 2, 1, 1, 300, 5], dtype=np.float32)
    days = [base[:, None, None] + scale[:, None, None] * np.sin(4 * lat + lon + 0.3 * (day + index)) for day in range(3)]
    return {
        "init_states": contract.encode_list(np.stack(days)),
        "doy_sincos": contract.doy_sincos(160 + index * 33),
        "steps": contract.SCORE_STEPS,
        "perturbation": None,
    }


def check_forecast(session: requests.Session, url: str, payload: dict, name: str) -> tuple[np.ndarray, dict]:
    start = perf_counter()
    response = session.post(url + "/simulate", json=payload, timeout=5, allow_redirects=False)
    wall_ms = (perf_counter() - start) * 1000
    if response.status_code != 200:
        raise RuntimeError(f"{name}: HTTP {response.status_code}: {response.text[:300]}")
    document = response.json()
    assert isinstance(document["rollout"], list), f"{name}: expected nested JSON lists"
    rollout = np.asarray(document["rollout"])
    inference_ms = document["inference_ms"]
    assert rollout.dtype.kind in "iuf", f"{name}: expected numeric rollout values"
    assert type(inference_ms) in (int, float) and np.isfinite(inference_ms) and inference_ms >= 0, name
    assert not scoring.validity(rollout, payload["steps"]), f"{name}: {scoring.validity(rollout, payload['steps'])}"
    assert np.all(rollout[:, 1] >= 0), f"{name}: negative rain"
    assert wall_ms < 5000, f"{name}: exceeded 5 seconds ({wall_ms:.1f} ms)"
    assert len(response.content) < 80_000_000, f"{name}: response exceeded 80 MB"
    return rollout, {
        "case": name,
        "wall_ms": round(wall_ms, 2),
        "inference_ms": round(inference_ms, 2),
        "response_bytes": len(response.content),
    }


def verify(url: str, development: bool, local_request: Path | None, stats: Path | None) -> dict:
    requests_to_test = {f"synthetic_{index + 1}": synthetic_request(index) for index in range(5)}
    if local_request is not None:
        with local_request.open() as source:
            requests_to_test["local_history"] = json.load(source)
        del requests_to_test["synthetic_5"]
    prime = "local_history" if local_request is not None else "synthetic_1"
    payload = {**requests_to_test[prime], "steps": contract.SCORE_STEPS, "perturbation": None}
    requests_to_test[prime] = payload
    last = np.asarray(payload["init_states"], dtype=np.float32)[-1]
    std = scoring.STD_DEFAULT
    if stats is not None:
        with stats.open() as source:
            std = np.asarray(json.load(source)["std"], dtype=np.float32)
    shocks = {"warm_ocean": contract.BOX_BAY_OF_BENGAL, "monsoon_stall": contract.BOX_ARABIAN_SEA, "null": None}
    for name in shocks:
        delta = scoring.make_shock(name, last, std)
        requests_to_test[name] = {**payload, "perturbation": contract.encode_list(delta)}

    with requests.Session() as session:
        session.trust_env = False
        ready = session.post(url + "/health", timeout=5, allow_redirects=False)
        expected_name = "PRALAYA-dev-persistence" if development else "PRALAYA"
        assert ready.status_code == 200 and ready.json() == {"status": "ready", "model_name": expected_name}

        rollouts, timings = {}, []
        for name, request in requests_to_test.items():
            rollouts[name], timing = check_forecast(session, url, request, name)
            timings.append(timing)

        base = rollouts[prime]
        assert np.array_equal(base, rollouts["null"]), "null and zero shock diverged"
        repeated, _ = check_forecast(session, url, payload, "prime_repeated_after_shocks")
        assert np.array_equal(base, repeated), "the original forecast changed after shock requests"
        for horizon in (1, contract.MAX_STEPS):
            check_forecast(session, url, {**payload, "steps": horizon}, f"horizon_{horizon}")
        for invalid in ({"steps": True}, {"steps": contract.MAX_STEPS + 1}, {"doy_sincos": ["0", 1]}, {"init_states": []}):
            response = session.post(url + "/simulate", json={**payload, **invalid}, timeout=5, allow_redirects=False)
            assert response.status_code == 422, f"expected an input error for {invalid}"

    diagnostics = {
        name: scoring.causality_checks(base, rollouts[name], box, std)
        for name, box in shocks.items() if box is not None
    }
    if development:
        for name in shocks:
            expected = last + scoring.make_shock(name, last, std)
            assert np.array_equal(rollouts[name], np.broadcast_to(expected, base.shape)), name
    return {
        "model_name": expected_name,
        "shock_history": prime,
        "shock_std": std.tolist(),
        "requests": timings,
        "null_zero_exact": True,
        "repeat_after_shock_exact": True,
        "checked_horizons": [1, 10, contract.MAX_STEPS],
        "shock_diagnostics": diagnostics,
        "localized_nonzero_response": any(d["nonzero"] and d["localized"] for d in diagnostics.values()),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", nargs="?", default="http://localhost:8000")
    parser.add_argument("--dev", action="store_true", help="expect the development baseline")
    parser.add_argument("--request", type=Path, help="a permitted local physical-unit history payload")
    parser.add_argument("--stats", type=Path, help="official stats.json for shock diagnostic scales")
    parser.add_argument("--write-request", type=Path, help="write a canonical synthetic payload and exit")
    args = parser.parse_args()
    if args.write_request:
        args.write_request.write_text(json.dumps(synthetic_request(), allow_nan=False) + "\n")
        return
    print(json.dumps(verify(args.url.rstrip("/"), args.dev, args.request, args.stats), indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
