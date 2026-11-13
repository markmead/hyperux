import { readFileSync, readdirSync } from 'node:fs'

import type { Page } from '@playwright/test'

/** Every pattern slug, read from the MDX frontmatter. */
export const patternSlugs = readdirSync('src/content/patterns')
  .filter((fileName) => fileName.endsWith('.mdx'))
  .map((fileName) => readFileSync(`src/content/patterns/${fileName}`, 'utf8'))
  .map((source) => source.match(/^slug: (.+)$/m)?.[1]?.trim())
  .filter((slug): slug is string => Boolean(slug))

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
