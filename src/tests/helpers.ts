import type { Page } from '@playwright/test'

/** Load a pattern page and wait for Alpine to initialise every component. */
export async function openPattern(page: Page, slug: string): Promise<void> {
  await page.goto(`/patterns/${slug}`)

  await page.waitForFunction(() => {
    const alpine = (globalThis as unknown as { Alpine?: { version?: string } }).Alpine

    return (
      Boolean(alpine?.version) &&
      document.querySelectorAll('[x-cloak]:not(template *)').length === 0
    )
  })
}

/** The first demo card on a pattern page. */
export function demoCard(page: Page, index = 0) {
  return page.locator('.prose-demo').nth(index)
}
