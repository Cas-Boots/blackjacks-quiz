import { defineConfig, devices } from '@playwright/test';

/**
 * De echte proef: een televisie, een hostscherm en meerdere telefoons in
 * losse browservensters, tegelijk tegen dezelfde server.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_URL ?? 'http://localhost:4173',
    trace: 'retain-on-failure',
    // Laat Playwright de browser gebruiken die al op de machine staat, in
    // plaats van er een te downloaden. Zet CHROMIUM_PAD als hij elders staat.
    launchOptions: process.env.CHROMIUM_PAD ? { executablePath: process.env.CHROMIUM_PAD } : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_URL
    ? undefined
    : {
        command: 'rm -f e2e.db* && DATABASE_PATH=./e2e.db HOST_PIN=2627 PORT=4173 node build/index.js',
        port: 4173,
        reuseExistingServer: false,
        timeout: 60_000,
      },
});
