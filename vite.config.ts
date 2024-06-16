/// <reference types="vitest" />
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx({
      babelPlugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        ['@babel/plugin-transform-flow-strip-types'],
      ],
    }),
  ],

  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }
    ],
  },

  build: {
    sourcemap: true,
  },

  test: {
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
  },
});
