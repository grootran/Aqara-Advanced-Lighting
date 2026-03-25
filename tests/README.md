# Aqara Advanced Lighting tests

## Test structure

```
tests/
├── __init__.py                    # Test package initialization
├── conftest.py                    # Shared fixtures and configuration
├── test_audio_discovery.py        # Audio tier detection and companion sensor discovery
├── test_audio_mode_handlers.py    # Audio-reactive v2 model fields and mode handlers
├── test_audio_on_device.py        # Generic on-device audio opt-in
├── test_audio_rich_tier.py        # Rich tier audio-reactive scenes end-to-end
├── test_audio_scene.py            # Audio-reactive dynamic scene model validation
├── test_capability_adaptation.py  # Dynamic scene capability adaptation
├── test_capability_profile.py     # Light capability detection and color temp conversion
├── test_circadian_manager.py      # Circadian overlay manager
├── test_config_flow.py            # Config flow setup and reconfiguration
├── test_device_merging.py         # HA device registry merging with Z2M/ZHA
├── test_device_trigger.py         # Device automation triggers
├── test_entity_controller.py      # Entity override detection, drift, pause/resume
├── test_init.py                   # Integration setup, unload, and device migration
├── test_schedule_cct.py           # Schedule mode CCT sequences (clock/sunrise/sunset)
├── test_segment_utils.py          # Segment parsing and color generation
├── test_solar_cct.py              # Solar mode CCT sequences (elevation-based)
├── test_sun_utils.py              # Solar elevation interpolation
└── README.md                      # This file
```

## Running tests

The `pytest-homeassistant-custom-component` plugin auto-loads via entrypoints and imports Unix-only modules (`fcntl`, `resource`), so it fails on Windows. Use this command to bypass it:

```bash
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest -p asyncio --override-ini="asyncio_mode=auto" --noconftest tests/ -v
```

- **Single file**: append the file path, e.g. `... tests/test_entity_controller.py -v`
- **Filter by name**: add `-k "test_name_pattern"`
- **Stop on first failure**: add `-x`

### Install test dependencies

```bash
pip install -r requirements_test.txt
```

### Run with coverage report

```bash
pytest --cov=custom_components.aqara_advanced_lighting --cov-report=term-missing
```

## Shared fixtures (conftest.py)

| Fixture | Purpose |
|---------|---------|
| `auto_enable_custom_integrations` | Automatically enables custom integrations for all tests |
| `mock_mqtt_client` | Mocks `homeassistant.components.mqtt.async_subscribe` |
| `mock_setup_entry` | Mocks `async_setup_entry` to return True |
| `mock_z2m_validation` | Mocks Z2M base topic validation to always succeed |

## Test coverage by file

### test_audio_discovery.py (12 tests)

Audio tier detection and device-registry sibling discovery.

- **T1 strip parameter mapping** (6): on_onset/continuous/beat_predictive/intensity_breathing/onset_flash mode mapping to blink/wave hardware effects; sensitivity cutoff at 50 → low/high
- **Companion sensor discovery** (6): discovers all sibling sensors by unique_id suffix (bass_energy, amplitude, bpm, onset_detected, silence, sensitivity, squelch, detection_mode); graceful handling of missing optional entities, no device, no siblings; binary_sensor and select type discovery

### test_audio_mode_handlers.py (31 tests)

Audio-reactive v2 model fields and mode handler behavior.

- **DynamicScene audio fields** (12): default values for detection_mode, frequency_zone, silence_degradation, prediction_aggressiveness; on_onset and beat_predictive color advance modes; bass_energy detection mode; invalid detection mode clamped to default; prediction_aggressiveness clamped 1–100; latency_compensation_ms clamped 0–500
- **OnsetHandler** (4): onset advances colors; brightness response modulation with floor at 0.3; no-op when brightness response disabled
- **ContinuousHandler** (3): energy maps palette index; brightness modulation; empty colors safety
- **IntensityBreathingHandler** (2): envelope tracks energy approaching 1.0; envelope decays during silence
- **OnsetFlashHandler** (2): onset sets brightness to 1.0; flash decays over energy updates
- **BeatPredictiveHandler** (8): initial reactive state; configure sets threshold from aggressiveness; state transitions reactive → tracking → predictive; tracking drops to reactive on low confidence; reactive mode advances colors; predictive mode does not advance on onset; cleanup cancels pending handles

