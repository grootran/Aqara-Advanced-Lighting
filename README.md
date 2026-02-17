# Aqara Advanced Lighting

[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE)

[![homeassistant][homeassistant-badge]][homeassistant]
[![hacs][hacsbadge]][hacs]

![Aqara Advanced Lighting](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/main/images/aqara-advanced-lighting.png "Aqara Advanced Lighting")

**Aqara Advanced Lighting** is a [Home Assistant](https://www.home-assistant.io/) integration that unlocks the full potential of **Aqara T1M Ceiling Light**, **Aqara T1 LED Strip**, and **Aqara T2 RGB & CCT bulbs** -- dynamic RGB effects, per-segment colors and gradients, animated sequences, multi-step color temperature transitions, dynamic scenes, and more. All the features of the Aqara Home app and more, without an Aqara Hub.

Works with both **Zigbee2MQTT** and **ZHA** (Zigbee Home Automation).

![Zigbee2MQTT](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/zigbee2mqtt.png) ![Zigbee Home Automation](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/zigbee-home-automation.png)

_Please :star: this integration if you find it useful_

_If you want to show your support please_

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)

## Supported devices


| Device                          | Model        | Dynamic Effects | Segment Control | Dynamic Scenes | CCT Sequences |
| --------------------------------- | -------------- | ----------------- | ----------------- | ---------------- | --------------- |
| T1 Ceiling Light (20 segments)  | ACN031       | 6 effects       | Yes             | Yes            | Yes           |
| T1M Ceiling Light (26 segments) | ACN032       | 6 effects       | Yes             | Yes            | Yes           |
| T1 LED Strip                    | ACN132       | 8 effects       | Yes             | Yes            | Yes           |
| T2 RGB Bulb (E26/E27/GU10)      | AGL001/3/5/7 | 4 effects       | N/A             | Yes            | Yes           |
| T2 CCT Bulb (E26/E27/GU10)      | AGL002/4/6/8 | N/A             | N/A             | N/A            | Yes           |
| Non-Aqara lights                | N/A          | N/A             | N/A             | Yes            | Yes           |

## Features

**Lighting control** -- 13 dynamic RGB effects, per-segment colors and gradients, RGB segment sequences (up to 20 steps with 8 activation patterns), CCT sequences (up to 20 steps), dynamic scenes with slow color transitions across multiple lights, pause/resume/stop control, and flexible segment selection.

**100+ presets** -- 20 effects, 12 segment patterns, 4 CCT sequences, 6 segment sequences, 58 dynamic scenes. Create unlimited custom presets with the visual editors, back them up, and reuse them everywhere.

**Frontend panel** -- Sidebar-accessible UI with visual editors for every feature type, favorite lights, active presets monitoring, activation overrides, T1 Strip music sync control, and per-device configuration.

**Automations** -- 19 service actions, 22 device triggers, 8 device conditions, REST API trigger endpoint, light group support with automatic entity expansion, and multi-instance routing.

**Dual backend** -- Zigbee2MQTT and ZHA side by side, multiple Z2M instances, automatic device discovery, and cross-backend entity routing.

## Quick start

1. Install via [HACS](https://hacs.xyz) -- search for **Aqara Advanced Lighting**, or click:

   [![Open HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=absent42&repository=Aqara-Advanced-Lighting&category=Integration)
2. Restart Home Assistant
3. Go to **Settings** > **Devices & Services** > **Add Integration** > search **Aqara Advanced Lighting**
4. Choose your backend (Zigbee2MQTT or ZHA) and follow the prompts

See the [Getting started guide](docs/getting-started.md) for detailed installation, configuration, and multi-instance setup.

## Screenshots


| Frontend panel                                                                                                   | Visual editors                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| ![Aqara Advanced Lighting Panel](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/activate.png) | ![Aqara Advanced Lighting Editors](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/segments.png) |


| Preset management                                                                                                 | Device configuration                                                                                             |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| ![Aqara Advanced Lighting Presets](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/presets.png) | ![Aqara Advanced Lighting Config](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/devices.png) |

## Documentation


| Guide                                                | Description                                                                                        |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| [Getting started](docs/getting-started.md)           | Installation, updating, backend configuration (Z2M and ZHA), multi-instance setup, removal         |
| [Frontend panel](docs/frontend-panel.md)             | Sidebar panel, favorites, light selection, active presets, activation overrides, preset management |
| [Visual editors](docs/visual-editors.md)             | Dynamic scene, effect, segment pattern, CCT sequence, and RGB segment sequence editors             |
| [Device configuration](docs/device-configuration.md) | T2 transition curves, initial brightness, dimming settings, segment zones, strip length            |
| [Services reference](docs/services.md)               | All 19 backend service actions with parameters, examples, and light group support                  |
| [Automations](docs/automations.md)                   | Device triggers, device conditions, and automation examples                                        |
| [REST API](docs/rest-api.md)                         | HTTP trigger endpoint for Node-RED, iOS Shortcuts, voice assistants, and external systems          |
| [Troubleshooting](docs/troubleshooting.md)           | Common issues, backend-specific fixes, firmware info, diagnostics                                  |

## Requirements

- Home Assistant 2025.12.0 or newer
- Supported Aqara light devices with Zigbee firmware (see table above)
- **One or both** Zigbee backends:
  - **Zigbee2MQTT**: MQTT integration + Zigbee2MQTT 2.7.2+
  - **ZHA**: ZHA integration installed and configured

## Contributing

We welcome contributions -- bug fixes, features, presets, translations, and docs. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines and the [preset submissions guide](preset_submissions/README.md) for sharing your custom presets.

## Disclaimer

This is an unofficial integration and is not provided by or supported by Aqara.

## Support

- **Issues**: [GitHub Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Documentation**: [GitHub Repository](https://github.com/absent42/Aqara-Advanced-Lighting)
- **Contributing**: [Contribution Guidelines](CONTRIBUTING.md)

[releases-shield]: https://img.shields.io/github/v/release/absent42/Aqara-Advanced-Lighting?style=for-the-badge
[releases]: https://github.com/absent42/Aqara-Advanced-Lighting/releases
[license-shield]: https://img.shields.io/github/license/absent42/Aqara-Advanced-Lighting?style=for-the-badge
[hacsbadge]: https://img.shields.io/badge/HACS-Default-41BDF5?style=for-the-badge
[hacs]: https://github.com/hacs/integration
[homeassistant-badge]: https://img.shields.io/badge/Home%20Assistant-18BCF2?style=for-the-badge&logo=Home%20Assistant&logoColor=white
[homeassistant]: https://www.home-assistant.io/