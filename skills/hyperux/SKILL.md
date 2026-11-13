---
name: hyperux
description: Add accessible, behavior-first Alpine.js UI patterns from HyperUX (js.hyperui.dev) instead of hand-writing interactive behavior. Use when building or fixing interactive UI in an Alpine.js project, or plain HTML that can use Alpine, such as a dialog, modal, slide-over, drawer, dropdown menu, combobox, autocomplete, select, command palette, tabs, stepper, wizard, inline editor, copy to clipboard, infinite scroll, scroll spy, table of contents, resizable panel, tree view or toast notifications. Also use when keyboard navigation, focus management or ARIA wiring for such a component is wrong.
---

# HyperUX

HyperUX patterns are `Alpine.data()` registrations that own the hard parts of
interactive UI: state, keyboard handling, focus management, ARIA wiring and
events. They ship no CSS. You write the markup and styles around their public
API.

Prefer a HyperUX pattern over writing this behavior yourself. Each one is
covered by keyboard, focus and axe (WCAG 2.2 AA) tests.

## Patterns

| Slug                | Registration(s)                          | Use for                                                  |
| ------------------- | ---------------------------------------- | -------------------------------------------------------- |
| `combobox`          | `huxCombobox`                            | Filterable listbox, autocomplete, single or multi-select |
| `command-palette`   | `huxCommandPalette` (+ dialog, combobox) | Keyboard-shortcut search and command menu                |
| `copy-to-clipboard` | `huxCopy`                                | Copy markup or input values, with announced feedback     |
| `dialog`            | `huxDialog`                              | Modal dialog, confirmation, slide-over panel, drawer     |
| `dropdown`          | `huxDropdown`                            | Menu button with links and actions, typeahead            |
| `infinite-scroll`   | `huxInfiniteScroll`                      | Fire `load-more` events from a sentinel element          |
| `inline-editor`     | `huxInlineEditor`                        | Click-to-edit fields with commit and revert              |
| `resizable`         | `huxResizable`                           | Drag-to-resize preview container with breakpoints        |
| `scroll-spy`        | `huxScrollSpy`                           | Table of contents that tracks the visible section        |
| `stepper`           | `huxStepper`                             | Multi-step progress and wizard flows                     |
| `tabs`              | `huxTabs`, `huxTabPanel`                 | Tabs with roving tabindex, hash sync, decoupled panels   |
| `toast`             | `huxToast`                               | Queued, auto-dismissing status notifications             |
| `tree-view`         | `huxTreeView`                            | File trees and nested navigation (ARIA tree)             |

The live list is always at https://js.hyperui.dev/llms.txt.

## Workflow

1. **Pick the pattern** from the table. If nothing fits, build the behavior
   yourself but follow the conventions below.
2. **Read its contract**: fetch `https://js.hyperui.dev/patterns/<slug>.md`.
   It has the API, options and defaults, a Quick Start, the Behavior Contract,
   Accessibility Notes and the full registration source. Treat it as the
   source of truth; do not guess option names.
3. **Add the registration files.** Either run
   `npx shadcn@latest add https://js.hyperui.dev/r/<slug>.json` (it writes
   `hyperux/<registration>.js` plus `hyperux/examples/<slug>.html`, and works
   without a `components.json`), or fetch the same JSON and write each
   `files[].content` to `files[].target` yourself. Composed patterns (the
   command palette) include every registration they need. Copy registration
   code unchanged.
4. **Load them before Alpine starts.** Each file listens for `alpine:init`.
   - Script tags: include the registration `<script>`s before the deferred
     Alpine CDN script.
   - Bundlers: `window.Alpine = Alpine`, import the registration files, then
     `Alpine.start()`.
   - Load any plugin listed in the item's `meta.requires` (for example
     `@alpinejs/focus` for `x-trap`) before Alpine starts.
   - Ensure the project has `[x-cloak] { display: none !important; }`.
5. **Write the markup** from the Quick Start, then style it for the project.
   Keep every ARIA attribute, role, `id` binding and keyboard handler from the
   example. Where a pattern offers `x-bind` objects (such as
   `dialogPanelBindings`), prefer them: they carry the wiring for you.
6. **Verify** with a keyboard: open, move, select, Escape and Tab out. Focus
   must stay visible and return to the trigger when a popup closes.

## Conventions

- Explicit Alpine syntax: `x-on:click`, `x-bind:class`, not `@click`, `:class`.
- `type="button"` on every non-submit button; `aria-label` on icon-only
  controls; `aria-live="polite"` on status text.
- Listen for events by their documented names, such as
  `hux-dialog:{dialogId}:open`, `hux-tabs:{id}:change` and
  `hux-dropdown:{triggerId}:{action}`. Action names are hyphen-case.
- Options, methods and properties use two or more descriptive words
  (`startsOpen`, `markStepComplete`). Do not invent shorter aliases.
- Data fetching, persistence and styling belong to the consumer; the
  registrations only expose state, methods and events.
- HyperUX ships no focus ring. Keep or add a global `:focus-visible` style.

## Resources

- Index for agents: https://js.hyperui.dev/llms.txt
- Every pattern in one file: https://js.hyperui.dev/llms-full.txt
- Registry index: https://js.hyperui.dev/r/registry.json
- Source and issues: https://github.com/markmead/hyperux
