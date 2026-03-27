import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repositoryName =
  process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'custom-video-player';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${repositoryName}/` : '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600
  },
  resolve: {
    alias: {
      '@mmmihaeel/custom-video-player': path.resolve(
        __dirname,
        '../../packages/custom-video-player/src/index.ts'
      )
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  }
});
