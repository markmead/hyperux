import { readFileSync } from 'node:fs'

import { test as base } from '@playwright/test'

const FOCUS_PLUGIN_URL =
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/@alpinejs\/focus@[^/]+\/dist\/cdn\.min\.js$/

// The page loads `@alpinejs/focus` from a CDN with a subresource integrity
// hash. Tests serve the byte-identical file from the dev dependency, so they
// run offline and never depend on the CDN being up.
const focusPlugin = readFileSync('node_modules/@alpinejs/focus/dist/cdn.min.js')

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(FOCUS_PLUGIN_URL, (route) =>
      route.fulfill({
        body: focusPlugin,
        contentType: 'application/javascript',
        headers: { 'access-control-allow-origin': '*' },
      }),
    )

    await use(context)
  },
})

export { expect } from '@playwright/test'
export type { Page } from '@playwright/test'
