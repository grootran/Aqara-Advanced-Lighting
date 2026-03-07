"""CCT Sequence Manager for Aqara Advanced Lighting."""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any

from homeassistant.helpers.storage import Store

from .base_sequence_manager import BaseSequenceManager
from .const import (
    DATA_ENTITY_CONTROLLER,
    DOMAIN,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_PRESET,
    EVENT_ATTR_SEQUENCE_ID,
    EVENT_ATTR_SEQUENCE_TYPE,
    EVENT_ATTR_TOTAL_STEPS,
    EVENT_SEQUENCE_STARTED,
    OverrideAttributes,
    SEQUENCE_TYPE_CCT,
)
from .models import CCTSequence, CCTSequenceStep
from .sun_utils import SolarStep, get_sun_state, interpolate_solar_values

_LOGGER = logging.getLogger(__name__)

SOLAR_POLL_INTERVAL: float = 60.0
SOLAR_STORAGE_VERSION = 1
SOLAR_STORAGE_KEY = f"{DOMAIN}.solar_sequences"


class CCTSequenceManager(BaseSequenceManager[CCTSequence]):
    """Manages CCT sequence execution as background tasks."""

    _sequence_type = SEQUENCE_TYPE_CCT

    def __init__(
        self, *args: Any, entry_id: str = "", **kwargs: Any
    ) -> None:
        """Initialize the CCT sequence manager with solar persistence."""
        super().__init__(*args, **kwargs)
        storage_key = (
            f"{SOLAR_STORAGE_KEY}.{entry_id}" if entry_id else SOLAR_STORAGE_KEY
        )
        self._solar_store: Store[dict[str, Any]] = Store(
            self.hass, SOLAR_STORAGE_VERSION, storage_key
        )
        self._solar_sequences: dict[str, dict[str, Any]] = {}
        self._shutting_down: bool = False

    def set_shutting_down(self) -> None:
        """Mark the manager as shutting down to preserve solar persistence."""
        self._shutting_down = True

    def is_solar_sequence(self, entity_id: str) -> bool:
        """Check if the running sequence for an entity is solar mode."""
        return entity_id in self._solar_sequences

    def get_current_solar_values(
        self, entity_id: str,
    ) -> tuple[int, int] | None:
        """Get the current solar color temp and brightness for an entity.

        Returns (color_temp_kelvin, brightness) or None if the entity
        is not running a solar sequence or sun state is unavailable.
        """
        seq_data = self._solar_sequences.get(entity_id)
        if not seq_data:
            return None
        sun_state = get_sun_state(self.hass)
        if sun_state is None:
            return None
        solar_steps = [
            SolarStep(
                sun_elevation=s["sun_elevation"],
                color_temp=s["color_temp"],
                brightness=s["brightness"],
                phase=s.get("phase", "any"),
            )
            for s in seq_data["solar_steps"]
        ]
        return interpolate_solar_values(solar_steps, sun_state)

    def get_auto_resume_delay(self, entity_id: str) -> float:
        """Get the auto-resume delay for a running solar sequence.

        Returns the per-preset delay in seconds, or 0 if not configured
        or entity is not running a solar sequence.
        """
        seq_data = self._solar_sequences.get(entity_id)
        if seq_data:
            return seq_data.get("auto_resume_delay", 0)
        return 0

    # -- BaseSequenceManager hooks --

    def _get_start_step(
        self, sequence: CCTSequence, loops_executed: int
    ) -> int:
        """Skip first step on subsequent loops when skip_first_in_loop is set."""
        if (
            loops_executed > 0
            and sequence.skip_first_in_loop
            and len(sequence.steps) > 1
        ):
            _LOGGER.debug(
                "Skipping first step in loop %d (skip_first_in_loop=True)",
                loops_executed + 1,
            )
            return 1
        return 0

    async def _apply_step(
        self,
        entity_id: str,
        sequence: CCTSequence,
        step: Any,
        step_index: int,
        stop_event: asyncio.Event,
    ) -> bool:
        """Apply a single CCT step via the backend.

        Returns True if the step completed, False if interrupted.
        """
        cct_step: CCTSequenceStep = step

        _LOGGER.debug(
            "Executing step %d/%d for %s: %dK, brightness %d, transition %ss",
            step_index + 1,
            len(sequence.steps),
            entity_id,
            cct_step.color_temp,
            cct_step.brightness,
            cct_step.transition,
        )

        try:
            transition_completed = await self.backend.async_publish_cct_step(
                entity_id,
                cct_step.color_temp,
                cct_step.brightness,
                cct_step.transition,
                stop_event,
            )
            if not transition_completed:
                _LOGGER.debug("Transition interrupted for %s", entity_id)
                return False
        except Exception as ex:
            _LOGGER.warning(
                "Failed to apply CCT step %d for %s: %s",
                step_index + 1,
                entity_id,
                ex,
            )

        return True

    # -- Solar mode support --

    async def start_synchronized_group(
        self,
        entity_ids: list[str],
        sequence: CCTSequence,
        preset: str | None = None,
    ) -> dict[str, str]:
        """Start synchronized sequences, routing solar mode to individual starts.

        Solar sequences each poll sun elevation independently so group
        barrier synchronization is unnecessary.
        """
        if sequence.mode != "solar":
            return await super().start_synchronized_group(
                entity_ids, sequence, preset
            )

        results: dict[str, str] = {}
        for entity_id in entity_ids:
            seq_id = await self.start_sequence(entity_id, sequence, preset)
            results[entity_id] = seq_id
        return results

    async def start_sequence(
        self,
        entity_id: str,
        sequence: CCTSequence,
        preset: str | None = None,
    ) -> str:
        """Start a CCT sequence, routing solar mode to a dedicated loop."""
        if sequence.mode != "solar":
            return await super().start_sequence(entity_id, sequence, preset)

        # Solar mode: replicate base start_sequence setup but use _run_solar_loop
        try:
            await self.stop_sequence(entity_id)
        except Exception as ex:
            _LOGGER.debug("Error stopping existing sequence for %s: %s", entity_id, ex)

        sequence_id = str(uuid.uuid4())
        self._sequence_ids[entity_id] = sequence_id
        self._sequence_presets[entity_id] = preset

        stop_event = asyncio.Event()
        pause_event = asyncio.Event()
        self._stop_flags[entity_id] = stop_event
        self._pause_flags[entity_id] = pause_event

        self._sequence_state[entity_id] = {
            "paused": False,
            "current_step": 0,
            "total_steps": len(sequence.solar_steps),
            "loop_iteration": 1,
            "loop_mode": "continuous",
            "loop_count": None,
        }

        task = asyncio.create_task(
            self._run_solar_loop(
                entity_id, sequence, stop_event, pause_event, sequence_id
            )
        )
        self._active_sequences[entity_id] = task

        self.hass.bus.async_fire(
            EVENT_SEQUENCE_STARTED,
            {
                EVENT_ATTR_ENTITY_ID: entity_id,
                EVENT_ATTR_SEQUENCE_ID: sequence_id,
                EVENT_ATTR_TOTAL_STEPS: len(sequence.solar_steps),
                EVENT_ATTR_SEQUENCE_TYPE: self._sequence_type,
                EVENT_ATTR_PRESET: preset,
            },
        )

        # Persist solar sequence for restart recovery
        await self._persist_solar_sequence(entity_id, sequence, preset)

        _LOGGER.info(
            "Started solar CCT sequence for %s (sequence_id=%s)",
            entity_id,
            sequence_id,
        )
        return sequence_id

    # -- Solar persistence --

    async def _persist_solar_sequence(
        self,
        entity_id: str,
        sequence: CCTSequence,
        preset: str | None,
    ) -> None:
        """Save a running solar sequence to persistent storage."""
        solar_data: dict[str, Any] = {
            "preset": preset,
            "solar_steps": [
                {
                    "sun_elevation": s.sun_elevation,
                    "color_temp": s.color_temp,
                    "brightness": s.brightness,
                    "phase": s.phase,
                }
                for s in sequence.solar_steps
            ],
        }
        if sequence.auto_resume_delay > 0:
            solar_data["auto_resume_delay"] = sequence.auto_resume_delay
        self._solar_sequences[entity_id] = solar_data
        await self._solar_store.async_save(
            {"sequences": self._solar_sequences}
        )

    async def _remove_solar_persistence(self, entity_id: str) -> None:
        """Remove a solar sequence from persistent storage."""
        if entity_id in self._solar_sequences:
            del self._solar_sequences[entity_id]
            await self._solar_store.async_save(
                {"sequences": self._solar_sequences}
            )

    async def stop_sequence(self, entity_id: str) -> None:
        """Stop a running sequence and clear solar persistence if not shutting down."""
        was_solar = entity_id in self._solar_sequences
        await super().stop_sequence(entity_id)
        if was_solar and not self._shutting_down:
            await self._remove_solar_persistence(entity_id)

    async def async_restore_solar_sequences(self) -> None:
        """Restore persisted solar sequences after HA restart."""
        data = await self._solar_store.async_load()
        if not data:
            _LOGGER.debug("No persisted solar sequences to restore")
            return

        sequences = data.get("sequences", {})
        if not sequences:
            _LOGGER.debug("Persisted solar storage is empty")
            return

        _LOGGER.info(
            "Restoring %d persisted solar sequence(s): %s",
            len(sequences),
            ", ".join(sequences.keys()),
        )

        self._solar_sequences = dict(sequences)

        restored = 0
        failed_entities = []
        for entity_id, seq_data in sequences.items():
            # Verify entity still exists
            state = self.hass.states.get(entity_id)
            if state is None:
                _LOGGER.warning(
                    "Skipping solar restore for %s: entity not found in HA state registry",
                    entity_id,
                )
                failed_entities.append(entity_id)
                continue

            try:
                solar_steps = [
                    SolarStep(
                        sun_elevation=s["sun_elevation"],
                        color_temp=s["color_temp"],
                        brightness=s["brightness"],
                        phase=s.get("phase", "any"),
                    )
                    for s in seq_data["solar_steps"]
                ]
                sequence = CCTSequence(
                    steps=[],
                    loop_mode="continuous",
                    end_behavior="maintain",
                    mode="solar",
                    solar_steps=solar_steps,
                    auto_resume_delay=seq_data.get("auto_resume_delay", 0),
                )
                await self.start_sequence(
                    entity_id, sequence, seq_data.get("preset")
                )
                restored += 1
            except Exception:
                _LOGGER.warning(
                    "Failed to restore solar sequence for %s",
                    entity_id,
                    exc_info=True,
                )
                failed_entities.append(entity_id)

        # Clean up entries for entities that failed to restore
        for entity_id in failed_entities:
            self._solar_sequences.pop(entity_id, None)
        if failed_entities:
            await self._solar_store.async_save(
                {"sequences": self._solar_sequences}
            )

        if restored:
            _LOGGER.info("Restored %d solar CCT sequence(s)", restored)

    def _is_light_on(self, entity_id: str) -> bool:
        """Check if a light entity is currently on."""
        state = self.hass.states.get(entity_id)
        return state is not None and state.state == "on"

    async def _run_solar_loop(
        self,
        entity_id: str,
        sequence: CCTSequence,
        stop_event: asyncio.Event,
        pause_event: asyncio.Event,
        sequence_id: str,
    ) -> None:
        """Execute solar CCT mode by polling sun elevation.

        Skips updates while the light is off and immediately applies
        when the light comes back on.
        """
        last_ct: int | None = None
        last_br: int | None = None
        was_off = False

        try:
            while not stop_event.is_set():
                # Check for pause
                while pause_event.is_set() and not stop_event.is_set():
                    await asyncio.sleep(0.1)

                if stop_event.is_set():
                    break

                # Skip updates while light is off
                if not self._is_light_on(entity_id):
                    if not was_off:
                        _LOGGER.debug(
                            "Solar sequence for %s: light is off, waiting",
                            entity_id,
                        )
                        was_off = True
                    try:
                        await asyncio.wait_for(
                            stop_event.wait(), timeout=SOLAR_POLL_INTERVAL
                        )
                        break
                    except asyncio.TimeoutError:
                        continue

                # Light is on — force update if it just came back on
                if was_off:
                    _LOGGER.debug(
                        "Solar sequence for %s: light back on, applying current values",
                        entity_id,
                    )
                    was_off = False
                    last_ct = None
                    last_br = None

                sun_state = get_sun_state(self.hass)
                if sun_state is None:
                    _LOGGER.debug(
                        "Sun entity not available, retrying in %ss",
                        SOLAR_POLL_INTERVAL,
                    )
                    try:
                        await asyncio.wait_for(
                            stop_event.wait(), timeout=SOLAR_POLL_INTERVAL
                        )
                        break
                    except asyncio.TimeoutError:
                        continue

                ct, br = interpolate_solar_values(sequence.solar_steps, sun_state)

                # Check for per-attribute overrides
                ec = self.hass.data.get(DOMAIN, {}).get(DATA_ENTITY_CONTROLLER)
                override = OverrideAttributes.NONE
                if ec:
                    override = ec.get_override_attributes(entity_id)

                if override == OverrideAttributes.ALL:
                    # Fully overridden -- skip this cycle
                    try:
                        await asyncio.wait_for(
                            stop_event.wait(), timeout=SOLAR_POLL_INTERVAL
                        )
                        break
                    except asyncio.TimeoutError:
                        continue

                # Filter overridden attributes
                apply_ct = ct if OverrideAttributes.COLOR not in override else last_ct
                apply_br = br if OverrideAttributes.BRIGHTNESS not in override else last_br

                if apply_ct != last_ct or apply_br != last_br:
                    transition = min(SOLAR_POLL_INTERVAL, 30.0)

                    if override != OverrideAttributes.NONE:
                        # Partial override: build filtered service call directly
                        service_data: dict[str, Any] = {"entity_id": entity_id}
                        if OverrideAttributes.COLOR not in override:
                            service_data["color_temp_kelvin"] = ct
                        if OverrideAttributes.BRIGHTNESS not in override:
                            service_data["brightness"] = br
                        service_data["transition"] = transition

                        context = ec.create_context() if ec else None
                        await self.hass.services.async_call(
                            "light",
                            "turn_on",
                            service_data,
                            blocking=False,
                            context=context,
                        )
                    else:
                        # No override: use existing _apply_step path
                        step = CCTSequenceStep(
                            color_temp=ct,
                            brightness=br,
                            transition=transition,
                            hold=0,
                        )
                        completed = await self._apply_step(
                            entity_id, sequence, step,
                            step_index=0, stop_event=stop_event,
                        )
                        if not completed:
                            break

                    last_ct = apply_ct
                    last_br = apply_br

                # Interruptible wait for next poll
                try:
                    await asyncio.wait_for(
                        stop_event.wait(), timeout=SOLAR_POLL_INTERVAL
                    )
                    break  # stop_event was set
                except asyncio.TimeoutError:
                    pass  # Normal: poll again
        finally:
            self._cleanup_entity(entity_id)
