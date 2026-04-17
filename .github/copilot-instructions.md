# Copilot Instructions for HyperUX Documentation

Use these rules whenever generating or editing pattern documentation in this repository.

## Scope

Apply this style to pages under `src/content/patterns/*.mdx` unless the user explicitly asks for a different format.

## Primary Style Goals

- Demo first, docs second.
- API reference leaning, with enough tutorial context to get started fast.
- Behavior and error handling must match implementation exactly.
- Accessibility guidance must appear both in prose and in code snippets.

## Required Page Structure

Use this section order unless the user requests a custom order:

1. Frontmatter
2. Demo import
3. `<Demo />`
4. Intro paragraph (what it does, who it is for)
5. Runtime constraints (if relevant, e.g. HTTPS/user gesture for clipboard)
6. API
7. Options
8. Quick Start
9. Common Usage Patterns
10. Behavior Contract
11. Error Handling
12. Accessibility Notes
13. Notes

## Frontmatter Rules

Every pattern doc should include:

- `slug`
- `title`
- `description`
- `terms`
- `pubDate`
- `modDate`

Guidance:

- `description` should be search-friendly and specific (not just the title).
- `terms` should be practical retrieval keywords (avoid vague terms).
- Update `modDate` whenever content meaningfully changes.

## Snippet Conventions

Use explicit Alpine attribute syntax in docs snippets:

- Prefer `x-on:click` over shorthand `@click`.
- Prefer `x-bind:class` over shorthand `:class`.

For demo buttons and static snippets:

- Add `type="button"` to non-submit action buttons.
- Use `aria-live="polite"` for copy status text.
- Add `aria-label` to icon-only controls.
- Keep visible labels for non-icon buttons.

## Accuracy Contract

Documentation must reflect real behavior from source code.

Before finalizing docs updates:

- Verify options/defaults against the demo registration code.
- Verify method names and return behavior.
- Verify logged errors and edge-case behavior.
- Do not document features that are not implemented.

## Component Baseline

The components and their registration names are:

- `huxScrollSpy` — Scroll Spy + TOC
- `huxCombobox` — Combobox
- `huxCopy` — Copy to Clipboard
- `huxDialog` — Dialog
- `huxCommandPalette` — Command Palette (composes `huxDialog` and `huxCombobox`)
- `huxDropdown` — Dropdown
- `huxTabs` — Tabs
- `huxResizable` — Resizable Container

Each component has a corresponding `data-hux-copy` registration script in `src/pages/index.astro`
named `{camelCaseName}RegistrationCode` (e.g. `scrollSpyRegistrationCode`, `copyRegistrationCode`).
When documenting options and behavior, always verify against that registration script — it is the
source of truth.

## Writing Style

- Use concise, technical prose.
- Prefer short paragraphs and direct bullets.
- Avoid marketing-heavy language.
- Keep headings action-oriented and predictable.

## Quality Checklist

Before finishing, confirm:

- Demo appears at the top.
- API and options match implementation.
- Accessibility notes are present and reflected in snippets.
- Error handling section exists for components with runtime failures.
- `modDate` updated.
- MDX has no diagnostics.
