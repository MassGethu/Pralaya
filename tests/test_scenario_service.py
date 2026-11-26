import unittest

import numpy as np

from inference_adapter import HISTORY_SHAPE
from scripts.scenario_service import ScenarioRequest, Shock, build_delta, evaluate


class ControlledForecast:
    def run(self, history, season, steps, prime_history=None):
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

    def test_signed_shocks_match_recipe_units_and_limits(self):
        last = np.asarray(self.parameters["init_states"][-1], dtype=np.float32)
        cool, _ = build_delta(last, Shock(recipe="warm_ocean", amplitude=-1))
        wind, _ = build_delta(last, Shock(recipe="monsoon_stall", amplitude=30))
        self.assertEqual(float(cool[0].min()), -1)
        self.assertEqual(float(cool[5].min()), -1.75)
        self.assertAlmostEqual(float(wind[2].max()), 0.6)
        with self.assertRaisesRegex(ValueError, "amplitude must be nonzero and within"):
            Shock(recipe="monsoon_stall", amplitude=31)

    def test_rainfall_threshold_detects_crossing_and_prime_already_above(self):
        self.parameters["candidates"] = [{"recipe": "warm_ocean", "amplitude": -1}]
        for threshold, crosses in [(12.1, True), (11.9, False)]:
            request = ScenarioRequest(**self.parameters, rainfall_at_least_mm=threshold)
            report = evaluate(request, ControlledForecast(), self.land, {})
            self.assertEqual(report["best"] is not None, crosses)
            self.assertEqual(report["baseline_meets_threshold"], not crosses)

    def test_defaults_and_range_follow_checkpoint(self):
        self.parameters.pop("candidates")
        request = ScenarioRequest(**self.parameters, deficit_mm=0.2)
        b3 = evaluate(request, ControlledForecast(), self.land, {"model_id": "b3_roll4"})
        e3 = evaluate(request, ControlledForecast(), self.land, {"model_id": "e3_roll8_ocean"})
        self.assertEqual(b3["ensemble"]["scenario_count"], 9)
        self.assertEqual(e3["ensemble"]["scenario_count"], 10)
        warm = next(c for c in e3["candidates"] if c["recipe"] == "warm_ocean" and c["amplitude"] == 1.5)
        self.assertTrue(warm["within_recommended_range"])
        self.assertFalse(warm["within_b3_recommended_range"])

    def test_rainstab_profile_uses_its_own_validated_ranges(self):
        self.parameters.pop("candidates")
        request = ScenarioRequest(**self.parameters, deficit_mm=0.2)
        report = evaluate(request, ControlledForecast(), self.land, {"model_id": "e3_rainstab"})
        self.assertEqual(report["ensemble"]["scenario_count"], 13)
        by = {(c["recipe"], c["amplitude"]): c for c in report["candidates"]}
        self.assertTrue(by[("warm_ocean", 2)]["within_recommended_range"])
        self.assertTrue(by[("monsoon_stall", -30)]["within_recommended_range"])
        self.assertFalse(by[("warm_ocean", 2)]["within_b3_recommended_range"])


if __name__ == "__main__":
    unittest.main()
