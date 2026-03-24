# Aqara Advanced Lighting panel - frontend

This directory contains the frontend source code for the Aqara Advanced Lighting sidebar panel built with Lit 3.x and TypeScript. The panel provides a full UI for managing Aqara light presets, effects, patterns, CCT sequences, segment animations, and dynamic scenes.

## Prerequisites

- Node.js 18+ and npm

## Installation

```bash
npm install
```

## Build

Build the production bundles:

```bash
npm run build
```

This creates two bundles in `../frontend/`:
- `aqara_panel.js` — main sidebar panel (IIFE, minified)
- `aqara_preset_favorites_card.js` — Lovelace card for preset favorites

Other scripts:

- `npm run watch` - Watch mode for development (rebuilds on file changes)
- `npm run clean` - Remove the built bundles

## Project structure

```
frontend_src/
├── package.json                       # Dependencies and build scripts
├── rollup.base.js                     # Shared Rollup plugins and Terser config
├── rollup.config.js                   # Panel bundle config (imports rollup.base.js)
├── rollup.card.config.js              # Card bundle config (imports rollup.base.js)
├── tsconfig.json                      # TypeScript config (ES2020 target, strict mode)
├── src/
│   ├── index.ts                       # Panel entry point - registers custom elements
│   ├── card-index.ts                  # Card entry point - registers card element
│   │
│   │── Panel core
│   ├── aqara-panel.ts                 # Main panel shell (tabs, presets, entities, favorites)
│   ├── running-operations.ts          # <aqara-running-operations> — active effects/sequences/scenes
│   ├── config-tab.ts                  # <aqara-config-tab> — device settings, transitions, zones
│   ├── preferences-controller.ts      # Lit ReactiveController for user/global preferences
│   ├── types.ts                       # TypeScript interfaces, union types, preset definitions
│   │
│   │── Styles (modular CSS)
│   ├── styles/
│   │   ├── index.ts                   # Barrel re-exports all style modules
│   │   ├── base.ts                    # :host, icon-button fix, scrollbar resets
│   │   ├── panel-scaffold.ts          # Header, toolbar, tabs, content layout
│   │   ├── panel-sections.ts          # Expansion panels, section headers, sort controls
│   │   ├── panel-presets.ts           # Preset buttons, user preset cards, management UI
│   │   ├── panel-activate.ts          # Target input, favorites, music sync
│   │   ├── panel-config.ts            # Transitions, dimming, curvature, instances, zones
│   │   ├── panel-editor-host.ts       # Step lists, segment grid, empty states
│   │   ├── shared-form.ts            # Merged panel + editor form rules
│   │   └── color-picker.ts           # Color picker and palette styles
│   │
│   │── Editor components
│   ├── effect-editor.ts               # Effect presets (type, colors, speed, segment targeting)
│   ├── pattern-editor.ts              # Segment patterns (individual/gradient/block color modes)
│   ├── cct-sequence-editor.ts         # CCT sequences (standard/solar/schedule modes)
│   ├── segment-sequence-editor.ts     # Segment sequences (per-step segment colors, pattern modes)
│   ├── dynamic-scene-editor.ts        # Dynamic scenes (color reorder, transition/hold/distribution)
│   ├── editor-constants.ts            # Shared utilities, HA 2026.3 compat helpers, option factories
│   │
│   │── Color and picker components
│   ├── color-utils.ts                 # Color space conversions (XY/CIE 1931, RGB, Hex, HS, Kelvin)
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
│   │── Extracted utility modules
│   ├── entity-utils.ts                # Entity helpers (friendly name, icon, state, color, device type)
│   ├── sibling-entity-finder.ts       # ZHA/Z2M number entity discovery (4-strategy lookup)
│   ├── preset-duplicate.ts            # Builtin-to-user preset conversion functions
│   │
│   │── Other utilities
│   ├── preset-thumbnails.ts           # SVG thumbnail generators for preset previews (memoized)
│   ├── panel-translations.ts          # Translation loader (embeds translations in bundle)
│   └── aqara-preset-favorites-card.ts # Lovelace card for quick preset activation
└── translations/
    ├── panel.en.json                  # English UI strings
    └── README.md                      # Translation documentation
```

Built output:

```
frontend/
├── aqara_panel.js                     # Panel bundle (minified IIFE)
├── aqara_preset_favorites_card.js     # Card bundle (minified IIFE)
└── icons/                             # SVG effect and preset template icons
```

