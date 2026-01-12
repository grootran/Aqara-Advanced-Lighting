"""Test the Aqara Advanced Lighting config flow."""

from unittest.mock import AsyncMock

import pytest

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.aqara_advanced_lighting.const import (
    CONF_Z2M_BASE_TOPIC,
    DEFAULT_Z2M_BASE_TOPIC,
    DOMAIN,
)

pytestmark = pytest.mark.usefixtures("mock_setup_entry")


async def test_user_flow_success(hass: HomeAssistant, mock_setup_entry: AsyncMock) -> None:
    """Test successful user flow."""
    # Register MQTT service to simulate MQTT integration is loaded
    hass.services.async_register("mqtt", "publish", lambda call: None)

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "user"
    assert result["errors"] == {}

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
    )
    await hass.async_block_till_done()

    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["title"] == "Aqara Advanced Lighting"
    assert result["data"] == {CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"}
    assert len(mock_setup_entry.mock_calls) == 1


async def test_user_flow_default_topic(
    hass: HomeAssistant, mock_setup_entry: AsyncMock
) -> None:
    """Test user flow with default topic."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] == FlowResultType.FORM

    # Submit without specifying topic - should use default
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={},
    )
    await hass.async_block_till_done()

    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["data"] == {CONF_Z2M_BASE_TOPIC: DEFAULT_Z2M_BASE_TOPIC}


async def test_user_flow_mqtt_not_loaded(hass: HomeAssistant) -> None:
    """Test user flow when MQTT integration is not loaded."""
    # Do not register MQTT service to simulate MQTT not loaded

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] == FlowResultType.FORM

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
    )

    assert result["type"] == FlowResultType.FORM
    assert result["errors"] == {"base": "mqtt_not_loaded"}


async def test_user_flow_single_instance(hass: HomeAssistant) -> None:
    """Test that only one instance can be configured."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    # Create first instance
    config_entry = config_entries.ConfigEntry(
        version=1,
        minor_version=1,
        domain=DOMAIN,
        title="Aqara Advanced Lighting",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        source=config_entries.SOURCE_USER,
        unique_id=None,
    )
    config_entry.add_to_hass(hass)

    # Try to create second instance
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )

    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"


async def test_reconfigure_flow_success(
    hass: HomeAssistant, mock_setup_entry: AsyncMock
) -> None:
    """Test successful reconfigure flow."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    # Create existing config entry
    config_entry = config_entries.ConfigEntry(
        version=1,
        minor_version=1,
        domain=DOMAIN,
        title="Aqara Advanced Lighting",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        source=config_entries.SOURCE_USER,
        unique_id=None,
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
    assert config_entry.data == {CONF_Z2M_BASE_TOPIC: "z2m"}


async def test_reconfigure_flow_preserves_default(
    hass: HomeAssistant, mock_setup_entry: AsyncMock
) -> None:
    """Test reconfigure flow preserves current value as default."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    custom_topic = "custom_z2m_topic"
    config_entry = config_entries.ConfigEntry(
        version=1,
        minor_version=1,
        domain=DOMAIN,
        title="Aqara Advanced Lighting",
        data={CONF_Z2M_BASE_TOPIC: custom_topic},
        source=config_entries.SOURCE_USER,
        unique_id=None,
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
    # Verify current value is shown as default in form
    schema = result["data_schema"].schema
    assert schema[CONF_Z2M_BASE_TOPIC].default() == custom_topic


async def test_reconfigure_flow_mqtt_not_loaded(hass: HomeAssistant) -> None:
    """Test reconfigure flow when MQTT integration is not loaded."""
    # Do not register MQTT service

    config_entry = config_entries.ConfigEntry(
        version=1,
        minor_version=1,
        domain=DOMAIN,
        title="Aqara Advanced Lighting",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        source=config_entries.SOURCE_USER,
        unique_id=None,
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
    hass: HomeAssistant, mock_setup_entry: AsyncMock
) -> None:
    """Test reconfigure flow falls back to default when topic is empty."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    config_entry = config_entries.ConfigEntry(
        version=1,
        minor_version=1,
        domain=DOMAIN,
        title="Aqara Advanced Lighting",
        data={CONF_Z2M_BASE_TOPIC: "custom_topic"},
        source=config_entries.SOURCE_USER,
        unique_id=None,
    )
    config_entry.add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={
            "source": config_entries.SOURCE_RECONFIGURE,
            "entry_id": config_entry.entry_id,
        },
    )

    # Submit empty config - should use default
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={},
    )
    await hass.async_block_till_done()

    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert config_entry.data == {CONF_Z2M_BASE_TOPIC: DEFAULT_Z2M_BASE_TOPIC}
