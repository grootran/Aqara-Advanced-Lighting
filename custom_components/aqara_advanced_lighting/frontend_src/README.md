# Aqara Advanced Lighting panel - frontend

This directory contains the frontend source code for the Aqara Advanced Lighting sidebar panel built with Lit 3.x and TypeScript. The panel provides a full UI for managing Aqara light presets, effects, patterns, CCT sequences, segment animations, and dynamic scenes.

## Prerequisites

- Node.js 18+ and npm

## Installation

```bash
npm install
```

## Build

Build the production bundle:

```bash
npm run build
```

This creates `aqara_panel.js` in the `../frontend/` directory as a single IIFE bundle (~477 KB minified).

Other scripts:

- `npm run watch` - Watch mode for development (rebuilds on file changes)
- `npm run clean` - Remove the built bundle

## Project structure

```
frontend_src/
├── package.json                       # Dependencies and build scripts
├── rollup.config.js                   # Rollup build config (IIFE output, Terser minification)
├── tsconfig.json                      # TypeScript config (ES2020 target, strict mode)
├── src/
│   ├── index.ts                       # Entry point - registers panel custom elements
│   ├── aqara-panel.ts                 # Main panel component (tabs, presets, entities, favorites, state)
│   ├── types.ts                       # TypeScript interfaces, union types, preset type definitions
│   ├── styles.ts                      # Centralized Lit CSS with HA theme integration
│   │
│   │── Editor components
│   ├── effect-editor.ts               # Effect presets (type, colors, speed, segment targeting)
│   ├── pattern-editor.ts              # Segment patterns (individual/gradient/block color modes)
│   ├── cct-sequence-editor.ts         # CCT sequences (standard/solar/schedule modes)
│   ├── segment-sequence-editor.ts     # Segment sequences (per-step segment colors, pattern modes)
│   ├── dynamic-scene-editor.ts        # Dynamic scenes (color reorder, transition/hold/distribution)
│   ├── editor-constants.ts            # Shared utilities, HA 2026.3 compat helpers, form CSS
│   │
│   │── Color and picker components
│   ├── color-utils.ts                 # Color space conversions (XY/CIE 1931, RGB, Hex, HS)
│   ├── color-history.ts               # Immutable color history (max 8, server-persisted)
│   ├── color-history-swatches.ts      # Clickable recent color swatch component
│   ├── xy-color-picker.ts             # Circular HSL color wheel with RGB text inputs
│   ├── image-color-extractor.ts       # Image upload/URL color extraction with thumbnail saving
│   │
│   │── Segment and interaction components
│   ├── segment-selector.ts            # Unified segment selector (selection/color/sequence modes)
│   ├── reorderable-steps-mixin.ts     # Drag-drop step reordering mixin with auto-scroll
│   ├── transition-curve-editor.ts     # Canvas-based Bezier curve editor for T2 transitions
│   │
│   │── Utilities
│   ├── preset-thumbnails.ts           # SVG thumbnail generators for preset previews (memoized)
│   └── panel-translations.ts          # Translation loader (embeds translations in bundle)
└── translations/
    ├── panel.en.json                  # English UI strings
    └── README.md                      # Translation documentation
```

Built output:

```
frontend/
├── aqara_panel.js                     # Production bundle (~477 KB, minified IIFE)
└── icons/                             # SVG effect and preset template icons
```

## Architecture

### Component hierarchy

```
aqara-panel.ts (main shell)
├── Tab navigation (ha-tab-group)
├── Activate tab - entity selection, light control tiles, favorites
├── Effects tab
│   └── effect-editor.ts
├── Patterns tab
│   └── pattern-editor.ts
│       └── segment-selector.ts (color assignment mode)
├── CCT Sequences tab
│   └── cct-sequence-editor.ts
│       └── reorderable-steps-mixin.ts (drag-and-drop)
├── Segment Sequences tab
│   └── segment-sequence-editor.ts
│       ├── segment-selector.ts (segment selection mode)
│       └── reorderable-steps-mixin.ts (drag-and-drop)
├── Dynamic Scenes tab
│   └── dynamic-scene-editor.ts
│       ├── xy-color-picker.ts
│       ├── color-history-swatches.ts
│       └── image-color-extractor.ts
└── Config tab - device settings, transition curves
    └── transition-curve-editor.ts
```

