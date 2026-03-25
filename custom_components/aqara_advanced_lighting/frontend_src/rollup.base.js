import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export const sharedPlugins = [
  replace({
    preventAssignment: true,
    values: {
      '__FRONTEND_VERSION__': packageJson.version,
    },
  }),
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
      drop_console: true,
      drop_debugger: true,
    },
  }),
];
