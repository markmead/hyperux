import process from 'node:process'

import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

// Lets an environment with a preinstalled Chromium reuse it instead of running
// `playwright install` (for example PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium).
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4321/',
    trace: 'off',
  },
  // Tests run against the production build, so prerendered pages and the
  // `public/_headers` rules are what gets tested. CI builds in an earlier step.
  webServer: {
    command: isCI
      ? 'pnpm exec astro preview --port 4321'
      : 'pnpm build && pnpm exec astro preview --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['clipboard-read', 'clipboard-write'],
        ...(chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}),
      },
    },
  ],
})
