"""User presets storage for Aqara Advanced Lighting."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from datetime import datetime, timezone
import logging
import uuid
from typing import Any, NotRequired, TypedDict

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.storage import Store

from pathlib import Path

from .const import (
    DOMAIN,
    PRESET_TYPE_CCT_SEQUENCE,
    PRESET_TYPE_DYNAMIC_SCENE,
    PRESET_TYPE_EFFECT,
    PRESET_TYPE_SEGMENT_PATTERN,
    PRESET_TYPE_SEGMENT_SEQUENCE,
    THUMBNAIL_STORAGE_DIR,
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


class UserDynamicScenePreset(TypedDict):
    """User-defined dynamic scene preset."""

    id: str
    name: str
    icon: str | None
    colors: list[dict[str, float | int]]  # List of {x, y, brightness_pct}
    transition_time: float
    hold_time: float
    distribution_mode: str
    offset_delay: float
    random_order: bool
    loop_mode: str
    loop_count: int | None
    end_behavior: str
    created_at: str
    modified_at: str


class PresetsData(TypedDict):
    """Storage data structure for all user presets."""

    effect_presets: list[UserEffectPreset]
    segment_pattern_presets: list[UserSegmentPatternPreset]
    cct_sequence_presets: list[UserCCTSequencePreset]
    segment_sequence_presets: list[UserSegmentSequencePreset]
    dynamic_scene_presets: list[UserDynamicScenePreset]


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
            "dynamic_scene_presets": [],
        }
        self._update_callbacks: list[Callable[[], Awaitable[None]]] = []
        self._suppress_callbacks: bool = False

    def register_update_callback(
        self, callback: Callable[[], Awaitable[None]]
    ) -> Callable[[], None]:
        """Register a callback to be notified when presets change.

        Args:
            callback: Async function to call when presets are modified

        Returns:
            Function to call to unregister the callback
        """
        self._update_callbacks.append(callback)

        def unregister() -> None:
            if callback in self._update_callbacks:
                self._update_callbacks.remove(callback)

        return unregister

    async def _notify_update_callbacks(self) -> None:
        """Notify all registered callbacks that presets have changed."""
        if self._suppress_callbacks:
            return
        for callback in self._update_callbacks:
            try:
                await callback()
            except Exception:
                _LOGGER.exception("Error in preset update callback")

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
                "dynamic_scene_presets": data.get("dynamic_scene_presets", []),
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
            "Loaded user presets: %d effects, %d patterns, %d CCT sequences, %d segment sequences, %d dynamic scenes",
            len(self._data["effect_presets"]),
            len(self._data["segment_pattern_presets"]),
            len(self._data["cct_sequence_presets"]),
            len(self._data["segment_sequence_presets"]),
            len(self._data["dynamic_scene_presets"]),
        )

        # Clean up orphaned thumbnails from previous sessions
        await self._async_cleanup_orphaned_thumbnails()

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

        # Persist pending thumbnail to disk if present
        if preset.get("thumbnail"):
            await self._async_persist_pending_thumbnail(preset["thumbnail"])

        self._data[key].append(preset)
        await self.async_save()
        await self._notify_update_callbacks()

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
                old_thumb = preset.get("thumbnail")
                new_thumb = preset_data.get("thumbnail")

                # Persist pending thumbnail to disk if a new one is provided
                if new_thumb and new_thumb != old_thumb:
                    await self._async_persist_pending_thumbnail(new_thumb)

                # Clean up old thumbnail from disk if replaced
                if old_thumb and new_thumb and old_thumb != new_thumb:
                    await self._async_delete_thumbnail(old_thumb)

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
                await self._notify_update_callbacks()

                _LOGGER.debug(
                    "Updated %s preset '%s' (ID: %s)",
                    preset_type,
                    updated_preset.get("name"),
                    preset_id,
                )
                return updated_preset

        return None

    async def delete_preset(self, preset_type: str, preset_id: str) -> bool:
        """Delete a preset and its associated thumbnail if present.

        Args:
            preset_type: The type of preset
            preset_id: The preset ID to delete

        Returns:
            True if deleted, False if not found
        """
        if preset_type not in VALID_PRESET_TYPES:
            return False

        key = self._get_storage_key(preset_type)

        # Find the preset before removing so we can clean up its thumbnail
        thumbnail_id: str | None = None
        for preset in self._data[key]:
            if preset["id"] == preset_id:
                thumbnail_id = preset.get("thumbnail")
                break

        original_length = len(self._data[key])
        self._data[key] = [p for p in self._data[key] if p["id"] != preset_id]

        if len(self._data[key]) < original_length:
            await self.async_save()
            await self._notify_update_callbacks()
            _LOGGER.debug("Deleted %s preset with ID %s", preset_type, preset_id)

            # Clean up thumbnail file if present
            if thumbnail_id:
                await self._async_delete_thumbnail(thumbnail_id)

            return True

        return False

    async def _async_delete_thumbnail(self, thumbnail_id: str) -> None:
        """Delete a thumbnail file from storage (best-effort)."""
        thumb_path = Path(
            self.hass.config.path(
                f".storage/{THUMBNAIL_STORAGE_DIR}/{thumbnail_id}.jpg"
            )
        )

        def delete_file() -> None:
            try:
                if thumb_path.exists():
                    thumb_path.unlink()
                    _LOGGER.debug("Deleted thumbnail %s", thumbnail_id)
            except OSError as ex:
                _LOGGER.warning(
                    "Failed to delete thumbnail %s: %s", thumbnail_id, ex
                )

        await self.hass.async_add_executor_job(delete_file)

    async def _async_persist_pending_thumbnail(self, thumbnail_id: str) -> None:
        """Move a pending thumbnail from memory to disk storage.

        Called when a preset with a thumbnail is saved. The thumbnail bytes
        are held in memory until this point to avoid orphaned files.
        """
        pending: dict[str, bytes] = (
            self.hass.data.get(DOMAIN, {}).get("pending_thumbnails", {})
        )
        thumb_bytes = pending.pop(thumbnail_id, None)
        if thumb_bytes is None:
            _LOGGER.debug(
                "Pending thumbnail %s not found in memory (may already be saved)",
                thumbnail_id,
            )
            return

        thumb_dir = Path(
            self.hass.config.path(f".storage/{THUMBNAIL_STORAGE_DIR}")
        )
        thumb_path = thumb_dir / f"{thumbnail_id}.jpg"

        def write_file() -> None:
            thumb_dir.mkdir(parents=True, exist_ok=True)
            thumb_path.write_bytes(thumb_bytes)

        await self.hass.async_add_executor_job(write_file)
        _LOGGER.debug("Persisted thumbnail %s to disk", thumbnail_id)

    async def _async_cleanup_orphaned_thumbnails(self) -> None:
        """Remove thumbnail files not referenced by any preset.

        Runs at startup to clean up thumbnails orphaned by browser tab
        closures, HA restarts during extraction, or other edge cases.
        """
        thumb_dir = Path(
            self.hass.config.path(f".storage/{THUMBNAIL_STORAGE_DIR}")
        )

        def find_orphans() -> list[Path]:
            if not thumb_dir.is_dir():
                return []

            # Collect all thumbnail IDs referenced by dynamic scene presets
            referenced: set[str] = set()
            for preset in self._data.get("dynamic_scene_presets", []):
                thumb_id = preset.get("thumbnail")
                if thumb_id:
                    referenced.add(thumb_id)

            # Find files on disk that are not referenced
            orphans: list[Path] = []
            for path in thumb_dir.iterdir():
                if path.suffix == ".jpg" and path.stem not in referenced:
                    orphans.append(path)
            return orphans

        def delete_orphans(orphans: list[Path]) -> int:
            count = 0
            for path in orphans:
                try:
                    path.unlink()
                    count += 1
                except OSError:
                    pass
            return count

        try:
            orphans = await self.hass.async_add_executor_job(find_orphans)
            if orphans:
                deleted = await self.hass.async_add_executor_job(
                    delete_orphans, orphans
                )
                _LOGGER.info(
                    "Cleaned up %d orphaned thumbnail(s)", deleted
                )
        except Exception:
            _LOGGER.debug("Thumbnail cleanup skipped", exc_info=True)

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

        # Create a copy without id, created_at, modified_at, or thumbnail
        # (thumbnail files are not duplicated, user can re-extract if needed)
        preset_data = {
            k: v
            for k, v in source_preset.items()
            if k not in ("id", "created_at", "modified_at", "thumbnail")
        }

        # Set new name
        if new_name:
            preset_data["name"] = new_name
        else:
            preset_data["name"] = f"{source_preset['name']} (copy)"

        return await self.add_preset(preset_type, preset_data)

    async def export_all_user_presets(self) -> dict[str, Any]:
        """Export all user-created presets to a dictionary.

        Excludes built-in presets, includes only user-created presets.

        Returns:
            Dictionary with version, timestamp, counts, and preset data
        """
        # Get all presets (only user-created presets are in storage)
        all_presets = self.get_all_presets()

        # Calculate counts
        preset_counts = {
            "effect_presets": len(all_presets.get("effect_presets", [])),
            "segment_pattern_presets": len(
                all_presets.get("segment_pattern_presets", [])
            ),
            "cct_sequence_presets": len(all_presets.get("cct_sequence_presets", [])),
            "segment_sequence_presets": len(
                all_presets.get("segment_sequence_presets", [])
            ),
            "dynamic_scene_presets": len(all_presets.get("dynamic_scene_presets", [])),
        }

        # Build export structure
        export_data = {
            "version": 1,
            "timestamp": self._get_timestamp(),
            "preset_counts": preset_counts,
            "data": all_presets,
        }

        _LOGGER.debug(
            "Exported %d presets (%d effects, %d patterns, %d CCT sequences, %d segment sequences, %d dynamic scenes)",
            sum(preset_counts.values()),
            preset_counts["effect_presets"],
            preset_counts["segment_pattern_presets"],
            preset_counts["cct_sequence_presets"],
            preset_counts["segment_sequence_presets"],
            preset_counts["dynamic_scene_presets"],
        )

        return export_data

    def _generate_unique_name(self, base_name: str, existing_names: set[str]) -> str:
        """Generate a unique preset name by appending (2), (3), etc.

        Args:
            base_name: The original preset name
            existing_names: Set of names already in use

        Returns:
            Unique name not in existing_names set
        """
        if base_name not in existing_names:
            return base_name

        counter = 2
        while True:
            new_name = f"{base_name} ({counter})"
            if new_name not in existing_names:
                return new_name
            counter += 1

    def _validate_preset_structure(
        self, preset_data: dict[str, Any], preset_type: str
    ) -> None:
        """Validate preset structure matches expected TypedDict format.

        Args:
            preset_data: The preset dictionary to validate
            preset_type: One of: effect, segment_pattern, cct_sequence, segment_sequence

        Raises:
            ServiceValidationError: If validation fails
        """
        # Required fields for each preset type
        required_fields = {
            PRESET_TYPE_EFFECT: {"name", "effect", "effect_speed", "effect_colors"},
            PRESET_TYPE_SEGMENT_PATTERN: {"name", "segments"},
            PRESET_TYPE_CCT_SEQUENCE: {
                "name",
                "steps",
                "loop_mode",
                "end_behavior",
            },
            PRESET_TYPE_SEGMENT_SEQUENCE: {
                "name",
                "steps",
                "loop_mode",
                "end_behavior",
            },
            PRESET_TYPE_DYNAMIC_SCENE: {
                "name",
                "colors",
                "transition_time",
                "hold_time",
                "distribution_mode",
                "loop_mode",
                "end_behavior",
            },
        }

        if preset_type not in required_fields:
            raise ServiceValidationError(
                f"Invalid preset type: {preset_type}",
                translation_domain=DOMAIN,
                translation_key="invalid_preset_type",
            )

        # Check required fields
        missing_fields = required_fields[preset_type] - preset_data.keys()
        if missing_fields:
            raise ServiceValidationError(
                f"Missing required fields for {preset_type}: {missing_fields}",
                translation_domain=DOMAIN,
                translation_key="missing_preset_fields",
                translation_placeholders={"fields": ", ".join(missing_fields)},
            )

        # Validate color format for effect presets
        if preset_type == PRESET_TYPE_EFFECT:
            if not isinstance(preset_data.get("effect_colors"), list):
                raise ServiceValidationError(
                    "Colors must be a list",
                    translation_domain=DOMAIN,
                    translation_key="invalid_color_format",
                )
            for color in preset_data["effect_colors"]:
                if not isinstance(color, dict) or "x" not in color or "y" not in color:
                    raise ServiceValidationError(
                        "Each color must be in XY format with x and y keys",
                        translation_domain=DOMAIN,
                        translation_key="invalid_color_format",
                    )

        # Validate segment sequence colors
        if preset_type == PRESET_TYPE_SEGMENT_SEQUENCE:
            if not isinstance(preset_data.get("steps"), list):
                raise ServiceValidationError(
                    "Steps must be a list",
                    translation_domain=DOMAIN,
                    translation_key="invalid_preset_structure",
                )
            for step in preset_data["steps"]:
                if "colors" in step:
                    if not isinstance(step["colors"], list):
                        raise ServiceValidationError(
                            "Step colors must be a list",
                            translation_domain=DOMAIN,
                            translation_key="invalid_color_format",
                        )
                    for color in step["colors"]:
                        if (
                            not isinstance(color, dict)
                            or "x" not in color
                            or "y" not in color
                        ):
                            raise ServiceValidationError(
                                "Each color must be in XY format with x and y keys",
                                translation_domain=DOMAIN,
                                translation_key="invalid_color_format",
                            )

        # Validate dynamic scene colors
        if preset_type == PRESET_TYPE_DYNAMIC_SCENE:
            if not isinstance(preset_data.get("colors"), list):
                raise ServiceValidationError(
                    "Colors must be a list",
                    translation_domain=DOMAIN,
                    translation_key="invalid_color_format",
                )
            if not (1 <= len(preset_data["colors"]) <= 8):
                raise ServiceValidationError(
                    "Dynamic scene must have 1-8 colors",
                    translation_domain=DOMAIN,
                    translation_key="invalid_color_count",
                )
            for color in preset_data["colors"]:
                if not isinstance(color, dict) or "x" not in color or "y" not in color:
                    raise ServiceValidationError(
                        "Each color must have x and y coordinates",
                        translation_domain=DOMAIN,
                        translation_key="invalid_color_format",
                    )

    async def import_presets(self, import_data: dict[str, Any]) -> dict[str, int]:
        """Import presets from backup data with conflict resolution.

        Args:
            import_data: Dictionary matching export format

        Returns:
            Dictionary with counts of imported presets per type

        Raises:
            ServiceValidationError: If data structure is invalid
            HomeAssistantError: If storage operations fail
        """
        # Validate top-level structure
        required_top_keys = {"version", "data"}
        if not all(key in import_data for key in required_top_keys):
            raise ServiceValidationError(
                "Invalid backup file structure",
                translation_domain=DOMAIN,
                translation_key="invalid_backup_structure",
            )

        if import_data["version"] != 1:
            raise ServiceValidationError(
                f"Unsupported backup version: {import_data['version']}",
                translation_domain=DOMAIN,
                translation_key="unsupported_backup_version",
                translation_placeholders={"version": str(import_data["version"])},
            )

        data = import_data["data"]

        # Suppress per-preset callbacks during bulk import
        self._suppress_callbacks = True

        # Get current presets to check for name conflicts
        current_presets = self.get_all_presets()

        # Track import counts
        imported_counts = {
            "effect_presets": 0,
            "segment_pattern_presets": 0,
            "cct_sequence_presets": 0,
            "segment_sequence_presets": 0,
            "dynamic_scene_presets": 0,
        }

        try:
            # Import effect presets
            if "effect_presets" in data:
                existing_names = {p["name"] for p in current_presets["effect_presets"]}
                for preset in data["effect_presets"]:
                    self._validate_preset_structure(preset, PRESET_TYPE_EFFECT)

                    # Generate unique name if conflict
                    original_name = preset["name"]
                    unique_name = self._generate_unique_name(
                        original_name, existing_names
                    )

                    # Create new preset with unique ID and name
                    new_preset_data = {
                        "name": unique_name,
                        "icon": preset.get("icon"),
                        "device_type": preset.get("device_type"),
                        "effect": preset["effect"],
                        "effect_speed": preset["effect_speed"],
                        "effect_brightness": preset.get("effect_brightness"),
                        "effect_colors": preset["effect_colors"],
                        "effect_segments": preset.get("effect_segments"),
                    }

                    await self.add_preset(PRESET_TYPE_EFFECT, new_preset_data)
                    existing_names.add(unique_name)
                    imported_counts["effect_presets"] += 1

            # Import segment pattern presets
            if "segment_pattern_presets" in data:
                existing_names = {
                    p["name"] for p in current_presets["segment_pattern_presets"]
                }
                for preset in data["segment_pattern_presets"]:
                    self._validate_preset_structure(
                        preset, PRESET_TYPE_SEGMENT_PATTERN
                    )

                    original_name = preset["name"]
                    unique_name = self._generate_unique_name(
                        original_name, existing_names
                    )

                    new_preset_data = {
                        "name": unique_name,
                        "icon": preset.get("icon"),
                        "device_type": preset.get("device_type"),
                        "segments": preset["segments"],
                    }

                    await self.add_preset(
                        PRESET_TYPE_SEGMENT_PATTERN, new_preset_data
                    )
                    existing_names.add(unique_name)
                    imported_counts["segment_pattern_presets"] += 1

            # Import CCT sequence presets
            if "cct_sequence_presets" in data:
                existing_names = {
                    p["name"] for p in current_presets["cct_sequence_presets"]
                }
                for preset in data["cct_sequence_presets"]:
                    self._validate_preset_structure(
                        preset, PRESET_TYPE_CCT_SEQUENCE
                    )

                    original_name = preset["name"]
                    unique_name = self._generate_unique_name(
                        original_name, existing_names
                    )

                    new_preset_data = {
                        "name": unique_name,
                        "icon": preset.get("icon"),
                        "steps": preset["steps"],
                        "loop_mode": preset["loop_mode"],
                        "loop_count": preset.get("loop_count"),
                        "end_behavior": preset["end_behavior"],
                    }

                    await self.add_preset(
                        PRESET_TYPE_CCT_SEQUENCE, new_preset_data
                    )
                    existing_names.add(unique_name)
                    imported_counts["cct_sequence_presets"] += 1

            # Import segment sequence presets
            if "segment_sequence_presets" in data:
                existing_names = {
                    p["name"]
                    for p in current_presets["segment_sequence_presets"]
                }
                for preset in data["segment_sequence_presets"]:
                    self._validate_preset_structure(
                        preset, PRESET_TYPE_SEGMENT_SEQUENCE
                    )

                    original_name = preset["name"]
                    unique_name = self._generate_unique_name(
                        original_name, existing_names
                    )

                    new_preset_data = {
                        "name": unique_name,
                        "icon": preset.get("icon"),
                        "device_type": preset.get("device_type"),
                        "steps": preset["steps"],
                        "loop_mode": preset["loop_mode"],
                        "loop_count": preset.get("loop_count"),
                        "end_behavior": preset["end_behavior"],
                    }

                    # Include clear_segments if present
                    if "clear_segments" in preset:
                        new_preset_data["clear_segments"] = (
                            preset["clear_segments"]
                        )

                    await self.add_preset(
                        PRESET_TYPE_SEGMENT_SEQUENCE, new_preset_data
                    )
                    existing_names.add(unique_name)
                    imported_counts["segment_sequence_presets"] += 1

            # Import dynamic scene presets
            if "dynamic_scene_presets" in data:
                existing_names = {
                    p["name"]
                    for p in current_presets.get("dynamic_scene_presets", [])
                }
                for preset in data["dynamic_scene_presets"]:
                    self._validate_preset_structure(
                        preset, PRESET_TYPE_DYNAMIC_SCENE
                    )

                    original_name = preset["name"]
                    unique_name = self._generate_unique_name(
                        original_name, existing_names
                    )

                    new_preset_data = {
                        "name": unique_name,
                        "icon": preset.get("icon"),
                        "colors": preset["colors"],
                        "transition_time": preset["transition_time"],
                        "hold_time": preset["hold_time"],
                        "distribution_mode": preset["distribution_mode"],
                        "offset_delay": preset.get("offset_delay", 0.0),
                        "random_order": preset.get("random_order", False),
                        "loop_mode": preset["loop_mode"],
                        "loop_count": preset.get("loop_count"),
                        "end_behavior": preset["end_behavior"],
                    }

                    await self.add_preset(
                        PRESET_TYPE_DYNAMIC_SCENE, new_preset_data
                    )
                    existing_names.add(unique_name)
                    imported_counts["dynamic_scene_presets"] += 1
        finally:
            # Always re-enable callbacks even if import fails partway
            self._suppress_callbacks = False

        # Notify once for the entire import batch
        if sum(imported_counts.values()) > 0:
            await self._notify_update_callbacks()

        _LOGGER.info(
            "Imported %d presets (%d effects, %d patterns, %d CCT sequences, %d segment sequences, %d dynamic scenes)",
            sum(imported_counts.values()),
            imported_counts["effect_presets"],
            imported_counts["segment_pattern_presets"],
            imported_counts["cct_sequence_presets"],
            imported_counts["segment_sequence_presets"],
            imported_counts["dynamic_scene_presets"],
        )

        return imported_counts
