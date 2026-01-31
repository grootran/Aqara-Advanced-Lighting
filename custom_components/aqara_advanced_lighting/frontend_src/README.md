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
│   ├── types.ts                # TypeScript interfaces (HA API, presets, internal data)
│   ├── styles.ts               # Centralized Lit CSS with HA theme integration
│   ├── color-utils.ts          # Color space conversions (XY/CIE 1931, RGB, HSV)
│   ├── color-history.ts        # localStorage-based recent color history (max 8)
│   ├── panel-translations.ts   # Translation loader - embeds translations in bundle
│   ├── preset-thumbnails.ts    # SVG thumbnail generators for preset previews
│   ├── xy-color-picker.ts      # Circular color wheel picker (XY color space + RGB inputs)
│   ├── effect-editor.ts        # Editor for dynamic effect presets
│   ├── pattern-editor.ts       # Editor for segment pattern presets
│   ├── cct-sequence-editor.ts  # Editor for CCT (color temperature) sequences
│   ├── segment-sequence-editor.ts  # Editor for per-segment color animation sequences
│   ├── transition-curve-editor.ts  # Visual curve editor for T2 bulb transitions
│   ├── segment-selector.ts     # Unified segment selector (selection, color, sequence modes)
│   └── components/             # Reserved for future reusable components
└── translations/
    ├── panel.en.json           # English UI strings
    └── README.md               # Translation documentation
```

## Architecture

- **Web components** - Lit 3.x with TypeScript decorators (`@customElement`, `@property`, `@state`)
- **Color model** - All colors stored and transmitted in XY (CIE 1931); converted to RGB/HSV for the UI
- **Modular editors** - Each preset type (effects, patterns, CCT, segments) has a dedicated editor component
- **Theme integration** - Styles use Home Assistant CSS custom properties for consistent theming
- **Translation system** - English translations from `translations/panel.en.json` are embedded at build time. Add `panel.{locale}.json` files and update `panel-translations.ts` to support additional languages.

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
