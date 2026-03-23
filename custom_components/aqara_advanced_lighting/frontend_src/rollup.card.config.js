import { sharedPlugins } from './rollup.base.js';

export default {
  input: 'src/card-index.ts',
  output: {
    file: '../frontend/aqara_preset_favorites_card.js',
    format: 'iife',
    name: 'AqaraPresetFavoritesCard',
    sourcemap: false,
  },
  plugins: sharedPlugins,
};
