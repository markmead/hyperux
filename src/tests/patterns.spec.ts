import { expect, test } from './fixtures'
import { demoCard, openPattern } from './helpers'

// Each block checks the documented Behavior Contract of one pattern through
// its live demo, using only what a user (or assistive technology) can observe.

test.describe('huxDialog', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'dialog'))

  test('opens a named, described modal and traps focus inside', async ({ page }) => {
    const trigger = demoCard(page).getByRole('button', { name: 'Open Dialog' })

    await trigger.click()

    const dialog = page.getByRole('dialog', { name: 'Delete item' })

    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog).toHaveAccessibleDescription(/cannot be undone/)

    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(
        true,
      )
    }
  })

  test('closes on Escape and returns focus to the trigger', async ({ page }) => {
    const trigger = demoCard(page).getByRole('button', { name: 'Open Dialog' })

    await trigger.click()
    await expect(page.getByRole('button', { name: 'Close dialog' })).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('closes from the close button and on backdrop click', async ({ page }) => {
    const trigger = demoCard(page).getByRole('button', { name: 'Open Dialog' })

    await trigger.click()
    await page.getByRole('button', { name: 'Close dialog' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(trigger).toBeFocused()

    await trigger.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.mouse.click(5, 5)
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('dispatches scoped open and close events', async ({ page }) => {
    await page.evaluate(() => {
      const recorded: string[] = []

      ;(globalThis as unknown as { recordedEvents: string[] }).recordedEvents = recorded

      for (const name of ['open', 'close']) {
        globalThis.addEventListener(`hux-dialog:delete-item-dialog:${name}`, () =>
          recorded.push(name),
        )
      }
    })

    await demoCard(page).getByRole('button', { name: 'Open Dialog' }).click()
    await expect(page.getByRole('button', { name: 'Close dialog' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()

    expect(
      await page.evaluate(
        () => (globalThis as unknown as { recordedEvents: string[] }).recordedEvents,
      ),
    ).toEqual(['open', 'close'])
  })
})

test.describe('huxDropdown', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'dropdown'))

  test('moves focus through menu items with the keyboard', async ({ page }) => {
    const trigger = demoCard(page).getByRole('button', { name: 'Options' })

    await trigger.click()

    const menu = page.getByRole('menu', { name: 'Options' })
    const items = menu.getByRole('menuitem')

    await expect(menu).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(items.first()).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(items.nth(1)).toBeFocused()

    await page.keyboard.press('End')
    await expect(items.last()).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(items.first()).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(items.last()).toBeFocused()

    await page.keyboard.press('Home')
    await expect(items.first()).toBeFocused()
  })

  test('supports typeahead', async ({ page }) => {
    await demoCard(page).getByRole('button', { name: 'Options' }).click()
    await expect(page.getByRole('menuitem').first()).toBeFocused()

    await page.keyboard.press('e')

    await expect(page.getByRole('menuitem', { name: /^Error Handling/ })).toBeFocused()
  })

  test('closes on Escape and returns focus to the trigger', async ({ page }) => {
    const trigger = demoCard(page).getByRole('button', { name: 'Options' })

    await trigger.click()
    await expect(page.getByRole('menuitem').first()).toBeFocused()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('menu')).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('opens from the trigger with ArrowUp on the last item', async ({ page }) => {
    await demoCard(page).getByRole('button', { name: 'Options' }).focus()
    await page.keyboard.press('ArrowUp')

    await expect(page.getByRole('menuitem').last()).toBeFocused()
  })
})

test.describe('huxCombobox', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'combobox'))

  test('filters options and tracks the active descendant', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Fruit' })

    await input.fill('ap')

    const listbox = page.getByRole('listbox', { name: 'Fruit options' })

    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await expect(listbox.getByRole('option')).toHaveCount(2)
    await expect(listbox.getByRole('option').first()).toContainText('Apple')
    await expect(listbox.getByRole('option').last()).toContainText('Apricot')

    await page.keyboard.press('ArrowDown')

    const activeId = await input.getAttribute('aria-activedescendant')

    expect(activeId).toBeTruthy()
    await expect(page.locator(`[id="${activeId}"]`)).toContainText('Apple')
  })

  test('selects the active option with Enter and closes on Escape', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Fruit' })

    await input.fill('apr')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    await expect(input).toHaveValue('Apricot')

    await input.fill('a')
    await expect(page.getByRole('listbox')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
  })
})

test.describe('huxTabs', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'tabs'))

  test('uses a roving tabindex with arrow, Home and End keys', async ({ page }) => {
    const tablist = page.getByRole('tablist', { name: 'Account settings', exact: true })
    const tabs = tablist.getByRole('tab')

    await tabs.first().focus()
    await page.keyboard.press('ArrowRight')

    await expect(tabs.nth(1)).toBeFocused()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '0')
    await expect(tabs.first()).toHaveAttribute('tabindex', '-1')

    await page.keyboard.press('End')
    await expect(tabs.last()).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(tabs.first()).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(tabs.last()).toBeFocused()

    await page.keyboard.press('Home')
    await expect(tabs.first()).toBeFocused()
  })

  test('shows the panel labelled by the selected tab', async ({ page }) => {
    const card = demoCard(page)
    const tablist = page.getByRole('tablist', { name: 'Account settings', exact: true })

    await tablist.getByRole('tab', { name: 'Security' }).click()

    await expect(card.getByRole('tabpanel', { name: 'Security' }).first()).toBeVisible()
  })

  test('keeps decoupled panels in sync', async ({ page }) => {
    const card = demoCard(page)
    const tablist = page.getByRole('tablist', { name: 'Account settings (decoupled panels)' })

    await tablist.getByRole('tab', { name: 'Notifications' }).click()

    await expect(card.getByRole('tabpanel', { name: 'Notifications' })).toHaveCount(1)
  })
})

