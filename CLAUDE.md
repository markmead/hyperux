# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HyperUX is a documentation site for behavior-first Alpine.js UI patterns at [js.hyperui.dev](https://js.hyperui.dev). Each pattern is a self-contained Alpine.js component that users can copy and adapt. The site is built with Astro and deployed to Cloudflare Pages via Wrangler.

## Commands

```bash
pnpm dev       # wrangler types + astro dev
pnpm build     # wrangler types + astro build
pnpm check     # astro type-check
pnpm lint      # eslint
pnpm format    # prettier (respects .prettierignore)
```

There are no tests.

## Architecture

### Alpine.js Pattern Registrations

All Alpine.js component logic lives in `src/components/PatternRegistration.astro` as `is:inline` scripts. Each script registers one component via `Alpine.data()` on the `alpine:init` event. This file is the **source of truth** for all component behavior, options, and defaults — always verify documentation against it.

Registered components:
- `huxCombobox` — filterable listbox, single/multi-select
- `huxCommandPalette` — composes `huxDialog` + `huxCombobox`, global keyboard shortcut
- `huxCopy` — clipboard copy via `data-hux-copy` attribute targets
- `huxDialog` — modal/dialog with optional persistence and seamless modes
- `huxInlineEditor` — click-to-edit with commit/revert and focus management
- `huxDropdown` — accessible dropdown menu with keyboard navigation
- `huxResizable` — drag-to-resize container with breakpoint tracking
- `huxScrollSpy` — TOC + scroll position tracking via IntersectionObserver
- `huxStepper` — multi-step stepper (foundation for a wizard pattern)
- `huxInfiniteScroll` — IntersectionObserver sentinel watcher that fires `load-more` events; data-fetching is handled by the consumer
- `huxTabs` — tabs with roving tabindex, optional hash sync, and decoupled panels
- `huxTabPanel` — companion to `huxTabs` for panels in a separate DOM scope

### Content Collections

Pattern documentation lives in `src/content/patterns/*.mdx`. The schema (`src/content.config.ts`) requires: `slug`, `title`, `description`, `terms`, `pubDate`, `modDate`.

Routing: `src/pages/patterns/[...slug].astro` uses `pattern.data.slug` (not the filename) as the URL slug.

### The `data-hux-copy` System

Elements with `data-hux-copy="<name>"` are both:
1. **Sources** for `huxCopy` — referenced by name in `sourceNames` (copies `outerHTML`) or `valueSourceNames` (copies `.value` / `.textContent`)
2. **Registration markers** — each Alpine registration script has `data-hux-copy="hux*Registration"` so users can copy the component JS alongside the demo HTML

Demo buttons always combine the demo element name and the registration name:
```html
x-data="huxCopy({ sourceNames: ['huxTabsDemo', 'huxTabsRegistration'] })"
```

### Event Naming

Action-driven events use hyphen-case and are optionally scoped with a component id:
- `hux-dialog:{id}:open` / `hux-dialog:{id}:close`
- `hux-tabs:{id}:change`
- `hux-stepper:{id}:change`
- `hux-dropdown:{triggerId}:{action}` and `hux-dropdown:{action}`
- `hux-command-palette:{paletteId}:{action}`
- `hux-inline-editor:{editorId}:commit` / `hux-inline-editor:{editorId}:revert`
- `hux-infinite-scroll:{scrollerId}:load-more` and `hux-infinite-scroll:load-more`

## Pattern Documentation Rules

### Page Structure (in order)

1. Frontmatter
2. Demo import
3. `<Demo />`
4. Intro paragraph
5. Runtime constraints (if applicable)
6. API
7. Options
8. Quick Start
9. Common Usage Patterns
10. Behavior Contract
11. Error Handling
12. Accessibility Notes
13. Notes

### Component Naming Conventions

All config options, public properties, public methods, internal properties, and callbacks must use at least two descriptive words — single-word names are not acceptable. Look to existing components for patterns: `startsOpen` not `open`, `useHash` not `hash`, `intersectionThreshold` not `threshold`, `markStepComplete` not `complete`, `enterEditMode` not `edit`.

### Snippet Conventions

- Use explicit Alpine attribute syntax: `x-on:click` not `@click`, `x-bind:class` not `:class`
- Add `type="button"` to non-submit buttons
- Use `aria-live="polite"` for status text (e.g. copy feedback)
- Add `aria-label` to icon-only controls
- Update `modDate` whenever content meaningfully changes

### Accuracy

Document only what is implemented. Verify all options, defaults, method names, and error messages against `PatternRegistration.astro` before finalizing docs.

## PR / Issue Naming

Format: `<Feature|Bugfix|Update|Epic> - Description` (sentence case description)

Examples:
- `Feature - Add new card variants`
- `Bugfix - Fix mobile menu focus trap`
- `Update - Refresh accordion documentation`
