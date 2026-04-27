"""Audio-reactive mode handlers for dynamic scene manager.

Each handler implements a specific audio-reactive behavior mode.
The manager routes events to the active handler, which calls back
to the manager for color advancement and light command dispatch.
"""

import asyncio
import logging
import math
import time
from abc import ABC
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, override

from .const import (
    AUDIO_COLOR_ADVANCE_BASS_KICK,
    AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
    AUDIO_COLOR_ADVANCE_CONTINUOUS,
    AUDIO_COLOR_ADVANCE_FREQ_TO_HUE,
    AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING,
    AUDIO_COLOR_ADVANCE_ON_ONSET,
    AUDIO_COLOR_ADVANCE_ONSET_FLASH,
    AUDIO_SCENE_SILENCE_DECAY_SECONDS,
    SILENCE_DEGRADATION_STEP_SECONDS,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

from .const import AUDIO_EMA_ALPHA as ENERGY_EMA_ALPHA, AUDIO_FLASH_BRIGHTNESS_DECAY as FLASH_BRIGHTNESS_DECAY


@dataclass(frozen=True)
class ModeSpec:
    """Declarative metadata for a scene-side audio mode.

    Used by MODE_REGISTRY to centralize handler-class lookup, expose
    pro-tier requirements to the frontend (which reads `requires_pro` to
    render a "(pro)" badge on mode dropdowns), AND describe which event
    classes the mode consumes — `is_onset_mode` / `is_energy_mode` /
    `is_spectral_mode` / `needs_band_attrs`. The dispatcher in
    `audio_scene_consumer.py` reads these flags to gate engine
    subscriptions and `needs_apply` decisions, so adding a new mode now
    only requires adding a `ModeSpec` row here — no parallel updates to
    a separate frozenset on a different file (which is what produced the
    bass_kick / freq_to_hue silent-dispatch bug originally).
    """

    constant: str               # the AUDIO_COLOR_ADVANCE_* constant string
    handler_class: type         # subclass of AudioModeHandler
    requires_pro: bool = False  # True when pro-tier sensors meaningfully improve quality
    display_label: str = ""     # optional UI override; empty = use constant
    is_onset_mode: bool = False     # consumes onset events; subscribe_onset + needs_apply on onset
    is_energy_mode: bool = False    # consumes energy events; subscribe_energy + needs_apply on energy
    is_spectral_mode: bool = False  # consumes centroid/rolloff; subscribe_spectral
    needs_band_attrs: bool = False  # needs per-band energies in onset attrs (e.g. BassKick dominance)
    needs_beat_tracking: bool = False  # subscribe_bpm + subscribe_beat_tracking
    # Hidden modes are still dispatched for existing scenes (handler keeps
    # working, schema validators still accept the value) but the frontend
    # filters them out of the user-facing dropdown options. Used to descope
    # in-progress pro-tier features from a release without ripping out the
    # underlying code; flip back to False once the upstream DSP is stable.
    # See docs/plans/2026-04-27-descope-pro-dsp-features-for-v1.3.0.md.
    hidden: bool = False

class AudioModeHandler(ABC):
    """Abstract base class for audio-reactive mode handlers."""

    def __init__(self, manager: Any) -> None:
        self._manager = manager
        self._silence_task: asyncio.Task | None = None
        self._in_silence = False

    def handle_onset(self, scene_state: Any, attrs: dict[str, Any]) -> None:
        """Handle an onset/beat event. Override in subclasses that react to onsets."""

    def handle_energy(self, scene_state: Any, energy: float) -> None:
        """Handle a continuous energy update. Override in subclasses that react to energy."""

    def handle_centroid(self, scene_state: Any, centroid: float) -> None:
        """Handle spectral centroid update. Used for brightness/color temperature mapping."""

    def handle_rolloff(self, scene_state: Any, rolloff: float) -> None:
        """Handle spectral rolloff update. Used for brightness scaling."""

    def update_bpm(self, bpm: float, confidence: float) -> None:
        """Update BPM and confidence. Override in BeatPredictiveHandler."""

    def update_phase(self, scene_state: Any, phase: float) -> None:
        """Handle beat phase update. Override in BeatPredictiveHandler."""

    async def enter_silence(self, scene_state: Any, stop_event: asyncio.Event) -> None:
        """Handle silence transition based on scene's silence behavior."""
        self._in_silence = True
        self._cancel_mode_timers()
        behavior = scene_state.scene.audio_silence_behavior
        if behavior == "slow_cycle":
            self._silence_task = asyncio.ensure_future(
                self._silence_cycle(scene_state, stop_event)
            )
        elif behavior in ("decay_min", "decay_mid"):
            self._silence_task = asyncio.ensure_future(
                self._silence_decay(scene_state, stop_event, behavior)
            )
        # "hold" does nothing — lights stay frozen in place

    async def exit_silence(self, scene_state: Any) -> None:
        """Return from silence to active audio mode."""
        self._in_silence = False
        if self._silence_task and not self._silence_task.done():
            self._silence_task.cancel()
            self._silence_task = None

    def cleanup(self) -> None:
        """Cancel any pending timers or tasks."""
        self._cancel_mode_timers()
        if self._silence_task and not self._silence_task.done():
            self._silence_task.cancel()

    def _cancel_mode_timers(self) -> None:
        """Cancel mode-specific timers. Override in subclasses with timers."""

    async def _silence_cycle(
        self, scene_state: Any, stop_event: asyncio.Event
    ) -> None:
        """Slowly cycle through palette colors during silence."""
        step_time = SILENCE_DEGRADATION_STEP_SECONDS
        while not stop_event.is_set() and self._in_silence:
            self._manager._advance_colors(scene_state)
            await self._manager._apply_colors_with_offset(
                scene_state, stop_event, transition=step_time * 0.8
            )
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=step_time)
            except asyncio.TimeoutError:
                pass

    async def _silence_decay(
        self,
        scene_state: Any,
        stop_event: asyncio.Event,
        behavior: str,
    ) -> None:
        """Gradually decay brightness_modifier toward a target during silence.

        Mirrors AudioEffectModulator._decay_to_targets: 15 steps over
        AUDIO_SCENE_SILENCE_DECAY_SECONDS with cubic ease-in-out, reapplying
        colors at each step so the dimming is visible.
        """
        scene = scene_state.scene
        if behavior == "decay_mid":
            target = (scene.audio_brightness_min + scene.audio_brightness_max) / 2 / 100.0
        else:  # decay_min
            target = scene.audio_brightness_min / 100.0
        target = max(0.01, min(1.0, target))

        start = scene_state.brightness_modifier
        if start <= target:
            # Already at or below target — nothing to decay
            return

        duration = AUDIO_SCENE_SILENCE_DECAY_SECONDS
        steps = 15
        interval = duration / steps

        for i in range(1, steps + 1):
            if stop_event.is_set() or not self._in_silence:
                return

            t = i / steps
            # Cubic ease-in-out (same as AudioEffectModulator._decay_to_targets)
            if t < 0.5:
                eased = 4 * t * t * t
            else:
                eased = 1 - (-2 * t + 2) ** 3 / 2

            scene_state.brightness_modifier = start + (target - start) * eased

            await self._manager._apply_colors_with_offset(
                scene_state, stop_event, transition=interval * 0.8
            )
            await asyncio.sleep(interval)

        # Ensure final value is exactly the target
        scene_state.brightness_modifier = target

    @staticmethod
    def _apply_brightness_curve(scene: Any, raw_value: float) -> float:
        """Map a 0.0-1.0 energy/envelope value through the scene's brightness curve.

        Returns a 0.0-1.0 brightness modifier, or 1.0 if brightness response is disabled.
        """
        if scene.audio_brightness_curve is None:
            return 1.0  # Disabled — no modification

        from .audio_curves import apply_response_curve

        curved = apply_response_curve(raw_value, scene.audio_brightness_curve)
        # Map to min/max percent, then convert to 0.0-1.0 modifier
        pct = scene.audio_brightness_min + curved * (scene.audio_brightness_max - scene.audio_brightness_min)
        return max(0.01, min(1.0, pct / 100.0))

