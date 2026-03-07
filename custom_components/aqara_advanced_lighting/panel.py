"""Panel registration and data endpoints for Aqara Advanced Lighting."""

from __future__ import annotations

import asyncio
from datetime import datetime
import ipaddress
import json
import logging
from pathlib import Path
import re
import socket
from typing import TYPE_CHECKING, Any
from urllib.parse import unquote, urlparse
import uuid

from aiohttp import web
import aiohttp

from homeassistant.components import frontend
from homeassistant.components.http import HomeAssistantView
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers.aiohttp_client import async_get_clientsession

if TYPE_CHECKING:
    from .favorites_store import FavoritesStore
    from .preset_store import PresetStore
    from .segment_zone_store import SegmentZoneStore
    from .user_preferences_store import UserPreferencesStore

from .preset_store import get_preset_store
from .user_preferences_store import _UNSET

from .const import (
    ATTR_BRIGHTNESS,
    ATTR_PRESET,
    ATTR_RESTORE_STATE,
    ATTR_SEGMENTS,
    DATA_CCT_SEQUENCE_MANAGER,
    DATA_DYNAMIC_SCENE_MANAGER,
    DATA_ACTIVE_MUSIC_SYNC,
    DATA_CIRCADIAN_MANAGER,
    DATA_ENTITY_CONTROLLER,
    DATA_FAVORITES_STORE,
    DATA_SEGMENT_SEQUENCE_MANAGER,
    DATA_SEGMENT_ZONE_STORE,
    DATA_STATE_MANAGER,
    DATA_USER_PREFERENCES_STORE,
    DEFAULT_EXTRACTED_COLORS,
    DOMAIN,
    MAX_COLOR_HISTORY_SIZE,
    MAX_IMAGE_SIZE_BYTES,
    THUMBNAIL_STORAGE_DIR,
    MODEL_T1M_20_SEGMENT,
    MODEL_T1M_26_SEGMENT,
    MODEL_T1_STRIP,
    MODEL_T2_BULB_E26,
    MODEL_T2_BULB_E27,
    MODEL_T2_BULB_GU10_110V,
    MODEL_T2_BULB_GU10_230V,
    MODEL_T2_CCT_E26,
    MODEL_T2_CCT_E27,
    MODEL_T2_CCT_GU10_110V,
    MODEL_T2_CCT_GU10_230V,
    SERVICE_SET_DYNAMIC_EFFECT,
    SERVICE_SET_SEGMENT_PATTERN,
    SERVICE_START_CCT_SEQUENCE,
    SERVICE_START_DYNAMIC_SCENE,
    SERVICE_START_SEGMENT_SEQUENCE,
    SERVICE_STOP_CCT_SEQUENCE,
    SERVICE_STOP_DYNAMIC_SCENE,
    SERVICE_STOP_EFFECT,
    SERVICE_STOP_SEGMENT_SEQUENCE,
    VALID_DISTRIBUTION_MODES,
    VALID_PRESET_TYPES,
    VALID_SORT_OPTIONS,
)
from .presets import (
    CCT_SEQUENCE_PRESETS,
    DYNAMIC_SCENE_PRESETS,
    EFFECT_PRESETS,
    SEGMENT_PATTERN_PRESETS,
    SEGMENT_SEQUENCE_PRESETS,
)

_LOGGER = logging.getLogger(__name__)

PANEL_URL = "/aqara-advanced-lighting"
PANEL_TITLE = "Aqara Lighting"
PANEL_ICON = "mdi:lightbulb-group"
PANEL_FRONTEND_URL_PATH = "aqara_panel.js"


async def async_register_panel(hass: HomeAssistant) -> None:
    """Register the Aqara Advanced Lighting panel."""
    # Register the panel in the frontend
    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path=PANEL_URL.lstrip("/"),
        config={
            "_panel_custom": {
                "name": "aqara-advanced-lighting-panel",
                "embed_iframe": False,
                "trust_external": False,
                "js_url": f"/api/{DOMAIN}/{PANEL_FRONTEND_URL_PATH}",
            }
        },
        require_admin=False,
    )

    # Register the frontend JavaScript file endpoint
    hass.http.register_view(PanelJavaScriptView)

    # Register the presets data endpoint
    hass.http.register_view(PresetsDataView)

    # Register the icon files endpoint
    hass.http.register_view(IconView)

    # Register favorites endpoints
    hass.http.register_view(FavoritesView)
    hass.http.register_view(FavoriteView)

    # Register user presets endpoints
    hass.http.register_view(UserPresetsView)
    hass.http.register_view(UserPresetView)
    hass.http.register_view(UserPresetDuplicateView)

    # Register preset backup/restore endpoints
    hass.http.register_view(ExportPresetsView)
    hass.http.register_view(ImportPresetsView)

    # Register user preferences endpoint
    hass.http.register_view(UserPreferencesView)
    hass.http.register_view(GlobalPreferencesView)

    # Register version endpoint
    hass.http.register_view(VersionView)

    # Register segment zone endpoints
    hass.http.register_view(SegmentZonesView)
    hass.http.register_view(SegmentZoneView)

    # Register supported entities endpoint
    hass.http.register_view(SupportedEntitiesView)

    # Register REST trigger endpoint for external systems
    hass.http.register_view(TriggerView)

    # Register running operations endpoint for panel status display
    hass.http.register_view(RunningOperationsView)

    # Register image color extraction and thumbnail endpoints
    hass.http.register_view(ColorExtractView)
    hass.http.register_view(ThumbnailView)

    _LOGGER.info("Aqara Advanced Lighting panel registered")


class PanelJavaScriptView(HomeAssistantView):
    """View to serve the panel JavaScript file."""

    url = f"/api/{DOMAIN}/{PANEL_FRONTEND_URL_PATH}"
    name = f"api:{DOMAIN}:panel_js"
    requires_auth = False

    async def get(self, request: web.Request) -> web.Response:
        """Serve the panel JavaScript file."""
        hass = request.app["hass"]
        file_path = Path(
            hass.config.path(
                f"custom_components/{DOMAIN}/frontend/{PANEL_FRONTEND_URL_PATH}"
            )
        )

        if not file_path.exists():
            _LOGGER.error("Panel JavaScript file not found: %s", file_path)
            return web.Response(status=404, text="Panel JavaScript file not found")

        # Use executor to avoid blocking I/O
        def read_file():
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()

        content = await hass.async_add_executor_job(read_file)

        return web.Response(
            text=content,
            content_type="application/javascript",
            headers={"Cache-Control": "no-cache"},
        )


class PresetsDataView(HomeAssistantView):
    """View to serve preset data as JSON."""

    url = f"/api/{DOMAIN}/presets"
    name = f"api:{DOMAIN}:presets"
    requires_auth = False

    async def get(self, request: web.Request) -> web.Response:
        """Serve presets data as JSON."""
        presets_data = _build_presets_data()
        return web.json_response(presets_data)


class IconView(HomeAssistantView):
    """View to serve preset icon files."""

    url = f"/api/{DOMAIN}/icons/{{filename}}"
    name = f"api:{DOMAIN}:icons"
    requires_auth = False

    async def get(self, request: web.Request, filename: str) -> web.Response:
        """Serve icon files (SVG, PNG, JPG, etc.)."""
        hass = request.app["hass"]

        # Security: prevent directory traversal
        if ".." in filename or "/" in filename or "\\" in filename:
            _LOGGER.warning("Invalid icon filename requested: %s", filename)
            return web.Response(status=400, text="Invalid filename")

        icons_dir = Path(hass.config.path(f"custom_components/{DOMAIN}/frontend/icons"))
        file_path = icons_dir / filename

        # Ensure the resolved path is within the icons directory
        try:
            file_path = file_path.resolve()
            icons_dir = icons_dir.resolve()
            if not str(file_path).startswith(str(icons_dir)):
                _LOGGER.warning("Path traversal attempt: %s", filename)
                return web.Response(status=403, text="Forbidden")
        except (OSError, RuntimeError) as ex:
            _LOGGER.error("Error resolving icon path: %s", ex)
            return web.Response(status=500, text="Server error")

        if not file_path.exists():
            _LOGGER.debug("Icon file not found: %s", file_path)
            return web.Response(status=404, text="Icon not found")

        # Determine content type from file extension
        extension = file_path.suffix.lower()
        content_type_map = {
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }
        content_type = content_type_map.get(extension, "application/octet-stream")

        # Use executor to avoid blocking I/O
        def read_file():
            with open(file_path, "rb") as f:
                return f.read()

        content = await hass.async_add_executor_job(read_file)

        return web.Response(
            body=content,
            content_type=content_type,
            headers={"Cache-Control": "public, max-age=86400"},
        )


