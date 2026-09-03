import { defineConfig, devices } from '@playwright/test';

const UI_BASE = process.env.UI_BASE_URL ?? 'https://practicesoftwaretesting.com';
const API_BASE = process.env.API_BASE_URL ?? 'https://api.practicesoftwaretesting.com';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  // The suite hits a shared public demo instance, so tests must never depend on
  // each other's data. Full parallelism is the forcing function that proves it.
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 4 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  reporter: isCI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: UI_BASE,
    // The app marks every interactive element with data-test, so the whole suite
    // addresses elements the way the developers intended, not by CSS or text.
    testIdAttribute: 'data-test',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: API_BASE },
    },
    {
      name: 'chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests/ui',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testDir: './tests/ui',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile',
      testDir: './tests/ui',
      grep: /@mobile/,
      use: { ...devices['Pixel 7'] },
    },
    {
      // Pixel comparison is pinned to one engine and one viewport on purpose:
      // font rasterisation differs per browser, and a "visual" suite that runs
      // everywhere is a suite that gets muted within a week.
      name: 'visual',
      testDir: './tests/visual',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],
});
