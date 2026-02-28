# REST API

[Back to README](../README.md) | [Services reference](services.md) | [Automations](automations.md)

The integration provides a REST API for triggering presets, managing saved presets, querying device status, and more. This is useful for external systems like Node-RED, iOS/Android shortcuts, voice assistant webhooks, or any HTTP client that can send requests.

**Authentication:** Most endpoints require a Home Assistant [long-lived access token](https://developers.home-assistant.io/docs/auth_api/#long-lived-access-token) passed as a Bearer token in the `Authorization` header. Public endpoints are noted below.

**Base URL:** `http://homeassistant.local:8123/api/aqara_advanced_lighting`

## Table of contents

- [Trigger preset](#trigger-preset)
- [Running operations](#running-operations)
- [Supported entities](#supported-entities)
- [Version](#version)
- [Built-in presets](#built-in-presets)
- [User presets](#user-presets)
- [Favorites](#favorites)
- [Segment zones](#segment-zones)
- [Integration examples](#integration-examples)

---

## Trigger preset

`POST /api/aqara_advanced_lighting/trigger`

Activate a preset or stop a running effect/sequence on a target entity.

### Activating a preset

Send a POST request with the target entity, preset type, and preset name:

```bash
curl -X POST http://homeassistant.local:8123/api/aqara_advanced_lighting/trigger \
  -H "Authorization: Bearer YOUR_LONG_LIVED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "light.aqara_ceiling_light",
    "action": "activate",
    "preset_type": "effect",
    "preset": "t1m_sunset"
  }'
```

### Request fields

| Field         | Required       | Description                                                                                   |
| --------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `entity_id`   | Yes            | Target light entity ID                                                                        |
| `action`      | Yes            | `"activate"` or `"stop"`                                                                      |
| `preset_type` | Yes            | `"effect"`, `"segment_pattern"`, `"cct_sequence"`, `"dynamic_scene"`, or `"segment_sequence"` |
| `preset`      | Yes (activate) | Preset name (built-in or user-created, case-insensitive)                                      |
| `brightness`  | No             | Brightness percentage override (1-100)                                                        |
| `segments`    | No             | Segment range override (e.g.`"1-10"`, `"odd"`)                                                |

### Supported preset types and their actions

| Preset type        | Activate                  | Stop                       |
| -------------------- | --------------------------- | ---------------------------- |
| `effect`           | Starts a dynamic effect   | Stops the running effect   |
| `segment_pattern`  | Applies a segment pattern | N/A (patterns are static)  |
| `cct_sequence`     | Starts a CCT sequence     | Stops the running sequence |
| `dynamic_scene`    | Starts a dynamic scene    | Stops the running scene    |
| `segment_sequence` | Starts a segment sequence | Stops the running sequence |

### Stopping an effect or sequence

```bash
curl -X POST http://homeassistant.local:8123/api/aqara_advanced_lighting/trigger \
  -H "Authorization: Bearer YOUR_LONG_LIVED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "light.aqara_ceiling_light",
    "action": "stop",
    "preset_type": "effect",
    "restore_state": true
  }'
```

When stopping an effect, the optional `restore_state` field (default: `true`) controls whether the light returns to its previous state.

### Activating with optional overrides

```bash
curl -X POST http://homeassistant.local:8123/api/aqara_advanced_lighting/trigger \
  -H "Authorization: Bearer YOUR_LONG_LIVED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "light.aqara_ceiling_light",
    "action": "activate",
    "preset_type": "effect",
    "preset": "t1m_sunset",
    "brightness": 50
  }'
```

### Response format

**Success:**

```json
{"success": true, "service": "set_dynamic_effect", "entity_id": "light.aqara_ceiling_light"}
```

**Error:**

```json
{"success": false, "error": "Entity `light.nonexistent` not found"}
```

### HTTP status codes

| Code | Meaning                                                                  |
| ------ | -------------------------------------------------------------------------- |
| 200  | Preset triggered or effect stopped successfully                          |
| 400  | Invalid request (missing fields, invalid preset type, etc.)              |
| 401  | Missing or invalid authentication token                                  |
| 404  | Entity not found                                                         |
| 422  | Service validation error (unsupported device, invalid preset name, etc.) |
| 500  | Internal error during service execution                                  |

---

## Running operations

`GET /api/aqara_advanced_lighting/running_operations`

Returns all currently active effects, sequences, scenes, and music sync across all backend instances.

**Example response:**

```json
{
  "operations": [
    {
      "type": "effect",
      "entity_id": "light.living_room",
      "preset_id": "t1m_sunset",
      "paused": false,
      "externally_paused": false
    },
    {
      "type": "cct_sequence",
      "entity_id": "light.bedroom",
      "preset_id": "goodnight",
      "paused": false,
      "externally_paused": false,
      "current_step": 2,
      "total_steps": 5
    },
    {
      "type": "dynamic_scene",
      "scene_id": "abc123",
      "entity_ids": ["light.living_room", "light.kitchen"],
      "preset_id": "sunset_glow",
      "paused": false,
      "externally_paused_entities": []
    },
    {
      "type": "music_sync",
      "entity_id": "light.led_strip",
      "preset_id": null,
      "paused": false,
      "sensitivity": "high",
      "audio_effect": "rainbow"
    }
  ]
}
```

**Operation types:** `effect`, `cct_sequence`, `segment_sequence`, `dynamic_scene`, `music_sync`

---

## Supported entities

`GET /api/aqara_advanced_lighting/supported_entities`

Returns all supported entities with device types, backend info, and instance details. Useful for building external dashboards or determining which features a device supports. Also includes light groups that contain supported entities.

**Example response:**

```json
{
  "entities": [
    {
      "entity_id": "light.living_room",
      "device_type": "t1m",
      "device_name": "Living Room Light",
      "model_id": "lumi.light.acn031",
      "backend_type": "z2m",
      "entry_id": "abc123",
      "ieee_address": "0x00158d0001234567",
      "segment_count": 26
    }
  ],
  "instances": [
    {
      "entry_id": "abc123",
      "title": "Aqara Lighting",
      "backend_type": "z2m",
      "z2m_base_topic": "zigbee2mqtt",
      "device_counts": {
        "t2_rgb": 2,
        "t2_cct": 1,
        "t1m": 3,
        "t1_strip": 1,
        "other": 0,
        "total": 7
      },
      "devices": ["Living Room Light", "Bedroom Light", "LED Strip"]
    }
  ],
  "light_groups": [
    {
      "entity_id": "light.all_aqara",
      "friendly_name": "All Aqara Lights",
      "is_group": true,
      "device_type": "mixed",
      "member_count": 3,
      "member_ids": ["light.living_room", "light.bedroom", "light.led_strip"],
      "member_device_types": ["t1m", "t2_bulb", "t1_strip"]
    }
  ]
}
```

---

## Version

`GET /api/aqara_advanced_lighting/version`

**Authentication:** Not required.

Returns the integration version and setup status. Useful for health checks and compatibility verification.

**Example response:**

```json
{
  "version": "1.0.0",
  "setup_complete": true
}
```

---

## Built-in presets

`GET /api/aqara_advanced_lighting/presets`

**Authentication:** Not required.

Returns all built-in preset data organized by type. This includes the Aqara app presets for effects and segment patterns, as well as built-in CCT sequences, segment sequences, and dynamic scenes.

**Example response:**

```json
{
  "dynamic_effects": {
    "t2_bulb": [...],
    "t1m": [...],
    "t1_strip": [...]
  },
  "segment_patterns": [...],
  "cct_sequences": [...],
  "segment_sequences": [...],
  "dynamic_scenes": [...]
}
```

---

## User presets

Manage user-created presets. All user preset endpoints require authentication.

### List presets

`GET /api/aqara_advanced_lighting/user_presets`

Returns all user presets, optionally filtered by type.

**Query parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `type` | No | Filter by preset type: `effect`, `segment_pattern`, `cct_sequence`, `segment_sequence`, or `dynamic_scene` |

**Example:** `GET /api/aqara_advanced_lighting/user_presets?type=effect`

### Create preset

`POST /api/aqara_advanced_lighting/user_presets`

**Request body:**

```json
{
  "type": "effect",
  "data": {
    "name": "My Custom Effect",
    "effect": "breathing",
    "speed": 50,
    "colors": [{"x": 0.68, "y": 0.32}]
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | Preset type (`effect`, `segment_pattern`, `cct_sequence`, `segment_sequence`, `dynamic_scene`) |
| `data` | Yes | Preset data object (must include `name`) |

**Response:** Created preset object (status 201).

### Get single preset

`GET /api/aqara_advanced_lighting/user_presets/{preset_type}/{preset_id}`

Returns a single preset by type and ID.

### Update preset

`PUT /api/aqara_advanced_lighting/user_presets/{preset_type}/{preset_id}`

Update an existing preset. Send the updated data fields in the request body.

**Response:** Updated preset object. Returns 404 if not found.

### Delete preset

`DELETE /api/aqara_advanced_lighting/user_presets/{preset_type}/{preset_id}`

Delete a user preset. Returns 204 on success, 404 if not found.

### Duplicate preset

`POST /api/aqara_advanced_lighting/user_presets/{preset_type}/{preset_id}/duplicate`

Create a copy of an existing preset with an optional custom name.

**Request body (optional):**

```json
{
  "name": "Copy of My Effect"
}
```

**Response:** New preset object (status 201). Returns 404 if source preset not found.

---

## Favorites

### List favorites

`GET /api/aqara_advanced_lighting/favorites`

Returns all saved entity favorites for the current user. Favorites are quick-access entity groupings used in the frontend panel.

**Example response:**

```json
{
  "favorites": [
    {
      "id": "abc123",
      "entities": ["light.living_room", "light.bedroom"],
      "name": "Upstairs Lights"
    }
  ]
}
```

---

## Segment zones

Manage named segment zones for devices. Zones map a name to a segment range so you can use zone names in service calls instead of raw segment numbers. See [segment zones](device-configuration.md#segment-zones) for more details.

### Get zones for a device

`GET /api/aqara_advanced_lighting/segment_zones/{ieee_address}`

**Path parameters:**

| Parameter | Format | Description |
|-----------|--------|-------------|
| `ieee_address` | `0x` followed by 16 hex characters | IEEE address of the device |

**Example response:**

```json
{
  "zones": {
    "left side": "1-10",
    "right side": "11-20",
    "accent": "1-5,15-20"
  }
}
```

### Replace all zones for a device

`PUT /api/aqara_advanced_lighting/segment_zones/{ieee_address}`

Replace the full set of zones for a device.

**Request body:**

```json
{
  "zones": {
    "left side": "1-10",
    "right side": "11-20"
  }
}
```

### Delete a single zone

`DELETE /api/aqara_advanced_lighting/segment_zones/{ieee_address}/{zone_name}`

Delete a single zone by name. Returns 204 on success, 404 if zone not found.

---

## Integration examples

### Node-RED

Use an HTTP Request node with:

- **Method**: POST
- **URL**: `http://homeassistant.local:8123/api/aqara_advanced_lighting/trigger`
- **Headers**: `Authorization: Bearer YOUR_LONG_LIVED_TOKEN`, `Content-Type: application/json`
- **Payload**:

```json
{
  "entity_id": "light.aqara_ceiling_light",
  "action": "activate",
  "preset_type": "effect",
  "preset": "t1m_sunset"
}
```

### iOS Shortcuts

1. Create a new shortcut
2. Add a "Get Contents of URL" action
3. Set the URL to `http://homeassistant.local:8123/api/aqara_advanced_lighting/trigger`
4. Set method to POST
5. Add headers: `Authorization: Bearer YOUR_LONG_LIVED_TOKEN` and `Content-Type: application/json`
6. Set the request body to JSON with your trigger parameters

---

**Next**: [Troubleshooting](troubleshooting.md) | [Services reference](services.md)
