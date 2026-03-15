"""Audio-reactive mode handlers for dynamic scene manager.

Each handler implements a specific audio-reactive behavior mode.
The manager routes events to the active handler, which calls back
to the manager for color advancement and light command dispatch.
"""
from __future__ import annotations

import asyncio
import logging
import time
from abc import ABC
from typing import TYPE_CHECKING, Any

from .const import (
    SILENCE_DEGRADATION_STEP_SECONDS,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


class AudioModeHandler(ABC):
    """Abstract base class for audio-reactive mode handlers."""

    def __init__(self, manager: Any) -> None:
        self._manager = manager
        self._silence_task: asyncio.Task | None = None
        self._in_silence = False

    def handle_onset(self, scene_state: Any, attrs: dict[str, Any]) -> None:
        """Handle an onset/beat event. Override in subclasses that react to onsets."""

    def handle_energy(self, scene_state: Any, energy: float) -> None:
        """Handle a continuous energy update. Override in subclasses that react to energy."""

    async def enter_silence(self, scene_state: Any, stop_event: asyncio.Event) -> None:
        """Transition to silence degradation (slow palette cycling)."""
        self._in_silence = True
        self._cancel_mode_timers()
        if scene_state.scene.audio_silence_degradation:
            self._silence_task = asyncio.ensure_future(
                self._silence_cycle(scene_state, stop_event)
            )

    async def exit_silence(self, scene_state: Any) -> None:
        """Return from silence to active audio mode."""
        self._in_silence = False
        if self._silence_task and not self._silence_task.done():
            self._silence_task.cancel()
            self._silence_task = None

    def cleanup(self) -> None:
        """Cancel any pending timers or tasks."""
        self._cancel_mode_timers()
        if self._silence_task and not self._silence_task.done():
            self._silence_task.cancel()

    def _cancel_mode_timers(self) -> None:
        """Cancel mode-specific timers. Override in subclasses with timers."""

    async def _silence_cycle(
        self, scene_state: Any, stop_event: asyncio.Event
    ) -> None:
        """Slowly cycle through palette colors during silence."""
        step_time = SILENCE_DEGRADATION_STEP_SECONDS
        while not stop_event.is_set() and self._in_silence:
            self._manager._advance_colors(scene_state)
            await self._manager._apply_colors_with_offset(
                scene_state, stop_event, transition=step_time * 0.8
            )
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=step_time)
            except asyncio.TimeoutError:
                pass


class OnsetHandler(AudioModeHandler):
    """Colors advance on each detected onset/beat."""

    def handle_onset(self, scene_state: Any, attrs: dict[str, Any]) -> None:
        self._manager._advance_colors(scene_state)

    def handle_energy(self, scene_state: Any, energy: float) -> None:
        if scene_state.scene.audio_brightness_response:
            scene_state.brightness_modifier = max(0.3, min(1.0, energy))


class ContinuousHandler(AudioModeHandler):
    """Energy maps to palette color position."""

    def handle_energy(self, scene_state: Any, energy: float) -> None:
        num_colors = len(scene_state.scene.colors)
        if num_colors == 0:
            return
        pos = max(0, min(int(energy * num_colors), num_colors - 1))
        for i in range(len(scene_state.light_color_indices)):
            scene_state.light_color_indices[i] = pos
        if scene_state.scene.audio_brightness_response:
            scene_state.brightness_modifier = max(0.3, min(1.0, energy))


class IntensityBreathingHandler(AudioModeHandler):
    """Slow brightness envelope tracks overall loudness."""

    def __init__(self, manager: Any) -> None:
        super().__init__(manager)
        self._envelope = 0.5
        self._alpha = 0.05  # ~2-4 second EMA at 20Hz updates

    def handle_energy(self, scene_state: Any, energy: float) -> None:
        self._envelope = self._alpha * energy + (1 - self._alpha) * self._envelope
        scene_state.brightness_modifier = max(0.3, min(1.0, self._envelope))


