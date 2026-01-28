"""Config flow for Aqara Advanced Lighting integration."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import voluptuous as vol

from homeassistant.components import mqtt
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers import config_validation as cv

from .const import CONF_Z2M_BASE_TOPIC, DEFAULT_Z2M_BASE_TOPIC, DOMAIN

_LOGGER = logging.getLogger(__name__)

# Timeout for Z2M bridge validation (seconds)
Z2M_VALIDATION_TIMEOUT = 5


class AqaraAdvancedLightingConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Aqara Advanced Lighting."""

    VERSION = 1
    MINOR_VERSION = 1

    async def _validate_z2m_base_topic(self, base_topic: str) -> bool:
        """Validate that a Zigbee2MQTT instance exists at the given base topic.

        Subscribes to the bridge/state topic and waits for a message.
        Returns True if Z2M responds, False otherwise.
        """
        message_received = asyncio.Event()

        def message_callback(msg: mqtt.ReceiveMessage) -> None:
            """Handle received MQTT message."""
            _LOGGER.debug(
                "Received Z2M bridge message on %s: %s",
                msg.topic,
                msg.payload[:100] if msg.payload else "(empty)",
            )
            # Use thread-safe method since callback may run in different thread
            self.hass.loop.call_soon_threadsafe(message_received.set)

        # Subscribe to bridge/state topic
        state_topic = f"{base_topic}/bridge/state"
        _LOGGER.debug("Validating Z2M base topic by subscribing to %s", state_topic)

        try:
            unsubscribe = await mqtt.async_subscribe(
                self.hass, state_topic, message_callback, qos=0
            )
        except Exception as ex:
            _LOGGER.warning("Failed to subscribe to %s: %s", state_topic, ex)
            return False

        try:
            # Wait for a message with timeout
            await asyncio.wait_for(
                message_received.wait(),
                timeout=Z2M_VALIDATION_TIMEOUT,
            )
            return True
        except TimeoutError:
            _LOGGER.debug(
                "No response from Z2M at %s within %s seconds",
                base_topic,
                Z2M_VALIDATION_TIMEOUT,
            )
            return False
        finally:
            # Always unsubscribe
            unsubscribe()

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            z2m_base_topic = user_input.get(
                CONF_Z2M_BASE_TOPIC, DEFAULT_Z2M_BASE_TOPIC
            )

            # Use base topic as unique_id to prevent duplicate instances
            await self.async_set_unique_id(z2m_base_topic)
            self._abort_if_unique_id_configured()

            # Verify MQTT integration is loaded by checking if mqtt service exists
            if not self.hass.services.has_service("mqtt", "publish"):
                errors["base"] = "mqtt_not_loaded"

            # Validate Z2M base topic exists
            if not errors:
                if not await self._validate_z2m_base_topic(z2m_base_topic):
                    errors["base"] = "z2m_not_found"

            if not errors:
                return self.async_create_entry(
                    title=f"Aqara Lighting ({z2m_base_topic})",
                    data={
                        CONF_Z2M_BASE_TOPIC: z2m_base_topic,
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
            z2m_base_topic = user_input.get(
                CONF_Z2M_BASE_TOPIC, DEFAULT_Z2M_BASE_TOPIC
            )

            # Check if new base topic conflicts with another entry (not this one)
            for existing_entry in self._async_current_entries():
                if (
                    existing_entry.entry_id != entry.entry_id
                    and existing_entry.unique_id == z2m_base_topic
                ):
                    errors["base"] = "duplicate_base_topic"
                    break

            # Verify MQTT integration is loaded by checking if mqtt service exists
            if not self.hass.services.has_service("mqtt", "publish"):
                errors["base"] = "mqtt_not_loaded"

            # Validate Z2M base topic exists
            if not errors:
                if not await self._validate_z2m_base_topic(z2m_base_topic):
                    errors["base"] = "z2m_not_found"

            if not errors:
                return self.async_update_reload_and_abort(
                    entry,
                    title=f"Aqara Lighting ({z2m_base_topic})",
                    unique_id=z2m_base_topic,
                    data={
                        CONF_Z2M_BASE_TOPIC: z2m_base_topic,
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
