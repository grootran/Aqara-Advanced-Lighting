"""Shared audio engine for sensor subscriptions and event dispatch.

Extracted from DynamicSceneManager._execute_audio_scene() to allow
reuse by both dynamic scenes and audio-reactive effects.
"""

import asyncio
import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from homeassistant.const import EVENT_STATE_CHANGED
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback

from .audio_discovery import discover_companion_sensors
from .const import (
    AUDIO_SENSOR_UNAVAILABLE_TIMEOUT,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)


@dataclass
class AudioEngineConfig:
    """Configuration for an AudioEngine instance."""

    audio_entity: str
    consumer_type: str  # "scene" or "effect"
    sensitivity: int = 50
    detection_mode: str = "spectral_flux"

    # Subscription flags — consumer tells engine which sensor types it needs
    subscribe_onset: bool = False
    subscribe_energy: bool = False
    subscribe_bpm: bool = False
    subscribe_beat_tracking: bool = False  # beat_confidence + beat_phase (always paired)
    subscribe_spectral: bool = False  # centroid + rolloff (always paired)
    subscribe_silence: bool = True  # Almost always wanted
    subscribe_frequency_bands: bool = False


class AudioConsumer(ABC):
    """Interface that consumers implement to receive audio events."""

    @abstractmethod
    async def on_audio_events(self, events: dict[str, Any]) -> None:
        """Process a batch of drained audio events.

        Called once per engine loop iteration with the most recent
        event of each type.
        """

    @abstractmethod
    async def on_silence_enter(self) -> None:
        """Called when silence is detected."""

    @abstractmethod
    async def on_silence_exit(self) -> None:
        """Called when audio resumes after silence."""

    @abstractmethod
    async def on_unavailable_timeout(self) -> None:
        """Called when audio sensor has been unavailable too long."""

    @abstractmethod
    async def on_sensor_available(self) -> None:
        """Called when audio sensor recovers after unavailability."""


