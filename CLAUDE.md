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
pnpm format:check # prettier, check only (what CI runs)
pnpm knip      # unused files, exports and dependencies
pnpm test      # Playwright (builds the site, serves it with `astro preview`)
pnpm test:a11y # only the axe accessibility tests
```

## Testing and Accessibility

Playwright tests in `src/tests` run against the production build, in Chromium:

- `accessibility.spec.ts`: axe (WCAG 2.2 AA) on the home page and every pattern page at 390px and 1280px, on the open dialog, dropdown, combobox, command palette and site search, plus a no-horizontal-scroll check at 320px and 390px
- `patterns.spec.ts`: each pattern's documented behavior through its live demo (keyboard, focus, ARIA state, events)
- `fixtures.ts`: serves `@alpinejs/focus` from `node_modules` instead of the CDN the page uses (same bytes, so the integrity hash still matches), so tests run offline

In a sandbox that has Chromium preinstalled, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its path instead of running `playwright install`. CI (`.github/workflows/ci.yml`) has two jobs on every pull request and push to `main`: `lint` (`pnpm format:check`, `pnpm lint`, `pnpm knip`) and `test` (`pnpm build`, `pnpm check`, `pnpm test`). Run all of these before pushing; `pnpm format` fixes Prettier. Knip's config is `knip.json`; `@alpinejs/focus` is ignored there because the tests load it by file path.

**Always run `/accessibility-review` when you change UI markup, styles or pattern behavior.** Run it against the affected pages, fix what it finds, and note the findings in the pull request. axe only catches part of what matters, so keep `pnpm test:a11y` green and use `/accessibility-review` for keyboard, focus, contrast and screen reader checks the tests cannot cover. Add or update a test for behavior you fix.

## Design

`DESIGN.md` is the spec for the site's visual identity: tokens, type, the home page stage, header,
footer and focus. Read it before changing chrome or the home page, and update it in the same commit
as any design change. Pattern demos stay neutral and are not part of that identity.

## Architecture

### Alpine.js Pattern Registrations

Each component's logic lives in its own file in `src/components/patterns/` (for example `huxDialog.js`), registered via `Alpine.data()` on the `alpine:init` event. `src/components/PatternRegistration.astro` loads those files as `is:inline` scripts so the site can ship and copy them. The files in `src/components/patterns/` are the **source of truth** for all component behavior, options, and defaults — always verify documentation against them.

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

Pattern documentation lives in `src/content/patterns/*.mdx`. The schema (`src/content.config.ts`) requires: `slug`, `title`, `description`, `terms`, `registrations`, `pubDate`, `modDate`.

`registrations` lists the `Alpine.data()` names the pattern needs, each a file in `src/components/patterns/`. A composed pattern lists every registration it relies on (for example `command-palette` lists `huxCommandPalette`, `huxDialog` and `huxCombobox`). The build fails if a listed file does not exist.

Routing: `src/pages/patterns/[...slug].astro` uses `pattern.data.slug` (not the filename) as the URL slug.

### Agent Outputs

Every page has a prerendered Markdown version, built from the same MDX plus the registration source:

- `/{path}.md` for each page (`/index.md` for the home page), built by `src/utils/markdown.ts` and `src/pages/[...path].md.ts`
- `/llms.txt` (index) and `/llms-full.txt` (every pattern in one file)
- `BaseHead.astro` links each HTML page to its Markdown version with `<link rel="alternate" type="text/markdown">`
- `public/_headers` marks the Markdown files and `llms-full.txt` as `noindex`

When adding a pattern, set `registrations` in its frontmatter. Nothing else needs registering: the Markdown pages and `llms` files are generated from the content collection.

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
3. Title (`# Alpine.js …`)
4. Intro paragraph
5. `<Demo />`
6. Runtime constraints (if applicable)
7. API
8. Options
9. Quick Start
10. Common Usage Patterns
11. Behavior Contract
12. Error Handling
13. Accessibility Notes
14. Notes

### Component Naming Conventions

All config options, public properties, public methods, internal properties, and callbacks must use at least two descriptive words — single-word names are not acceptable. Look to existing components for patterns: `startsOpen` not `open`, `useHash` not `hash`, `intersectionThreshold` not `threshold`, `markStepComplete` not `complete`, `enterEditMode` not `edit`.

### Snippet Conventions

- Use explicit Alpine attribute syntax: `x-on:click` not `@click`, `x-bind:class` not `:class`
- Add `type="button"` to non-submit buttons
- Use `aria-live="polite"` for status text (e.g. copy feedback)
- Add `aria-label` to icon-only controls
- Do not add focus-ring utilities to demo markup. Keyboard focus styling is applied site-wide by a single `:focus-visible` rule in `src/styles/global.css`. Because that global CSS is not part of a copied snippet, copied elements fall back to the browser's default focus outline until the consumer adds their own global focus style.
- Update `modDate` whenever content meaningfully changes

### Accuracy

Document only what is implemented. Verify all options, defaults, method names, and error messages against the files in `src/components/patterns/` before finalizing docs.

## PR / Issue Naming

Format: `<Feature|Bugfix|Update|Epic> - Description` (sentence case description)

Examples:

- `Feature - Add new card variants`
- `Bugfix - Fix mobile menu focus trap`
- `Update - Refresh accordion documentation`
