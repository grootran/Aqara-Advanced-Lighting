"""Per-user preferences storage for Aqara Advanced Lighting."""

from __future__ import annotations

import logging
from typing import Any, TypedDict

from homeassistant.core import HomeAssistant

from .base_store import BaseStore
from .const import DOMAIN, MAX_COLOR_HISTORY_SIZE

_LOGGER = logging.getLogger(__name__)



class _Unset:
    """Sentinel for distinguishing 'not provided' from None."""

_UNSET = _Unset()

STORAGE_KEY = f"{DOMAIN}.user_preferences"
STORAGE_VERSION = 1


class UserPreferences(TypedDict):
    """Per-user preferences."""

    color_history: list[dict[str, float]]
    sort_preferences: dict[str, str]
    collapsed_sections: dict[str, bool]
    include_all_lights: bool
    favorite_presets: list[dict[str, str]]
    static_scene_mode: bool
    distribution_mode_override: str | None
    brightness_override: int | None


DEFAULT_PREFERENCES: UserPreferences = {
    "color_history": [],
    "sort_preferences": {},
    "collapsed_sections": {},
    "include_all_lights": False,
    "favorite_presets": [],
    "static_scene_mode": False,
    "distribution_mode_override": None,
    "brightness_override": None,
}

GLOBAL_PREFERENCES_KEY = "__global__"


class GlobalPreferences(TypedDict):
    """Integration-wide preferences (not per-user)."""

    ignore_external_changes: bool
    software_transition_entities: list[str]
    override_control_mode: str


DEFAULT_GLOBAL_PREFERENCES: GlobalPreferences = {
    "ignore_external_changes": False,
    "software_transition_entities": [],
    "override_control_mode": "pause_all",
}


