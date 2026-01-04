import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: {
    file: '../frontend/aqara_panel.js',
    format: 'iife',
    name: 'AqaraPanel',
    sourcemap: false,
  },
  plugins: [
    json(),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false,
      sourceMap: false,
    }),
    terser({
      format: {
        comments: false,
      },
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    }),
  ],
};
