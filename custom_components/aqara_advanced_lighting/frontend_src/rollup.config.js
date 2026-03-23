import { sharedPlugins } from './rollup.base.js';

export default {
  input: 'src/index.ts',
  output: {
    file: '../frontend/aqara_panel.js',
    format: 'iife',
    name: 'AqaraPanel',
    sourcemap: false,
  },
  plugins: sharedPlugins,
};
