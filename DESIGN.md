# HyperUX design

The visual identity of js.hyperui.dev. Read this before changing the header, footer, home page, or
any chrome around the pattern demos. It supersedes the orange house style that was removed in July
(`d5bdf13`), and keeps that document's best idea: one color is reserved for state that is true
right now.

## The idea

HyperUX ships behavior: keyboard handling, focus, ARIA state, events. You bring the markup and the
styles. A site that sells that should make behavior visible, so the identity is a keyboard.

- Physical keycaps that press and light up as you type.
- A trace of what a pattern just did, timestamped, with focus moves and events as separate kinds.
- Cobalt and amber used only for things that are happening or just happened.

The home page proves the claim instead of describing it. The stage is a real `huxDialog` and
nothing on it is faked.

## One bold place

Spend boldness in one place: the home page stage (`src/components/HeroBench.astro`). Everything
else is quiet and disciplined. Do not spread the cobalt slab, the keycaps or the display type across
the pattern pages. If a new element feels like it needs to stand out, make it quieter, not louder.

## Tokens

Defined in `src/styles/global.css` under `@theme`.

| Token    | Hex       | Use                                                                         |
| -------- | --------- | --------------------------------------------------------------------------- |
| `ink`    | `#161a24` | Text, headings, rules, primary buttons                                      |
| `paper`  | `#eef0f4` | Page background                                                             |
| `key`    | `#fbfbf8` | Keycaps and raised surfaces on the stage and header                         |
| `signal` | `#2f45ff` | The brand and the stage. Focus entries in the trace. Hover on primary links |
| `event`  | `#ffc233` | Fired events and lit keys, and nothing else                                 |

Body copy on paper is `gray-800` (12.9:1) or `gray-700` (9.0:1) for secondary text. Do not add
colors. A new need is solved with weight, a border, or `ink` at an opacity.

Contrast, measured:

| Pair                          | Ratio  |
| ----------------------------- | ------ |
| ink on paper                  | 15.2:1 |
| ink on key                    | 16.8:1 |
| ink on event                  | 10.8:1 |
| white on signal               | 6.1:1  |
| paper on signal               | 5.4:1  |
| signal on paper               | 5.4:1  |
| ink focus ring against signal | 2.8:1  |

The last row fails 3:1, which is why the stage uses a white focus ring (see Focus).

### The rule for `signal` and `event`

They mark state that is true right now or just happened: a key held down, a focus move, a fired
event, a new line in the trace. They never mark permanence ("Experimental"), category, or emphasis.
`signal` is also the brand fill of the stage. `event` (amber) is stricter: it appears only on lit
keys, `event` chips and the flash on a new trace line.

## Type

- **Display:** Bricolage Grotesque Variable, self-hosted through `@fontsource-variable/bricolage-grotesque`
  (`wdth.css`, imported in `BaseLayout.astro`). Used for the brand, the home headline, section
  headings and pattern titles. The width axis does the work:
  - `font-stretch: 75%` with weight 800 for the home headline
  - `80%` for the brand and "Patterns"
  - `85%` for subheads, titles and the stage copy
- **Body and UI:** Google Sans Flex, loaded by Astro's font API in `astro.config.ts` (`font-sans`).
- **Mono:** the system monospace stack, only for real identifiers: event names, element
  descriptions in the trace, code blocks. Never for decorative small labels.
- Docs prose headings (`.prose h1, h2, h3`) use the display face at normal width, so pattern pages
  belong to the same identity without shouting.
- Line lengths stay under 80 characters. Sentence case everywhere. No all-caps labels.

The headline is set with `clamp(3.25rem, 8.2vw, 7.25rem)` and `leading-[0.88]`. It is deliberately
tight; do not loosen it.

## Layout

Left-aligned and editorial. No centered hero, no card grid.

1. **Headline row.** Very large condensed headline on the left, a short lead and two buttons on the
   right, bottom-aligned.
2. **Stage.** A full-bleed `signal` band (`HeroBench.astro`). Left: stage copy, the trigger button
   and the keycaps. Right: the trace on a `paper` panel.
3. **Snippet.** The dialog markup with the classes left out, beside a short explanation. The snippet
   in `src/pages/index.astro` is a hand-kept copy of the stage's markup: change both together.
4. **Patterns.** A two-column ruled index. Titles in the display face, one-line descriptions, a
   `signal` bar on the left edge on hover and on keyboard focus. Rows have 20px of horizontal padding so
   the text clears the bar. The whole row is the link.

On phones everything stacks, the headline scales down, keycaps wrap, and the trace follows the
stage copy. The stage has a short line for people without a keyboard.

## Components

### Keycap

An `ink`-on-`key` rounded rectangle with a hard 4px shadow (`shadow-ink/40`) so it reads as a
physical key. It presses down (`translate-y-1`, shadow removed) and turns `event` amber while its
key is held, with `data-lit="true"` for tests. The row is `aria-hidden`: it is a visualization, and
the trace carries the same information as text. Keys: Esc, Shift Tab, Tab, Enter, Space and the
four arrows. The header's search button reuses the keycap look (3px shadow) as a small echo of the
motif; it is a real, labelled button.

### Trace

An ordered list named "Event trace", newest first, capped at seven lines. Each line has a time since
the first entry (`+0.48s`, tabular numbers), a kind chip and the text:

| Kind    | Chip                      | Text example                     |
| ------- | ------------------------- | -------------------------------- |
| `focus` | `signal` fill, white text | `<button> Cancel`                |
| `event` | `event` fill, ink text    | `hux-dialog:confirm-delete:open` |
| `key`   | ink outline, ink text     | `Shift+Tab`                      |

