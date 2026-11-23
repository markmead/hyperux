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

  test('the keycaps and trace are in view on arrival at desktop height', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    const trace = page.getByRole('region', { name: 'What the registration just did' })

    for (const target of [
      page.locator('[data-key="Tab"]'),
      page.locator('[data-key="ArrowRight"]'),
      trace,
    ]) {
      const box = (await target.boundingBox())!

      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.y + box.height).toBeLessThanOrEqual(900)
    }
  })

  test('the open dialog does not cover the trace on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('button', { name: 'Delete account' }).click()

    const dialog = page.getByRole('dialog')
    const trace = page.getByRole('region', { name: 'What the registration just did' })

    await expect(dialog).toBeVisible()

    const dialogBox = (await dialog.boundingBox())!
    const traceBox = (await trace.boundingBox())!

    expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(traceBox.x)

    const traceIsOnTop = await trace.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + 20)

      return element.contains(hit)
    })

    expect(traceIsOnTop).toBe(true)
  })

  test('keyboard focus is visible on the stage and inside the dialog', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Delete account' })
    const ring = (locator: typeof trigger) =>
      locator.evaluate((element) => {
        const style = getComputedStyle(element)

        return { color: style.outlineColor, width: style.outlineWidth, style: style.outlineStyle }
      })

    await trigger.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(trigger).toBeFocused()

    // White ring on the cobalt stage, where an ink ring would be only 2.8:1.
    expect(await ring(trigger)).toEqual({
      color: 'rgb(255, 255, 255)',
      width: '3px',
      style: 'solid',
    })

    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()

    const cancel = page.getByRole('button', { name: 'Cancel' })

    await expect(cancel).toBeFocused()

    // The dialog is teleported to <body>, outside the stage, so it keeps the ink ring.
    expect(await ring(cancel)).toEqual({ color: 'rgb(22, 26, 36)', width: '3px', style: 'solid' })
  })

  test('reduced motion collapses the trace flash and the keycap press', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.keyboard.press('Tab')

    const newest = page.getByRole('list', { name: 'Event trace' }).getByRole('listitem').first()

    await expect(newest).toBeVisible()

    const timing = await newest.evaluate((element) => {
      const style = getComputedStyle(element)

      return { animation: Number.parseFloat(style.animationDuration), name: style.animationName }
    })

    expect(timing.name).toBe('hux-flash')
    expect(timing.animation).toBeLessThan(0.001)

    const keyTransition = await page
      .locator('[data-key="Tab"]')
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration))

    expect(keyTransition).toBeLessThan(0.001)
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
