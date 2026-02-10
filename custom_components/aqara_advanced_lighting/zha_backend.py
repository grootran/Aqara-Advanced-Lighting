"""ZHA backend implementing the DeviceBackend protocol.

Uses the ZHA integration's gateway to communicate directly with Aqara
lights via Zigbee cluster writes, bypassing MQTT entirely.
"""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components.light import DOMAIN as LIGHT_DOMAIN
from homeassistant.core import HomeAssistant
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
)
from .models import AqaraDevice, DynamicEffect, RGBColor, SegmentColor
from .mqtt_backend import SUPPORTED_MODELS
from .payload_builder import (
    build_effect_colors_payload,
    build_effect_segments_mask,
    build_strip_segment_packet,
    build_t1m_segment_packet,
)

if TYPE_CHECKING:
    from .entity_controller import EntityController
    from .models import AqaraLightingConfigEntry

_LOGGER = logging.getLogger(__name__)

# Aqara manufacturer-specific Zigbee constants
AQARA_MANUFACTURER_CODE = 0x115F
CLUSTER_MANU_SPECIFIC_LUMI = 0xFCC0

# Attribute IDs for cluster 0xFCC0
ATTR_DIMMING_RANGE_MIN = 0x0515
ATTR_DIMMING_RANGE_MAX = 0x0516
ATTR_STRIP_LENGTH = 0x051B
ATTR_AUDIO_ENABLE = 0x051C
ATTR_AUDIO_EFFECT = 0x051D
ATTR_AUDIO_SENSITIVITY = 0x051E
ATTR_EFFECT_TYPE = 0x051F
ATTR_EFFECT_SPEED = 0x0520
ATTR_T1M_SEGMENT = 0x0522
ATTR_EFFECT_COLORS = 0x0523
ATTR_STRIP_SEGMENT = 0x0527
ATTR_TRANSITION_CURVE = 0x0528
ATTR_INITIAL_BRIGHTNESS = 0x052C
ATTR_EFFECT_SEGMENTS_MASK = 0x0530

# Default endpoint for manufacturer-specific writes
DEFAULT_ENDPOINT = 1

# Delay between segment color group writes (seconds)
SEGMENT_GROUP_DELAY = 0.05

# Effect type enum values per device family
EFFECT_ENUM_T2: dict[str, int] = {
    "off": 0,
    "breathing": 1,
    "candlelight": 2,
    "fading": 3,
    "flash": 4,
}

EFFECT_ENUM_T1M: dict[str, int] = {
    "flow1": 0,
    "flow2": 1,
    "fading": 2,
    "hopping": 3,
    "breathing": 4,
    "rolling": 5,
}

EFFECT_ENUM_STRIP: dict[str, int] = {
    "breathing": 0,
    "rainbow1": 1,
    "chasing": 2,
    "flash": 3,
    "hopping": 4,
    "rainbow2": 5,
    "flicker": 6,
    "dash": 7,
}

# Device family classification by model ID
T1M_MODELS = {MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT}
T1_STRIP_MODELS = {MODEL_T1_STRIP}
T2_BULB_MODELS = {
    MODEL_T2_BULB_E26,
    MODEL_T2_BULB_E27,
    MODEL_T2_BULB_GU10_230V,
    MODEL_T2_BULB_GU10_110V,
}
T2_CCT_MODELS = {
    MODEL_T2_CCT_E26,
    MODEL_T2_CCT_E27,
    MODEL_T2_CCT_GU10_230V,
    MODEL_T2_CCT_GU10_110V,
}


def _resolve_zha_model(device: Any) -> str | None:
    """Resolve the canonical model ID for a ZHA device.

    ZHA v2 quirks can override device.model to a friendly name (e.g.,
    "Ceiling Light T1M" instead of "lumi.light.acn031"). This function
    checks the underlying zigpy device for the raw model identifier.

    Args:
        device: A ZHA device from the gateway

    Returns:
        Canonical model ID if supported, None otherwise
    """
    # First check the ZHA-reported model directly
    if device.model in SUPPORTED_MODELS:
        return device.model

    # Try the underlying zigpy device's raw model (not overridden by quirks)
    zigpy_device = getattr(device, "device", None)
    if zigpy_device is not None:
        raw_model = getattr(zigpy_device, "model", None)
        if raw_model and raw_model in SUPPORTED_MODELS:
            _LOGGER.debug(
                "Resolved ZHA quirk model %s -> %s via zigpy device",
                device.model,
                raw_model,
            )
            return raw_model

    return None


