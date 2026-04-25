"""Brightness-override tests for start_segment_sequence.

Covers the brightness behavior added to the start_segment_sequence service:
- Schema accepts brightness in [1, 100] and rejects out-of-range values.
- When brightness is supplied, light.turn_on is dispatched once per accepted
  entity with the percent->device-converted value, before the segment manager
  starts the synchronized group.
- When brightness is omitted, no light.turn_on brightness write happens.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import voluptuous as vol

from custom_components.aqara_advanced_lighting.const import (
    ATTR_BRIGHTNESS,
    DATA_SEGMENT_SEQUENCE_MANAGER,
    DOMAIN,
    MODEL_T1_STRIP,
    MODEL_T1M_20_SEGMENT,
    MODEL_T1M_26_SEGMENT,
    brightness_percent_to_device,
)
from custom_components.aqara_advanced_lighting.services._schemas import (
    SERVICE_START_SEGMENT_SEQUENCE_SCHEMA,
)


PRESET_NAME = "_test_brightness_preset"

# Synthetic preset injected via patch.dict so tests do not depend on any
# real built-in preset name (which could be renamed/removed). Field shape
# matches what handle_start_segment_sequence reads from
# SEGMENT_SEQUENCE_PRESETS entries (see services/segment_sequence.py).
SYNTHETIC_PRESET = {
    "name": "Test Brightness Preset",
    "icon": "mdi:test-tube",
    "steps": [
        {
            "segments": "all",
            "colors": [[255, 0, 0]],
            "mode": "blocks_repeat",
            "duration": 1.0,
            "hold": 0.0,
            "activation_pattern": "all",
        }
    ],
    "loop_mode": "once",
    "end_behavior": "maintain",
}


def _patch_synthetic_preset():
    """Return a context manager that injects SYNTHETIC_PRESET into the
    handler's preset registry under PRESET_NAME without touching real
    built-in entries."""
    return patch.dict(
        "custom_components.aqara_advanced_lighting.services."
        "segment_sequence.SEGMENT_SEQUENCE_PRESETS",
        {PRESET_NAME: SYNTHETIC_PRESET},
        clear=False,
    )


class TestSchema:
    """Schema acceptance/rejection for the new brightness key."""

    def test_accepts_brightness_in_range(self):
        result = SERVICE_START_SEGMENT_SEQUENCE_SCHEMA(
            {"entity_id": ["light.x"], "preset": "p", ATTR_BRIGHTNESS: 50}
        )
        assert result[ATTR_BRIGHTNESS] == 50

    def test_accepts_brightness_omitted(self):
        result = SERVICE_START_SEGMENT_SEQUENCE_SCHEMA(
            {"entity_id": ["light.x"], "preset": "p"}
        )
        assert ATTR_BRIGHTNESS not in result

    @pytest.mark.parametrize("bad", [0, 101, -1, 200])
    def test_rejects_out_of_range(self, bad):
        with pytest.raises(vol.Invalid):
            SERVICE_START_SEGMENT_SEQUENCE_SCHEMA(
                {"entity_id": ["light.x"], "preset": "p", ATTR_BRIGHTNESS: bad}
            )

    def test_accepts_boundary_values(self):
        low = SERVICE_START_SEGMENT_SEQUENCE_SCHEMA(
            {"entity_id": ["light.x"], "preset": "p", ATTR_BRIGHTNESS: 1}
        )
        assert low[ATTR_BRIGHTNESS] == 1
        high = SERVICE_START_SEGMENT_SEQUENCE_SCHEMA(
            {"entity_id": ["light.x"], "preset": "p", ATTR_BRIGHTNESS: 100}
        )
        assert high[ATTR_BRIGHTNESS] == 100


def _build_segment_sequence_env(model_id: str, entity_id: str = "light.test_segment"):
    """Build a hass-like environment for the segment sequence handler.

    Returns a dict with the hass mock, the segment manager mock, the entry_id,
    and the entity_id used. The handler reads:
      - hass.data[DOMAIN]["entries"][entry_id][DATA_SEGMENT_SEQUENCE_MANAGER]
      - hass.data[DOMAIN][DATA_ENTITY_CONTROLLER] (optional; absent here)
      - hass.services.async_call(...)  (mocked AsyncMock)
      - hass.states.get(entity_id)  (returns None -> entity is treated as
        a single light; no group expansion)

    We bypass the entity-routing helper by patching
    _get_instance_components_for_entity in the module under test.
    """
    hass = MagicMock()
    hass.services.async_call = AsyncMock(return_value=None)
    hass.states.get = MagicMock(return_value=None)

    # Backend that maps the entity to an aqara_device with the requested model.
    backend = MagicMock()
    aqara_device = MagicMock()
    aqara_device.model_id = model_id
    backend.get_device_for_entity = MagicMock(return_value=aqara_device)

    state_manager = MagicMock()
    state_manager.capture_state = MagicMock()

    # Segment sequence manager: only start_synchronized_group must be awaitable.
    segment_manager = MagicMock()
    segment_manager.start_synchronized_group = AsyncMock(return_value=["seq-1"])

    entry_id = "entry-1"

    hass.data = {
        DOMAIN: {
            "entries": {
                entry_id: {
                    "backend": backend,
                    "state_manager": state_manager,
                    DATA_SEGMENT_SEQUENCE_MANAGER: segment_manager,
                }
            },
            "entity_routing": {entity_id: entry_id},
            # DATA_ENTITY_CONTROLLER intentionally omitted so
            # _get_context_and_record returns None and entity controller
            # cleanup loop is skipped.
        }
    }

    return {
        "hass": hass,
        "segment_manager": segment_manager,
        "backend": backend,
        "state_manager": state_manager,
        "entry_id": entry_id,
        "entity_id": entity_id,
    }


class TestBrightnessDispatch:
    """Brightness must be applied once per entity, before the manager runs.

    Both T1M and T1 Strip get the same dispatch path (light.turn_on); neither
    honors brightness inside the segment-pattern payload.
    """

    @pytest.mark.parametrize(
        "model_id",
        [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    )
    async def test_brightness_dispatched_via_light_turn_on(self, model_id):
        env = _build_segment_sequence_env(model_id)
        hass = env["hass"]
        entity_id = env["entity_id"]

        from custom_components.aqara_advanced_lighting.services import (
            segment_sequence as ss_module,
        )

        call = MagicMock()
        call.data = {
            "entity_id": [entity_id],
            "preset": PRESET_NAME,
            ATTR_BRIGHTNESS: 40,
            "turn_on": False,
        }

        with _patch_synthetic_preset(), patch.object(
            ss_module,
            "_get_instance_components_for_entity",
            return_value=(env["backend"], env["state_manager"], env["entry_id"]),
        ):
            await ss_module.handle_start_segment_sequence(hass, call)

        # Filter for light.turn_on dispatches addressing our entity.
        turn_on_calls = [
            c
            for c in hass.services.async_call.call_args_list
            if c.args[:2] == ("light", "turn_on")
            and c.args[2].get("entity_id") == entity_id
        ]
        assert len(turn_on_calls) == 1, (
            f"Expected exactly one light.turn_on for {entity_id}, "
            f"got {len(turn_on_calls)}: {turn_on_calls}"
        )
        assert (
            turn_on_calls[0].args[2]["brightness"]
            == brightness_percent_to_device(40)
        )

        # And the manager actually started the sequence afterwards.
        assert env["segment_manager"].start_synchronized_group.await_count == 1

    async def test_no_dispatch_when_brightness_omitted(self):
        env = _build_segment_sequence_env(MODEL_T1M_20_SEGMENT)
        hass = env["hass"]
        entity_id = env["entity_id"]

        from custom_components.aqara_advanced_lighting.services import (
            segment_sequence as ss_module,
        )

        call = MagicMock()
        call.data = {
            "entity_id": [entity_id],
            "preset": PRESET_NAME,
            "turn_on": False,
        }

        with _patch_synthetic_preset(), patch.object(
            ss_module,
            "_get_instance_components_for_entity",
            return_value=(env["backend"], env["state_manager"], env["entry_id"]),
        ):
            await ss_module.handle_start_segment_sequence(hass, call)

        # No light.turn_on calls carrying a brightness key.
        bright_calls = [
            c
            for c in hass.services.async_call.call_args_list
            if c.args[:2] == ("light", "turn_on")
            and "brightness" in (c.args[2] or {})
        ]
        assert bright_calls == [], (
            f"No brightness dispatch expected when brightness is omitted; "
            f"got: {bright_calls}"
        )
        # The manager still ran.
        assert env["segment_manager"].start_synchronized_group.await_count == 1

    async def test_brightness_applied_before_manager_start(self):
        """The brightness light.turn_on must fire BEFORE
        segment_manager.start_synchronized_group, so the device state is set
        when the first step writes its segment payload."""
        env = _build_segment_sequence_env(MODEL_T1_STRIP)
        hass = env["hass"]
        manager = env["segment_manager"]
        entity_id = env["entity_id"]

        ordering: list[str] = []

        async def record_service_call(domain, service, data, *args, **kwargs):
            if domain == "light" and service == "turn_on" and "brightness" in (
                data or {}
            ):
                ordering.append("light.turn_on")
            return None

        async def record_start(*_args, **_kwargs):
            ordering.append("manager.start")
            return ["seq-1"]

        hass.services.async_call = AsyncMock(side_effect=record_service_call)
        manager.start_synchronized_group = AsyncMock(side_effect=record_start)

        from custom_components.aqara_advanced_lighting.services import (
            segment_sequence as ss_module,
        )

        call = MagicMock()
        call.data = {
            "entity_id": [entity_id],
            "preset": PRESET_NAME,
            ATTR_BRIGHTNESS: 75,
            "turn_on": False,
        }

        with _patch_synthetic_preset(), patch.object(
            ss_module,
            "_get_instance_components_for_entity",
            return_value=(env["backend"], env["state_manager"], env["entry_id"]),
        ):
            await ss_module.handle_start_segment_sequence(hass, call)

        assert "light.turn_on" in ordering, (
            f"brightness light.turn_on never fired; ordering={ordering}"
        )
        assert "manager.start" in ordering, (
            f"manager.start_synchronized_group never fired; ordering={ordering}"
        )
        assert ordering.index("light.turn_on") < ordering.index(
            "manager.start"
        ), f"Wrong ordering (brightness must precede manager start): {ordering}"

    async def test_brightness_skips_unmapped_entities(self):
        """Regression: brightness loop must iterate the accepted entities
        recorded in `instance_groups[...]['entities']`, NOT the raw
        `resolved_entity_ids`. When one entity in the call is unmapped to
        any Aqara device, exactly one light.turn_on must fire (for the
        mapped entity only)."""
        # Build env around the mapped entity.
        env = _build_segment_sequence_env(MODEL_T1M_20_SEGMENT)
        hass = env["hass"]
        mapped_entity_id = env["entity_id"]
        unmapped_entity_id = "light.unmapped_entity"

        # Backend returns an aqara_device only for the mapped entity; for
        # the unmapped one it returns None (mirrors a real unmapped lookup).
        mapped_aqara_device = env["backend"].get_device_for_entity.return_value

        def _get_device(eid):
            if eid == mapped_entity_id:
                return mapped_aqara_device
            return None

        env["backend"].get_device_for_entity = MagicMock(side_effect=_get_device)

        # Both entities resolve to the same instance components (same
        # entry_id). The unmapped entity will be filtered out because
        # `aqara_device` is None and the handler does `continue`.
        components = (env["backend"], env["state_manager"], env["entry_id"])

        from custom_components.aqara_advanced_lighting.services import (
            segment_sequence as ss_module,
        )

        call = MagicMock()
        call.data = {
            "entity_id": [mapped_entity_id, unmapped_entity_id],
            "preset": PRESET_NAME,
            ATTR_BRIGHTNESS: 60,
            "turn_on": False,
        }

        with _patch_synthetic_preset(), patch.object(
            ss_module,
            "_get_instance_components_for_entity",
            return_value=components,
        ):
            await ss_module.handle_start_segment_sequence(hass, call)

        # Exactly one light.turn_on with brightness must fire, and it must
        # target the mapped entity only.
        bright_calls = [
            c
            for c in hass.services.async_call.call_args_list
            if c.args[:2] == ("light", "turn_on")
            and "brightness" in (c.args[2] or {})
        ]
        assert len(bright_calls) == 1, (
            f"Expected exactly one brightness dispatch (mapped only), "
            f"got {len(bright_calls)}: {bright_calls}"
        )
        assert bright_calls[0].args[2]["entity_id"] == mapped_entity_id, (
            f"Brightness dispatched for wrong entity: "
            f"{bright_calls[0].args[2]}"
        )
        assert (
            bright_calls[0].args[2]["brightness"]
            == brightness_percent_to_device(60)
        )

        # The synchronized group must still start, with only the mapped
        # entity in its entity list.
        manager = env["segment_manager"]
        assert manager.start_synchronized_group.await_count == 1
        started_entities = manager.start_synchronized_group.await_args.args[0]
        assert started_entities == [mapped_entity_id], (
            f"Manager started with wrong entity list: {started_entities}"
        )
