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

- `npm run build:panel` - Build the panel bundle only
- `npm run build:card` - Build the card bundle only
- `npm run watch` - Watch mode for panel (rebuilds on file changes)
- `npm run watch:card` - Watch mode for card
- `npm run clean` - Remove the built bundles
- `npm test` - Run the Vitest unit-test suite once
- `npm run test:watch` - Vitest in watch mode

## Project structure

```
frontend_src/
├── package.json                       # Dependencies and build scripts
├── rollup.base.js                     # Shared Rollup plugins and Terser config
├── rollup.config.js                   # Panel bundle config (imports rollup.base.js)
├── rollup.card.config.js              # Card bundle config (imports rollup.base.js)
├── tsconfig.json                      # TypeScript config (ES2020 target, strict mode)
├── vitest.config.ts                   # Vitest config (happy-dom, src/**/*.test.ts)
├── src/
│   ├── index.ts                       # Panel entry point - registers custom elements
│   ├── card-index.ts                  # Card entry point - registers card + editor elements
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
│   │   ├── shared-form.ts             # Merged panel + editor form rules
│   │   └── color-picker.ts            # Color picker and palette styles
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
│   ├── audio-mode-registry.ts         # Fetch + tier-detect helpers for the backend MODE_REGISTRY
│   │
│   │── Other utilities
│   ├── preset-thumbnails.ts           # SVG thumbnail generators for preset previews (memoized)
│   ├── panel-translations.ts          # Translation loader (embeds translations in bundle)
│   │
│   │── Aqara Preset Favorites card
│   ├── aqara-preset-favorites-card.ts        # Card render and lifecycle (5 layouts, slider, audio badge)
│   ├── aqara-preset-favorites-card-editor.ts # Card editor element (curation list, layout, slider config)
│   ├── card-config.ts                        # Card config types and migration shims (compact -> compact-grid)
│   ├── card-config.test.ts                   # Vitest: config defaults, migration, layout setter
│   ├── card-curation.ts                      # Pure preset_ids filter+order helper
│   ├── card-curation.test.ts                 # Vitest: curation ordering and missing-id behavior
│   ├── card-running-ops.ts                   # WebSocket subscription wrapper for operations-changed event
│   ├── card-running-ops.test.ts              # Vitest: subscribe, refetch, fallback paths
│   │
│   │── Shared API client
│   ├── data-client/
│   │   ├── aqara-api.ts                # Cached + dedup-safe REST/WebSocket client (panel + card share this)
│   │   └── aqara-api.test.ts           # Vitest: cache TTL, in-flight dedup, bypassCache invalidation
│   │
│   │── Shared preset runtime (panel + card)
│   └── preset-runtime/
│       ├── preset-resolver.ts          # FavoritePresetRef[] -> ResolvedFavorite[] (ported from panel)
│       ├── preset-resolver.test.ts     # Vitest: builtin/user resolution, missing-preset filtering
│       ├── preset-compatibility.ts     # Device-type capability flags (mirrors panel _filterPresets)
│       ├── preset-compatibility.test.ts# Vitest: per-device-type capability matrix
│       ├── preset-activator.ts         # Activation dispatcher used by both card and (eventually) panel
│       ├── preset-activator.test.ts    # Vitest: per-preset-type service mapping, brightness rules
│       ├── preset-icon.ts              # Lit icon renderer with audio-reactive waveform badge
│       └── preset-icon.test.ts         # Vitest: icon dispatch and audio-badge predicates
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
aqara-panel.ts (main shell, ~4800 lines)
├── PreferencesController              # Manages user/global prefs load/save/debounce
├── Tab navigation (ha-tab-group)
├── Activate tab - entity selection, light control tiles, favorites (with custom drag-reorder)
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

aqara-preset-favorites-card.ts (~1300 lines) - Lovelace dashboard card
├── card-config.ts                     # Config schema and migration (compact -> compact-grid)
├── card-curation.ts                   # Per-card curated subset of favorites
├── card-running-ops.ts                # WebSocket subscription on aqara_advanced_lighting_operations_changed
├── data-client/aqara-api.ts           # Cached REST client (shared with panel)
├── preset-runtime/preset-resolver.ts  # Shared resolver (replaces card's old _resolvedFavorites)
├── preset-runtime/preset-compatibility.ts # Shared compatibility filter
├── preset-runtime/preset-activator.ts # Shared activation dispatcher
├── preset-runtime/preset-icon.ts      # Shared icon renderer with audio-badge
└── aqara-preset-favorites-card-editor.ts # Card editor (curation list, layout, brightness slider)
```

### Key patterns

