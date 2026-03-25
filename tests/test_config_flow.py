"""Test the Aqara Advanced Lighting config flow."""

from unittest.mock import AsyncMock

import pytest

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.aqara_advanced_lighting.const import (
    BACKEND_Z2M,
    CONF_BACKEND_TYPE,
    CONF_Z2M_BASE_TOPIC,
    DEFAULT_Z2M_BASE_TOPIC,
    DOMAIN,
)

pytestmark = pytest.mark.usefixtures("mock_setup_entry", "mock_z2m_validation")


async def test_user_flow_success(
    hass: HomeAssistant,
    mock_setup_entry: AsyncMock,
    mock_z2m_validation: AsyncMock,
) -> None:
    """Test successful user flow."""
    # Register MQTT service to simulate MQTT integration is loaded
    hass.services.async_register("mqtt", "publish", lambda call: None)

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "user"
    assert result["errors"] == {}

    # Step 1: Select Z2M backend
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_BACKEND_TYPE: BACKEND_Z2M},
    )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "z2m"

    # Step 2: Configure Z2M topic
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
    )
    await hass.async_block_till_done()

    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["title"] == "zigbee2mqtt"
    assert result["data"] == {
        CONF_BACKEND_TYPE: BACKEND_Z2M,
        CONF_Z2M_BASE_TOPIC: "zigbee2mqtt",
    }
    assert len(mock_setup_entry.mock_calls) == 1


async def test_user_flow_default_topic(
    hass: HomeAssistant,
    mock_setup_entry: AsyncMock,
    mock_z2m_validation: AsyncMock,
) -> None:
    """Test user flow with default topic."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] == FlowResultType.FORM

    # Step 1: Select Z2M backend
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_BACKEND_TYPE: BACKEND_Z2M},
    )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "z2m"

    # Step 2: Submit without specifying topic - should use default
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={},
    )
    await hass.async_block_till_done()

    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["title"] == DEFAULT_Z2M_BASE_TOPIC
    assert result["data"] == {
        CONF_BACKEND_TYPE: BACKEND_Z2M,
        CONF_Z2M_BASE_TOPIC: DEFAULT_Z2M_BASE_TOPIC,
    }


async def test_user_flow_mqtt_not_loaded(hass: HomeAssistant) -> None:
    """Test user flow when MQTT integration is not loaded."""
    # Do not register MQTT service to simulate MQTT not loaded

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] == FlowResultType.FORM

    # Step 1: Select Z2M backend
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_BACKEND_TYPE: BACKEND_Z2M},
    )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "z2m"

    # Step 2: Try to configure topic - MQTT not loaded should error
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
    )

    assert result["type"] == FlowResultType.FORM
    assert result["errors"] == {"base": "mqtt_not_loaded"}


async def test_user_flow_duplicate_entry(
    hass: HomeAssistant,
    mock_z2m_validation: AsyncMock,
) -> None:
    """Test that duplicate entries with same unique_id are prevented."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    # Create first instance with unique_id set to base topic
    config_entry = MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (zigbee2mqtt)",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        unique_id="zigbee2mqtt",
    )
    config_entry.add_to_hass(hass)

    # Try to create second instance with same base topic
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] == FlowResultType.FORM

    # Step 1: Select Z2M backend
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_BACKEND_TYPE: BACKEND_Z2M},
    )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "z2m"

    # Step 2: Try duplicate topic
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
    )

    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_user_flow_multiple_instances_different_topics(
    hass: HomeAssistant,
    mock_setup_entry: AsyncMock,
    mock_z2m_validation: AsyncMock,
) -> None:
    """Test that multiple instances with different topics are allowed."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    # Create first instance
    config_entry = MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (zigbee2mqtt)",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        unique_id="zigbee2mqtt",
    )
    config_entry.add_to_hass(hass)

    # Create second instance with different topic
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] == FlowResultType.FORM

    # Step 1: Select Z2M backend
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_BACKEND_TYPE: BACKEND_Z2M},
    )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "z2m"

    # Step 2: Configure different topic
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_Z2M_BASE_TOPIC: "z2m_garage"},
    )
    await hass.async_block_till_done()

    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["title"] == "z2m_garage"
    assert result["data"] == {
        CONF_BACKEND_TYPE: BACKEND_Z2M,
        CONF_Z2M_BASE_TOPIC: "z2m_garage",
    }


async def test_reconfigure_flow_success(
    hass: HomeAssistant,
    mock_setup_entry: AsyncMock,
    mock_z2m_validation: AsyncMock,
) -> None:
    """Test successful reconfigure flow."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    # Create existing config entry
    config_entry = MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (zigbee2mqtt)",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        unique_id="zigbee2mqtt",
    )
    config_entry.add_to_hass(hass)

    # Start reconfigure flow
    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={
            "source": config_entries.SOURCE_RECONFIGURE,
            "entry_id": config_entry.entry_id,
        },
    )

    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "reconfigure"

    # Update with new topic
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_Z2M_BASE_TOPIC: "z2m"},
    )
    await hass.async_block_till_done()

    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert config_entry.data == {
        CONF_BACKEND_TYPE: BACKEND_Z2M,
        CONF_Z2M_BASE_TOPIC: "z2m",
    }


