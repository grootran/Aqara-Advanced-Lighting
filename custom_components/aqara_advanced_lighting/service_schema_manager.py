"""Dynamic service schema manager for preset dropdown population.

Updates service action dropdowns with both built-in and user-saved presets
at runtime, using the same mechanism as device trigger capabilities.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from copy import deepcopy
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.service import (
    async_get_all_descriptions,
    async_set_service_schema,
)

from .const import (
    DATA_PRESET_STORE,
    DOMAIN,
    MODEL_T1M_20_SEGMENT,
    MODEL_T1M_26_SEGMENT,
    MODEL_T1_STRIP,
    MODEL_T2_BULB_E26,
    MODEL_T2_BULB_E27,
    MODEL_T2_BULB_GU10_110V,
    MODEL_T2_BULB_GU10_230V,
    PRESET_TYPE_CCT_SEQUENCE,
    PRESET_TYPE_DYNAMIC_SCENE,
    PRESET_TYPE_EFFECT,
    PRESET_TYPE_SEGMENT_PATTERN,
    PRESET_TYPE_SEGMENT_SEQUENCE,
    SERVICE_SET_DYNAMIC_EFFECT,
    SERVICE_SET_SEGMENT_PATTERN,
    SERVICE_START_CCT_SEQUENCE,
    SERVICE_START_DYNAMIC_SCENE,
    SERVICE_START_SEGMENT_SEQUENCE,
)
from .presets import (
    CCT_SEQUENCE_PRESETS,
    DYNAMIC_SCENE_PRESETS,
    EFFECT_PRESETS,
    SEGMENT_PATTERN_PRESETS,
    SEGMENT_SEQUENCE_PRESETS,
)

_LOGGER = logging.getLogger(__name__)

# Map each service to its preset type and the built-in preset dictionary
_SERVICE_PRESET_CONFIG: dict[str, tuple[str, dict[str, Any]]] = {
    SERVICE_SET_DYNAMIC_EFFECT: (PRESET_TYPE_EFFECT, EFFECT_PRESETS),
    SERVICE_SET_SEGMENT_PATTERN: (PRESET_TYPE_SEGMENT_PATTERN, SEGMENT_PATTERN_PRESETS),
    SERVICE_START_CCT_SEQUENCE: (PRESET_TYPE_CCT_SEQUENCE, CCT_SEQUENCE_PRESETS),
    SERVICE_START_SEGMENT_SEQUENCE: (
        PRESET_TYPE_SEGMENT_SEQUENCE,
        SEGMENT_SEQUENCE_PRESETS,
    ),
    SERVICE_START_DYNAMIC_SCENE: (PRESET_TYPE_DYNAMIC_SCENE, DYNAMIC_SCENE_PRESETS),
}

# Device model sets for categorizing effect/pattern/sequence presets
_T2_MODELS = {
    MODEL_T2_BULB_E26, MODEL_T2_BULB_E27,
    MODEL_T2_BULB_GU10_110V, MODEL_T2_BULB_GU10_230V,
}
_T1M_MODELS = {MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT}

# Map preset type to the storage key used by PresetStore
_PRESET_TYPE_TO_STORAGE_KEY: dict[str, str] = {
    PRESET_TYPE_EFFECT: "effect_presets",
    PRESET_TYPE_SEGMENT_PATTERN: "segment_pattern_presets",
    PRESET_TYPE_CCT_SEQUENCE: "cct_sequence_presets",
    PRESET_TYPE_SEGMENT_SEQUENCE: "segment_sequence_presets",
    PRESET_TYPE_DYNAMIC_SCENE: "dynamic_scene_presets",
}


class ServiceSchemaManager:
    """Manages dynamic service schema updates for preset dropdowns.

    Reads the service descriptions already loaded from services.yaml,
    injects dynamic preset options (built-in + user-saved), and writes
    them back via async_set_service_schema.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the service schema manager."""
        self._hass = hass
        self._unregister_callback: Callable[[], None] | None = None

    async def async_setup(self) -> None:
        """Set up schema manager and register for preset change notifications."""
        preset_store = self._hass.data.get(DOMAIN, {}).get(DATA_PRESET_STORE)
        if preset_store:
            self._unregister_callback = preset_store.register_update_callback(
                self.async_update_service_schemas
            )

        await self.async_update_service_schemas()

    async def async_update_service_schemas(self) -> None:
        """Update all service schemas with current dynamic preset options."""
        try:
            descriptions = await async_get_all_descriptions(self._hass)
        except Exception:
            _LOGGER.exception("Failed to get service descriptions")
            return

        domain_descriptions = descriptions.get(DOMAIN)
        if not domain_descriptions:
            _LOGGER.debug(
                "No service descriptions found for %s, "
                "skipping schema update",
                DOMAIN,
            )
            return

        updated_count = 0
        for service_name, (preset_type, builtin_presets) in (
            _SERVICE_PRESET_CONFIG.items()
        ):
            service_desc = domain_descriptions.get(service_name)
            if not service_desc:
                continue

            options = self._build_preset_options(preset_type, builtin_presets)

            # Deep-copy to avoid mutating the cached description
            updated_desc = deepcopy(service_desc)

            # Set the full selector on the preset field explicitly
            # rather than navigating the existing structure, since
            # .get() defaults create disconnected dicts
            fields = updated_desc.get("fields", {})
            preset_field = fields.get("preset")
            if preset_field is None:
                continue

            preset_field["selector"] = {
                "select": {
                    "options": options,
                    "mode": "dropdown",
                    "custom_value": True,
                }
            }

            async_set_service_schema(
                self._hass, DOMAIN, service_name, updated_desc
            )
            updated_count += 1

        _LOGGER.debug(
            "Updated %d service schemas with dynamic preset options",
            updated_count,
        )

    def _build_preset_options(
        self, preset_type: str, builtin_presets: dict[str, Any]
    ) -> list[dict[str, str]]:
        """Build the full list of preset options combining built-in and user presets.

        Args:
            preset_type: The preset type identifier
            builtin_presets: Dictionary of built-in presets keyed by preset ID

        Returns:
            List of option dicts with "value" and "label" keys
        """
        options: list[dict[str, str]] = []

        for preset_key, preset_data in builtin_presets.items():
            label = self._get_device_label(
                preset_data["name"], preset_data.get("device_types"),
            )
            options.append({"value": preset_key, "label": label})

        preset_store = self._hass.data.get(DOMAIN, {}).get(DATA_PRESET_STORE)
        if preset_store:
            storage_key = _PRESET_TYPE_TO_STORAGE_KEY.get(preset_type)
            if storage_key:
                all_presets = preset_store.get_all_presets()
                for preset in all_presets.get(storage_key, []):
                    preset_name = preset.get("name")
                    if preset_name:
                        options.append({
                            "value": preset_name,
                            "label": f"{preset_name} (user)",
                        })

        return options

    @staticmethod
    def _get_device_label(
        name: str,
        device_types: list[str] | None,
    ) -> str:
        """Add a device type prefix when a preset targets a single device category.

        Presets compatible with multiple categories (e.g. both T1M and T1 Strip)
        get no prefix since they aren't device-specific.

        Args:
            name: The preset display name
            device_types: List of compatible device model IDs

        Returns:
            Label with device type prefix, or plain name
        """
        if not device_types:
            return name

        device_set = set(device_types)
        is_t2 = bool(device_set & _T2_MODELS)
        is_t1m = bool(device_set & _T1M_MODELS)
        is_strip = MODEL_T1_STRIP in device_set

        # Only prefix when targeting exactly one device category
        categories = sum([is_t2, is_t1m, is_strip])
        if categories != 1:
            return name

        if is_t2:
            return f"T2: {name}"
        if is_t1m:
            return f"T1M: {name}"
        if is_strip:
            return f"T1 Strip: {name}"

        return name
