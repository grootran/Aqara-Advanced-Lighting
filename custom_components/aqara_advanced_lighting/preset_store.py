"""User presets storage for Aqara Advanced Lighting."""

from __future__ import annotations

from datetime import datetime, timezone
import logging
import uuid
from typing import Any, NotRequired, TypedDict

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import (
    DOMAIN,
    PRESET_TYPE_CCT_SEQUENCE,
    PRESET_TYPE_EFFECT,
    PRESET_TYPE_SEGMENT_PATTERN,
    PRESET_TYPE_SEGMENT_SEQUENCE,
    VALID_PRESET_TYPES,
)
from .models import RGBColor, XYColor

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = f"{DOMAIN}.presets"
STORAGE_VERSION = 1
MIGRATION_FLAG_KEY = "_migrated_to_xy_v1"


def _migrate_rgb_colors_to_xy(colors: list[dict[str, Any]]) -> list[dict[str, float]]:
    """Migrate RGB color format to XY format.

    Args:
        colors: List of color dicts in RGB format {"r": int, "g": int, "b": int}

    Returns:
        List of color dicts in XY format {"x": float, "y": float}
    """
    xy_colors = []

    for color in colors:
        # Check if already in XY format
        if "x" in color and "y" in color:
            xy_colors.append(color)
            continue

        # Convert from RGB to XY
        if "r" in color and "g" in color and "b" in color:
            try:
                rgb = RGBColor(r=color["r"], g=color["g"], b=color["b"])
                xy = XYColor.from_rgb(rgb)
                xy_colors.append(xy.to_dict())
            except (ValueError, KeyError) as ex:
                _LOGGER.warning("Failed to migrate color %s: %s", color, ex)
                # Keep original if migration fails
                xy_colors.append(color)
        else:
            # Unknown format, keep as-is
            xy_colors.append(color)

    return xy_colors


def _migrate_effect_preset(preset: dict[str, Any]) -> dict[str, Any]:
    """Migrate effect preset colors from RGB to XY.

    Args:
        preset: Effect preset dictionary

    Returns:
        Migrated preset with XY colors
    """
    # Check if already migrated
    if preset.get(MIGRATION_FLAG_KEY):
        return preset

    # Migrate effect_colors if present
    if "effect_colors" in preset and preset["effect_colors"]:
        preset["effect_colors"] = _migrate_rgb_colors_to_xy(preset["effect_colors"])
        preset[MIGRATION_FLAG_KEY] = True
        _LOGGER.debug("Migrated effect preset '%s' to XY color space", preset.get("name", "unknown"))

    return preset


def _migrate_segment_sequence_preset(preset: dict[str, Any]) -> dict[str, Any]:
    """Migrate segment sequence preset colors from RGB to XY.

    Args:
        preset: Segment sequence preset dictionary

    Returns:
        Migrated preset with XY colors
    """
    # Check if already migrated
    if preset.get(MIGRATION_FLAG_KEY):
        return preset

    # Migrate colors in each step
    if "steps" in preset and preset["steps"]:
        for step in preset["steps"]:
            if "colors" in step and step["colors"]:
                # Convert [[r,g,b], ...] format to [{"x":x, "y":y}, ...] format
                if isinstance(step["colors"][0], list):
                    # Old format: [[r, g, b], [r, g, b]]
                    rgb_dicts = [{"r": c[0], "g": c[1], "b": c[2]} for c in step["colors"]]
                    step["colors"] = _migrate_rgb_colors_to_xy(rgb_dicts)
                elif isinstance(step["colors"][0], dict):
                    # Already dict format, migrate if needed
                    step["colors"] = _migrate_rgb_colors_to_xy(step["colors"])

        preset[MIGRATION_FLAG_KEY] = True
        _LOGGER.debug(
            "Migrated segment sequence preset '%s' to XY color space",
            preset.get("name", "unknown"),
        )

    return preset


class UserEffectPreset(TypedDict):
    """User-defined effect preset."""

    id: str
    name: str
    icon: str | None
    device_type: str | None
    effect: str
    effect_speed: int
    effect_brightness: int | None
    effect_colors: list[dict[str, int]]
    effect_segments: str | None
    created_at: str
    modified_at: str