class OnsetHandler(AudioModeHandler):
    """Colors advance on each detected onset/beat."""

    @override
    def handle_onset(self, scene_state: Any, attrs: dict[str, Any]) -> None:
        self._manager._advance_colors(scene_state)

    @override
    def handle_energy(self, scene_state: Any, energy: float) -> None:
        if scene_state.scene.audio_brightness_curve is not None:
            scene_state.brightness_modifier = self._apply_brightness_curve(scene_state.scene, energy)

class ContinuousHandler(AudioModeHandler):
    """Energy maps to palette color position."""

    @override
    def handle_energy(self, scene_state: Any, energy: float) -> None:
        num_colors = len(scene_state.scene.colors)
        if num_colors == 0:
            return
        pos = max(0, min(int(energy * num_colors), num_colors - 1))
        for i in range(len(scene_state.light_color_indices)):
            scene_state.light_color_indices[i] = pos
        if scene_state.scene.audio_brightness_curve is not None:
            scene_state.brightness_modifier = self._apply_brightness_curve(scene_state.scene, energy)

class IntensityBreathingHandler(AudioModeHandler):
    """Slow brightness envelope tracks overall loudness."""

    def __init__(self, manager: Any) -> None:
        super().__init__(manager)
        from .audio_curves import EMAFilter
        self._envelope = EMAFilter(alpha=ENERGY_EMA_ALPHA, initial=0.5)

    @override
    def handle_energy(self, scene_state: Any, energy: float) -> None:
        self._envelope.update(energy)
        # Breathing mode inherently modulates brightness — always apply curve.
        # If curve is None (disabled), fall back to linear with legacy 30-100 range.
        scene = scene_state.scene
        if scene.audio_brightness_curve is not None:
            scene_state.brightness_modifier = self._apply_brightness_curve(scene, self._envelope.value)
        else:
            scene_state.brightness_modifier = max(0.3, min(1.0, self._envelope.value))

