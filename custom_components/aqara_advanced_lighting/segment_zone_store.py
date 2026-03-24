"""Per-device segment zone storage for Aqara Advanced Lighting."""

import logging
import re

from homeassistant.core import HomeAssistant

from .base_store import BaseStore
from .const import DOMAIN

_SEGMENT_RANGE_PATTERN = re.compile(r"^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$")

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = f"{DOMAIN}.segment_zones"
STORAGE_VERSION = 1

# Keywords reserved by parse_segment_range() that cannot be used as zone names
RESERVED_ZONE_NAMES: frozenset[str] = frozenset({
    "odd",
    "even",
    "all",
    "first-half",
    "second-half",
})

# Zone name constraints
MAX_ZONE_NAME_LENGTH = 50
MIN_ZONE_NAME_LENGTH = 1
MAX_ZONES_PER_DEVICE = 20

def validate_zone_name(name: str) -> str | None:
    """Validate a zone name.

    Returns an error message if invalid, or None if valid.
    """
    if not isinstance(name, str):
        return "Zone name must be a string"

    name = name.strip()

    if len(name) < MIN_ZONE_NAME_LENGTH:
        return "Zone name cannot be empty"

    if len(name) > MAX_ZONE_NAME_LENGTH:
        return f"Zone name must be at most {MAX_ZONE_NAME_LENGTH} characters"

    if name.lower() in RESERVED_ZONE_NAMES:
        return (
            f"Zone name `{name}` is reserved. "
            f"Reserved names: {', '.join(sorted(RESERVED_ZONE_NAMES))}"
        )

    # Check that the name isn't purely numeric (would conflict with segment numbers)
    if re.match(r"^\d+$", name):
        return "Zone name cannot be a number"

    # Check that the name isn't a numeric range (would conflict with range syntax)
    if re.match(r"^\d+-\d+$", name):
        return "Zone name cannot be a numeric range"

    return None

def validate_segment_range(segment_range: str) -> str | None:
    """Validate a segment range string format.

    Returns an error message if invalid, or None if valid.
    """
    if not isinstance(segment_range, str):
        return "Segment range must be a string"

    segment_range = segment_range.strip()

    if not segment_range:
        return "Segment range cannot be empty"

    # Allow valid segment range syntax: numbers, ranges, commas, keywords
    # We don't fully parse here (parse_segment_range does that), just basic format check
    keywords = {"odd", "even", "all", "first-half", "second-half"}

    if segment_range.lower() in keywords:
        return None

    if not _SEGMENT_RANGE_PATTERN.match(segment_range):
        return (
            f"Invalid segment range format: `{segment_range}`. "
            "Use numbers (5), ranges (1-10), or comma-separated (1-5,10,15-20)"
        )

    return None

class SegmentZoneStore(BaseStore[dict[str, dict[str, str]]]):
    """Manages per-device segment zone definitions.

    Zones are keyed by device IEEE address, with each device having
    a dict of zone name to segment range string.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the segment zone store."""
        super().__init__(hass, STORAGE_VERSION, STORAGE_KEY, {})

    def get_zones(self, ieee_address: str) -> dict[str, str]:
        """Get all zones for a device.

        Args:
            ieee_address: The device IEEE address.

        Returns:
            Dict of zone name to segment range string.
        """
        return dict(self._data.get(ieee_address, {}))

    def get_zones_for_resolution(self, ieee_address: str) -> dict[str, str]:
        """Get zones in lowercase-keyed format for segment range resolution.

        Args:
            ieee_address: The device IEEE address.

        Returns:
            Dict of lowercased zone name to segment range string.
        """
        zones = self._data.get(ieee_address, {})
        return {name.lower(): segments for name, segments in zones.items()}

    async def set_zones(
        self, ieee_address: str, zones: dict[str, str]
    ) -> dict[str, str]:
        """Replace all zones for a device.

        Args:
            ieee_address: The device IEEE address.
            zones: Dict of zone name to segment range string.

        Returns:
            The saved zones.

        Raises:
            ValueError: If validation fails.
        """
        if len(zones) > MAX_ZONES_PER_DEVICE:
            msg = f"A device can have at most {MAX_ZONES_PER_DEVICE} zones"
            raise ValueError(msg)

        # Check for duplicate names (case-insensitive)
        seen_names: dict[str, str] = {}
        validated_zones: dict[str, str] = {}

        for name, segment_range in zones.items():
            # Validate zone name
            name_error = validate_zone_name(name)
            if name_error:
                raise ValueError(name_error)

            # Check for case-insensitive duplicates
            lower_name = name.strip().lower()
            if lower_name in seen_names:
                msg = (
                    f"Duplicate zone name: `{name}` conflicts with "
                    f"`{seen_names[lower_name]}`"
                )
                raise ValueError(msg)
            seen_names[lower_name] = name.strip()

            # Validate segment range format
            range_error = validate_segment_range(segment_range)
            if range_error:
                raise ValueError(range_error)

            validated_zones[name.strip()] = segment_range.strip()

        if validated_zones:
            self._data[ieee_address] = validated_zones
        elif ieee_address in self._data:
            # Empty zones dict means remove all zones for this device
            del self._data[ieee_address]

        await self.async_save()
        _LOGGER.debug(
            "Set %d zones for device %s", len(validated_zones), ieee_address
        )
        return validated_zones

    async def delete_zone(self, ieee_address: str, zone_name: str) -> bool:
        """Delete a single zone from a device.

        Uses case-insensitive matching consistent with zone resolution.

        Args:
            ieee_address: The device IEEE address.
            zone_name: The zone name to delete (case-insensitive).

        Returns:
            True if deleted, False if not found.
        """
        device_zones = self._data.get(ieee_address)
        if not device_zones:
            return False

        # Find zone with case-insensitive comparison
        zone_name_lower = zone_name.lower()
        actual_name = next(
            (name for name in device_zones if name.lower() == zone_name_lower),
            None,
        )
        if actual_name is None:
            return False

        del device_zones[actual_name]

        # Clean up empty device entries
        if not device_zones:
            del self._data[ieee_address]

        await self.async_save()
        _LOGGER.debug(
            "Deleted zone '%s' from device %s", actual_name, ieee_address
        )
        return True
