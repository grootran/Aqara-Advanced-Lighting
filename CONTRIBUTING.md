# Contributing to Aqara Advanced Lighting

Thank you for your interest in contributing to the Aqara Advanced Lighting integration for Home Assistant. This document provides guidelines for contributing code, submitting presets, and reporting issues.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Contributions](#code-contributions)
- [Contributing Language Translations](#contributing-language-translations)
- [Submitting Custom Presets](#submitting-custom-presets)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Code Style](#code-style)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow Home Assistant community guidelines

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your contribution
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

## Development Setup

### Prerequisites

- Python 3.13 or higher
- Node.js 18 or higher (for frontend build tools only)
- Home Assistant development environment
- Docker (for HA dev container, optional)
- Git

**Note**: The frontend is built with Lit (TypeScript/web components). Node.js is only used as a build tool to compile and bundle the frontend code. The final output is vanilla JavaScript that runs in the browser.

### Backend Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Aqara-Advanced-Lighting.git
cd Aqara-Advanced-Lighting

# Install development dependencies
pip install -r requirements_test.txt
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd custom_components/aqara_advanced_lighting/frontend_src

# Install dependencies
npm install

# Build frontend
npm run build

# Watch mode for development
npm run watch
```

### Running in Home Assistant

1. Copy the `custom_components/aqara_advanced_lighting` folder to your Home Assistant `custom_components` directory
2. Restart Home Assistant
3. Add the integration through the UI

## Code Contributions

### What to Contribute

We welcome contributions for:

- Bug fixes
- New features for supported light models (T1, T1M, T1 Strip, T2 Bulb)
- Performance improvements
- Documentation improvements
- Code quality improvements
- Test coverage improvements

### Before You Start

1. Check existing issues and pull requests to avoid duplicates
2. For major changes, open an issue first to discuss the approach
3. Review the existing codebase to understand architecture patterns and code style

### Code Standards

This project follows Home Assistant integration quality standards and best practices.

#### Python Code

- **Python Version**: 3.13+
- **Type Hints**: Required for all functions and methods
- **Formatting**: Use Ruff for formatting
- **Linting**: PyLint and Ruff
- **Type Checking**: MyPy
- **Async**: All I/O operations must be async
- **Error Handling**: Use appropriate Home Assistant exceptions
- **Documentation**: Docstrings required for all public methods

Example:
```python
async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Aqara Advanced Lighting from a config entry."""
    # Implementation
```

#### TypeScript/Lit Frontend Code

The frontend is built with **Lit** (lightweight web components library) and TypeScript:

- **Framework**: Lit 3.x for web components
- **Language**: TypeScript with modern ES6+ features
- **Type Safety**: Full TypeScript type checking
- **Formatting**: Follow existing code style
- **Build Output**: Compiles to vanilla JavaScript (no runtime dependencies)
- **Home Assistant Integration**: Follow HA frontend patterns and custom element standards

#### Key Rules

- Keep functions focused and single-purpose
- Avoid over-engineering
- Write tests for new functionality
- Follow existing patterns in the codebase

### Development Commands

```bash
# Backend - Run linters
pre-commit run --all-files

# Backend - Run tests for integration
pytest ./tests/components/aqara_advanced_lighting \
  --cov=homeassistant.components.aqara_advanced_lighting \
  --cov-report term-missing

# Backend - Type checking
mypy homeassistant/components/aqara_advanced_lighting

# Backend - Update requirements
python -m script.gen_requirements_all

# Frontend - Build
cd custom_components/aqara_advanced_lighting/frontend_src
npm run build

# Frontend - Development watch mode
npm run watch
```

## Contributing Language Translations

We welcome translations of the integration into other languages. Translations help make the integration accessible to Home Assistant users worldwide.

### What Gets Translated

The integration has several components that support translation:

1. **Service Actions** - Service names, descriptions, and field labels (13 services)
2. **Configuration Flow** - Setup wizard text and options
3. **Exception Messages** - Error messages shown to users
4. **Frontend Panel** - UI labels, buttons, and tooltips in the Aqara Lighting panel

### Translation File Structure

All translations are stored in JSON files in the `custom_components/aqara_advanced_lighting/translations/` directory:

```
translations/
├── en.json          # English (reference translation)
├── de.json          # German
├── fr.json          # French
├── es.json          # Spanish
└── [language].json  # Your translation
```

Each language file uses the ISO 639-1 language code (e.g., `de` for German, `fr` for French, `es` for Spanish).

### How to Create a Translation

#### Step 1: Copy the English Template

Start by copying the English translation file as your template:

```bash
cd custom_components/aqara_advanced_lighting/translations/
cp en.json [your_language_code].json
```

For example, to create a German translation:
```bash
cp en.json de.json
```

#### Step 2: Translate the Content

Open your new translation file and translate all text values while keeping the JSON structure and keys unchanged.

**Translation File Structure:**

```json
{
  "config": {
    "step": {
      "user": {
        "title": "Configure Aqara Advanced Lighting",
        "description": "Enter your Zigbee2MQTT configuration.",
        "data": {
          "z2m_base_topic": "Zigbee2MQTT base topic"
        }
      }
    },
    "error": {
      "mqtt_not_loaded": "MQTT integration is not configured.",
      "unknown": "An unexpected error occurred."
    }
  },
  "services": {
    "set_dynamic_effect": {
      "name": "Set dynamic effect",
      "description": "Activate a dynamic RGB effect on Aqara lights.",
      "fields": {
        "device_id": {
          "name": "Device",
          "description": "Select the Aqara light device."
        }
      }
    }
  },
  "exceptions": {
    "device_not_found": {
      "message": "Device {device_name} not found in device registry."
    }
  },
  "panel": {
    "title": "Aqara Advanced Lighting",
    "sections": {
      "effects": "Dynamic Effects",
      "segments": "Segment Control"
    }
  }
}
```

**Important Rules:**

- **DO translate**: All text values (strings after the `:`)
- **DO NOT translate**: JSON keys, placeholders like `{device_name}`, or special values like `mdi:icon-name`
- **Preserve structure**: Keep the exact same JSON structure and nesting
- **Maintain placeholders**: Keep placeholders like `{device_name}` exactly as they appear

#### Step 3: Translation Best Practices

**Language Style:**
- Be concise and clear
- Use terminology consistent with Home Assistant in your language
- Avoid emojis or special characters
- Write for non-technical users when possible

**Capitalization Rules:**
- **Dialog/Section Titles**: Use Title Case (capitalize major words)
  - Examples: "Create Effect Preset", "Segment Pattern Presets", "Transition Settings"
- **Field Labels/Service Names**: Use sentence case (capitalize only the first word and proper nouns)
  - Examples: "Light entity", "Color temperature", "Set dynamic effect"
- **Descriptions**: Use sentence case
  - Examples: "Select the light device to control", "Brightness level for the effect"

**Context Awareness:**
- Service descriptions should explain what the service does
- Field descriptions should clarify what the user needs to provide
- Error messages should be helpful and actionable

**Good Examples:**

```json
// Dialog title - Title Case
"create_effect_title": "Create Effect Preset"

// Field label - Sentence case
"name": "Effect brightness"

// Description - Sentence case, clear and concise
"description": "Select the light device to control"

// Bad - Too verbose
"description": "This is the field where you need to select which light device you want to control"

// Bad - Wrong capitalization for field label (should be sentence case)
"name": "Effect Brightness"
```

### Complete Translation Sections

Your translation file should include all these sections:

1. **config** - Configuration flow text (setup wizard)
2. **options** - Options flow text (reconfiguration)
3. **services** - All 13 service action definitions
4. **exceptions** - Error messages with placeholders
5. **panel** - Frontend panel UI text (if applicable)

**Services to Translate:**
- `set_dynamic_effect` - Set dynamic effect
- `set_segment_pattern` - Set segment pattern
- `set_segment_gradient` - Set segment gradient
- `set_segment_blocks` - Set segment blocks
- `set_cct_sequence` - Set CCT sequence
- `set_segment_sequence` - Set segment sequence
- `stop_effect` - Stop effect
- `restore_pre_effect_state` - Restore pre-effect state
- `save_effect_preset` - Save effect preset
- `save_segment_pattern_preset` - Save segment pattern preset
- `save_cct_sequence_preset` - Save CCT sequence preset
- `save_segment_sequence_preset` - Save segment sequence preset
- `delete_preset` - Delete preset

### Testing Your Translation

#### Visual Testing in Home Assistant

1. **Copy the translation file:**
   ```bash
   # Copy your translation to your HA custom_components folder
   cp translations/[language].json \
     /config/custom_components/aqara_advanced_lighting/translations/
   ```

2. **Set your language in Home Assistant:**
   - Go to your user profile (click your username)
   - Select Language
   - Choose your translated language

3. **Test the translation appears:**
   - **Configuration Flow**: Try adding the integration (Settings > Devices & Services > Add Integration)
   - **Services**: Open Developer Tools > Actions and search for "Aqara" services
   - **Frontend Panel**: Open the Aqara Lighting panel if you have it installed
   - **Error Messages**: Trigger errors (try invalid device IDs) to see exception translations

4. **Verify completeness:**
   - All service names appear in your language
   - All field descriptions are translated
   - Error messages display in your language
   - No English text appears where it shouldn't

#### Common Issues

**Translation not appearing:**
- Verify the file is named correctly with the ISO 639-1 code
- Check JSON syntax is valid (use a JSON validator)
- Ensure Home Assistant language setting matches your file name
- Restart Home Assistant after adding the translation file

**Partial translation showing:**
- Missing translations fall back to English
- Compare your file structure to `en.json` to find missing keys
- Ensure all nested objects are complete

**JSON syntax errors:**
- Use a JSON validator (many online tools available)
- Common mistakes: missing commas, trailing commas, unescaped quotes
- Validate before submitting

### Submitting Your Translation

#### Prepare the Pull Request

1. **Ensure completeness:**
   - All sections translated
   - JSON syntax is valid
   - Tested in Home Assistant
   - No English text remains (except in placeholders/keys)

2. **Create a pull request with:**
   - Your translation file in `custom_components/aqara_advanced_lighting/translations/[language].json`
   - Clear PR title: "Add [Language Name] translation"
   - Description including:
     - Language name and code
     - Confirmation of testing
     - Native language proficiency level

**Example PR Description:**

```markdown
## Description
Add German (de) translation for Aqara Advanced Lighting integration

## Details
- Language: German (de)
- Translated sections: Config flow, services, exceptions, panel
- Testing: Tested in Home Assistant 2025.12 with German locale
- Native speaker: Yes

## Checklist
- [x] All sections translated
- [x] JSON syntax validated
- [x] Tested in Home Assistant
- [x] No English text in values
- [x] Follows translation best practices
```

#### Translation Updates

If you notice issues with an existing translation or want to improve it:

1. Open the existing translation file
2. Make your improvements
3. Test the changes
4. Submit a pull request with a clear description of what was improved

### Translation Maintenance

Translations may need updates when:
- New services are added
- Service parameters change
- New error messages are added
- UI text is modified

If you maintain a translation, watch for integration updates that might require translation updates.

## Submitting Custom Presets

We welcome community-created presets that showcase creative uses of the lights. High-quality presets may be included as built-in defaults.

### Preset Types

1. **Dynamic Effects** - RGB effects with custom colors and speeds
2. **Segment Patterns** - Individual segment color configurations
3. **CCT Sequences** - Color temperature and brightness sequences
4. **Segment Sequences** - Animated segment sequences with multiple steps

### Preset Submission Guidelines

#### Quality Requirements

- Preset must work reliably on the specified device type(s)
- Should demonstrate a unique or useful lighting pattern
- Must have a clear, descriptive name
- Should include all necessary parameters
- Tested on actual hardware

#### How to Submit Presets

1. Create your preset using the integration UI
2. Export the preset configuration using one of these methods:

**Method 1: Access Storage File (Recommended)**
   - Navigate to your Home Assistant config directory (usually `/config/` or `~/.homeassistant/`)
   - Open `.storage/aqara_advanced_lighting.presets` in a text editor
   - Find your preset by name in the appropriate section:
     - `effect_presets` - Dynamic RGB effects
     - `segment_pattern_presets` - Segment color patterns
     - `cct_sequence_presets` - CCT sequences
     - `segment_sequence_presets` - RGB segment sequences
   - Copy your preset data (including all fields like name, icon, colors, steps, etc.)
   - Note: The storage file is in JSON format with all your user-created presets

**Method 2: Use HTTP API**
   - Open Developer Tools > Actions
   - Create a REST API call (or use curl):
     ```bash
     curl -H "Authorization: Bearer YOUR_LONG_LIVED_ACCESS_TOKEN" \
       http://YOUR_HA_IP:8123/api/aqara_advanced_lighting/user_presets?type=effect
     ```
   - Replace `type=effect` with your preset type: `effect`, `segment_pattern`, `cct_sequence`, or `segment_sequence`
   - Find your preset in the JSON response and copy the preset data

**Method 3: Browser Developer Console**
   - Open the Aqara Lighting panel in your browser
   - Open browser Developer Tools (F12)
   - Go to the Network tab
   - Look for requests to `/api/aqara_advanced_lighting/user_presets`
   - View the response to see all your presets
   - Copy your preset data

3. Create a preset submission file in `preset_submissions/` directory:

**File naming**: `preset_type_name.json`

**Example**: `effect_ocean_waves.json`

```json
{
  "preset_type": "effect",
  "name": "Ocean Waves",
  "description": "Gentle blue-green waves reminiscent of ocean water",
  "author": "YourGitHubUsername",
  "device_types": ["t1m", "t1"],
  "tested_on": ["T1M"],
  "icon": "mdi:waves",
  "preset_data": {
    "device_type": "t1m",
    "effect": "flow1",
    "effect_speed": 25,
    "effect_brightness": 80,
    "effect_colors": [
      {"x": 0.1610, "y": 0.3549},
      {"x": 0.1566, "y": 0.2854},
      {"x": 0.1532, "y": 0.2458}
    ]
  }
}
```

4. Submit a pull request with:
   - Your preset file(s) in `preset_submissions/`
   - A brief description of the preset
   - Device type(s) tested on

#### Preset File Format

```json
{
  "preset_type": "effect|segment_pattern|cct_sequence|segment_sequence",
  "name": "Preset Name",
  "description": "Detailed description of what the preset does",
  "author": "GitHub username",
  "device_types": ["t2_bulb", "t1", "t1m", "t1_strip"],
  "tested_on": ["T1M", "T2 Bulb"],
  "icon": "mdi:icon-name",
  "preset_data": {
    // Actual preset configuration data
  }
}
```

#### Preset Naming Guidelines

- Use clear, descriptive names
- Avoid generic names like "Cool Effect" or "Pattern 1"
- Reference what the preset does or looks like
- Good examples: "Sunset Fade", "Rainbow Chase", "Candlelight Flicker"
- Bad examples: "My Effect", "Test 1", "Cool Pattern"

#### What Makes a Good Preset

- **Unique**: Offers something different from existing presets
- **Purposeful**: Serves a specific use case or aesthetic
- **Polished**: Well-tested with good parameter choices
- **Documented**: Clear description helps users understand when to use it
- **Universal**: Works well across different room sizes/setups when possible

## Pull Request Process

### Before Submitting

1. Ensure all tests pass
2. Run linters and fix any issues
3. Update documentation if needed
4. Add tests for new functionality
5. Follow commit message guidelines

### Commit Messages

Use clear, descriptive commit messages:

```
Add ocean waves dynamic effect preset

- Creates gentle blue-green wave effect
- Tested on T1M with 26 segments
- Optimized speed for smooth transitions
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Preset submission

## Testing
Describe testing performed:
- Hardware tested on
- Test cases covered
- Screenshots/videos (if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No new warnings
```

### Review Process

1. Maintainer reviews code/preset
2. Automated tests run
3. Feedback provided if changes needed
4. Approval and merge when ready

## Testing

### Backend Tests

```bash
# Run all integration tests
pytest ./tests/components/aqara_advanced_lighting

# Run with coverage
pytest ./tests/components/aqara_advanced_lighting \
  --cov=homeassistant.components.aqara_advanced_lighting \
  --cov-report term-missing \
  --cov-report html

# Run specific test file
pytest tests/components/aqara_advanced_lighting/test_config_flow.py
```

### Manual Testing

1. Install integration in test Home Assistant instance
2. Test on actual Aqara hardware
3. Verify all features work as expected
4. Check for errors in Home Assistant logs
5. Test edge cases and error conditions

### Testing Checklist

- [ ] Feature works as intended
- [ ] No errors in Home Assistant logs
- [ ] UI elements display correctly
- [ ] Works on all supported device types (if applicable)
- [ ] Error handling works properly
- [ ] Performance is acceptable

## Code Style

### Python

Follow PEP 8 and Home Assistant guidelines:

```python
"""Module docstring."""
from __future__ import annotations

import asyncio
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry
) -> bool:
    """Set up from config entry."""
    # Implementation
    return True
```

### TypeScript/Lit

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('my-element')
export class MyElement extends LitElement {
  @property({ type: String }) public name = '';
  @state() private _count = 0;

  static styles = css`
    :host {
      display: block;
    }
  `;

  protected render() {
    return html`
      <div>Hello, ${this.name}!</div>
    `;
  }
}
```

## Questions or Issues?

- Check existing [issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- Review the codebase and README for architecture and feature details
- Open a new issue for bugs or feature requests
- Join discussions for questions and ideas

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- README credits section

Thank you for contributing to Aqara Advanced Lighting!
