import numpy as np

from scripts.blur_bootstrap import summarise


def test_summarise_full_points_when_every_ratio_in_band():
    ratios = np.ones((20, 6))

    row = summarise(ratios, np.random.default_rng(0))

    assert row["5win_expected_points"] == 10.0
    assert row["5win_p_below_10"] == 0.0
    assert row["tp_frac_windows_below_0.4"] == 0.0


def test_summarise_partial_credit_below_floor():
    ratios = np.ones((20, 6))
    ratios[:, 1] = 0.2  # rain at half the 0.4 floor in every window

    row = summarise(ratios, np.random.default_rng(0))

    assert row["tp_frac_windows_below_0.4"] == 1.0
    assert abs(row["5win_expected_points"] - (10 - 10 / 6 * 0.5)) < 1e-3
    assert row["5win_p_below_10"] == 1.0
