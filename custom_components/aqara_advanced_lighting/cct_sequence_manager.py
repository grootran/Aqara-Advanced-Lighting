"""CCT Sequence Manager for Aqara Advanced Lighting."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from .base_sequence_manager import BaseSequenceManager
from .const import SEQUENCE_TYPE_CCT
from .models import CCTSequence

if TYPE_CHECKING:
    from .models import CCTSequenceStep

_LOGGER = logging.getLogger(__name__)


class CCTSequenceManager(BaseSequenceManager[CCTSequence]):
    """Manages CCT sequence execution as background tasks."""

    _sequence_type = SEQUENCE_TYPE_CCT

    # -- BaseSequenceManager hooks --

    def _get_start_step(
        self, sequence: CCTSequence, loops_executed: int
    ) -> int:
        """Skip first step on subsequent loops when skip_first_in_loop is set."""
        if (
            loops_executed > 0
            and sequence.skip_first_in_loop
            and len(sequence.steps) > 1
        ):
            _LOGGER.debug(
                "Skipping first step in loop %d (skip_first_in_loop=True)",
                loops_executed + 1,
            )
            return 1
        return 0

    async def _apply_step(
        self,
        entity_id: str,
        sequence: CCTSequence,
        step: Any,
        step_index: int,
        stop_event: asyncio.Event,
    ) -> bool:
        """Apply a single CCT step via the backend.

        Returns True if the step completed, False if interrupted.
        """
        cct_step: CCTSequenceStep = step

        _LOGGER.debug(
            "Executing step %d/%d for %s: %dK, brightness %d, transition %ss",
            step_index + 1,
            len(sequence.steps),
            entity_id,
            cct_step.color_temp,
            cct_step.brightness,
            cct_step.transition,
        )

        try:
            transition_completed = await self.backend.async_publish_cct_step(
                entity_id,
                cct_step.color_temp,
                cct_step.brightness,
                cct_step.transition,
                stop_event,
            )
            if not transition_completed:
                _LOGGER.debug("Transition interrupted for %s", entity_id)
                return False
        except Exception as ex:
            _LOGGER.warning(
                "Failed to apply CCT step %d for %s: %s",
                step_index + 1,
                entity_id,
                ex,
            )

        return True
