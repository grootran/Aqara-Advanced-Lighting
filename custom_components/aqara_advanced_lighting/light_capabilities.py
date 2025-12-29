"""Device capability definitions for Aqara lights."""

from __future__ import annotations

from typing import Final

from .const import (
    EFFECT_T1M_BREATHING,
    EFFECT_T1M_FADING,
    EFFECT_T1M_FLOW1,
    EFFECT_T1M_FLOW2,
    EFFECT_T1M_HOPPING,
    EFFECT_T1M_ROLLING,
    EFFECT_T1_BREATHING,
    EFFECT_T1_CHASING,
    EFFECT_T1_DASH,
    EFFECT_T1_FLASH,
    EFFECT_T1_FLICKER,
    EFFECT_T1_HOPPING,
    EFFECT_T1_RAINBOW1,
    EFFECT_T1_RAINBOW2,
    EFFECT_T2_BREATHING,
    EFFECT_T2_CANDLELIGHT,
    EFFECT_T2_FADING,
    EFFECT_T2_FLASH,
    MODEL_T1M_20_SEGMENT,
    MODEL_T1M_26_SEGMENT,
    MODEL_T1_STRIP,
    MODEL_T2_BULB_E26,
    MODEL_T2_BULB_E27,
    MODEL_T2_BULB_GU10_110V,
    MODEL_T2_BULB_GU10_230V,
)
from .models import AqaraLightModel, DeviceCapabilities, EffectType

# Device capability definitions for each Aqara light model

CAPABILITIES_T1M_20: Final = DeviceCapabilities(
    model=AqaraLightModel.T1M_20_SEGMENT,
    segment_count=20,
    supported_effects=[
        EffectType.FLOW1,
        EffectType.FLOW2,
        EffectType.FADING,
        EffectType.HOPPING,
        EffectType.BREATHING,
        EffectType.ROLLING,
    ],
    supports_segment_addressing=True,
    supports_effect_segments=False,  # T1M uses segment_colors, not effect_segments
    model_name="Aqara T1M Ceiling Light (20 segments)",
)

CAPABILITIES_T1M_26: Final = DeviceCapabilities(
    model=AqaraLightModel.T1M_26_SEGMENT,
    segment_count=26,
    supported_effects=[
        EffectType.FLOW1,
        EffectType.FLOW2,
        EffectType.FADING,
        EffectType.HOPPING,
        EffectType.BREATHING,
        EffectType.ROLLING,
    ],
    supports_segment_addressing=True,
    supports_effect_segments=False,  # T1M uses segment_colors, not effect_segments
    model_name="Aqara T1M Ceiling Light (26 segments)",
)

CAPABILITIES_T1_STRIP: Final = DeviceCapabilities(
    model=AqaraLightModel.T1_STRIP,
    segment_count=0,  # Variable based on length (5 per meter)
    supported_effects=[
        EffectType.BREATHING,
        EffectType.RAINBOW1,
        EffectType.CHASING,
        EffectType.FLASH,
        EffectType.HOPPING,
        EffectType.RAINBOW2,
        EffectType.FLICKER,
        EffectType.DASH,
    ],
    supports_segment_addressing=True,
    supports_effect_segments=True,  # T1 Strip supports effect_segments parameter
    model_name="Aqara T1 LED Strip",
)

CAPABILITIES_T2_BULB: Final = DeviceCapabilities(
    model=AqaraLightModel.T2_BULB,
    segment_count=0,  # No segments
    supported_effects=[
        EffectType.BREATHING,
        EffectType.CANDLELIGHT,
        EffectType.FADING,
        EffectType.FLASH,
    ],
    supports_segment_addressing=False,
    supports_effect_segments=False,
    model_name="Aqara T2 RGB Bulb",
)

# Mapping from Z2M model ID to capabilities
# All T2 bulb variants share the same capabilities
MODEL_CAPABILITIES: Final[dict[str, DeviceCapabilities]] = {
    MODEL_T1M_20_SEGMENT: CAPABILITIES_T1M_20,
    MODEL_T1M_26_SEGMENT: CAPABILITIES_T1M_26,
    MODEL_T1_STRIP: CAPABILITIES_T1_STRIP,
    MODEL_T2_BULB_E26: CAPABILITIES_T2_BULB,
    MODEL_T2_BULB_E27: CAPABILITIES_T2_BULB,
    MODEL_T2_BULB_GU10_230V: CAPABILITIES_T2_BULB,
    MODEL_T2_BULB_GU10_110V: CAPABILITIES_T2_BULB,
}


def get_device_capabilities(model_id: str) -> DeviceCapabilities | None:
    """Get device capabilities for a Z2M model ID."""
    return MODEL_CAPABILITIES.get(model_id)


def is_supported_model(model_id: str) -> bool:
    """Check if a Z2M model ID is supported."""
    return model_id in MODEL_CAPABILITIES


def validate_effect_for_model(
    model_id: str, effect: EffectType
) -> tuple[bool, str | None]:
    """Validate if an effect is supported for a device model.

    Returns:
        Tuple of (is_valid, error_message)
    """
    capabilities = get_device_capabilities(model_id)

    if not capabilities:
        return False, f"Unsupported device model: {model_id}"

    if effect not in capabilities.supported_effects:
        return (
            False,
            (
                f"Effect '{effect}' not supported for {capabilities.model_name}. "
                f"Supported effects: {', '.join(e.value for e in capabilities.supported_effects)}"
            ),
        )

    return True, None


def get_supported_effects_for_model(model_id: str) -> list[EffectType]:
    """Get list of supported effects for a device model."""
    capabilities = get_device_capabilities(model_id)
    if not capabilities:
        return []
    return capabilities.supported_effects


def supports_segment_addressing(model_id: str) -> bool:
    """Check if a device supports individual segment addressing."""
    capabilities = get_device_capabilities(model_id)
    if not capabilities:
        return False
    return capabilities.supports_segment_addressing


def supports_effect_segments(model_id: str) -> bool:
    """Check if a device supports effect_segments parameter."""
    capabilities = get_device_capabilities(model_id)
    if not capabilities:
        return False
    return capabilities.supports_effect_segments


def get_segment_count(model_id: str) -> int:
    """Get segment count for a device model."""
    capabilities = get_device_capabilities(model_id)
    if not capabilities:
        return 0
    return capabilities.segment_count