def _build_presets_data() -> dict[str, Any]:
    """Build the presets data structure for the frontend.

    Returns:
        Dictionary containing organized preset data with metadata.
    """
    # Build dynamic effects organized by device type
    dynamic_effects = {
        "t2_bulb": [],
        "t1m": [],
        "t1_strip": [],
    }

    for preset_id, preset_data in EFFECT_PRESETS.items():
        device_types = preset_data.get("device_types", [])

        # Categorize by device type
        if any(
            model in device_types
            for model in [
                MODEL_T2_BULB_E26,
                MODEL_T2_BULB_E27,
                MODEL_T2_BULB_GU10_110V,
                MODEL_T2_BULB_GU10_230V,
            ]
        ):
            category = "t2_bulb"
        elif any(
            model in device_types
            for model in [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT]
        ):
            category = "t1m"
        elif MODEL_T1_STRIP in device_types:
            category = "t1_strip"
        else:
            continue

        dynamic_effects[category].append(
            {
                "id": preset_id,
                "name": preset_data["name"],
                "icon": preset_data.get("icon"),
                "effect": preset_data["effect"],
                "speed": preset_data["speed"],
                "brightness": preset_data.get("brightness"),
                "colors": preset_data["colors"],
                "device_types": device_types,
            }
        )

    # Build segment patterns
    segment_patterns = []
    for preset_id, preset_data in SEGMENT_PATTERN_PRESETS.items():
        segment_patterns.append(
            {
                "id": preset_id,
                "name": preset_data["name"],
                "icon": preset_data.get("icon"),
                "segments": preset_data["segments"],
                "device_types": preset_data.get("device_types", []),
            }
        )

    # Build CCT sequences
    cct_sequences = []
    for preset_id, preset_data in CCT_SEQUENCE_PRESETS.items():
        entry: dict[str, Any] = {
            "id": preset_id,
            "name": preset_data["name"],
            "icon": preset_data.get("icon"),
            "loop_mode": preset_data["loop_mode"],
            "loop_count": preset_data.get("loop_count"),
            "end_behavior": preset_data["end_behavior"],
        }
        if preset_data.get("mode") == "solar":
            entry["mode"] = "solar"
            entry["solar_steps"] = preset_data["solar_steps"]
        else:
            entry["steps"] = preset_data["steps"]
        cct_sequences.append(entry)

    # Build segment sequences
    segment_sequences = []
    for preset_id, preset_data in SEGMENT_SEQUENCE_PRESETS.items():
        segment_sequences.append(
            {
                "id": preset_id,
                "name": preset_data["name"],
                "icon": preset_data.get("icon"),
                "steps": preset_data["steps"],
                "loop_mode": preset_data["loop_mode"],
                "loop_count": preset_data.get("loop_count"),
                "end_behavior": preset_data["end_behavior"],
            }
        )

    # Build dynamic scenes
    dynamic_scenes = []
    for preset_id, preset_data in DYNAMIC_SCENE_PRESETS.items():
        dynamic_scenes.append(
            {
                "id": preset_id,
                "name": preset_data["name"],
                "icon": preset_data.get("icon"),
                "colors": preset_data["colors"],
                "transition_time": preset_data["transition_time"],
                "hold_time": preset_data["hold_time"],
                "distribution_mode": preset_data["distribution_mode"],
                "offset_delay": preset_data.get("offset_delay", 0.0),
                "random_order": preset_data.get("random_order", False),
                "loop_mode": preset_data["loop_mode"],
                "loop_count": preset_data.get("loop_count"),
                "end_behavior": preset_data["end_behavior"],
            }
        )

    return {
        "dynamic_effects": dynamic_effects,
        "segment_patterns": segment_patterns,
        "cct_sequences": cct_sequences,
        "segment_sequences": segment_sequences,
        "dynamic_scenes": dynamic_scenes,
    }


def _get_favorites_store(hass: HomeAssistant) -> FavoritesStore | None:
    """Get the favorites store from hass.data."""
    if DOMAIN not in hass.data:
        return None
    return hass.data[DOMAIN].get(DATA_FAVORITES_STORE)


class FavoritesView(HomeAssistantView):
    """View to manage user favorites (list and create)."""

    url = f"/api/{DOMAIN}/favorites"
    name = f"api:{DOMAIN}:favorites"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Get all favorites for the current user."""
        hass = request.app["hass"]
        user = request["hass_user"]

        if not user:
            return web.Response(status=401, text="Unauthorized")

        favorites_store = _get_favorites_store(hass)
        if not favorites_store:
            return web.Response(status=503, text="Favorites store not initialized")

        favorites = favorites_store.get_favorites(user.id)
        return web.json_response({"favorites": favorites})

    async def post(self, request: web.Request) -> web.Response:
        """Add a new favorite for the current user."""
        hass = request.app["hass"]
        user = request["hass_user"]

        if not user:
            return web.Response(status=401, text="Unauthorized")

        favorites_store = _get_favorites_store(hass)
        if not favorites_store:
            return web.Response(status=503, text="Favorites store not initialized")

        try:
            data = await request.json()
        except ValueError:
            return web.Response(status=400, text="Invalid JSON")

        entities = data.get("entities")
        if not entities or not isinstance(entities, list):
            return web.Response(status=400, text="entities list is required")

        if len(entities) > 250:
            return web.Response(status=400, text="entities list exceeds 250 items")
        for entity in entities:
            if not isinstance(entity, str) or not entity:
                return web.Response(
                    status=400, text="Each entity must be a non-empty string"
                )

        name = data.get("name")  # Optional custom name
        if name is not None and (not isinstance(name, str) or len(name) > 200):
            return web.Response(
                status=400, text="name must be a string of 200 characters or fewer"
            )

        favorite = await favorites_store.add_favorite(user.id, entities, name)
        return web.json_response({"favorite": favorite}, status=201)


class FavoriteView(HomeAssistantView):
    """View to manage a single favorite (update and delete)."""

    url = f"/api/{DOMAIN}/favorites/{{favorite_id}}"
    name = f"api:{DOMAIN}:favorite"
    requires_auth = True

    async def put(self, request: web.Request, favorite_id: str) -> web.Response:
        """Update a favorite for the current user."""
        hass = request.app["hass"]
        user = request["hass_user"]

        if not user:
            return web.Response(status=401, text="Unauthorized")

        favorites_store = _get_favorites_store(hass)
        if not favorites_store:
            return web.Response(status=503, text="Favorites store not initialized")

        try:
            data = await request.json()
        except ValueError:
            return web.Response(status=400, text="Invalid JSON")

        name = data.get("name")
        entities = data.get("entities")

        favorite = await favorites_store.update_favorite(
            user.id, favorite_id, name=name, entities=entities
        )

        if not favorite:
            return web.Response(status=404, text="Favorite not found")

        return web.json_response({"favorite": favorite})

    async def delete(self, request: web.Request, favorite_id: str) -> web.Response:
        """Delete a favorite for the current user."""
        hass = request.app["hass"]
        user = request["hass_user"]

        if not user:
            return web.Response(status=401, text="Unauthorized")

        favorites_store = _get_favorites_store(hass)
        if not favorites_store:
            return web.Response(status=503, text="Favorites store not initialized")

        removed = await favorites_store.remove_favorite(user.id, favorite_id)

        if not removed:
            return web.Response(status=404, text="Favorite not found")

        return web.Response(status=204)



class UserPresetsView(HomeAssistantView):
    """View to list and create user presets."""

    url = f"/api/{DOMAIN}/user_presets"
    name = f"api:{DOMAIN}:user_presets"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Get all user presets, optionally filtered by type.

        Query params:
            type: Optional preset type filter (effect, segment_pattern,
                  cct_sequence, segment_sequence)
        """
        hass = request.app["hass"]

        preset_store = get_preset_store(hass)
        if not preset_store:
            return web.Response(status=503, text="Preset store not initialized")

        preset_type = request.query.get("type")
        if preset_type and preset_type not in VALID_PRESET_TYPES:
            return web.Response(
                status=400,
                text=f"Invalid preset type. Valid types: {', '.join(VALID_PRESET_TYPES)}",
            )

        presets = preset_store.get_all_presets(preset_type)
        return web.json_response(presets)

    async def post(self, request: web.Request) -> web.Response:
        """Create a new user preset.

        Body:
            type: Preset type (required)
            data: Preset data (required)
        """
        hass = request.app["hass"]

        preset_store = get_preset_store(hass)
        if not preset_store:
            return web.Response(status=503, text="Preset store not initialized")

        try:
            body = await request.json()
        except ValueError:
            return web.Response(status=400, text="Invalid JSON")

        preset_type = body.get("type")
        preset_data = body.get("data")

        if not preset_type:
            return web.Response(status=400, text="type is required")
        if preset_type not in VALID_PRESET_TYPES:
            return web.Response(
                status=400,
                text=f"Invalid preset type. Valid types: {', '.join(VALID_PRESET_TYPES)}",
            )
        if not preset_data or not isinstance(preset_data, dict):
            return web.Response(status=400, text="data object is required")
        if not preset_data.get("name"):
            return web.Response(status=400, text="name is required in data")

        preset = await preset_store.add_preset(preset_type, preset_data)
        if not preset:
            return web.Response(status=500, text="Failed to create preset")

        return web.json_response({"preset": preset}, status=201)


