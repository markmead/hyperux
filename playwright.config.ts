import { defineConfig, devices } from '@playwright/test'

// Lets environments with a preinstalled Chromium reuse it instead of running
// `playwright install` (e.g. PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium).
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4321/',
    trace: 'off',
  },
  webServer: {
    // Test the production build: prerendered pages, Markdown, registry JSON
    // and the Cloudflare `_headers` rules, served by the adapter's preview.
    command: 'pnpm build && pnpm astro preview --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: !process.env.CI,
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
