"""Base storage class for Aqara Advanced Lighting.

Provides shared load/save/init infrastructure for all persistent stores.
Subclasses provide domain-specific methods and can override async_load()
or async_save() when they need migration or custom serialization logic.
"""

import logging
from typing import Any, Generic, TypeVar

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

_LOGGER = logging.getLogger(__name__)

DataT = TypeVar("DataT")

class BaseStore(Generic[DataT]):
    """Generic persistent store with HA storage backend.

    Provides:
    - Store initialization with version and key
    - Default async_load() that falls back to a default value
    - Default async_save() that persists _data
    - Shared hass and _data attributes

    Subclasses should set STORAGE_KEY, STORAGE_VERSION, and call
    super().__init__() with their default data value.
    """

    def __init__(
        self,
        hass: HomeAssistant,
        storage_version: int,
        storage_key: str,
        default_data: DataT,
    ) -> None:
        """Initialize the store.

        Args:
            hass: Home Assistant instance
            storage_version: Storage schema version
            storage_key: Unique key for persistent storage
            default_data: Default value when storage is empty
        """
        self.hass = hass
        self._store: Store[Any] = Store(hass, storage_version, storage_key)
        self._data: DataT = default_data

    async def async_load(self) -> None:
        """Load data from persistent storage.

        Falls back to the current _data value (set at init) if storage
        is empty. Subclasses can override for migration or custom logic.
        """
        data = await self._store.async_load()
        if data is not None:
            self._data = data
        _LOGGER.debug(
            "%s: loaded from storage", self.__class__.__name__
        )

    async def async_save(self) -> None:
        """Save current data to persistent storage.

        Subclasses can override to transform data before saving
        (e.g. merging in extra state).
        """
        await self._store.async_save(self._data)
        _LOGGER.debug("%s: saved to storage", self.__class__.__name__)