class UserPresetView(HomeAssistantView):
    """View to get, update, or delete a single user preset."""

    url = f"/api/{DOMAIN}/user_presets/{{preset_type}}/{{preset_id}}"
    name = f"api:{DOMAIN}:user_preset"
    requires_auth = True

    async def get(
        self, request: web.Request, preset_type: str, preset_id: str
    ) -> web.Response:
        """Get a single user preset."""
        hass = request.app["hass"]

        preset_store = get_preset_store(hass)
        if not preset_store:
            return web.Response(status=503, text="Preset store not initialized")

        if preset_type not in VALID_PRESET_TYPES:
            return web.Response(
                status=400,
                text=f"Invalid preset type. Valid types: {', '.join(VALID_PRESET_TYPES)}",
            )

        preset = preset_store.get_preset(preset_type, preset_id)
        if not preset:
            return web.Response(status=404, text="Preset not found")

        return web.json_response({"preset": preset})

    async def put(
        self, request: web.Request, preset_type: str, preset_id: str
    ) -> web.Response:
        """Update a user preset."""
        hass = request.app["hass"]

        preset_store = get_preset_store(hass)
        if not preset_store:
            return web.Response(status=503, text="Preset store not initialized")

        if preset_type not in VALID_PRESET_TYPES:
            return web.Response(
                status=400,
                text=f"Invalid preset type. Valid types: {', '.join(VALID_PRESET_TYPES)}",
            )

        try:
            preset_data = await request.json()
        except ValueError:
            return web.Response(status=400, text="Invalid JSON")

        if not isinstance(preset_data, dict):
            return web.Response(status=400, text="Request body must be a JSON object")

        preset = await preset_store.update_preset(preset_type, preset_id, preset_data)
        if not preset:
            return web.Response(status=404, text="Preset not found")

        return web.json_response({"preset": preset})

    async def delete(
        self, request: web.Request, preset_type: str, preset_id: str
    ) -> web.Response:
        """Delete a user preset."""
        hass = request.app["hass"]

        preset_store = get_preset_store(hass)
        if not preset_store:
            return web.Response(status=503, text="Preset store not initialized")

        if preset_type not in VALID_PRESET_TYPES:
            return web.Response(
                status=400,
                text=f"Invalid preset type. Valid types: {', '.join(VALID_PRESET_TYPES)}",
            )

        deleted = await preset_store.delete_preset(preset_type, preset_id)
        if not deleted:
            return web.Response(status=404, text="Preset not found")

        return web.Response(status=204)


class UserPresetDuplicateView(HomeAssistantView):
    """View to duplicate a user preset."""

    url = f"/api/{DOMAIN}/user_presets/{{preset_type}}/{{preset_id}}/duplicate"
    name = f"api:{DOMAIN}:user_preset_duplicate"
    requires_auth = True

    async def post(
        self, request: web.Request, preset_type: str, preset_id: str
    ) -> web.Response:
        """Duplicate a user preset.

        Body (optional):
            name: Custom name for the duplicate
        """
        hass = request.app["hass"]

        preset_store = get_preset_store(hass)
        if not preset_store:
            return web.Response(status=503, text="Preset store not initialized")

        if preset_type not in VALID_PRESET_TYPES:
            return web.Response(
                status=400,
                text=f"Invalid preset type. Valid types: {', '.join(VALID_PRESET_TYPES)}",
            )

        # Parse optional body for custom name
        new_name = None
        try:
            body = await request.json()
            new_name = body.get("name")
        except ValueError:
            pass  # No body or invalid JSON is fine

        preset = await preset_store.duplicate_preset(preset_type, preset_id, new_name)
        if not preset:
            return web.Response(status=404, text="Source preset not found")

        return web.json_response({"preset": preset}, status=201)


def _get_user_preferences_store(
    hass: HomeAssistant,
) -> UserPreferencesStore | None:
    """Get the user preferences store from hass.data."""
    if DOMAIN not in hass.data:
        return None
    return hass.data[DOMAIN].get(DATA_USER_PREFERENCES_STORE)


def _validate_color_history(color_history: Any) -> str | None:
    """Validate color history data.

    Returns an error message if invalid, or None if valid.
    """
    if not isinstance(color_history, list):
        return "color_history must be a list"

    if len(color_history) > MAX_COLOR_HISTORY_SIZE:
        return f"color_history must have at most {MAX_COLOR_HISTORY_SIZE} entries"

    for i, color in enumerate(color_history):
        if not isinstance(color, dict):
            return f"color_history[{i}] must be an object"
        if "x" not in color or "y" not in color:
            return f"color_history[{i}] must have `x` and `y` keys"
        try:
            x = float(color["x"])
            y = float(color["y"])
        except (TypeError, ValueError):
            return f"color_history[{i}] `x` and `y` must be numbers"
        if not (0.0 <= x <= 1.0 and 0.0 <= y <= 1.0):
            return f"color_history[{i}] `x` and `y` must be between 0.0 and 1.0"

    return None


def _validate_sort_preferences(sort_preferences: Any) -> str | None:
    """Validate sort preferences data.

    Returns an error message if invalid, or None if valid.
    """
    if not isinstance(sort_preferences, dict):
        return "sort_preferences must be an object"

    for key, value in sort_preferences.items():
        if not isinstance(key, str):
            return f"sort_preferences key `{key}` must be a string"
        if value not in VALID_SORT_OPTIONS:
            return (
                f"sort_preferences[{key!r}] value `{value}` is invalid. "
                f"Valid options: {', '.join(sorted(VALID_SORT_OPTIONS))}"
            )

    return None


def _validate_collapsed_sections(collapsed_sections: Any) -> str | None:
    """Validate collapsed sections data.

    Returns an error message if invalid, or None if valid.
    """
    if not isinstance(collapsed_sections, dict):
        return "collapsed_sections must be an object"

    for key, value in collapsed_sections.items():
        if not isinstance(key, str):
            return f"collapsed_sections key `{key}` must be a string"
        if not isinstance(value, bool):
            return f"collapsed_sections[{key!r}] value must be a boolean"

    return None


