# REST API

[Back to README](../README.md) | [Services reference](services.md) | [Automations](automations.md)

The integration provides a REST API endpoint for triggering presets directly over HTTP. This is useful for external systems like Node-RED, iOS/Android shortcuts, voice assistant webhooks, or any HTTP client that can send POST requests.

## Endpoint

`POST /api/aqara_advanced_lighting/trigger`

**Authentication:** Requires a Home Assistant [long-lived access token](https://developers.home-assistant.io/docs/auth_api/#long-lived-access-token) passed as a Bearer token in the `Authorization` header.

## Activating a preset

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

## Request fields

| Field         | Required       | Description                                                                                   |
| --------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `entity_id`   | Yes            | Target light entity ID                                                                        |
| `action`      | Yes            | `"activate"` or `"stop"`                                                                      |
| `preset_type` | Yes            | `"effect"`, `"segment_pattern"`, `"cct_sequence"`, `"dynamic_scene"`, or `"segment_sequence"` |
| `preset`      | Yes (activate) | Preset name (built-in or user-created, case-insensitive)                                      |
| `brightness`  | No             | Brightness percentage override (1-100)                                                        |
| `segments`    | No             | Segment range override (e.g.`"1-10"`, `"odd"`)                                                |

## Supported preset types and their actions

| Preset type        | Activate                  | Stop                       |
| -------------------- | --------------------------- | ---------------------------- |
| `effect`           | Starts a dynamic effect   | Stops the running effect   |
| `segment_pattern`  | Applies a segment pattern | N/A (patterns are static)  |
| `cct_sequence`     | Starts a CCT sequence     | Stops the running sequence |
| `dynamic_scene`    | Starts a dynamic scene    | Stops the running scene    |
| `segment_sequence` | Starts a segment sequence | Stops the running sequence |

## Stopping an effect or sequence

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

## Activating with optional overrides

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

## Response format

**Success:**

```json
{"success": true, "service": "set_dynamic_effect", "entity_id": "light.aqara_ceiling_light"}
```

**Error:**

```json
{"success": false, "error": "Entity `light.nonexistent` not found"}
```

## HTTP status codes

| Code | Meaning                                                                  |
| ------ | -------------------------------------------------------------------------- |
| 200  | Preset triggered or effect stopped successfully                          |
| 400  | Invalid request (missing fields, invalid preset type, etc.)              |
| 401  | Missing or invalid authentication token                                  |
| 404  | Entity not found                                                         |
| 422  | Service validation error (unsupported device, invalid preset name, etc.) |
| 500  | Internal error during service execution                                  |

## Additional endpoints

The integration exposes additional read-only endpoints useful for dashboards and external systems.

### Running operations

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

### Supported entities

`GET /api/aqara_advanced_lighting/supported_entities`

Returns all supported entities with device types, backend info, and instance details. Useful for building external dashboards or determining which features a device supports.

**Example response:**

```json
{
  "entities": [
    {
      "entity_id": "light.living_room",
      "device_type": "t1m",
      "device_name": "Living Room Light",
      "backend_type": "z2m",
      "entry_id": "abc123"
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
      }
    }
  ]
}
```

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