class OnsetFlashHandler(AudioModeHandler):
    """Slow palette drift + brightness spike on onsets."""

    def __init__(self, manager: Any) -> None:
        super().__init__(manager)
        from .audio_curves import EMAFilter
        self._envelope = EMAFilter(alpha=ENERGY_EMA_ALPHA, initial=0.5)
        self._flash_brightness = 0.0

    @override
    def handle_energy(self, scene_state: Any, energy: float) -> None:
        self._envelope.update(energy)
        # Decay flash
        self._flash_brightness = max(0.0, self._flash_brightness - FLASH_BRIGHTNESS_DECAY)
        brightness = max(self._envelope.value, self._flash_brightness)
        # Flash mode inherently modulates brightness — always apply curve.
        scene = scene_state.scene
        if scene.audio_brightness_curve is not None:
            scene_state.brightness_modifier = self._apply_brightness_curve(scene, brightness)
        else:
            scene_state.brightness_modifier = max(0.3, min(1.0, brightness))

    @override
    def handle_onset(self, scene_state: Any, attrs: dict[str, Any]) -> None:
        strength = attrs.get("strength", 1.0)
        self._flash_brightness = min(1.0, strength)
        scene_state.brightness_modifier = 1.0

class BeatPredictiveHandler(AudioModeHandler):
    """Predicts beats using BPM and sends commands early."""

    REACTIVE = "reactive"
    TRACKING = "tracking"
    PREDICTIVE = "predictive"

    # The state-machine hysteresis: when in TRACKING/PREDICTIVE, drop back to
    # REACTIVE only when confidence falls more than this far below the lock
    # threshold. Same scale as `_confidence_threshold` (0.0–1.0 fraction).
    _CONFIDENCE_HYSTERESIS = 0.1

    def __init__(self, manager: Any) -> None:
        super().__init__(manager)
        self._state = self.REACTIVE
        self._last_onset_time = 0.0
        self._bpm = 0.0
        # Confidence is a 0.0–1.0 fraction — matches what the device publishes
        # (BTrack `current_confidence_` is clamped to [0, 1]; basic-tier
        # BeatTracker also publishes 0..1). Earlier this field stored an
        # integer 0–100 percent; the comparison against `_confidence_threshold`
        # (also 0–100) was always False at runtime because the actual sensor
        # value is < 1.0. State machine never left REACTIVE; the predictive
        # branch was effectively dead. Float scale fixes that.
        self._confidence: float = 0.0
        self._consecutive_matches = 0
        self._pending_handles: list[asyncio.TimerHandle] = []
        # Prediction tuning — filled on first handle_* call via _ensure_scene_configured().
        self._scene_configured: Any = None
        self._aggressiveness = 50
        self._latency_ms = 150
        # Range 0.30 (most aggressive) to 0.90 (most conservative).
        self._confidence_threshold: float = 0.60

    def _ensure_scene_configured(self, scene: Any) -> None:
        """Lazy-init scene-derived prediction parameters on first event.

        Called from each handle_* method. Idempotent — only recomputes when
        the scene reference changes (currently one-handler-per-scene so this
        fires exactly once; the scene-change guard is defensive for future
        handler reuse).
        """
        if scene is self._scene_configured:
            return
        self._aggressiveness = scene.audio_prediction_aggressiveness
        self._latency_ms = scene.audio_latency_compensation_ms
        # Map aggressiveness 1–100 to confidence threshold 0.90 → 0.30 (fraction).
        self._confidence_threshold = 0.9 - (self._aggressiveness / 100.0) * 0.6
        self._scene_configured = scene

    def configure(self, scene: Any) -> None:
        """Deprecated: scene configuration is now lazy per-event.

        Retained as a thin shim so external callers (tests, older code paths)
        continue to work. Prefer letting the lazy path run via handle_*.
        """
        import warnings
        warnings.warn(
            "BeatPredictiveHandler.configure() is deprecated; scene "
            "configuration now happens lazily on the first handle_* call.",
            DeprecationWarning,
            stacklevel=2,
        )
        self._ensure_scene_configured(scene)

    @override
    def update_bpm(self, bpm: float, confidence: float) -> None:
        """Update BPM and confidence from sensor data.

        `confidence` is a 0.0–1.0 fraction (matches the device's
        beat_confidence sensor scale).
        """
        self._bpm = bpm
        self._confidence = float(confidence)
        self._update_state()

    @override
    def update_phase(self, scene_state: Any, phase: float) -> None:
        """Schedule a color advance based on device-reported beat phase.

        Only fires in PREDICTIVE state. Cancels any pending handle before
        scheduling a new one, so rapid phase updates don't stack.
        """
        self._ensure_scene_configured(scene_state.scene)
        if self._state != self.PREDICTIVE or self._bpm <= 0:
            return
        beat_interval = 60.0 / self._bpm
        time_to_beat = (1.0 - phase) * beat_interval
        advance_in = time_to_beat - (self._latency_ms / 1000.0)
        if advance_in < 0.02:  # Already past or too close — skip
            return
        self._cancel_mode_timers()
        loop = asyncio.get_event_loop()
        handle = loop.call_later(
            advance_in,
            lambda: self._manager._advance_colors(scene_state),
        )
        self._pending_handles.append(handle)

    @override
    def handle_onset(self, scene_state: Any, attrs: dict[str, Any]) -> None:
        self._ensure_scene_configured(scene_state.scene)
        now = time.monotonic()
        self._last_onset_time = now

        if self._state == self.TRACKING:
            self._consecutive_matches += 1

        if self._state != self.PREDICTIVE:
            # Reactive/tracking mode: advance colors immediately
            strength = attrs.get("strength", 1.0)
            if scene_state.scene.audio_brightness_curve is not None:
                scene_state.brightness_modifier = self._apply_brightness_curve(
                    scene_state.scene, strength
                )
            self._manager._advance_colors(scene_state)

    def _update_state(self) -> None:
        """Update prediction state machine based on BPM confidence.

        Confidence and threshold are both 0.0–1.0 fractions. Hysteresis
        (`_CONFIDENCE_HYSTERESIS = 0.1`) prevents rapid REACTIVE↔TRACKING
        flapping when confidence hovers near the threshold.
        """
        drop_threshold = self._confidence_threshold - self._CONFIDENCE_HYSTERESIS
        if self._state == self.REACTIVE:
            if self._confidence >= self._confidence_threshold:
                self._state = self.TRACKING
                self._consecutive_matches = 0
        elif self._state == self.TRACKING:
            if self._confidence < drop_threshold:
                self._state = self.REACTIVE
            elif self._consecutive_matches >= 4:
                self._state = self.PREDICTIVE
                _LOGGER.debug(
                    "Beat prediction: entering predictive mode (BPM=%.1f, confidence=%.3f)",
                    self._bpm,
                    self._confidence,
                )
        elif self._state == self.PREDICTIVE:
            if self._confidence < drop_threshold:
                self._state = self.REACTIVE
                self._cancel_mode_timers()
                _LOGGER.debug(
                    "Beat prediction: falling back to reactive (confidence=%.3f)",
                    self._confidence,
                )

    @override
    def _cancel_mode_timers(self) -> None:
        """Cancel all pending prediction timers."""
        for handle in self._pending_handles:
            handle.cancel()
        self._pending_handles.clear()

    @override
    def cleanup(self) -> None:
        """Cancel prediction timers and parent cleanup."""
        self._cancel_mode_timers()
        super().cleanup()