test.describe('huxStepper', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'stepper'))

  test('moves between steps and disables Previous on the first step', async ({ page }) => {
    const card = demoCard(page)
    const previous = card.getByRole('button', { name: 'Previous step' })
    const next = card.getByRole('button', { name: 'Next step' })

    await expect(previous).toBeDisabled()
    await expect(card.getByRole('listitem').nth(0).getByRole('button')).toHaveAttribute(
      'aria-current',
      'step',
    )

    await next.click()

    await expect(card.getByRole('region', { name: /Shipping/ })).toBeVisible()
    await expect(card.getByRole('listitem').nth(1).getByRole('button')).toHaveAttribute(
      'aria-current',
      'step',
    )
    await expect(previous).toBeEnabled()

    await previous.click()
    await expect(card.getByRole('region', { name: /Contact/ })).toBeVisible()
  })
})

test.describe('huxInlineEditor', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'inline-editor'))

  test('reverts on Escape and returns focus to the edit button', async ({ page }) => {
    const card = demoCard(page)
    const edit = card.getByRole('button', { name: 'Edit display name' })

    await edit.click()

    const field = card.getByRole('textbox').first()

    await expect(field).toBeFocused()
    await field.fill('Grace Hopper')
    await page.keyboard.press('Escape')

    await expect(field).toBeHidden()
    await expect(edit).toBeFocused()
    await expect(card.getByText('Ada Lovelace').first()).toBeVisible()
  })

  test('commits on Enter', async ({ page }) => {
    const card = demoCard(page)

    await card.getByRole('button', { name: 'Edit display name' }).click()
    await card.getByRole('textbox').first().fill('Grace Hopper')
    await page.keyboard.press('Enter')

    await expect(card.getByText('Grace Hopper').first()).toBeVisible()
  })
})

test.describe('huxCopy', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'copy-to-clipboard'))

  test('copies an input value and announces success', async ({ page }) => {
    const card = demoCard(page)
    const button = card.getByRole('button', { name: 'Copy input value' })

    await button.click()

    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Hello there 👋')
    await expect(card.getByText(/copied/i).first()).toBeVisible()
  })

  test('copies the outer HTML of every named source', async ({ page }) => {
    await demoCard(page).getByRole('button', { name: 'Copy', exact: true }).click()

    const copied = await page.evaluate(() => navigator.clipboard.readText())

    expect(copied).toContain('data-hux-copy="contentExampleA"')
    expect(copied).toContain('data-hux-copy="contentExampleB"')
  })
})

test.describe('huxCommandPalette', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'command-palette'))

  test('opens from the keyboard shortcut and filters commands', async ({ page }) => {
    await page.keyboard.press('Control+p')

    const dialog = page.getByRole('dialog', { name: 'Command palette' })

    await expect(dialog.getByRole('combobox')).toBeFocused()

    await page.keyboard.type('scr')

    await expect(dialog.getByRole('option')).toHaveCount(1)
    await expect(dialog.getByRole('option')).toContainText('Scroll Spy Docs')
  })

  test('closes on Escape and returns focus to the opener', async ({ page }) => {
    const opener = demoCard(page).getByRole('button', { name: 'Open Command Palette' })

    await opener.click()
    await expect(
      page.getByRole('dialog', { name: 'Command palette' }).getByRole('combobox'),
    ).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden()
    await expect(opener).toBeFocused()
  })
})

test.describe('huxScrollSpy', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'scroll-spy'))

  test('marks the section scrolled to from the table of contents', async ({ page }) => {
    const navigation = page.getByRole('navigation', { name: 'Scroll Spy sections' })
    const target = navigation.getByRole('button', { name: 'Configuration Surface' })

    await target.click()

    await expect(target).toHaveAttribute('aria-current', /true|location/)
    await expect(navigation.locator('[aria-current]')).toHaveCount(1)
  })
})

