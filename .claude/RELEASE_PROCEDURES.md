# Release Procedures

Integration Version: 0.7.0
Document Version: 1.6.0
Last Updated: 2026-01-19

This comprehensive guide covers all aspects of preparing, testing, and publishing releases for the Aqara Advanced Lighting integration.

**IMPORTANT:** All commit messages and tags MUST be manually verified before any git push operation. See verification steps throughout this document.

**IMPORTANT:** Git tags should NOT be created during automated release preparation. Tags are created manually by the repository owner only.

## Table of Contents

1. [Pre-Release Checklist](#pre-release-checklist)
2. [Files to Update](#files-to-update)
3. [Testing Procedure](#testing-procedure)
4. [Release Procedure](#release-procedure)
5. [Post-Release Tasks](#post-release-tasks)
6. [Version Numbering Guidelines](#version-numbering-guidelines)
7. [Emergency Rollback Procedure](#emergency-rollback-procedure)
8. [Quick Reference](#quick-reference)
9. [Common Issues and Solutions](#common-issues-and-solutions)

---

## Pre-Release Checklist

Before starting the release process, ensure all of these requirements are met:

### Code Quality
- [ ] All Python files follow Home Assistant coding standards
- [ ] Services registered in `__init__.py`
- [ ] Service handlers implement proper error handling
- [ ] No hardcoded values - all constants in `const.py`
- [ ] Type hints used throughout
- [ ] Docstrings on all functions and classes
- [ ] All planned features are implemented and tested
- [ ] All known bugs are fixed or documented
- [ ] Code follows Home Assistant style guidelines
- [ ] Breaking changes are documented
- [ ] Migration path exists for breaking changes

### Linting and Testing
- [ ] All linters pass (ruff, pylint, mypy)
- [ ] All tests pass with >95% coverage
- [ ] Hassfest validation passes
- [ ] GitHub Actions pass

### Integration Files
- [ ] `manifest.json` - all required fields present
- [ ] `services.yaml` - all services defined with proper selectors
- [ ] `strings.json` - config flow strings present
- [ ] `const.py` - all constants defined
- [ ] `__init__.py` - async_setup, async_setup_entry, async_unload_entry present
- [ ] `config_flow.py` - config flow and reconfigure flow implemented
- [ ] `quality_scale.yaml` - quality scale rules defined

### Documentation
- [ ] Documentation is complete and accurate
- [ ] `README.md` - comprehensive documentation with examples
- [ ] `CHANGELOG.md` - release notes prepared
- [ ] `info.md` - HACS display information updated
- [ ] `.claude/*.md` - All 10 documentation files updated with new version and features
- [ ] `LICENSE` - MIT license file present

### HACS Compatibility
- [ ] Repository structure follows HACS requirements
- [ ] `hacs.json` present with required fields
- [ ] `manifest.json` has all required fields
- [ ] README.md has installation instructions
- [ ] Integration in `custom_components/` directory
- [ ] No `requirements.txt` in integration folder (requirements in manifest.json)

---

## Files to Update

### 1. Version Numbers

Update the version number in these files (use semantic versioning: MAJOR.MINOR.PATCH):

#### manifest.json
**Location:** `custom_components/aqara_advanced_lighting/manifest.json`

```json
{
  "version": "X.Y.Z"
}
```

#### Frontend package.json
**Location:** `custom_components/aqara_advanced_lighting/frontend_src/package.json`

```json
{
  "version": "X.Y.Z"
}
```

**Note:** Keep frontend and manifest versions in sync.

#### Rebuild Frontend (CRITICAL - DO NOT SKIP)

**WARNING:** Failing to rebuild the frontend will cause a persistent version mismatch warning in the panel. The backend version will be higher than the frontend version, and the warning banner will display until users clear their browser cache.

After updating `frontend_src/package.json`, **you MUST rebuild the frontend** to embed the new version number:

```bash
cd custom_components/aqara_advanced_lighting/frontend_src/
npm run build
```

**Critical Requirements:**
- The frontend build embeds the version from `package.json` into the compiled JavaScript
- Skipping this step causes persistent "version mismatch" warnings in the panel
- Users will see the warning even after updating until they clear browser cache
- The built file is `../frontend/aqara_panel.js` (approximately 240-250KB)
- Verify the build completed successfully before committing
- **ALWAYS commit the rebuilt frontend file with version changes**

**Verification (REQUIRED):**
```bash
# Check that the file was updated recently
ls -lh ../frontend/aqara_panel.js

# Verify new version appears in the built file
grep -o '"X\.Y\.Z"' ../frontend/aqara_panel.js

# Should output the NEW version number, not the old one
# If old version appears, rebuild was not successful
```

**Common Mistake:**
- Updating manifest.json and package.json versions
- Forgetting to run `npm run build`
- Committing without the rebuilt frontend
- Result: Version mismatch warning appears for all users

---

### 2. Documentation Files

#### CHANGELOG.md
**Location:** `CHANGELOG.md`

Add new version section at the top following Keep a Changelog format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### What's New
- Overview of major changes

### New Features
- Feature 1
- Feature 2

### Bug Fixes
- Fix 1
- Fix 2

### Breaking Changes
- Breaking change 1 (if any)

### Technical Changes
- Technical detail 1
- Technical detail 2

### Requirements
- List updated requirements if changed

### Upgrade Instructions
1. Step 1
2. Step 2
```

Don't forget to add the version link at the bottom:
```markdown
[X.Y.Z]: https://github.com/absent42/Aqara-Advanced-Lighting/releases/tag/vX.Y.Z
```

#### README.md
**Location:** `README.md`

Update if any of these changed:
- [ ] Features list
- [ ] Supported devices
- [ ] Requirements (HA version, Z2M version, etc.)
- [ ] Installation instructions
- [ ] Service descriptions
- [ ] Available effects/presets
- [ ] Example automations
- [ ] Screenshots (if UI changed)

#### info.md
**Location:** `info.md`

Update the condensed version shown in HACS:
- [ ] Features summary
- [ ] Supported devices table
- [ ] Requirements
- [ ] Quick start steps
- [ ] Services list

#### .claude/ Documentation Files (Critical)

**Location:** `.claude/*.md`

These files provide architecture and development reference for AI assistants. Update ALL files with the new version and features.

**Automated Version Update:**
```bash
# Update version number in all .claude/ documentation files
cd .claude/
sed -i 's/Version: X\.Y\.Z/Version: NEW.VERSION.NUMBER/g' *.md
```

**Manual Feature Updates (Required):**

Update each file based on changes in the release:

- [ ] **ARCHITECTURE.md**
  - Add "New in vX.Y.Z" section with bullet list of major features
  - Update dependencies if changed
  - Update core files if new files added
  - Update Architecture Summary if capabilities changed

- [ ] **SERVICES_API.md**
  - Document any new services or parameters
  - Add new API endpoints (if added)
  - Update constraints/limits if changed
  - Document new device configuration features

- [ ] **DEVICES_MQTT.md**
  - Add new device models if supported
  - Update MQTT payload formats if changed
  - Document new device capabilities

- [ ] **STATE_SEQUENCES.md**
  - Document new preset categories
  - Update sequence manager features
  - Add new utility functions if added

- [ ] **TRANSLATIONS.md**
  - Document translation system changes
  - Update file structure if changed
  - Add new translation workflow steps

- [ ] **COLOR_SYSTEM.md**
  - Document color conversion improvements
  - Update algorithms if changed
  - Add new color formats if supported

- [ ] **FRONTEND_DEVELOPMENT.md**
  - Document new custom components (e.g., transition-curve-editor.ts)
  - Update component list
  - Add new UI patterns or standards

- [ ] **TESTING_TROUBLESHOOTING.md**
  - Add new testing requirements
  - Document new common issues
  - Update quality scale status

- [ ] **DEVELOPMENT_PATTERNS.md**
  - Add version to Version History section
  - Update constraints if changed
  - Document new development patterns

- [ ] **RELEASE_PROCEDURES.md**
  - Update Integration Version at top of file
  - Update Document Version if procedures changed
  - Update Last Updated date

**Verification:**
```bash
# Verify all files have the new version
cd .claude/
grep "Version: X.Y.Z" *.md | wc -l  # Should return 10

# Check for old version references
grep "Version: OLD.VERSION" *.md    # Should return nothing
```

**Example Update for v0.6.0:**
- Updated version numbers from 0.5.0 → 0.6.0
- Added Device Configuration Panel documentation to SERVICES_API.md
- Added transition-curve-editor.ts to FRONTEND_DEVELOPMENT.md
- Added XY to RGB conversion improvements to COLOR_SYSTEM.md
- Updated ARCHITECTURE.md with "New in v0.6.0" section
- Updated DEVELOPMENT_PATTERNS.md Version History

**Important:** These documentation files are used by Claude Code and GitHub Copilot as reference context. Keeping them current ensures AI assistants have accurate information about the integration's capabilities and architecture.

---

### 3. Release Notes (Optional)

Create a detailed release notes file for major releases:

**Location:** `RELEASE_NOTES_vX.Y.Z.md`

**Note:** This file should be added to .gitignore and NOT committed to the repository.

Include:
- Detailed feature descriptions
- Code examples
- Migration guide (if breaking changes)
- Known issues
- Screenshots/GIFs

This content will be copied into the GitHub release notes.

---

### 4. Quality Scale (If Changed)

**Location:** `custom_components/aqara_advanced_lighting/quality_scale.yaml`

Update if you've implemented new quality scale rules:
- [ ] Change status from `todo` to `done`
- [ ] Update comments to reflect implementation
- [ ] Remove exemptions if features are now implemented

---

### 5. HACS Configuration (Rarely Changed)

**Location:** `hacs.json`

Update only if:
- [ ] Minimum Home Assistant version changed
- [ ] HACS display settings changed
- [ ] Zip release configuration changed

```json
{
  "name": "Aqara Advanced Lighting",
  "homeassistant": "YYYY.MM.0",
  "render_readme": true,
  "zip_release": true,
  "filename": "aqara_advanced_lighting.zip"
}
```

**Zip Release Configuration:**
- **zip_release**: Set to `true` to enable HACS to download from release zip files
- **filename**: Static filename (no version numbers) - must match GitHub release asset
- Zip releases provide faster downloads and reduce GitHub API usage
- GitHub Actions workflow automatically creates the zip file for each tagged release

---

### 6. Code Quality Files

Run these checks and fix any issues:

#### Linting
```bash
# Run ruff
ruff check custom_components/aqara_advanced_lighting/

# Run pylint
pylint custom_components/aqara_advanced_lighting/

# Run mypy
mypy custom_components/aqara_advanced_lighting/
```

#### Testing
```bash
# Run tests with coverage
pytest tests/ --cov=custom_components/aqara_advanced_lighting --cov-report term-missing

# Ensure >95% coverage
```

#### Home Assistant Validation
```bash
# Run hassfest (if running in HA dev container)
python -m script.hassfest

# Or wait for GitHub Actions to run
```

---

## Testing Procedure

### 1. Create Testing Branch

```bash
# Create and switch to new branch
git checkout -b release/vX.Y.Z

# Or for development testing
git checkout -b dev/feature-name
```

### 2. Make Changes

Update all files listed in [Files to Update](#files-to-update).

### 3. Commit Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Prepare vX.Y.Z release

- Updated version numbers
- Updated CHANGELOG.md
- Updated documentation
- Fixed issue #XXX
- Added feature XXX
"
```

### 4. Verify Commit Message (REQUIRED)

**CRITICAL:** Always verify commit messages before any git push operation.

```bash
# View the last commit message
git log -1

# Review the commit message carefully
# Ensure it:
# - Follows the project style (no emojis/icons)
# - Accurately describes all changes
# - References relevant issues
# - Is clear and professional
```

If the commit message needs changes:

```bash
# Amend the commit message
git commit --amend

# Edit the message in your editor
# Save and close

# Verify the updated message
git log -1
```

### 5. Push to GitHub (After Verification Only)

**IMPORTANT:** Only push after manually verifying the commit message in step 4.

```bash
# Push to remote branch
git push origin release/vX.Y.Z
```

### 6. Install for Testing

**Option A: HACS Testing (Recommended)**

1. In HACS, go to Integrations
2. Find "Aqara Advanced Lighting"
3. Click three dots → "Redownload"
4. Select the testing branch: `release/vX.Y.Z`
5. Restart Home Assistant
6. Test all features thoroughly

**Option B: Manual Testing**

```bash
# In your HA instance
cd /config/custom_components/
rm -rf aqara_advanced_lighting/
git clone -b release/vX.Y.Z https://github.com/absent42/Aqara-Advanced-Lighting.git
mv Aqara-Advanced-Lighting/custom_components/aqara_advanced_lighting/ .
rm -rf Aqara-Advanced-Lighting/
```

Restart Home Assistant and test.

### 7. Functionality Test Checklist

Test all major functionality:
- [ ] Configuration flow works
- [ ] Reconfiguration flow works
- [ ] Device discovery works
- [ ] All services execute without errors
- [ ] Dynamic effects work on all device types
- [ ] Segment patterns work (T1/T1M/T1 Strip)
- [ ] Gradients work correctly
- [ ] Color blocks work correctly
- [ ] CCT sequences work (all presets and custom)
- [ ] RGB segment sequences work (all presets and custom)
- [ ] Pause/resume functions work
- [ ] Light groups work
- [ ] State restoration works
- [ ] Panel UI loads and functions correctly
- [ ] Preset management works (create, edit, delete, duplicate)
- [ ] Visual editors work
- [ ] Favorites work
- [ ] Light control tiles work
- [ ] No errors in logs
- [ ] No warnings in logs (except expected Z2M messages)

### 8. Frontend Testing (If Changed)

```bash
# Rebuild frontend
cd custom_components/aqara_advanced_lighting/frontend_src/
npm run build

# Verify output
ls -l ../frontend/aqara_panel.js

# Test in browser
# Check browser console for errors
```

### 9. Fix Issues

If issues are found:

```bash
# Make fixes
# Stage changes
git add .

# Commit fixes
git commit -m "Fix issue in vX.Y.Z: description"
```

**REQUIRED:** Verify commit message before pushing:

```bash
# View the commit message
git log -1

# Review the message - ensure it's clear and accurate
# Amend if needed:
# git commit --amend

# Verify again after amend
git log -1
```

**Only after verification, push:**

```bash
# Push updates
git push origin release/vX.Y.Z

# Re-test (repeat step 6-7)
```

---

## Release Procedure

### 1. Final Verification

Before releasing, verify:
- [ ] All tests pass on testing branch
- [ ] GitHub Actions pass (HACS validation, hassfest, validate)
- [ ] No open critical bugs
- [ ] Documentation is accurate
- [ ] CHANGELOG is complete

### 2. Merge to Main

```bash
# Switch to main branch
git checkout main

# Ensure main is up to date
git pull origin main

# Merge release branch
git merge release/vX.Y.Z
```

**REQUIRED:** Verify merge commit message before pushing:

```bash
# View the merge commit message
git log -1

# Review the merge commit
# Ensure it accurately reflects the merge
# Amend if needed:
# git commit --amend

# Verify again after amend
git log -1
```

**Only after verification, push:**

```bash
# Push to main
git push origin main
```

**Alternative: Use Pull Request**

1. Go to GitHub repository
2. Create Pull Request from `release/vX.Y.Z` to `main`
3. Review changes
4. Merge pull request
5. Delete branch (via GitHub UI)

### 3. Do NOT Create Git Tags During Release Prep

**IMPORTANT:** Git tags should NOT be created during automated release preparation. Tags will be created manually by the repository owner when ready.

When preparing a release, skip tag creation entirely. The release is ready when:
- Code is merged to main
- Version numbers are updated
- CHANGELOG is complete
- All tests pass

---

## Manual Tag Creation (Repository Owner Only)

This section is for the repository owner only, to be performed separately from automated release preparation.

### Creating Tags Manually

When ready to officially tag a release:

```bash
# Ensure you're on main branch with latest code
git checkout main
git pull origin main

# Create annotated tag
git tag -a vX.Y.Z -m "Release vX.Y.Z

Summary of major changes in this release.
"

# Verify tag message
git tag -n10 vX.Y.Z

# Review the tag message carefully
# If changes needed:
# git tag -d vX.Y.Z
# git tag -a vX.Y.Z -m "Corrected message"
# git tag -n10 vX.Y.Z

# Push tag to remote (only after verification)
git push origin vX.Y.Z
```

**What Happens After Pushing the Tag:**

When you push a tag (`v*`), the automated GitHub Actions workflow (`.github/workflows/release.yml`) automatically:
1. Creates a zip file of `custom_components/aqara_advanced_lighting/`
2. Extracts release notes from CHANGELOG.md for the tagged version
3. Creates a GitHub release with the zip file attached
4. Detects if it's a prerelease based on tag naming (see below)

The workflow handles all release creation automatically - you don't need to manually create the GitHub release unless you want to edit it.

### Prerelease Tag Naming

The workflow automatically detects prereleases based on tag names:

**Prerelease Tags** (marked as pre-release in GitHub):
- `v0.7.0-alpha` or `v0.7.0-alpha.1` - Alpha testing
- `v0.7.0-beta` or `v0.7.0-beta.1` - Beta testing
- `v0.7.0-rc` or `v0.7.0-rc.1` - Release candidate
- `v0.7.0-preview` - Preview release
- `v0.7.0-pre` - General prerelease
- `v0.7.0-dev` - Development build

**Stable Release Tags** (marked as latest release):
- `v0.7.0` - Normal stable release
- `v0.8.0` - Normal stable release

**Prerelease Workflow Example:**
```bash
# Test release
git tag -a v0.7.0-rc.1 -m "Release candidate 1 for v0.7.0"
git push origin v0.7.0-rc.1
# Workflow creates prerelease with zip

# Test and iterate
git tag -a v0.7.0-rc.2 -m "Release candidate 2 for v0.7.0"
git push origin v0.7.0-rc.2

# When ready for stable release
git tag -a v0.7.0 -m "Release v0.7.0"
git push origin v0.7.0
# Workflow creates full release with zip
```

### Creating GitHub Release

The GitHub Actions workflow automatically creates releases. However, you may want to edit the release afterward to:

1. Go to: https://github.com/absent42/Aqara-Advanced-Lighting/releases
2. Click "Draft a new release"
3. Choose the tag that was just created: `vX.Y.Z`
4. Release title: `vX.Y.Z - Release Name`
5. Copy content from CHANGELOG.md for this version
6. Add additional details from RELEASE_NOTES_vX.Y.Z.md (if exists)
7. Format with proper markdown:
   - Use headers for sections
   - Use code blocks for examples
   - Add screenshots if applicable
8. Check "Set as the latest release" (unless it's a pre-release)
9. Click "Publish release"

**Release Notes Template:**

```markdown
# Aqara Advanced Lighting vX.Y.Z

## What's New

Brief overview of the release.

## New Features

### Feature 1
Description and usage example.

### Feature 2
Description and usage example.

## Improvements

- Improvement 1
- Improvement 2

## Bug Fixes

- Fix 1
- Fix 2

## Breaking Changes

**Important:** This release includes breaking changes.

- Breaking change 1
- Migration path for breaking change 1

## Requirements

- Home Assistant 2025.12.0 or newer
- MQTT integration configured
- Zigbee2MQTT 2.7.2 or newer

## Installation

### New Installation
Install via HACS or manually.

### Upgrade from vX.Y.Z
1. Update through HACS
2. Restart Home Assistant
3. Additional steps if needed

## Full Changelog
[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#xyz---yyyy-mm-dd)

## Support
- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
```

### 5. Verify Release

After publishing:
- [ ] Release appears on GitHub releases page
- [ ] Tag is visible in repository
- [ ] HACS can see the new version
- [ ] Assets are attached (if applicable)
- [ ] Release notes are formatted correctly

---

## Post-Release Tasks

### 1. Sync Dev Branch with Main

After releasing to main, sync the dev branch to keep branches aligned:

```bash
# Switch to dev branch
git checkout dev

# Pull latest from remote
git pull origin dev

# Merge main back into dev
git merge main
```

**REQUIRED:** Verify merge commit message before pushing:

```bash
# View the merge commit message
git log -1

# Review the merge commit
# Should be something like "Merge branch 'main' into dev"
# Amend if needed:
# git commit --amend
# git log -1
```

**Only after verification, push:**

```bash
# Push to dev
git push origin dev
```

**Why this is important:**
- Keeps both branches in sync with identical commit history
- Ensures any commits made on main (merge commits, hotfixes) are in dev
- Prevents branch divergence
- Makes future merges cleaner

### 2. Update HACS

HACS should automatically detect the new release within 24 hours. To verify:

1. Open HACS in a test Home Assistant instance
2. Check for updates
3. Verify new version appears
4. Test update process

### 3. Clean Up Branches

```bash
# Delete local release branch
git branch -d release/vX.Y.Z

# Delete remote release branch (if not done via PR)
git push origin --delete release/vX.Y.Z

# Clean up other merged branches
git branch -d dev/old-feature
git push origin --delete dev/old-feature
```

**Alternative: Delete via GitHub UI**

1. Go to Branches page
2. Find merged branch
3. Click delete icon

### 4. Clean Up Local Development Files

```bash
# Remove release notes file (should be in .gitignore)
rm RELEASE_NOTES_vX.Y.Z.md

# Remove any test files
rm -f test_*.py

# Clean Python cache
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

# Clean frontend build artifacts (if testing)
cd custom_components/aqara_advanced_lighting/frontend_src/
rm -rf node_modules/ dist/
```

### 5. Monitor for Issues

After release, monitor for:

- [ ] GitHub issues from users
- [ ] HACS installation problems
- [ ] Home Assistant logs for errors
- [ ] Discord/forum mentions (if applicable)

### 6. Prepare Hotfix if Needed

If critical issues are found:

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/vX.Y.Z+1

# Make fixes
# Test thoroughly
# Update CHANGELOG.md

# Commit changes
git add .
git commit -m "Hotfix vX.Y.Z+1: description of fix"
```

**REQUIRED:** Verify commit message before merging:

```bash
# View the commit message
git log -1

# Review and amend if needed:
# git commit --amend
# git log -1
```

**After verification, merge:**

```bash
# Merge back to main
git checkout main
git merge hotfix/vX.Y.Z+1
```

**REQUIRED:** Verify merge commit before pushing:

```bash
# View merge commit
git log -1

# Review and amend if needed:
# git commit --amend
# git log -1
```

**After verification, tag:**

```bash
# Tag new version
git tag -a vX.Y.Z+1 -m "Hotfix vX.Y.Z+1"
```

**REQUIRED:** Verify tag before pushing:

```bash
# View tag message
git tag -n10 vX.Y.Z+1

# If changes needed:
# git tag -d vX.Y.Z+1
# git tag -a vX.Y.Z+1 -m "Corrected message"
```

**Only after all verifications, push:**

```bash
git push origin main
git push origin vX.Y.Z+1

# Create GitHub release
# Clean up hotfix branch
```

### 7. Update Project Board (If Using)

If using GitHub Projects:
- [ ] Move completed issues to "Done"
- [ ] Close milestone for this release
- [ ] Create milestone for next release
- [ ] Update roadmap

### 8. Announce Release (Optional)

Consider announcing on:
- Home Assistant Community forums
- Home Assistant Discord
- Reddit r/homeassistant
- Personal blog/social media

**Announcement Template:**

```markdown
# Aqara Advanced Lighting vX.Y.Z Released

I'm happy to announce the release of Aqara Advanced Lighting vX.Y.Z!

## Highlights
- Major feature 1
- Major feature 2

## Get It
Install via HACS: https://github.com/absent42/Aqara-Advanced-Lighting

## Full Release Notes
https://github.com/absent42/Aqara-Advanced-Lighting/releases/tag/vX.Y.Z

Feedback welcome!
```

---

## Version Numbering Guidelines

Follow Semantic Versioning (semver.org):

- **MAJOR (X.0.0)**: Breaking changes, incompatible API changes
  - Removing features
  - Changing service schemas incompatibly
  - Major architecture changes

- **MINOR (0.X.0)**: New features, backward compatible
  - Adding new services
  - Adding new presets
  - Adding new UI features
  - Performance improvements

- **PATCH (0.0.X)**: Bug fixes, backward compatible
  - Fixing bugs
  - Fixing typos in documentation
  - Small improvements without new features

**Examples:**
- `1.0.0` → `1.1.0`: Added new CCT sequence feature
- `1.1.0` → `1.1.1`: Fixed bug in CCT sequence timing
- `1.1.1` → `2.0.0`: Removed deprecated services

---

## Emergency Rollback Procedure

If a release has critical issues:

### Option 1: Create Hotfix (Preferred)
```bash
git checkout main
git checkout -b hotfix/vX.Y.Z+1
# Make fixes
git add .
git commit -m "Hotfix: critical issue description"
```

**REQUIRED:** Verify commit message:
```bash
git log -1
# Amend if needed:
# git commit --amend
# git log -1
```

**After verification, merge:**
```bash
git checkout main
git merge hotfix/vX.Y.Z+1
```

**REQUIRED:** Verify merge commit:
```bash
git log -1
# Amend if needed:
# git commit --amend
# git log -1
```

**After verification, tag:**
```bash
git tag -a vX.Y.Z+1 -m "Hotfix release"
```

**REQUIRED:** Verify tag:
```bash
git tag -n10 vX.Y.Z+1
# If changes needed:
# git tag -d vX.Y.Z+1
# git tag -a vX.Y.Z+1 -m "Corrected message"
```

**Only after all verifications, push:**
```bash
git push origin main
git push origin vX.Y.Z+1
# Create GitHub release
```

### Option 2: Mark Release as Pre-release
1. Go to GitHub release
2. Edit release
3. Check "This is a pre-release"
4. Save
5. Fix issues
6. Release proper version

### Option 3: Delete Release (Last Resort)
```bash
# Delete remote tag
git push --delete origin vX.Y.Z

# Delete local tag
git tag -d vX.Y.Z

# Delete GitHub release via UI
# Fix issues
# Re-release with same version
```

**Warning:** Only use Option 3 if no users have installed the release yet.

---

## Quick Reference

### Quick Release Checklist

#### Pre-Release
- [ ] Update `manifest.json` version
- [ ] Update `frontend_src/package.json` version
- [ ] **CRITICAL: Rebuild frontend** (`npm run build` in `frontend_src/`)
- [ ] **CRITICAL: Verify frontend build completed successfully** (check file timestamp and grep for new version)
- [ ] **CRITICAL: Commit the rebuilt frontend file** (or version mismatch warnings will appear)
- [ ] Update `CHANGELOG.md`
- [ ] Update `README.md` (if needed)
- [ ] Update `info.md` (if needed)
- [ ] **Update `.claude/*.md` files** (version + features, see section 2)
  - Run `sed -i 's/Version: OLD/Version: NEW/g' .claude/*.md`
  - Manually update feature sections in each relevant file
  - Verify with `grep "Version:" .claude/*.md`
- [ ] Update `quality_scale.yaml` (if needed)
- [ ] Run linters (ruff, pylint, mypy)
- [ ] Run tests (>95% coverage)
- [ ] Create release branch
- [ ] Commit changes (including rebuilt frontend)
- [ ] **REQUIRED: Verify commit message with `git log -1`**
- [ ] **REQUIRED: Amend if needed, verify again**
- [ ] **Only after verification: Push changes**
- [ ] Test installation via HACS
- [ ] Verify all features work

#### Release
- [ ] Merge to main branch
- [ ] **REQUIRED: Verify merge commit message with `git log -1`**
- [ ] **REQUIRED: Amend if needed, verify again**
- [ ] **Only after verification: Push to main**
- [ ] **DO NOT create git tags during automated release prep**
- [ ] Tags will be created manually by repository owner when ready
- [ ] Release is ready when code is merged, versions updated, and tests pass

#### Post-Release
- [ ] **Sync dev branch with main** (merge main → dev)
- [ ] **REQUIRED: Verify merge commit with `git log -1`**
- [ ] **Only after verification: Push dev branch**
- [ ] Delete release branch
- [ ] Clean up local development files
- [ ] Monitor for issues
- [ ] Update project board
- [ ] Announce (optional)

---

## Common Issues and Solutions

### Issue: HACS doesn't see new version
**Solution:**
- Verify tag was pushed: `git tag -l`
- Check tag format: must be `vX.Y.Z` (with 'v' prefix)
- Wait up to 24 hours for HACS to update
- Force HACS refresh: Integrations → three dots → "Reload integration data"

### Issue: GitHub Actions fail
**Solution:**
- Check workflow logs
- Fix issues locally
- Push new commit to branch
- Re-test before merging

### Issue: Hassfest validation fails
**Solution:**
- Check `manifest.json` syntax
- Verify all required fields present
- Check `quality_scale.yaml` matches rules
- Run `python -m script.hassfest` locally

### Issue: Version mismatch after release
**Solution:**
- Verify both `manifest.json` and `frontend_src/package.json` were updated
- **Verify frontend was rebuilt** after updating `package.json`
- Check that `frontend/aqara_panel.js` was committed with the rebuild
- Panel footer should show matching frontend and backend versions
- If mismatch detected after release, delete and recreate the release with correct build

### Issue: Breaking change causes user issues
**Solution:**
- Create hotfix with backward compatibility
- Or: Update documentation with migration path
- Consider releasing minor version instead of patch

---

## Helpful Commands

```bash
# View all tags
git tag -l

# View last commit message (for verification)
git log -1

# View last commit with full details
git log -1 --stat

# Amend last commit message
git commit --amend

# View commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# View changes for CHANGELOG
git log --pretty=format:"- %s" vX.Y.Z..HEAD

# Check which files changed since last release
git diff vX.Y.Z --name-only

# Verify manifest version
cat custom_components/aqara_advanced_lighting/manifest.json | grep version

# Verify frontend version
cat custom_components/aqara_advanced_lighting/frontend_src/package.json | grep version

# Count lines of code
find custom_components/aqara_advanced_lighting -name "*.py" | xargs wc -l

# Find TODOs in code
grep -r "TODO" custom_components/aqara_advanced_lighting/

# Check for debug prints
grep -r "print(" custom_components/aqara_advanced_lighting/
```

---

## File Locations Quick Reference

```
Aqara-Advanced-Lighting/
├── .github/
│   └── workflows/
│       ├── hacs.yml           # HACS validation
│       ├── hassfest.yaml      # HA validation
│       └── validate.yaml      # Additional checks
├── .claude/                   # AI assistant documentation
│   ├── ARCHITECTURE.md        # VERSION + architecture reference
│   ├── SERVICES_API.md        # VERSION + services documentation
│   ├── DEVICES_MQTT.md        # VERSION + device support
│   ├── STATE_SEQUENCES.md     # VERSION + state/sequence management
│   ├── TRANSLATIONS.md        # VERSION + translation system
│   ├── COLOR_SYSTEM.md        # VERSION + color conversion
│   ├── FRONTEND_DEVELOPMENT.md # VERSION + UI component reference
│   ├── TESTING_TROUBLESHOOTING.md # VERSION + testing/debugging
│   ├── DEVELOPMENT_PATTERNS.md # VERSION + dev patterns
│   └── RELEASE_PROCEDURES.md  # VERSION + this document
├── custom_components/
│   └── aqara_advanced_lighting/
│       ├── manifest.json      # VERSION + metadata
│       ├── quality_scale.yaml # Quality tracking
│       └── frontend_src/
│           └── package.json   # VERSION (frontend)
├── CHANGELOG.md               # VERSION + release notes
├── README.md                  # Main documentation
├── info.md                    # HACS display
├── hacs.json                  # HACS config
└── RELEASE_NOTES_vX.Y.Z.md   # Detailed notes (gitignored)
```

**Note:** Files marked with `VERSION` must be updated for every release.

---

## Notes

- Always test on a non-production Home Assistant instance first
- Keep release notes user-friendly, not overly technical
- Do not use any icons or emojis in documents or commit messages, plain text only
- **CRITICAL: Always verify commit messages and tags before any git push operation**
  - Use `git log -1` to view commit messages
  - Use `git tag -n10 <tag>` to view tag messages
  - Amend if needed before pushing
  - This applies to ALL pushes: branches, main, tags, hotfixes
- Commit messages should be clear, accurate, and professional
- Include migration paths for breaking changes
- Be responsive to user issues after release
- Consider beta/RC releases for major versions
- Maintain backward compatibility when possible
- Document deprecations before removing features

---

**Last Updated:** 2026-01-19
**Document Version:** 1.6.0
