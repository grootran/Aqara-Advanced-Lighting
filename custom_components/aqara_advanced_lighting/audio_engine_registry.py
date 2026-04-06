"""Central registry for tracking active AudioEngine instances.

Prevents orphaned engines by providing lookup-by-sensor so callers
can stop conflicting engines before starting new ones.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .audio_engine import AudioEngine

_LOGGER = logging.getLogger(__name__)


class AudioEngineRegistry:
    """Tracks all active AudioEngine instances for conflict resolution.

    Engines register themselves on start() and unregister on stop().
    Callers use get_engines_for_sensor() or stop_engines_for_sensor()
    to find and clean up conflicting engines before starting new ones.
    """

    def __init__(self) -> None:
        # All active engines, keyed by id(engine) for O(1) removal
        self._engines: dict[int, AudioEngine] = {}

    def register(self, engine: AudioEngine) -> None:
        """Register an active engine."""
        self._engines[id(engine)] = engine

    def unregister(self, engine: AudioEngine) -> None:
        """Unregister an engine (idempotent)."""
        self._engines.pop(id(engine), None)

    def get_engines_for_sensor(
        self, audio_entity: str, consumer_type: str
    ) -> list[AudioEngine]:
        """Find all active engines using a specific sensor and consumer type."""
        return [
            e for e in self._engines.values()
            if e.config.audio_entity == audio_entity
            and e.config.consumer_type == consumer_type
        ]

    async def stop_engines_for_sensor(
        self,
        audio_entity: str,
        consumer_type: str,
        exclude: AudioEngine | None = None,
    ) -> int:
        """Stop all engines using a sensor/type, optionally excluding one.

        Returns the number of engines stopped.
        """
        to_stop = [
            e for e in self.get_engines_for_sensor(audio_entity, consumer_type)
            if e is not exclude
        ]
        for engine in to_stop:
            _LOGGER.info(
                "Stopping conflicting %s engine on %s",
                consumer_type, audio_entity,
            )
            try:
                await engine.stop()
            except Exception:
                _LOGGER.warning(
                    "Failed to stop conflicting engine on %s",
                    audio_entity, exc_info=True,
                )
            self.unregister(engine)
        return len(to_stop)

    def all_active(self) -> list[AudioEngine]:
        """Return all active engines."""
        return list(self._engines.values())

    async def stop_all(self) -> None:
        """Stop all active engines (used during integration unload)."""
        for engine in list(self._engines.values()):
            try:
                await engine.stop()
            except Exception:
                _LOGGER.warning("Failed to stop engine during shutdown", exc_info=True)
        self._engines.clear()