- **Web components** - Lit 3.x with TypeScript decorators (`@customElement`, `@property`, `@state`)
- **Reactive controller** - `PreferencesController` owns 40 preference fields with debounced API persistence, decoupling preference state from the panel component
- **Self-contained subcomponents** - `<aqara-running-operations>` and `<aqara-config-tab>` manage their own rendering, internal state, and service calls, communicating back to the parent via custom events (`operations-changed`, `collapsed-changed`, `global-preferences-changed`, `toast`)
- **Color model** - All colors stored and transmitted in XY (CIE 1931); converted to RGB/Hex/HS for the UI via `color-utils.ts` with proper gamma correction
- **Modular editors** - Each preset type (effects, patterns, CCT sequences, segment sequences, dynamic scenes) has a dedicated editor component
- **Modular styles** - CSS is split into 10 scoped modules under `styles/`. Components import only the modules they need. `shared-form.ts` is shared between the panel and all editor components
- **Shared editor infrastructure** - `editor-constants.ts` provides `DEVICE_LABELS`, default color palettes, option list factories (`loopModeOptions`, `endBehaviorOptions`), a `localize()` helper, and HA version compatibility detection
- **Shared preset runtime** - The `preset-runtime/` modules (resolver, compatibility, activator, icon) provide a single implementation of preset resolution, capability filtering, activation, and icon rendering that the panel and the dashboard card both consume. The card lost roughly 600 lines of duplicated logic during this extraction
- **Shared API client** - `data-client/aqara-api.ts` provides a single module-level cache and in-flight deduplication for `presets`, `user_presets`, `user_preferences`, and `supported_entities`. Mutating callers pass `bypassCache: true` on the next read to invalidate
- **Audio-mode registry as source of truth** - The Python `MODE_REGISTRY` is exposed via `/api/aqara_advanced_lighting/audio_mode_registry`; `audio-mode-registry.ts` fetches and transforms it. No frontend component should hardcode a parallel mode list
- **Operations-changed subscription** - The card subscribes to the `aqara_advanced_lighting_operations_changed` HA event (via `card-running-ops.ts`) and refetches running operations on each event. This replaced 5-second polling and updates active-state highlighting in milliseconds
- **Extracted utilities** - Pure functions for entity info, sibling entity discovery, and preset duplication live in dedicated modules, reusable across components
- **Reorderable steps** - `ReorderableStepsMixin` adds pointer-event-based drag-and-drop with auto-scroll to sequence editors
- **Custom favorites order** - Panel favorites support a `'custom'` sort that lets the user drag-reorder the favorites grid. Old `'date-old'` preferences auto-migrate to `'custom'` on first load
- **Theme integration** - Styles use Home Assistant CSS custom properties for consistent theming, with both `--mdc-*` and `--ha-*` variable families for cross-version support
- **Translation system** - English translations from `translations/panel.en.json` are embedded at build time. Add `panel.{locale}.json` files and update `panel-translations.ts` to support additional languages
- **Type safety** - Union types (`AnyPreset`, `PresetType`) and a recursive `Translations` interface provide compile-time safety for presets and translations

### Supported device types

`t2_bulb`, `t2_cct`, `t1m`, `t1m_white`, `t1_strip`, `generic_rgb`, `generic_cct`

Preset availability and editor capabilities adapt based on device type. The panel filters incompatible presets and shows warnings when mixed device types are selected.

### Data flow

1. Panel and card load presets and device info via `data-client/aqara-api.ts`, which wraps `hass.callApi` with a module-level cache, in-flight deduplication, and `bypassCache` invalidation
2. User edits create draft state managed by Lit `@state()` decorators
3. Save operations call backend API endpoints to persist presets, then refetch with `bypassCache: true` so the next read picks up the change
4. Activation calls `hass.callService` (panel) or the shared `preset-runtime/preset-activator` (card) to trigger sequences, effects, or scenes
5. User preferences (color history, favorites, custom favorites order, sort order, collapsed state, audio-reactive overrides) are managed by `PreferencesController` with debounced persistence via `/api/aqara_advanced_lighting/user_preferences`. Audio-reactive preferences include scene override fields (`useAudioReactive`, `audioOverrideEntity`, `audioOverrideSensitivity`, `audioOverrideSilenceBehavior`, `audioOverrideBrightnessCurve`, and related range/curve fields) and effect override fields (`useEffectAudioReactive`, `effectAudioOverrideSpeedEnabled`, `effectAudioOverrideBrightnessEnabled`, `effectAudioOverrideSilenceBehavior`, and related fields)
6. Running-state UI updates are driven by the `aqara_advanced_lighting_operations_changed` HA bus event - the card subscribes via WebSocket through `card-running-ops.ts`, and the panel's running-operations component refetches on the same event
7. Subcomponents communicate state changes to the parent via custom events

### HA 2026.3 compatibility

The frontend targets 2026.3+ (WebAwesome-based) Home Assistant APIs:

- **Dialogs**: Uses `.headerTitle` string and `slot="footer"` for action buttons. The `dialogActions()` helper in `editor-constants.ts` renders cancel/confirm buttons into the footer slot
- **CSS variables**: Both `--mdc-dialog-*` and `--ha-dialog-*` families are set for width/height
- **Icon buttons**: Uses `--ha-icon-button-size` (the `--mdc-icon-button-size` variable is dead in 2026.3+)
- **Selects**: Uses `ha-selector` with `{ select: { options, mode: 'dropdown' } }` rather than `ha-select`/`mwc-list-item`

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

## Testing

The card and the shared `preset-runtime`, `data-client`, and `card-*` modules are covered by Vitest unit tests running in a happy-dom environment. Tests live next to the module they cover (`<module>.test.ts`).

Current test files (8 total, ~96 specs):

- `card-config.test.ts` - card config defaults, layout setter, `compact: true` migration
- `card-curation.test.ts` - per-card preset_ids filter and ordering
- `card-running-ops.test.ts` - subscription wiring, refetch-on-event, fallback-on-action
- `data-client/aqara-api.test.ts` - cache TTL, in-flight dedup, `bypassCache` invalidation
- `preset-runtime/preset-resolver.test.ts` - builtin/user preset resolution, missing-id filtering
- `preset-runtime/preset-compatibility.test.ts` - per-device-type capability matrix
- `preset-runtime/preset-activator.test.ts` - per-preset-type service mapping, brightness rules
- `preset-runtime/preset-icon.test.ts` - icon dispatch and audio-badge predicates

Run with `npm test` (single run) or `npm run test:watch` (watch mode).

## Technology stack

- **Lit 3.1** - Web component framework
- **TypeScript 5.x** - Type-safe JavaScript (strict mode, ES2020 target)
- **Rollup 4.9** - Module bundler
- **Terser** - JavaScript minification
- **Vitest 4.x + happy-dom 20.x** - Unit-test framework and lightweight DOM
