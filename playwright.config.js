// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: 1,

  timeout: 60 * 1000,

  expect: {
    timeout: 10 * 1000,
  },

  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],

  use: {
    baseURL: 'http://localhost:5173',

    headless: true,

    viewport: {
      width: 1440,
      height: 900,
    },

    actionTimeout: 10000,

    navigationTimeout: 30000,

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    trace: 'retain-on-failure',

    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Enable these once your suite is stable

    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    // },
  ],

  webServer: {
    command: 'npm run dev --prefix dHRMS_2.0frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});