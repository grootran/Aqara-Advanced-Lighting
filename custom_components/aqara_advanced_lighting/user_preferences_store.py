"""Per-user preferences storage for Aqara Advanced Lighting."""

from __future__ import annotations

import logging
from typing import Any, TypedDict

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, MAX_COLOR_HISTORY_SIZE

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = f"{DOMAIN}.user_preferences"
STORAGE_VERSION = 1


class UserPreferences(TypedDict):
    """Per-user preferences."""

    color_history: list[dict[str, float]]
    sort_preferences: dict[str, str]
    collapsed_sections: dict[str, bool]


DEFAULT_PREFERENCES: UserPreferences = {
    "color_history": [],
    "sort_preferences": {},
    "collapsed_sections": {},
}


class UserPreferencesStore:
    """Manages per-user preferences storage, keyed by HA user ID."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the user preferences store."""
        self.hass = hass
        self._store: Store[dict[str, dict[str, Any]]] = Store(
            hass, STORAGE_VERSION, STORAGE_KEY
        )
        self._data: dict[str, UserPreferences] = {}

    async def async_load(self) -> None:
        """Load preferences from storage."""
        data = await self._store.async_load()
        if data is not None:
            self._data = data
        else:
            self._data = {}
        _LOGGER.debug("Loaded preferences for %d users", len(self._data))

    async def async_save(self) -> None:
        """Save preferences to storage."""
        await self._store.async_save(self._data)
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
    ) -> UserPreferences:
        """Partially update a user's preferences.

        Only the provided fields are updated. Omitted fields remain unchanged.

        Args:
            user_id: The Home Assistant user ID.
            color_history: New color history list, or None to leave unchanged.
            sort_preferences: New sort preferences, or None to leave unchanged.
            collapsed_sections: New collapsed section state, or None to leave unchanged.

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

        await self.async_save()

        _LOGGER.debug("Updated preferences for user %s", user_id)
        return self.get_preferences(user_id)
