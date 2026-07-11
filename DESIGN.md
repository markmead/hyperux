# HyperUX house style

This is the visual system for js.hyperui.dev — the header, footer, prose,
and every pattern demo. It exists so new demos and pages don't each invent
their own accent color.

## The idea

HyperUX ships behavior, not opinions about paint — you get the interaction
contract (keyboard handling, focus, ARIA state) and bring your own markup
and classes. The site should look like that's true. Everything static reads
as quiet, neutral spec paper. **One accent color is reserved for real-time
state** — it only appears when a pattern is actually doing something (open,
expanded, focused, active). Nothing else gets to use it.

If you're about to reach for a new color because a badge or button feels
like it needs to stand out, that's a sign it should be `wire`, not a new
hue.

## Tokens

| Token         | Hex       | Use                                                              |
| ------------- | --------- | ----------------------------------------------------------------- |
| `ink`         | `#1C1D1F` | Text, headings                                                   |
| `paper`       | `#FAFAFA` | Page background                                                  |
| `panel`       | `#FFFFFF` | Cards, demo surfaces                                             |
| `wire`        | `#D8D8D4` | Hairline borders, dividers, static/neutral badges                |
| `signal`      | `#E8720C` | The only accent — live/open/expanded state, focus rings, links   |
| `signal-soft` | `#FDECD8` | Tint for signal badges, subtle active backgrounds                |

Rules:

- `signal` marks state that is true *right now* — a dialog that's open, a
  dropdown that's expanded, the element that currently has focus. It does
  not mark permanence (a "Beta" tag), category (a link-type pill), or
  emphasis for its own sake.
- Every other color need — badges, dividers, secondary buttons, disabled
  states — is `ink`/`paper`/`panel`/`wire` at some opacity or weight. If two
  of those don't give you enough contrast, that's a sign to use type weight
  or a border, not a new hue.
- Focus rings are `signal`, everywhere, replacing the current mix of
  `blue-500` rings and colored badges. One consistent indicator for
  "the system is telling you where you are," whether that's keyboard focus
  or a component's open state.

## Type

- **Display / body:** Google Sans Flex (already loaded via `astro.config.ts`)
  stays as-is — it's a deliberate, non-default choice with a real weight
  range (400–800). Use 700–800 for headings, 500 for body, 600 for UI
  labels and buttons.
- **Utility / mono:** add a monospace face (JetBrains Mono or IBM Plex Mono)
  for inline code, attribute/state tokens (`aria-expanded`, `role="menu"`),
  and badge labels. Gives typographic contrast against the humanist display
  face and reinforces the spec-sheet feel — this is a docs site for
  developers reading attribute names, not marketing copy.

## Layout & components

- Keep the current prose-based docs layout and `rounded-lg` card corners —
  no reinvention needed, it already works for long-form technical content.
  Zero-radius/broadsheet is not the direction; the demos are living UI, not
  a newspaper.
- Every demo card is a "spec card": `panel` fill, 1px `wire` border, a
  monospace corner tag (uppercase, `ink` text, `wire` border) — this
  replaces the current ad hoc teal/sky/emerald pill classes scattered
  across `SiteHeader.astro` and the demo files.
- Categorical badges that aren't live state (e.g. the dropdown demo's
  Internal/External/Action pills) become neutral `wire`-outlined pills. The
  label text already says what the item is — color was decorative
  redundancy, not information.
- Extract the repeated "Demo" badge markup (currently duplicated in every
  file under `src/components/demos/`) into a shared `DemoFrame.astro`
  wrapper. One place to keep the corner tag and status dot consistent
  instead of N copies drifting apart.

## Signature element: the status dot

Every demo card's corner tag gets a small dot before the label:

- At rest: `wire`-colored, static.
- The instant the pattern's primary state goes live (dialog opens, dropdown
  expands, tab changes, stepper advances): `signal`-colored, with a single
  one-shot pulse — not a looping animation.

This is a literal, low-gimmick visualization of "behavior, not decoration."
Most patterns already expose an `isOpen`-shaped boolean the dot can bind to;
for patterns without one (`huxCopy`, `huxResizable`), bind to the nearest
equivalent transient flag (just copied / actively dragging).

## Motion

Minimal, purposeful, and already mostly right — keep the existing
`x-transition` fades and the `prefers-reduced-motion` override in
`global.css`. The status dot pulse is the one new signature motion; nothing
else needs a page-load sequence or scroll-triggered reveal. This is a docs
site — motion should confirm state changes, not perform.

## Rollout

This is a repaint across `SiteHeader.astro`, `SiteFooter.astro`,
`global.css`/prose styles, and all files in `src/components/demos/`. Land it
in a deliberate pass rather than opportunistically per-PR, so the badge and
focus-ring consolidation happens everywhere at once instead of leaving a mix
of old and new for a while.
