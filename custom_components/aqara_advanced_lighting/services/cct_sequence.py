"""CCT sequence service handlers for Aqara Advanced Lighting."""

from __future__ import annotations

import asyncio
import logging

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from ..const import (
    ATTR_END_BEHAVIOR,
    ATTR_LOOP_COUNT,
    ATTR_LOOP_MODE,
    ATTR_PRESET,
    ATTR_RESTORE_STATE,
    ATTR_SKIP_FIRST_IN_LOOP,
    ATTR_TURN_ON,
    CCT_MODE_SCHEDULE,
    CCT_MODE_SOLAR,
    CCT_MODE_STANDARD,
    DATA_CCT_SEQUENCE_MANAGER,
    DATA_ENTITY_CONTROLLER,
    DOMAIN,
    END_BEHAVIOR_MAINTAIN,
    LOOP_MODE_COUNT,
    LOOP_MODE_ONCE,
    MAX_SEQUENCE_STEPS,
    PRESET_TYPE_CCT_SEQUENCE,
    brightness_percent_to_device,
)
from ..models import (
    CCTSequence,
    CCTSequenceStep,
)
from ..preset_store import get_preset_store
from ..presets import CCT_SEQUENCE_PRESETS

from ._helpers import (
    _build_schedule_sequence,
    _build_solar_sequence,
    _ensure_light_on,
    _find_cct_manager_for_entity,
    _get_any_cct_manager,
    _get_context_and_record,
    _get_instance_components_for_entity,
    _is_aqara_entity,
    _is_valid_light_entity,
    _resolve_entity_ids,
)

_LOGGER = logging.getLogger(__name__)


