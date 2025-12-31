"""MQTT client for Zigbee2MQTT communication."""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components import mqtt
from homeassistant.components.light import DOMAIN as LIGHT_DOMAIN
from homeassistant.const import CONF_MODEL
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.device_registry import CONNECTION_NETWORK_MAC, format_mac
from homeassistant.helpers.typing import UNDEFINED

from .const import (
    DOMAIN,
    MODEL_T1M_20_SEGMENT,
    MODEL_T1M_26_SEGMENT,
    MODEL_T1_STRIP,
    MODEL_T2_BULB_E26,
    MODEL_T2_BULB_E27,
    MODEL_T2_BULB_GU10_110V,
    MODEL_T2_BULB_GU10_230V,
    PAYLOAD_EFFECT,
    PAYLOAD_EFFECT_COLORS,
    PAYLOAD_EFFECT_SEGMENTS,
    PAYLOAD_EFFECT_SPEED,
    PAYLOAD_SEGMENT_COLORS,
    TOPIC_Z2M_BRIDGE_DEVICES,
    TOPIC_Z2M_DEVICE_SET,
)
from .models import DynamicEffect, SegmentColor, Z2MDevice

if TYPE_CHECKING:
    from homeassistant.components.mqtt import ReceiveMessage

    from .models import AqaraLightingConfigEntry

_LOGGER = logging.getLogger(__name__)

# Supported Aqara light models
SUPPORTED_MODELS = {
    MODEL_T1M_20_SEGMENT,
    MODEL_T1M_26_SEGMENT,
    MODEL_T1_STRIP,
    MODEL_T2_BULB_E26,
    MODEL_T2_BULB_E27,
    MODEL_T2_BULB_GU10_110V,
    MODEL_T2_BULB_GU10_230V,
}


