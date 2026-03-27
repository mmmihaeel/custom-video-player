import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/demo/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  webServer: {
    command:
      'pnpm --filter demo build && pnpm --filter demo preview -- --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI
  }
});
