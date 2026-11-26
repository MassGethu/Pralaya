import numpy as np
import pytest

import inference_adapter
from postprocess.clim_blend import ClimBlend, HORIZON, MIN_ALPHA, STATE_SHAPE
from test_contract import BUNDLE, _history, _season


def test_missing_artifact_matches_original_adapter_bit_for_bit(tmp_path, monkeypatch):
    monkeypatch.setattr(inference_adapter, "BLEND_PATH", tmp_path / "absent.pt")
    engine = inference_adapter.Inference(BUNDLE, development=False)
    history, season = _history(), _season()
    for steps in (1, 10, 14):
        original = np.array(engine._forecast(history, season, steps), dtype=np.float64)
        np.clip(original[:, 0], 233.15, 333.15, out=original[:, 0])
        np.maximum(original[:, 1], 0, out=original[:, 1])
        served = engine.run(history, season, steps)
        assert served.dtype == original.dtype
        assert served.tobytes() == original.tobytes()


def test_blend_advances_phase_uses_regions_and_preserves_unfitted_leads():
    coefficients = np.zeros((5, *STATE_SHAPE))
    coefficients[1] = 1  # sin of target day
    alpha = np.full((HORIZON, 6, 2), MIN_ALPHA)
    alpha[:, :, 1] = 1
    land = np.zeros(STATE_SHAPE[1:], dtype=bool)
    land[0, 0] = True
    persistence = np.zeros(HORIZON)
    persistence[1] = 0.25
    blend = ClimBlend(coefficients, alpha, land, persistence)
    rollout = np.full((14, *STATE_SHAPE), 8.0)
    blend.apply(rollout, np.full(STATE_SHAPE, 4.0), _season(365))
    expected = np.sin(2 * np.pi * np.arange(1, 11) / 365)
    expected[1] = 0.75 * expected[1] + 1
    np.testing.assert_allclose(rollout[:10, 0, 0, 1], 8 * MIN_ALPHA + (1 - MIN_ALPHA) * expected, atol=1e-12)
    assert (rollout[:, :, 0, 0] == 8).all()
    assert (rollout[10:] == 8).all()


def test_blend_rejects_model_weight_below_floor():
    alpha = np.ones((HORIZON, 6, 2))
    alpha[-1, -1, -1] = MIN_ALPHA - 0.001
    with pytest.raises(ValueError, match="model weights"):
        ClimBlend(np.zeros((7, *STATE_SHAPE)), alpha, np.zeros(STATE_SHAPE[1:], dtype=bool), np.zeros(HORIZON))


def _toy_blend():
    coefficients = np.zeros((7, *STATE_SHAPE))
    coefficients[0] = np.array([290, 3, 0, 0, 100800, 30])[:, None, None]
    alpha = np.full((HORIZON, 6, 2), 0.5)
    alpha[:, 1] = 1
    persistence = np.linspace(0.5, 0, HORIZON)
    return ClimBlend(coefficients, alpha, np.zeros(STATE_SHAPE[1:], dtype=bool), persistence)


def test_scorer_wrapper_matches_served_adapter(monkeypatch):
    """scripts/clim_blend_score.py must score exactly what Inference.run serves, shocked or not."""
    from scripts.clim_blend_score import ServedForecaster

    blend = _toy_blend()
    monkeypatch.setattr(inference_adapter.ClimBlend, "load_optional", classmethod(lambda cls, path: blend))
    engine = inference_adapter.Inference(BUNDLE, development=False)
    wrapper = ServedForecaster(BUNDLE / "pralaya.pt", blend)
    history, season = _history(), _season()
    delta = np.zeros(STATE_SHAPE, dtype=np.float32)
    delta[0, 10:14, 20:24] = 1.5
    for perturbation in (None, np.zeros(STATE_SHAPE, dtype=np.float32), delta):
        served_history = history.copy()
        if perturbation is not None and np.any(perturbation):
            served_history[-1] += perturbation
        served = engine.run(served_history, season, 10)
        scored = wrapper.simulate(history, season, 10, perturbation)
        assert scored.tobytes() == served.tobytes()


def test_zero_perturbation_is_bit_identical_with_blend(monkeypatch):
    blend = _toy_blend()
    monkeypatch.setattr(inference_adapter.ClimBlend, "load_optional", classmethod(lambda cls, path: blend))
    engine = inference_adapter.Inference(BUNDLE, development=False)
    request = {"init_states": _history().tolist(), "doy_sincos": _season().tolist(), "steps": 10}
    base = engine.run(*inference_adapter.parse_simulation(request))
    zero = engine.run(*inference_adapter.parse_simulation({**request, "perturbation": np.zeros(STATE_SHAPE).tolist()}))
    assert base.tobytes() == zero.tobytes()
