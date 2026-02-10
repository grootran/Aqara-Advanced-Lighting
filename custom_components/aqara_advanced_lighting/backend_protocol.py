"""Device backend protocol for Zigbee communication abstraction."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Protocol, runtime_checkable

if TYPE_CHECKING:
    from .models import AqaraDevice, DynamicEffect, SegmentColor


@runtime_checkable
class DeviceBackend(Protocol):
    """Protocol defining the interface for Zigbee backend communication.

    Both MQTTBackend (Zigbee2MQTT) and ZHABackend implement this protocol.
    Services and managers call these methods without knowing which backend
    is handling the communication.
    """

    # --- Lifecycle ---

    async def async_setup(self) -> None:
        """Set up the backend (subscriptions, device discovery, etc.)."""
        ...

    async def async_shutdown(self) -> None:
        """Shut down the backend and clean up resources."""
        ...

    # --- Discovery and mapping ---

    def is_entity_supported(self, entity_id: str) -> tuple[bool, str]:
        """Check if an entity is a supported Aqara device.

        Args:
            entity_id: The Home Assistant entity ID

        Returns:
            Tuple of (is_supported, reason_if_not_supported)
        """
        ...

    def get_device_for_entity(self, entity_id: str) -> AqaraDevice | None:
        """Get the Aqara device for a Home Assistant entity.

        Args:
            entity_id: The Home Assistant entity ID

        Returns:
            AqaraDevice if found, None otherwise
        """
        ...

    def get_all_devices(self) -> dict[str, AqaraDevice]:
        """Get all discovered Aqara devices.

        Returns:
            Dictionary of identifier -> AqaraDevice
        """
        ...

    @property
    def entity_mapping_ready(self) -> bool:
        """Whether entity-to-device mapping has completed."""
        ...

    # --- Effects ---

    async def async_send_effect(
        self,
        entity_id: str,
        effect: DynamicEffect,
    ) -> None:
        """Send a dynamic effect to a device.

        Args:
            entity_id: The Home Assistant entity ID
            effect: The dynamic effect to apply
        """
        ...

    async def async_send_batch_effects(
        self,
        entity_effects: list[tuple[str, DynamicEffect]],
    ) -> None:
        """Send dynamic effects to multiple devices in parallel.

        Args:
            entity_effects: List of (entity_id, effect) tuples
        """
        ...

    async def async_stop_effect(self, entity_id: str) -> None:
        """Stop the active effect on a device.

        Args:
            entity_id: The Home Assistant entity ID
        """
        ...

    # --- Segments ---

    async def async_send_segment_pattern(
        self,
        entity_id: str,
        segments: list[SegmentColor],
    ) -> None:
        """Send a segment color pattern to a device.

        Args:
            entity_id: The Home Assistant entity ID
            segments: List of segment color assignments
        """
        ...

    async def async_send_batch_segments(
        self,
        entity_segments: list[tuple[str, list[SegmentColor]]],
    ) -> None:
        """Send segment patterns to multiple devices in parallel.

        Args:
            entity_segments: List of (entity_id, segment_colors) tuples
        """
        ...

    # --- State ---

    async def async_restore_state(
        self,
        entity_id: str,
        state_data: dict[str, Any],
    ) -> None:
        """Restore previous state to a device.

        Args:
            entity_id: The Home Assistant entity ID
            state_data: The state data to restore
        """
        ...

    # --- CCT (uses HA light service, backend-agnostic) ---

    async def async_publish_cct_step(
        self,
        entity_id: str,
        color_temp_kelvin: int,
        brightness: int,
        transition: float,
        stop_event: Any | None = None,
    ) -> bool:
        """Apply a CCT step to a light entity.

        Uses Home Assistant light.turn_on service which works with any
        Zigbee backend.

        Args:
            entity_id: The Home Assistant light entity ID
            color_temp_kelvin: Target color temperature in kelvin
            brightness: Target brightness level (1-255)
            transition: Transition time in seconds
            stop_event: Optional event to signal interruption

        Returns:
            True if transition completed, False if interrupted
        """
        ...

    async def async_turn_off_light(self, entity_id: str) -> None:
        """Turn off a light using HA light service.

        Args:
            entity_id: The Home Assistant light entity ID
        """
        ...

    # --- Device-specific ---

    async def async_set_transition_curve(
        self,
        entity_id: str,
        curvature: float,
    ) -> None:
        """Set transition curve curvature for T2 bulbs.

        Args:
            entity_id: The Home Assistant entity ID
            curvature: Transition curve curvature (0.2-6)
        """
        ...