class BassKickHandler(AudioModeHandler):
    """Brightness pulses on low-bass (pro) or bass (basic-tier) onsets.

    Fires only when:
      - An onset event is published this frame, AND
      - The driving band's energy exceeds the mean of the other available
        bands by `dominance_ratio` (default 1.5x).

    When it fires, brightness_modifier snaps to 1.0 and cubically decays
    back to `floor_brightness` over `pulse_ms` — a percussive "thump"
    envelope that tracks the kick drum rather than generic onsets.

    Pro-tier selection: reads `sub_bass_energy` as the driver when present
    (device running audio-reactive pro DSP build — the entity name retains
    the `sub_bass` token for backwards compatibility but the band actually
    covers ~80-240 Hz, which is the realistic low-bass region given the
    mics' frequency response). Otherwise falls back to `bass_energy` vs
    mid/high. The consumer is responsible for merging band values into the
    onset event's attrs dict.
    """

    def __init__(self, manager: Any) -> None:
        super().__init__(manager)
        from .audio_curves import BASS_KICK_DEFAULTS
        self._defaults = BASS_KICK_DEFAULTS
        self._pulse_start_ms: float | None = None

    @override
    def handle_onset(self, scene_state: Any, attrs: dict[str, Any]) -> None:
        sub_bass = attrs.get("sub_bass_energy")  # pro-tier
        bass = attrs.get("bass_energy", 0.0)
        mid = attrs.get("mid_energy", 0.0)
        high = attrs.get("high_energy", 0.0)
        low_mid = attrs.get("low_mid_energy")
        upper_mid = attrs.get("upper_mid_energy")
        air = attrs.get("air_energy")

        # Select driver + competitors based on which sensors are populated.
        if sub_bass is not None:
            driver = float(sub_bass)
            competitors = [
                float(v) for v in (bass, low_mid, mid, upper_mid, high, air)
                if v is not None
            ]
        else:
            driver = float(bass)
            competitors = [float(mid), float(high)]

        if not competitors:
            return

        competitor_mean = sum(competitors) / len(competitors)
        if competitor_mean <= 0.01:  # effectively silence
            return
        if driver < competitor_mean * float(self._defaults["dominance_ratio"]):
            return  # kick didn't dominate; ignore

        # Fire the pulse.
        self._pulse_start_ms = time.monotonic() * 1000.0
        scene_state.brightness_modifier = 1.0
        self._manager._advance_colors(scene_state)

    @override
    def handle_energy(self, scene_state: Any, energy: float) -> None:
        floor = float(self._defaults["floor_brightness"])
        pulse_ms = float(self._defaults["pulse_ms"])
        if self._pulse_start_ms is None:
            scene_state.brightness_modifier = floor
            return
        elapsed = time.monotonic() * 1000.0 - self._pulse_start_ms
        if elapsed >= pulse_ms:
            scene_state.brightness_modifier = floor
            self._pulse_start_ms = None
            return
        t = elapsed / pulse_ms
        eased = 1.0 - (t ** 3)  # cubic ease-out
        scene_state.brightness_modifier = floor + (1.0 - floor) * eased


