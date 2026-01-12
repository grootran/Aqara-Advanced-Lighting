"""Common fixtures for Aqara Advanced Lighting tests."""

from collections.abc import Generator
from unittest.mock import AsyncMock, patch

import pytest

pytest_plugins = "pytest_homeassistant_custom_component"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable custom integrations for all tests."""
    yield


@pytest.fixture
def mock_mqtt_client() -> Generator[AsyncMock]:
    """Mock MQTT client."""
    with patch(
        "homeassistant.components.mqtt.async_subscribe"
    ) as mock_subscribe:
        yield mock_subscribe


@pytest.fixture
def mock_setup_entry() -> Generator[AsyncMock]:
    """Mock setup entry."""
    with patch(
        "custom_components.aqara_advanced_lighting.async_setup_entry",
        return_value=True,
    ) as mock_setup:
        yield mock_setup
