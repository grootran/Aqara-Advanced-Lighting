"""Favorites storage for Aqara Advanced Lighting."""

import logging
import uuid
from typing import TypedDict

from homeassistant.core import HomeAssistant

from .base_store import BaseStore
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = f"{DOMAIN}.favorites"
STORAGE_VERSION = 1

class Favorite(TypedDict):
    """A favorite entity group."""

    id: str
    name: str
    entities: list[str]

class FavoritesStore(BaseStore[dict[str, list[Favorite]]]):
    """Manages per-user favorite entities storage."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the favorites store."""
        super().__init__(hass, STORAGE_VERSION, STORAGE_KEY, {})

    def get_favorites(self, user_id: str) -> list[Favorite]:
        """Get favorites for a user.

        Args:
            user_id: The Home Assistant user ID

        Returns:
            List of favorite groups for the user
        """
        return self._data.get(user_id, [])

    async def set_favorites(self, user_id: str, favorites: list[Favorite]) -> None:
        """Set all favorites for a user.

        Args:
            user_id: The Home Assistant user ID
            favorites: List of favorite groups to set
        """
        self._data[user_id] = favorites
        await self.async_save()

    async def add_favorite(
        self,
        user_id: str,
        entities: list[str],
        name: str | None = None,
    ) -> Favorite:
        """Add a new favorite for a user.

        Args:
            user_id: The Home Assistant user ID
            entities: List of entity IDs to save as favorite
            name: Optional custom name for the favorite

        Returns:
            The created favorite
        """
        if user_id not in self._data:
            self._data[user_id] = []

        # Generate default name from entity IDs if not provided
        if name is None:
            if len(entities) == 1:
                # Use friendly name for single entity
                state = self.hass.states.get(entities[0])
                if state:
                    name = state.attributes.get("friendly_name", entities[0])
                else:
                    name = entities[0].split(".")[-1].replace("_", " ").title()
            else:
                # Use count for groups
                name = f"{len(entities)} lights"

        favorite: Favorite = {
            "id": str(uuid.uuid4()),
            "name": name,
            "entities": entities,
        }

        self._data[user_id].append(favorite)
        await self.async_save()

        _LOGGER.debug("Added favorite '%s' for user %s", name, user_id)
        return favorite

    async def update_favorite(
        self,
        user_id: str,
        favorite_id: str,
        name: str | None = None,
        entities: list[str] | None = None,
    ) -> Favorite | None:
        """Update an existing favorite.

        Args:
            user_id: The Home Assistant user ID
            favorite_id: The favorite ID to update
            name: New name (optional)
            entities: New entity list (optional)

        Returns:
            The updated favorite, or None if not found
        """
        favorites = self._data.get(user_id, [])
        for favorite in favorites:
            if favorite["id"] == favorite_id:
                if name is not None:
                    favorite["name"] = name
                if entities is not None:
                    favorite["entities"] = entities
                await self.async_save()
                _LOGGER.debug("Updated favorite %s for user %s", favorite_id, user_id)
                return favorite
        return None

    async def remove_favorite(self, user_id: str, favorite_id: str) -> bool:
        """Remove a favorite for a user.

        Args:
            user_id: The Home Assistant user ID
            favorite_id: The favorite ID to remove

        Returns:
            True if removed, False if not found
        """
        if user_id not in self._data:
            return False

        original_length = len(self._data[user_id])
        self._data[user_id] = [
            f for f in self._data[user_id] if f["id"] != favorite_id
        ]

        if len(self._data[user_id]) < original_length:
            await self.async_save()
            _LOGGER.debug("Removed favorite %s for user %s", favorite_id, user_id)
            return True

        return False

    async def reorder_favorites(
        self, user_id: str, favorite_ids: list[str]
    ) -> list[Favorite]:
        """Reorder favorites for a user.

        Args:
            user_id: The Home Assistant user ID
            favorite_ids: List of favorite IDs in desired order

        Returns:
            The reordered list of favorites
        """
        if user_id not in self._data:
            return []

        # Build a map of id -> favorite
        favorites_map = {f["id"]: f for f in self._data[user_id]}

        # Reorder based on provided IDs
        reordered = []
        for fav_id in favorite_ids:
            if fav_id in favorites_map:
                reordered.append(favorites_map[fav_id])

        # Add any favorites not in the provided list at the end
        for favorite in self._data[user_id]:
            if favorite["id"] not in favorite_ids:
                reordered.append(favorite)

        self._data[user_id] = reordered
        await self.async_save()

        return reordered
