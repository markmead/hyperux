# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HyperUX is a documentation site for behavior-first Alpine.js UI patterns at [js.hyperui.dev](https://js.hyperui.dev). Each pattern is a self-contained Alpine.js component that users can copy and adapt. The site is built with Astro and deployed to Cloudflare Pages via Wrangler.

## Commands

```bash
pnpm dev       # wrangler types + astro dev
pnpm build     # wrangler types + astro build
pnpm check     # astro type-check
pnpm test      # builds, serves with astro preview, runs Playwright (src/tests)
pnpm lint      # eslint
pnpm format    # prettier (respects .prettierignore)
```

Tests live in `src/tests`: `patterns.spec.ts` (behavior contracts through the live demos), `accessibility.spec.ts` (axe, WCAG 2.2 AA, on every page and open state) and `agents.spec.ts` (Markdown, llms.txt, registry JSON, agent skill). In environments with a preinstalled Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its path.

## Architecture

### Alpine.js Pattern Registrations

All Alpine.js component logic lives in `src/components/patterns/<registration>.js`, one file per `Alpine.data()` registration on the `alpine:init` event. `src/components/PatternRegistration.astro` globs that folder and inlines each file as an `is:inline` script, so a new file is picked up automatically. These files are the **source of truth** for all component behavior, options, and defaults — always verify documentation against them. Alpine plugins (currently `@alpinejs/focus`) are bundled via `src/alpine-entrypoint.ts`.

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
- `huxToast` — queued notifications with pausable auto-dismiss timers; shown via window events
- `huxTreeView` — ARIA tree with roving tabindex, expand/collapse, typeahead and selection

### Content Collections

Pattern documentation lives in `src/content/patterns/*.mdx`. The schema (`src/content.config.ts`) requires: `slug`, `title`, `description`, `terms`, `registrations` (the `Alpine.data()` names the pattern ships), `pubDate`, `modDate`. Optional: `composes` (slugs of patterns whose registrations it needs) and `requires` (Alpine plugins the markup relies on).

Routing: `src/pages/patterns/[...slug].astro` uses `pattern.data.slug` (not the filename) as the URL slug.

### Agent Outputs

Generated at build time from the content collection and registration files (`src/utils/markdown.ts`, `src/utils/registry.ts`):

- `/{path}.md` — Markdown version of every page (`/index.md` for home); MDX is cleaned and the registration source appended
- `/llms.txt` and `/llms-full.txt` — the llmstxt.org index and every pattern in one file
- `/r/registry.json` and `/r/{slug}.json` — shadcn-compatible universal registry items; composed patterns bundle the registrations they need

`skills/hyperux/SKILL.md` is the agent skill (`npx skills add markmead/hyperux`). Its pattern table must list every slug and registration; a test enforces this.

When adding a pattern: add the registration file, add the demo and MDX (with `registrations`), add a row to the skill table, and add behavior tests.

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
- `hux-tree-view:{treeId}:{select|expand|collapse}` and `hux-tree-view:{select|expand|collapse}`
- `hux-toast:{toastId}:show` (listened for on `window`) and `hux-toast:{toastId}:{reveal|dismiss}` / `hux-toast:{reveal|dismiss}` (dispatched)

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
- Do not add focus-ring utilities to demo markup. Keyboard focus styling is applied site-wide by a single `:focus-visible` rule in `src/styles/global.css`. Because that global CSS is not part of a copied snippet, copied elements fall back to the browser's default focus outline until the consumer adds their own global focus style.
- Update `modDate` whenever content meaningfully changes

### Accuracy

Document only what is implemented. Verify all options, defaults, method names, and error messages against the registration files in `src/components/patterns/` before finalizing docs.

## PR / Issue Naming

Format: `<Feature|Bugfix|Update|Epic> - Description` (sentence case description)

Examples:

- `Feature - Add new card variants`
- `Bugfix - Fix mobile menu focus trap`
- `Update - Refresh accordion documentation`
