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
    _detect_service_call_attributes,
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
    """Both brightness and color changed significantly returns ALL."""
    old = mock_state(brightness=128, color_temp_kelvin=4000)
    new = mock_state(brightness=200, color_temp_kelvin=3000)
    assert _detect_changed_attributes(old, new) == OverrideAttributes.ALL


def test_detect_no_change(mock_state):
    """No attribute change returns NONE."""
    old = mock_state(brightness=128, color_temp_kelvin=4000)
    new = mock_state(brightness=128, color_temp_kelvin=4000)
    assert _detect_changed_attributes(old, new) == OverrideAttributes.NONE


def test_detect_color_change_with_brightness_drift(mock_state):
    """Small brightness drift alongside color temp change is COLOR only."""
    old = mock_state(brightness=128, color_temp_kelvin=4000)
    new = mock_state(brightness=131, color_temp_kelvin=3000)
    assert _detect_changed_attributes(old, new) == OverrideAttributes.COLOR


def test_detect_brightness_change_with_color_temp_drift(mock_state):
    """Small color temp drift alongside brightness change is BRIGHTNESS only."""
    old = mock_state(brightness=128, color_temp_kelvin=4000)
    new = mock_state(brightness=200, color_temp_kelvin=4030)
    assert _detect_changed_attributes(old, new) == OverrideAttributes.BRIGHTNESS


def test_detect_both_significant_changes(mock_state):
    """Large changes to both attributes returns ALL."""
    old = mock_state(brightness=128, color_temp_kelvin=4000)
    new = mock_state(brightness=200, color_temp_kelvin=3000)
    assert _detect_changed_attributes(old, new) == OverrideAttributes.ALL


def test_get_override_attributes_default(controller):
    """Unpaused entity returns NONE."""
    assert controller.get_override_attributes("light.test") == OverrideAttributes.NONE


def test_get_override_attributes_after_set(controller):
    """Paused entity returns stored override flags."""
    controller._externally_paused["light.test"] = OverrideAttributes.BRIGHTNESS
    assert controller.get_override_attributes("light.test") == OverrideAttributes.BRIGHTNESS


def test_is_externally_paused_with_dict(controller):
    """is_entity_externally_paused works with dict storage."""
    assert not controller.is_entity_externally_paused("light.test")
    controller._externally_paused["light.test"] = OverrideAttributes.ALL
    assert controller.is_entity_externally_paused("light.test")


def test_clear_entity_with_dict(controller):
    """clear_entity removes from dict."""
    controller._externally_paused["light.test"] = OverrideAttributes.ALL
    controller.clear_entity("light.test")
    assert not controller.is_entity_externally_paused("light.test")


def test_pause_entity_pause_all_mode(controller, mock_hass):
    """In pause_all mode, any change results in ALL override."""
    store = MagicMock()
    store.get_global_preference = MagicMock(side_effect=lambda k: {
        "ignore_external_changes": False,
        "override_control_mode": "pause_all",
    }.get(k))
    mock_hass.data[DOMAIN][DATA_USER_PREFERENCES_STORE] = store

    controller._pause_entity("light.test", OverrideAttributes.BRIGHTNESS)
    assert controller.get_override_attributes("light.test") == OverrideAttributes.ALL


def test_pause_entity_pause_changed_solar(controller, mock_hass):
    """In pause_changed mode, solar sequence gets partial override."""
    store = MagicMock()
    store.get_global_preference = MagicMock(side_effect=lambda k: {
        "ignore_external_changes": False,
        "override_control_mode": "pause_changed",
    }.get(k))
    mock_hass.data[DOMAIN][DATA_USER_PREFERENCES_STORE] = store

    cct = MagicMock()
    cct.is_solar_sequence = MagicMock(return_value=True)
    cct.is_sequence_running = MagicMock(return_value=True)
    cct.get_auto_resume_delay = MagicMock(return_value=0)
    mock_hass.data[DOMAIN]["entries"] = {
        "entry1": {DATA_CCT_SEQUENCE_MANAGER: cct},
    }

    controller._pause_entity("light.test", OverrideAttributes.BRIGHTNESS)
    assert controller.get_override_attributes("light.test") == OverrideAttributes.BRIGHTNESS
    cct.pause_sequence.assert_not_called()