class UserSegmentPatternPreset(TypedDict):
    """User-defined segment pattern preset."""

    id: str
    name: str
    icon: str | None
    device_type: str | None
    segments: list[dict[str, Any]]
    created_at: str
    modified_at: str


class UserCCTSequencePreset(TypedDict):
    """User-defined CCT sequence preset."""

    id: str
    name: str
    icon: str | None
    steps: list[dict[str, Any]]
    loop_mode: str
    loop_count: int | None
    end_behavior: str
    created_at: str
    modified_at: str


class UserSegmentSequencePreset(TypedDict):
    """User-defined segment sequence preset."""

    id: str
    name: str
    icon: str | None
    device_type: str | None
    steps: list[dict[str, Any]]
    loop_mode: str
    loop_count: int | None
    end_behavior: str
    clear_segments: NotRequired[bool]
    created_at: str
    modified_at: str


class PresetsData(TypedDict):
    """Storage data structure for all user presets."""

    effect_presets: list[UserEffectPreset]
    segment_pattern_presets: list[UserSegmentPatternPreset]
    cct_sequence_presets: list[UserCCTSequencePreset]
    segment_sequence_presets: list[UserSegmentSequencePreset]


class PresetStore:
    """Manages global user presets storage."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the preset store."""
        self.hass = hass
        self._store: Store[PresetsData] = Store(
            hass, STORAGE_VERSION, STORAGE_KEY
        )
        self._data: PresetsData = {
            "effect_presets": [],
            "segment_pattern_presets": [],
            "cct_sequence_presets": [],
            "segment_sequence_presets": [],
        }

    async def async_load(self) -> None:
        """Load presets from storage."""
        data = await self._store.async_load()
        if data is not None:
            # Ensure all keys exist with defaults
            self._data = {
                "effect_presets": data.get("effect_presets", []),
                "segment_pattern_presets": data.get("segment_pattern_presets", []),
                "cct_sequence_presets": data.get("cct_sequence_presets", []),
                "segment_sequence_presets": data.get("segment_sequence_presets", []),
            }

            # Migrate RGB colors to XY format
            needs_save = False

            # Migrate effect presets
            if self._data["effect_presets"]:
                for i, preset in enumerate(self._data["effect_presets"]):
                    migrated = _migrate_effect_preset(preset)
                    if migrated.get(MIGRATION_FLAG_KEY):
                        self._data["effect_presets"][i] = migrated
                        needs_save = True

            # Migrate segment sequence presets
            if self._data["segment_sequence_presets"]:
                for i, preset in enumerate(self._data["segment_sequence_presets"]):
                    migrated = _migrate_segment_sequence_preset(preset)
                    if migrated.get(MIGRATION_FLAG_KEY):
                        self._data["segment_sequence_presets"][i] = migrated
                        needs_save = True

            # Save migrated presets
            if needs_save:
                _LOGGER.info("Migrated user presets from RGB to XY color space")
                await self.async_save()

        _LOGGER.debug(
            "Loaded user presets: %d effects, %d patterns, %d CCT sequences, %d segment sequences",
            len(self._data["effect_presets"]),
            len(self._data["segment_pattern_presets"]),
            len(self._data["cct_sequence_presets"]),
            len(self._data["segment_sequence_presets"]),
        )

    async def async_save(self) -> None:
        """Save presets to storage."""
        await self._store.async_save(self._data)
        _LOGGER.debug("Saved user presets")

    def _get_storage_key(self, preset_type: str) -> str:
        """Get the storage key for a preset type."""
        return f"{preset_type}_presets"

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        return datetime.now(timezone.utc).isoformat()

    def get_all_presets(self, preset_type: str | None = None) -> dict[str, list[Any]]:
        """Get all presets, optionally filtered by type.

        Args:
            preset_type: Optional preset type to filter by

        Returns:
            Dictionary with preset lists by type
        """
        if preset_type is not None and preset_type in VALID_PRESET_TYPES:
            key = self._get_storage_key(preset_type)
            return {key: self._data.get(key, [])}
        return dict(self._data)

    def get_preset(self, preset_type: str, preset_id: str) -> dict[str, Any] | None:
        """Get a single preset by type and ID.

        Args:
            preset_type: The type of preset
            preset_id: The preset ID

        Returns:
            The preset if found, None otherwise
        """
        if preset_type not in VALID_PRESET_TYPES:
            return None

        key = self._get_storage_key(preset_type)
        presets = self._data.get(key, [])
        for preset in presets:
            if preset["id"] == preset_id:
                return preset
        return None

    def get_preset_by_name(
        self, preset_type: str, name: str
    ) -> dict[str, Any] | None:
        """Get a preset by type and name.

        Args:
            preset_type: The type of preset
            name: The preset name

        Returns:
            The preset if found, None otherwise
        """
        if preset_type not in VALID_PRESET_TYPES:
            return None

        key = self._get_storage_key(preset_type)
        presets = self._data.get(key, [])
        for preset in presets:
            if preset["name"].lower() == name.lower():
                return preset
        return None

    async def add_preset(
        self, preset_type: str, preset_data: dict[str, Any]
    ) -> dict[str, Any] | None:
        """Add a new preset.

        Args:
            preset_type: The type of preset
            preset_data: The preset data (without id, created_at, modified_at)

        Returns:
            The created preset with generated fields, or None if invalid type
        """
        if preset_type not in VALID_PRESET_TYPES:
            return None

        key = self._get_storage_key(preset_type)
        timestamp = self._get_timestamp()

        preset = {
            "id": str(uuid.uuid4()),
            **preset_data,
            "created_at": timestamp,
            "modified_at": timestamp,
        }

        self._data[key].append(preset)
        await self.async_save()

        _LOGGER.debug(
            "Added %s preset '%s' with ID %s",
            preset_type,
            preset.get("name"),
            preset["id"],
        )
        return preset

    async def update_preset(
        self, preset_type: str, preset_id: str, preset_data: dict[str, Any]
    ) -> dict[str, Any] | None:
        """Update an existing preset.

        Args:
            preset_type: The type of preset
            preset_id: The preset ID to update
            preset_data: The updated preset data

        Returns:
            The updated preset, or None if not found
        """
        if preset_type not in VALID_PRESET_TYPES:
            return None

        key = self._get_storage_key(preset_type)
        presets = self._data.get(key, [])

        for i, preset in enumerate(presets):
            if preset["id"] == preset_id:
                # Preserve id and created_at, update modified_at
                updated_preset = {
                    **preset,
                    **preset_data,
                    "id": preset_id,
                    "created_at": preset["created_at"],
                    "modified_at": self._get_timestamp(),
                }
                self._data[key][i] = updated_preset
                await self.async_save()

                _LOGGER.debug(
                    "Updated %s preset '%s' (ID: %s)",
                    preset_type,
                    updated_preset.get("name"),
                    preset_id,
                )
                return updated_preset

        return None

    async def delete_preset(self, preset_type: str, preset_id: str) -> bool:
        """Delete a preset.

        Args:
            preset_type: The type of preset
            preset_id: The preset ID to delete

        Returns:
            True if deleted, False if not found
        """
        if preset_type not in VALID_PRESET_TYPES:
            return False

        key = self._get_storage_key(preset_type)
        original_length = len(self._data[key])

        self._data[key] = [p for p in self._data[key] if p["id"] != preset_id]

        if len(self._data[key]) < original_length:
            await self.async_save()
            _LOGGER.debug("Deleted %s preset with ID %s", preset_type, preset_id)
            return True

        return False

    async def duplicate_preset(
        self, preset_type: str, preset_id: str, new_name: str | None = None
    ) -> dict[str, Any] | None:
        """Duplicate a preset with a new ID.

        Args:
            preset_type: The type of preset
            preset_id: The preset ID to duplicate
            new_name: Optional new name for the duplicate

        Returns:
            The new preset, or None if source not found
        """
        source_preset = self.get_preset(preset_type, preset_id)
        if source_preset is None:
            return None

        # Create a copy without id, created_at, modified_at
        preset_data = {
            k: v
            for k, v in source_preset.items()
            if k not in ("id", "created_at", "modified_at")
        }

        # Set new name
        if new_name:
            preset_data["name"] = new_name
        else:
            preset_data["name"] = f"{source_preset['name']} (copy)"

        return await self.add_preset(preset_type, preset_data)
