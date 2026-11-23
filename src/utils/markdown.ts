import {
  SITE_DESCRIPTION,
  SITE_URL,
  getPatterns,
  patternUrl,
  resolveRegistrations,
  type Pattern,
} from './patterns'

const SITE_TITLE = 'HyperUX'

const HOME_TITLE = 'Free Alpine.js UI Patterns for Developers'

const ABOUT =
  'HyperUX is a collection of free, open source, behavior-first Alpine.js patterns. Each pattern is an `Alpine.data()` registration that owns state, keyboard handling, focus management, ARIA wiring and events. You bring the markup and styles; HyperUX does not ship any CSS.'

type MarkdownPage = {
  /** Page path without a leading slash or extension, for example `patterns/dialog`. */
  path: string
  markdown: string
}

function renderFrontmatter(fields: Record<string, string>): string {
  const lines = Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`)

  return ['---', ...lines, '---'].join('\n')
}

function renderDocument(
  meta: { title: string; description: string; path: string },
  body: string[],
): string {
  return (
    [
      renderFrontmatter({
        title: meta.title,
        description: meta.description,
        url: new URL(meta.path, SITE_URL).toString(),
      }),
      `# ${meta.title}`,
      meta.description,
      ...body,
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim() + '\n'
  )
}

/** A fence one backtick longer than any run inside the code, so the code cannot close it. */
function renderCodeFence(code: string, language: string): string {
  const longestRun = Math.max(2, ...(code.match(/`+/g) ?? []).map((run) => run.length))
  const fence = '`'.repeat(longestRun + 1)

  return `${fence}${language}\n${code}\n${fence}`
}

/**
 * Turn MDX prose into plain Markdown: drop ESM lines, the layout `<div>`
 * wrapper, JSX components (demos, `<LastUpdated />`), MDX comments and the
 * page's own H1 (the Markdown document adds its own title).
 */
function cleanMdxProse(prose: string, pattern: Pattern): string {
  return prose
    .replace(/\{frontmatter\.(\w+)\}/g, (_match, key: string) => {
      const value = (pattern.data as Record<string, unknown>)[key]

      return typeof value === 'string' ? value : ''
    })
    .replace(/^(?:import|export)\s.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^<div\b[^>]*>\s*$/gm, '')
    .replace(/^<\/div>\s*$/gm, '')
    .replace(/<[A-Z][\w.]*\b[^>]*\/>/g, '')
    .replace(/^# .*$/gm, '')
}

/** Clean the prose between code fences and leave fenced code untouched. */
function cleanMdxBody(pattern: Pattern): string {
  const segments: { isFenced: boolean; lines: string[] }[] = []
  let isInsideFence = false

  for (const line of (pattern.body ?? '').split('\n')) {
    const isFenceLine = /^\s*(```|~~~)/.test(line)
    const currentSegment = segments.at(-1)

    if (isFenceLine && !isInsideFence) {
      isInsideFence = true
      segments.push({ isFenced: true, lines: [line] })
    } else if (isInsideFence && currentSegment) {
      currentSegment.lines.push(line)
      isInsideFence = !isFenceLine
    } else if (currentSegment && !currentSegment.isFenced) {
      currentSegment.lines.push(line)
    } else {
      segments.push({ isFenced: false, lines: [line] })
    }
  }

  return segments
    .map(({ isFenced, lines }) =>
      isFenced ? lines.join('\n') : cleanMdxProse(lines.join('\n'), pattern),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderPatternMarkdown(pattern: Pattern): string {
  const { slug, title, description, terms, modDate } = pattern.data
  const registrations = resolveRegistrations(pattern)

  const registrationNames = registrations
    .map(({ registrationName }) => `\`${registrationName}\``)
    .join(', ')

  const meta = [
    `- Registrations: ${registrationNames}`,
    `- Keywords: ${terms.join(', ')}`,
    `- Updated: ${modDate.toISOString().slice(0, 10)}`,
  ].join('\n')

  const setup = [
    `Registrations needed: ${registrationNames}. Each one listens for \`alpine:init\`, so it must load before Alpine starts.`,
    [
      '- Script tags: add each registration as a plain `<script>` placed before the Alpine script.',
      '- Bundlers: set `window.Alpine = Alpine`, import the registration files, then call `Alpine.start()`. The registrations reference the global `Alpine`.',
      '- No CSS is included. Add `[x-cloak] { display: none !important; }` and your own `:focus-visible` style if your project has none.',
    ].join('\n'),
  ].join('\n\n')

  const registrationSources = registrations.map(({ registrationName, registrationSource }) =>
    [`### \`${registrationName}\``, renderCodeFence(registrationSource, 'js')].join('\n\n'),
  )

  return renderDocument(
    { title: `Alpine.js ${title} Pattern`, description, path: `/patterns/${slug}` },
    [
      meta,
      '## Setup',
      setup,
      cleanMdxBody(pattern),
      '## Registration Source',
      'Copy these files as they are. They are the source of truth for every option, default and event above.',
      ...registrationSources,
    ],
  )
}

function renderPatternIndexLine(pattern: Pattern, suffix = ''): string {
  return `- [${pattern.data.title}](${patternUrl(pattern.data.slug)}${suffix}): ${pattern.data.description}`
}

/** Every page with a Markdown version, the home page first, then patterns by title. */
export async function getMarkdownPages(): Promise<MarkdownPage[]> {
  const patterns = await getPatterns()

  const homeMarkdown = renderDocument(
    { title: HOME_TITLE, description: SITE_DESCRIPTION, path: '/' },
    [
      ABOUT,
      '## Patterns',
      patterns.map((pattern) => renderPatternIndexLine(pattern, '.md')).join('\n'),
      '## For agents',
      [
        `- ${SITE_URL}/llms.txt: index of every Markdown page`,
        `- ${SITE_URL}/llms-full.txt: every pattern, with registration source, in one file`,
      ].join('\n'),
    ],
  )

  return [
    { path: 'index', markdown: homeMarkdown },
    ...patterns.map((pattern) => ({
      path: `patterns/${pattern.data.slug}`,
      markdown: renderPatternMarkdown(pattern),
    })),
  ]
}

/** https://llmstxt.org index: a short summary plus links to every `.md` page. */
export async function renderLlmsTxt(): Promise<string> {
  const patterns = await getPatterns()

  return (
    [
      `# ${SITE_TITLE}`,
      `> ${SITE_DESCRIPTION}`,
      [
        ABOUT,
        `Every page on ${SITE_URL} has a Markdown version at the same path with \`.md\` appended (the home page is ${SITE_URL}/index.md). Pattern pages include the API, options, behavior contract, accessibility notes and the full registration source. ${SITE_URL}/llms-full.txt has all of them in one file.`,
        'Rules when adapting a pattern: keep the registration code unchanged, write your own markup around its public API, keep the ARIA attributes and `type="button"` shown in the examples, and use explicit Alpine syntax (`x-on:click`, `x-bind:class`).',
      ].join('\n\n'),
      '## Patterns',
      patterns.map((pattern) => renderPatternIndexLine(pattern, '.md')).join('\n'),
      '## Optional',
      `- [Home](${SITE_URL}/index.md): ${SITE_DESCRIPTION}`,
    ].join('\n\n') + '\n'
  )
}

/** Every pattern's Markdown page in one file, separated by horizontal rules. */
export async function renderLlmsFullTxt(): Promise<string> {
  const patterns = await getPatterns()

  const intro = [
    `# ${SITE_TITLE}`,
    `> ${SITE_DESCRIPTION}`,
    `Every pattern from ${SITE_URL} in one file. See ${SITE_URL}/llms.txt for an index.`,
  ].join('\n\n')

  return (
    [intro, ...patterns.map((pattern) => renderPatternMarkdown(pattern).trim())].join(
      '\n\n---\n\n',
    ) + '\n'
  )
}
