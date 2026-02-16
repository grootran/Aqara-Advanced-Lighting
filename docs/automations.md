# Automations

[Back to README](../README.md) | [Services reference](services.md) | [REST API](rest-api.md)

This guide covers device triggers, device conditions, and practical automation examples for Aqara Advanced Lighting.

## Table of contents

- [Device triggers](#device-triggers)
- [Device conditions](#device-conditions)
- [Automation examples](#automation-examples)
  - [Common patterns](#common-patterns)
  - [Advanced patterns](#advanced-patterns)
  - [YAML examples by feature](#yaml-examples-by-feature)
- [Tips and best practices](#tips-and-best-practices)

## Device triggers

![Aqara Advanced Lighting Device Triggers](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/trigger.png "Aqara Advanced Lighting Device Triggers")

The integration provides device triggers that let you build automations that respond to sequence, effect, scene, and music sync events. These triggers appear in the Home Assistant automation UI when you select a device trigger for any supported Aqara light.

To use a device trigger in an automation:

1. Create a new automation
2. For the trigger, select **Device**
3. Choose your Aqara light device
4. Select from the available trigger types

### CCT sequence triggers

| Trigger                   | Description                                              |
| --------------------------- | ---------------------------------------------------------- |
| CCT sequence started      | Fires when a CCT sequence begins playing                 |
| CCT sequence completed    | Fires when a CCT sequence finishes all steps and loops   |
| CCT sequence stopped      | Fires when a CCT sequence is manually stopped            |
| CCT sequence step changed | Fires each time a CCT sequence advances to the next step |
| CCT sequence paused       | Fires when a CCT sequence is paused                      |
| CCT sequence resumed      | Fires when a paused CCT sequence is resumed              |

### RGB segment sequence triggers

| Trigger                       | Description                                                       |
| ------------------------------- | ------------------------------------------------------------------- |
| Segment sequence started      | Fires when an RGB segment sequence begins playing                 |
| Segment sequence completed    | Fires when an RGB segment sequence finishes all steps and loops   |
| Segment sequence stopped      | Fires when an RGB segment sequence is manually stopped            |
| Segment sequence step changed | Fires each time an RGB segment sequence advances to the next step |
| Segment sequence paused       | Fires when an RGB segment sequence is paused                      |
| Segment sequence resumed      | Fires when a paused RGB segment sequence is resumed               |

### Dynamic effect triggers

| Trigger                  | Description                                               |
| -------------------------- | ----------------------------------------------------------- |
| Dynamic effect activated | Fires when a dynamic RGB effect is activated on the light |
| Dynamic effect stopped   | Fires when a dynamic RGB effect is stopped                |

### Dynamic scene triggers

| Trigger                      | Description                                            |
| ------------------------------ | -------------------------------------------------------- |
| Dynamic scene started        | Fires when a dynamic scene begins playing              |
| Dynamic scene stopped        | Fires when a dynamic scene is manually stopped         |
| Dynamic scene paused         | Fires when a dynamic scene is paused                   |
| Dynamic scene resumed        | Fires when a paused dynamic scene is resumed           |
| Dynamic scene loop completed | Fires each time a dynamic scene completes a full loop  |
| Dynamic scene finished       | Fires when a dynamic scene finishes all loops and ends |

### Music sync triggers (T1 LED Strip only)

| Trigger             | Description                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| Music sync enabled  | Fires when music sync (audio-reactive mode) is enabled. Event data includes sensitivity and audio effect |
| Music sync disabled | Fires when music sync is disabled and the light state is restored                              |

### Preset filter

Sequence, effect, and scene triggers support an optional preset filter. When specified, the trigger only activates if the specific preset name is started, paused, or stopped. This allows you to create automations that respond to specific effects or sequences. Music sync triggers do not support preset filtering.

## Device conditions

![Aqara Advanced Lighting Device Conditions](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/condition.png "Aqara Advanced Lighting Device Conditions")

The integration provides device conditions that can be used in automation conditions to check the current state of lights. These conditions appear in the Home Assistant automation UI when you select a device condition for any supported Aqara light.

To use a device condition in an automation:

1. Create or edit an automation
2. Add a condition
3. Select **Device**
4. Choose your Aqara light device
5. Select from the available condition types
6. Optionally filter by a specific preset name

### Available conditions

| Condition                   | Description                                                         |
| ----------------------------- | --------------------------------------------------------------------- |
| CCT sequence is running     | True when a CCT sequence is actively running on the device          |
| CCT sequence is paused      | True when a CCT sequence is paused on the device                    |
| Segment sequence is running | True when an RGB segment sequence is actively running on the device |
| Segment sequence is paused  | True when an RGB segment sequence is paused on the device           |
| Dynamic effect is active    | True when a dynamic RGB effect is currently active on the device    |
| Dynamic scene is running    | True when a dynamic scene is actively running on the device         |
| Dynamic scene is paused     | True when a dynamic scene is paused on the device                   |
| Music sync is active        | True when music sync (audio-reactive mode) is active on the device (T1 LED Strip only) |

Sequence, effect, and scene conditions support an optional preset filter. When specified, the condition only returns true if the specific preset name is running or paused. The music sync condition does not support preset filtering.

## Automation examples

All examples use the standard Home Assistant automation structure:

```yaml
trigger:
  - platform: ...  # When to run
condition:
  - condition: ...  # Optional: requirements to run
action:
  - service: aqara_advanced_lighting...  # What to do
    target:
      entity_id: light.bedroom
    data:
      preset: ...
```

### Common patterns

#### Circadian rhythm at sunrise

Automatically adjust lighting throughout the day to match natural light patterns.

```yaml
alias: Circadian lighting
description: Start circadian rhythm sequence at sunrise
trigger:
  - platform: sun
    event: sunrise
    offset: "-00:30:00"  # Start 30 min before sunrise
condition:
  - condition: state
    entity_id: input_boolean.circadian_mode
    state: "on"
action:
  - service: aqara_advanced_lighting.start_cct_sequence
    target:
      entity_id:
        - light.bedroom
        - light.living_room
    data:
      preset: circadian
      loop_mode: continuous
```

**Variations:**
- Use `event: sunset` for evening transitions
- Add `offset: "01:00:00"` to delay 1 hour after sunrise
- Use `condition: zone` to only run when someone is home

#### Bedtime routine

Gradually dim lights to warm tones, then turn off automatically.

```yaml
alias: Bedtime lighting
description: 30-minute wind-down sequence
trigger:
  - platform: time
    at: "22:00:00"
condition:
  - condition: state
    entity_id: binary_sensor.bedroom_occupied
    state: "on"
action:
  - service: aqara_advanced_lighting.start_cct_sequence
    target:
      entity_id: light.bedroom
    data:
      preset: goodnight
      brightness: 50
      end_behavior: turn_off
```

**Tips:**
- Use `input_datetime` helper for adjustable bedtime
- Add condition to skip on weekends: `condition: time, weekday: [mon, tue, wed, thu, fri]`
- Chain with other actions: lock doors, adjust thermostat

#### Wake-up simulation

Simulate sunrise with gradually increasing brightness and cooler color temperature.

```yaml
alias: Wake up lighting
description: Sunrise simulation 30 minutes before alarm
trigger:
  - platform: template
    value_template: "{{ (state_attr('input_datetime.alarm_time', 'timestamp') - 1800) | timestamp_custom('%H:%M') == now().strftime('%H:%M') }}"
condition:
  - condition: state
    entity_id: input_boolean.alarm_enabled
    state: "on"
  - condition: time
    weekday: [mon, tue, wed, thu, fri]
action:
  - service: aqara_advanced_lighting.start_cct_sequence
    target:
      entity_id: light.bedroom
    data:
      preset: wakeup
      loop_mode: once
```

#### Stop sequences on motion

Interrupt automated sequences when room is actively used.

```yaml
alias: Stop sequence on motion
description: Return to manual control when motion detected
trigger:
  - platform: state
    entity_id: binary_sensor.bedroom_motion
    to: "on"
condition:
  - condition: template
    value_template: "{{ state_attr('light.bedroom', 'sequence_active') == true }}"
action:
  - service: aqara_advanced_lighting.stop_cct_sequence
    target:
      entity_id: light.bedroom
    data:
      restore_state: false
```

#### Party mode toggle

Toggle dynamic effects with a button or switch.

```yaml
alias: Party mode toggle
description: Start/stop party effect with wall switch
trigger:
  - platform: state
    entity_id: sensor.switch_action
    to: "double"
action:
  - if:
      - condition: template
        value_template: "{{ state_attr('light.living_room', 'effect_active') == true }}"
    then:
      - service: aqara_advanced_lighting.stop_effect
        target:
          entity_id: light.living_room
        data:
          restore_state: true
    else:
      - service: aqara_advanced_lighting.set_dynamic_effect
        target:
          entity_id: light.living_room
        data:
          preset: t1m_party
          speed: 75
```

#### Animated segment sequence

Start RGB segment animations based on triggers.

```yaml
alias: Loading bar effect
description: Show loading animation during system updates
trigger:
  - platform: state
    entity_id: update.home_assistant_core_update
    to: "on"
action:
  - service: aqara_advanced_lighting.start_segment_sequence
    target:
      entity_id: light.strip_office
    data:
      preset: loading_bar
      loop_mode: continuous
  - wait_for_trigger:
      - platform: state
        entity_id: update.home_assistant_core_update
        to: "off"
  - service: aqara_advanced_lighting.stop_segment_sequence
    target:
      entity_id: light.strip_office
    data:
      restore_state: true
```

#### Static segment pattern

Apply multi-color segment patterns.

```yaml
alias: Holiday lighting
description: Display festive colors on light strip
trigger:
  - platform: time
    at: "17:00:00"
condition:
  - condition: state
    entity_id: calendar.holidays
    state: "on"
action:
  - service: aqara_advanced_lighting.set_segment_pattern
    target:
      entity_id: light.strip_entrance
    data:
      preset: segment_3
      brightness: 80
      turn_off_unspecified: true
```

#### Pause and resume on doorbell

Temporarily interrupt sequences without losing progress.

```yaml
alias: Pause sequence on doorbell
description: Pause sequence when doorbell rings, resume after
trigger:
  - platform: state
    entity_id: binary_sensor.doorbell
    to: "on"
condition:
  - condition: template
    value_template: "{{ state_attr('light.entrance', 'sequence_active') == true }}"
action:
  - service: aqara_advanced_lighting.pause_cct_sequence
    target:
      entity_id: light.entrance
  - delay: "00:05:00"
  - service: aqara_advanced_lighting.resume_cct_sequence
    target:
      entity_id: light.entrance
```

### Advanced patterns

#### Conditional sequence selection

Choose different sequences based on conditions.

```yaml
alias: Adaptive evening lighting
description: Different sequences based on activity
trigger:
  - platform: sun
    event: sunset
action:
  - choose:
      - conditions:
          - condition: state
            entity_id: media_player.tv
            state: "playing"
        sequence:
          - service: aqara_advanced_lighting.set_dynamic_effect
            target:
              entity_id: light.living_room
            data:
              preset: t2_candlelight
              brightness: 30
      - conditions:
          - condition: state
            entity_id: binary_sensor.work_mode
            state: "on"
        sequence:
          - service: aqara_advanced_lighting.start_cct_sequence
            target:
              entity_id: light.office
            data:
              preset: circadian
              brightness: 100
    default:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id:
            - light.living_room
            - light.kitchen
        data:
          preset: goodnight
          brightness: 60
```

#### Chained automations

Create complex behaviors by chaining sequences.

```yaml
# Automation 1: Morning routine
alias: Morning routine
trigger:
  - platform: time
    at: "06:00:00"
action:
  - service: aqara_advanced_lighting.start_cct_sequence
    target:
      entity_id: light.bedroom
    data:
      preset: wakeup
  - delay: "00:30:00"
  - event: morning_sequence_complete
    event_data:
      room: bedroom
```

```yaml
# Automation 2: Continue to bathroom
alias: Morning routine - bathroom
trigger:
  - platform: event
    event_type: morning_sequence_complete
action:
  - service: aqara_advanced_lighting.start_cct_sequence
    target:
      entity_id: light.bathroom
    data:
      preset: wakeup
      brightness: 100
```

#### Reusable scripts

Create reusable scripts for common sequences.

```yaml
# Script definition
script:
  start_meditation:
    alias: Start meditation sequence
    sequence:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id: "{{ target }}"
        data:
          preset: mindful_breathing
          loop_mode: count
          loop_count: "{{ duration | default(10) }}"
      - service: notify.mobile_app
        data:
          message: "Meditation session started ({{ duration }} cycles)"
```

```yaml
# Use in automation
alias: Evening meditation
trigger:
  - platform: time
    at: "20:00:00"
action:
  - service: script.start_meditation
    data:
      target: light.meditation_room
      duration: 15
```

#### Template-based dynamic parameters

Use templates to calculate parameters dynamically.

```yaml
alias: Adaptive brightness sequence
description: Adjust brightness based on time of day
trigger:
  - platform: time_pattern
    hours: "/1"
condition:
  - condition: state
    entity_id: light.living_room
    state: "on"
action:
  - service: aqara_advanced_lighting.start_cct_sequence
    target:
      entity_id: light.living_room
    data:
      preset: circadian
      brightness: >
        {% set hour = now().hour %}
        {% if 6 <= hour < 9 %}
          80
        {% elif 9 <= hour < 18 %}
          100
        {% elif 18 <= hour < 22 %}
          70
        {% else %}
          30
        {% endif %}
```

### Using triggers in automations

#### Turn off other lights when a sequence completes

```yaml
automation:
  - alias: "Turn off lights after goodnight sequence"
    trigger:
      - platform: device
        domain: aqara_advanced_lighting
        device_id: <your_device_id>
        type: cct_sequence_completed
    action:
      - service: light.turn_off
        target:
          entity_id: light.hallway
```

#### Send a notification when an effect is activated

```yaml
automation:
  - alias: "Notify when party effect starts"
    trigger:
      - platform: device
        domain: aqara_advanced_lighting
        device_id: <your_device_id>
        type: effect_activated
    action:
      - service: notify.mobile_app
        data:
          message: "Party lights are on!"
```

#### Chain sequences together

```yaml
automation:
  - alias: "Start segment sequence after CCT sequence finishes"
    trigger:
      - platform: device
        domain: aqara_advanced_lighting
        device_id: <your_device_id>
        type: cct_sequence_completed
    action:
      - service: aqara_advanced_lighting.start_segment_sequence
        target:
          entity_id: light.aqara_ceiling_light
        data:
          preset: "wave"
```

#### React to sequence step changes

```yaml
automation:
  - alias: "Adjust blinds as CCT sequence progresses"
    trigger:
      - platform: device
        domain: aqara_advanced_lighting
        device_id: <your_device_id>
        type: cct_sequence_step_changed
    action:
      - service: cover.set_cover_position
        target:
          entity_id: cover.living_room_blinds
        data:
          position: 50
```

#### Dim room lights when music sync starts

```yaml
automation:
  - alias: "Set mood lighting for music sync"
    trigger:
      - platform: device
        domain: aqara_advanced_lighting
        device_id: <your_device_id>
        type: music_sync_enabled
    action:
      - service: light.turn_on
        target:
          entity_id: light.living_room
        data:
          brightness_pct: 20
```

### Using conditions in automations

#### Only turn on fan if specific CCT sequence is running

```yaml
automation:
  - alias: "Turn on fan during sleep sequence"
    trigger:
      - platform: time
        at: "22:00:00"
    condition:
      - condition: device
        domain: aqara_advanced_lighting
        device_id: <your_device_id>
        type: cct_sequence_running
        preset_filter: "goodnight"
    action:
      - service: fan.turn_on
        target:
          entity_id: fan.bedroom_fan
```

#### Send notification if any sequence is paused

```yaml
automation:
  - alias: "Notify when sequence paused"
    trigger:
      - platform: state
        entity_id: binary_sensor.motion_sensor
        to: "on"
    condition:
      - condition: or
        conditions:
          - condition: device
            domain: aqara_advanced_lighting
            device_id: <your_device_id>
            type: cct_sequence_paused
          - condition: device
            domain: aqara_advanced_lighting
            device_id: <your_device_id>
            type: segment_sequence_paused
          - condition: device
            domain: aqara_advanced_lighting
            device_id: <your_device_id>
            type: dynamic_scene_paused
    action:
      - service: notify.mobile_app
        data:
          message: "A lighting sequence was paused when motion was detected"
```

#### Resume scene only if it was running before

```yaml
automation:
  - alias: "Resume dynamic scene after movie ends"
    trigger:
      - platform: state
        entity_id: media_player.living_room_tv
        from: "playing"
        to: "off"
    condition:
      - condition: device
        domain: aqara_advanced_lighting
        device_id: <your_device_id>
        type: dynamic_scene_running
    action:
      - service: aqara_advanced_lighting.resume_dynamic_scene
        target:
          entity_id: light.living_room_ceiling
```

#### Prevent turning off lights during active effect

```yaml
automation:
  - alias: "Block light off command during party mode"
    trigger:
      - platform: event
        event_type: call_service
        event_data:
          domain: light
          service: turn_off
    condition:
      - condition: device
        domain: aqara_advanced_lighting
        device_id: <your_device_id>
        type: effect_active
        preset_filter: "party_effect"
    action:
      - service: persistent_notification.create
        data:
          message: "Cannot turn off lights during party mode effect"
```

### Advanced: listening to custom events

In addition to device triggers (which work in the UI), the integration fires custom events on the Home Assistant event bus. Advanced users can listen for these directly using `platform: event` triggers, which allows more flexible filtering and access to event data attributes.

**Sequence events** (CCT and RGB segment sequences share the same event names, differentiated by `sequence_type`):

| Event name | Fired when |
|---|---|
| `aqara_advanced_lighting_sequence_started` | A sequence begins playing |
| `aqara_advanced_lighting_sequence_completed` | A sequence finishes all steps and loops |
| `aqara_advanced_lighting_sequence_stopped` | A sequence is manually stopped |
| `aqara_advanced_lighting_step_changed` | A sequence advances to the next step |
| `aqara_advanced_lighting_sequence_paused` | A sequence is paused |
| `aqara_advanced_lighting_sequence_resumed` | A paused sequence is resumed |

Sequence event data attributes: `entity_id`, `sequence_id`, `total_steps`, `sequence_type` (`cct` or `segment`), `preset`. Step changed events also include `step_index` and `loop_iteration`.

**Effect events:**

| Event name | Fired when |
|---|---|
| `aqara_advanced_lighting_effect_activated` | A dynamic RGB effect is activated |
| `aqara_advanced_lighting_effect_stopped` | A dynamic RGB effect is stopped |

Effect event data attributes: `entity_id`, `effect_type`, `preset`.

**Dynamic scene events:**

| Event name | Fired when |
|---|---|
| `aqara_advanced_lighting_dynamic_scene_started` | A dynamic scene begins |
| `aqara_advanced_lighting_dynamic_scene_paused` | A dynamic scene is paused |
| `aqara_advanced_lighting_dynamic_scene_resumed` | A paused dynamic scene is resumed |
| `aqara_advanced_lighting_dynamic_scene_stopped` | A dynamic scene is stopped |
| `aqara_advanced_lighting_dynamic_scene_loop_completed` | A dynamic scene completes one full loop |
| `aqara_advanced_lighting_dynamic_scene_finished` | A dynamic scene finishes all loops |

**Music sync events:**

| Event name | Fired when |
|---|---|
| `aqara_advanced_lighting_music_sync_enabled` | Music sync is enabled |
| `aqara_advanced_lighting_music_sync_disabled` | Music sync is disabled |

Music sync event data attributes: `entity_id`, `sensitivity`, `audio_effect`.

**Entity control events:**

| Event name | Fired when |
|---|---|
| `aqara_advanced_lighting_entity_externally_controlled` | A light is paused from a running action due to external changes |
| `aqara_advanced_lighting_entity_control_resumed` | A paused light is resumed back into a running action |

**Example -- trigger automation on a specific CCT sequence step:**

```yaml
automation:
  - alias: "Dim hallway at step 3 of bedtime sequence"
    trigger:
      - platform: event
        event_type: aqara_advanced_lighting_step_changed
        event_data:
          sequence_type: cct
          preset: "goodnight"
          step_index: 2  # 0-indexed, so step 3
    action:
      - service: light.turn_on
        target:
          entity_id: light.hallway
        data:
          brightness_pct: 10
```

### YAML examples by feature

#### RGB dynamic effects

**Sunset effect at evening:**

```yaml
automation:
  - alias: "Sunset effect at evening"
    trigger:
      - platform: sun
        event: sunset
    action:
      - service: aqara_advanced_lighting.set_dynamic_effect
        target:
          entity_id: light.living_room_ceiling
        data:
          effect: "breathing"
          speed: 30
          colors:
            - r: 255
              g: 100
              b: 0
            - r: 255
              g: 50
              b: 0
```

**Party mode script:**

```yaml
script:
  party_mode:
    alias: "Party Mode Lights"
    sequence:
      - service: aqara_advanced_lighting.set_dynamic_effect
        target:
          entity_id: light.led_strip
        data:
          effect: "rainbow1"
          speed: 90
          colors:
            - r: 255
              g: 0
              b: 0
            - r: 255
              g: 255
              b: 0
            - r: 0
              g: 255
              b: 0
            - r: 0
              g: 255
              b: 255
            - r: 0
              g: 0
              b: 255
            - r: 255
              g: 0
              b: 255
```

**Morning gradient:**

```yaml
automation:
  - alias: "Morning wake up"
    trigger:
      - platform: time
        at: "07:00:00"
    action:
      - service: aqara_advanced_lighting.create_gradient
        target:
          entity_id: light.bedroom_ceiling
        data:
          color_1: [255, 200, 100]   # Warm orange
          color_2: [255, 255, 200]   # Soft white
          turn_on: true
```

#### CCT sequence presets

**Wakeup sequence:**

```yaml
automation:
  - alias: "Sunrise wakeup"
    trigger:
      - platform: time
        at: "06:30:00"
    action:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id: light.bedroom_ceiling
        data:
          preset: "wakeup"
          turn_on: true
```

**Goodnight sequence:**

```yaml
automation:
  - alias: "Bedtime routine"
    trigger:
      - platform: time
        at: "22:00:00"
    action:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id: light.bedroom_ceiling
        data:
          preset: "goodnight"
          turn_on: true
```

**Mindful breathing script:**

```yaml
script:
  meditation_mode:
    alias: "Meditation Breathing Light"
    sequence:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id: light.living_room_ceiling
        data:
          preset: "mindful_breathing"
          turn_on: true
```

**Custom circadian rhythm:**

```yaml
automation:
  - alias: "Circadian lighting sequence"
    trigger:
      - platform: time
        at: "06:00:00"
    action:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id: light.living_room_ceiling
        data:
          turn_on: true
          step_1_color_temp: 2700      # Warm morning light
          step_1_brightness: 100
          step_1_transition: 5.0
          step_1_hold: 7200.0          # Hold for 2 hours
          step_2_color_temp: 4000      # Midday neutral
          step_2_brightness: 200
          step_2_transition: 10.0
          step_2_hold: 14400.0         # Hold for 4 hours
          step_3_color_temp: 5500      # Afternoon cool
          step_3_brightness: 255
          step_3_transition: 10.0
          step_3_hold: 10800.0         # Hold for 3 hours
          step_4_color_temp: 3500      # Evening warm
          step_4_brightness: 150
          step_4_transition: 10.0
          step_4_hold: 7200.0          # Hold for 2 hours
          step_5_color_temp: 2200      # Night warm dim
          step_5_brightness: 50
          step_5_transition: 5.0
          step_5_hold: 3600.0          # Hold for 1 hour
          loop_mode: "once"
          end_behavior: "maintain"
```

**Reading light script:**

```yaml
script:
  reading_mode:
    alias: "Reading Mode CCT Sequence"
    sequence:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id: light.desk_lamp
        data:
          turn_on: true
          step_1_color_temp: 4500      # Focus light
          step_1_brightness: 255
          step_1_transition: 1.0
          step_1_hold: 1800.0          # Hold for 30 minutes
          step_2_color_temp: 3500      # Ease eyes
          step_2_brightness: 200
          step_2_transition: 2.0
          step_2_hold: 1800.0          # Hold for 30 minutes
          step_3_color_temp: 2700      # Relax
          step_3_brightness: 150
          step_3_transition: 3.0
          step_3_hold: 900.0           # Hold for 15 minutes
          loop_mode: "once"
          end_behavior: "maintain"
```

#### RGB segment sequences

**Wave preset:**

```yaml
automation:
  - alias: "Party mode wave effect"
    trigger:
      - platform: state
        entity_id: input_boolean.party_mode
        to: "on"
    action:
      - service: aqara_advanced_lighting.start_segment_sequence
        target:
          entity_id: light.living_room_ceiling
        data:
          preset: "wave"
          turn_on: true
```

**Loading bar preset:**

```yaml
script:
  startup_sequence:
    alias: "Startup Loading Bar"
    sequence:
      - service: aqara_advanced_lighting.start_segment_sequence
        target:
          entity_id: light.led_strip
        data:
          preset: "loading_bar"
          turn_on: true
```

**Alert flashing:**

```yaml
automation:
  - alias: "Security alert sequence"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door
        to: "on"
    action:
      - service: aqara_advanced_lighting.start_segment_sequence
        target:
          entity_id: light.entrance_ceiling
        data:
          turn_on: true
          step_1_segments: "all"
          step_1_colors:
            - r: 255
              g: 0
              b: 0
          step_1_mode: "blocks_repeat"
          step_1_duration: 0.5
          step_1_hold: 0.5
          step_1_activation_pattern: "all"
          step_2_segments: "all"
          step_2_colors:
            - r: 0
              g: 0
              b: 0
          step_2_mode: "blocks_repeat"
          step_2_duration: 0.5
          step_2_hold: 0.5
          step_2_activation_pattern: "all"
          loop_mode: "count"
          loop_count: 5
          end_behavior: "turn_off"
```

**Rainbow chase:**

```yaml
script:
  rainbow_chase:
    alias: "Rainbow Chase Effect"
    sequence:
      - service: aqara_advanced_lighting.start_segment_sequence
        target:
          entity_id: light.led_strip
        data:
          turn_on: true
          step_1_segments: "all"
          step_1_colors:
            - r: 255
              g: 0
              b: 0
            - r: 255
              g: 127
              b: 0
            - r: 255
              g: 255
              b: 0
            - r: 0
              g: 255
              b: 0
            - r: 0
              g: 0
              b: 255
            - r: 148
              g: 0
              b: 211
          step_1_mode: "gradient"
          step_1_duration: 5.0
          step_1_hold: 0.0
          step_1_activation_pattern: "sequential_forward"
          step_2_segments: "all"
          step_2_colors:
            - r: 148
              g: 0
              b: 211
            - r: 0
              g: 0
              b: 255
            - r: 0
              g: 255
              b: 0
            - r: 255
              g: 255
              b: 0
            - r: 255
              g: 127
              b: 0
            - r: 255
              g: 0
              b: 0
          step_2_mode: "gradient"
          step_2_duration: 5.0
          step_2_hold: 0.0
          step_2_activation_pattern: "sequential_reverse"
          loop_mode: "continuous"
          end_behavior: "maintain"
```

**Startup intro with looping patterns:**

```yaml
automation:
  - alias: "Party lights with intro"
    trigger:
      - platform: state
        entity_id: input_boolean.party_mode
        to: "on"
    action:
      - service: aqara_advanced_lighting.start_segment_sequence
        target:
          entity_id: light.led_strip
        data:
          turn_on: true
          clear_segments: true  # Clear any existing patterns first
          # Step 1: Dramatic white flash intro (only runs once)
          step_1_segments: "all"
          step_1_colors:
            - r: 255
              g: 255
              b: 255
          step_1_mode: "blocks_repeat"
          step_1_duration: 0.2
          step_1_hold: 0.3
          step_1_activation_pattern: "all"
          # Step 2: Red chase (loops)
          step_2_segments: "all"
          step_2_colors:
            - r: 255
              g: 0
              b: 0
          step_2_mode: "blocks_repeat"
          step_2_duration: 1.0
          step_2_hold: 0.0
          step_2_activation_pattern: "sequential_forward"
          # Step 3: Blue chase (loops)
          step_3_segments: "all"
          step_3_colors:
            - r: 0
              g: 0
              b: 255
          step_3_mode: "blocks_repeat"
          step_3_duration: 1.0
          step_3_hold: 0.0
          step_3_activation_pattern: "sequential_reverse"
          loop_mode: "continuous"
          skip_first_in_loop: true  # Skip the white flash intro when looping
          end_behavior: "turn_off"
```

## Tips and best practices

### Entity selection

**Single entity:**
```yaml
target:
  entity_id: light.bedroom
```

**Multiple entities:**
```yaml
target:
  entity_id:
    - light.bedroom
    - light.living_room
```

**All lights in area:**
```yaml
target:
  area_id: bedroom
```

**Device (all entities on device):**
```yaml
target:
  device_id: abc123def456
```

### Parameter overrides

Most services accept override parameters to customize preset behavior:

```yaml
data:
  preset: goodnight
  brightness: 40          # Override preset brightness
  loop_mode: once         # Override preset loop behavior
  end_behavior: turn_off  # Override what happens when complete
```

### Condition examples

**Only run during specific times:**
```yaml
condition:
  - condition: time
    after: "18:00:00"
    before: "23:00:00"
```

**Check if sequence is running:**
```yaml
condition:
  - condition: template
    value_template: "{{ state_attr('light.bedroom', 'sequence_active') == true }}"
```

**Require presence:**
```yaml
condition:
  - condition: state
    entity_id: zone.home
    state: "2"  # At least 2 people home
```

### Performance considerations

- Use `mode: single` to prevent overlapping runs
- Add `max_exceeded: silent` to avoid warnings when automation is already running
- Use `continue_on_error: true` for non-critical actions
- Group multiple entity targets in single service call when possible

### Debugging

Enable automation traces:
1. Go to Settings > Automations & Scenes
2. Click on your automation
3. Click the three-dot menu > "Traces"
4. View execution history and troubleshoot issues

Check service call logs:
```yaml
# Add to configuration.yaml
logger:
  default: info
  logs:
    custom_components.aqara_advanced_lighting: debug
```

## Common questions

**Q: Can I create my own presets?**
A: Yes, create custom presets in the integration's frontend panel, then reference them by name in automations.

**Q: How do I know what presets are available?**
A: In the automation editor, the service form shows all available presets in a dropdown. Built-in presets are listed in the [services reference](services.md).

**Q: Can I use these services in scripts?**
A: Yes, scripts use the same service call syntax as automations.

**Q: What happens if I call a sequence while another is running?**
A: The new sequence stops the previous one and starts immediately. No queuing or conflicts.

**Q: Can I use these with voice assistants?**
A: Yes, create scripts that call these services, then expose the scripts to your voice assistant (Alexa, Google, etc.).

---

**Next**: [REST API](rest-api.md) | [Services reference](services.md)