def _validate_favorite_presets(favorite_presets: Any) -> str | None:
    """Validate favorite presets references.

    Returns an error message if invalid, or None if valid.
    """
    if not isinstance(favorite_presets, list):
        return "favorite_presets must be a list"

    for i, ref in enumerate(favorite_presets):
        if not isinstance(ref, dict):
            return f"favorite_presets[{i}] must be an object"
        if "type" not in ref or "id" not in ref:
            return f"favorite_presets[{i}] must have `type` and `id` keys"
        if ref["type"] not in VALID_PRESET_TYPES:
            return f"favorite_presets[{i}] has invalid type `{ref['type']}`"
        if not isinstance(ref["id"], str):
            return f"favorite_presets[{i}] `id` must be a string"

    return None


class UserPreferencesView(HomeAssistantView):
    """View to manage per-user preferences (color history, sort preferences)."""

    url = f"/api/{DOMAIN}/user_preferences"
    name = f"api:{DOMAIN}:user_preferences"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Get preferences for the current user."""
        hass = request.app["hass"]
        user = request["hass_user"]

        if not user:
            return web.Response(status=401, text="Unauthorized")

        store = _get_user_preferences_store(hass)
        if not store:
            return web.Response(
                status=503, text="User preferences store not initialized"
            )

        preferences = store.get_preferences(user.id)
        return web.json_response(preferences)

    async def put(self, request: web.Request) -> web.Response:
        """Partially update preferences for the current user.

        Accepts any subset of preference keys and merges them into the
        existing preferences.
        """
        hass = request.app["hass"]
        user = request["hass_user"]

        if not user:
            return web.Response(status=401, text="Unauthorized")

        store = _get_user_preferences_store(hass)
        if not store:
            return web.Response(
                status=503, text="User preferences store not initialized"
            )

        try:
            data = await request.json()
        except ValueError:
            return web.Response(status=400, text="Invalid JSON")

        if not isinstance(data, dict):
            return web.Response(status=400, text="Request body must be a JSON object")

        # Validate provided fields
        color_history = None
        sort_preferences = None
        collapsed_sections = None
        include_all_lights = None
        favorite_presets = None
        static_scene_mode = None
        distribution_mode_override = _UNSET
        brightness_override = _UNSET

        if "color_history" in data:
            error = _validate_color_history(data["color_history"])
            if error:
                return web.Response(status=400, text=error)
            color_history = data["color_history"]

        if "sort_preferences" in data:
            error = _validate_sort_preferences(data["sort_preferences"])
            if error:
                return web.Response(status=400, text=error)
            sort_preferences = data["sort_preferences"]

        if "collapsed_sections" in data:
            error = _validate_collapsed_sections(data["collapsed_sections"])
            if error:
                return web.Response(status=400, text=error)
            collapsed_sections = data["collapsed_sections"]

        if "include_all_lights" in data:
            if not isinstance(data["include_all_lights"], bool):
                return web.Response(
                    status=400, text="include_all_lights must be a boolean"
                )
            include_all_lights = data["include_all_lights"]

        if "favorite_presets" in data:
            error = _validate_favorite_presets(data["favorite_presets"])
            if error:
                return web.Response(status=400, text=error)
            favorite_presets = data["favorite_presets"]

        if "static_scene_mode" in data:
            if not isinstance(data["static_scene_mode"], bool):
                return web.Response(
                    status=400, text="static_scene_mode must be a boolean"
                )
            static_scene_mode = data["static_scene_mode"]

        if "distribution_mode_override" in data:
            value = data["distribution_mode_override"]
            if value is not None and (
                not isinstance(value, str) or value not in VALID_DISTRIBUTION_MODES
            ):
                return web.Response(
                    status=400,
                    text=(
                        "distribution_mode_override must be null or one of"
                        f" {VALID_DISTRIBUTION_MODES}"
                    ),
                )
            distribution_mode_override = value

        if "brightness_override" in data:
            value = data["brightness_override"]
            if value is not None and (
                not isinstance(value, (int, float)) or value < 1 or value > 100
            ):
                return web.Response(
                    status=400,
                    text="brightness_override must be null or a number between 1 and 100",
                )
            brightness_override = int(value) if value is not None else None

        if (
            color_history is None
            and sort_preferences is None
            and collapsed_sections is None
            and include_all_lights is None
            and favorite_presets is None
            and static_scene_mode is None
            and distribution_mode_override is _UNSET
            and brightness_override is _UNSET
        ):
            # Nothing to update, return current preferences
            preferences = store.get_preferences(user.id)
            return web.json_response(preferences)

        preferences = await store.update_preferences(
            user.id,
            color_history=color_history,
            sort_preferences=sort_preferences,
            collapsed_sections=collapsed_sections,
            include_all_lights=include_all_lights,
            favorite_presets=favorite_presets,
            static_scene_mode=static_scene_mode,
            distribution_mode_override=distribution_mode_override,
            brightness_override=brightness_override,
        )
        return web.json_response(preferences)


class GlobalPreferencesView(HomeAssistantView):
    """View to get and update integration-wide global preferences."""

    url = f"/api/{DOMAIN}/global_preferences"
    name = f"api:{DOMAIN}:global_preferences"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Get current global preferences."""
        hass = request.app["hass"]

        store = _get_user_preferences_store(hass)
        if not store:
            return web.Response(
                status=503, text="User preferences store not initialized"
            )

        return web.json_response(store.get_global_preferences())

    async def put(self, request: web.Request) -> web.Response:
        """Update global preferences."""
        hass = request.app["hass"]

        store = _get_user_preferences_store(hass)
        if not store:
            return web.Response(
                status=503, text="User preferences store not initialized"
            )

        try:
            data = await request.json()
        except ValueError:
            return web.Response(status=400, text="Invalid JSON")

        if not isinstance(data, dict):
            return web.Response(status=400, text="Request body must be a JSON object")

        ignore_external_changes = None
        if "ignore_external_changes" in data:
            if not isinstance(data["ignore_external_changes"], bool):
                return web.Response(
                    status=400, text="ignore_external_changes must be a boolean"
                )
            ignore_external_changes = data["ignore_external_changes"]

        software_transition_entities = None
        if "software_transition_entities" in data:
            entities = data["software_transition_entities"]
            if not isinstance(entities, list) or not all(
                isinstance(e, str) for e in entities
            ):
                return web.Response(
                    status=400,
                    text="software_transition_entities must be a list of strings",
                )
            software_transition_entities = entities

        if ignore_external_changes is None and software_transition_entities is None:
            return web.json_response(store.get_global_preferences())

        preferences = await store.update_global_preferences(
            ignore_external_changes=ignore_external_changes,
            software_transition_entities=software_transition_entities,
        )
        return web.json_response(preferences)


class VersionView(HomeAssistantView):
    """View to get the integration version."""

    url = f"/api/{DOMAIN}/version"
    name = f"api:{DOMAIN}:version"
    requires_auth = False

    async def get(self, request: web.Request) -> web.Response:
        """Get the integration version and setup status from manifest.json."""
        hass = request.app["hass"]

        manifest_path = Path(
            hass.config.path(f"custom_components/{DOMAIN}/manifest.json")
        )

        if not manifest_path.exists():
            _LOGGER.error("Manifest file not found: %s", manifest_path)
            return web.Response(status=404, text="Manifest not found")

        # Use executor to avoid blocking I/O
        def read_manifest():
            import json

            with open(manifest_path, "r", encoding="utf-8") as f:
                return json.load(f)

        try:
            manifest = await hass.async_add_executor_job(read_manifest)
            version = manifest.get("version", "unknown")

            # Check setup status across all config entries
            setup_complete = True
            entries_data = hass.data.get(DOMAIN, {}).get("entries", {})
            if not entries_data:
                # No entries loaded yet
                setup_complete = False
            else:
                for instance_data in entries_data.values():
                    backend = instance_data.get("backend")
                    if not backend:
                        continue
                    try:
                        if not backend.entity_mapping_ready:
                            setup_complete = False
                            break
                    except AttributeError:
                        setup_complete = False
                        break

            return web.json_response(
                {
                    "version": version,
                    "setup_complete": setup_complete,
                }
            )
        except (OSError, ValueError) as ex:
            _LOGGER.error("Error reading manifest: %s", ex)
            return web.Response(status=500, text="Error reading manifest")


