# HyperUX

**Behavior-first Alpine.js patterns you can copy, adapt, and ship.**

Most component libraries hand you markup *and* an opinion about how it should
look. HyperUX only hands you the behavior — keyboard handling, focus
management, ARIA state, event contracts — as a single `Alpine.data()`
registration. Bring your own markup, your own classes, your own design
system.

<https://js.hyperui.dev>

## Quick look

```html
<div x-data="huxDialog({ dialogId: 'confirm-delete' })">
  <button type="button" x-on:click="openDialog()">Delete account</button>

  <div
    x-cloak
    x-show="isOpen"
    role="dialog"
    aria-modal="true"
    x-bind:aria-labelledby="dialogTitleId"
  >
    <h2 x-bind:id="dialogTitleId">Delete your account?</h2>
    <button type="button" x-on:click="closeDialog()">Cancel</button>
  </div>
</div>
```

That's the whole pattern: open/close state, an id for `aria-labelledby`, and
nothing telling you what a dialog should look like. Copy the registration
script and markup from [js.hyperui.dev](https://js.hyperui.dev), then style
it however you like.

## Patterns

| Pattern                    | What it does                                                     |
| --------------------------- | ------------------------------------------------------------------ |
| `huxCombobox`               | Filterable listbox, single or multi-select                       |
| `huxCommandPalette`         | Command-palette dialog, composes `huxDialog` + `huxCombobox`     |
| `huxCopy`                   | Clipboard copy via `data-hux-copy` attribute targets              |
| `huxDialog`                 | Modal/dialog with optional persistence and seamless modes         |
| `huxInlineEditor`           | Click-to-edit with commit/revert and focus management             |
| `huxDropdown`                | Accessible dropdown menu with roving-tabindex keyboard navigation |
| `huxResizable`               | Drag-to-resize container with breakpoint tracking                 |
| `huxScrollSpy`               | TOC + scroll position tracking via `IntersectionObserver`         |
| `huxStepper`                 | Multi-step stepper (foundation for a wizard pattern)               |
| `huxInfiniteScroll`          | Sentinel watcher that fires `load-more`; fetching is up to you    |
| `huxTabs` / `huxTabPanel`   | Tabs with roving tabindex, optional hash sync, decoupled panels   |

Full API, options, defaults, and behavior contracts for each pattern are
documented at [js.hyperui.dev](https://js.hyperui.dev).

## Development

```bash
pnpm dev       # wrangler types + astro dev
pnpm build     # wrangler types + astro build
pnpm check     # astro type-check
pnpm lint      # eslint
pnpm format    # prettier
```

Built with [Astro](https://astro.build), deployed to Cloudflare Pages.

## Contributing

Found a bug, or have an idea for a pattern? [Open an
issue](https://github.com/markmead/hyperux/issues/new).
