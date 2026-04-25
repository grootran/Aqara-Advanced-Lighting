"""Segment sequence service handlers."""

import asyncio
import logging
from typing import Any

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from ..const import (
    ACTIVATION_ALL,
    ATTR_BRIGHTNESS,
    ATTR_CLEAR_SEGMENTS,
    ATTR_END_BEHAVIOR,
    ATTR_LOOP_COUNT,
    ATTR_LOOP_MODE,
    ATTR_PRESET,
    ATTR_RESTORE_STATE,
    ATTR_SKIP_FIRST_IN_LOOP,
    ATTR_TURN_ON,
    DATA_ENTITY_CONTROLLER,
    DATA_SEGMENT_SEQUENCE_MANAGER,
    DOMAIN,
    END_BEHAVIOR_MAINTAIN,
    LOOP_MODE_COUNT,
    LOOP_MODE_ONCE,
    MAX_SEQUENCE_STEPS,
    PRESET_TYPE_SEGMENT_SEQUENCE,
    brightness_percent_to_device,
)
from ..light_capabilities import supports_segment_addressing
from ..models import RGBColor, SegmentColor, SegmentSequence, SegmentSequenceStep
from ..presets import SEGMENT_SEQUENCE_PRESETS
from ..preset_store import get_preset_store
from ._helpers import (
    _ensure_light_on,
    _get_context_and_record,
    _get_instance_components_for_entity,
    _normalize_color_to_rgb,
    _resolve_entity_ids,
    _validate_supported_entities,
)

from homeassistant.const import ATTR_ENTITY_ID

_LOGGER = logging.getLogger(__name__)