### test_audio_on_device.py (5 tests)

Generic on-device audio opt-in for third-party lights.

- On-device audio config constants exist
- Entity audio config round-trips through JSON serialization
- `_get_entity_audio_config` reads from UserPreferencesStore global preferences
- Returns empty dict when no config or no store available

### test_audio_rich_tier.py (3 tests)

End-to-end tests for rich tier audio-reactive scenes.

- Companion discovery maps all 10 sensor roles (bass, mid, high energy, amplitude, bpm, onset, silence, sensitivity, squelch, detection_mode)
- Rich scene model accepts binary_sensor as audio entity
- Continuous mode with rich tier is valid

### test_audio_scene.py (3 tests)

Audio-reactive dynamic scene model validation.

- DynamicScene accepts and validates audio fields (entity, sensitivity, color_advance, transition_speed, brightness_response)
- DynamicScene without audio fields retains default values
- Invalid audio_color_advance raises ValueError

### test_config_flow.py (10 tests)

Config flow setup and reconfiguration.

- User flow with custom and default Z2M base topics
- MQTT not loaded error handling
- Single and multiple instance enforcement
- Reconfigure flow: update topic, preserve defaults, MQTT validation, empty topic fallback, duplicate topic prevention

### test_init.py (8 tests)

Integration initialization, setup, unload, and device migration.

- Successful setup with MQTT, backend, state manager, and sequence managers
- Setup failure when MQTT unavailable (with retry)
- Config entry unload and reload
- v1.3 device migration: removes sole-config-entry devices, removes partial-merge devices, preserves truly merged devices, full clean re-merge

### test_segment_utils.py (18 tests)

Segment range parsing and color generation for LED strips.

- Single, comma-separated, range, and mixed segment specifications
- Special keywords: `odd`, `even`, `first-half`, `last-half`, `first-third`, `last-third`, `all`
- Invalid range and segment rejection
- Gradient color generation (2 and 3+ colors)
- Block color generation (repeat and expand modes)
- Segment color expansion

### test_capability_profile.py (16 tests)

Light capability detection and color temperature conversion.

- Capability detection: full color (XY, HS, RGB, RGBW, RGBWW), CCT-only, brightness-only, on/off-only
- XY to color temp adaptation (warm and cool)
- Color temp clamping (within range, below min, above max)
- Singularity guard for edge-case XY values
- Clamping applied during CCT step transitions
- Missing color modes default behavior

### test_capability_adaptation.py (3 tests)

Dynamic scene capability adaptation per light type.

- CCT-only lights receive `color_temp_kelvin` instead of `xy_color`
- Brightness-only lights skip color in service calls
- Full-color lights receive `xy_color` unchanged

### test_sun_utils.py (6 tests)

Solar elevation-based lighting interpolation.

- Interpolation at exact steps and midpoints (rising phase)
- Setting phase uses separate step definitions
- Below/above elevation boundary hold behavior
- Symmetric "any" phase for both rising and setting

### test_solar_cct.py (5 tests)

Solar mode for CCT sequences (elevation-based color and brightness).

- CCTSequence accepts `mode="solar"` with `solar_steps`
- Default mode is "standard" for backwards compatibility
- Solar mode requires `solar_steps` (ValueError without)
- Solar mode bypasses standard step/loop validation
- Standard mode validation still enforced

### test_schedule_cct.py (23 tests)

Schedule mode for CCT sequences (fixed clock times and sunrise/sunset offsets).

- **ScheduleStep model** (8): fixed time (HH:MM), sunrise/sunset-relative times with zero offset, validation (format, color temp range, brightness range, empty labels)
- **resolve_step_time** (3): fixed times, sunrise-relative, sunset-relative
- **interpolate_schedule_values** (5): midpoint interpolation, step boundaries, midnight wrapping, relative time resolution, minimum step count
- **CCTSequence model** (3): schedule mode acceptance, requires `schedule_steps`, enforces `end_behavior="maintain"`
- **Built-in presets** (4): build_schedule_sequence, Circadian Rhythm, Warm Day, Productive Day all use schedule mode

