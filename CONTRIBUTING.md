# Contributing to Aqara Advanced Lighting

Thank you for your interest in contributing to the Aqara Advanced Lighting integration for Home Assistant. This document provides guidelines for contributing code, submitting presets, and reporting issues.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Contributions](#code-contributions)
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
2. Export the preset configuration:
   - Navigate to Developer Tools > States
   - Find `aqara_advanced_lighting.user_presets`
   - Copy your preset configuration from the state attributes

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
   - Screenshots or video (if possible)
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