async def handle_start_segment_sequence(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle start_segment_sequence service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    turn_on: bool = call.data.get(ATTR_TURN_ON, False)
    brightness_percent: int | None = call.data.get(ATTR_BRIGHTNESS)
    brightness = (
        brightness_percent_to_device(brightness_percent)
        if brightness_percent is not None
        else None
    )
    preset: str | None = call.data.get(ATTR_PRESET)

    # Handle preset or manual configuration
    if preset:
        # Check user presets first
        preset_store = get_preset_store(hass)
        user_preset = None
        if preset_store:
            user_preset = preset_store.get_preset_by_name(
                PRESET_TYPE_SEGMENT_SEQUENCE, preset
            )

        if user_preset:
            # Validate required preset fields
            try:
                preset_data = {
                    "steps": user_preset["steps"],
                    "loop_mode": user_preset["loop_mode"],
                    "loop_count": user_preset.get("loop_count"),
                    "end_behavior": user_preset["end_behavior"],
                    "clear_segments": user_preset.get("clear_segments", False),
                    "skip_first_in_loop": user_preset.get(
                        "skip_first_in_loop", False
                    ),
                }
            except KeyError as ex:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="user_preset_missing_field",
                    translation_placeholders={"preset": preset, "field": str(ex)},
                ) from ex

            if not preset_data["steps"]:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="user_preset_no_steps",
                    translation_placeholders={"preset": preset},
                )

            _LOGGER.debug(
                "Using user segment sequence preset '%s' with %d steps",
                preset,
                len(preset_data["steps"]),
            )
        elif preset in SEGMENT_SEQUENCE_PRESETS:
            preset_data = SEGMENT_SEQUENCE_PRESETS[preset]
        else:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="invalid_preset",
                translation_placeholders={"preset": preset},
            )

        # Create SegmentSequenceStep objects from preset step data
        sequence_steps = []
        for step_data in preset_data["steps"]:
            try:
                # Check if step uses direct segment assignments (new method)
                segment_colors = None
                if "segment_colors" in step_data and step_data["segment_colors"]:
                    # Convert segment_colors from dicts to SegmentColor objects
                    segment_colors = [
                        SegmentColor(
                            segment=sc["segment"],
                            color=RGBColor(**sc["color"]),
                        )
                        for sc in step_data["segment_colors"]
                    ]
                    # For legacy compatibility, provide defaults for required fields
                    colors = [RGBColor(r=255, g=0, b=0)]  # Default, not used
                    segments = "all"  # Default, not used
                    mode = "individual"  # Default, not used
                else:
                    # Legacy mode: use segments + colors + mode
                    colors = [
                        RGBColor(**color)
                        if isinstance(color, dict)
                        else RGBColor(r=color[0], g=color[1], b=color[2])
                        for color in step_data["colors"]
                    ]
                    segments = step_data["segments"]
                    mode = step_data["mode"]

                step = SegmentSequenceStep(
                    segments=segments,
                    colors=colors,
                    mode=mode,
                    duration=step_data["duration"],
                    hold=step_data["hold"],
                    activation_pattern=step_data["activation_pattern"],
                    segment_colors=segment_colors,
                )
                sequence_steps.append(step)
            except (ValueError, KeyError) as ex:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="invalid_sequence_configuration",
                    translation_placeholders={"error": str(ex)},
                ) from ex

        # Get loop and end behavior from preset
        loop_mode: str = preset_data["loop_mode"]
        loop_count: int | None = preset_data.get("loop_count")
        end_behavior: str = preset_data["end_behavior"]
        clear_segments: bool = preset_data.get("clear_segments", False)
        skip_first_in_loop: bool = preset_data.get("skip_first_in_loop", False)
    else:
        # Manual configuration - extract from service call parameters
        loop_mode = call.data.get(ATTR_LOOP_MODE, LOOP_MODE_ONCE)
        loop_count = call.data.get(ATTR_LOOP_COUNT)
        end_behavior = call.data.get(ATTR_END_BEHAVIOR, END_BEHAVIOR_MAINTAIN)
        clear_segments = call.data.get(ATTR_CLEAR_SEGMENTS, False)
        skip_first_in_loop = call.data.get(ATTR_SKIP_FIRST_IN_LOOP, False)

        # Validate loop_count is provided when loop_mode is "count"
        if loop_mode == LOOP_MODE_COUNT and loop_count is None:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="loop_count_required",
            )

        # Extract steps from individual field inputs
        sequence_steps = []
        for step_num in range(1, MAX_SEQUENCE_STEPS + 1):
            segments_key = f"step_{step_num}_segments"
            mode_key = f"step_{step_num}_mode"

            # Check if this step is provided
            if segments_key in call.data and mode_key in call.data:
                # Check for new segment_colors format first
                segment_colors_key = f"step_{step_num}_segment_colors"
                segment_colors = None

                if (
                    segment_colors_key in call.data
                    and call.data[segment_colors_key]
                ):
                    # Convert segment_colors from dicts to SegmentColor objects
                    segment_colors = [
                        SegmentColor(
                            segment=sc["segment"],
                            color=RGBColor(**sc["color"]),
                        )
                        for sc in call.data[segment_colors_key]
                    ]
                    # Provide defaults for required fields when using segment_colors
                    step_colors = [RGBColor(r=255, g=0, b=0)]  # Default, not used
                else:
                    # Legacy format: Extract colors for this step (supports both RGB and XY formats)
                    step_colors = []
                    for color_num in range(1, 7):
                        color_key = f"step_{step_num}_color_{color_num}"
                        if color_key in call.data:
                            color_data = call.data[color_key]
                            step_colors.append(_normalize_color_to_rgb(color_data))

                    if not step_colors:
                        raise ServiceValidationError(
                            translation_domain=DOMAIN,
                            translation_key="step_requires_colors",
                            translation_placeholders={"step": str(step_num)},
                        )

                duration = call.data.get(f"step_{step_num}_duration", 0.0)
                hold = call.data.get(f"step_{step_num}_hold", 0.0)
                activation_pattern = call.data.get(
                    f"step_{step_num}_activation_pattern", ACTIVATION_ALL
                )

                try:
                    step = SegmentSequenceStep(
                        segments=call.data[segments_key],
                        colors=step_colors,
                        mode=call.data[mode_key],
                        duration=duration,
                        hold=hold,
                        activation_pattern=activation_pattern,
                        segment_colors=segment_colors,
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

    # Create segment sequence
    try:
        sequence = SegmentSequence(
            steps=sequence_steps,
            loop_mode=loop_mode,
            loop_count=loop_count,
            end_behavior=end_behavior,
            clear_segments=clear_segments,
            skip_first_in_loop=skip_first_in_loop,
        )
    except ValueError as ex:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="invalid_sequence_configuration",
            translation_placeholders={"error": str(ex)},
        ) from ex

    # Group entities by their segment manager instance for synchronized starting
    instance_groups: dict[
        str, dict
    ] = {}  # entry_id -> {manager, entities, turn_on_data}

    for entity_id in resolved_entity_ids:
        # Get the correct instance components for this entity
        entity_backend, entity_state_manager, entry_id = (
            _get_instance_components_for_entity(hass, entity_id)
        )

        # Get segment manager from the correct instance
        instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
        segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
        if not segment_manager:
            _LOGGER.warning(
                "Segment sequence manager not initialized for instance %s, skipping %s",
                entry_id,
                entity_id,
            )
            continue

        # Verify entity is mapped and check segment support
        aqara_device = entity_backend.get_device_for_entity(entity_id)
        if not aqara_device:
            _LOGGER.warning(
                "Entity %s not mapped to any Aqara device, skipping", entity_id
            )
            continue

        if not supports_segment_addressing(aqara_device.model_id):
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="device_no_segment_support",
                translation_placeholders={"entity_id": entity_id},
            )

        # Add to instance group
        if entry_id not in instance_groups:
            instance_groups[entry_id] = {
                "manager": segment_manager,
                "entities": [],
                "turn_on_data": [],
            }

        instance_groups[entry_id]["entities"].append(entity_id)
        instance_groups[entry_id]["turn_on_data"].append(entity_id)

    # Capture state for all entities before starting sequence
    for entity_id in resolved_entity_ids:
        try:
            _, entity_state_manager, _ = (
                _get_instance_components_for_entity(hass, entity_id)
            )
            entity_state_manager.capture_state(
                entity_id, entity_id.split(".")[-1]
            )
        except Exception:
            _LOGGER.debug(
                "Could not capture state for %s before segment sequence",
                entity_id,
            )

    # Turn on all lights in parallel if requested
    if turn_on:
        turn_on_tasks = []
        for group_data in instance_groups.values():
            for entity_id in group_data["turn_on_data"]:
                turn_on_tasks.append(_ensure_light_on(hass, entity_id, True))
        if turn_on_tasks:
            await asyncio.gather(*turn_on_tasks, return_exceptions=True)

    # Both T1M and T1 Strip require brightness via the standard light service;
    # neither family honors brightness embedded in the segment-pattern payload.
    if brightness is not None:
        accepted_entity_ids = [
            eid
            for group_data in instance_groups.values()
            for eid in group_data["entities"]
        ]
        brightness_tasks = [
            hass.services.async_call(
                "light",
                "turn_on",
                {"entity_id": eid, "brightness": brightness},
                blocking=True,
                context=_get_context_and_record(hass, eid),
            )
            for eid in accepted_entity_ids
        ]
        if brightness_tasks:
            results = await asyncio.gather(
                *brightness_tasks, return_exceptions=True
            )
            for eid, result in zip(accepted_entity_ids, results):
                if isinstance(result, Exception):
                    _LOGGER.warning(
                        "Failed to apply brightness override for %s: %s",
                        eid,
                        result,
                    )
            # Brief delay so device state propagates before the segment writes
            # (mirrors the 50ms pause used in the static-pattern T1 Strip path).
            await asyncio.sleep(0.05)

    # Stop all conflicting continuous actions on these entities
    entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
    if entity_controller:
        for entity_id in resolved_entity_ids:
            await entity_controller.stop_all_for_entity(entity_id)

    # Start synchronized sequences for each instance group
    for entry_id, group_data in instance_groups.items():
        segment_manager = group_data["manager"]
        entity_list = group_data["entities"]

        try:
            # Use synchronized group start for multiple entities
            sequence_ids = await segment_manager.start_synchronized_group(
                entity_list, sequence, preset
            )
            _LOGGER.info(
                "Started synchronized segment sequence for %d entities",
                len(entity_list),
            )
        except Exception as ex:
            _LOGGER.error("Failed to start synchronized segment sequence: %s", ex)
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="start_segment_sequence_failed",
                translation_placeholders={
                    "entity_id": ", ".join(entity_list),
                    "error": str(ex),
                },
            ) from ex