async def test_reconfigure_flow_preserves_default(
    hass: HomeAssistant,
    mock_setup_entry: AsyncMock,
    mock_z2m_validation: AsyncMock,
) -> None:
    """Test reconfigure flow preserves current value as default."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    custom_topic = "custom_z2m_topic"
    config_entry = MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (custom_z2m_topic)",
        data={CONF_Z2M_BASE_TOPIC: custom_topic},
        unique_id=custom_topic,
    )
    config_entry.add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={
            "source": config_entries.SOURCE_RECONFIGURE,
            "entry_id": config_entry.entry_id,
        },
    )

    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "reconfigure"
    # Verify current value is shown as default in form (iterate keys to find vol.Optional marker)
    schema_keys = {str(k): k for k in result["data_schema"].schema}
    assert schema_keys[CONF_Z2M_BASE_TOPIC].default() == custom_topic


async def test_reconfigure_flow_mqtt_not_loaded(hass: HomeAssistant) -> None:
    """Test reconfigure flow when MQTT integration is not loaded."""
    # Do not register MQTT service

    config_entry = MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (zigbee2mqtt)",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        unique_id="zigbee2mqtt",
    )
    config_entry.add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={
            "source": config_entries.SOURCE_RECONFIGURE,
            "entry_id": config_entry.entry_id,
        },
    )

    assert result["type"] == FlowResultType.FORM

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_Z2M_BASE_TOPIC: "z2m"},
    )

    assert result["type"] == FlowResultType.FORM
    assert result["errors"] == {"base": "mqtt_not_loaded"}


async def test_reconfigure_flow_with_empty_topic(
    hass: HomeAssistant,
    mock_setup_entry: AsyncMock,
    mock_z2m_validation: AsyncMock,
) -> None:
    """Test reconfigure flow falls back to default when topic is empty."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    config_entry = MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (custom_topic)",
        data={CONF_Z2M_BASE_TOPIC: "custom_topic"},
        unique_id="custom_topic",
    )
    config_entry.add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={
            "source": config_entries.SOURCE_RECONFIGURE,
            "entry_id": config_entry.entry_id,
        },
    )

    # Submit empty config - schema default fills in the current entry topic
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={},
    )
    await hass.async_block_till_done()

    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert config_entry.data == {
        CONF_BACKEND_TYPE: BACKEND_Z2M,
        CONF_Z2M_BASE_TOPIC: "custom_topic",
    }


async def test_reconfigure_flow_duplicate_topic(
    hass: HomeAssistant,
    mock_z2m_validation: AsyncMock,
) -> None:
    """Test reconfigure flow prevents duplicate base topics."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    # Create first instance
    config_entry1 = MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (zigbee2mqtt)",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        unique_id="zigbee2mqtt",
    )
    config_entry1.add_to_hass(hass)

    # Create second instance
    config_entry2 = MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (z2m_garage)",
        data={CONF_Z2M_BASE_TOPIC: "z2m_garage"},
        unique_id="z2m_garage",
    )
    config_entry2.add_to_hass(hass)

    # Try to reconfigure second instance to use first instance's topic
    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={
            "source": config_entries.SOURCE_RECONFIGURE,
            "entry_id": config_entry2.entry_id,
        },
    )

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
    )

    assert result["type"] == FlowResultType.FORM
    assert result["errors"] == {"base": "duplicate_base_topic"}