async def handle_start_cct_sequence(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle start_cct_sequence service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Separate Aqara and generic light entities
    aqara_entity_ids = []
    generic_entity_ids = []
    invalid_entity_ids = []
    for entity_id in resolved_entity_ids:
        if _is_aqara_entity(hass, entity_id):
            aqara_entity_ids.append(entity_id)
        elif _is_valid_light_entity(hass, entity_id):
            generic_entity_ids.append(entity_id)
        else:
            invalid_entity_ids.append(entity_id)

    if invalid_entity_ids:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="unsupported_entities",
            translation_placeholders={"entity_list": ", ".join(invalid_entity_ids)},
        )

    turn_on: bool = call.data.get(ATTR_TURN_ON, False)
    preset: str | None = call.data.get(ATTR_PRESET)

    # Handle preset or manual configuration
    if preset:
        # Check user presets first
        preset_store = get_preset_store(hass)
        user_preset = None
        if preset_store:
            user_preset = preset_store.get_preset_by_name(
                PRESET_TYPE_CCT_SEQUENCE, preset
            )

        if user_preset:
            if user_preset.get("mode") == CCT_MODE_SCHEDULE:
                # Schedule user preset - pass through schedule fields
                preset_data = {
                    "mode": CCT_MODE_SCHEDULE,
                    "schedule_steps": user_preset.get("schedule_steps", []),
                    "auto_resume_delay": user_preset.get("auto_resume_delay", 0),
                }
                if not preset_data["schedule_steps"]:
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="schedule_steps_required",
                    )
                _LOGGER.debug(
                    "Using user schedule CCT preset '%s' with %d schedule steps",
                    preset,
                    len(preset_data["schedule_steps"]),
                )
            elif user_preset.get("mode") == CCT_MODE_SOLAR:
                # Solar user preset - pass through solar fields
                preset_data = {
                    "mode": CCT_MODE_SOLAR,
                    "solar_steps": user_preset.get("solar_steps", []),
                    "auto_resume_delay": user_preset.get("auto_resume_delay", 0),
                }
                if not preset_data["solar_steps"]:
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="solar_steps_required",
                    )
                _LOGGER.debug(
                    "Using user solar CCT preset '%s' with %d solar steps",
                    preset,
                    len(preset_data["solar_steps"]),
                )
            else:
                # Standard user preset - validate and convert
                try:
                    # Convert step brightness from percentage (1-100) to device
                    # value (1-255) since user presets store percentages
                    converted_steps = [
                        {
                            **step,
                            "brightness": brightness_percent_to_device(
                                step["brightness"]
                            ),
                        }
                        for step in user_preset["steps"]
                    ]
                    preset_data = {
                        "steps": converted_steps,
                        "loop_mode": user_preset["loop_mode"],
                        "loop_count": user_preset.get("loop_count"),
                        "end_behavior": user_preset["end_behavior"],
                        "skip_first_in_loop": user_preset.get(
                            "skip_first_in_loop", False
                        ),
                    }
                except KeyError as ex:
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="user_preset_missing_field",
                        translation_placeholders={
                            "preset": preset,
                            "field": str(ex),
                        },
                    ) from ex

                if not preset_data["steps"]:
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="user_preset_no_steps",
                        translation_placeholders={"preset": preset},
                    )

                _LOGGER.debug(
                    "Using user CCT sequence preset '%s' with %d steps",
                    preset,
                    len(preset_data["steps"]),
                )
        elif preset in CCT_SEQUENCE_PRESETS:
            preset_data = CCT_SEQUENCE_PRESETS[preset]
        else:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="invalid_preset",
                translation_placeholders={"preset": preset},
            )

        # Check if this is an adaptive mode preset
        if preset_data.get("mode") == CCT_MODE_SCHEDULE:
            schedule_steps_data = preset_data.get("schedule_steps", [])
            sequence = _build_schedule_sequence(
                schedule_steps_data,
                auto_resume_delay=preset_data.get("auto_resume_delay", 0),
            )
        elif preset_data.get("mode") == CCT_MODE_SOLAR:
            solar_steps_data = preset_data.get("solar_steps", [])
            sequence = _build_solar_sequence(
                solar_steps_data,
                auto_resume_delay=preset_data.get("auto_resume_delay", 0),
            )
        else:
            # Create CCTSequenceStep objects from preset step data
            sequence_steps = []
            for step_data in preset_data["steps"]:
                try:
                    step = CCTSequenceStep(
                        color_temp=step_data["color_temp"],
                        brightness=step_data["brightness"],
                        transition=step_data["transition"],
                        hold=step_data["hold"],
                    )
                    sequence_steps.append(step)
                except ValueError as ex:
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="invalid_sequence_configuration",
                        translation_placeholders={"error": str(ex)},
                    ) from ex

            # Get loop and end behavior from preset
            loop_mode: str = preset_data["loop_mode"]
            loop_count: int | None = preset_data.get("loop_count")
            end_behavior: str = preset_data["end_behavior"]
            skip_first_in_loop: bool = preset_data.get(
                "skip_first_in_loop", False
            )

            # Create CCT sequence from standard preset
            try:
                sequence = CCTSequence(
                    steps=sequence_steps,
                    loop_mode=loop_mode,
                    loop_count=loop_count,
                    end_behavior=end_behavior,
                    skip_first_in_loop=skip_first_in_loop,
                )
            except ValueError as ex:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="invalid_sequence_configuration",
                    translation_placeholders={"error": str(ex)},
                ) from ex
    else:
        # Manual configuration - extract from service call parameters
        mode = call.data.get("mode", CCT_MODE_STANDARD)

        auto_resume_delay = call.data.get("auto_resume_delay", 0)

        if mode == CCT_MODE_SOLAR:
            # Manual solar mode from service call
            solar_steps_data = call.data.get("solar_steps", [])
            if not solar_steps_data:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="solar_steps_required",
                )
            sequence = _build_solar_sequence(
                solar_steps_data, auto_resume_delay=auto_resume_delay
            )
        elif mode == CCT_MODE_SCHEDULE:
            schedule_steps_data = call.data.get("schedule_steps", [])
            if not schedule_steps_data:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="schedule_steps_required",
                )
            sequence = _build_schedule_sequence(
                schedule_steps_data, auto_resume_delay=auto_resume_delay
            )
        else:
            # Standard manual mode
            loop_mode = call.data.get(ATTR_LOOP_MODE, LOOP_MODE_ONCE)
            loop_count = call.data.get(ATTR_LOOP_COUNT)
            end_behavior = call.data.get(
                ATTR_END_BEHAVIOR, END_BEHAVIOR_MAINTAIN
            )
            skip_first_in_loop = call.data.get(
                ATTR_SKIP_FIRST_IN_LOOP, False
            )

            # Validate loop_count is provided when loop_mode is "count"
            if loop_mode == LOOP_MODE_COUNT and loop_count is None:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="loop_count_required",
                )

            # Extract steps from individual field inputs
            sequence_steps = []
            for step_num in range(1, MAX_SEQUENCE_STEPS + 1):
                color_temp_key = f"step_{step_num}_color_temp"
                brightness_key = f"step_{step_num}_brightness"
                transition_key = f"step_{step_num}_transition"
                hold_key = f"step_{step_num}_hold"

                # Check if this step is provided (all 4 fields must be present)
                if color_temp_key in call.data:
                    # Validate all required fields for this step are present
                    if not all(
                        key in call.data
                        for key in [
                            brightness_key,
                            transition_key,
                            hold_key,
                        ]
                    ):
                        raise ServiceValidationError(
                            translation_domain=DOMAIN,
                            translation_key="step_incomplete",
                            translation_placeholders={
                                "step": str(step_num)
                            },
                        )

                    transition_val = call.data[transition_key]
                    hold_val = call.data[hold_key]

                    # Convert brightness percentage to device value (1-255)
                    brightness_percent = call.data[brightness_key]
                    brightness_device = brightness_percent_to_device(
                        brightness_percent
                    )

                    try:
                        step = CCTSequenceStep(
                            color_temp=call.data[color_temp_key],
                            brightness=brightness_device,
                            transition=transition_val,
                            hold=hold_val,
                        )
                        sequence_steps.append(step)
                    except ValueError as ex:
                        raise ServiceValidationError(
                            translation_domain=DOMAIN,
                            translation_key="invalid_sequence_configuration",
                            translation_placeholders={"error": str(ex)},
                        ) from ex

            # Validate we have at least one step
            if not sequence_steps:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="step_required",
                )

            # Create CCT sequence from manual steps
            try:
                sequence = CCTSequence(
                    steps=sequence_steps,
                    loop_mode=loop_mode,
                    loop_count=loop_count,
                    end_behavior=end_behavior,
                    skip_first_in_loop=skip_first_in_loop,
                )
            except ValueError as ex:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="invalid_sequence_configuration",
                    translation_placeholders={"error": str(ex)},
                ) from ex

    # Group Aqara entities by their CCT manager instance for synchronized starting
    instance_groups: dict[
        str, dict
    ] = {}  # entry_id -> {manager, entities, turn_on_data}

    for entity_id in aqara_entity_ids:
        # Get the correct instance components for this entity
        entity_backend, entity_state_manager, entry_id = (
            _get_instance_components_for_entity(hass, entity_id)
        )

        # Get CCT manager from the correct instance
        instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
        cct_manager = instance_data.get(DATA_CCT_SEQUENCE_MANAGER)
        if not cct_manager:
            _LOGGER.warning(
                "CCT sequence manager not initialized for instance %s, skipping %s",
                entry_id,
                entity_id,
            )
            continue

        # Verify entity is mapped in this backend
        aqara_device = entity_backend.get_device_for_entity(entity_id)
        if not aqara_device:
            _LOGGER.warning(
                "Entity %s not mapped to any Aqara device, skipping", entity_id
            )
            continue

        # Add to instance group
        if entry_id not in instance_groups:
            instance_groups[entry_id] = {
                "manager": cct_manager,
                "entities": [],
                "turn_on_data": [],
            }

        instance_groups[entry_id]["entities"].append(entity_id)
        instance_groups[entry_id]["turn_on_data"].append(entity_id)

    # Route generic entities through any available CCT manager
    # CCT sequences use HA service calls so any manager works
    generic_manager_pair = None
    if generic_entity_ids:
        generic_manager_pair = _get_any_cct_manager(hass)
        if not generic_manager_pair:
            raise HomeAssistantError(
                "No integration instance available to manage generic lights. "
                "Please ensure at least one Aqara Advanced Lighting instance "
                "is configured."
            )

    # Capture state for all entities before starting sequence
    for entity_id in aqara_entity_ids:
        try:
            _, entity_state_manager, _ = (
                _get_instance_components_for_entity(hass, entity_id)
            )
            entity_state_manager.capture_state(
                entity_id, entity_id.split(".")[-1]
            )
        except Exception:
            _LOGGER.debug(
                "Could not capture state for %s before CCT sequence", entity_id
            )

    if generic_entity_ids:
        generic_pair = _get_any_cct_manager(hass)
        if generic_pair:
            _, generic_state_manager = generic_pair
            for entity_id in generic_entity_ids:
                generic_state_manager.capture_state(
                    entity_id, entity_id.split(".")[-1]
                )

    # Turn on all lights in parallel if requested
    if turn_on:
        turn_on_tasks = []
        # Aqara lights
        for group_data in instance_groups.values():
            for entity_id in group_data["turn_on_data"]:
                turn_on_tasks.append(_ensure_light_on(hass, entity_id, True))
        # Generic lights - use HA service call directly
        for entity_id in generic_entity_ids:
            state = hass.states.get(entity_id)
            if state and state.state != "on":
                turn_on_tasks.append(
                    hass.services.async_call(
                        "light",
                        "turn_on",
                        {"entity_id": entity_id},
                        blocking=False,
                        context=_get_context_and_record(hass, entity_id),
                    )
                )
        if turn_on_tasks:
            await asyncio.gather(*turn_on_tasks, return_exceptions=True)

    # Stop all conflicting continuous actions on these entities
    entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
    if entity_controller:
        for entity_id in aqara_entity_ids + generic_entity_ids:
            await entity_controller.stop_all_for_entity(entity_id)

    # Start synchronized sequences for each Aqara instance group
    start_tasks = []
    for entry_id, group_data in instance_groups.items():
        cct_manager = group_data["manager"]
        entity_list = group_data["entities"]
        start_tasks.append(
            cct_manager.start_synchronized_group(entity_list, sequence, preset)
        )

    # Start sequences for generic entities
    if generic_entity_ids and generic_manager_pair:
        generic_cct_manager, _ = generic_manager_pair
        start_tasks.append(
            generic_cct_manager.start_synchronized_group(
                generic_entity_ids, sequence, preset
            )
        )

    # Start all sequences in parallel
    try:
        await asyncio.gather(*start_tasks)
        _LOGGER.info(
            "Started CCT sequences for %d Aqara + %d generic entities: mode=%s",
            len(aqara_entity_ids),
            len(generic_entity_ids),
            sequence.mode,
        )
    except Exception as ex:
        all_entities = aqara_entity_ids + generic_entity_ids
        raise HomeAssistantError(
            translation_domain=DOMAIN,
            translation_key="start_sequence_failed",
            translation_placeholders={"entity": ", ".join(all_entities)},
        ) from ex


