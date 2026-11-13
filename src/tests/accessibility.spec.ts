import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { demoCard, openPattern, patternSlugs } from './helpers'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoViolations(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS)

  if (include) {
    builder = builder.include(include)
  }

  const { violations } = await builder.analyze()

  expect(
    violations.map(({ id, help, nodes }) => ({
      id,
      help,
      targets: nodes.map(({ target }) => target),
    })),
  ).toEqual([])
}

test.describe('WCAG 2.2 AA (axe)', () => {
  test('home page', async ({ page }) => {
    await page.goto('/')
    await expectNoViolations(page)
  })

  for (const slug of patternSlugs) {
    test(`${slug} page`, async ({ page }) => {
      await openPattern(page, slug)
      await expectNoViolations(page)
    })
  }

  test('open dialog', async ({ page }) => {
    await openPattern(page, 'dialog')
    await demoCard(page).getByRole('button', { name: 'Open Dialog' }).click()
    await expect(page.getByRole('button', { name: 'Close dialog' })).toBeFocused()
    await expectNoViolations(page, '[role="dialog"]')
  })

  test('open dropdown menu', async ({ page }) => {
    await openPattern(page, 'dropdown')
    await demoCard(page).getByRole('button', { name: 'Options' }).click()
    await expect(page.getByRole('menuitem').first()).toBeFocused()
    await expectNoViolations(page, '.prose-demo')
  })

  test('open combobox', async ({ page }) => {
    await openPattern(page, 'combobox')
    await page.getByRole('combobox', { name: 'Fruit' }).fill('a')
    await page.keyboard.press('ArrowDown')
    await expectNoViolations(page, '.prose-demo')
  })

  test('open command palette', async ({ page }) => {
    await openPattern(page, 'command-palette')
    await demoCard(page).getByRole('button', { name: 'Open Command Palette' }).click()
    await page.keyboard.type('docs')
    await expectNoViolations(page, '[role="dialog"]')
  })

  test('visible toasts', async ({ page }) => {
    await openPattern(page, 'toast')
    await demoCard(page).getByRole('button', { name: 'Show success' }).click()
    await demoCard(page).getByRole('button', { name: 'Show error' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expectNoViolations(page, '[aria-label="Notifications"]')
  })
})