A new line flashes `event` amber once (`.hux-flash`, 700ms, in `global.css`). The list is not a live
region: it updates on every key press, and announcing that would be noise. Empty state: "Nothing
yet. Press Tab, or open the dialog."

On desktop the panel sits above the dialog backdrop, so the trace stays at full contrast while the
dialog is open; the dialog is anchored to the left and does not overlap it.

The trace is observation only. It listens to the events the registration dispatches (on `window`,
because the panel is teleported to `<body>`), to `focusin`, and to key presses. It never reads or
changes the dialog's state, so it shows what any consumer's own code could see.

### Buttons and links

- Primary: `ink` fill, white text, `signal` on hover. Minimum height 44px.
- Secondary: 2px `ink` border, transparent, `key` on hover.
- On the stage the primary trigger is a keycap.
- Links in prose keep underlines. Link colors on `paper` must stay at or above 4.5:1.

### Header and footer

`paper` background with a hairline (`ink/15`) border. The brand is the display face at 80% width.
"Experimental" is a plain outlined pill in sentence case. At phone width the search and GitHub
buttons become icon-only and the header stays on one row.

### Pattern pages

Documentation pages follow the home page's identity, without its one bold moment:

- Left-aligned. The page opens on the title (display face, 80% width, weight 800), then a one-paragraph
  intro, then the live demo, then the docs. A 65ch column sits on the left edge; code blocks and the
  demo may run wider.
- Headings use the display face. H2s have a 2px `ink` rule under them. Links are `ink`, underlined,
  and turn `signal` on hover. Inline code sits on `key` with an `ink/15` border.
- Demo cards stay neutral on purpose: white, a hairline `ink/15` border, rounded-xl, a plain "Demo"
  label on `key`. The copied markup inside them is gray and white and must not inherit site
  personality, and the cobalt slab, keycaps and display type do not appear in them. The card's own
  footer (copy button, issue link) uses the site's secondary button and link styles.

All of it lives in `src/styles/global.css` (`.prose`, `.prose-breakout`) and the demo card wrapper
at the top and bottom of each file in `src/components/demos/`.

## Focus

One rule in `src/styles/global.css`: a 3px outline with a 2px offset, colored by `--focus-ring`,
which defaults to `ink`. The stage sets `--focus-ring: white`, because ink against `signal` is only
2.8:1. Never add focus-ring utilities to demo markup (see `CLAUDE.md`); copied snippets fall back to
the browser default until the consumer adds their own.

## Motion

Motion answers an action or marks a change, and nothing moves on its own.

- Key presses: translate and shadow, 100ms.
- Keycap-style buttons (header search, stage trigger): a 1px nudge on hover, a full press on active.
- New trace line: one amber flash.
- Dialog: opacity fade, 200ms.

The global `prefers-reduced-motion` rule in `global.css` collapses all of it. There are no
page-load sequences, no scroll reveals, no hover transitions on every card.

## Voice

Plain verbs, active voice, sentence case. Say what a thing does: "Press Tab, open the dialog, press
Esc." Name things the way developers name them (`isOpen`, `hux-dialog:confirm-delete:close`).
Failure and empty states say what happened and what to do.

## What to avoid

These are the defaults this design was built to avoid. Using one needs a reason specific to this site.

- Cream backgrounds with a serif display and a terracotta accent.
- Near-black backgrounds with an acid-green or vermilion accent.
- Tracked-out all-caps eyebrow labels and small mono data labels.
- Grids of identical rounded cards with the same soft shadow.
- Gradient washes, numbered markers for content that is not a sequence, and arrows on link text.
- Accenting a single word in a headline.

## Accessibility floor

axe at zero (WCAG 2.2 AA) on every page at 390px and 1280px, no horizontal scroll at 320px,
visible keyboard focus on every surface, reduced motion respected, 44px targets on primary
controls. Run `/accessibility-review` after any visual change and note the findings in the pull
request; `pnpm test:a11y` guards the rest.

## Status

Built and verified:

- Tokens, display font, focus rule, header, footer, home page and the stage.
- Full Playwright suite (107 tests) and axe at zero on every page at 390px and 1280px; no horizontal
  scroll at 320px.
- Tests in `src/tests/home.spec.ts` for the live trace, the keycaps, the first view at 1440x900, the
  open dialog leaving the trace readable, the white focus ring on the stage, and reduced motion.
- Reviewed in a real browser at 1440x900 and 390x844 (initial, dialog open, after Escape) and on the
  tabs, dialog and dropdown pattern pages. Demo cards are unchanged.

Fixed in this pass:

- The resizable demo's preview iframe was a tab stop with no focus indicator. The preview page now
  draws the ink ring inside the frame, and a test tabs through every stop on every page.
- Keycaps never lit: the `data-lit` binding referenced the Astro loop variable `key` inside an Alpine
  expression. The id is now interpolated at build time.
- On desktop the dialog backdrop dimmed the trace to low contrast. The trace panel now sits above the
  backdrop at `lg` (`lg:relative lg:z-[60]`); the dialog is anchored left, so they never overlap.

Known limits:

- At 390px the trace follows the stage copy and keycaps, so it is below the first view. The keycaps
  and the trigger are in the first view.
- The sandbox cannot load Google Sans Flex, so body text was reviewed in the fallback sans. Check
  line breaks of body text on a machine with network access.
