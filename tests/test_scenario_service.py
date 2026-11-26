import unittest

import numpy as np

from inference_adapter import HISTORY_SHAPE
from scripts.scenario_service import ScenarioRequest, evaluate


class ControlledForecast:
    def run(self, history, season, steps):
        # Translate an average temperature shock into a predictable rainfall deficit.
        state = history[-1].astype(np.float64)
        state[1] = 6 - (state[0].mean() - 295)
        return np.repeat(state[None], steps, axis=0)


class ScenarioServiceTest(unittest.TestCase):
    def setUp(self):
        air = np.array([295, 4, 2, 1, 100500, 35], dtype=np.float32)
        history = np.broadcast_to(air[None, :, None, None], HISTORY_SHAPE)
        self.parameters = {
            "init_states": history.tolist(), "doy_sincos": [0, 1],
            "steps": 2, "day_start": 1, "day_end": 2, "impact_box": [18, 26, 74, 84],
            "candidates": [{"recipe": "warm_ocean", "strength": x} for x in (0.5, 1)],
            "daily_water_target_mm": 7,
            "actions": [{"name": "Supplement", "daily_supplement_mm": 1}],
        }
        self.land = np.ones(HISTORY_SHAPE[-2:], dtype=bool)

    def result(self, threshold):
        request = ScenarioRequest(**self.parameters, deficit_mm=threshold)
        return evaluate(request, ControlledForecast(), self.land, {"model_id": "controlled"})

    def test_selects_least_cost_and_reports_quantiles_and_shortfall(self):
        result = self.result(0.2)
        self.assertEqual(result["best"]["index"], 0)
        self.assertAlmostEqual(result["best"]["deficit_mm"], 0.375)
        self.assertEqual(result["ensemble"]["qualifying_count"], 2)
        self.assertAlmostEqual(result["ensemble"]["p50_cumulative_mm"][-1], 11.4375)
        np.testing.assert_allclose(result["actions"][0]["shortfall_mm_by_scenario"], [2.375, 2.75])
        np.testing.assert_allclose(result["actions"][1]["shortfall_mm_by_scenario"], [0.375, 0.75])
        self.assertEqual(np.count_nonzero(result["best"]["perturbation"]), 288)

    def test_reports_no_match_and_rejects_invalid_geography(self):
        result = self.result(10)
        self.assertIsNone(result["best"])
        self.assertEqual(result["ensemble"]["qualifying_fraction"], 0)
        self.parameters["candidates"][0]["box"] = [18, 26, 74, 84]
        with self.assertRaisesRegex(ValueError, "stay inside"):
            self.result(1)


if __name__ == "__main__":
    unittest.main()