class FreqToHueHandler(AudioModeHandler):
    """Spectral centroid drives hue; amplitude drives brightness.

    Silence-gated: hue holds its last value when the last observed
    amplitude drops below `silence_gate_amplitude`. This prevents centroid
    instability from flipping colors randomly during quiet sections.

    The hue → xy conversion is performed by the manager via `_set_hue()`;
    this handler only produces a smoothed hue angle in degrees.
    """

    def __init__(self, manager: Any) -> None:
        super().__init__(manager)
        from .audio_curves import FREQ_TO_HUE_DEFAULTS
        self._defaults = FREQ_TO_HUE_DEFAULTS
        self._last_hue: float = float(self._defaults["hue_start"])
        # Initialise the amplitude cache ABOVE the silence gate so the first
        # centroid event (which often arrives before the first energy event
        # because sensors fire at slightly different cadences) isn't
        # silently dropped. Once a real energy event arrives, this cache
        # tracks the music level normally.
        self._last_amplitude: float = 1.0

    @override
    def handle_centroid(self, scene_state: Any, centroid: float) -> None:
        """Map the spectral centroid (a 0-1 fraction of nyquist published by the
        device) onto a hue angle.

        Centroid input is tier-agnostic: the device always normalises to its
        own nyquist before publishing, so this handler can use the same
        fractional bounds (centroid_min / centroid_max) on both tiers.
        """
        d = self._defaults
        # Silence gate — hold the last hue.
        if self._last_amplitude < float(d["silence_gate_amplitude"]):
            return

        c_min = float(d["centroid_min"])
        c_max = float(d["centroid_max"])
        c = max(c_min, min(c_max, float(centroid)))

        if d["log_scale"]:
            t = (math.log(c) - math.log(c_min)) / (math.log(c_max) - math.log(c_min))
        else:
            t = (c - c_min) / (c_max - c_min)

        hue_start = float(d["hue_start"])
        hue_end = float(d["hue_end"])
        target_hue = hue_start + t * (hue_end - hue_start)

        alpha = float(d["hue_ema_alpha"])
        self._last_hue = alpha * target_hue + (1.0 - alpha) * self._last_hue

        # Delegate the xy conversion + scene-state write to the manager.
        set_hue = getattr(self._manager, "_set_hue", None)
        if set_hue is not None:
            set_hue(scene_state, self._last_hue)

    @override
    def handle_energy(self, scene_state: Any, energy: float) -> None:
        self._last_amplitude = float(energy)
        # Amplitude drives brightness via the scene's curve, same as OnsetHandler.
        if scene_state.scene.audio_brightness_curve is not None:
            scene_state.brightness_modifier = self._apply_brightness_curve(
                scene_state.scene, energy
            )


