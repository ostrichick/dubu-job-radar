import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'list',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4380', browserName: 'chromium' },
  webServer: {
    command: 'node local-server.mjs',
    url: 'http://127.0.0.1:4380',
    reuseExistingServer: true,
    timeout: 15000,
  },
});