def _ensure_aqara_attributes(cluster: Any) -> None:
    """Register Aqara manufacturer-specific attributes on a zigpy cluster.

    zigpy's write_attributes() skips attribute IDs not present in the
    cluster's definition. This function adds our custom attribute definitions
    so the writes proceed correctly.
    """
    import zigpy.types as zigpy_t
    from zigpy.zcl.foundation import ZCLAttributeDef

    # Map attribute ID -> (name, zigpy type)
    aqara_attrs: dict[int, tuple[str, type]] = {
        ATTR_DIMMING_RANGE_MIN: ("aqara_dimming_range_min", zigpy_t.uint8_t),
        ATTR_DIMMING_RANGE_MAX: ("aqara_dimming_range_max", zigpy_t.uint8_t),
        ATTR_STRIP_LENGTH: ("aqara_strip_length", zigpy_t.uint8_t),
        ATTR_AUDIO_ENABLE: ("aqara_audio_enable", zigpy_t.uint8_t),
        ATTR_AUDIO_EFFECT: ("aqara_audio_effect", zigpy_t.uint32_t),
        ATTR_AUDIO_SENSITIVITY: ("aqara_audio_sensitivity", zigpy_t.uint8_t),
        ATTR_EFFECT_TYPE: ("aqara_effect_type", zigpy_t.uint32_t),
        ATTR_EFFECT_SPEED: ("aqara_effect_speed", zigpy_t.uint8_t),
        ATTR_T1M_SEGMENT: ("aqara_t1m_segment", zigpy_t.LVBytes),
        ATTR_EFFECT_COLORS: ("aqara_effect_colors", zigpy_t.LVBytes),
        ATTR_STRIP_SEGMENT: ("aqara_strip_segment", zigpy_t.LVBytes),
        ATTR_TRANSITION_CURVE: ("aqara_transition_curve", zigpy_t.Single),
        ATTR_INITIAL_BRIGHTNESS: ("aqara_initial_brightness", zigpy_t.uint8_t),
        ATTR_EFFECT_SEGMENTS_MASK: ("aqara_effect_segments_mask", zigpy_t.LVBytes),
    }

    for attr_id, (name, attr_type) in aqara_attrs.items():
        if attr_id not in cluster.attributes:
            cluster.attributes[attr_id] = ZCLAttributeDef(
                id=attr_id,
                name=name,
                type=attr_type,
                is_manufacturer_specific=True,
            )


def _get_device_family(model_id: str) -> str | None:
    """Classify model ID into device family.

    Returns:
        One of "t1m", "strip", "t2_bulb", "t2_cct", or None if unknown.
    """
    if model_id in T1M_MODELS:
        return "t1m"
    if model_id in T1_STRIP_MODELS:
        return "strip"
    if model_id in T2_BULB_MODELS:
        return "t2_bulb"
    if model_id in T2_CCT_MODELS:
        return "t2_cct"
    return None


def _get_effect_enum(device_family: str) -> dict[str, int]:
    """Get effect name to Zigbee enum mapping for a device family."""
    match device_family:
        case "t2_bulb":
            return EFFECT_ENUM_T2
        case "t1m":
            return EFFECT_ENUM_T1M
        case "strip":
            return EFFECT_ENUM_STRIP
        case _:
            return {}


def _parse_segment_spec(spec: int | str, max_segments: int) -> list[int]:
    """Parse a segment specification into a list of 1-based segment numbers.

    Handles: int, "1-5", "odd", "even", "all", "1,3,5"
    """
    if isinstance(spec, int):
        return [spec]

    spec_str = str(spec).strip().lower()

    if spec_str == "all":
        return list(range(1, max_segments + 1))
    if spec_str == "odd":
        return list(range(1, max_segments + 1, 2))
    if spec_str == "even":
        return list(range(2, max_segments + 1, 2))

    # Range like "1-5"
    if "-" in spec_str and "," not in spec_str:
        parts = spec_str.split("-", 1)
        try:
            start, end = int(parts[0]), int(parts[1])
            return list(range(start, end + 1))
        except ValueError:
            pass

    # Comma-separated like "1,3,5"
    if "," in spec_str:
        try:
            return [int(s.strip()) for s in spec_str.split(",")]
        except ValueError:
            pass

    # Single number as string
    try:
        return [int(spec_str)]
    except ValueError:
        _LOGGER.warning("Could not parse segment spec: %s", spec)
        return []


