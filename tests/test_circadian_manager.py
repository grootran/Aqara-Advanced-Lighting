"""Tests for circadian overlay manager."""

from unittest.mock import AsyncMock, MagicMock

from custom_components.aqara_advanced_lighting.circadian_manager import (
    CircadianManager,
)
from custom_components.aqara_advanced_lighting.sun_utils import SolarStep


SOLAR_CURVE = [
    SolarStep(sun_elevation=-6, color_temp=2700, brightness=50, phase="any"),
    SolarStep(sun_elevation=45, color_temp=6500, brightness=255, phase="any"),
]


def _make_hass() -> MagicMock:
    """Create a mock hass object."""
    hass = MagicMock()
    hass.bus = MagicMock()
    hass.bus.async_listen = MagicMock(return_value=MagicMock())
    hass.services = MagicMock()
    hass.services.async_call = AsyncMock()
    sun_state = MagicMock()
    sun_state.attributes = {"elevation": 20.0, "rising": True}
    hass.states.get = MagicMock(return_value=sun_state)
    return hass


def test_start_circadian_registers_listener() -> None:
    """Starting circadian should register a state change listener."""
    hass = _make_hass()
    mgr = CircadianManager(hass)
    mgr.start_circadian("light.test", SOLAR_CURVE)
    assert mgr.is_active("light.test")
    hass.bus.async_listen.assert_called_once()


def test_stop_circadian_removes_listener() -> None:
    """Stopping circadian should unsubscribe and remove the entry."""
    hass = _make_hass()
    mgr = CircadianManager(hass)
    mgr.start_circadian("light.test", SOLAR_CURVE)
    result = mgr.stop_circadian("light.test")
    assert result is True
    assert not mgr.is_active("light.test")


def test_stop_nonexistent_returns_false() -> None:
    """Stopping a non-existent overlay should return False."""
    hass = _make_hass()
    mgr = CircadianManager(hass)
    assert mgr.stop_circadian("light.nope") is False


def test_get_active_entities() -> None:
    """Should return all active entity IDs."""
    hass = _make_hass()
    mgr = CircadianManager(hass)
    mgr.start_circadian("light.one", SOLAR_CURVE)
    mgr.start_circadian("light.two", SOLAR_CURVE)
    assert set(mgr.get_active_entities()) == {"light.one", "light.two"}


def test_stop_all() -> None:
    """stop_all should remove all overlays."""
    hass = _make_hass()
    mgr = CircadianManager(hass)
    mgr.start_circadian("light.one", SOLAR_CURVE)
    mgr.start_circadian("light.two", SOLAR_CURVE)
    mgr.stop_all()
    assert mgr.get_active_entities() == []


def test_get_active_info_returns_current_values() -> None:
    """get_active_info should return interpolated values from sun state."""
    hass = _make_hass()
    mgr = CircadianManager(hass)
    mgr.start_circadian(
        "light.test", SOLAR_CURVE, preset_name="solar_natural"
    )
    info = mgr.get_active_info()
    assert len(info) == 1
    assert info[0]["entity_id"] == "light.test"
    assert info[0]["preset_name"] == "solar_natural"
    assert 2700 < info[0]["current_color_temp"] < 6500
    assert 50 < info[0]["current_brightness"] < 255


def test_start_replaces_existing() -> None:
    """Starting circadian on an already-active entity should replace it."""
    hass = _make_hass()
    mgr = CircadianManager(hass)
    mgr.start_circadian("light.test", SOLAR_CURVE, preset_name="old")
    mgr.start_circadian("light.test", SOLAR_CURVE, preset_name="new")
    info = mgr.get_active_info()
    assert len(info) == 1
    assert info[0]["preset_name"] == "new"