class MQTTClient:
    """MQTT client for communicating with Zigbee2MQTT."""

    def __init__(
        self, hass: HomeAssistant, entry: AqaraLightingConfigEntry
    ) -> None:
        """Initialize the MQTT client."""
        self.hass = hass
        self.entry = entry
        self._subscriptions: list[mqtt.SubscriptionState] = []

    async def async_setup(self) -> None:
        """Set up MQTT subscriptions."""
        z2m_base_topic = self.entry.runtime_data.z2m_base_topic

        # Subscribe to Z2M bridge devices for device discovery
        bridge_topic = f"{z2m_base_topic}/{TOPIC_Z2M_BRIDGE_DEVICES}"
        _LOGGER.debug("Subscribing to Z2M bridge devices: %s", bridge_topic)

        subscription = await mqtt.async_subscribe(
            self.hass, bridge_topic, self._handle_bridge_devices
        )
        self._subscriptions.append(subscription)

    async def async_teardown(self) -> None:
        """Tear down MQTT subscriptions."""
        for subscription in self._subscriptions:
            subscription()
        self._subscriptions.clear()

    @callback
    def _handle_bridge_devices(self, msg: ReceiveMessage) -> None:
        """Handle bridge devices message from Z2M."""
        try:
            devices = json.loads(msg.payload)
            _LOGGER.debug("Received Z2M devices: %s", len(devices))

            # Update device registry in runtime data
            for device_data in devices:
                # Extract device information
                ieee_address = device_data.get("ieee_address")
                friendly_name = device_data.get("friendly_name")
                model_id = device_data.get("model_id")
                manufacturer = device_data.get("manufacturer")

                if not all([ieee_address, friendly_name, model_id]):
                    continue

                # Only store supported Aqara light models
                if model_id not in SUPPORTED_MODELS:
                    _LOGGER.debug(
                        "Skipping unsupported device %s (model: %s)",
                        friendly_name,
                        model_id,
                    )
                    continue

                # Create Z2M device object
                z2m_device = Z2MDevice(
                    ieee_address=ieee_address,
                    friendly_name=friendly_name,
                    model_id=model_id,
                    manufacturer=manufacturer or "Unknown",
                )

                # Store in runtime data
                self.entry.runtime_data.devices[ieee_address] = z2m_device
                _LOGGER.debug(
                    "Stored supported Aqara device %s (model: %s)",
                    friendly_name,
                    model_id,
                )

            # Update entity to Z2M mapping
            self._update_entity_mapping()

        except (json.JSONDecodeError, KeyError) as ex:
            _LOGGER.error("Failed to parse bridge devices message: %s", ex)

    def _update_entity_mapping(self) -> None:
        """Update mapping between HA entity IDs and Z2M friendly names."""
        ent_reg = er.async_get(self.hass)
        dev_reg = dr.async_get(self.hass)
        runtime_data = self.entry.runtime_data

        # Clear existing mapping
        runtime_data.entity_to_z2m_map.clear()

        # Iterate through all light entities
        for entity_entry in ent_reg.entities.values():
            if entity_entry.domain != LIGHT_DOMAIN:
                continue

            # Check if entity has an IEEE address we know about
            if not entity_entry.unique_id:
                continue

            # Try to match by IEEE address in unique_id
            for ieee_address, z2m_device in runtime_data.devices.items():
                if ieee_address in entity_entry.unique_id:
                    runtime_data.entity_to_z2m_map[entity_entry.entity_id] = (
                        z2m_device.friendly_name
                    )
                    _LOGGER.debug(
                        "Mapped entity %s to Z2M device %s",
                        entity_entry.entity_id,
                        z2m_device.friendly_name,
                    )

                    # Register device in device registry
                    self._register_device(dev_reg, z2m_device, entity_entry)
                    break

    def _register_device(
        self,
        dev_reg: dr.DeviceRegistry,
        z2m_device: Z2MDevice,
        entity_entry: er.RegistryEntry,
    ) -> None:
        """Register or update device in device registry.

        Note: Only supported Aqara models reach this method as filtering
        happens in _handle_bridge_devices.
        """
        # Create device identifiers
        identifiers = {(DOMAIN, z2m_device.ieee_address)}

        # Add MAC address connection if available (format IEEE address as MAC)
        connections = set()
        if z2m_device.ieee_address:
            # IEEE address is typically in format like "0x00158d0001234567"
            # Convert to MAC format
            mac = z2m_device.ieee_address.replace("0x", "").upper()
            if len(mac) == 16:  # Valid IEEE address length
                # Format as MAC address (XX:XX:XX:XX:XX:XX:XX:XX)
                formatted_mac = ":".join(mac[i : i + 2] for i in range(0, len(mac), 2))
                connections.add((CONNECTION_NETWORK_MAC, format_mac(formatted_mac)))

        # Register or update device
        device = dev_reg.async_get_or_create(
            config_entry_id=self.entry.entry_id,
            identifiers=identifiers,
            connections=connections,
            manufacturer=z2m_device.manufacturer,
            model=z2m_device.model_id,
            name=z2m_device.friendly_name,
        )

        _LOGGER.debug(
            "Registered device %s (model: %s, manufacturer: %s)",
            z2m_device.friendly_name,
            z2m_device.model_id,
            z2m_device.manufacturer,
        )

    def get_z2m_friendly_name(self, entity_id: str) -> str | None:
        """Get Z2M friendly name for a Home Assistant entity ID."""
        return self.entry.runtime_data.entity_to_z2m_map.get(entity_id)

    async def async_publish_dynamic_effect(
        self, z2m_friendly_name: str, effect: DynamicEffect, brightness: int | None = None
    ) -> None:
        """Publish dynamic effect to Z2M device.

        IMPORTANT: Payload order matters per Z2M requirements.
        Order: effect, effect_speed, effect_colors, [effect_segments]

        Brightness must be sent as a separate command AFTER the effect.
        """
        topic = f"{self.entry.runtime_data.z2m_base_topic}/{z2m_friendly_name}/set"
        payload = effect.to_mqtt_payload()

        _LOGGER.debug(
            "Publishing dynamic effect to %s: %s", z2m_friendly_name, payload
        )

        # Send effect command
        await mqtt.async_publish(self.hass, topic, json.dumps(payload))

        # Send brightness as separate command if specified
        if brightness is not None:
            brightness_payload = {"brightness": brightness}
            _LOGGER.debug(
                "Publishing brightness to %s: %s", z2m_friendly_name, brightness_payload
            )
            await mqtt.async_publish(self.hass, topic, json.dumps(brightness_payload))

    async def async_publish_segment_pattern(
        self, z2m_friendly_name: str, segment_colors: list[SegmentColor], brightness: int | None = None
    ) -> None:
        """Publish segment pattern to Z2M device.

        For T1M devices, brightness is sent as a separate command.
        For T1 Strip, brightness is embedded in the segment_colors payload.
        """
        topic = f"{self.entry.runtime_data.z2m_base_topic}/{z2m_friendly_name}/set"

        # Build segment_colors payload
        payload = {
            PAYLOAD_SEGMENT_COLORS: [sc.to_dict() for sc in segment_colors],
        }

        _LOGGER.debug(
            "Publishing segment pattern to %s: %s", z2m_friendly_name, payload
        )

        # Send segment pattern command
        await mqtt.async_publish(self.hass, topic, json.dumps(payload))

        # Send brightness as separate command for T1M (T1 Strip has brightness embedded)
        if brightness is not None:
            brightness_payload = {"brightness": brightness}
            _LOGGER.debug(
                "Publishing brightness to %s: %s", z2m_friendly_name, brightness_payload
            )
            await mqtt.async_publish(self.hass, topic, json.dumps(brightness_payload))

    async def async_turn_off_effect(self, z2m_friendly_name: str) -> None:
        """Turn off effect on Z2M device."""
        topic = f"{self.entry.runtime_data.z2m_base_topic}/{z2m_friendly_name}/set"

        # Send effect "off" or empty effect to stop effects
        payload = {PAYLOAD_EFFECT: "off"}

        _LOGGER.debug("Turning off effect on %s", z2m_friendly_name)

        await mqtt.async_publish(self.hass, topic, json.dumps(payload))

    async def async_restore_state(
        self, z2m_friendly_name: str, state_data: dict[str, Any]
    ) -> None:
        """Restore previous state to Z2M device."""
        topic = f"{self.entry.runtime_data.z2m_base_topic}/{z2m_friendly_name}/set"

        _LOGGER.debug(
            "Restoring state for %s: %s", z2m_friendly_name, state_data
        )

        await mqtt.async_publish(self.hass, topic, json.dumps(state_data))
