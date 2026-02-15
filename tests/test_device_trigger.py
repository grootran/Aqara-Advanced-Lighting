"""Tests for Aqara Advanced Lighting device triggers."""

from __future__ import annotations

from dataclasses import dataclass, field
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from homeassistant.components.device_automation import DeviceAutomationType
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_DEVICE_ID, CONF_DOMAIN, CONF_PLATFORM, CONF_TYPE
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import device_registry as dr
from homeassistant.setup import async_setup_component

from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_get_device_automations,
)

from custom_components.aqara_advanced_lighting.const import (
    CONF_Z2M_BASE_TOPIC,
    DOMAIN,
    EVENT_EFFECT_ACTIVATED,
    EVENT_EFFECT_STOPPED,
    EVENT_SEQUENCE_COMPLETED,
    EVENT_SEQUENCE_PAUSED,
    EVENT_SEQUENCE_RESUMED,
    EVENT_SEQUENCE_STARTED,
    EVENT_SEQUENCE_STOPPED,
    EVENT_STEP_CHANGED,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_SEQUENCE_TYPE,
    SEQUENCE_TYPE_CCT,
    SEQUENCE_TYPE_SEGMENT,
    TRIGGER_TYPE_CCT_SEQUENCE_COMPLETED,
    TRIGGER_TYPE_CCT_SEQUENCE_PAUSED,
    TRIGGER_TYPE_CCT_SEQUENCE_RESUMED,
    TRIGGER_TYPE_CCT_SEQUENCE_STARTED,
    TRIGGER_TYPE_CCT_SEQUENCE_STEP_CHANGED,
    TRIGGER_TYPE_CCT_SEQUENCE_STOPPED,
    TRIGGER_TYPE_EFFECT_ACTIVATED,
    TRIGGER_TYPE_EFFECT_STOPPED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_COMPLETED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_PAUSED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_RESUMED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STARTED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STEP_CHANGED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STOPPED,
    TRIGGER_TYPES,
)
from custom_components.aqara_advanced_lighting.device_trigger import (
    TRIGGER_SCHEMA,
    get_entity_ids_for_device,
    _TRIGGER_EVENT_MAP,
)


# IEEE address for test device
TEST_IEEE = "0x00158d0001abcdef"
TEST_FRIENDLY_NAME = "bedroom_light"
TEST_MODEL_ID = "lumi.light.acn031"


@dataclass
class FakeZ2MDevice:
    """Fake Z2M device for testing."""

    ieee_address: str
    friendly_name: str
    model_id: str
    manufacturer: str = "Aqara"
    supported: bool = True


@dataclass
class FakeRuntimeData:
    """Fake runtime data for testing."""

    config_entry: MockConfigEntry | None = None
    z2m_base_topic: str = "zigbee2mqtt"
    devices: dict[str, FakeZ2MDevice] = field(default_factory=dict)
    entity_to_z2m_map: dict[str, str] = field(default_factory=dict)
    entity_mapping_methods: dict[str, str] = field(default_factory=dict)
    device_states: dict = field(default_factory=dict)


