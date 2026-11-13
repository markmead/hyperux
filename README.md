# HyperUX

**Behavior-first Alpine.js patterns you can copy, adapt, and ship.**

Most component libraries hand you markup _and_ an opinion about how it should
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

| Pattern                   | What it does                                                      |
| ------------------------- | ----------------------------------------------------------------- |
| `huxCombobox`             | Filterable listbox, single or multi-select                        |
| `huxCommandPalette`       | Command-palette dialog, composes `huxDialog` + `huxCombobox`      |
| `huxCopy`                 | Clipboard copy via `data-hux-copy` attribute targets              |
| `huxDialog`               | Modal/dialog with optional persistence and seamless modes         |
| `huxInlineEditor`         | Click-to-edit with commit/revert and focus management             |
| `huxDropdown`             | Accessible dropdown menu with roving-tabindex keyboard navigation |
| `huxResizable`            | Drag-to-resize container with breakpoint tracking                 |
| `huxScrollSpy`            | TOC + scroll position tracking via `IntersectionObserver`         |
| `huxStepper`              | Multi-step stepper (foundation for a wizard pattern)              |
| `huxInfiniteScroll`       | Sentinel watcher that fires `load-more`; fetching is up to you    |
| `huxTabs` / `huxTabPanel` | Tabs with roving tabindex, optional hash sync, decoupled panels   |
| `huxToast`                | Queued, auto-dismissing notifications with pausable timers        |
| `huxTreeView`             | ARIA tree with arrow-key expand/collapse, typeahead and selection |

Full API, options, defaults, and behavior contracts for each pattern are
documented at [js.hyperui.dev](https://js.hyperui.dev).

## Use with AI assistants

HyperUX is built to be read and installed by coding agents, not only by people.

- **Docs for agents:** <https://js.hyperui.dev/llms.txt> indexes a Markdown
  version of every page (`/patterns/<slug>.md`), each with the API, behavior
  contract and full registration source.
  [`llms-full.txt`](https://js.hyperui.dev/llms-full.txt) has them all in one
  file.
- **Install a pattern:** every pattern is a
  [shadcn-compatible registry](https://ui.shadcn.com/docs/registry) item. This
  writes the registration and a markup example into `./hyperux`, with or
  without a `components.json`:

  ```bash
  npx shadcn@latest add https://js.hyperui.dev/r/dialog.json
  ```

  Agents can fetch the same JSON directly; `/r/registry.json` lists every item.

- **Agent skill:** teaches coding agents when to use a pattern and how to wire
  it up:

  ```bash
  npx skills add markmead/hyperux
  ```

- **Copy for AI:** each pattern page has a button that copies its Markdown docs
  and source, ready to paste into a chat.

Every pattern is covered by Playwright tests of its behavior contract and by
axe (WCAG 2.2 AA) checks.

## Focus styling

HyperUX ships behavior, not looks — and that includes keyboard focus. The demo
markup deliberately omits focus-ring utility classes; the site applies a single
global `:focus-visible` outline in `src/styles/global.css`. Because that global
rule is not part of a copied snippet, copied elements fall back to the browser's
default focus outline until you add your own — a global `:focus-visible` rule or
your framework's `focus-visible:` utilities. This applies to every pattern.

## Development

```bash
pnpm dev       # wrangler types + astro dev
pnpm build     # wrangler types + astro build
pnpm check     # astro type-check
pnpm test      # build, preview, then Playwright behavior + axe tests
pnpm lint      # eslint
pnpm format    # prettier
```

Built with [Astro](https://astro.build), deployed to Cloudflare Pages.

## Contributing

Found a bug, or have an idea for a pattern? [Open an
issue](https://github.com/markmead/hyperux/issues/new).