def test_pause_entity_pause_changed_standard_cct(controller, mock_hass):
    """In pause_changed mode, standard CCT sequence still gets full pause."""
    store = MagicMock()
    store.get_global_preference = MagicMock(side_effect=lambda k: {
        "ignore_external_changes": False,
        "override_control_mode": "pause_changed",
    }.get(k))
    mock_hass.data[DOMAIN][DATA_USER_PREFERENCES_STORE] = store

    cct = MagicMock()
    cct.is_solar_sequence = MagicMock(return_value=False)
    cct.is_sequence_running = MagicMock(return_value=True)
    cct.get_auto_resume_delay = MagicMock(return_value=0)
    mock_hass.data[DOMAIN]["entries"] = {
        "entry1": {DATA_CCT_SEQUENCE_MANAGER: cct},
    }

    controller._pause_entity("light.test", OverrideAttributes.BRIGHTNESS)
    assert controller.get_override_attributes("light.test") == OverrideAttributes.ALL
    cct.pause_sequence.assert_called_once_with("light.test")


def test_pause_entity_merges_attributes(controller, mock_hass):
    """Subsequent pauses merge attribute flags."""
    store = MagicMock()
    store.get_global_preference = MagicMock(side_effect=lambda k: {
        "override_control_mode": "pause_changed",
    }.get(k))
    mock_hass.data[DOMAIN][DATA_USER_PREFERENCES_STORE] = store

    cct = MagicMock()
    cct.is_solar_sequence = MagicMock(return_value=True)
    cct.is_sequence_running = MagicMock(return_value=True)
    cct.get_auto_resume_delay = MagicMock(return_value=0)
    mock_hass.data[DOMAIN]["entries"] = {
        "entry1": {DATA_CCT_SEQUENCE_MANAGER: cct},
    }

    controller._pause_entity("light.test", OverrideAttributes.BRIGHTNESS)
    assert controller.get_override_attributes("light.test") == OverrideAttributes.BRIGHTNESS

    controller._pause_entity("light.test", OverrideAttributes.COLOR)
    assert controller.get_override_attributes("light.test") == OverrideAttributes.ALL
    cct.pause_sequence.assert_called_once_with("light.test")


# -- Service call attribute detection tests --


def test_service_call_brightness_only():
    """Brightness keys in service data return BRIGHTNESS."""
    assert _detect_service_call_attributes(
        {"entity_id": "light.test", "brightness_pct": 50}
    ) == OverrideAttributes.BRIGHTNESS


def test_service_call_brightness_step():
    """Brightness step keys return BRIGHTNESS."""
    assert _detect_service_call_attributes(
        {"entity_id": "light.test", "brightness_step_pct": -10}
    ) == OverrideAttributes.BRIGHTNESS


def test_service_call_color_temp_only():
    """Color temp keys return COLOR."""
    assert _detect_service_call_attributes(
        {"entity_id": "light.test", "color_temp_kelvin": 3000}
    ) == OverrideAttributes.COLOR


def test_service_call_rgb_color():
    """RGB color key returns COLOR."""
    assert _detect_service_call_attributes(
        {"entity_id": "light.test", "rgb_color": [255, 0, 0]}
    ) == OverrideAttributes.COLOR


def test_service_call_both_attributes():
    """Both brightness and color keys return ALL."""
    assert _detect_service_call_attributes(
        {"entity_id": "light.test", "brightness": 200, "color_temp_kelvin": 3000}
    ) == OverrideAttributes.ALL


def test_service_call_effect():
    """Effect key returns ALL regardless of other keys."""
    assert _detect_service_call_attributes(
        {"entity_id": "light.test", "effect": "rainbow"}
    ) == OverrideAttributes.ALL


def test_service_call_bare_turn_on():
    """Bare turn_on (no attributes) returns NONE."""
    assert _detect_service_call_attributes(
        {"entity_id": "light.test"}
    ) == OverrideAttributes.NONE


def test_service_call_transition_only():
    """Transition-only service call returns NONE (transition is not an override)."""
    assert _detect_service_call_attributes(
        {"entity_id": "light.test", "transition": 2}
    ) == OverrideAttributes.NONE


def test_service_call_flash():
    """Flash key returns ALL."""
    assert _detect_service_call_attributes(
        {"entity_id": "light.test", "flash": "short"}
    ) == OverrideAttributes.ALL


# -- Service call listener dedup tests --


def test_service_pause_times_cleared_on_clear_entity(controller):
    """clear_entity removes service pause tracking."""
    controller._service_pause_times["light.test"] = 100.0
    controller.clear_entity("light.test")
    assert "light.test" not in controller._service_pause_times


def test_service_pause_times_cleared_on_cleanup(controller):
    """cleanup removes all service pause tracking."""
    controller._service_pause_times["light.test"] = 100.0
    controller.cleanup()
    assert not controller._service_pause_times
