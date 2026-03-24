"""Service registration wiring for Aqara Advanced Lighting."""

import functools
import logging

import voluptuous as vol

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from ..const import (
    DOMAIN,
    SERVICE_CREATE_BLOCKS,
    SERVICE_CREATE_GRADIENT,
    SERVICE_PAUSE_CCT_SEQUENCE,
    SERVICE_PAUSE_DYNAMIC_SCENE,
    SERVICE_PAUSE_SEGMENT_SEQUENCE,
    SERVICE_RESUME_CCT_SEQUENCE,
    SERVICE_RESUME_DYNAMIC_SCENE,
    SERVICE_RESUME_ENTITY_CONTROL,
    SERVICE_RESUME_SEGMENT_SEQUENCE,
    SERVICE_SET_DYNAMIC_EFFECT,
    SERVICE_SET_MUSIC_SYNC,
    SERVICE_SET_SEGMENT_PATTERN,
    SERVICE_START_CCT_SEQUENCE,
    SERVICE_START_CIRCADIAN_MODE,
    SERVICE_START_DYNAMIC_SCENE,
    SERVICE_START_SEGMENT_SEQUENCE,
    SERVICE_STOP_CCT_SEQUENCE,
    SERVICE_STOP_CIRCADIAN_MODE,
    SERVICE_STOP_DYNAMIC_SCENE,
    SERVICE_STOP_EFFECT,
    SERVICE_STOP_SEGMENT_SEQUENCE,
)
from ._schemas import (
    SERVICE_CREATE_BLOCKS_SCHEMA,
    SERVICE_CREATE_GRADIENT_SCHEMA,
    SERVICE_PAUSE_CCT_SEQUENCE_SCHEMA,
    SERVICE_PAUSE_DYNAMIC_SCENE_SCHEMA,
    SERVICE_PAUSE_SEGMENT_SEQUENCE_SCHEMA,
    SERVICE_RESUME_CCT_SEQUENCE_SCHEMA,
    SERVICE_RESUME_DYNAMIC_SCENE_SCHEMA,
    SERVICE_RESUME_SEGMENT_SEQUENCE_SCHEMA,
    SERVICE_SET_DYNAMIC_EFFECT_SCHEMA,
    SERVICE_SET_MUSIC_SYNC_SCHEMA,
    SERVICE_SET_SEGMENT_PATTERN_SCHEMA,
    SERVICE_START_CCT_SEQUENCE_SCHEMA,
    SERVICE_START_CIRCADIAN_MODE_SCHEMA,
    SERVICE_START_DYNAMIC_SCENE_SCHEMA,
    SERVICE_START_SEGMENT_SEQUENCE_SCHEMA,
    SERVICE_STOP_CCT_SEQUENCE_SCHEMA,
    SERVICE_STOP_CIRCADIAN_MODE_SCHEMA,
    SERVICE_STOP_DYNAMIC_SCENE_SCHEMA,
    SERVICE_STOP_EFFECT_SCHEMA,
    SERVICE_STOP_SEGMENT_SEQUENCE_SCHEMA,
)
from .effects import handle_set_dynamic_effect, handle_stop_effect
from .segments import (
    handle_create_blocks,
    handle_create_gradient,
    handle_set_segment_pattern,
)
from .cct_sequence import (
    handle_pause_cct_sequence,
    handle_resume_cct_sequence,
    handle_start_cct_sequence,
    handle_stop_cct_sequence,
)
from .segment_sequence import (
    handle_pause_segment_sequence,
    handle_resume_segment_sequence,
    handle_start_segment_sequence,
    handle_stop_segment_sequence,
)
from .dynamic_scene import (
    handle_pause_dynamic_scene,
    handle_resume_dynamic_scene,
    handle_start_dynamic_scene,
    handle_stop_dynamic_scene,
)
from .music_sync import handle_set_music_sync
from .circadian import (
    handle_resume_entity_control,
    handle_start_circadian_mode,
    handle_stop_circadian_mode,
)

_LOGGER = logging.getLogger(__name__)

