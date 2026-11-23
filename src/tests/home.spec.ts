import { readFileSync, readdirSync } from 'node:fs'

import { expect, test } from './fixtures'
import { waitForAlpine } from './helpers'

const patternTitles = readdirSync('src/content/patterns')
  .filter((fileName) => fileName.endsWith('.mdx'))
  .map((fileName) => readFileSync(`src/content/patterns/${fileName}`, 'utf8'))
  .map((source) => source.match(/^title: (.+)$/m)?.[1]?.trim())
  .filter((title): title is string => Boolean(title))

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAlpine(page)
  })

  test('has one h1 and a labelled patterns section', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('region', { name: 'Patterns' })).toBeVisible()
  })

  test('links every pattern with its description', async ({ page }) => {
    const patterns = page.getByRole('region', { name: 'Patterns' })

    await expect(patterns.getByRole('listitem')).toHaveCount(patternTitles.length)

    for (const title of patternTitles) {
      const link = patterns.getByRole('link', { name: title, exact: true })

      await expect(link).toHaveAttribute('href', /^\/patterns\/[a-z-]+$/)
      await expect(link.locator('xpath=..').locator('p')).not.toBeEmpty()
    }
  })

  test('the hero code block can be scrolled with the keyboard', async ({ page }) => {
    const codeBlock = page.locator('pre').first()

    await expect(codeBlock).toHaveAttribute('tabindex', '0')
    await expect(codeBlock).toContainText('huxDialog')
  })

  test('the stage is live: the trace follows the dialog and focus', async ({ page }) => {
    const trace = page.getByRole('list', { name: 'Event trace' })
    const newest = trace.getByRole('listitem').first()

    await expect(page.getByText('Nothing yet. Press Tab, or open the dialog.')).toBeVisible()

    const trigger = page.getByRole('button', { name: 'Delete account' })

    await trigger.click()

    await expect(page.getByRole('dialog', { name: 'Delete your account?' })).toBeVisible()
    await expect(trace).toContainText('hux-dialog:confirm-delete:open')
    await expect(trace).toContainText('<button> Cancel')

    await page.keyboard.press('Tab')
    await expect(newest).toContainText('<button> Delete')
    await expect(trace).toContainText('Tab')

    await page.keyboard.press('Escape')

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(trace).toContainText('hux-dialog:confirm-delete:close')
    await expect(newest).toContainText('<button> Delete account')
    await expect(trigger).toBeFocused()
  })

  test('keycaps light while their key is held', async ({ page }) => {
    const tabKey = page.locator('[data-key="Tab"]')
    const shiftTabKey = page.locator('[data-key="ShiftTab"]')

    await expect(tabKey).toHaveAttribute('data-lit', 'false')

    await page.keyboard.down('Tab')
    await expect(tabKey).toHaveAttribute('data-lit', 'true')
    await page.keyboard.up('Tab')
    await expect(tabKey).toHaveAttribute('data-lit', 'false')

    await page.keyboard.down('Shift')
    await page.keyboard.down('Tab')
    await expect(shiftTabKey).toHaveAttribute('data-lit', 'true')
    await expect(tabKey).toHaveAttribute('data-lit', 'false')
  })

  test('the header fits on one row at phone width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    const header = page.locator('header').first()
    const { height } = (await header.boundingBox())!

    expect(height).toBeLessThan(80)
    await expect(page.getByRole('button', { name: /Search patterns/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible()
  })
})