# -----------------------------------------------------------------------------
# Registry: declarative map from mode constant → ModeSpec. `create_handler()`
# is the canonical dispatcher — the scene manager routes through it. Every
# handler has a uniform (manager,) constructor; scene-derived configuration
# is lazy, applied on first event via each handler's handle_* methods.
# -----------------------------------------------------------------------------
MODE_REGISTRY: dict[str, ModeSpec] = {
    AUDIO_COLOR_ADVANCE_ON_ONSET: ModeSpec(
        AUDIO_COLOR_ADVANCE_ON_ONSET, OnsetHandler, requires_pro=False,
        is_onset_mode=True,
    ),
    AUDIO_COLOR_ADVANCE_CONTINUOUS: ModeSpec(
        AUDIO_COLOR_ADVANCE_CONTINUOUS, ContinuousHandler, requires_pro=False,
        is_energy_mode=True,
    ),
    AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING: ModeSpec(
        AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING,
        IntensityBreathingHandler,
        requires_pro=False,
        is_energy_mode=True,
    ),
    AUDIO_COLOR_ADVANCE_ONSET_FLASH: ModeSpec(
        AUDIO_COLOR_ADVANCE_ONSET_FLASH, OnsetFlashHandler, requires_pro=False,
        is_onset_mode=True, is_energy_mode=True,
    ),
    AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE: ModeSpec(
        AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
        BeatPredictiveHandler,
        requires_pro=False,
        is_onset_mode=True, needs_beat_tracking=True,
    ),
    # Pro-aware modes — hidden from selectors for v1.3.0 release while the
    # upstream pro-tier DSP (per-band AGC saturation, BTrack tempo ambiguity)
    # is stabilised. Handlers and dispatch paths are intact; existing scene
    # configs with these values continue to load and run.
    AUDIO_COLOR_ADVANCE_BASS_KICK: ModeSpec(
        AUDIO_COLOR_ADVANCE_BASS_KICK, BassKickHandler, requires_pro=True,
        is_onset_mode=True, is_energy_mode=True, needs_band_attrs=True,
        hidden=True,
    ),
    AUDIO_COLOR_ADVANCE_FREQ_TO_HUE: ModeSpec(
        AUDIO_COLOR_ADVANCE_FREQ_TO_HUE, FreqToHueHandler, requires_pro=True,
        is_energy_mode=True, is_spectral_mode=True,
        hidden=True,
    ),
}


