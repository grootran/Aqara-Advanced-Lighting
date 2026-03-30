"""Tests for audio-reactive response curve functions."""
import math
import pytest

from custom_components.aqara_advanced_lighting.audio_curves import (
    apply_response_curve,
    map_to_range,
)


class TestApplyResponseCurve:
    """Test curve application (input 0.0-1.0 -> output 0.0-1.0)."""

    def test_linear_passthrough(self):
        assert apply_response_curve(0.0, "linear") == 0.0
        assert apply_response_curve(0.5, "linear") == 0.5
        assert apply_response_curve(1.0, "linear") == 1.0

    def test_logarithmic_boundaries(self):
        assert apply_response_curve(0.0, "logarithmic") == 0.0
        assert apply_response_curve(1.0, "logarithmic") == pytest.approx(1.0, abs=0.01)

    def test_logarithmic_compresses_high(self):
        # log curve should have higher output than linear at midpoint
        lin_mid = apply_response_curve(0.5, "linear")
        log_mid = apply_response_curve(0.5, "logarithmic")
        assert log_mid > lin_mid

    def test_exponential_boundaries(self):
        assert apply_response_curve(0.0, "exponential") == 0.0
        assert apply_response_curve(1.0, "exponential") == 1.0

    def test_exponential_suppresses_low(self):
        # exp curve should have lower output than linear at midpoint
        lin_mid = apply_response_curve(0.5, "linear")
        exp_mid = apply_response_curve(0.5, "exponential")
        assert exp_mid < lin_mid

    def test_exponential_midpoint(self):
        assert apply_response_curve(0.5, "exponential") == pytest.approx(0.25, abs=0.01)

    def test_logarithmic_formula(self):
        # log(1 + 0.5 * 9) / log(10) = log(5.5) / log(10)
        expected = math.log(1 + 0.5 * 9) / math.log(10)
        assert apply_response_curve(0.5, "logarithmic") == pytest.approx(expected, abs=0.001)

    def test_clamps_input(self):
        assert apply_response_curve(-0.1, "linear") == 0.0
        assert apply_response_curve(1.5, "linear") == 1.0

    def test_unknown_curve_falls_back_to_linear(self):
        assert apply_response_curve(0.5, "unknown") == 0.5


class TestMapToRange:
    """Test scaling curved output to clamped range."""

    def test_full_range(self):
        assert map_to_range(0.0, 1, 100) == 1
        assert map_to_range(1.0, 1, 100) == 100

    def test_partial_range(self):
        assert map_to_range(0.0, 20, 80) == 20
        assert map_to_range(1.0, 20, 80) == 80
        assert map_to_range(0.5, 20, 80) == 50

    def test_rounds_to_int(self):
        result = map_to_range(0.333, 1, 100)
        assert isinstance(result, int)

    def test_clamps_output(self):
        assert map_to_range(1.5, 1, 100) == 100
        assert map_to_range(-0.5, 1, 100) == 1
