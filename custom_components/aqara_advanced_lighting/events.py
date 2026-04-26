"""HA bus event helpers for the integration.

This module is split out of `__init__.py` to avoid circular imports: the
managers (state_manager, sequence managers, dynamic_scene_manager,
entity_controller) all need to fire the running-operations-changed event
and would otherwise have to import from the package root.
"""

from homeassistant.core import HomeAssistant

from .const import EVENT_OPERATIONS_CHANGED

# Coalesce rapid-fire mutations within the same event-loop tick.
# Keyed by id(hass) so each HA instance has its own dedup flag.
# Per-hass pending-emit flag. Keyed by id(hass) so multiple HA instances in
# a single Python process (test harnesses) don't share state. Entries
# self-clear when their _emit() callback runs; in normal operation only one
# HA instance exists and the dict holds at most one entry.
_pending: dict[int, bool] = {}


def fire_operations_changed(hass: HomeAssistant) -> None:
    """Schedule a single operations-changed event after the current tick.

    Multiple calls within the same synchronous chain fire only one event.
    Subscribers receive no payload and must refetch via the GET endpoint
    `/api/aqara_advanced_lighting/running_operations`.
    """
    hass_id = id(hass)
    if _pending.get(hass_id):
        return
    _pending[hass_id] = True

    def _emit() -> None:
        _pending.pop(hass_id, None)
        try:
            hass.bus.async_fire(EVENT_OPERATIONS_CHANGED)
        except Exception:  # bus closed during shutdown
            pass

    hass.loop.call_soon(_emit)