class ExportPresetsView(HomeAssistantView):
    """View to export user presets as a downloadable JSON file.

    Accepts an optional comma-separated list of preset IDs via query
    parameter to export selectively. If omitted, all presets are exported.
    Uses GET so the URL can be signed for authenticated downloads that
    work in the HA mobile app WebView.
    """

    url = f"/api/{DOMAIN}/presets/export"
    name = f"api:{DOMAIN}:presets_export"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Export user presets, optionally filtered by ID.

        Query params:
            preset_ids: Optional comma-separated list of preset IDs

        Returns:
            JSON file download with selected or all user presets
        """
        hass = request.app["hass"]

        preset_store = get_preset_store(hass)
        if not preset_store:
            return web.Response(status=503, text="Preset store not initialized")

        # Parse optional preset_ids from query string
        preset_ids: list[str] | None = None
        ids_param = request.query.get("preset_ids")
        if ids_param:
            preset_ids = [i.strip() for i in ids_param.split(",") if i.strip()]

        try:
            export_data = await preset_store.export_user_presets(preset_ids)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"aqara_presets_export_{timestamp}.json"

            return web.Response(
                body=json.dumps(export_data, indent=2, ensure_ascii=False),
                content_type="application/json",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                },
            )

        except Exception:
            _LOGGER.exception("Failed to export presets")
            return web.Response(status=500, text="Failed to export presets")


class ImportPresetsView(HomeAssistantView):
    """View to import presets from JSON backup file."""

    url = f"/api/{DOMAIN}/presets/import"
    name = f"api:{DOMAIN}:presets_import"
    requires_auth = True

    MAX_IMPORT_PRESETS_TOTAL = 500

    async def post(self, request: web.Request) -> web.Response:
        """Import presets from uploaded JSON file.

        Expects:
            JSON body with backup data matching export format

        Returns:
            JSON with import results and counts
        """
        hass = request.app["hass"]

        preset_store = get_preset_store(hass)
        if not preset_store:
            return web.Response(status=503, text="Preset store not initialized")

        try:
            # Parse request body
            import_data = await request.json()
        except (json.JSONDecodeError, ValueError) as ex:
            _LOGGER.warning("Invalid JSON in import request: %s", ex)
            return web.Response(status=400, text="Invalid JSON format")

        # Guard against oversized imports
        if isinstance(import_data, dict):
            preset_keys = (
                "effect_presets",
                "segment_pattern_presets",
                "cct_sequence_presets",
                "segment_sequence_presets",
                "dynamic_scene_presets",
            )
            total_presets = sum(
                len(import_data.get(k, []))
                for k in preset_keys
                if isinstance(import_data.get(k), list)
            )
            if total_presets > self.MAX_IMPORT_PRESETS_TOTAL:
                return web.Response(
                    status=400,
                    text=(
                        f"Import contains {total_presets} presets,"
                        f" maximum is {self.MAX_IMPORT_PRESETS_TOTAL}"
                    ),
                )

        try:
            # Import presets with validation and conflict resolution
            imported_counts = await preset_store.import_presets(import_data)

            # Calculate total imported
            total_imported = sum(imported_counts.values())

            return web.json_response(
                {
                    "success": True,
                    "message": f"Successfully imported {total_imported} presets",
                    "counts": imported_counts,
                },
                status=200,
            )

        except ServiceValidationError as ex:
            return web.Response(status=400, text=str(ex))
        except Exception:
            _LOGGER.exception("Failed to import presets")
            return web.Response(status=400, text="Failed to import presets")


class SupportedEntitiesView(HomeAssistantView):
    """View to get all supported entities across all backend instances."""

    url = f"/api/{DOMAIN}/supported_entities"
    name = f"api:{DOMAIN}:supported_entities"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Get all supported entities with their device info.

        Returns:
            JSON with list of supported entities and their device types
        """
        hass = request.app["hass"]

        if DOMAIN not in hass.data:
            return web.json_response({"entities": [], "instances": []})

        supported_entities: dict[str, dict[str, Any]] = {}
        instances: list[dict[str, Any]] = []

        # Iterate over all config entries for this integration
        entries_data = hass.data[DOMAIN].get("entries", {})
        entity_routing = hass.data[DOMAIN].get("entity_routing", {})

        for entry_id, instance_data in entries_data.items():
            backend = instance_data.get("backend")
            if not backend:
                continue

            # Get entry info from config entries (avoid direct backend.entry access)
            entry = hass.config_entries.async_get_entry(entry_id)
            if not entry:
                continue
            backend_type = entry.runtime_data.backend_type
            all_devices = backend.get_all_devices()

            # Calculate device counts by type
            device_counts: dict[str, int] = {
                "t2_rgb": 0,
                "t2_cct": 0,
                "t1m": 0,
                "t1_strip": 0,
                "other": 0,
                "total": 0,
            }
            device_names: list[str] = []

            for aqara_device in all_devices.values():
                device_counts["total"] += 1
                device_names.append(aqara_device.name)

                model_id = aqara_device.model_id
                if model_id in [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT]:
                    device_counts["t1m"] += 1
                elif model_id == MODEL_T1_STRIP:
                    device_counts["t1_strip"] += 1
                elif model_id in [
                    MODEL_T2_BULB_E26,
                    MODEL_T2_BULB_E27,
                    MODEL_T2_BULB_GU10_230V,
                    MODEL_T2_BULB_GU10_110V,
                ]:
                    device_counts["t2_rgb"] += 1
                elif model_id in [
                    MODEL_T2_CCT_E26,
                    MODEL_T2_CCT_E27,
                    MODEL_T2_CCT_GU10_230V,
                    MODEL_T2_CCT_GU10_110V,
                ]:
                    device_counts["t2_cct"] += 1
                else:
                    device_counts["other"] += 1

            instances.append(
                {
                    "entry_id": entry_id,
                    "title": entry.title,
                    "backend_type": backend_type,
                    "z2m_base_topic": (
                        entry.runtime_data.z2m_base_topic
                        if backend_type == "z2m"
                        else None
                    ),
                    "device_counts": device_counts,
                    "devices": sorted(device_names),
                }
            )

            # Get entities routed to this entry
            entry_entity_ids = [
                eid
                for eid, e_entry_id in entity_routing.items()
                if e_entry_id == entry_id
            ]

            _LOGGER.debug(
                "SupportedEntitiesView: Processing entry %s (%s) with %d mapped entities and %d devices",
                entry_id,
                backend_type,
                len(entry_entity_ids),
                len(all_devices),
            )

            for entity_id in entry_entity_ids:
                # Get device via backend protocol
                aqara_device = backend.get_device_for_entity(entity_id)
                if not aqara_device:
                    _LOGGER.warning(
                        "SupportedEntitiesView: Could not find device for entity %s",
                        entity_id,
                    )
                    continue

                # Determine device type category for frontend
                model_id = aqara_device.model_id
                if model_id in [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT]:
                    device_type = "t1m"
                elif model_id == MODEL_T1_STRIP:
                    device_type = "t1_strip"
                elif model_id in [
                    MODEL_T2_BULB_E26,
                    MODEL_T2_BULB_E27,
                    MODEL_T2_BULB_GU10_230V,
                    MODEL_T2_BULB_GU10_110V,
                ]:
                    device_type = "t2_bulb"
                elif model_id in [
                    MODEL_T2_CCT_E26,
                    MODEL_T2_CCT_E27,
                    MODEL_T2_CCT_GU10_230V,
                    MODEL_T2_CCT_GU10_110V,
                ]:
                    device_type = "t2_cct"
                else:
                    device_type = "unknown"

                # Get segment count for this device model
                from .light_capabilities import get_segment_count

                segment_count = get_segment_count(model_id)

                supported_entities[entity_id] = {
                    "entity_id": entity_id,
                    "device_name": aqara_device.name,
                    "z2m_friendly_name": aqara_device.name,  # backwards compat
                    "model_id": model_id,
                    "device_type": device_type,
                    "entry_id": entry_id,
                    "backend_type": backend_type,
                    "z2m_base_topic": (
                        entry.runtime_data.z2m_base_topic
                        if backend_type == "z2m"
                        else None
                    ),
                    "ieee_address": aqara_device.identifier,
                    "segment_count": segment_count,
                }

        # Detect light groups where ALL members are supported Aqara devices
        light_groups: list[dict[str, Any]] = []
        supported_entity_ids = set(supported_entities.keys())

        # Scan all light entities for groups
        for state in hass.states.async_all("light"):
            entity_id = state.entity_id
            # Skip if already a supported entity (not a group)
            if entity_id in supported_entity_ids:
                continue

            # Check if this is a light group (has entity_id attribute with members)
            member_ids = state.attributes.get("entity_id")
            if not member_ids or not isinstance(member_ids, (list, tuple)):
                continue

            # Check if ALL members are supported Aqara devices
            all_supported = True
            member_details: list[dict[str, Any]] = []
            group_device_types: set[str] = set()

            for member_id in member_ids:
                if member_id not in supported_entity_ids:
                    all_supported = False
                    break
                member_info = supported_entities[member_id]
                member_details.append(member_info)
                group_device_types.add(member_info.get("device_type", "unknown"))

            if all_supported and member_details:
                # Determine the group's device type based on members
                # If all members are same type, use that; otherwise "mixed"
                if len(group_device_types) == 1:
                    group_device_type = next(iter(group_device_types))
                else:
                    group_device_type = "mixed"

                friendly_name = state.attributes.get("friendly_name", entity_id)
                light_groups.append(
                    {
                        "entity_id": entity_id,
                        "friendly_name": friendly_name,
                        "is_group": True,
                        "device_type": group_device_type,
                        "member_count": len(member_ids),
                        "member_ids": list(member_ids),
                        "member_device_types": list(group_device_types),
                    }
                )

                _LOGGER.debug(
                    "SupportedEntitiesView: Found light group %s with %d supported members: %s",
                    entity_id,
                    len(member_ids),
                    member_ids,
                )

        _LOGGER.info(
            "SupportedEntitiesView: Returning %d supported entities and %d light groups",
            len(supported_entities),
            len(light_groups),
        )

        return web.json_response(
            {
                "entities": list(supported_entities.values()),
                "instances": instances,
                "light_groups": light_groups,
            }
        )