@pytest.fixture
def mock_config_entry() -> MockConfigEntry:
    """Create a mock config entry."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (zigbee2mqtt)",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        unique_id="zigbee2mqtt",
    )


@pytest.fixture
def device_registry(hass: HomeAssistant) -> dr.DeviceRegistry:
    """Return the device registry."""
    return dr.async_get(hass)


@pytest.fixture
def mock_device(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    device_registry: dr.DeviceRegistry,
) -> dr.DeviceEntry:
    """Create a mock device in the device registry."""
    mock_config_entry.add_to_hass(hass)
    return device_registry.async_get_or_create(
        config_entry_id=mock_config_entry.entry_id,
        identifiers={(DOMAIN, TEST_IEEE)},
        name=TEST_FRIENDLY_NAME,
        manufacturer="Aqara",
        model="T1M ceiling light (20 segments)",
        model_id=TEST_MODEL_ID,
    )


@pytest.fixture
def mock_loaded_entry(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> MockConfigEntry:
    """Set up a loaded config entry with runtime data."""
    mock_config_entry.add_to_hass(hass)

    z2m_device = FakeZ2MDevice(
        ieee_address=TEST_IEEE,
        friendly_name=TEST_FRIENDLY_NAME,
        model_id=TEST_MODEL_ID,
    )
    runtime_data = FakeRuntimeData(
        config_entry=mock_config_entry,
        devices={TEST_IEEE: z2m_device},
        entity_to_z2m_map={"light.bedroom": TEST_FRIENDLY_NAME},
    )
    mock_config_entry.runtime_data = runtime_data
    mock_config_entry.mock_state(hass, ConfigEntryState.LOADED)
    return mock_config_entry


# --- Tests for get_entity_ids_for_device ---


async def test_get_entity_ids_for_device_returns_mapped_entities(
    hass: HomeAssistant,
    mock_loaded_entry: MockConfigEntry,
    mock_device: dr.DeviceEntry,
) -> None:
    """Test that entity IDs are resolved from device identifiers."""
    result = get_entity_ids_for_device(hass, mock_device.id)
    assert result == {"light.bedroom"}


async def test_get_entity_ids_for_device_nonexistent_device(
    hass: HomeAssistant,
) -> None:
    """Test that nonexistent device returns empty set."""
    result = get_entity_ids_for_device(hass, "nonexistent_device_id")
    assert result == set()


async def test_get_entity_ids_for_device_no_domain_identifier(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    device_registry: dr.DeviceRegistry,
) -> None:
    """Test that device without our domain identifier returns empty set."""
    mock_config_entry.add_to_hass(hass)
    device = device_registry.async_get_or_create(
        config_entry_id=mock_config_entry.entry_id,
        identifiers={("other_domain", "some_id")},
        name="Other device",
    )
    result = get_entity_ids_for_device(hass, device.id)
    assert result == set()


async def test_get_entity_ids_for_device_no_loaded_entry(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_device: dr.DeviceEntry,
) -> None:
    """Test that unloaded config entry is skipped."""
    # Entry is added but not loaded (no runtime_data, state is NOT_LOADED)
    result = get_entity_ids_for_device(hass, mock_device.id)
    assert result == set()


async def test_get_entity_ids_for_device_ieee_not_in_runtime(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    device_registry: dr.DeviceRegistry,
) -> None:
    """Test that device with unknown IEEE returns empty set."""
    mock_config_entry.add_to_hass(hass)

    # Create device with an IEEE address that's not in runtime data
    unknown_ieee = "0x00158d00ff000000"
    device = device_registry.async_get_or_create(
        config_entry_id=mock_config_entry.entry_id,
        identifiers={(DOMAIN, unknown_ieee)},
        name="Unknown device",
    )

    # Set up runtime data without this IEEE
    runtime_data = FakeRuntimeData(
        config_entry=mock_config_entry,
        devices={},
        entity_to_z2m_map={},
    )
    mock_config_entry.runtime_data = runtime_data
    mock_config_entry.mock_state(hass, ConfigEntryState.LOADED)

    result = get_entity_ids_for_device(hass, device.id)
    assert result == set()


async def test_get_entity_ids_for_device_multiple_entities(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_device: dr.DeviceEntry,
) -> None:
    """Test that multiple entities mapping to same device are returned."""
    z2m_device = FakeZ2MDevice(
        ieee_address=TEST_IEEE,
        friendly_name=TEST_FRIENDLY_NAME,
        model_id=TEST_MODEL_ID,
    )
    runtime_data = FakeRuntimeData(
        config_entry=mock_config_entry,
        devices={TEST_IEEE: z2m_device},
        entity_to_z2m_map={
            "light.bedroom": TEST_FRIENDLY_NAME,
            "light.bedroom_2": TEST_FRIENDLY_NAME,
        },
    )
    mock_config_entry.runtime_data = runtime_data
    mock_config_entry.mock_state(hass, ConfigEntryState.LOADED)

    result = get_entity_ids_for_device(hass, mock_device.id)
    assert result == {"light.bedroom", "light.bedroom_2"}


# --- Tests for async_get_triggers ---


async def test_get_triggers_returns_all_trigger_types(
    hass: HomeAssistant,
    mock_device: dr.DeviceEntry,
) -> None:
    """Test that all 14 trigger types are returned for a valid device."""
    from custom_components.aqara_advanced_lighting.device_trigger import (
        async_get_triggers,
    )

    triggers = await async_get_triggers(hass, mock_device.id)

    assert len(triggers) == len(TRIGGER_TYPES)

    returned_types = {t[CONF_TYPE] for t in triggers}
    assert returned_types == TRIGGER_TYPES

    # Verify each trigger has the correct structure
    for trigger in triggers:
        assert trigger[CONF_PLATFORM] == "device"
        assert trigger[CONF_DOMAIN] == DOMAIN
        assert trigger[CONF_DEVICE_ID] == mock_device.id


async def test_get_triggers_nonexistent_device(
    hass: HomeAssistant,
) -> None:
    """Test that nonexistent device returns empty list."""
    from custom_components.aqara_advanced_lighting.device_trigger import (
        async_get_triggers,
    )

    triggers = await async_get_triggers(hass, "nonexistent_id")
    assert triggers == []


async def test_get_triggers_wrong_domain_device(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    device_registry: dr.DeviceRegistry,
) -> None:
    """Test that device from another domain returns empty list."""
    from custom_components.aqara_advanced_lighting.device_trigger import (
        async_get_triggers,
    )

    mock_config_entry.add_to_hass(hass)
    device = device_registry.async_get_or_create(
        config_entry_id=mock_config_entry.entry_id,
        identifiers={("other_integration", "some_id")},
        name="Other device",
    )

    triggers = await async_get_triggers(hass, device.id)
    assert triggers == []


# --- Tests for async_attach_trigger ---


async def test_attach_trigger_no_entities_returns_noop(
    hass: HomeAssistant,
    mock_device: dr.DeviceEntry,
) -> None:
    """Test that trigger attachment returns no-op when no entities are mapped."""
    from custom_components.aqara_advanced_lighting.device_trigger import (
        async_attach_trigger,
    )

    config = {
        CONF_PLATFORM: "device",
        CONF_DOMAIN: DOMAIN,
        CONF_DEVICE_ID: mock_device.id,
        CONF_TYPE: TRIGGER_TYPE_CCT_SEQUENCE_STARTED,
    }
    action = AsyncMock()
    trigger_info = {"trigger_id": "test_trigger"}

    unsub = await async_attach_trigger(hass, config, action, trigger_info)

    # Should return a callable (no-op lambda)
    assert callable(unsub)
    # Calling it should not raise
    unsub()


async def test_attach_trigger_single_entity(
    hass: HomeAssistant,
    mock_loaded_entry: MockConfigEntry,
    mock_device: dr.DeviceEntry,
) -> None:
    """Test trigger attachment with a single entity maps to event listener."""
    from custom_components.aqara_advanced_lighting.device_trigger import (
        async_attach_trigger,
    )

    config = {
        CONF_PLATFORM: "device",
        CONF_DOMAIN: DOMAIN,
        CONF_DEVICE_ID: mock_device.id,
        CONF_TYPE: TRIGGER_TYPE_CCT_SEQUENCE_STARTED,
    }
    action = AsyncMock()
    trigger_info = {"trigger_id": "test_trigger"}

    with patch(
        "custom_components.aqara_advanced_lighting.device_trigger.event_trigger.async_attach_trigger",
        return_value=MagicMock(),
    ) as mock_attach:
        unsub = await async_attach_trigger(hass, config, action, trigger_info)

        # Should have called event_trigger.async_attach_trigger once
        mock_attach.assert_called_once()

        # Verify the event config passed to event_trigger
        call_args = mock_attach.call_args
        event_config = call_args[0][1]  # Second positional arg is the config
        assert event_config["event_type"] == EVENT_SEQUENCE_STARTED
        assert event_config["event_data"][EVENT_ATTR_ENTITY_ID] == "light.bedroom"
        assert event_config["event_data"][EVENT_ATTR_SEQUENCE_TYPE] == SEQUENCE_TYPE_CCT


async def test_attach_trigger_multiple_entities(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_device: dr.DeviceEntry,
) -> None:
    """Test trigger attachment with multiple entities creates multiple listeners."""
    from custom_components.aqara_advanced_lighting.device_trigger import (
        async_attach_trigger,
    )

    # Set up runtime data with two entities
    z2m_device = FakeZ2MDevice(
        ieee_address=TEST_IEEE,
        friendly_name=TEST_FRIENDLY_NAME,
        model_id=TEST_MODEL_ID,
    )
    runtime_data = FakeRuntimeData(
        config_entry=mock_config_entry,
        devices={TEST_IEEE: z2m_device},
        entity_to_z2m_map={
            "light.bedroom": TEST_FRIENDLY_NAME,
            "light.bedroom_2": TEST_FRIENDLY_NAME,
        },
    )
    mock_config_entry.runtime_data = runtime_data
    mock_config_entry.mock_state(hass, ConfigEntryState.LOADED)

    config = {
        CONF_PLATFORM: "device",
        CONF_DOMAIN: DOMAIN,
        CONF_DEVICE_ID: mock_device.id,
        CONF_TYPE: TRIGGER_TYPE_SEGMENT_SEQUENCE_STARTED,
    }
    action = AsyncMock()
    trigger_info = {"trigger_id": "test_trigger"}

    mock_unsub = MagicMock()
    with patch(
        "custom_components.aqara_advanced_lighting.device_trigger.event_trigger.async_attach_trigger",
        return_value=mock_unsub,
    ) as mock_attach:
        unsub = await async_attach_trigger(hass, config, action, trigger_info)

        # Should have called event_trigger.async_attach_trigger twice (one per entity)
        assert mock_attach.call_count == 2

        # Verify both entity IDs are covered
        entity_ids_used = set()
        for call in mock_attach.call_args_list:
            event_config = call[0][1]
            entity_ids_used.add(event_config["event_data"][EVENT_ATTR_ENTITY_ID])
            assert event_config["event_data"][EVENT_ATTR_SEQUENCE_TYPE] == SEQUENCE_TYPE_SEGMENT

        assert entity_ids_used == {"light.bedroom", "light.bedroom_2"}

    # Calling unsub should call both individual unsubs
    unsub()
    assert mock_unsub.call_count == 2


async def test_attach_trigger_effect_no_sequence_type_filter(
    hass: HomeAssistant,
    mock_loaded_entry: MockConfigEntry,
    mock_device: dr.DeviceEntry,
) -> None:
    """Test that effect triggers do not include sequence_type in event filter."""
    from custom_components.aqara_advanced_lighting.device_trigger import (
        async_attach_trigger,
    )

    config = {
        CONF_PLATFORM: "device",
        CONF_DOMAIN: DOMAIN,
        CONF_DEVICE_ID: mock_device.id,
        CONF_TYPE: TRIGGER_TYPE_EFFECT_ACTIVATED,
    }
    action = AsyncMock()
    trigger_info = {"trigger_id": "test_trigger"}

    with patch(
        "custom_components.aqara_advanced_lighting.device_trigger.event_trigger.async_attach_trigger",
        return_value=MagicMock(),
    ) as mock_attach:
        await async_attach_trigger(hass, config, action, trigger_info)

        call_args = mock_attach.call_args
        event_config = call_args[0][1]
        assert event_config["event_type"] == EVENT_EFFECT_ACTIVATED
        assert EVENT_ATTR_SEQUENCE_TYPE not in event_config["event_data"]
        assert event_config["event_data"][EVENT_ATTR_ENTITY_ID] == "light.bedroom"


# --- Tests for TRIGGER_SCHEMA ---


def test_trigger_schema_validates_known_types() -> None:
    """Test that TRIGGER_SCHEMA accepts all known trigger types."""
    for trigger_type in TRIGGER_TYPES:
        config = TRIGGER_SCHEMA(
            {
                CONF_PLATFORM: "device",
                CONF_DOMAIN: DOMAIN,
                CONF_DEVICE_ID: "test_device_id",
                CONF_TYPE: trigger_type,
            }
        )
        assert config[CONF_TYPE] == trigger_type


def test_trigger_schema_rejects_unknown_type() -> None:
    """Test that TRIGGER_SCHEMA rejects unknown trigger types."""
    import voluptuous as vol

    with pytest.raises(vol.Invalid):
        TRIGGER_SCHEMA(
            {
                CONF_PLATFORM: "device",
                CONF_DOMAIN: DOMAIN,
                CONF_DEVICE_ID: "test_device_id",
                CONF_TYPE: "unknown_trigger_type",
            }
        )


# --- Tests for _TRIGGER_EVENT_MAP completeness ---


def test_trigger_event_map_covers_all_trigger_types() -> None:
    """Test that every trigger type has a mapping in _TRIGGER_EVENT_MAP."""
    assert set(_TRIGGER_EVENT_MAP.keys()) == TRIGGER_TYPES


def test_trigger_event_map_cct_uses_correct_sequence_type() -> None:
    """Test that all CCT trigger types filter by SEQUENCE_TYPE_CCT."""
    cct_triggers = [t for t in TRIGGER_TYPES if t.startswith("cct_")]
    for trigger_type in cct_triggers:
        _, seq_type = _TRIGGER_EVENT_MAP[trigger_type]
        assert seq_type == SEQUENCE_TYPE_CCT, (
            f"{trigger_type} should filter by {SEQUENCE_TYPE_CCT}"
        )


def test_trigger_event_map_segment_uses_correct_sequence_type() -> None:
    """Test that all segment trigger types filter by SEQUENCE_TYPE_SEGMENT."""
    segment_triggers = [t for t in TRIGGER_TYPES if t.startswith("segment_")]
    for trigger_type in segment_triggers:
        _, seq_type = _TRIGGER_EVENT_MAP[trigger_type]
        assert seq_type == SEQUENCE_TYPE_SEGMENT, (
            f"{trigger_type} should filter by {SEQUENCE_TYPE_SEGMENT}"
        )


def test_trigger_event_map_effects_have_no_sequence_type() -> None:
    """Test that effect trigger types have no sequence_type filter."""
    effect_triggers = [t for t in TRIGGER_TYPES if t.startswith("effect_")]
    for trigger_type in effect_triggers:
        _, seq_type = _TRIGGER_EVENT_MAP[trigger_type]
        assert seq_type is None, (
            f"{trigger_type} should have no sequence_type filter"
        )


def test_all_trigger_types_have_14_entries() -> None:
    """Test that we have exactly 14 trigger types."""
    assert len(TRIGGER_TYPES) == 14


# --- Tests for merged devices (multiple identifiers) ---


async def test_get_triggers_works_on_merged_device(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    device_registry: dr.DeviceRegistry,
) -> None:
    """Test that triggers are returned for a merged device with multiple identifiers."""
    from custom_components.aqara_advanced_lighting.device_trigger import (
        async_get_triggers,
    )

    mock_config_entry.add_to_hass(hass)

    # Create a mock MQTT config entry so the device registry accepts it
    mqtt_config_entry = MockConfigEntry(
        domain="mqtt",
        title="Zigbee2MQTT",
        data={"broker": "localhost"},
        unique_id="z2m_bridge",
    )
    mqtt_config_entry.add_to_hass(hass)

    # Create a merged device (has both MQTT and our identifiers + MAC connection)
    device_registry.async_get_or_create(
        config_entry_id=mqtt_config_entry.entry_id,
        identifiers={("mqtt", "zigbee2mqtt_bridge_0x00158d0001abcdef")},
        connections={("mac", "00:15:8d:00:01:ab:cd:ef")},
        name=TEST_FRIENDLY_NAME,
    )
    # Our integration attaches to same device via matching MAC connection
    merged_device = device_registry.async_get_or_create(
        config_entry_id=mock_config_entry.entry_id,
        identifiers={(DOMAIN, TEST_IEEE)},
        connections={("mac", "00:15:8d:00:01:ab:cd:ef")},
        name=TEST_FRIENDLY_NAME,
    )

    triggers = await async_get_triggers(hass, merged_device.id)

    assert len(triggers) == len(TRIGGER_TYPES)
    for trigger in triggers:
        assert trigger[CONF_DEVICE_ID] == merged_device.id


async def test_get_entity_ids_works_on_merged_device(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    device_registry: dr.DeviceRegistry,
) -> None:
    """Test entity ID resolution works when device has multiple identifiers."""
    mock_config_entry.add_to_hass(hass)

    # Create a mock MQTT config entry so the device registry accepts it
    mqtt_config_entry = MockConfigEntry(
        domain="mqtt",
        title="Zigbee2MQTT",
        data={"broker": "localhost"},
        unique_id="z2m_bridge",
    )
    mqtt_config_entry.add_to_hass(hass)

    # Create merged device (MQTT first, then our integration attaches)
    device_registry.async_get_or_create(
        config_entry_id=mqtt_config_entry.entry_id,
        identifiers={("mqtt", "zigbee2mqtt_bridge_0x00158d0001abcdef")},
        connections={("mac", "00:15:8d:00:01:ab:cd:ef")},
    )
    merged_device = device_registry.async_get_or_create(
        config_entry_id=mock_config_entry.entry_id,
        identifiers={(DOMAIN, TEST_IEEE)},
        connections={("mac", "00:15:8d:00:01:ab:cd:ef")},
    )

    # Set up runtime data with entity mapping
    z2m_device = FakeZ2MDevice(
        ieee_address=TEST_IEEE,
        friendly_name=TEST_FRIENDLY_NAME,
        model_id=TEST_MODEL_ID,
    )
    runtime_data = FakeRuntimeData(
        config_entry=mock_config_entry,
        devices={TEST_IEEE: z2m_device},
        entity_to_z2m_map={"light.bedroom": TEST_FRIENDLY_NAME},
    )
    mock_config_entry.runtime_data = runtime_data
    mock_config_entry.mock_state(hass, ConfigEntryState.LOADED)

    result = get_entity_ids_for_device(hass, merged_device.id)
    assert result == {"light.bedroom"}
