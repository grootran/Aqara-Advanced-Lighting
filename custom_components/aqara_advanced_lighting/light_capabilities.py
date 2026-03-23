"""Device capability definitions for Aqara lights."""

from __future__ import annotations

from functools import lru_cache
from typing import Final

from .const import (
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

CAPABILITIES_T2_CCT: Final = DeviceCapabilities(
    model=AqaraLightModel.T2_BULB,  # Reuse same enum for CCT variant
    segment_count=0,  # No segments
    supported_effects=[],  # CCT bulbs don't support RGB effects
    supports_segment_addressing=False,
    supports_effect_segments=False,
    model_name="Aqara T2 CCT Bulb",
)

# Mapping from Z2M model ID to capabilities
MODEL_CAPABILITIES: Final[dict[str, DeviceCapabilities]] = {
    MODEL_T1M_20_SEGMENT: CAPABILITIES_T1M_20,
    MODEL_T1M_26_SEGMENT: CAPABILITIES_T1M_26,
    MODEL_T1_STRIP: CAPABILITIES_T1_STRIP,
    MODEL_T2_BULB_E26: CAPABILITIES_T2_BULB,
    MODEL_T2_BULB_E27: CAPABILITIES_T2_BULB,
    MODEL_T2_BULB_GU10_230V: CAPABILITIES_T2_BULB,
    MODEL_T2_BULB_GU10_110V: CAPABILITIES_T2_BULB,
    MODEL_T2_CCT_E26: CAPABILITIES_T2_CCT,
    MODEL_T2_CCT_E27: CAPABILITIES_T2_CCT,
    MODEL_T2_CCT_GU10_230V: CAPABILITIES_T2_CCT,
    MODEL_T2_CCT_GU10_110V: CAPABILITIES_T2_CCT,
}


@lru_cache(maxsize=32)
def get_device_capabilities(model_id: str) -> DeviceCapabilities | None:
    """Get device capabilities for a Z2M model ID.

    Results are cached for performance.
    """
    return MODEL_CAPABILITIES.get(model_id)


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


@lru_cache(maxsize=32)
def supports_segment_addressing(model_id: str) -> bool:
    """Check if a device supports individual segment addressing.

    Results are cached for performance.
    """
    capabilities = get_device_capabilities(model_id)
    if not capabilities:
        return False
    return capabilities.supports_segment_addressing


@lru_cache(maxsize=32)
def supports_effect_segments(model_id: str) -> bool:
    """Check if a device supports effect_segments parameter.

    Results are cached for performance.
    """
    capabilities = get_device_capabilities(model_id)
    if not capabilities:
        return False
    return capabilities.supports_effect_segments


@lru_cache(maxsize=32)
def get_segment_count(model_id: str) -> int:
    """Get segment count for a device model.

    Results are cached for performance.
    """
    capabilities = get_device_capabilities(model_id)
    if not capabilities:
        return 0
    return capabilities.segment_count