def _get_segment_zone_store(hass: HomeAssistant) -> SegmentZoneStore | None:
    """Get the segment zone store from hass.data."""
    if DOMAIN not in hass.data:
        return None
    return hass.data[DOMAIN].get(DATA_SEGMENT_ZONE_STORE)


_IEEE_ADDRESS_RE = re.compile(r"^0x[0-9a-fA-F]{16}$")


class SegmentZonesView(HomeAssistantView):
    """View to get and set segment zones for a device."""

    url = f"/api/{DOMAIN}/segment_zones/{{ieee_address}}"
    name = f"api:{DOMAIN}:segment_zones"
    requires_auth = True

    async def get(self, request: web.Request, ieee_address: str) -> web.Response:
        """Get all zones for a device."""
        if not _IEEE_ADDRESS_RE.match(ieee_address):
            return web.Response(status=400, text="Invalid IEEE address format")

        hass = request.app["hass"]

        zone_store = _get_segment_zone_store(hass)
        if not zone_store:
            return web.Response(status=503, text="Segment zone store not initialized")

        zones = zone_store.get_zones(ieee_address)
        return web.json_response({"zones": zones})

    async def put(self, request: web.Request, ieee_address: str) -> web.Response:
        """Replace all zones for a device."""
        if not _IEEE_ADDRESS_RE.match(ieee_address):
            return web.Response(status=400, text="Invalid IEEE address format")

        hass = request.app["hass"]

        zone_store = _get_segment_zone_store(hass)
        if not zone_store:
            return web.Response(status=503, text="Segment zone store not initialized")

        try:
            data = await request.json()
        except ValueError:
            return web.Response(status=400, text="Invalid JSON")

        zones = data.get("zones")
        if zones is None or not isinstance(zones, dict):
            return web.Response(
                status=400, text="Request body must contain a `zones` object"
            )

        # Validate all values are strings
        for name, segment_range in zones.items():
            if not isinstance(name, str) or not isinstance(segment_range, str):
                return web.Response(
                    status=400,
                    text="Zone names and segment ranges must be strings",
                )

        try:
            saved_zones = await zone_store.set_zones(ieee_address, zones)
        except ValueError as ex:
            return web.Response(status=400, text=str(ex))

        return web.json_response({"zones": saved_zones})


class SegmentZoneView(HomeAssistantView):
    """View to delete a single segment zone."""

    url = f"/api/{DOMAIN}/segment_zones/{{ieee_address}}/{{zone_name}}"
    name = f"api:{DOMAIN}:segment_zone"
    requires_auth = True

    async def delete(
        self, request: web.Request, ieee_address: str, zone_name: str
    ) -> web.Response:
        """Delete a single zone from a device."""
        if not _IEEE_ADDRESS_RE.match(ieee_address):
            return web.Response(status=400, text="Invalid IEEE address format")

        hass = request.app["hass"]
        zone_name = unquote(zone_name)

        zone_store = _get_segment_zone_store(hass)
        if not zone_store:
            return web.Response(status=503, text="Segment zone store not initialized")

        deleted = await zone_store.delete_zone(ieee_address, zone_name)
        if not deleted:
            return web.Response(status=404, text="Zone not found")

        return web.Response(status=204)


# Mapping from preset type to the service used for activation
_ACTIVATE_SERVICE_MAP: dict[str, str] = {
    "effect": SERVICE_SET_DYNAMIC_EFFECT,
    "segment_pattern": SERVICE_SET_SEGMENT_PATTERN,
    "cct_sequence": SERVICE_START_CCT_SEQUENCE,
    "dynamic_scene": SERVICE_START_DYNAMIC_SCENE,
    "segment_sequence": SERVICE_START_SEGMENT_SEQUENCE,
}

# Mapping from preset type to the service used for stopping
_STOP_SERVICE_MAP: dict[str, str] = {
    "effect": SERVICE_STOP_EFFECT,
    "cct_sequence": SERVICE_STOP_CCT_SEQUENCE,
    "dynamic_scene": SERVICE_STOP_DYNAMIC_SCENE,
    "segment_sequence": SERVICE_STOP_SEGMENT_SEQUENCE,
}

# Valid actions for the trigger endpoint
_VALID_ACTIONS = {"activate", "stop"}


