import AxeBuilder from '@axe-core/playwright'

import { expect, test, type Page } from './fixtures'
import { demoCard, openPattern, patternSlugs, waitForAlpine, waitForAnimations } from './helpers'

// axe finds roughly a third of accessibility problems, so these tests guard
// against regressions. They do not replace `/accessibility-review` or a pass
// with a screen reader.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
]

async function expectNoViolations(page: Page, include?: string) {
  await waitForAnimations(page)

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

for (const viewport of VIEWPORTS) {
  test.describe(`WCAG 2.2 AA (axe), ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('home page', async ({ page }) => {
      await page.goto('/')
      await waitForAlpine(page)
      await expectNoViolations(page)
    })

    for (const slug of patternSlugs) {
      test(`${slug} page`, async ({ page }) => {
        await openPattern(page, slug)
        await expectNoViolations(page)
      })
    }
  })
}

test.describe('Reflow', () => {
  for (const width of [320, 390]) {
    test.describe(`at ${width}px`, () => {
      test.use({ viewport: { width, height: 800 } })

      for (const slug of ['', ...patternSlugs]) {
        test(`${slug || 'home'} has no horizontal page scroll`, async ({ page }) => {
          await (slug ? openPattern(page, slug) : page.goto('/'))

          const { scrollWidth, clientWidth } = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }))

          expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
        })
      }
    })
  }
})

test.describe('Open states (axe)', () => {
  test('dialog', async ({ page }) => {
    await openPattern(page, 'dialog')
    await demoCard(page).getByRole('button', { name: 'Open Dialog' }).click()
    await expect(page.getByRole('dialog', { name: /./ }).first()).toBeVisible()
    await expectNoViolations(page)
  })

  test('dropdown menu', async ({ page }) => {
    await openPattern(page, 'dropdown')
    await demoCard(page).getByRole('button', { name: 'Options' }).click()
    await expect(page.getByRole('menuitem').first()).toBeFocused()
    await expectNoViolations(page)
  })

  test('combobox', async ({ page }) => {
    await openPattern(page, 'combobox')
    await page.getByRole('combobox', { name: 'Fruit' }).fill('a')
    await page.keyboard.press('ArrowDown')
    await expectNoViolations(page)
  })

  test('command palette', async ({ page }) => {
    await openPattern(page, 'command-palette')
    await demoCard(page).getByRole('button', { name: 'Open Command Palette' }).click()
    await page.keyboard.type('docs')
    await expectNoViolations(page)
  })

  test('home page hero dialog', async ({ page }) => {
    await page.goto('/')
    await waitForAlpine(page)
    await page.getByRole('button', { name: 'Delete account' }).click()
    await expect(page.getByRole('dialog', { name: 'Delete your account?' })).toBeVisible()
    await expectNoViolations(page)
  })

  test('home page stage with a populated trace and a lit key', async ({ page }) => {
    await page.goto('/')
    await waitForAlpine(page)
    await page.getByRole('button', { name: 'Delete account' }).click()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Escape')
    await expect(
      page.getByRole('list', { name: 'Event trace' }).getByRole('listitem').first(),
    ).toBeVisible()
    await page.keyboard.down('Tab')
    await expect(page.locator('[data-key="Tab"]')).toHaveAttribute('data-lit', 'true')
    await expectNoViolations(page)
    await page.keyboard.up('Tab')
  })

  test('site search', async ({ page }) => {
    await page.goto('/')
    await waitForAlpine(page)
    await page.getByRole('button', { name: /Search patterns/ }).click()
    await expect(page.getByRole('dialog', { name: 'Search patterns' })).toBeVisible()
    await expectNoViolations(page)
  })
})

test.describe('keyboard focus and zoom', () => {
  // Tabs through every focusable element on the page and asserts that each one shows the
  // site-wide focus ring: a visible outline of at least 2px.
  for (const path of ['/', ...patternSlugs.map((slug) => `/patterns/${slug}`)]) {
    test(`every tab stop shows a focus ring on ${path}`, async ({ page }) => {
      await page.goto(path)
      await waitForAlpine(page)

      const missing: string[] = []
      const seen = new Set<string>()

      for (let step = 0; step < 80; step++) {
        await page.keyboard.press('Tab')

        const stop = await page.evaluate(() => {
          const element = document.activeElement

          if (!element || element === document.body) {
            return null
          }

          const style = getComputedStyle(element)

          return {
            id: `${element.tagName.toLowerCase()} ${(element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0, 30)}`,
            visible: style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 2,
          }
        })

        if (!stop) {
          break
        }

        if (seen.has(stop.id) && seen.size > 3) {
          continue
        }

        seen.add(stop.id)

        // Focus inside an iframe goes to its own document, so look for the ring in there.
        if (stop.id.startsWith('iframe')) {
          const frame = page
            .frames()
            .find(
              (candidate) =>
                candidate !== page.mainFrame() && candidate.url().includes('/examples/'),
            )

          stop.visible = Boolean(
            await frame?.evaluate(() => {
              const style = getComputedStyle(document.documentElement)

              return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 2
            }),
          )
        }

        if (!stop.visible) {
          missing.push(stop.id)
        }
      }

      expect(seen.size).toBeGreaterThan(2)
      expect(missing).toEqual([])
    })
  }

  // 200% zoom of a 1280px window is a 640px viewport. Text must reflow with no sideways scroll.
  for (const path of ['/', '/patterns/tabs', '/patterns/dialog']) {
    test(`${path} reflows at 200% zoom`, async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 450 })
      await page.goto(path)
      await waitForAlpine(page)

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
      await expectNoViolations(page)
    })
  }
})