### Key patterns

- **Web components** - Lit 3.x with TypeScript decorators (`@customElement`, `@property`, `@state`)
- **Color model** - All colors stored and transmitted in XY (CIE 1931); converted to RGB/Hex/HS for the UI via `color-utils.ts` with proper gamma correction
- **Modular editors** - Each preset type (effects, patterns, CCT sequences, segment sequences, dynamic scenes) has a dedicated editor component
- **Shared editor infrastructure** - `editor-constants.ts` provides `DEVICE_LABELS`, `DEFAULT_SPEED`, shared form CSS (`editorFormStyles`), a `localize()` helper, and HA version compatibility detection
- **Reorderable steps** - `ReorderableStepsMixin` adds pointer-event-based drag-and-drop with auto-scroll to sequence editors
- **Theme integration** - Styles use Home Assistant CSS custom properties for consistent theming, with both `--mdc-*` and `--ha-*` variable families for cross-version support
- **Translation system** - English translations from `translations/panel.en.json` are embedded at build time. Add `panel.{locale}.json` files and update `panel-translations.ts` to support additional languages
- **Type safety** - Union types (`AnyPreset`, `PresetType`) and a recursive `Translations` interface provide compile-time safety for presets and translations

### Supported device types

`t2_bulb`, `t2_cct`, `t1m`, `t1m_white`, `t1_strip`, `generic_rgb`, `generic_cct`

Preset availability and editor capabilities adapt based on device type. The panel filters incompatible presets and shows warnings when mixed device types are selected.

### Data flow

1. Panel loads presets and device info from the backend API via `hass.connection.sendMessagePromise`
2. User edits create draft state managed by Lit `@state()` decorators
3. Save operations call backend API endpoints to persist presets
4. Activation calls `hass.callService` to trigger sequences, effects, or scenes
5. User preferences (color history, favorites) are persisted server-side via the `/api/aqara_advanced_lighting/user_preferences` endpoint

### HA 2026.3 compatibility

The frontend supports both pre-2026.3 (MDC-based) and 2026.3+ (WebAwesome-based) Home Assistant dialog and theming APIs:

- **Detection**: `hasNewHaDialog()` in `editor-constants.ts` checks for the new `headerTitle` property and caches the result
- **Dialogs**: Legacy uses `.heading` property with `slot="primaryAction"`/`slot="secondaryAction"`; new uses `.headerTitle` string with `slot="footer"` and header icon slots
- **CSS variables**: Both `--mdc-dialog-*` and `--ha-dialog-*` families are set for width/height

### Performance optimizations

- **DOM query caching** - Drag-and-drop mixin caches parent element references during drag sessions
- **Memoized thumbnails** - `preset-thumbnails.ts` uses a bounded LRU cache (64 entries) for merged segment computation
- **Canvas redraw guard** - Color wheel only redraws when component size changes
- **RGB input caching** - Color picker caches input element references for continuous updates during dragging

## Build pipeline

Rollup processes the bundle through these plugins in order:

1. **Replace** - Injects `__FRONTEND_VERSION__` from `package.json`
2. **JSON** - Enables importing translation JSON files
3. **Node Resolve** - Resolves npm dependencies for the browser
4. **CommonJS** - Converts CommonJS modules to ES modules
5. **TypeScript** - Compiles TypeScript with strict type checking
6. **Terser** - Minifies output, removes console statements and comments

The output is a single IIFE file (`../frontend/aqara_panel.js`) that Home Assistant serves automatically when the integration is loaded. No additional configuration is needed.

## Technology stack

- **Lit 3.1** - Web component framework
- **TypeScript 5.x** - Type-safe JavaScript (strict mode, ES2020 target)
- **Rollup 4.9** - Module bundler
- **Terser** - JavaScript minification
