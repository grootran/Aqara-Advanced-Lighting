"""Audio scene consumer — adapts AudioEngine events to scene mode handlers.

Bridges the shared AudioEngine with DynamicSceneManager's AudioModeHandler
hierarchy, so audio scenes use the same engine infrastructure as effects.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import TYPE_CHECKING, Any, Awaitable, Callable

from .audio_engine import AudioConsumer, AudioEngineConfig
from .const import (
    AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
    AUDIO_COLOR_ADVANCE_CONTINUOUS,
    AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING,
    AUDIO_COLOR_ADVANCE_ON_ONSET,
    AUDIO_COLOR_ADVANCE_ONSET_FLASH,
)

if TYPE_CHECKING:
    from .audio_mode_handlers import AudioModeHandler
    from .models import DynamicScene

_LOGGER = logging.getLogger(__name__)

_ONSET_MODES = frozenset({
    AUDIO_COLOR_ADVANCE_ON_ONSET,
    AUDIO_COLOR_ADVANCE_ONSET_FLASH,
    AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
})
_ENERGY_MODES = frozenset({
    AUDIO_COLOR_ADVANCE_CONTINUOUS,
    AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING,
    AUDIO_COLOR_ADVANCE_ONSET_FLASH,
})


def build_scene_engine_config(scene: DynamicScene) -> AudioEngineConfig:
    """Map DynamicScene audio settings to an AudioEngineConfig."""
    mode = scene.audio_color_advance
    is_onset = mode in _ONSET_MODES
    is_energy = mode in _ENERGY_MODES

    return AudioEngineConfig(
        audio_entity=scene.audio_entity,
        consumer_type="scene",
        sensitivity=scene.audio_sensitivity,
        detection_mode=scene.audio_detection_mode,
        subscribe_onset=is_onset,
        subscribe_energy=is_energy or scene.audio_brightness_curve is not None,
        subscribe_bpm=mode == AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
        subscribe_beat_tracking=mode == AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
        subscribe_spectral=True,
        subscribe_silence=True,
        subscribe_frequency_bands=scene.audio_frequency_zone,
    )


class DynamicSceneAudioConsumer(AudioConsumer):
    """Adapts AudioEngine events to DynamicSceneManager's mode handlers.

    Routes events from the shared AudioEngine to the appropriate
    AudioModeHandler methods, handles frequency zone routing, and
    applies rate-limited color updates via the manager's apply callback.
    """

    def __init__(
        self,
        scene_state: Any,
        handler: AudioModeHandler,
        stop_event: asyncio.Event,
        apply_colors_fn: Callable[[float], Awaitable[None]],
        transition_seconds: float,
        is_onset_mode: bool,
        is_energy_mode: bool,
    ) -> None:
        self._scene_state = scene_state
        self._handler = handler
        self._stop_event = stop_event
        self._apply_colors = apply_colors_fn
        self._transition_seconds = transition_seconds
        self._is_onset_mode = is_onset_mode
        self._is_energy_mode = is_energy_mode
        self._min_apply_interval = max(transition_seconds, 0.1)
        self._last_apply_time: float = 0.0
        # Frequency zone config (set via set_freq_zone_config)
        self._freq_zone_bands: list[tuple[str, list[str]]] | None = None

    def set_freq_zone_config(
        self,
        bass_lights: list[str],
        mid_lights: list[str],
        high_lights: list[str],
    ) -> None:
        """Configure frequency zone light groups."""
        self._freq_zone_bands = [
            ("bass_energy", bass_lights),
            ("mid_energy", mid_lights),
            ("high_energy", high_lights),
        ]

    async def on_audio_events(self, events: dict[str, Any]) -> None:
        """Route drained events to handler and apply colors."""
        now = time.monotonic()
        needs_apply = False
        scene = self._scene_state.scene

        # BPM updates (must come before onset for predictive handler)
        if "bpm" in events:
            confidence = events.get("beat_confidence", 0.0)
            self._handler.update_bpm(events["bpm"], confidence)

        # Onset events
        if "onset" in events:
            self._handler.handle_onset(self._scene_state, events["onset"])
            if self._is_onset_mode:
                needs_apply = True

        # Spectral descriptors
        if "centroid" in events:
            self._handler.handle_centroid(self._scene_state, events["centroid"])
        if "rolloff" in events:
            self._handler.handle_rolloff(self._scene_state, events["rolloff"])

        # Energy events
        if "energy" in events:
            self._handler.handle_energy(self._scene_state, events["energy"])
            if self._is_energy_mode or scene.audio_brightness_curve is not None:
                needs_apply = True

        # Frequency zone band events
        if self._freq_zone_bands:
            num_colors = len(scene.colors)
            if num_colors > 0:
                for band_key, light_group in self._freq_zone_bands:
                    event_key = f"band_{band_key}"
                    if event_key in events and light_group:
                        band_energy = events[event_key]
                        pos = max(0, min(int(band_energy * num_colors), num_colors - 1))
                        for eid in light_group:
                            self._scene_state.light_color_indices[eid] = pos
                        needs_apply = True

        # Apply colors with rate limiting
        if needs_apply:
            rate_limit = self._is_energy_mode or (
                "energy" in events
                and scene.audio_brightness_curve is not None
                and "onset" not in events
            )
            if rate_limit:
                if (now - self._last_apply_time) >= self._min_apply_interval:
                    await self._apply_colors(self._transition_seconds)
                    self._last_apply_time = now
            else:
                await self._apply_colors(self._transition_seconds)
                self._last_apply_time = now

    async def on_silence_enter(self) -> None:
        """Delegate to handler's silence transition."""
        await self._handler.enter_silence(self._scene_state, self._stop_event)

    async def on_silence_exit(self) -> None:
        """Delegate to handler's silence recovery."""
        await self._handler.exit_silence(self._scene_state)

    async def on_unavailable_timeout(self) -> None:
        """Audio sensor gone — signal scene task to stop."""
        self._scene_state.audio_waiting = True
        self._stop_event.set()

    async def on_sensor_available(self) -> None:
        """Audio sensor recovered — clear waiting flag."""
        self._scene_state.audio_waiting = False