class ZHABackend:
    """ZHA backend implementing the DeviceBackend protocol.

    Communicates with Aqara lights by writing directly to the
    manufacturer-specific Zigbee cluster (0xFCC0) via the ZHA gateway.
    """

    def __init__(
        self,
        hass: HomeAssistant,
        entry: AqaraLightingConfigEntry,
        entity_controller: EntityController | None = None,
    ) -> None:
        """Initialize the ZHA backend."""
        self.hass = hass
        self.entry = entry
        self._entity_controller = entity_controller
        self._entity_to_ieee: dict[str, str] = {}

    # --- Lifecycle ---

    async def async_setup(self) -> None:
        """Set up the ZHA backend: discover devices and map entities."""
        from homeassistant.components.zha.helpers import get_zha_gateway

        gateway = get_zha_gateway(self.hass)

        for ieee, device in gateway.devices.items():
            ieee_str = str(ieee)

            # Resolve model ID (handles ZHA v2 quirks that override model names)
            model_id = _resolve_zha_model(device)
            if not model_id:
                # Log Aqara devices that aren't in our supported list
                if device.manufacturer and "aqara" in device.manufacturer.lower():
                    _LOGGER.debug(
                        "Skipping Aqara device %s (model: %s, manufacturer: %s, ieee: %s) "
                        "- not in SUPPORTED_MODELS",
                        device.name,
                        device.model,
                        device.manufacturer,
                        ieee_str,
                    )
                continue

            aqara_device = AqaraDevice(
                identifier=ieee_str,
                name=device.name or ieee_str,
                model_id=model_id,
                manufacturer=device.manufacturer or "Aqara",
                backend_type="zha",
            )

            self.entry.runtime_data.aqara_devices[ieee_str] = aqara_device

            # Register in HA device registry
            device_registry = dr.async_get(self.hass)
            device_registry.async_get_or_create(
                config_entry_id=self.entry.entry_id,
                identifiers={(DOMAIN, ieee_str)},
                name=device.name or ieee_str,
                manufacturer=device.manufacturer or "Aqara",
                model=MODEL_FRIENDLY_NAMES.get(model_id, model_id),
                model_id=model_id,
            )

            _LOGGER.debug(
                "Discovered ZHA Aqara device %s (model: %s, zha_model: %s, ieee: %s)",
                device.name,
                model_id,
                device.model,
                ieee_str,
            )

        _LOGGER.info(
            "ZHA device discovery complete: found %d supported devices",
            len(self.entry.runtime_data.aqara_devices),
        )

        self._update_entity_mapping()

    def _update_entity_mapping(self) -> None:
        """Map HA light entities to ZHA Aqara devices via the device registry."""
        ent_reg = er.async_get(self.hass)
        dev_reg = dr.async_get(self.hass)

        self._entity_to_ieee.clear()
        mapped_count = 0

        for ieee_str, aqara_device in self.entry.runtime_data.aqara_devices.items():
            # ZHA registers devices with ("zha", ieee_str) identifiers
            ha_device = dev_reg.async_get_device(identifiers={("zha", ieee_str)})
            if not ha_device:
                _LOGGER.debug(
                    "No HA device found for ZHA device %s (%s)",
                    aqara_device.name,
                    ieee_str,
                )
                continue

            device_entities = er.async_entries_for_device(ent_reg, ha_device.id)
            for entity_entry in device_entities:
                if entity_entry.domain != LIGHT_DOMAIN:
                    continue

                self._entity_to_ieee[entity_entry.entity_id] = ieee_str

                # Update global entity routing for service dispatch
                if (
                    DOMAIN in self.hass.data
                    and "entity_routing" in self.hass.data[DOMAIN]
                ):
                    self.hass.data[DOMAIN]["entity_routing"][
                        entity_entry.entity_id
                    ] = self.entry.entry_id

                mapped_count += 1
                _LOGGER.debug(
                    "Mapped entity %s to ZHA device %s",
                    entity_entry.entity_id,
                    aqara_device.name,
                )

        _LOGGER.info(
            "ZHA entity mapping complete: %d entities mapped to %d devices",
            mapped_count,
            len(self.entry.runtime_data.aqara_devices),
        )

        self.entry.runtime_data.entity_mapping_ready = True

    async def async_shutdown(self) -> None:
        """Shut down the backend and clean up resources."""
        self._entity_to_ieee.clear()
        _LOGGER.debug("ZHA backend shut down")

    # --- Discovery and mapping ---

    def is_entity_supported(self, entity_id: str) -> tuple[bool, str]:
        """Check if an entity is a supported Aqara device."""
        ieee_str = self._entity_to_ieee.get(entity_id)
        if not ieee_str:
            return False, "not_mapped_to_zha"

        device = self.entry.runtime_data.aqara_devices.get(ieee_str)
        if not device:
            return False, "zha_device_not_found"

        if device.model_id not in SUPPORTED_MODELS:
            return False, f"unsupported_model_{device.model_id}"

        return True, ""

    def get_device_for_entity(self, entity_id: str) -> AqaraDevice | None:
        """Get the Aqara device for a Home Assistant entity."""
        ieee_str = self._entity_to_ieee.get(entity_id)
        if not ieee_str:
            return None
        return self.entry.runtime_data.aqara_devices.get(ieee_str)

    def get_all_devices(self) -> dict[str, AqaraDevice]:
        """Get all discovered Aqara devices."""
        return dict(self.entry.runtime_data.aqara_devices)

    @property
    def entity_mapping_ready(self) -> bool:
        """Whether entity-to-device mapping has completed."""
        return self.entry.runtime_data.entity_mapping_ready

    # --- Zigbee cluster write helpers ---

    def _get_zha_device(self, ieee_str: str) -> Any | None:
        """Get ZHA device object by IEEE address string."""
        from homeassistant.components.zha.helpers import get_zha_gateway
        from zigpy.types import EUI64

        gateway = get_zha_gateway(self.hass)
        ieee = EUI64.convert(ieee_str)
        return gateway.devices.get(ieee)

    async def _write_cluster_attribute(
        self,
        ieee_str: str,
        attribute: int,
        value: Any,
        endpoint_id: int = DEFAULT_ENDPOINT,
    ) -> bool:
        """Write a single attribute to the Aqara manufacturer-specific cluster.

        Accesses the zigpy cluster directly for full control over attribute
        type serialization. Registers custom Aqara attribute definitions on
        the cluster if needed, since zigpy rejects writes to unknown attributes.

        Returns True on success, False on failure.
        """
        zha_device = self._get_zha_device(ieee_str)
        if not zha_device:
            _LOGGER.error("ZHA device not found: %s", ieee_str)
            return False

        try:
            zigpy_device = zha_device.device
            endpoint = zigpy_device.endpoints.get(endpoint_id)
            if not endpoint:
                _LOGGER.error(
                    "Endpoint %d not found on %s", endpoint_id, ieee_str
                )
                return False

            cluster = endpoint.in_clusters.get(CLUSTER_MANU_SPECIFIC_LUMI)
            if not cluster:
                _LOGGER.error(
                    "Cluster 0x%04X not found on %s endpoint %d",
                    CLUSTER_MANU_SPECIFIC_LUMI,
                    ieee_str,
                    endpoint_id,
                )
                return False

            # Register attribute on cluster if not already defined.
            # zigpy's write_attributes() skips unknown attribute IDs,
            # so we must add our custom Aqara attributes to the cluster's
            # definition before writing.
            _ensure_aqara_attributes(cluster)

            result = await cluster.write_attributes(
                {attribute: value},
                manufacturer=AQARA_MANUFACTURER_CODE,
            )

            _LOGGER.debug(
                "Wrote attribute 0x%04X to %s: %s (result: %s)",
                attribute,
                ieee_str,
                value if not isinstance(value, (bytes, bytearray)) else f"<{len(value)} bytes>",
                result,
            )
            return True

        except Exception:
            _LOGGER.exception(
                "Failed to write attribute 0x%04X to %s", attribute, ieee_str
            )
            return False

    async def _write_effect_attributes(
        self,
        ieee_str: str,
        effect_type_value: int,
        speed: int,
        colors_payload: bytes,
        segments_mask: bytes | None = None,
    ) -> None:
        """Write all effect attributes in the correct order.

        Order: segments mask (strip only) -> type -> colors -> speed.
        Writing type first selects the effect, then colors and speed configure
        it. Writing colors before type causes the type write to overwrite them.
        """
        import zigpy.types as zigpy_t

        if segments_mask is not None:
            await self._write_cluster_attribute(
                ieee_str, ATTR_EFFECT_SEGMENTS_MASK, segments_mask
            )

        await self._write_cluster_attribute(
            ieee_str, ATTR_EFFECT_TYPE, zigpy_t.uint32_t(effect_type_value)
        )
        await self._write_cluster_attribute(
            ieee_str, ATTR_EFFECT_COLORS, colors_payload
        )
        await self._write_cluster_attribute(
            ieee_str, ATTR_EFFECT_SPEED, zigpy_t.uint8_t(speed)
        )

    # --- Effects ---

    async def async_send_effect(
        self,
        entity_id: str,
        effect: DynamicEffect,
    ) -> None:
        """Send a dynamic effect to a device."""
        ieee_str = self._entity_to_ieee.get(entity_id)
        if not ieee_str:
            _LOGGER.warning("Cannot send effect: entity %s not mapped", entity_id)
            return

        device = self.entry.runtime_data.aqara_devices.get(ieee_str)
        if not device:
            _LOGGER.warning(
                "Cannot send effect: device not found for %s", entity_id
            )
            return

        device_family = _get_device_family(device.model_id)
        if not device_family:
            _LOGGER.warning(
                "Cannot send effect: unknown device family for model %s",
                device.model_id,
            )
            return

        effect_enum = _get_effect_enum(device_family)
        effect_type_value = effect_enum.get(effect.effect.value)
        if effect_type_value is None:
            _LOGGER.warning(
                "Unsupported effect %s for device family %s",
                effect.effect.value,
                device_family,
            )
            return

        # Build effect colors payload
        colors_payload = build_effect_colors_payload(effect.effect_colors)

        # For T1 Strip, build effect segments mask if specified
        segments_mask: bytes | None = None
        if device_family == "strip" and effect.effect_segments is not None:
            from .light_capabilities import get_segment_count

            max_segments = get_segment_count(device.model_id) or 50
            seg_nums = _parse_segment_spec(effect.effect_segments, max_segments)
            if seg_nums:
                segments_mask = build_effect_segments_mask(seg_nums, max_segments)

        await self._write_effect_attributes(
            ieee_str,
            effect_type_value,
            effect.effect_speed,
            colors_payload,
            segments_mask,
        )

        _LOGGER.debug(
            "Sent effect %s to %s (speed: %d, colors: %d)",
            effect.effect.value,
            entity_id,
            effect.effect_speed,
            len(effect.effect_colors),
        )

    async def async_send_batch_effects(
        self,
        entity_effects: list[tuple[str, DynamicEffect]],
    ) -> None:
        """Send dynamic effects to multiple devices in parallel."""
        tasks = [
            self.async_send_effect(entity_id, effect)
            for entity_id, effect in entity_effects
        ]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def async_stop_effect(self, entity_id: str) -> None:
        """Stop the active effect by sending a solid RGB color.

        Overrides the dynamic effect by setting the light to a neutral
        warm white, matching the MQTT backend behavior.
        """
        context = (
            self._entity_controller.create_context()
            if self._entity_controller
            else None
        )

        await self.hass.services.async_call(
            "light",
            "turn_on",
            {"entity_id": entity_id, "rgb_color": [255, 200, 150]},
            blocking=True,
            context=context,
        )

        _LOGGER.debug("Stopped effect on %s by setting solid RGB color", entity_id)

    # --- Segments ---

    async def async_send_segment_pattern(
        self,
        entity_id: str,
        segments: list[SegmentColor],
    ) -> None:
        """Send a segment color pattern to a device.

        Groups segments by color, builds binary packets per group, and writes
        each packet to the appropriate cluster attribute with a delay between
        groups (matching Z2M converter behavior).
        """
        ieee_str = self._entity_to_ieee.get(entity_id)
        if not ieee_str:
            _LOGGER.warning(
                "Cannot send segments: entity %s not mapped", entity_id
            )
            return

        device = self.entry.runtime_data.aqara_devices.get(ieee_str)
        if not device:
            _LOGGER.warning(
                "Cannot send segments: device not found for %s", entity_id
            )
            return

        device_family = _get_device_family(device.model_id)
        if device_family not in ("t1m", "strip"):
            _LOGGER.warning(
                "Segments not supported for device family %s", device_family
            )
            return

        from .light_capabilities import get_segment_count

        max_segments = get_segment_count(device.model_id) or 20

        # Group segments by (color, brightness) to minimize cluster writes
        groups: dict[tuple[int, int, int, int], list[int]] = {}
        for sc in segments:
            seg_nums = _parse_segment_spec(sc.segment, max_segments)
            key = (sc.color.r, sc.color.g, sc.color.b, sc.brightness or 254)
            groups.setdefault(key, []).extend(seg_nums)

        attr_id = (
            ATTR_T1M_SEGMENT if device_family == "t1m" else ATTR_STRIP_SEGMENT
        )

        for i, ((r, g, b, brightness), seg_nums) in enumerate(groups.items()):
            color = RGBColor(r=r, g=g, b=b)

            if device_family == "t1m":
                payload = build_t1m_segment_packet(seg_nums, color, max_segments)
            else:
                payload = build_strip_segment_packet(
                    seg_nums, color, max_segments, brightness
                )

            await self._write_cluster_attribute(ieee_str, attr_id, payload)

            # Delay between groups (matching Z2M converter behavior)
            if i < len(groups) - 1:
                await asyncio.sleep(SEGMENT_GROUP_DELAY)

        _LOGGER.debug(
            "Sent segment pattern to %s: %d color groups", entity_id, len(groups)
        )

    async def async_send_batch_segments(
        self,
        entity_segments: list[tuple[str, list[SegmentColor]]],
    ) -> None:
        """Send segment patterns to multiple devices in parallel."""
        tasks = [
            self.async_send_segment_pattern(entity_id, segs)
            for entity_id, segs in entity_segments
        ]
        await asyncio.gather(*tasks, return_exceptions=True)

    # --- State ---

    async def async_restore_state(
        self,
        entity_id: str,
        state_data: dict[str, Any],
    ) -> None:
        """Restore previous state to a device using HA service calls.

        Translates state_data fields into light.turn_on parameters.
        """
        context = (
            self._entity_controller.create_context()
            if self._entity_controller
            else None
        )

        service_data: dict[str, Any] = {"entity_id": entity_id}

        if "brightness" in state_data:
            service_data["brightness"] = state_data["brightness"]
        if "color_temp_kelvin" in state_data:
            service_data["color_temp_kelvin"] = state_data["color_temp_kelvin"]
        if "color" in state_data:
            color = state_data["color"]
            if isinstance(color, dict) and "r" in color:
                service_data["rgb_color"] = [color["r"], color["g"], color["b"]]
        if "xy_color" in state_data:
            service_data["xy_color"] = state_data["xy_color"]

        _LOGGER.debug("Restoring state for %s: %s", entity_id, service_data)

        await self.hass.services.async_call(
            "light",
            "turn_on",
            service_data,
            blocking=True,
            context=context,
        )

    # --- CCT (uses HA light service, backend-agnostic) ---

    async def async_publish_cct_step(
        self,
        entity_id: str,
        color_temp_kelvin: int,
        brightness: int,
        transition: float,
        stop_event: asyncio.Event | None = None,
    ) -> bool:
        """Apply a CCT step to a light entity using HA light service.

        Uses Home Assistant's light.turn_on service which works with any
        Zigbee backend through standard ZCL clusters.

        Returns True if transition completed, False if interrupted.
        """
        context = (
            self._entity_controller.create_context()
            if self._entity_controller
            else None
        )

        service_data: dict[str, Any] = {
            "entity_id": entity_id,
            "color_temp_kelvin": color_temp_kelvin,
            "brightness": brightness,
        }
        if transition > 0:
            service_data["transition"] = transition

        _LOGGER.info(
            "Applying CCT step to %s: %dK, brightness %d, transition %ss",
            entity_id,
            color_temp_kelvin,
            brightness,
            transition,
        )

        await self.hass.services.async_call(
            "light",
            "turn_on",
            service_data,
            blocking=True,
            context=context,
        )

        # Wait for transition to complete (interruptible by stop_event)
        if stop_event is not None and transition > 0:
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=transition)
                _LOGGER.debug("Transition interrupted for %s", entity_id)
                return False
            except asyncio.TimeoutError:
                pass
        elif transition > 0:
            await asyncio.sleep(transition)

        return True

    async def async_turn_off_light(self, entity_id: str) -> None:
        """Turn off a light using HA light service."""
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

    # --- Device-specific ---

    async def async_set_transition_curve(
        self,
        entity_id: str,
        curvature: float,
    ) -> None:
        """Set transition curve curvature for T2 bulbs.

        Writes the curvature value directly to the manufacturer-specific
        cluster attribute 0x0528.
        """
        ieee_str = self._entity_to_ieee.get(entity_id)
        if not ieee_str:
            _LOGGER.warning(
                "Cannot set transition curve: entity %s not mapped", entity_id
            )
            return

        await self._write_cluster_attribute(
            ieee_str, ATTR_TRANSITION_CURVE, curvature
        )

        _LOGGER.debug(
            "Set transition curve curvature for %s: %.1f", entity_id, curvature
        )
