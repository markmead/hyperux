import { expect, test } from '@playwright/test'

import { demoCard, openPattern } from './helpers'

// Each block checks the documented Behavior Contract of one pattern through
// its live demo, using only what a user (or assistive technology) can observe.

test.describe('huxDialog', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'dialog'))

  test('opens a named, described modal and traps focus inside', async ({ page }) => {
    const trigger = demoCard(page).getByRole('button', { name: 'Open Dialog' })

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')

    await trigger.click()

    const dialog = page.getByRole('dialog', { name: 'Delete item' })

    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog).toHaveAccessibleDescription(/cannot be undone/)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

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

test.describe('huxDialog without dialogId or x-trap', () => {
  test.beforeEach(async ({ page }) => {
    await openPattern(page, 'dialog')

    // Alpine initialises components added after start, so this mounts a
    // minimal dialog that relies only on the registration.
    await page.evaluate(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<div id="bare-dialog" x-data="huxDialog()">
          <button x-bind="dialogTriggerBindings">Open bare dialog</button>
          <div x-show="isOpen" x-bind="dialogPanelBindings">
            <h2 x-bind="dialogTitleBindings">Bare dialog</h2>
            <p x-bind="dialogDescriptionBindings">No id, no focus trap.</p>
            <button type="button" x-on:click="closeDialog()">Done</button>
          </div>
        </div>`,
      )
    })
  })

  test('is still named and described', async ({ page }) => {
    await page.getByRole('button', { name: 'Open bare dialog' }).click()

    const dialog = page.getByRole('dialog', { name: 'Bare dialog' })

    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAccessibleDescription('No id, no focus trap.')
  })

  test('returns focus to the opener when focus is lost on close', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open bare dialog' })

    await trigger.click()
    await page.getByRole('button', { name: 'Done' }).click()

    await expect(page.getByRole('dialog', { name: 'Bare dialog' })).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('closes on Escape from inside the panel', async ({ page }) => {
    await page.getByRole('button', { name: 'Open bare dialog' }).click()
    await page.getByRole('button', { name: 'Done' }).focus()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('dialog', { name: 'Bare dialog' })).toBeHidden()
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

test.describe('huxTreeView', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'tree-view'))

  test('exposes tree semantics with a single tab stop', async ({ page }) => {
    const tree = page.getByRole('tree', { name: 'Project files' })
    const source = tree.getByRole('treeitem', { name: 'src', exact: true })

    await expect(source).toHaveAttribute('aria-expanded', 'true')
    await expect(source).toHaveAttribute('aria-level', '1')
    await expect(tree.getByRole('treeitem', { name: 'components' })).toHaveAttribute(
      'aria-level',
      '2',
    )
    await expect(tree.getByRole('treeitem', { name: 'README.md' })).not.toHaveAttribute(
      'aria-expanded',
    )
    await expect(tree.locator('[tabindex="0"]')).toHaveCount(1)
  })

  test('expands, enters, collapses and climbs with arrow keys', async ({ page }) => {
    const tree = page.getByRole('tree', { name: 'Project files' })
    const components = tree.getByRole('treeitem', { name: 'components' })

    await tree.getByRole('treeitem', { name: 'src', exact: true }).focus()
    await page.keyboard.press('ArrowDown')
    await expect(components).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(components).toHaveAttribute('aria-expanded', 'true')
    await expect(tree.getByRole('treeitem', { name: 'Dialog.astro' })).toBeVisible()

    await page.keyboard.press('ArrowRight')
    await expect(tree.getByRole('treeitem', { name: 'Dialog.astro' })).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(components).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(components).toHaveAttribute('aria-expanded', 'false')
    await expect(tree.getByRole('treeitem', { name: 'Dialog.astro' })).toHaveCount(0)

    await page.keyboard.press('End')
    await expect(tree.getByRole('treeitem', { name: 'README.md' })).toBeFocused()

    await page.keyboard.press('Home')
    await expect(tree.getByRole('treeitem', { name: 'src', exact: true })).toBeFocused()
  })

  test('selects with Enter, finds by typeahead and expands siblings with *', async ({ page }) => {
    const tree = page.getByRole('tree', { name: 'Project files' })

    await tree.getByRole('treeitem', { name: 'src', exact: true }).focus()
    await page.keyboard.press('r')
    await expect(tree.getByRole('treeitem', { name: 'README.md' })).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(tree.getByRole('treeitem', { name: 'README.md' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(demoCard(page).getByText('readme-md')).toBeVisible()

    await page.keyboard.press('Home')
    await page.keyboard.press('*')
    await expect(tree.getByRole('treeitem', { name: 'public' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })
})

test.describe('huxToast', () => {
  test.beforeEach(async ({ page }) => openPattern(page, 'toast'))

  test('announces toasts in a labelled live region and dismisses them', async ({ page }) => {
    const region = page.getByRole('region', { name: 'Notifications' })

    await expect(region.locator('[aria-live="polite"]')).toHaveCount(1)

    await demoCard(page).getByRole('button', { name: 'Show success' }).click()
    await expect(region.getByText('Your changes have been saved.')).toBeVisible()

    await region.getByRole('button', { name: 'Dismiss notification' }).click()
    await expect(region.getByRole('listitem')).toHaveCount(0)
  })

  test('marks errors as alerts and keeps them without a timer', async ({ page }) => {
    await page.clock.install()
    await openPattern(page, 'toast')

    await demoCard(page).getByRole('button', { name: 'Show error' }).click()

    const alert = page.getByRole('alert')

    await expect(alert).toContainText('Upload failed')

    await page.clock.runFor(60_000)
    await expect(alert).toBeVisible()
  })

  test('auto-dismisses, pauses on hover and queues beyond the limit', async ({ page }) => {
    await page.clock.install()
    await openPattern(page, 'toast')

    const region = page.getByRole('region', { name: 'Notifications' })
    const showSuccess = demoCard(page).getByRole('button', { name: 'Show success' })

    for (let count = 0; count < 4; count += 1) {
      await showSuccess.click()
    }

    await expect(region.getByRole('listitem')).toHaveCount(3)

    await region.getByRole('listitem').first().hover()
    await page.clock.runFor(10_000)
    await expect(region.getByRole('listitem')).toHaveCount(3)

    await page.mouse.move(0, 0)
    await page.clock.runFor(5_100)
    // The three visible toasts expire and the queued fourth one takes a slot.
    await expect(region.getByRole('listitem')).toHaveCount(1)

    await page.clock.runFor(5_100)
    await expect(region.getByRole('listitem')).toHaveCount(0)
  })
})

test.describe('huxToast delay validation', () => {
  test('falls back to the default for NaN and negative delays', async ({ page }) => {
    await page.clock.install()
    await openPattern(page, 'toast')

    const region = page.getByRole('region', { name: 'Notifications' })

    for (const dismissDelay of [Number.NaN, -1]) {
      await page.evaluate((delay) => {
        window.dispatchEvent(
          new CustomEvent('hux-toast:site-toasts:show', {
            detail: { message: `Delay ${delay}`, dismissDelay: delay },
          }),
        )
      }, dismissDelay)
    }

    await page.clock.runFor(1_000)
    await expect(region.getByRole('listitem')).toHaveCount(2)

    await page.clock.runFor(4_500)
    await expect(region.getByRole('listitem')).toHaveCount(0)
  })
})
