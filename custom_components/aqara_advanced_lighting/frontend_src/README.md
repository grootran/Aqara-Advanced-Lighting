# Aqara Advanced Lighting Panel - Frontend

This directory contains the frontend source code for the Aqara Advanced Lighting sidebar panel built with Lit and TypeScript.

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

This will create `aqara_panel.js` in the `../frontend/` directory.

## Development

Watch mode for development (rebuilds on file changes):

```bash
npm run watch
```

## Structure

```
src/
├── index.ts                 # Entry point
├── aqara-panel.ts          # Main panel component
├── types.ts                # TypeScript type definitions
└── styles.ts               # Lit CSS styles
```

## Building for Distribution

The built JavaScript file (`aqara_panel.js`) is automatically served by Home Assistant when the integration is loaded. No additional configuration is needed.

## Technology Stack

- **Lit 3.x** - Web component framework
- **TypeScript** - Type-safe JavaScript
- **Rollup** - Module bundler
- **Terser** - JavaScript minification