class AudioEngine:
    """Shared audio infrastructure for sensor subscriptions and event dispatch.

    Manages the lifecycle of audio sensor subscriptions, event queueing,
    silence detection, and pause/resume. Delegates event processing to
    a consumer via the AudioConsumer interface.
    """

    def __init__(
        self,
        hass: HomeAssistant,
        config: AudioEngineConfig,
        consumer: AudioConsumer,
    ) -> None:
        self.hass = hass
        self.config = config
        self._consumer = consumer
        self._stop_event = asyncio.Event()
        self._pause_event = asyncio.Event()
        self._audio_unsub: CALLBACK_TYPE | None = None
        self._task: asyncio.Task | None = None
        self._companions: dict[str, str | None] = {}
        self._in_silence = False

    @staticmethod
    def _make_claim_key(audio_entity: str, consumer_type: str) -> str:
        """Build the claim key for concurrent audio entity tracking."""
        return f"audio_active_{consumer_type}_{audio_entity}"

    async def start(self) -> None:
        """Start the audio engine — claim sensor, discover companions, begin loop."""
        # Claim the audio entity for this consumer type
        domain_data = self.hass.data.setdefault(DOMAIN, {})
        claim_key = self._make_claim_key(self.config.audio_entity, self.config.consumer_type)

        if claim_key in domain_data:
            existing_id = domain_data[claim_key]
            _LOGGER.warning(
                "Audio entity %s already claimed by %s (type=%s), stopping it",
                self.config.audio_entity,
                existing_id,
                self.config.consumer_type,
            )
            # The existing consumer should be stopped by its manager before
            # calling engine.start() — this is a safety net.

        domain_data[claim_key] = id(self)

        # Discover companion sensors
        self._companions = discover_companion_sensors(
            self.hass, self.config.audio_entity
        )

        # Configure ESP32 device
        await self._configure_esp32()

        # Start the main loop
        self._task = asyncio.ensure_future(self._run())

    async def stop(self) -> None:
        """Stop the audio engine — release claim, cancel loop."""
        self._stop_event.set()
        if self._audio_unsub:
            self._audio_unsub()
            self._audio_unsub = None
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        # Release claim
        domain_data = self.hass.data.get(DOMAIN, {})
        claim_key = self._make_claim_key(self.config.audio_entity, self.config.consumer_type)
        domain_data.pop(claim_key, None)

    def pause(self) -> None:
        """Pause the engine — unsubscribes from events."""
        self._pause_event.set()

    def resume(self) -> None:
        """Resume the engine — resubscribes to events."""
        self._pause_event.clear()

    @property
    def companions(self) -> dict[str, str | None]:
        """Return discovered companion sensors."""
        return self._companions

    async def update_sensitivity(self, sensitivity: int) -> bool:
        """Update sensitivity at runtime and write to companion entity."""
        self.config.sensitivity = sensitivity
        sensitivity_entity = self._companions.get("sensitivity")
        if not sensitivity_entity:
            return False
        try:
            await self.hass.services.async_call(
                "number", "set_value",
                {"entity_id": sensitivity_entity, "value": sensitivity},
                blocking=False,
            )
            return True
        except Exception:
            _LOGGER.warning(
                "Failed to update sensitivity on %s", sensitivity_entity,
                exc_info=True,
            )
            return False

    async def _configure_esp32(self) -> None:
        """Configure ESP32 detection mode and sensitivity."""
        detection_mode_entity = self._companions.get("detection_mode")
        if detection_mode_entity:
            await self.hass.services.async_call(
                "select", "select_option",
                {"entity_id": detection_mode_entity, "option": self.config.detection_mode},
                blocking=False,
            )

        sensitivity_entity = self._companions.get("sensitivity")
        if sensitivity_entity:
            try:
                await self.hass.services.async_call(
                    "number", "set_value",
                    {"entity_id": sensitivity_entity, "value": self.config.sensitivity},
                    blocking=False,
                )
            except Exception:
                _LOGGER.warning(
                    "Failed to set sensitivity on %s", sensitivity_entity, exc_info=True,
                )

    def _build_subscriptions(self) -> tuple[set[str], dict[str, str]]:
        """Build the set of entity IDs to subscribe to and their role mapping.

        Returns:
            Tuple of (subscribe_entity_ids, entity_to_role_mapping).
        """
        cfg = self.config
        companions = self._companions
        subscribe: set[str] = set()
        role_map: dict[str, str] = {}

        # Onset
        onset_entity = companions.get("onset_detected") or cfg.audio_entity
        if cfg.subscribe_onset:
            subscribe.add(onset_entity)
            role_map[onset_entity] = "onset"

        # Onset strength
        onset_strength_entity = companions.get("onset_strength")
        if cfg.subscribe_onset and onset_strength_entity:
            subscribe.add(onset_strength_entity)
            role_map[onset_strength_entity] = "onset_strength"

        # Energy
        energy_entity = companions.get("amplitude") or companions.get("bass_energy")
        if cfg.subscribe_energy and energy_entity:
            subscribe.add(energy_entity)
            role_map[energy_entity] = "energy"

        # BPM
        if cfg.subscribe_bpm:
            bpm_entity = companions.get("bpm")
            if bpm_entity:
                subscribe.add(bpm_entity)
                role_map[bpm_entity] = "bpm"

        # Beat tracking (confidence + phase)
        if cfg.subscribe_beat_tracking:
            entity = companions.get("beat_confidence")
            if entity:
                subscribe.add(entity)
                role_map[entity] = "beat_confidence"
            entity = companions.get("beat_phase")
            if entity:
                subscribe.add(entity)
                role_map[entity] = "beat_phase"

        # Spectral analysis (centroid + rolloff)
        if cfg.subscribe_spectral:
            entity = companions.get("centroid")
            if entity:
                subscribe.add(entity)
                role_map[entity] = "centroid"
            entity = companions.get("rolloff")
            if entity:
                subscribe.add(entity)
                role_map[entity] = "rolloff"

        # Silence
        if cfg.subscribe_silence:
            entity = companions.get("silence")
            if entity:
                subscribe.add(entity)
                role_map[entity] = "silence"

        # Frequency bands
        if cfg.subscribe_frequency_bands:
            for band_key in ("bass_energy", "mid_energy", "high_energy"):
                entity = companions.get(band_key)
                if entity:
                    subscribe.add(entity)
                    role_map[entity] = f"band_{band_key}"

        # Warn about requested-but-missing sensors
        if cfg.subscribe_spectral:
            if not companions.get("centroid"):
                _LOGGER.warning(
                    "Audio sensor '%s': spectral subscribed but centroid sensor not found",
                    cfg.audio_entity,
                )
            if not companions.get("rolloff"):
                _LOGGER.warning(
                    "Audio sensor '%s': spectral subscribed but rolloff sensor not found",
                    cfg.audio_entity,
                )
        if cfg.subscribe_beat_tracking:
            if not companions.get("beat_confidence"):
                _LOGGER.warning(
                    "Audio sensor '%s': beat_tracking subscribed but beat_confidence sensor not found",
                    cfg.audio_entity,
                )
        if cfg.subscribe_frequency_bands:
            for band in ("bass_energy", "mid_energy", "high_energy"):
                if not companions.get(band):
                    _LOGGER.warning(
                        "Audio sensor '%s': frequency_bands subscribed but %s sensor not found",
                        cfg.audio_entity, band,
                    )

        # Fallback
        if not subscribe:
            _LOGGER.warning(
                "No audio entities to subscribe to; falling back to audio_entity %s",
                cfg.audio_entity,
            )
            subscribe.add(cfg.audio_entity)
            role_map[cfg.audio_entity] = "onset"

        return subscribe, role_map

    async def _run(self) -> None:
        """Main audio event loop."""
        subscribe_entities, role_map = self._build_subscriptions()

        queue: asyncio.Queue[tuple[str, Any]] = asyncio.Queue(maxsize=50)
        unavailable_since: float | None = None

        # Build reverse lookup: entity_id -> role
        entity_to_role: dict[str, str] = {}
        for eid, role in role_map.items():
            entity_to_role[eid] = role

        @callback
        def _audio_state_changed(event: Event) -> None:
            entity_id_val = event.data.get("entity_id")
            if entity_id_val not in subscribe_entities:
                return
            new_state = event.data.get("new_state")
            if new_state is None:
                return
            state_val = new_state.state
            if state_val in ("unavailable", "unknown"):
                try:
                    queue.put_nowait(("unavailable", True))
                except asyncio.QueueFull:
                    pass
                return

            role = entity_to_role.get(entity_id_val)
            if not role:
                return

            try:
                if role == "onset":
                    if state_val == "on":
                        queue.put_nowait(("onset", {"strength": 1.0}))
                elif role == "onset_strength":
                    queue.put_nowait(("onset_strength", float(state_val)))
                elif role == "silence":
                    queue.put_nowait(("silence", state_val == "on"))
                elif role in ("bpm", "beat_confidence", "beat_phase",
                              "energy", "centroid", "rolloff"):
                    queue.put_nowait((role, float(state_val)))
                elif role.startswith("band_"):
                    queue.put_nowait((role, float(state_val)))
            except (asyncio.QueueFull, ValueError, TypeError):
                pass

        self._audio_unsub = self.hass.bus.async_listen(
            EVENT_STATE_CHANGED, _audio_state_changed
        )

        def drain_queue() -> dict[str, Any]:
            events: dict[str, Any] = {}
            while not queue.empty():
                try:
                    event_type, data = queue.get_nowait()
                    events[event_type] = data
                except asyncio.QueueEmpty:
                    break
            return events

        try:
            while not self._stop_event.is_set():
                # Pause handling
                if self._pause_event.is_set():
                    if self._audio_unsub:
                        self._audio_unsub()
                        self._audio_unsub = None
                    while self._pause_event.is_set() and not self._stop_event.is_set():
                        await asyncio.sleep(0.1)
                    if self._stop_event.is_set():
                        break
                    self._audio_unsub = self.hass.bus.async_listen(
                        EVENT_STATE_CHANGED, _audio_state_changed
                    )
                    unavailable_since = None
                    self._in_silence = False

                # Wait for events
                try:
                    first_event = await asyncio.wait_for(queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    if unavailable_since is not None:
                        elapsed = time.monotonic() - unavailable_since
                        if elapsed > AUDIO_SENSOR_UNAVAILABLE_TIMEOUT:
                            _LOGGER.warning(
                                "Audio sensor '%s' unavailable for %ds, stopping",
                                self.config.audio_entity, int(elapsed),
                            )
                            await self._consumer.on_unavailable_timeout()
                            break
                    continue

                # Drain remaining
                events = drain_queue()
                first_type, first_data = first_event
                if first_type not in events:
                    events[first_type] = first_data

                # Handle unavailability
                if "unavailable" in events:
                    if unavailable_since is None:
                        unavailable_since = time.monotonic()
                        _LOGGER.warning("Audio sensor '%s' unavailable", self.config.audio_entity)
                    if len(events) == 1:
                        continue

                # Sensor recovered
                real_events = {k: v for k, v in events.items() if k != "unavailable"}
                if real_events and unavailable_since is not None:
                    unavailable_since = None
                    await self._consumer.on_sensor_available()

                # Silence transitions
                if "silence" in events:
                    silence_val = events["silence"]
                    if silence_val and not self._in_silence:
                        self._in_silence = True
                        await self._consumer.on_silence_enter()
                    elif not silence_val and self._in_silence:
                        self._in_silence = False
                        await self._consumer.on_silence_exit()

                if self._in_silence:
                    continue

                # Merge onset_strength into onset data
                if "onset" in events and "onset_strength" in events:
                    events["onset"]["strength"] = events["onset_strength"]

                # Dispatch to consumer
                dispatch_events = {
                    k: v for k, v in events.items()
                    if k not in ("unavailable", "silence", "onset_strength")
                }
                if dispatch_events:
                    await self._consumer.on_audio_events(dispatch_events)

        finally:
            if self._audio_unsub:
                self._audio_unsub()
                self._audio_unsub = None
            domain_data = self.hass.data.get(DOMAIN, {})
            claim_key = self._make_claim_key(self.config.audio_entity, self.config.consumer_type)
            domain_data.pop(claim_key, None)
