"""Panel registration and data endpoints for Aqara Advanced Lighting."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING, Any

from aiohttp import web

from homeassistant.components import frontend
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

if TYPE_CHECKING:
    from .favorites_store import FavoritesStore
    from .preset_store import PresetStore

from .const import (
    CCT_SEQUENCE_PRESETS,
    DATA_FAVORITES_STORE,
    DATA_PRESET_STORE,
    DOMAIN,
    EFFECT_PRESETS,
    MODEL_T1M_20_SEGMENT,
    MODEL_T1M_26_SEGMENT,
    MODEL_T1_STRIP,
    MODEL_T2_BULB_E26,
    MODEL_T2_BULB_E27,
    MODEL_T2_BULB_GU10_110V,
    MODEL_T2_BULB_GU10_230V,
    SEGMENT_PATTERN_PRESETS,
    SEGMENT_SEQUENCE_PRESETS,
    VALID_PRESET_TYPES,
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

    # Register version endpoint
    hass.http.register_view(VersionView)

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

        icons_dir = Path(
            hass.config.path(f"custom_components/{DOMAIN}/frontend/icons")
        )
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
        if any(model in device_types for model in [MODEL_T2_BULB_E26, MODEL_T2_BULB_E27, MODEL_T2_BULB_GU10_110V, MODEL_T2_BULB_GU10_230V]):
            category = "t2_bulb"
        elif any(model in device_types for model in [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT]):
            category = "t1m"
        elif MODEL_T1_STRIP in device_types:
            category = "t1_strip"
        else:
            continue

        dynamic_effects[category].append({
            "id": preset_id,
            "name": preset_data["name"],
            "icon": preset_data.get("icon"),
            "effect": preset_data["effect"],
            "speed": preset_data["speed"],
            "brightness": preset_data.get("brightness"),
            "colors": preset_data["colors"],
            "device_types": device_types,
        })

    # Build segment patterns
    segment_patterns = []
    for preset_id, preset_data in SEGMENT_PATTERN_PRESETS.items():
        segment_patterns.append({
            "id": preset_id,
            "name": preset_data["name"],
            "icon": preset_data.get("icon"),
            "segments": preset_data["segments"],
            "device_types": preset_data.get("device_types", []),
        })

    # Build CCT sequences
    cct_sequences = []
    for preset_id, preset_data in CCT_SEQUENCE_PRESETS.items():
        cct_sequences.append({
            "id": preset_id,
            "name": preset_data["name"],
            "icon": preset_data.get("icon"),
            "steps": preset_data["steps"],
            "loop_mode": preset_data["loop_mode"],
            "loop_count": preset_data.get("loop_count"),
            "end_behavior": preset_data["end_behavior"],
        })

    # Build segment sequences
    segment_sequences = []
    for preset_id, preset_data in SEGMENT_SEQUENCE_PRESETS.items():
        segment_sequences.append({
            "id": preset_id,
            "name": preset_data["name"],
            "icon": preset_data.get("icon"),
            "steps": preset_data["steps"],
            "loop_mode": preset_data["loop_mode"],
            "loop_count": preset_data.get("loop_count"),
            "end_behavior": preset_data["end_behavior"],
        })

    return {
        "dynamic_effects": dynamic_effects,
        "segment_patterns": segment_patterns,
        "cct_sequences": cct_sequences,
        "segment_sequences": segment_sequences,
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

        name = data.get("name")  # Optional custom name

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


def _get_preset_store(hass: HomeAssistant) -> PresetStore | None:
    """Get the preset store from hass.data."""
    if DOMAIN not in hass.data:
        return None
    return hass.data[DOMAIN].get(DATA_PRESET_STORE)


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

        preset_store = _get_preset_store(hass)
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

        preset_store = _get_preset_store(hass)
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

        preset_store = _get_preset_store(hass)
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

        preset_store = _get_preset_store(hass)
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

        preset_store = _get_preset_store(hass)
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

        preset_store = _get_preset_store(hass)
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


class VersionView(HomeAssistantView):
    """View to get the integration version."""

    url = f"/api/{DOMAIN}/version"
    name = f"api:{DOMAIN}:version"
    requires_auth = False

    async def get(self, request: web.Request) -> web.Response:
        """Get the integration version from manifest.json."""
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
            return web.json_response({"version": version})
        except (OSError, ValueError) as ex:
            _LOGGER.error("Error reading manifest: %s", ex)
            return web.Response(status=500, text="Error reading manifest")
