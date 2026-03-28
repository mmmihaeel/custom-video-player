import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/demo/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  webServer: {
    command:
      'pnpm --filter demo exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    url: 'http://127.0.0.1:4173'
  }
});
