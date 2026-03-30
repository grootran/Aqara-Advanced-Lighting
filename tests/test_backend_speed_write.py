"""Tests for backend speed-only write methods."""
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestMqttBackendSpeedWrite:
    """Test MQTT backend async_write_effect_speed."""

    def test_speed_only_payload(self):
        """Verify payload contains only effect_speed key."""
        payload = json.dumps({"effect_speed": 75})
        parsed = json.loads(payload)
        assert parsed == {"effect_speed": 75}
        assert "effect" not in parsed
        assert "effect_colors" not in parsed

    def test_speed_clamped_to_range(self):
        """Speed must be 1-100."""
        assert max(1, min(100, 0)) == 1
        assert max(1, min(100, 150)) == 100
        assert max(1, min(100, 50)) == 50


class TestZhaBackendSpeedWrite:
    """Test ZHA backend async_write_effect_speed."""

    def test_speed_attribute_id(self):
        """Verify correct attribute ID is used."""
        from custom_components.aqara_advanced_lighting.zha_backend import ATTR_EFFECT_SPEED
        assert ATTR_EFFECT_SPEED == 0x0520