async def handle_stop_segment_sequence(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle stop_segment_sequence service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
    restore_state: bool = call.data.get(ATTR_RESTORE_STATE, True)

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Validate all entities are supported Aqara devices
    _validate_supported_entities(hass, resolved_entity_ids)

    # Stop sequence for each entity
    for entity_id in resolved_entity_ids:
        # Get the correct instance components for this entity
        _, _, entry_id = _get_instance_components_for_entity(hass, entity_id)

        # Get segment manager from the correct instance
        instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
        segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
        if not segment_manager:
            _LOGGER.warning(
                "Segment sequence manager not initialized for instance %s, skipping %s",
                entry_id,
                entity_id,
            )
            continue

        try:
            await segment_manager.stop_sequence(entity_id)
            _LOGGER.info("Stopped segment sequence for %s", entity_id)
        except Exception as ex:
            _LOGGER.warning(
                "Failed to stop segment sequence for %s: %s", entity_id, ex
            )

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
                    _LOGGER.debug(
                        "Restored state for %s after segment sequence", entity_id
                    )
            except Exception:
                _LOGGER.debug("No stored state to restore for %s", entity_id)

    # Resume preset-paused solar/schedule CCT for affected entities
    entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
    if entity_controller:
        for entity_id in resolved_entity_ids:
            await entity_controller.check_and_resume_solar(entity_id)

async def handle_pause_segment_sequence(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle pause_segment_sequence service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Validate all entities are supported Aqara devices
    _validate_supported_entities(hass, resolved_entity_ids)

    # Pause sequence for each entity
    for entity_id in resolved_entity_ids:
        # Get the correct instance components for this entity
        _, _, entry_id = _get_instance_components_for_entity(hass, entity_id)

        # Get segment manager from the correct instance
        instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
        segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
        if not segment_manager:
            _LOGGER.warning(
                "Segment sequence manager not initialized for instance %s, skipping %s",
                entry_id,
                entity_id,
            )
            continue

        if not segment_manager.is_sequence_running(entity_id):
            _LOGGER.warning("No active segment sequence for %s to pause", entity_id)
            continue

        success = segment_manager.pause_sequence(entity_id)
        if success:
            _LOGGER.info("Paused segment sequence for %s", entity_id)
        else:
            _LOGGER.warning("Failed to pause segment sequence for %s", entity_id)

async def handle_resume_segment_sequence(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle resume_segment_sequence service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Validate all entities are supported Aqara devices
    _validate_supported_entities(hass, resolved_entity_ids)

    # Resume sequence for each entity
    for entity_id in resolved_entity_ids:
        # Get the correct instance components for this entity
        _, _, entry_id = _get_instance_components_for_entity(hass, entity_id)

        # Get segment manager from the correct instance
        instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
        segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
        if not segment_manager:
            _LOGGER.warning(
                "Segment sequence manager not initialized for instance %s, skipping %s",
                entry_id,
                entity_id,
            )
            continue

        if not segment_manager.is_sequence_running(entity_id):
            _LOGGER.warning(
                "No active segment sequence for %s to resume", entity_id
            )
            continue

        success = segment_manager.resume_sequence(entity_id)
        if success:
            _LOGGER.info("Resumed segment sequence for %s", entity_id)
        else:
            _LOGGER.warning("Failed to resume segment sequence for %s", entity_id)