async def async_setup_services(hass: HomeAssistant) -> None:
    """Register all Aqara Advanced Lighting services."""
    _LOGGER.debug("Setting up Aqara Advanced Lighting services")

    def _register(service_name: str, handler, schema) -> None:
        hass.services.async_register(
            DOMAIN, service_name,
            functools.partial(handler, hass),
            schema=schema,
        )

    _register(SERVICE_SET_DYNAMIC_EFFECT, handle_set_dynamic_effect, SERVICE_SET_DYNAMIC_EFFECT_SCHEMA)
    _register(SERVICE_STOP_EFFECT, handle_stop_effect, SERVICE_STOP_EFFECT_SCHEMA)
    _register(SERVICE_SET_SEGMENT_PATTERN, handle_set_segment_pattern, SERVICE_SET_SEGMENT_PATTERN_SCHEMA)
    _register(SERVICE_CREATE_GRADIENT, handle_create_gradient, SERVICE_CREATE_GRADIENT_SCHEMA)
    _register(SERVICE_CREATE_BLOCKS, handle_create_blocks, SERVICE_CREATE_BLOCKS_SCHEMA)
    _register(SERVICE_START_CCT_SEQUENCE, handle_start_cct_sequence, SERVICE_START_CCT_SEQUENCE_SCHEMA)
    _register(SERVICE_STOP_CCT_SEQUENCE, handle_stop_cct_sequence, SERVICE_STOP_CCT_SEQUENCE_SCHEMA)
    _register(SERVICE_PAUSE_CCT_SEQUENCE, handle_pause_cct_sequence, SERVICE_PAUSE_CCT_SEQUENCE_SCHEMA)
    _register(SERVICE_RESUME_CCT_SEQUENCE, handle_resume_cct_sequence, SERVICE_RESUME_CCT_SEQUENCE_SCHEMA)
    _register(SERVICE_START_SEGMENT_SEQUENCE, handle_start_segment_sequence, SERVICE_START_SEGMENT_SEQUENCE_SCHEMA)
    _register(SERVICE_STOP_SEGMENT_SEQUENCE, handle_stop_segment_sequence, SERVICE_STOP_SEGMENT_SEQUENCE_SCHEMA)
    _register(SERVICE_PAUSE_SEGMENT_SEQUENCE, handle_pause_segment_sequence, SERVICE_PAUSE_SEGMENT_SEQUENCE_SCHEMA)
    _register(SERVICE_RESUME_SEGMENT_SEQUENCE, handle_resume_segment_sequence, SERVICE_RESUME_SEGMENT_SEQUENCE_SCHEMA)
    _register(SERVICE_START_DYNAMIC_SCENE, handle_start_dynamic_scene, SERVICE_START_DYNAMIC_SCENE_SCHEMA)
    _register(SERVICE_STOP_DYNAMIC_SCENE, handle_stop_dynamic_scene, SERVICE_STOP_DYNAMIC_SCENE_SCHEMA)
    _register(SERVICE_PAUSE_DYNAMIC_SCENE, handle_pause_dynamic_scene, SERVICE_PAUSE_DYNAMIC_SCENE_SCHEMA)
    _register(SERVICE_RESUME_DYNAMIC_SCENE, handle_resume_dynamic_scene, SERVICE_RESUME_DYNAMIC_SCENE_SCHEMA)
    _register(SERVICE_SET_MUSIC_SYNC, handle_set_music_sync, SERVICE_SET_MUSIC_SYNC_SCHEMA)
    _register(SERVICE_START_CIRCADIAN_MODE, handle_start_circadian_mode, SERVICE_START_CIRCADIAN_MODE_SCHEMA)
    _register(SERVICE_STOP_CIRCADIAN_MODE, handle_stop_circadian_mode, SERVICE_STOP_CIRCADIAN_MODE_SCHEMA)

    # resume_entity_control has an inline schema (not in _schemas.py)
    hass.services.async_register(
        DOMAIN,
        SERVICE_RESUME_ENTITY_CONTROL,
        functools.partial(handle_resume_entity_control, hass),
        schema=vol.Schema({vol.Required(ATTR_ENTITY_ID): cv.entity_ids}),
    )

    _LOGGER.info("Aqara Advanced Lighting services registered")
