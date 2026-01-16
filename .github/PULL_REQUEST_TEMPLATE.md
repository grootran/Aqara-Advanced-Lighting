# Pull Request

## Description

<!-- Provide a clear and concise description of what this PR does -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement
- [ ] Other (please describe):

## Related Issues

<!-- Link to related issues using #issue_number -->
<!-- Example: Fixes #123, Closes #456, Related to #789 -->

Fixes #

## Changes Made

<!-- List the specific changes made in this PR -->

- Change 1
- Change 2
- Change 3

## Testing

### Test Environment

- [ ] Tested locally in Home Assistant
- [ ] Tested with actual Aqara devices
- [ ] Tested with device models (list below):
  - [ ] T1M (20 segment)
  - [ ] T1M (26 segment)
  - [ ] T1 Strip
  - [ ] T2 RGB/CCT bulb

### Testing Steps

<!-- Describe how to test these changes -->

1. Step 1
2. Step 2
3. Step 3

### Test Results

<!-- Describe what you observed during testing -->

- Expected behavior:
- Actual behavior:
- Any issues encountered:

## Code Quality Checklist

<!-- Ensure your code meets the project standards -->

- [ ] Code follows the project's style guidelines
- [ ] Code follows Home Assistant integration patterns
- [ ] Type hints are used throughout
- [ ] Docstrings are present on all functions and classes
- [ ] No hardcoded values (all constants in `const.py`)
- [ ] Error handling is implemented appropriately
- [ ] Logging is used with appropriate levels (debug, info, warning, error)
- [ ] No `print()` statements (use `_LOGGER` instead)

### Linting and Validation

- [ ] Code passes ruff checks (`ruff check custom_components/aqara_advanced_lighting/`)
- [ ] Code passes pylint checks (`pylint custom_components/aqara_advanced_lighting/`)
- [ ] Code passes mypy type checking (`mypy custom_components/aqara_advanced_lighting/`)
- [ ] Home Assistant validation passes (`python -m script.hassfest`)

### Tests

- [ ] New tests added for new functionality
- [ ] All existing tests pass
- [ ] Test coverage is maintained or improved (>95%)
- [ ] Integration setup/unload tests updated if applicable

## Frontend Changes

<!-- Only fill out if your changes affect the frontend -->

- [ ] This PR includes frontend changes
- [ ] Frontend rebuilt after changes (`npm run build`)
- [ ] Version in `frontend_src/package.json` updated if needed
- [ ] Translations added to both `translations/en.json` AND `frontend_src/src/panel-translations.ts`
- [ ] No hardcoded strings in UI components
- [ ] Tested in both light and dark themes
- [ ] Browser console shows no errors
- [ ] Tested on multiple screen sizes

## Documentation

- [ ] README.md updated if needed
- [ ] CHANGELOG.md updated with changes
- [ ] `services.yaml` updated if services changed
- [ ] `translations/en.json` updated if user-facing text changed
- [ ] Code comments added for complex logic
- [ ] `.claude/*.md` documentation updated if architecture/patterns changed

## Breaking Changes

<!-- If this PR includes breaking changes, describe them here -->

- [ ] This PR includes breaking changes

**Breaking Changes Details:**

<!-- Describe what breaks and how users should migrate -->

**Migration Guide:**

<!-- Provide step-by-step migration instructions for users -->

1. Step 1
2. Step 2

## Screenshots/Videos

<!-- Add screenshots or videos demonstrating the changes, especially for UI changes -->
<!-- Drag and drop images directly into this text box -->

### Before

<!-- Screenshot/video of behavior before changes -->

### After

<!-- Screenshot/video of behavior after changes -->

## Additional Context

<!-- Add any other context about the PR here -->

## Checklist for Reviewers

<!-- For maintainers reviewing this PR -->

- [ ] Code reviewed for security issues
- [ ] Async patterns followed correctly
- [ ] Integration-level vs config-entry-level resources handled properly
- [ ] MQTT communication follows project patterns
- [ ] Device compatibility validated
- [ ] Performance impact considered
- [ ] No unnecessary dependencies added
- [ ] Documentation is accurate and complete

## License

By submitting this pull request, I confirm that my contribution is made under the terms of the MIT License.

---

**Note for Contributors:**

Thank you for contributing to Aqara Advanced Lighting! Please ensure you have:

1. Read the [Contributing Guidelines](CONTRIBUTING.md) (if available)
2. Tested your changes thoroughly with actual hardware if possible
3. Updated all relevant documentation
4. Followed Home Assistant and project coding standards
5. Ensured all tests pass and code quality checks succeed

If you have questions or need help, feel free to ask in the PR comments or open a discussion issue.
