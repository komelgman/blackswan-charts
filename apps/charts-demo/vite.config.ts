import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

const demoRoot = fileURLToPath(new URL('.', import.meta.url));
const demoSrc = fileURLToPath(new URL('./src', import.meta.url));
const libRoot = fileURLToPath(new URL('../../packages/charts-lib', import.meta.url));
const libSrc = fileURLToPath(new URL('../../packages/charts-lib/src', import.meta.url));
const libIndex = fileURLToPath(new URL('../../packages/charts-lib/src/index.ts', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isServe = command === 'serve';

  return {
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
      alias: isServe
        ? [
          { find: '@', replacement: libSrc },
          { find: '@demo', replacement: demoSrc },
          { find: 'blackswan-charts', replacement: libIndex },
        ]
        : [
          { find: '@', replacement: demoSrc },
          { find: '@demo', replacement: demoSrc },
        ],
    },

    server: {
      fs: {
        allow: [demoRoot, libRoot],
      },
    },

    build: {
      sourcemap: true,
    },
  };
});
