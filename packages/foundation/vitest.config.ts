import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  resolve: {
    alias: [
      { find: 'blackswan-foundation', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  test: {
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
  },
});