### test_circadian_manager.py (7 tests)

Circadian overlay manager for continuous solar lighting.

- Start registers state change listener, stop unsubscribes
- Stop nonexistent overlay returns False
- Active entity tracking and stop-all
- Returns interpolated values from current sun state
- Starting on existing entity replaces the overlay

### test_entity_controller.py (49 tests)

Entity override detection, drift tracking, and external change handling.

- **Attribute detection** (8): brightness, color temp, XY color changes; combined changes; no-change; drift tolerance for brightness and color temp
- **Override management** (8): initialization, default/paused states, clearing, pause modes (pause_all vs pause_changed), solar vs standard CCT behavior, attribute merging across pauses
- **Service call detection** (9): brightness keys, step keys, color temp, RGB, combined, effects, bare turn_on, transition-only, flash
- **Dedup and cleanup** (2): service pause times cleared on clear and cleanup
- **Bare turn-on and resume** (8): default behavior, preference reading, solar force-apply on turn-on, skip non-solar, resume solar/scene/partial-override force-apply, non-solar CCT no force-apply
- **Drift detection** (9): no change, within/exceeds brightness threshold, within/exceeds color temp threshold, both exceeding, None value handling for brightness-only and color-temp-only
- **Preference and public API** (4): detect_non_ha_changes default and preference, disabled by ignore_external_changes, public pause_entity delegation
- **Context-based detection** (1): controller initialization

### test_device_merging.py (2 tests)

Home Assistant device registry merging for Aqara lights with Z2M/ZHA.

- Z2M and AAL devices merge via shared MAC connection
- Devices merge regardless of registration order

### test_device_trigger.py (22 tests)

Device automation triggers for sequences and effects.

- **get_entity_ids_for_device** (6): mapped entities, nonexistent device, no domain identifier, unloaded entry, unknown IEEE, multiple entities
- **async_get_triggers** (3): all 22 trigger types returned, nonexistent device, wrong domain device
- **async_attach_trigger** (4): no entities returns no-op, single/multiple entity mapping, effect triggers omit sequence_type filter
- **TRIGGER_SCHEMA** (2): accepts known types, rejects unknown
- **Trigger event map** (5): completeness, CCT/segment sequence type filters, effect no-filter, 22 total trigger types
- **Merged devices** (2): triggers and entity resolution work on merged devices

## Test requirements

### Dependencies

- `pytest` - test framework
- `pytest-homeassistant-custom-component` - Home Assistant test utilities
- `pytest-asyncio` - async test support
- `pytest-cov` - coverage reporting

### Environment

Tests use the `pytest-homeassistant-custom-component` plugin which provides:
- Mock Home Assistant core
- Mock config entries
- MQTT mocking utilities
- Common test fixtures

## Writing new tests

### Test file naming

- Test files must start with `test_`
- Test functions must start with `test_`
- Use descriptive names: `test_user_flow_mqtt_not_loaded`

### Using fixtures

Common fixtures are defined in `conftest.py`:

```python
from pytest_homeassistant_custom_component.common import MockConfigEntry

async def test_my_feature(hass: HomeAssistant, mock_config_entry: MockConfigEntry):
    """Test my feature."""
    mock_config_entry.add_to_hass(hass)
    # Test implementation
```

### Async tests

All tests interacting with Home Assistant must be async:

```python
async def test_async_feature(hass: HomeAssistant):
    """Test async feature."""
    result = await some_async_function()
    assert result is True
```

## Debugging tests

### Run single test

```bash
pytest tests/test_config_flow.py::test_user_flow_success -v
```

### Show print statements

```bash
pytest -s
```

### Traceback options

```bash
pytest --tb=short  # Short traceback
pytest --tb=long   # Long traceback
pytest --tb=line   # One line per failure
```