class TriggerView(HomeAssistantView):
    """REST endpoint for triggering presets from external systems.

    Allows Node-RED, phone shortcuts, voice assistants, and other HTTP
    clients to activate presets or stop effects without using HA's
    service call mechanism directly.
    """

    url = f"/api/{DOMAIN}/trigger"
    name = f"api:{DOMAIN}:trigger"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        """Trigger a preset or stop an active effect/sequence.

        Expects JSON body with:
            entity_id: Target light entity ID (required)
            action: "activate" or "stop" (required)
            preset_type: One of "effect", "segment_pattern",
                "cct_sequence", "dynamic_scene", "segment_sequence" (required)
            preset: Preset name (required for activate action)
            brightness: Optional brightness percentage override (1-100)
            segments: Optional segment range override (e.g. "1-10")
        """
        hass: HomeAssistant = request.app["hass"]

        # Parse request body
        try:
            data: dict[str, Any] = await request.json()
        except (json.JSONDecodeError, ValueError):
            return web.json_response(
                {"success": False, "error": "Invalid JSON"}, status=400
            )

        if not isinstance(data, dict):
            return web.json_response(
                {"success": False, "error": "Request body must be a JSON object"},
                status=400,
            )

        # Validate required fields
        entity_id = data.get("entity_id")
        if not entity_id or not isinstance(entity_id, str):
            return web.json_response(
                {"success": False, "error": "Missing or invalid `entity_id`"},
                status=400,
            )

        # Verify the entity exists and is managed by this integration
        state = hass.states.get(entity_id)
        if not state:
            return web.json_response(
                {"success": False, "error": f"Entity `{entity_id}` not found"},
                status=404,
            )

        entity_routing = hass.data.get(DOMAIN, {}).get("entity_routing", {})
        if entity_id not in entity_routing:
            return web.json_response(
                {
                    "success": False,
                    "error": f"Entity `{entity_id}` is not managed by this integration",
                },
                status=400,
            )

        action = data.get("action")
        if action not in _VALID_ACTIONS:
            return web.json_response(
                {
                    "success": False,
                    "error": f"Invalid `action`: must be one of {sorted(_VALID_ACTIONS)}",
                },
                status=400,
            )

        preset_type = data.get("preset_type")
        if not preset_type or preset_type not in _ACTIVATE_SERVICE_MAP:
            return web.json_response(
                {
                    "success": False,
                    "error": (
                        "Invalid `preset_type`: must be one of "
                        f"{sorted(_ACTIVATE_SERVICE_MAP.keys())}"
                    ),
                },
                status=400,
            )

        # Build the service call data (services expect entity_id as a list)
        service_data: dict[str, Any] = {ATTR_ENTITY_ID: [entity_id]}

        if action == "activate":
            preset = data.get("preset")
            if not preset or not isinstance(preset, str):
                return web.json_response(
                    {
                        "success": False,
                        "error": "Missing or invalid `preset` (required for activate action)",
                    },
                    status=400,
                )

            service_data[ATTR_PRESET] = preset
            service_name = _ACTIVATE_SERVICE_MAP[preset_type]

            # Optional overrides
            brightness = data.get("brightness")
            if brightness is not None:
                service_data[ATTR_BRIGHTNESS] = brightness

            segments = data.get("segments")
            if segments is not None:
                service_data[ATTR_SEGMENTS] = segments

        else:
            # Stop action
            if preset_type not in _STOP_SERVICE_MAP:
                return web.json_response(
                    {
                        "success": False,
                        "error": (
                            f"Stop action is not supported for preset type "
                            f"`{preset_type}` (segment patterns are static)"
                        ),
                    },
                    status=400,
                )
            service_name = _STOP_SERVICE_MAP[preset_type]

            # Stop effect supports restore_state
            restore_state = data.get("restore_state")
            if restore_state is not None:
                service_data[ATTR_RESTORE_STATE] = restore_state

        # Call the service
        try:
            await hass.services.async_call(
                DOMAIN, service_name, service_data, blocking=True
            )
        except ServiceValidationError as ex:
            _LOGGER.warning("Trigger validation error: %s", ex)
            return web.json_response({"success": False, "error": str(ex)}, status=422)
        except HomeAssistantError as ex:
            _LOGGER.error("Trigger service error: %s", ex)
            return web.json_response({"success": False, "error": str(ex)}, status=500)

        return web.json_response(
            {"success": True, "service": service_name, "entity_id": entity_id}
        )