class UserPreferencesStore(BaseStore[dict[str, UserPreferences]]):
    """Manages per-user preferences storage, keyed by HA user ID."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the user preferences store."""
        super().__init__(hass, STORAGE_VERSION, STORAGE_KEY, {})
        self._global_data: GlobalPreferences = {**DEFAULT_GLOBAL_PREFERENCES}

    async def async_load(self) -> None:
        """Load preferences from storage, extracting global prefs from reserved key."""
        data = await self._store.async_load()
        if data is not None:
            self._data = data
            raw_global = self._data.pop(GLOBAL_PREFERENCES_KEY, None)
            if raw_global and isinstance(raw_global, dict):
                self._global_data = {
                    "ignore_external_changes": raw_global.get(
                        "ignore_external_changes", False
                    ),
                    "software_transition_entities": raw_global.get(
                        "software_transition_entities", []
                    ),
                    "override_control_mode": raw_global.get(
                        "override_control_mode",
                        DEFAULT_GLOBAL_PREFERENCES["override_control_mode"],
                    ),
                }
            else:
                self._global_data = {**DEFAULT_GLOBAL_PREFERENCES}
        else:
            self._data = {}
            self._global_data = {**DEFAULT_GLOBAL_PREFERENCES}
        _LOGGER.debug("Loaded preferences for %d users", len(self._data))

    async def async_save(self) -> None:
        """Save preferences to storage, merging global prefs into reserved key."""
        save_data = {**self._data, GLOBAL_PREFERENCES_KEY: self._global_data}
        await self._store.async_save(save_data)
        _LOGGER.debug("Saved user preferences")

    def get_preferences(self, user_id: str) -> UserPreferences:
        """Get preferences for a user.

        Args:
            user_id: The Home Assistant user ID.

        Returns:
            User preferences or defaults for new users.
        """
        if user_id in self._data:
            # Ensure all keys are present (handles forward compatibility)
            prefs = self._data[user_id]
            return {
                "color_history": prefs.get("color_history", []),
                "sort_preferences": prefs.get("sort_preferences", {}),
                "collapsed_sections": prefs.get("collapsed_sections", {}),
                "include_all_lights": prefs.get("include_all_lights", False),
                "favorite_presets": prefs.get("favorite_presets", []),
                "static_scene_mode": prefs.get("static_scene_mode", False),
                "distribution_mode_override": prefs.get("distribution_mode_override"),
                "brightness_override": prefs.get("brightness_override"),
            }
        return {**DEFAULT_PREFERENCES}

    async def update_color_history(
        self, user_id: str, color_history: list[dict[str, float]]
    ) -> UserPreferences:
        """Replace the user's color history.

        The frontend sends the full list after each change. The backend
        just persists it, trimming to the maximum size.

        Args:
            user_id: The Home Assistant user ID.
            color_history: Full color history list, most recent first.

        Returns:
            The updated preferences.
        """
        if user_id not in self._data:
            self._data[user_id] = {**DEFAULT_PREFERENCES}

        # Trim to max size
        self._data[user_id]["color_history"] = color_history[:MAX_COLOR_HISTORY_SIZE]
        await self.async_save()

        _LOGGER.debug(
            "Updated color history for user %s (%d colors)",
            user_id,
            len(self._data[user_id]["color_history"]),
        )
        return self.get_preferences(user_id)

    async def update_sort_preferences(
        self, user_id: str, sort_preferences: dict[str, str]
    ) -> UserPreferences:
        """Replace the user's sort preferences.

        Args:
            user_id: The Home Assistant user ID.
            sort_preferences: Section ID to sort option mapping.

        Returns:
            The updated preferences.
        """
        if user_id not in self._data:
            self._data[user_id] = {**DEFAULT_PREFERENCES}

        self._data[user_id]["sort_preferences"] = sort_preferences
        await self.async_save()

        _LOGGER.debug("Updated sort preferences for user %s", user_id)
        return self.get_preferences(user_id)

    async def update_preferences(
        self,
        user_id: str,
        color_history: list[dict[str, float]] | None = None,
        sort_preferences: dict[str, str] | None = None,
        collapsed_sections: dict[str, bool] | None = None,
        include_all_lights: bool | None = None,
        favorite_presets: list[dict[str, str]] | None = None,
        static_scene_mode: bool | None = None,
        distribution_mode_override: str | None | _Unset = _UNSET,
        brightness_override: int | None | _Unset = _UNSET,
    ) -> UserPreferences:
        """Partially update a user's preferences.

        Only the provided fields are updated. Omitted fields remain unchanged.

        Args:
            user_id: The Home Assistant user ID.
            color_history: New color history list, or None to leave unchanged.
            sort_preferences: New sort preferences, or None to leave unchanged.
            collapsed_sections: New collapsed section state, or None to leave unchanged.
            include_all_lights: Whether to show all lights in selector, or None to leave unchanged.
            favorite_presets: Favorite preset references, or None to leave unchanged.
            static_scene_mode: Whether to apply scenes statically, or None to leave unchanged.
            distribution_mode_override: Distribution mode override string, None to clear, or _UNSET to leave unchanged.
            brightness_override: Brightness override value (1-100), None to clear, or _UNSET to leave unchanged.

        Returns:
            The full updated preferences.
        """
        if user_id not in self._data:
            self._data[user_id] = {**DEFAULT_PREFERENCES}

        if color_history is not None:
            self._data[user_id]["color_history"] = color_history[
                :MAX_COLOR_HISTORY_SIZE
            ]

        if sort_preferences is not None:
            self._data[user_id]["sort_preferences"] = sort_preferences

        if collapsed_sections is not None:
            self._data[user_id]["collapsed_sections"] = collapsed_sections

        if include_all_lights is not None:
            self._data[user_id]["include_all_lights"] = include_all_lights

        if favorite_presets is not None:
            self._data[user_id]["favorite_presets"] = favorite_presets

        if static_scene_mode is not None:
            self._data[user_id]["static_scene_mode"] = static_scene_mode

        if not isinstance(distribution_mode_override, _Unset):
            self._data[user_id]["distribution_mode_override"] = distribution_mode_override

        if not isinstance(brightness_override, _Unset):
            self._data[user_id]["brightness_override"] = brightness_override

        await self.async_save()

        _LOGGER.debug("Updated preferences for user %s", user_id)
        return self.get_preferences(user_id)

    def get_global_preferences(self) -> GlobalPreferences:
        """Get integration-wide global preferences."""
        return {**self._global_data}

    def get_global_preference(self, key: str) -> Any:
        """Get a single global preference value."""
        return self._global_data.get(key, DEFAULT_GLOBAL_PREFERENCES.get(key))

    async def update_global_preferences(
        self,
        ignore_external_changes: bool | None = None,
        software_transition_entities: list[str] | None = None,
        override_control_mode: str | None = None,
    ) -> GlobalPreferences:
        """Update integration-wide global preferences.

        Only provided fields are updated. Omitted fields remain unchanged.
        """
        if ignore_external_changes is not None:
            self._global_data["ignore_external_changes"] = ignore_external_changes

        if software_transition_entities is not None:
            self._global_data["software_transition_entities"] = software_transition_entities

        if override_control_mode is not None:
            self._global_data["override_control_mode"] = override_control_mode

        await self.async_save()
        _LOGGER.debug("Updated global preferences")
        return self.get_global_preferences()