test.describe('huxDialog focus return', () => {
  test.beforeEach(async ({ page }) => {
    await openPattern(page, 'dialog')

    // Alpine initialises components added after start, so this mounts a
    // minimal dialog with no `x-trap`: only the registration returns focus.
    await page.evaluate(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<div x-data="huxDialog({ dialogId: 'bare-dialog' })">
          <button type="button" x-on:click="openDialog()">Open bare dialog</button>
          <div x-cloak x-show="isOpen" role="dialog" aria-modal="true" x-bind:aria-labelledby="dialogTitleId">
            <h2 x-bind:id="dialogTitleId">Bare dialog</h2>
            <button type="button" x-on:click="closeDialog()">Done</button>
          </div>
          <button type="button" id="bare-dialog-other">Somewhere else</button>
        </div>`,
      )
    })
  })

  test('returns focus to the opener when focus is lost on close', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open bare dialog' })

    await trigger.click()
    await page.getByRole('button', { name: 'Done' }).click()

    await expect(page.getByRole('dialog', { name: 'Bare dialog' })).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('leaves focus alone when something else takes it as the dialog closes', async ({ page }) => {
    await page.getByRole('button', { name: 'Open bare dialog' }).click()

    // Close and move focus in the same task, as an app reacting to the close event would.
    await page.getByRole('button', { name: 'Done' }).evaluate((doneButton) => {
      ;(doneButton as HTMLButtonElement).click()
      document.getElementById('bare-dialog-other')?.focus()
    })

    await expect(page.getByRole('dialog', { name: 'Bare dialog' })).toBeHidden()
    await page.waitForTimeout(300)

    await expect(page.getByRole('button', { name: 'Somewhere else' })).toBeFocused()
  })
})

test.describe('huxResizable', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'resizable'))

  test('jumps to a breakpoint and reports it on the slider', async ({ page }) => {
    const card = demoCard(page)
    const slider = card.getByRole('slider', { name: 'Drag to resize' })
    const largeButton = card.getByRole('button', { name: 'lg', exact: true })

    await largeButton.click()

    await expect(largeButton).toHaveAttribute('aria-pressed', 'true')
    await expect(slider).toHaveAttribute('aria-valuetext', /lg breakpoint/)
  })

  test('resizes with the arrow keys and jumps with Home and End', async ({ page }) => {
    const slider = demoCard(page).getByRole('slider', { name: 'Drag to resize' })

    await slider.focus()
    await page.keyboard.press('End')

    const widestWidth = Number(await slider.getAttribute('aria-valuenow'))

    await page.keyboard.press('ArrowLeft')
    expect(Number(await slider.getAttribute('aria-valuenow'))).toBe(widestWidth - 8)

    await page.keyboard.press('Shift+ArrowLeft')
    expect(Number(await slider.getAttribute('aria-valuenow'))).toBe(widestWidth - 8 - 32)

    await page.keyboard.press('Home')
    expect(Number(await slider.getAttribute('aria-valuenow'))).toBeLessThan(widestWidth)
  })
})

test.describe('huxInfiniteScroll', () => {
  test('loads pages as the sentinel scrolls into view and stops when done', async ({ page }) => {
    const requestedPages: string[] = []

    await page.route('https://jsonplaceholder.typicode.com/posts**', (route) => {
      const pageNumber = Number(new URL(route.request().url()).searchParams.get('_page'))

      requestedPages.push(String(pageNumber))

      const posts =
        pageNumber <= 2
          ? Array.from({ length: 10 }, (_, index) => ({
              id: (pageNumber - 1) * 10 + index + 1,
              title: `post ${(pageNumber - 1) * 10 + index + 1}`,
              body: 'body',
            }))
          : []

      return route.fulfill({
        json: posts,
        headers: { 'access-control-allow-origin': '*' },
      })
    })

    await openPattern(page, 'infinite-scroll')

    const feed = demoCard(page).getByRole('region', { name: 'Posts feed' })

    await expect(feed.getByText('post 1', { exact: true })).toBeVisible()

    await feed.evaluate((element) => element.scrollTo(0, element.scrollHeight))
    await expect(feed.getByText('post 11', { exact: true })).toBeAttached()

    await feed.evaluate((element) => element.scrollTo(0, element.scrollHeight))
    await expect(feed.getByText('All posts loaded.')).toBeVisible()

    expect(requestedPages).toEqual(['1', '2', '3'])
  })

  test('shows an error and does not mark the feed complete when a request fails', async ({
    page,
  }) => {
    await page.route('https://jsonplaceholder.typicode.com/posts**', (route) => route.abort())

    await openPattern(page, 'infinite-scroll')

    const feed = demoCard(page).getByRole('region', { name: 'Posts feed' })

    await expect(feed.getByText("Couldn't load more posts.")).toBeVisible()
    await expect(feed.getByText('All posts loaded.')).toBeHidden()
  })
})