class RunningOperationsView(HomeAssistantView):
    """View to get all currently running operations across all instances."""

    url = f"/api/{DOMAIN}/running_operations"
    name = f"api:{DOMAIN}:running_operations"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Get all running operations (effects, sequences, scenes)."""
        hass: HomeAssistant = request.app["hass"]

        operations: list[dict[str, Any]] = []

        if DOMAIN not in hass.data:
            return web.json_response({"operations": operations})

        entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
        entries_data = hass.data[DOMAIN].get("entries", {})

        for instance_data in entries_data.values():
            # Effects (from state manager)
            state_manager = instance_data.get(DATA_STATE_MANAGER)
            if state_manager:
                for (
                    entity_id,
                    device_state,
                ) in state_manager.get_all_active_effects().items():
                    operations.append(
                        {
                            "type": "effect",
                            "entity_id": entity_id,
                            "preset_id": device_state.current_preset,
                            "paused": False,
                            "externally_paused": False,
                        }
                    )

            # CCT sequences
            cct_mgr = instance_data.get(DATA_CCT_SEQUENCE_MANAGER)
            if cct_mgr:
                for entity_id in cct_mgr.get_running_sequences():
                    status = cct_mgr.get_sequence_status(entity_id) or {}
                    ext_paused = (
                        entity_controller.is_entity_externally_paused(entity_id)
                        if entity_controller
                        else False
                    )
                    operations.append(
                        {
                            "type": "cct_sequence",
                            "entity_id": entity_id,
                            "preset_id": cct_mgr.get_sequence_preset(entity_id),
                            "paused": status.get("paused", False),
                            "externally_paused": ext_paused,
                            "current_step": status.get("current_step", 0),
                            "total_steps": status.get("total_steps", 0),
                            "mode": "solar" if cct_mgr.is_solar_sequence(entity_id) else "standard",
                        }
                    )

            # Segment sequences
            seg_mgr = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
            if seg_mgr:
                for entity_id in seg_mgr.get_running_sequences():
                    status = seg_mgr.get_sequence_status(entity_id) or {}
                    ext_paused = (
                        entity_controller.is_entity_externally_paused(entity_id)
                        if entity_controller
                        else False
                    )
                    operations.append(
                        {
                            "type": "segment_sequence",
                            "entity_id": entity_id,
                            "preset_id": seg_mgr.get_sequence_preset(entity_id),
                            "paused": status.get("paused", False),
                            "externally_paused": ext_paused,
                            "current_step": status.get("current_step", 0),
                            "total_steps": status.get("total_steps", 0),
                        }
                    )

            # Dynamic scenes (grouped by scene, not per-entity)
            scene_mgr = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
            if scene_mgr:
                for scene_id, scene_info in scene_mgr.get_active_scenes().items():
                    ext_paused_entities = []
                    if entity_controller:
                        ext_paused_entities = [
                            eid
                            for eid in scene_info.entity_ids
                            if entity_controller.is_entity_externally_paused(eid)
                        ]
                    operations.append(
                        {
                            "type": "dynamic_scene",
                            "scene_id": scene_id,
                            "entity_ids": list(scene_info.entity_ids),
                            "preset_id": scene_info.preset_name,
                            "paused": scene_info.paused,
                            "externally_paused_entities": ext_paused_entities,
                            "entity_capabilities": scene_info.entity_capabilities,
                        }
                    )

            # Music sync (per-entity, firmware-managed)
            active_music_sync = instance_data.get(DATA_ACTIVE_MUSIC_SYNC, {})
            for entity_id, sync_info in active_music_sync.items():
                operations.append(
                    {
                        "type": "music_sync",
                        "entity_id": entity_id,
                        "preset_id": None,
                        "paused": False,
                        "sensitivity": sync_info.get("sensitivity", "low"),
                        "audio_effect": sync_info.get("audio_effect", "random"),
                    }
                )

        # Circadian overlays (integration-level, not per-instance)
        circadian_mgr = hass.data.get(DOMAIN, {}).get(DATA_CIRCADIAN_MANAGER)
        if circadian_mgr:
            for info in circadian_mgr.get_active_info():
                operations.append(
                    {
                        "type": "circadian",
                        "entity_id": info["entity_id"],
                        "preset_id": info.get("preset_name"),
                        "current_color_temp": info["current_color_temp"],
                        "current_brightness": info["current_brightness"],
                    }
                )

        return web.json_response({"operations": operations})


def _get_thumbnail_dir(hass: HomeAssistant) -> Path:
    """Get the thumbnail storage directory, creating it if needed."""
    path = Path(hass.config.path(f".storage/{THUMBNAIL_STORAGE_DIR}"))
    path.mkdir(parents=True, exist_ok=True)
    return path


MAX_PENDING_THUMBNAILS = 20


def _get_pending_thumbnails(hass: HomeAssistant) -> dict[str, bytes]:
    """Get the in-memory pending thumbnails dict, creating it if needed.

    Evicts the oldest entries when the limit is reached to prevent
    unbounded memory growth.
    """
    domain_data = hass.data.setdefault(DOMAIN, {})
    if "pending_thumbnails" not in domain_data:
        domain_data["pending_thumbnails"] = {}
    pending = domain_data["pending_thumbnails"]
    # Evict oldest entries if at capacity
    while len(pending) >= MAX_PENDING_THUMBNAILS:
        oldest_key = next(iter(pending))
        del pending[oldest_key]
    return pending


def _validate_image_url(url: str) -> str | None:
    """Validate a URL for image fetching, blocking SSRF vectors.

    Returns an error message string if the URL is unsafe, or None if valid.
    """
    try:
        parsed = urlparse(url)
    except ValueError:
        return "Invalid URL format"

    if parsed.scheme not in ("http", "https"):
        return "Only http and https URLs are supported"

    hostname = parsed.hostname
    if not hostname:
        return "URL must include a hostname"

    # Resolve the hostname and check all addresses against blocked ranges
    try:
        addrinfo = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        return "Unable to resolve hostname"

    for _family, _type, _proto, _canonname, sockaddr in addrinfo:
        ip = ipaddress.ip_address(sockaddr[0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            return "URLs pointing to private or internal addresses are not allowed"

    return None


class ColorExtractView(HomeAssistantView):
    """Extract dominant colors from an uploaded image or image URL."""

    url = f"/api/{DOMAIN}/extract_colors"
    name = f"api:{DOMAIN}:extract_colors"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        """Extract colors from an image.

        Accepts either:
        - Multipart form with 'file' field and optional 'num_colors',
          'save_thumbnail', 'extract_brightness'
        - JSON body with 'url' and optional 'num_colors', 'save_thumbnail',
          'extract_brightness'

        Returns JSON with 'colors' list and optional 'thumbnail_id'.
        """
        hass: HomeAssistant = request.app["hass"]

        from .image_processor import async_create_thumbnail, async_extract_colors

        content_type = request.content_type or ""
        image_bytes: bytes | None = None
        num_colors = DEFAULT_EXTRACTED_COLORS
        save_thumbnail = False
        extract_brightness = True

        if "multipart" in content_type:
            # File upload
            reader = await request.multipart()
            async for part in reader:
                if part.name == "file":
                    image_bytes = await part.read(decode=False)
                elif part.name == "num_colors":
                    raw = await part.text()
                    try:
                        num_colors = int(raw)
                    except ValueError:
                        pass
                elif part.name == "save_thumbnail":
                    raw = await part.text()
                    save_thumbnail = raw.lower() in ("true", "1", "yes")
                elif part.name == "extract_brightness":
                    raw = await part.text()
                    extract_brightness = raw.lower() in ("true", "1", "yes")

            if not image_bytes:
                return web.Response(status=400, text="No file uploaded")

        else:
            # JSON body with URL
            try:
                data = await request.json()
            except ValueError:
                return web.Response(status=400, text="Invalid JSON")

            url = data.get("url")
            if not url or not isinstance(url, str):
                return web.Response(status=400, text="Missing `url` field")

            # Validate URL before making any network request
            url_error = await hass.async_add_executor_job(_validate_image_url, url)
            if url_error:
                return web.Response(status=400, text=url_error)

            num_colors = int(data.get("num_colors", DEFAULT_EXTRACTED_COLORS))
            save_thumbnail = bool(data.get("save_thumbnail", False))
            extract_brightness = bool(data.get("extract_brightness", True))

            # Download the image with size-capped streaming read
            try:
                session = async_get_clientsession(hass)
                async with asyncio.timeout(15):
                    async with session.get(url) as resp:
                        if resp.status != 200:
                            return web.Response(
                                status=400,
                                text=f"Failed to download image: HTTP {resp.status}",
                            )
                        # Reject before downloading if Content-Length exceeds limit
                        content_length = resp.headers.get("Content-Length")
                        if (
                            content_length
                            and int(content_length) > MAX_IMAGE_SIZE_BYTES
                        ):
                            return web.Response(
                                status=413,
                                text="Image exceeds 10 MB size limit",
                            )
                        # Stream with enforced size cap (protects against
                        # missing/lying Content-Length headers)
                        chunks: list[bytes] = []
                        total = 0
                        async for chunk in resp.content.iter_chunked(64 * 1024):
                            total += len(chunk)
                            if total > MAX_IMAGE_SIZE_BYTES:
                                return web.Response(
                                    status=413,
                                    text="Image exceeds 10 MB size limit",
                                )
                            chunks.append(chunk)
                        image_bytes = b"".join(chunks)
            except TimeoutError:
                return web.Response(status=408, text="Image download timed out")
            except aiohttp.ClientError:
                return web.Response(status=400, text="Failed to download image")

        # Validate size
        if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
            return web.Response(status=413, text="Image exceeds 10 MB size limit")

        # Clamp num_colors
        num_colors = max(1, min(8, num_colors))

        # Extract colors
        try:
            colors = await async_extract_colors(
                hass,
                image_bytes,
                num_colors,
                extract_brightness=extract_brightness,
            )
        except Exception as ex:
            _LOGGER.warning("Color extraction failed: %s", ex)
            return web.Response(status=422, text=f"Color extraction failed: {ex}")

        result: dict[str, Any] = {"colors": colors}

        # Optionally create thumbnail (held in memory until preset is saved)
        if save_thumbnail:
            try:
                thumb_bytes = await async_create_thumbnail(hass, image_bytes)
                thumb_id = uuid.uuid4().hex
                pending = _get_pending_thumbnails(hass)
                pending[thumb_id] = thumb_bytes
                result["thumbnail_id"] = thumb_id
            except Exception as ex:
                _LOGGER.warning("Thumbnail creation failed: %s", ex)
                # Non-fatal -- colors still returned

        return web.json_response(result)


class ThumbnailView(HomeAssistantView):
    """Serve and manage stored preset thumbnails."""

    url = f"/api/{DOMAIN}/thumbnails/{{thumbnail_id}}"
    name = f"api:{DOMAIN}:thumbnail"
    requires_auth = False

    async def get(self, request: web.Request, thumbnail_id: str) -> web.Response:
        """Serve a thumbnail image by ID.

        Checks pending (in-memory) thumbnails first, then falls back to
        saved thumbnails on disk.
        """
        hass: HomeAssistant = request.app["hass"]

        # Security: only allow hex characters in thumbnail ID
        if not thumbnail_id.isalnum():
            return web.Response(status=400, text="Invalid thumbnail ID")

        # Check pending (unsaved) thumbnails in memory first
        pending = _get_pending_thumbnails(hass)
        if thumbnail_id in pending:
            return web.Response(
                body=pending[thumbnail_id],
                content_type="image/jpeg",
                headers={"Cache-Control": "no-store"},
            )

        # Fall back to saved thumbnails on disk
        thumb_dir = _get_thumbnail_dir(hass)
        thumb_path = thumb_dir / f"{thumbnail_id}.jpg"

        # Ensure the resolved path is within the thumbnails directory
        try:
            thumb_path = thumb_path.resolve()
            resolved_dir = thumb_dir.resolve()
            if not str(thumb_path).startswith(str(resolved_dir)):
                _LOGGER.warning("Path traversal attempt: %s", thumbnail_id)
                return web.Response(status=403, text="Forbidden")
        except (OSError, RuntimeError) as ex:
            _LOGGER.error("Error resolving thumbnail path: %s", ex)
            return web.Response(status=500, text="Server error")

        if not thumb_path.exists():
            return web.Response(status=404, text="Thumbnail not found")

        def read_thumb() -> bytes:
            return thumb_path.read_bytes()

        content = await hass.async_add_executor_job(read_thumb)

        return web.Response(
            body=content,
            content_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=86400"},
        )

    async def delete(self, request: web.Request, thumbnail_id: str) -> web.Response:
        """Delete a pending thumbnail from memory."""
        hass: HomeAssistant = request.app["hass"]

        if not thumbnail_id.isalnum():
            return web.Response(status=400, text="Invalid thumbnail ID")

        pending = _get_pending_thumbnails(hass)
        if thumbnail_id in pending:
            del pending[thumbnail_id]

        return web.Response(status=204)
