"""Tests for AudioEffectModulator — volume/tempo/combined modes."""
import pytest

from custom_components.aqara_advanced_lighting.audio_effect_modulator import (
    compute_speed_volume,
    compute_speed_tempo,
    compute_speed_combined,
)
from custom_components.aqara_advanced_lighting.const import SPEED_DEADBAND

BPM_MIN = 40.0
BPM_MAX = 200.0


class TestVolumeMode:
    def test_zero_energy_maps_to_min(self):
        assert compute_speed_volume(energy=0.0, sensitivity=50, speed_min=10, speed_max=90) == 10

    def test_full_energy_maps_to_max(self):
        assert compute_speed_volume(energy=1.0, sensitivity=50, speed_min=10, speed_max=90) == 90

    def test_mid_energy_maps_to_mid(self):
        result = compute_speed_volume(energy=0.5, sensitivity=50, speed_min=0, speed_max=100)
        assert result == 50

    def test_high_sensitivity_amplifies(self):
        low_sens = compute_speed_volume(energy=0.3, sensitivity=20, speed_min=1, speed_max=100)
        high_sens = compute_speed_volume(energy=0.3, sensitivity=80, speed_min=1, speed_max=100)
        assert high_sens > low_sens

    def test_energy_clamped_to_range(self):
        result = compute_speed_volume(energy=1.5, sensitivity=50, speed_min=1, speed_max=100)
        assert result == 100


class TestTempoMode:
    def test_min_bpm_maps_to_min_speed(self):
        result = compute_speed_tempo(bpm=BPM_MIN, sensitivity=50, speed_min=10, speed_max=90)
        assert result == 10

    def test_max_bpm_maps_to_max_speed(self):
        result = compute_speed_tempo(bpm=BPM_MAX, sensitivity=50, speed_min=10, speed_max=90)
        assert result == 90

    def test_zero_bpm_maps_to_min(self):
        result = compute_speed_tempo(bpm=0.0, sensitivity=50, speed_min=10, speed_max=90)
        assert result == 10

    def test_mid_bpm_maps_to_mid(self):
        mid_bpm = (BPM_MIN + BPM_MAX) / 2
        result = compute_speed_tempo(bpm=mid_bpm, sensitivity=50, speed_min=0, speed_max=100)
        assert result == 50

    def test_high_sensitivity_narrows_range(self):
        low_sens = compute_speed_tempo(bpm=100, sensitivity=20, speed_min=1, speed_max=100)
        high_sens = compute_speed_tempo(bpm=100, sensitivity=80, speed_min=1, speed_max=100)
        assert high_sens != low_sens


class TestCombinedMode:
    def test_zero_energy_uses_tempo_baseline(self):
        result = compute_speed_combined(bpm=120.0, energy=0.0, sensitivity=50, speed_min=0, speed_max=100)
        tempo_baseline = compute_speed_tempo(bpm=120.0, sensitivity=50, speed_min=0, speed_max=100)
        assert result == tempo_baseline

    def test_energy_modulates_around_baseline(self):
        baseline = compute_speed_combined(bpm=120.0, energy=0.0, sensitivity=50, speed_min=0, speed_max=100)
        with_energy = compute_speed_combined(bpm=120.0, energy=0.8, sensitivity=50, speed_min=0, speed_max=100)
        assert with_energy > baseline

    def test_result_clamped_to_range(self):
        result = compute_speed_combined(bpm=200.0, energy=1.0, sensitivity=100, speed_min=10, speed_max=90)
        assert 10 <= result <= 90


class TestDeadbandCheck:
    def test_first_value_always_passes(self):
        from custom_components.aqara_advanced_lighting.audio_effect_modulator import DeadbandFilter
        db = DeadbandFilter(threshold=SPEED_DEADBAND)
        assert db.check(50) is True

    def test_small_change_filtered(self):
        from custom_components.aqara_advanced_lighting.audio_effect_modulator import DeadbandFilter
        db = DeadbandFilter(threshold=SPEED_DEADBAND)
        db.check(50)
        assert db.check(52) is False

    def test_large_change_passes(self):
        from custom_components.aqara_advanced_lighting.audio_effect_modulator import DeadbandFilter
        db = DeadbandFilter(threshold=SPEED_DEADBAND)
        db.check(50)
        assert db.check(55) is True


class TestSpeedSmoother:
    def test_first_value_passes_through(self):
        from custom_components.aqara_advanced_lighting.audio_effect_modulator import SpeedSmoother
        s = SpeedSmoother()
        assert s.update(50) == 50

    def test_small_changes_smoothed(self):
        from custom_components.aqara_advanced_lighting.audio_effect_modulator import SpeedSmoother
        s = SpeedSmoother()
        s.update(50)
        # Small change (5 units) should be heavily smoothed — not jump to 55
        result = s.update(55)
        assert result < 55
        assert result > 50

    def test_large_jump_tracks_fast(self):
        from custom_components.aqara_advanced_lighting.audio_effect_modulator import SpeedSmoother
        s = SpeedSmoother()
        s.update(30)
        # Large change (40 units) should track quickly
        result = s.update(70)
        assert result >= 55  # should move most of the way

    def test_repeated_same_value_converges(self):
        from custom_components.aqara_advanced_lighting.audio_effect_modulator import SpeedSmoother
        s = SpeedSmoother()
        s.update(50)
        # Feed the same value repeatedly — should converge
        for _ in range(20):
            result = s.update(80)
        assert result == 80


class TestSilenceTarget:
    def test_hold_returns_last_value(self):
        from custom_components.aqara_advanced_lighting.audio_effect_modulator import get_silence_target
        assert get_silence_target("hold", last_written=70, speed_min=1, speed_max=100) == 70

    def test_hold_with_no_prior_write(self):
        from custom_components.aqara_advanced_lighting.audio_effect_modulator import get_silence_target
        assert get_silence_target("hold", last_written=None, speed_min=10, speed_max=90) == 10

    def test_decay_min(self):
        from custom_components.aqara_advanced_lighting.audio_effect_modulator import get_silence_target
        assert get_silence_target("decay_min", last_written=70, speed_min=20, speed_max=80) == 20

    def test_decay_mid(self):
        from custom_components.aqara_advanced_lighting.audio_effect_modulator import get_silence_target
        assert get_silence_target("decay_mid", last_written=70, speed_min=20, speed_max=80) == 50
