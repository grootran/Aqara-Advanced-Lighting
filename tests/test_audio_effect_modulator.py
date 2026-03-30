"""Tests for AudioEffectModulator event processing."""
import pytest

from custom_components.aqara_advanced_lighting.audio_curves import (
    apply_response_curve,
    map_to_range,
)
from custom_components.aqara_advanced_lighting.audio_effect_modulator import (
    ModulationChannel,
)
from custom_components.aqara_advanced_lighting.const import (
    SPEED_DEADBAND,
    BRIGHTNESS_DEADBAND,
)


class TestModulationChannel:
    """Test the per-channel modulation logic."""

    def test_continuous_energy_mapping(self):
        ch = ModulationChannel(
            mode="continuous",
            range_min=20,
            range_max=80,
            curve="linear",
            deadband=SPEED_DEADBAND,
        )
        value, changed = ch.process_energy(0.5)
        assert value == 50  # 20 + 0.5 * 60
        assert changed is True

    def test_continuous_deadband_filters(self):
        ch = ModulationChannel(
            mode="continuous",
            range_min=1,
            range_max=100,
            curve="linear",
            deadband=SPEED_DEADBAND,
        )
        # First write always passes
        _, changed1 = ch.process_energy(0.5)
        assert changed1 is True
        # Same value within deadband
        _, changed2 = ch.process_energy(0.51)
        assert changed2 is False

    def test_on_onset_spike(self):
        ch = ModulationChannel(
            mode="on_onset",
            range_min=10,
            range_max=90,
            curve="linear",
            deadband=SPEED_DEADBAND,
        )
        value, changed = ch.process_onset(0.8)
        # 10 + 0.8 * 80 = 74
        assert value == 74
        assert changed is True

    def test_on_onset_bypasses_deadband(self):
        ch = ModulationChannel(
            mode="on_onset",
            range_min=1,
            range_max=100,
            curve="linear",
            deadband=SPEED_DEADBAND,
        )
        ch.process_onset(0.5)
        _, changed = ch.process_onset(0.51)
        # Onset always fires
        assert changed is True

    def test_intensity_breathing_smoothing(self):
        ch = ModulationChannel(
            mode="intensity_breathing",
            range_min=1,
            range_max=100,
            curve="linear",
            deadband=BRIGHTNESS_DEADBAND,
        )
        # Multiple energy updates should smooth via EMA
        ch.process_energy(1.0)
        val1, _ = ch.process_energy(1.0)
        ch.process_energy(0.0)
        val2, _ = ch.process_energy(0.0)
        # After sudden drop, smoothed value should still be > 0
        assert val2 > 1

    def test_onset_flash_combines_envelope_and_spike(self):
        ch = ModulationChannel(
            mode="onset_flash",
            range_min=1,
            range_max=100,
            curve="linear",
            deadband=BRIGHTNESS_DEADBAND,
        )
        # Build up envelope
        ch.process_energy(0.5)
        ch.process_energy(0.5)
        envelope_val, _ = ch.process_energy(0.5)
        # Spike on onset
        onset_val, _ = ch.process_onset(1.0)
        assert onset_val >= envelope_val

    def test_logarithmic_curve(self):
        ch = ModulationChannel(
            mode="continuous",
            range_min=1,
            range_max=100,
            curve="logarithmic",
            deadband=0,
        )
        val_log, _ = ch.process_energy(0.5)
        ch_lin = ModulationChannel(
            mode="continuous",
            range_min=1,
            range_max=100,
            curve="linear",
            deadband=0,
        )
        val_lin, _ = ch_lin.process_energy(0.5)
        assert val_log > val_lin  # Log compresses high values

    def test_exponential_curve(self):
        ch = ModulationChannel(
            mode="continuous",
            range_min=1,
            range_max=100,
            curve="exponential",
            deadband=0,
        )
        val_exp, _ = ch.process_energy(0.5)
        ch_lin = ModulationChannel(
            mode="continuous",
            range_min=1,
            range_max=100,
            curve="linear",
            deadband=0,
        )
        val_lin, _ = ch_lin.process_energy(0.5)
        assert val_exp < val_lin  # Exponential suppresses low values

    def test_disabled_channel_returns_none(self):
        ch = ModulationChannel(
            mode=None,
            range_min=1,
            range_max=100,
            curve="linear",
            deadband=0,
        )
        result = ch.process_energy(0.5)
        assert result is None


class TestModulationChannelOnsetDecay:
    """Test on_onset decay between beats."""

    def test_onset_decay_tick(self):
        ch = ModulationChannel(
            mode="on_onset",
            range_min=1,
            range_max=100,
            curve="linear",
            deadband=0,
        )
        # Spike
        val_spike, _ = ch.process_onset(1.0)
        assert val_spike == 100
        # Decay ticks
        val_decay, _ = ch.process_energy_tick()
        assert val_decay < val_spike

    def test_decay_tick_only_for_on_onset(self):
        ch = ModulationChannel(
            mode="continuous",
            range_min=1,
            range_max=100,
            curve="linear",
            deadband=0,
        )
        result = ch.process_energy_tick()
        assert result is None


class TestModulationChannelSilence:
    """Test silence decay behavior."""

    def test_hold_returns_last_value(self):
        ch = ModulationChannel(
            mode="continuous",
            range_min=1,
            range_max=100,
            curve="linear",
            deadband=0,
        )
        ch.process_energy(0.7)
        target = ch.get_silence_target("hold")
        assert target == 70  # Last written value

    def test_decay_min_returns_min(self):
        ch = ModulationChannel(
            mode="continuous",
            range_min=20,
            range_max=80,
            curve="linear",
            deadband=0,
        )
        ch.process_energy(0.7)
        target = ch.get_silence_target("decay_min")
        assert target == 20

    def test_decay_mid_returns_midpoint(self):
        ch = ModulationChannel(
            mode="continuous",
            range_min=20,
            range_max=80,
            curve="linear",
            deadband=0,
        )
        ch.process_energy(0.7)
        target = ch.get_silence_target("decay_mid")
        assert target == 50
