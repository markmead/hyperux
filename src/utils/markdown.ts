import {
  SITE_DESCRIPTION,
  SITE_URL,
  getPatterns,
  installCommand,
  patternUrl,
  pluginCdnUrl,
  registryItemUrl,
  resolveRegistrations,
  resolveRequires,
  type Pattern,
  type Registration,
} from './patterns'

const SITE_TITLE = 'HyperUX'

const HOME_TITLE = 'Free Alpine.js UI Patterns for Developers'

const ABOUT =
  'HyperUX is a collection of free, open source, behavior-first Alpine.js patterns. Each pattern is a single `Alpine.data()` registration that owns state, keyboard handling, focus management, ARIA wiring and events. You bring the markup and styles; HyperUX does not ship any CSS.'

function frontmatter(fields: Record<string, string>): string {
  const lines = Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`)

  return ['---', ...lines, '---'].join('\n')
}

function document(
  meta: { title: string; description: string; path: string; extra?: Record<string, string> },
  body: string[],
): string {
  return (
    [
      frontmatter({
        title: meta.title,
        description: meta.description,
        url: new URL(meta.path, SITE_URL).toString(),
        ...meta.extra,
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

function codeFence(code: string, language = 'html'): string {
  const longestRun = Math.max(2, ...(code.match(/`+/g) ?? []).map((run) => run.length))
  const fence = '`'.repeat(longestRun + 1)

  return `${fence}${language}\n${code}\n${fence}`
}

/**
 * How to load registrations so they run before Alpine starts. Shared by the
 * Markdown pages, the registry `docs` and "Copy for AI".
 */
export function renderSetupMarkdown(registrations: Registration[], plugins: string[]): string {
  const names = registrations.map(({ name }) => `\`${name}\``).join(', ')

  const pluginLines = plugins.map((plugin) => {
    const cdn = pluginCdnUrl(plugin)

    return `- Requires the Alpine plugin \`${plugin}\`${cdn ? ` (CDN: ${cdn})` : ''}. Load it before Alpine.`
  })

  return [
    `Registrations needed: ${names}. Each one listens for \`alpine:init\`, so it must load before Alpine starts.`,
    [
      '- Script tags: add each registration as a plain `<script>` (or `<script defer>`) placed before the deferred Alpine CDN script.',
      '- Bundlers: set `window.Alpine = Alpine`, import the registration files, then call `Alpine.start()`. The registrations reference the global `Alpine`.',
      ...pluginLines,
      '- No CSS is included. Add `[x-cloak] { display: none !important; }` and a global `:focus-visible` style if your project has none.',
    ].join('\n'),
  ].join('\n\n')
}

/** `{frontmatter.title}` and friends, inside MDX prose. */
function replaceFrontmatterExpressions(prose: string, pattern: Pattern): string {
  return prose.replace(/\{frontmatter\.(\w+)\}/g, (_match, key: string) => {
    const value = (pattern.data as Record<string, unknown>)[key]

    return typeof value === 'string' ? value : ''
  })
}

/**
 * Turn MDX prose into plain Markdown: drop ESM lines, the layout `<div>`
 * wrapper, JSX components (demos, `<LastUpdated />`), MDX comments and the
 * page's own H1 (the Markdown document adds its own title).
 */
