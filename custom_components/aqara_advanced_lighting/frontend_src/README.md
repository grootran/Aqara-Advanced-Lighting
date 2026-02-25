# Aqara Advanced Lighting Panel - Frontend

This directory contains the frontend source code for the Aqara Advanced Lighting sidebar panel built with Lit 3.x and TypeScript. The panel provides a full UI for managing Aqara light presets, effects, patterns, CCT sequences, and segment animations.

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

This creates `aqara_panel.js` in the `../frontend/` directory as a single IIFE bundle.

Other scripts:

- `npm run watch` - Watch mode for development (rebuilds on file changes)
- `npm run clean` - Remove the built bundle

## Project structure

```
frontend_src/
├── package.json
├── rollup.config.js            # Rollup build config (IIFE output, Terser minification)
├── tsconfig.json               # TypeScript config (ES2020 target, strict mode)
├── src/
│   ├── index.ts                # Entry point - registers panel with HA custom panel system
│   ├── aqara-panel.ts          # Main panel component - tabs, layout, preset management
│   ├── types.ts                # TypeScript interfaces, union types, and preset type definitions
│   ├── styles.ts               # Centralized Lit CSS with HA theme integration
│   │
│   │── Editor components
│   ├── effect-editor.ts        # Editor for dynamic effect presets
│   ├── pattern-editor.ts       # Editor for segment pattern presets
│   ├── cct-sequence-editor.ts  # Editor for CCT (color temperature) sequences
│   ├── segment-sequence-editor.ts  # Editor for per-segment color animation sequences
│   ├── dynamic-scene-editor.ts # Editor for dynamic scene presets (multi-light color transitions)
│   ├── editor-constants.ts     # Shared editor constants (DEVICE_LABELS, form CSS, localize helper)
│   │
│   │── Color and picker components
│   ├── color-utils.ts          # Color space conversions (XY/CIE 1931, RGB, HSV)
│   ├── color-history.ts        # localStorage-based recent color history (max 8)
│   ├── color-history-swatches.ts  # Clickable color swatch component for recent colors
│   ├── xy-color-picker.ts      # Circular color wheel picker (XY color space + RGB inputs)
│   ├── image-color-extractor.ts   # Image upload/URL color extraction with thumbnail generation
│   │
│   │── Segment and interaction components
│   ├── segment-selector.ts     # Unified segment selector (selection, color, sequence modes)
│   ├── reorderable-steps-mixin.ts # Drag-and-drop reordering mixin for step lists
│   ├── transition-curve-editor.ts # Visual curve editor for T2 bulb transitions
│   │
│   │── Utilities
│   ├── preset-thumbnails.ts    # SVG thumbnail generators for preset previews (memoized)
│   └── panel-translations.ts   # Translation loader - embeds translations in bundle
└── translations/
    ├── panel.en.json           # English UI strings
    └── README.md               # Translation documentation
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
- **Color model** - All colors stored and transmitted in XY (CIE 1931); converted to RGB/HSV for the UI
- **Modular editors** - Each preset type (effects, patterns, CCT, segments, dynamic scenes) has a dedicated editor component
- **Shared editor infrastructure** - `editor-constants.ts` provides `DEVICE_LABELS`, `DEFAULT_SPEED`, shared form CSS (`editorFormStyles`), and a `localize()` helper used by all editors
- **Reorderable steps** - `ReorderableStepsMixin` adds pointer-event-based drag-and-drop with auto-scroll to sequence editors
- **Theme integration** - Styles use Home Assistant CSS custom properties for consistent theming
- **Translation system** - English translations from `translations/panel.en.json` are embedded at build time. Add `panel.{locale}.json` files and update `panel-translations.ts` to support additional languages
- **Type safety** - Union types (`AnyPreset`, `PresetType`) and a recursive `Translations` interface provide compile-time safety for presets and translations

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
6. **Terser** - Minifies output and removes debugger statements

The output is a single IIFE file (`../frontend/aqara_panel.js`) that Home Assistant serves automatically when the integration is loaded. No additional configuration is needed.

## Technology stack

- **Lit 3.x** - Web component framework
- **TypeScript 5.x** - Type-safe JavaScript (strict mode, ES2020 target)
- **Rollup 4.x** - Module bundler
- **Terser** - JavaScript minification
