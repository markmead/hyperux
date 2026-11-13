import { renderSetupMarkdown } from './markdown'
import {
  SITE_DESCRIPTION,
  SITE_URL,
  extractQuickStartHtml,
  getPatterns,
  patternUrl,
  resolveRegistrations,
  resolveRequires,
  type Pattern,
} from './patterns'
import { markdownPathFor } from './markdownPath'

/**
 * HyperUX publishes a static registry in the shadcn registry format
 * (https://ui.shadcn.com/docs/registry). Items are "universal": every file has
 * an explicit target, so `npx shadcn@latest add <item url>` works in any
 * project, with or without a components.json. Agents can also fetch the JSON
 * directly; each file's `content` is the exact registration the site ships.
 */

const REGISTRY_SCHEMA = 'https://ui.shadcn.com/schema/registry.json'
const REGISTRY_ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json'

/** Where files land in a consumer project, relative to its root. */
const INSTALL_DIRECTORY = 'hyperux'

type RegistryFile = {
  path: string
  type: 'registry:file'
  target: string
  content?: string
}

type RegistryItem = {
  $schema?: string
  name: string
  type: 'registry:item'
  title: string
  description: string
  files: RegistryFile[]
  docs?: string
  categories: string[]
  meta: {
    url: string
    markdown: string
    /** Every `Alpine.data()` name the files register, composed patterns included. */
    registrations: string[]
    /** Slugs of the patterns whose registrations are bundled into this item. */
    composes: string[]
    requires: string[]
  }
}

function file(path: string, content?: string): RegistryFile {
  const projectPath = `${INSTALL_DIRECTORY}/${path}`

  return {
    path: projectPath,
    type: 'registry:file',
    target: projectPath,
    ...(content === undefined ? {} : { content: `${content}\n` }),
  }
}

export function buildRegistryItem(
  pattern: Pattern,
  patterns: Pattern[],
  { withContent }: { withContent: boolean },
): RegistryItem {
  const { slug, title, description, terms, composes } = pattern.data
  const example = extractQuickStartHtml(pattern)

  // Items are self-contained: a composed pattern's registrations ship in the
  // same item, so one fetch (or one `shadcn add`) is enough.
  const registrations = resolveRegistrations(pattern, patterns)
  const requires = resolveRequires(pattern, patterns)
  const markdownUrl = `${SITE_URL}${markdownPathFor(`/patterns/${slug}`)}`

  const files = registrations.map(({ name, source }) =>
    file(`${name}.js`, withContent ? source : undefined),
  )

  if (example) {
    files.push(file(`examples/${slug}.html`, withContent ? example : undefined))
  }

  return {
    ...(withContent ? { $schema: REGISTRY_ITEM_SCHEMA } : {}),
    name: slug,
    type: 'registry:item',
    title,
    description,
    files,
    ...(withContent
      ? {
          docs: [
            `HyperUX ${title} added to ./${INSTALL_DIRECTORY}.`,
            renderSetupMarkdown(registrations, requires),
            `Docs: ${patternUrl(slug)} (Markdown: ${markdownUrl})`,
          ].join('\n\n'),
        }
      : {}),
    categories: terms,
    meta: {
      url: patternUrl(slug),
      markdown: markdownUrl,
      registrations: registrations.map(({ name }) => name),
      composes,
      requires,
    },
  }
}

export async function buildRegistry() {
  const patterns = await getPatterns()

  return {
    $schema: REGISTRY_SCHEMA,
    name: 'hyperux',
    homepage: SITE_URL,
    description: SITE_DESCRIPTION,
    items: patterns.map((pattern) => buildRegistryItem(pattern, patterns, { withContent: false })),
  }
}

export function jsonResponse(body: unknown): Response {
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