function cleanMdxProse(prose: string, pattern: Pattern): string {
  return replaceFrontmatterExpressions(prose, pattern)
    .replace(/^(?:import|export)\s.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^<div\b[^>]*>\s*$/gm, '')
    .replace(/^<\/div>\s*$/gm, '')
    .replace(/<[A-Z][\w.]*\b[^>]*\/>/g, '')
    .replace(/^# .*$/gm, '')
}

/** Clean prose between code fences and leave fenced code untouched. */
function cleanMdxBody(pattern: Pattern): string {
  const lines = (pattern.body ?? '').split('\n')
  const segments: { fenced: boolean; text: string[] }[] = []
  let inFence = false

  for (const line of lines) {
    const isFenceLine = /^\s*(```|~~~)/.test(line)

    if (isFenceLine && !inFence) {
      inFence = true
      segments.push({ fenced: true, text: [line] })
      continue
    }

    const current = segments.at(-1)

    if (inFence && current) {
      current.text.push(line)

      if (isFenceLine) {
        inFence = false
      }

      continue
    }

    if (current && !current.fenced) {
      current.text.push(line)
    } else {
      segments.push({ fenced: false, text: [line] })
    }
  }

  return segments
    .map(({ fenced, text }) => (fenced ? text.join('\n') : cleanMdxProse(text.join('\n'), pattern)))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function patternTitle(pattern: Pattern): string {
  return `Alpine.js ${pattern.data.title} Pattern`
}

export function renderPatternMarkdown(pattern: Pattern, patterns: Pattern[]): string {
  const { slug, description, terms, modDate, composes } = pattern.data
  const registrations = resolveRegistrations(pattern, patterns)
  const plugins = resolveRequires(pattern, patterns)

  const meta = [
    `- Registrations: ${registrations.map(({ name }) => `\`${name}\``).join(', ')}`,
    composes.length
      ? `- Composes: ${composes.map((name) => `[${name}](${patternUrl(name)}.md)`).join(', ')}`
      : '',
    `- Keywords: ${terms.join(', ')}`,
    `- Updated: ${isoDate(modDate)}`,
    `- Registry item: ${registryItemUrl(slug)}`,
    `- Install: \`${installCommand(slug)}\``,
  ]
    .filter(Boolean)
    .join('\n')

  const sources = registrations.map(({ name, source }) =>
    [`### \`${name}\``, codeFence(source, 'js')].join('\n\n'),
  )

  return document(
    {
      title: patternTitle(pattern),
      description,
      path: `/patterns/${slug}`,
      extra: { registry: registryItemUrl(slug) },
    },
    [
      meta,
      '## Setup',
      renderSetupMarkdown(registrations, plugins),
      cleanMdxBody(pattern),
      '## Registration Source',
      'Copy these files as they are. They are the source of truth for every option, default and event above.',
      ...sources,
    ],
  )
}

function patternIndexLine(pattern: Pattern, suffix = ''): string {
  return `- [${pattern.data.title}](${patternUrl(pattern.data.slug)}${suffix}): ${pattern.data.description}`
}

function renderHomeMarkdown(patterns: Pattern[]): string {
  return document({ title: HOME_TITLE, description: SITE_DESCRIPTION, path: '/' }, [
    ABOUT,
    '## Patterns',
    patterns.map((pattern) => patternIndexLine(pattern)).join('\n'),
    '## For agents',
    [
      `- ${SITE_URL}/llms.txt: index of every Markdown page`,
      `- ${SITE_URL}/llms-full.txt: every pattern, with registration source, in one file`,
      `- ${SITE_URL}/r/registry.json: shadcn-compatible registry; install one pattern with \`${installCommand('<slug>')}\``,
      '- Agent skill: `npx skills add markmead/hyperux`',
    ].join('\n'),
  ])
}

type MarkdownPage = {
  /** Page path without a leading slash or extension, e.g. `patterns/dialog`. */
  path: string
  markdown: string
}

/** Every page with a Markdown version, home page first, then patterns by title. */
export async function getMarkdownPages(): Promise<MarkdownPage[]> {
  const patterns = await getPatterns()

  return [
    { path: 'index', markdown: renderHomeMarkdown(patterns) },
    ...patterns.map((pattern) => ({
      path: `patterns/${pattern.data.slug}`,
      markdown: renderPatternMarkdown(pattern, patterns),
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
        `Every page on ${SITE_URL} has a Markdown version at the same path with \`.md\` appended (the home page is ${SITE_URL}/index.md). Pattern pages include the API, options, behavior contract, accessibility notes and the full registration source. ${SITE_URL}/llms-full.txt contains all of them in one file.`,
        `To add a pattern to a project, fetch ${registryItemUrl('<slug>')} (shadcn registry item format): it holds the registration files and a markup example. \`${installCommand('<slug>')}\` writes them into a project. ${SITE_URL}/r/registry.json lists every item.`,
        'Rules when adapting a pattern: keep the registration code unchanged, write your own markup around its public API, keep the ARIA attributes and `type="button"` shown in the examples, and use explicit Alpine syntax (`x-on:click`, `x-bind:class`).',
      ].join('\n\n'),
      '## Patterns',
      patterns.map((pattern) => patternIndexLine(pattern, '.md')).join('\n'),
      '## Install',
      [
        `- [Registry index](${SITE_URL}/r/registry.json): shadcn-compatible registry of every pattern`,
        '- [Agent skill](https://github.com/markmead/hyperux/tree/main/skills/hyperux): `npx skills add markmead/hyperux`',
      ].join('\n'),
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
    `Every Markdown page from ${SITE_URL} in one file. See ${SITE_URL}/llms.txt for an index.`,
  ].join('\n\n')

  return (
    [intro, ...patterns.map((pattern) => renderPatternMarkdown(pattern, patterns).trim())].join(
      '\n\n---\n\n',
    ) + '\n'
  )
}