def create_handler(mode: str, manager: Any) -> AudioModeHandler:
    """Canonical factory: construct an AudioModeHandler from the mode constant.

    Called by the scene manager on scene start. Every handler in the registry
    has a uniform (manager,) constructor; scene-derived configuration happens
    lazily on the first event each handler receives.

    Unknown modes fall back to OnsetHandler (the default scene behavior) and
    log a warning — preserves lenient handling of stale or typo'd scene
    configs, surfaces the bug via logs rather than silent runtime error.
    """
    spec = MODE_REGISTRY.get(mode)
    if spec is None:
        _LOGGER.warning(
            "Unknown audio mode %r — falling back to %s",
            mode, AUDIO_COLOR_ADVANCE_ON_ONSET,
        )
        spec = MODE_REGISTRY[AUDIO_COLOR_ADVANCE_ON_ONSET]
    return spec.handler_class(manager)


def serialise_mode_registry() -> list[dict[str, Any]]:
    """Return MODE_REGISTRY as a JSON-ready list of dicts for the frontend.

    Stable ordering: iterates MODE_REGISTRY in insertion order, which matches
    the original mode registration order. The frontend renders options in
    this order too, so the Python registry is the canonical order of
    appearance in the UI.

    Schema (one dict per mode):
        {
            "constant": str,            # e.g. "bass_kick" -- the mode value used in scene configs
            "requires_pro": bool,       # whether pro-tier hardware gives materially better results
            "display_label": str,       # optional override; empty string means frontend derives
                                        # the label from translation key "audio_mode_<constant>"
            "hidden": bool,             # True when the mode should be filtered out of user-facing
                                        # selectors (still dispatched for existing scene configs).
        }
    """
    return [
        {
            "constant": spec.constant,
            "requires_pro": spec.requires_pro,
            "display_label": spec.display_label,
            "hidden": spec.hidden,
        }
        for spec in MODE_REGISTRY.values()
    ]