## Architecture

### Component hierarchy

```
aqara-panel.ts (main shell, ~4500 lines)
├── PreferencesController              # Manages user/global prefs load/save/debounce
├── Tab navigation (ha-tab-group)
├── Activate tab - entity selection, light control tiles, favorites
│   └── running-operations.ts          # Self-contained running ops display and controls
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
└── Config tab
    └── config-tab.ts                  # Self-contained device settings, zones, curvature
        └── transition-curve-editor.ts
```

### Key patterns

- **Web components** - Lit 3.x with TypeScript decorators (`@customElement`, `@property`, `@state`)
- **Reactive controller** - `PreferencesController` owns 35 preference fields with debounced API persistence, decoupling preference state from the panel component
- **Self-contained subcomponents** - `<aqara-running-operations>` and `<aqara-config-tab>` manage their own rendering, internal state, and service calls, communicating back to the parent via custom events (`operations-changed`, `collapsed-changed`, `global-preferences-changed`, `toast`)
- **Color model** - All colors stored and transmitted in XY (CIE 1931); converted to RGB/Hex/HS for the UI via `color-utils.ts` with proper gamma correction
- **Modular editors** - Each preset type (effects, patterns, CCT sequences, segment sequences, dynamic scenes) has a dedicated editor component
- **Modular styles** - CSS is split into 10 scoped modules under `styles/`. Components import only the modules they need. `shared-form.ts` is shared between the panel and all editor components
- **Shared editor infrastructure** - `editor-constants.ts` provides `DEVICE_LABELS`, default color palettes, option list factories (`loopModeOptions`, `endBehaviorOptions`), a `localize()` helper, and HA version compatibility detection
- **Extracted utilities** - Pure functions for entity info, sibling entity discovery, and preset duplication live in dedicated modules, reusable across components
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
5. User preferences (color history, favorites, sort order, collapsed state) are managed by `PreferencesController` with debounced persistence via `/api/aqara_advanced_lighting/user_preferences`
6. Subcomponents communicate state changes to the parent via custom events

### HA 2026.3 compatibility

The frontend supports both pre-2026.3 (MDC-based) and 2026.3+ (WebAwesome-based) Home Assistant dialog and theming APIs:

- **Detection**: `hasNewHaDialog()` in `editor-constants.ts` checks for the new `headerTitle` property and caches the result
- **Dialogs**: Legacy uses `.heading` property with `slot="primaryAction"`/`slot="secondaryAction"`; new uses `.headerTitle` string with `slot="footer"` and header icon slots
- **CSS variables**: Both `--mdc-dialog-*` and `--ha-dialog-*` families are set for width/height

### Performance optimizations

- **Memoized option lists** - Editor option arrays are cached in `willUpdate()` and rebuilt only when translations change
- **O(1) preset lookup** - `_presetLookup` Map replaces O(n) linear scans for resolving preset names/icons
- **Cached gradients** - CCT gradient strings and theme colors are computed once and recomputed only when inputs change
- **Debounced saves** - `PreferencesController` coalesces rapid preference mutations into a single API write after 500ms
- **DOM query caching** - Drag-and-drop mixin caches parent element references during drag sessions
- **Memoized thumbnails** - `preset-thumbnails.ts` uses a bounded LRU cache (64 entries) for merged segment computation
- **Canvas redraw guard** - Color wheel only redraws when component size changes
- **Deferred loading** - `_loadSupportedEntities` defers until version check confirms setup is complete

## Build pipeline

Shared build configuration lives in `rollup.base.js`. Both panel and card configs import `sharedPlugins` from it.

Rollup processes each bundle through these plugins in order:

1. **Replace** - Injects `__FRONTEND_VERSION__` from `package.json`
2. **JSON** - Enables importing translation JSON files
3. **Node Resolve** - Resolves npm dependencies for the browser
4. **CommonJS** - Converts CommonJS modules to ES modules
5. **TypeScript** - Compiles TypeScript with strict type checking
6. **Terser** - Minifies output, strips `console.log` calls and comments in production

The output is two IIFE files in `../frontend/` that Home Assistant serves automatically when the integration is loaded. No additional configuration is needed.

## Technology stack

- **Lit 3.1** - Web component framework
- **TypeScript 5.x** - Type-safe JavaScript (strict mode, ES2020 target)
- **Rollup 4.9** - Module bundler
- **Terser** - JavaScript minification