async def handle_stop_cct_sequence(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle stop_cct_sequence service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
    restore_state: bool = call.data.get(ATTR_RESTORE_STATE, True)

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Stop sequence for each entity - search all managers for running sequences
    for entity_id in resolved_entity_ids:
        cct_manager = _find_cct_manager_for_entity(hass, entity_id)
        if not cct_manager:
            _LOGGER.warning("No active CCT sequence for %s to stop", entity_id)
            continue

        try:
            await cct_manager.stop_sequence(entity_id)
            _LOGGER.info("Stopped CCT sequence for %s", entity_id)
        except Exception as ex:
            _LOGGER.error("Error stopping CCT sequence for %s: %s", entity_id, ex)
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="stop_sequence_failed",
                translation_placeholders={"entity": entity_id},
            ) from ex

    # Restore light states if requested
    if restore_state:
        for entity_id in resolved_entity_ids:
            try:
                _, entity_state_manager, _ = (
                    _get_instance_components_for_entity(hass, entity_id)
                )
                restored = await entity_state_manager.async_restore_entity_state(
                    entity_id, blocking=False
                )
                if restored:
                    _LOGGER.debug("Restored state for %s after CCT sequence", entity_id)
            except ServiceValidationError:
                # Generic (non-Aqara) entity - try any available state manager
                generic_pair = _get_any_cct_manager(hass)
                if generic_pair:
                    _, generic_sm = generic_pair
                    try:
                        await generic_sm.async_restore_entity_state(
                            entity_id, blocking=False
                        )
                    except Exception:
                        _LOGGER.debug(
                            "No stored state to restore for %s", entity_id
                        )
            except Exception:
                _LOGGER.debug("No stored state to restore for %s", entity_id)

    # Resume preset-paused solar/schedule CCT for affected entities
    # (covers case where standard CCT was running on top of paused solar)
    entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
    if entity_controller:
        for entity_id in resolved_entity_ids:
            await entity_controller.check_and_resume_solar(entity_id)


async def handle_pause_cct_sequence(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle pause_cct_sequence service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Pause sequence for each entity - search all managers
    for entity_id in resolved_entity_ids:
        cct_manager = _find_cct_manager_for_entity(hass, entity_id)
        if not cct_manager:
            _LOGGER.warning("No active CCT sequence for %s to pause", entity_id)
            continue

        success = cct_manager.pause_sequence(entity_id)
        if success:
            _LOGGER.info("Paused CCT sequence for %s", entity_id)
        else:
            _LOGGER.warning("Failed to pause CCT sequence for %s", entity_id)


async def handle_resume_cct_sequence(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle resume_cct_sequence service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Resume sequence for each entity - search all managers
    for entity_id in resolved_entity_ids:
        cct_manager = _find_cct_manager_for_entity(hass, entity_id)
        if not cct_manager:
            _LOGGER.warning("No active CCT sequence for %s to resume", entity_id)
            continue

        success = cct_manager.resume_sequence(entity_id)
        if success:
            _LOGGER.info("Resumed CCT sequence for %s", entity_id)
        else:
            _LOGGER.warning("Failed to resume CCT sequence for %s", entity_id)
