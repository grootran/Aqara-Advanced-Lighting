"""Zigbee2MQTT backend implementing the DeviceBackend protocol."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components import mqtt
from homeassistant.components.light import DOMAIN as LIGHT_DOMAIN
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr, entity_registry as er

from .const import (
    DOMAIN,
    MODEL_FRIENDLY_NAMES,
    MODEL_T1M_20_SEGMENT,
    MODEL_T1M_26_SEGMENT,
    MODEL_T1_STRIP,
    MODEL_T2_BULB_E26,
    MODEL_T2_BULB_E27,
    MODEL_T2_BULB_GU10_110V,
    MODEL_T2_BULB_GU10_230V,
    MODEL_T2_CCT_E26,
    MODEL_T2_CCT_E27,
    MODEL_T2_CCT_GU10_110V,
    MODEL_T2_CCT_GU10_230V,
    PAYLOAD_AUDIO,
    PAYLOAD_AUDIO_EFFECT,
    PAYLOAD_AUDIO_SENSITIVITY,
    PAYLOAD_SEGMENT_COLORS,
    TOPIC_Z2M_BRIDGE_DEVICES,
)
from .models import AqaraDevice, DynamicEffect, SegmentColor, Z2MDevice

if TYPE_CHECKING:
    from homeassistant.components.mqtt import ReceiveMessage

    from .entity_controller import EntityController
    from .models import AqaraLightingConfigEntry

_LOGGER = logging.getLogger(__name__)


def _ease_in_out_cubic(t: float) -> float:
    """Cubic easing function for smooth transitions.

    Args:
        t: Progress from 0.0 to 1.0

    Returns:
        Eased value from 0.0 to 1.0
    """
    if t < 0.5:
        return 4 * t * t * t
    return 1 - pow(-2 * t + 2, 3) / 2


# Supported Aqara light models
SUPPORTED_MODELS = {
    MODEL_T1M_20_SEGMENT,
    MODEL_T1M_26_SEGMENT,
    MODEL_T1_STRIP,
    MODEL_T2_BULB_E26,
    MODEL_T2_BULB_E27,
    MODEL_T2_BULB_GU10_110V,
    MODEL_T2_BULB_GU10_230V,
    MODEL_T2_CCT_E26,
    MODEL_T2_CCT_E27,
    MODEL_T2_CCT_GU10_110V,
    MODEL_T2_CCT_GU10_230V,
}


class MQTTBackend:
    """Zigbee2MQTT backend implementing the DeviceBackend protocol."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry: AqaraLightingConfigEntry,
        entity_controller: EntityController | None = None,
    ) -> None:
        """Initialize the Z2M MQTT backend."""
        self.hass = hass
        self.entry = entry
        self._entity_controller = entity_controller
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

        # Request current devices list from Z2M
        await self.async_request_devices()

    async def async_teardown(self) -> None:
        """Tear down MQTT subscriptions."""
        for subscription in self._subscriptions:
            subscription()
        self._subscriptions.clear()

    async def async_request_devices(self) -> None:
        """Request current devices list from Z2M.

        Z2M will respond by publishing to bridge/devices topic.
        """
        z2m_base_topic = self.entry.runtime_data.z2m_base_topic
        request_topic = f"{z2m_base_topic}/bridge/request/devices"

        _LOGGER.debug("Requesting devices list from Z2M: %s", request_topic)

        # Send empty payload to request devices
        await mqtt.async_publish(self.hass, request_topic, "")

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

                # Store in runtime data (keyed by IEEE and by friendly name)
                self.entry.runtime_data.devices[ieee_address] = z2m_device
                self.entry.runtime_data.devices_by_name[friendly_name] = z2m_device

                # Also populate the backend-agnostic aqara_devices dict
                self.entry.runtime_data.aqara_devices[ieee_address] = AqaraDevice(
                    identifier=ieee_address,
                    name=friendly_name,
                    model_id=model_id,
                    manufacturer=manufacturer or "Aqara",
                    backend_type="z2m",
                )

                _LOGGER.debug(
                    "Stored supported Aqara device %s (model: %s)",
                    friendly_name,
                    model_id,
                )

                # Register device in HA device registry. We use a two-step
                # approach: first look for the existing MQTT device by the
                # identifier Z2M uses, and if found, add our config entry
                # to it. This avoids a device registry issue where passing
                # multiple identifiers that match different existing devices
                # only finds the first match, creating duplicates.
                z2m_base_topic = self.entry.runtime_data.z2m_base_topic
                mqtt_identifier = ("mqtt", f"{z2m_base_topic}_{ieee_address}")
                our_identifier = (DOMAIN, ieee_address)
                device_registry = dr.async_get(self.hass)
                existing_mqtt = device_registry.async_get_device(
                    identifiers={mqtt_identifier},
                )
                if existing_mqtt:
                    # Add our config entry to the existing MQTT device
                    device_registry.async_get_or_create(
                        config_entry_id=self.entry.entry_id,
                        identifiers={mqtt_identifier},
                    )
                    # Add our identifier so device triggers can find it
                    device_registry.async_update_device(
                        existing_mqtt.id,
                        merge_identifiers={our_identifier},
                    )
                    _LOGGER.debug(
                        "Merged %s into existing MQTT device %s",
                        friendly_name,
                        existing_mqtt.id,
                    )
                else:
                    # MQTT device not found yet - create with both
                    # identifiers. When MQTT discovers this device later,
                    # it will find ours by the shared mqtt identifier.
                    device = device_registry.async_get_or_create(
                        config_entry_id=self.entry.entry_id,
                        identifiers={our_identifier, mqtt_identifier},
                        name=friendly_name,
                        manufacturer=manufacturer or "Aqara",
                        model=MODEL_FRIENDLY_NAMES.get(model_id, model_id),
                        model_id=model_id,
                    )
                    _LOGGER.debug(
                        "Created new device for %s (%s), MQTT device "
                        "will merge on discovery",
                        friendly_name,
                        device.id,
                    )

            # Update entity to Z2M mapping
            self._update_entity_mapping()

        except (json.JSONDecodeError, KeyError) as ex:
            _LOGGER.error("Failed to parse bridge devices message: %s", ex)

    def _update_entity_mapping(self) -> None:
        """Update mapping between HA entity IDs and Z2M friendly names.

        Uses multiple strategies to find entity-to-device mappings:
        1. IEEE address in entity unique_id
        2. Device registry connections (MAC/IEEE)
        3. Device name matching Z2M friendly name
        4. Entity ID pattern matching friendly name
        """
        from homeassistant.helpers import device_registry as dr
        from homeassistant.helpers.device_registry import CONNECTION_NETWORK_MAC, format_mac

        ent_reg = er.async_get(self.hass)
        dev_reg = dr.async_get(self.hass)
        runtime_data = self.entry.runtime_data

        # Clear existing mappings
        runtime_data.entity_to_z2m_map.clear()
        runtime_data.entity_mapping_methods.clear()

        # Build lookup tables for alternative matching strategies
        ieee_to_device = runtime_data.devices.copy()

        # Create MAC-based lookup (IEEE address formatted as MAC)
        mac_to_device: dict[str, Z2MDevice] = {}
        for ieee_address, z2m_device in ieee_to_device.items():
            mac = ieee_address.replace("0x", "").lower()
            if len(mac) == 16:
                # Format as MAC and also store without colons
                formatted_mac = ":".join(mac[i : i + 2] for i in range(0, len(mac), 2))
                mac_to_device[format_mac(formatted_mac)] = z2m_device
                mac_to_device[mac] = z2m_device  # Also store raw format

        # Create friendly name lookup (normalized)
        friendly_name_to_device: dict[str, Z2MDevice] = {}
        for z2m_device in ieee_to_device.values():
            # Normalize: lowercase, replace spaces with underscores
            normalized = z2m_device.friendly_name.lower().replace(" ", "_")
            friendly_name_to_device[normalized] = z2m_device
            # Also store original for exact matching
            friendly_name_to_device[z2m_device.friendly_name.lower()] = z2m_device

        # Log available Z2M devices for debugging
        _LOGGER.info(
            "Starting entity mapping with %d Z2M devices: %s",
            len(ieee_to_device),
            [d.friendly_name for d in ieee_to_device.values()],
        )

        # Log all light entities in HA for debugging
        all_light_entities = [
            (e.entity_id, e.unique_id, e.device_id)
            for e in ent_reg.entities.values()
            if e.domain == LIGHT_DOMAIN
        ]
        _LOGGER.debug(
            "All light entities in HA: %s",
            all_light_entities,
        )

        # Iterate through all light entities
        mapped_count = 0
        for entity_entry in ent_reg.entities.values():
            if entity_entry.domain != LIGHT_DOMAIN:
                continue

            matched_device: Z2MDevice | None = None
            match_method: str = ""

            # Strategy 1: IEEE address in unique_id
            if entity_entry.unique_id:
                for ieee_address, z2m_device in ieee_to_device.items():
                    if ieee_address in entity_entry.unique_id:
                        matched_device = z2m_device
                        match_method = "unique_id"
                        break

            # Strategy 2: Device registry connections (MAC/IEEE)
            if matched_device is None and entity_entry.device_id:
                device = dev_reg.async_get(entity_entry.device_id)
                if device and device.connections:
                    for conn_type, conn_value in device.connections:
                        if conn_type == CONNECTION_NETWORK_MAC:
                            normalized_mac = format_mac(conn_value)
                            if normalized_mac in mac_to_device:
                                matched_device = mac_to_device[normalized_mac]
                                match_method = "device_connection"
                                break

            # Strategy 3: Device name matching Z2M friendly name
            if matched_device is None and entity_entry.device_id:
                device = dev_reg.async_get(entity_entry.device_id)
                if device and device.name:
                    normalized_name = device.name.lower().replace(" ", "_")
                    if normalized_name in friendly_name_to_device:
                        matched_device = friendly_name_to_device[normalized_name]
                        match_method = "device_name"
                    elif device.name.lower() in friendly_name_to_device:
                        matched_device = friendly_name_to_device[device.name.lower()]
                        match_method = "device_name"

            # Strategy 4: Entity ID pattern matching friendly name
            # Only use this fallback for entities from MQTT platform (Z2M integration)
            if matched_device is None:
                # Check if entity is from MQTT platform (typical for Z2M)
                is_mqtt_entity = entity_entry.platform == "mqtt"

                if is_mqtt_entity:
                    # Extract name part from entity_id (e.g., "light.living_room" -> "living_room")
                    entity_name = entity_entry.entity_id.split(".", 1)[-1]
                    if entity_name in friendly_name_to_device:
                        matched_device = friendly_name_to_device[entity_name]
                        match_method = "entity_id"
                        _LOGGER.debug(
                            "Strategy 4 match for %s (mqtt platform entity)",
                            entity_entry.entity_id,
                        )
                else:
                    # Log why Strategy 4 was skipped for non-MQTT entities
                    entity_name = entity_entry.entity_id.split(".", 1)[-1]
                    if entity_name in friendly_name_to_device:
                        _LOGGER.debug(
                            "Skipping Strategy 4 match for %s: entity platform is '%s' not 'mqtt'",
                            entity_entry.entity_id,
                            entity_entry.platform,
                        )

            # If we found a match, update the mapping
            if matched_device is not None:
                runtime_data.entity_to_z2m_map[entity_entry.entity_id] = (
                    matched_device.friendly_name
                )
                # Store the mapping method for diagnostics
                runtime_data.entity_mapping_methods[entity_entry.entity_id] = match_method
                # Also update the global entity routing map for fast instance lookup
                # Must access the actual dict in hass.data, not a copy
                if DOMAIN in self.hass.data and "entity_routing" in self.hass.data[DOMAIN]:
                    self.hass.data[DOMAIN]["entity_routing"][entity_entry.entity_id] = self.entry.entry_id
                mapped_count += 1
                _LOGGER.debug(
                    "Mapped entity %s to Z2M device %s (via %s)",
                    entity_entry.entity_id,
                    matched_device.friendly_name,
                    match_method,
                )
            else:
                # Log unmapped entities for debugging
                _LOGGER.debug(
                    "Could not map light entity %s (unique_id: %s)",
                    entity_entry.entity_id,
                    entity_entry.unique_id,
                )

        _LOGGER.info(
            "Entity mapping complete: mapped %d entities to Z2M devices",
            mapped_count,
        )

        # Log which Z2M devices got mapped and which didn't
        mapped_z2m_names = set(runtime_data.entity_to_z2m_map.values())
        all_z2m_names = set(d.friendly_name for d in ieee_to_device.values())
        unmapped_z2m_devices = all_z2m_names - mapped_z2m_names
        if unmapped_z2m_devices:
            _LOGGER.warning(
                "Z2M devices without matching HA entities: %s",
                list(unmapped_z2m_devices),
            )
        _LOGGER.info(
            "entity_to_z2m_map contents: %s",
            dict(runtime_data.entity_to_z2m_map),
        )

        # Mark entity mapping as ready so the frontend can detect setup completion
        runtime_data.entity_mapping_ready = True

    def get_z2m_friendly_name(self, entity_id: str) -> str | None:
        """Get Z2M friendly name for a Home Assistant entity ID."""
        return self.entry.runtime_data.entity_to_z2m_map.get(entity_id)

    def is_entity_supported(self, entity_id: str) -> tuple[bool, str]:
        """Check if entity is a supported Aqara device.

        Args:
            entity_id: The Home Assistant entity ID

        Returns:
            Tuple of (is_supported, reason_if_not_supported)
        """
        # Check if entity is mapped to Z2M device
        z2m_name = self.get_z2m_friendly_name(entity_id)
        if not z2m_name:
            return False, "not_mapped_to_z2m"

        # Find the device by friendly name
        device = self.entry.runtime_data.devices_by_name.get(z2m_name)
        if not device:
            return False, "z2m_device_not_found"

        # Check if device model is supported
        if device.model_id not in SUPPORTED_MODELS:
            return False, f"unsupported_model_{device.model_id}"

        return True, ""

    def _get_base_topic(self, z2m_base_topic: str | None = None) -> str:
        """Get the Z2M base topic, using override if provided.

        Args:
            z2m_base_topic: Optional custom Z2M base topic override

        Returns:
            The Z2M base topic to use
        """
        return z2m_base_topic if z2m_base_topic else self.entry.runtime_data.z2m_base_topic

    async def async_publish_dynamic_effect(
        self,
        z2m_friendly_name: str,
        effect: DynamicEffect,
        z2m_base_topic: str | None = None,
    ) -> None:
        """Publish dynamic effect to Z2M device.

        Payload key order is device-dependent (T2 requires speed before
        colors, T1M/T1 Strip benefit from colors before speed).

        Note: Brightness should be set using Home Assistant light.turn_on service,
        not via MQTT, as Z2M converters don't accept brightness with effect commands.

        Args:
            z2m_friendly_name: The Z2M device friendly name
            effect: The dynamic effect to publish
            z2m_base_topic: Optional custom Z2M base topic override
        """
        base_topic = self._get_base_topic(z2m_base_topic)
        topic = f"{base_topic}/{z2m_friendly_name}/set"

        # Look up device model for payload ordering
        device = self.entry.runtime_data.devices_by_name.get(z2m_friendly_name)
        device_model = device.model_id if device else None
        payload = effect.to_mqtt_payload(device_model)

        _LOGGER.debug(
            "Publishing dynamic effect to %s: %s", z2m_friendly_name, payload
        )

        # Send effect command
        await mqtt.async_publish(self.hass, topic, json.dumps(payload))

    async def async_publish_segment_pattern(
        self,
        z2m_friendly_name: str,
        segment_colors: list[SegmentColor],
        z2m_base_topic: str | None = None,
    ) -> None:
        """Publish segment pattern to Z2M device.

        Note: Brightness should be set using Home Assistant light.turn_on service,
        not via MQTT. For T1 Strip, brightness is embedded in segment_colors.

        Args:
            z2m_friendly_name: The Z2M device friendly name
            segment_colors: List of segment colors to set
            z2m_base_topic: Optional custom Z2M base topic override
        """
        base_topic = self._get_base_topic(z2m_base_topic)
        topic = f"{base_topic}/{z2m_friendly_name}/set"

        # Build segment_colors payload
        payload = {
            PAYLOAD_SEGMENT_COLORS: [sc.to_dict() for sc in segment_colors],
        }

        _LOGGER.debug(
            "Publishing segment pattern to %s: %s", z2m_friendly_name, payload
        )

        # Send segment pattern command
        await mqtt.async_publish(self.hass, topic, json.dumps(payload))

    async def async_turn_off_effect(
        self,
        z2m_friendly_name: str,
        z2m_base_topic: str | None = None,
    ) -> None:
        """Turn off effect on Z2M device.

        For Aqara RGB lights, effects are stopped by sending a solid RGB color
        to override the dynamic effect. We send a neutral warm white RGB color.

        Args:
            z2m_friendly_name: The Z2M device friendly name
            z2m_base_topic: Optional custom Z2M base topic override
        """
        base_topic = self._get_base_topic(z2m_base_topic)
        topic = f"{base_topic}/{z2m_friendly_name}/set"

        # Send a neutral warm white RGB color to override the effect
        # This stops the dynamic effect and puts the light in solid color mode
        # Using warm white (255, 200, 150) as a neutral default
        payload = {"color": {"r": 255, "g": 200, "b": 150}}

        _LOGGER.debug("Stopping effect on %s by setting solid RGB color", z2m_friendly_name)

        await mqtt.async_publish(self.hass, topic, json.dumps(payload))

    async def async_publish_batch_effects(
        self,
        entities_effects: list[tuple[str, DynamicEffect]],
        z2m_base_topic: str | None = None,
    ) -> None:
        """Publish dynamic effects to multiple devices in parallel.

        Args:
            entities_effects: List of (z2m_friendly_name, effect) tuples
            z2m_base_topic: Optional custom Z2M base topic override
        """
        _LOGGER.debug(
            "Publishing effects to %d devices in parallel", len(entities_effects)
        )

        tasks = [
            self.async_publish_dynamic_effect(z2m_name, effect, z2m_base_topic)
            for z2m_name, effect in entities_effects
        ]

        await asyncio.gather(*tasks, return_exceptions=True)

    async def async_publish_batch_segments(
        self,
        entities_segments: list[tuple[str, list[SegmentColor]]],
        z2m_base_topic: str | None = None,
    ) -> None:
        """Publish segment patterns to multiple devices in parallel.

        Args:
            entities_segments: List of (z2m_friendly_name, segment_colors) tuples
            z2m_base_topic: Optional custom Z2M base topic override
        """
        _LOGGER.debug(
            "Publishing segment patterns to %d devices in parallel",
            len(entities_segments),
        )

        tasks = [
            self.async_publish_segment_pattern(z2m_name, segments, z2m_base_topic)
            for z2m_name, segments in entities_segments
        ]

        await asyncio.gather(*tasks, return_exceptions=True)

    async def async_publish_cct_step(
        self,
        entity_id: str,
        color_temp_kelvin: int,
        brightness: int,
        transition: float,
        stop_event: asyncio.Event | None = None,
        z2m_base_topic: str | None = None,  # noqa: ARG002 - kept for API compatibility
    ) -> bool:
        """Apply CCT step to light entity using HA light service.

        Uses Home Assistant's light.turn_on service which properly interfaces
        with standard Zigbee clusters (genLevelCtrl, lightingColorCtrl). This
        avoids "No converter available" errors from Z2M custom converters.

        Args:
            entity_id: The Home Assistant light entity ID
            color_temp_kelvin: Target color temperature in kelvin (2700-6500)
            brightness: Target brightness level (1-255)
            transition: Transition time in seconds
            stop_event: Optional event to signal transition should be interrupted
            z2m_base_topic: Unused, kept for API compatibility

        Returns:
            True if transition completed, False if interrupted by stop_event
        """
        _LOGGER.info(
            "Applying CCT step to %s: %dK, brightness %d, transition %ss",
            entity_id,
            color_temp_kelvin,
            brightness,
            transition,
        )

        # Use HA light service for CCT control - this properly interfaces with
        # standard Zigbee clusters (genLevelCtrl, lightingColorCtrl) and avoids
        # "No converter available" errors from Z2M custom converters
        await self._apply_cct_values_via_service(
            entity_id, color_temp_kelvin, brightness, transition
        )

        # Wait for transition to complete (interruptible)
        if stop_event is not None and transition > 0:
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=transition)
                # Stop event was set - transition was interrupted
                _LOGGER.debug("Transition interrupted for %s", entity_id)
                return False
            except asyncio.TimeoutError:
                # Normal - transition completed
                pass
        elif transition > 0:
            await asyncio.sleep(transition)

        _LOGGER.debug("Transition complete for %s", entity_id)
        return True

    async def async_set_t2_transition_curve(
        self,
        z2m_friendly_name: str,
        curvature: float = 2.5,
        z2m_base_topic: str | None = None,
    ) -> None:
        """Set transition curve curvature for T2 bulbs.

        T2 bulbs support hardware easing curves for natural-feeling transitions.
        Curvature values: 0.2-1 (fast to slow), 1 (uniform), 1-6 (slow to fast)
        For natural ease-in-out, use 2-3 range.

        Args:
            z2m_friendly_name: Z2M friendly name for the T2 device
            curvature: Transition curve curvature (0.2-6, default 2.5 for natural easing)
            z2m_base_topic: Optional custom Z2M base topic override
        """
        base_topic = self._get_base_topic(z2m_base_topic)
        topic = f"{base_topic}/{z2m_friendly_name}/set"
        payload = {"transition_curve_curvature": curvature}

        _LOGGER.debug(
            "Setting T2 transition curve curvature for %s: %.1f",
            z2m_friendly_name,
            curvature,
        )

        await mqtt.async_publish(self.hass, topic, json.dumps(payload))

    async def _apply_cct_values_via_z2m(
        self,
        z2m_friendly_name: str,
        color_temp_kelvin: int,
        brightness: int,
        transition: float,
        z2m_base_topic: str | None = None,
    ) -> None:
        """Apply CCT values directly via Z2M MQTT with hardware transition.

        Sends commands directly to Z2M with the transition parameter for smooth
        hardware-accelerated transitions.

        Args:
            z2m_friendly_name: Z2M friendly name for the device
            color_temp_kelvin: Color temperature in kelvin (2700-6500)
            brightness: Brightness level (1-255)
            transition: Transition time in seconds
            z2m_base_topic: Optional custom Z2M base topic override
        """
        # Build Z2M topic
        base_topic = self._get_base_topic(z2m_base_topic)
        topic = f"{base_topic}/{z2m_friendly_name}/set"

        # Convert kelvin to mireds for Z2M (mired = 1,000,000 / kelvin)
        color_temp_mired = int(1_000_000 / color_temp_kelvin)

        # Build payload with brightness, color_temp, and transition
        payload: dict[str, Any] = {
            "brightness": brightness,
            "color_temp": color_temp_mired,
        }

        # Add transition parameter (Z2M expects seconds)
        if transition > 0:
            payload["transition"] = transition

        _LOGGER.debug(
            "Sending CCT command to Z2M %s: %s (topic: %s)",
            z2m_friendly_name,
            payload,
            topic,
        )

        # Send command to Z2M
        await mqtt.async_publish(self.hass, topic, json.dumps(payload))

    async def _apply_cct_values_via_service(
        self,
        entity_id: str,
        color_temp_kelvin: int,
        brightness: int,
        transition: float | None = None,
    ) -> None:
        """Apply color temperature and brightness values via HA light service.

        Uses HA light service which properly interfaces with standard Zigbee
        clusters (genLevelCtrl, lightingColorCtrl) without hitting custom converters.

        Args:
            entity_id: The Home Assistant light entity ID
            color_temp_kelvin: Color temperature in kelvin (2700-6500)
            brightness: Brightness level (1-255)
            transition: Optional transition time in seconds for smooth hardware transitions
        """
        service_data: dict[str, Any] = {
            "entity_id": entity_id,
            "color_temp_kelvin": color_temp_kelvin,
            "brightness": brightness,
        }

        # Add transition if specified - this uses the light's hardware transition capability
        if transition is not None:
            service_data["transition"] = transition

        context = None
        if self._entity_controller:
            self._entity_controller.record_command(entity_id)
            context = self._entity_controller.create_context()

        _LOGGER.debug("Setting CCT values via HA service: %s", service_data)
        await self.hass.services.async_call(
            "light",
            "turn_on",
            service_data,
            blocking=True,
            context=context,
        )

    async def async_turn_off_light(self, entity_id: str) -> None:
        """Turn off light using HA light service.

        Args:
            entity_id: The Home Assistant light entity ID
        """
        context = (
            self._entity_controller.create_context()
            if self._entity_controller
            else None
        )

        _LOGGER.debug("Turning off light %s via HA service", entity_id)

        await self.hass.services.async_call(
            "light",
            "turn_off",
            {"entity_id": entity_id},
            blocking=True,
            context=context,
        )

    # --- DeviceBackend protocol methods ---
    # These methods accept entity_id and resolve Z2M names internally,
    # matching the DeviceBackend protocol interface.

    async def async_shutdown(self) -> None:
        """Shut down the backend and clean up resources."""
        await self.async_teardown()

    @property
    def entity_mapping_ready(self) -> bool:
        """Whether entity-to-device mapping has completed."""
        return self.entry.runtime_data.entity_mapping_ready

    def get_device_for_entity(self, entity_id: str) -> AqaraDevice | None:
        """Get the Aqara device for a Home Assistant entity.

        Args:
            entity_id: The Home Assistant entity ID

        Returns:
            AqaraDevice if found, None otherwise
        """
        z2m_name = self.get_z2m_friendly_name(entity_id)
        if not z2m_name:
            return None

        z2m_device = self.entry.runtime_data.devices_by_name.get(z2m_name)
        if not z2m_device:
            return None

        return self.entry.runtime_data.aqara_devices.get(
            z2m_device.ieee_address
        )

    def get_all_devices(self) -> dict[str, AqaraDevice]:
        """Get all discovered Aqara devices.

        Returns:
            Dictionary of identifier -> AqaraDevice
        """
        return dict(self.entry.runtime_data.aqara_devices)

    async def async_send_effect(
        self,
        entity_id: str,
        effect: DynamicEffect,
    ) -> None:
        """Send a dynamic effect to a device via the protocol interface.

        Resolves entity_id to Z2M friendly name internally.

        Args:
            entity_id: The Home Assistant entity ID
            effect: The dynamic effect to apply
        """
        z2m_name = self.get_z2m_friendly_name(entity_id)
        if not z2m_name:
            _LOGGER.warning("Cannot send effect: entity %s not mapped", entity_id)
            return
        await self.async_publish_dynamic_effect(z2m_name, effect)

    async def async_send_batch_effects(
        self,
        entity_effects: list[tuple[str, DynamicEffect]],
    ) -> None:
        """Send dynamic effects to multiple devices via the protocol interface.

        Resolves entity_ids to Z2M friendly names internally.

        Args:
            entity_effects: List of (entity_id, effect) tuples
        """
        z2m_effects: list[tuple[str, DynamicEffect]] = []
        for entity_id, effect in entity_effects:
            z2m_name = self.get_z2m_friendly_name(entity_id)
            if z2m_name:
                z2m_effects.append((z2m_name, effect))
            else:
                _LOGGER.warning(
                    "Skipping effect for unmapped entity %s", entity_id
                )
        if z2m_effects:
            await self.async_publish_batch_effects(z2m_effects)

    async def async_stop_effect(self, entity_id: str) -> None:
        """Stop the active effect on a device via the protocol interface.

        Args:
            entity_id: The Home Assistant entity ID
        """
        z2m_name = self.get_z2m_friendly_name(entity_id)
        if not z2m_name:
            _LOGGER.warning("Cannot stop effect: entity %s not mapped", entity_id)
            return
        await self.async_turn_off_effect(z2m_name)

    async def async_send_segment_pattern(
        self,
        entity_id: str,
        segments: list[SegmentColor],
    ) -> None:
        """Send a segment color pattern via the protocol interface.

        Resolves entity_id to Z2M friendly name internally.

        Args:
            entity_id: The Home Assistant entity ID
            segments: List of segment color assignments
        """
        z2m_name = self.get_z2m_friendly_name(entity_id)
        if not z2m_name:
            _LOGGER.warning(
                "Cannot send segments: entity %s not mapped", entity_id
            )
            return
        await self.async_publish_segment_pattern(z2m_name, segments)

    async def async_send_batch_segments(
        self,
        entity_segments: list[tuple[str, list[SegmentColor]]],
    ) -> None:
        """Send segment patterns to multiple devices via the protocol interface.

        Resolves entity_ids to Z2M friendly names internally.

        Args:
            entity_segments: List of (entity_id, segment_colors) tuples
        """
        z2m_segments: list[tuple[str, list[SegmentColor]]] = []
        for entity_id, segs in entity_segments:
            z2m_name = self.get_z2m_friendly_name(entity_id)
            if z2m_name:
                z2m_segments.append((z2m_name, segs))
            else:
                _LOGGER.warning(
                    "Skipping segments for unmapped entity %s", entity_id
                )
        if z2m_segments:
            await self.async_publish_batch_segments(z2m_segments)

    async def async_set_transition_curve(
        self,
        entity_id: str,
        curvature: float,
    ) -> None:
        """Set transition curve curvature via the protocol interface.

        Args:
            entity_id: The Home Assistant entity ID
            curvature: Transition curve curvature (0.2-6)
        """
        z2m_name = self.get_z2m_friendly_name(entity_id)
        if not z2m_name:
            _LOGGER.warning(
                "Cannot set transition curve: entity %s not mapped", entity_id
            )
            return
        await self.async_set_t2_transition_curve(z2m_name, curvature)

    async def async_publish_music_sync(
        self,
        z2m_friendly_name: str,
        enabled: bool,
        sensitivity: str,
        effect: str,
        z2m_base_topic: str | None = None,
    ) -> None:
        """Publish music sync configuration to Z2M device.

        Args:
            z2m_friendly_name: The Z2M device friendly name
            enabled: Whether to enable or disable audio mode
            sensitivity: Audio sensitivity ("low" or "high")
            effect: Audio effect ("random", "blink", "rainbow", "wave")
            z2m_base_topic: Optional custom Z2M base topic override
        """
        base_topic = self._get_base_topic(z2m_base_topic)
        topic = f"{base_topic}/{z2m_friendly_name}/set"

        payload: dict[str, str] = {
            PAYLOAD_AUDIO: "ON" if enabled else "OFF",
        }
        if enabled:
            payload[PAYLOAD_AUDIO_SENSITIVITY] = sensitivity
            payload[PAYLOAD_AUDIO_EFFECT] = effect

        _LOGGER.debug(
            "Publishing music sync to %s: %s", z2m_friendly_name, payload
        )

        await mqtt.async_publish(self.hass, topic, json.dumps(payload))

    async def async_send_music_sync(
        self,
        entity_id: str,
        enabled: bool,
        sensitivity: str,
        effect: str,
    ) -> None:
        """Send music sync configuration via the protocol interface.

        Args:
            entity_id: The Home Assistant entity ID
            enabled: Whether to enable or disable audio mode
            sensitivity: Audio sensitivity ("low" or "high")
            effect: Audio effect ("random", "blink", "rainbow", "wave")
        """
        z2m_name = self.get_z2m_friendly_name(entity_id)
        if not z2m_name:
            _LOGGER.warning(
                "Cannot send music sync: entity %s not mapped", entity_id
            )
            return
        await self.async_publish_music_sync(z2m_name, enabled, sensitivity, effect)

    async def async_stop_music_sync(self, entity_id: str) -> None:
        """Stop music sync on a device via the protocol interface.

        Args:
            entity_id: The Home Assistant entity ID
        """
        z2m_name = self.get_z2m_friendly_name(entity_id)
        if not z2m_name:
            _LOGGER.warning(
                "Cannot stop music sync: entity %s not mapped", entity_id
            )
            return
        await self.async_publish_music_sync(z2m_name, enabled=False, sensitivity="low", effect="random")

