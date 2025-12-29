"""Config flow for Aqara Advanced Lighting integration."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.const import CONF_NAME
from homeassistant.helpers import config_validation as cv

from .const import CONF_Z2M_BASE_TOPIC, DEFAULT_Z2M_BASE_TOPIC, DOMAIN

_LOGGER = logging.getLogger(__name__)


class AqaraAdvancedLightingConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Aqara Advanced Lighting."""

    VERSION = 1
    MINOR_VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}

        # Only allow a single instance of this integration
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            # Verify MQTT integration is loaded by checking if mqtt service exists
            if not self.hass.services.has_service("mqtt", "publish"):
                errors["base"] = "mqtt_not_loaded"

            if not errors:
                # Create config entry
                return self.async_create_entry(
                    title="Aqara Advanced Lighting",
                    data={
                        CONF_Z2M_BASE_TOPIC: user_input.get(
                            CONF_Z2M_BASE_TOPIC, DEFAULT_Z2M_BASE_TOPIC
                        ),
                    },
                )

        # Show configuration form
        data_schema = vol.Schema(
            {
                vol.Optional(
                    CONF_Z2M_BASE_TOPIC, default=DEFAULT_Z2M_BASE_TOPIC
                ): cv.string,
            }
        )

        return self.async_show_form(
            step_id="user",
            data_schema=data_schema,
            errors=errors,
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle reconfiguration of the integration."""
        errors: dict[str, str] = {}
        entry = self._get_reconfigure_entry()

        if user_input is not None:
            # Verify MQTT integration is loaded by checking if mqtt service exists
            if not self.hass.services.has_service("mqtt", "publish"):
                errors["base"] = "mqtt_not_loaded"

            if not errors:
                # Update config entry
                return self.async_update_reload_and_abort(
                    entry,
                    data={
                        CONF_Z2M_BASE_TOPIC: user_input.get(
                            CONF_Z2M_BASE_TOPIC, DEFAULT_Z2M_BASE_TOPIC
                        ),
                    },
                )

        # Show reconfiguration form with current values
        data_schema = vol.Schema(
            {
                vol.Optional(
                    CONF_Z2M_BASE_TOPIC,
                    default=entry.data.get(CONF_Z2M_BASE_TOPIC, DEFAULT_Z2M_BASE_TOPIC),
                ): cv.string,
            }
        )

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=data_schema,
            errors=errors,
        )
