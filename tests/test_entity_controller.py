"""Tests for entity controller override detection."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.aqara_advanced_lighting.const import (
    DATA_CCT_SEQUENCE_MANAGER,
    DATA_DYNAMIC_SCENE_MANAGER,
    DATA_USER_PREFERENCES_STORE,
    DOMAIN,
    OverrideAttributes,
)
from custom_components.aqara_advanced_lighting.entity_controller import (
    EntityController,
    _detect_changed_attributes,
    _state_attributes_equal,
)


@pytest.fixture
def mock_hass():
    """Create a mock HomeAssistant instance."""
    hass = MagicMock()
    hass.bus = MagicMock()
    hass.bus.async_listen = MagicMock(return_value=MagicMock())
    hass.bus.async_fire = MagicMock()
    hass.states = MagicMock()
    hass.data = {DOMAIN: {"entries": {}}}
    return hass


@pytest.fixture
def controller(mock_hass):
    """Create an EntityController with mocked hass."""
    return EntityController(mock_hass)


@pytest.fixture
def mock_state():
    """Create a mock HA State object factory."""
    def _make(state="on", brightness=128, color_temp_kelvin=4000,
              xy_color=None, rgb_color=None, hs_color=None):
        s = MagicMock()
        s.state = state
        s.attributes = {
            "brightness": brightness,
            "color_temp_kelvin": color_temp_kelvin,
        }
        if xy_color is not None:
            s.attributes["xy_color"] = xy_color
        if rgb_color is not None:
            s.attributes["rgb_color"] = rgb_color
        if hs_color is not None:
            s.attributes["hs_color"] = hs_color
        return s
    return _make


def test_controller_initializes(controller):
    """Smoke test: controller can be created."""
    assert controller is not None
    assert not controller.is_entity_externally_paused("light.test")


def test_detect_brightness_change(mock_state):
    """Brightness-only change returns BRIGHTNESS flag."""
    old = mock_state(brightness=128, color_temp_kelvin=4000)
    new = mock_state(brightness=200, color_temp_kelvin=4000)
    assert _detect_changed_attributes(old, new) == OverrideAttributes.BRIGHTNESS


def test_detect_color_temp_change(mock_state):
    """Color temp change returns COLOR flag."""
    old = mock_state(brightness=128, color_temp_kelvin=4000)
    new = mock_state(brightness=128, color_temp_kelvin=3000)
    assert _detect_changed_attributes(old, new) == OverrideAttributes.COLOR


def test_detect_xy_color_change(mock_state):
    """XY color change returns COLOR flag."""
    old = mock_state(brightness=128, xy_color=(0.3, 0.3))
    new = mock_state(brightness=128, xy_color=(0.5, 0.4))
    assert _detect_changed_attributes(old, new) == OverrideAttributes.COLOR


def test_detect_both_changes(mock_state):
    """Both brightness and color changed returns ALL."""
    old = mock_state(brightness=128, color_temp_kelvin=4000)
    new = mock_state(brightness=200, color_temp_kelvin=3000)
    assert _detect_changed_attributes(old, new) == OverrideAttributes.ALL


def test_detect_no_change(mock_state):
    """No attribute change returns NONE."""
    old = mock_state(brightness=128, color_temp_kelvin=4000)
    new = mock_state(brightness=128, color_temp_kelvin=4000)
    assert _detect_changed_attributes(old, new) == OverrideAttributes.NONE