class OnsetFlashHandler(AudioModeHandler):
    """Slow palette drift + brightness spike on onsets."""

    def __init__(self, manager: Any) -> None:
        super().__init__(manager)
        self._envelope = 0.5
        self._flash_brightness = 0.0
        self._alpha = 0.05

    def handle_energy(self, scene_state: Any, energy: float) -> None:
        self._envelope = self._alpha * energy + (1 - self._alpha) * self._envelope
        # Decay flash
        self._flash_brightness = max(0.0, self._flash_brightness - 0.02)
        brightness = max(self._envelope, self._flash_brightness)
        scene_state.brightness_modifier = max(0.3, min(1.0, brightness))

    def handle_onset(self, scene_state: Any, attrs: dict[str, Any]) -> None:
        strength = attrs.get("strength", 1.0)
        self._flash_brightness = min(1.0, strength)
        scene_state.brightness_modifier = 1.0


class BeatPredictiveHandler(AudioModeHandler):
    """Predicts beats using BPM and sends commands early."""

    REACTIVE = "reactive"
    TRACKING = "tracking"
    PREDICTIVE = "predictive"

    def __init__(self, manager: Any, hass: Any = None) -> None:
        super().__init__(manager)
        self._hass = hass
        self._state = self.REACTIVE
        self._last_onset_time = 0.0
        self._bpm = 0.0
        self._confidence = 0
        self._consecutive_matches = 0
        self._pending_handles: list[asyncio.TimerHandle] = []
        self._aggressiveness = 50
        self._latency_ms = 150
        self._confidence_threshold = 60

    def configure(self, scene: Any) -> None:
        """Set prediction parameters from scene config."""
        self._aggressiveness = scene.audio_prediction_aggressiveness
        self._latency_ms = scene.audio_latency_compensation_ms
        # Map aggressiveness 1-100 to confidence threshold 90-30
        self._confidence_threshold = int(90 - (self._aggressiveness / 100) * 60)

    def update_bpm(self, bpm: float, confidence: int) -> None:
        """Update BPM and confidence from sensor data."""
        self._bpm = bpm
        self._confidence = confidence
        self._update_state()

    def handle_onset(self, scene_state: Any, attrs: dict[str, Any]) -> None:
        now = time.monotonic()
        self._last_onset_time = now

        if self._state == self.TRACKING:
            self._consecutive_matches += 1

        if self._state != self.PREDICTIVE:
            # Reactive/tracking mode: advance colors immediately
            strength = attrs.get("strength", 1.0)
            if scene_state.scene.audio_brightness_response:
                scene_state.brightness_modifier = max(0.1, min(1.0, strength))
            self._manager._advance_colors(scene_state)

    def _update_state(self) -> None:
        """Update prediction state machine based on BPM confidence."""
        if self._state == self.REACTIVE:
            if self._confidence >= self._confidence_threshold:
                self._state = self.TRACKING
                self._consecutive_matches = 0
        elif self._state == self.TRACKING:
            if self._confidence < self._confidence_threshold - 10:
                self._state = self.REACTIVE
            elif self._consecutive_matches >= 4:
                self._state = self.PREDICTIVE
                _LOGGER.debug(
                    "Beat prediction: entering predictive mode (BPM=%.1f, confidence=%d)",
                    self._bpm,
                    self._confidence,
                )
        elif self._state == self.PREDICTIVE:
            if self._confidence < self._confidence_threshold - 10:
                self._state = self.REACTIVE
                self._cancel_mode_timers()
                _LOGGER.debug(
                    "Beat prediction: falling back to reactive (confidence=%d)",
                    self._confidence,
                )

    def _cancel_mode_timers(self) -> None:
        """Cancel all pending prediction timers."""
        for handle in self._pending_handles:
            handle.cancel()
        self._pending_handles.clear()

    def cleanup(self) -> None:
        """Cancel prediction timers and parent cleanup."""
        self._cancel_mode_timers()
        super().cleanup()
