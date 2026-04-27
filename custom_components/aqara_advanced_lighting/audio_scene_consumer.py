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
from .audio_mode_handlers import MODE_REGISTRY, ModeSpec

if TYPE_CHECKING:
    from .audio_mode_handlers import AudioModeHandler
    from .models import DynamicScene

_LOGGER = logging.getLogger(__name__)


def _spec_for(mode: str) -> ModeSpec | None:
    """Look up the ModeSpec for an audio_color_advance mode constant.

    Returns None for unknown modes (defensive — `create_handler` falls back
    to OnsetHandler with a warning, so an unknown mode behaves as `on_onset`
    here too).
    """
    return MODE_REGISTRY.get(mode)


def build_scene_engine_config(scene: DynamicScene) -> AudioEngineConfig:
    """Map DynamicScene audio settings to an AudioEngineConfig.

    The mode-specific subscribe gates are read directly from MODE_REGISTRY's
    ModeSpec — single source of truth for both this function and the
    consumer's per-event apply-trigger gates further down. Adding a new mode
    is one ModeSpec row in audio_mode_handlers.py with no parallel updates
    required here.
    """
    mode = scene.audio_color_advance
    spec = _spec_for(mode)
    is_onset = spec.is_onset_mode if spec else True  # unknown mode → on_onset
    is_energy = spec.is_energy_mode if spec else False
    is_spectral = spec.is_spectral_mode if spec else False
    needs_bands = spec.needs_band_attrs if spec else False
    needs_beat = spec.needs_beat_tracking if spec else False

    return AudioEngineConfig(
        audio_entity=scene.audio_entity,
        consumer_type="scene",
        sensitivity=scene.audio_sensitivity,
        detection_mode=scene.audio_detection_mode,
        subscribe_onset=is_onset,
        subscribe_energy=is_energy or scene.audio_brightness_curve is not None,
        subscribe_bpm=needs_beat,
        subscribe_beat_tracking=needs_beat,
        subscribe_spectral=(
            scene.audio_color_by_frequency
            or scene.audio_rolloff_brightness
            or is_spectral
        ),
        subscribe_silence=True,
        subscribe_frequency_bands=(
            scene.audio_frequency_zone or needs_bands
        ),
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
        self._rolloff_factor: float = 1.0
        self._band_energies: dict[str, float] = {}
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

        # Beat phase — must come after BPM for accurate interval calculation
        if "beat_phase" in events:
            self._handler.update_phase(self._scene_state, events["beat_phase"])

        # Update the band-energy cache BEFORE the onset block. Without this
        # ordering, an onset that arrives in a drain with no co-drain band_*
        # events (which can happen because onsets fire on event whereas band
        # sensors fire at ~20 Hz on the device) would read an empty / stale
        # cache and BassKickHandler's dominance check would either silently
        # drop the kick (when cache empty at scene start) or use one-drain-
        # stale values for the dominance comparison.
        for key, value in events.items():
            if key.startswith("band_"):
                self._band_energies[key[len("band_"):]] = value

        # Onset events
        if "onset" in events:
            # Merge per-band energies into the onset attrs dict so band-aware
            # handlers (BassKickHandler) can perform dominance checks without
            # reaching back into engine state. The cache (just refreshed
            # above) holds the freshest values seen across recent drains;
            # current-drain band_* events are now also in there.
            onset_attrs = events["onset"]
            for band_key in (
                "bass_energy",
                "mid_energy",
                "high_energy",
                "sub_bass_energy",
                "low_mid_energy",
                "upper_mid_energy",
                "air_energy",
            ):
                if band_key in self._band_energies and band_key not in onset_attrs:
                    onset_attrs[band_key] = self._band_energies[band_key]
            self._handler.handle_onset(self._scene_state, onset_attrs)
            if self._is_onset_mode:
                needs_apply = True
            # Dominant-band bias: advance the loudest zone's lights by one palette step
            if self._freq_zone_bands and self._band_energies:
                dominant = max(self._band_energies, key=lambda k: self._band_energies[k])
                for band_key, light_group in self._freq_zone_bands:
                    if band_key == dominant and light_group:
                        num_colors = len(scene.colors)
                        if num_colors > 0:
                            for eid in light_group:
                                old = self._scene_state.light_color_indices.get(eid, 0)
                                self._scene_state.light_color_indices[eid] = (old + 1) % num_colors
                        needs_apply = True
                        break

        # Spectral descriptors
        if "centroid" in events:
            self._handler.handle_centroid(self._scene_state, events["centroid"])
            if scene.audio_color_by_frequency:
                num_colors = len(scene.colors)
                if num_colors > 0:
                    pos = max(0, min(int(events["centroid"] * num_colors), num_colors - 1))
                    for eid in list(self._scene_state.light_color_indices.keys()):
                        self._scene_state.light_color_indices[eid] = pos
                    needs_apply = True
            # Hue-driven modes set scene_state.audio_hue_override_xy via
            # _set_hue() during handle_centroid — schedule a reapply so the
            # override actually reaches the lights.
            if getattr(self._scene_state, "audio_hue_override_xy", None) is not None:
                needs_apply = True
        if "rolloff" in events:
            self._handler.handle_rolloff(self._scene_state, events["rolloff"])
            if scene.audio_rolloff_brightness:
                self._rolloff_factor = 0.5 + events["rolloff"] * 0.5

        # Energy events
        if "energy" in events:
            self._handler.handle_energy(self._scene_state, events["energy"])
            if scene.audio_rolloff_brightness and self._rolloff_factor != 1.0:
                self._scene_state.brightness_modifier = max(
                    0.01, min(1.0, self._scene_state.brightness_modifier * self._rolloff_factor)
                )
            if self._is_energy_mode or scene.audio_brightness_curve is not None:
                needs_apply = True

        # (Band-energy cache update was moved to the top of this method so
        # the onset block sees fresh values on the same drain — see comment
        # there. No second update needed here.)

        # Frequency zone band events (zone routing only)
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

        # Apply colors. Two paths:
        #  - rate-limited / energy-driven: await the apply directly. Energy
        #    updates arrive at ~20 Hz; the rate-limit + serialised await keeps
        #    backpressure sensible.
        #  - onset-driven: fire-and-forget via create_task. The apply path
        #    itself awaits a hardware/software transition that can take 0.5–2s
        #    on Zigbee bulbs; awaiting it inside the consumer would block the
        #    audio event loop, queue subsequent onsets in the engine queue,
        #    and coalesce them at the next drain — so a rapid kick-kick-kick
        #    run becomes a single visible flash (root cause of the
        #    "bass_kick barely affects lights" symptom). create_task lets the
        #    consumer return immediately and continue processing onsets while
        #    the previous apply is still running. Multiple in-flight applies
        #    are tolerated — HA serialises light.turn_on at the integration
        #    layer.
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
                # Non-blocking apply for onset modes. We deliberately don't
                # track / cancel in-flight tasks: asyncio cleans them up when
                # they finish, and overlapping applies are correct on light
                # hardware (each turn_on supersedes the previous state).
                asyncio.create_task(self._apply_colors(self._transition_seconds))
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
