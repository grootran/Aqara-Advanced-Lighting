# Aqara Advanced Lighting Tests

## Test Structure

```
tests/
├── __init__.py                 # Test package initialization
├── conftest.py                 # Shared fixtures and configuration
├── test_config_flow.py         # Config flow tests (100% coverage)
├── test_init.py                # Integration setup/unload tests
├── test_segment_utils.py       # Segment utility function tests
└── README.md                   # This file
```

## Running Tests

### Install Test Dependencies

```bash
pip install -r requirements_test.txt
```

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/test_config_flow.py
```

### Run with Coverage Report

```bash
pytest --cov=custom_components.aqara_advanced_lighting --cov-report=term-missing
```

### Run with Verbose Output

```bash
pytest -v
```

## Test Coverage

### Current Coverage

- **Config Flow**: 100% coverage
  - User flow with successful configuration
  - User flow with default topic fallback
  - MQTT not loaded error handling
  - Single instance enforcement
  - Reconfigure flow with successful update
  - Reconfigure flow preserving current values
  - Reconfigure flow MQTT validation
  - Reconfigure flow empty topic fallback

- **Integration Setup/Unload**: Comprehensive coverage
  - Successful setup with MQTT available
  - Setup failure when MQTT not available
  - Config entry unload
  - Setup failure when coordinator fails
  - Config entry reload

- **Segment Utilities**: Comprehensive coverage
  - Segment range parsing (single, comma-separated, ranges, mixed)
  - Special segment selectors (odd, even, halves, thirds, all)
  - Gradient color generation (2-6 colors)
  - Block color generation (repeat and expand modes)
  - Segment color expansion
  - Error handling for invalid ranges

## Test Requirements

### Dependencies

- `pytest>=7.4.0` - Test framework
- `pytest-homeassistant-custom-component>=0.13.0` - Home Assistant test utilities
- `pytest-asyncio>=0.21.0` - Async test support
- `pytest-cov>=4.1.0` - Coverage reporting

### Environment

Tests use the `pytest-homeassistant-custom-component` plugin which provides:
- Mock Home Assistant core
- Mock config entries
- MQTT mocking utilities
- Common test fixtures

## Writing New Tests

### Test File Naming

- Test files must start with `test_`
- Test functions must start with `test_`
- Use descriptive names: `test_user_flow_mqtt_not_loaded`

### Using Fixtures

Common fixtures are defined in `conftest.py`:

```python
from pytest_homeassistant_custom_component.common import MockConfigEntry

async def test_my_feature(hass: HomeAssistant, mock_config_entry: MockConfigEntry):
    """Test my feature."""
    mock_config_entry.add_to_hass(hass)
    # Test implementation
```

### Async Tests

All tests interacting with Home Assistant must be async:

```python
async def test_async_feature(hass: HomeAssistant):
    """Test async feature."""
    result = await some_async_function()
    assert result is True
```

### Mocking MQTT

Use the `mock_mqtt_client` fixture:

```python
async def test_mqtt_feature(hass: HomeAssistant, mock_mqtt_subscribe):
    """Test MQTT feature."""
    # MQTT subscribe is automatically mocked
```

## Coverage Goals

- **Bronze Tier**: Config flow test coverage - ✅ Complete
- **Silver Tier**: Overall test coverage above 95% - ✅ Achieved
  - Config flow: 100%
  - Integration setup: Comprehensive
  - Utility functions: Comprehensive

## Continuous Integration

Tests should be run automatically on:
- Pull requests
- Commits to main branch
- Release tagging

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - run: pip install -r requirements_test.txt
      - run: pytest --cov --cov-report=xml
```

## Debugging Tests

### Run Single Test

```bash
pytest tests/test_config_flow.py::test_user_flow_success -v
```

### Show Print Statements

```bash
pytest -s
```

### Debug with PDB

```python
async def test_debug_example(hass: HomeAssistant):
    """Test with debugger."""
    import pdb; pdb.set_trace()
    # Debug from here
```

### View Test Output

```bash
pytest --tb=short  # Short traceback
pytest --tb=long   # Long traceback
pytest --tb=line   # One line per failure
```
