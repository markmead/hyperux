import { getCollection, type CollectionEntry } from 'astro:content'

import packageJson from '../../package.json'

export const SITE_URL = 'https://js.hyperui.dev'

export const SITE_DESCRIPTION = 'Behavior-first Alpine.js patterns you can copy, adapt, and ship.'

export type Pattern = CollectionEntry<'patterns'>

export type Registration = {
  /** `Alpine.data()` name, e.g. `huxDialog`. */
  name: string
  /** The registration script, exactly as the site ships it. */
  source: string
}

const registrationSources = import.meta.glob<string>('../components/patterns/*.js', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Pin CDN URLs to the exact versions the site bundles and tests.
const pluginVersion = (plugin: keyof typeof packageJson.dependencies) =>
  packageJson.dependencies[plugin].replace(/^[\^~]/, '')

const PLUGIN_CDN_URLS: Record<string, string> = {
  '@alpinejs/focus': `https://cdn.jsdelivr.net/npm/@alpinejs/focus@${pluginVersion('@alpinejs/focus')}/dist/cdn.min.js`,
}

function getRegistrationSource(name: string): string {
  const source = registrationSources[`../components/patterns/${name}.js`]

  if (source === undefined) {
    throw new Error(`[hyperux] No registration file for "${name}" in src/components/patterns`)
  }

  return source.trim()
}

export function pluginCdnUrl(plugin: string): string | undefined {
  return PLUGIN_CDN_URLS[plugin]
}

export async function getPatterns(): Promise<Pattern[]> {
  const patterns = await getCollection('patterns')

  return [...patterns].sort((a, b) => a.data.title.localeCompare(b.data.title))
}

export function findPattern(patterns: Pattern[], slug: string): Pattern {
  const pattern = patterns.find(({ data }) => data.slug === slug)

  if (!pattern) {
    throw new Error(`[hyperux] Unknown pattern slug "${slug}"`)
  }

  return pattern
}

/**
 * The pattern followed by every pattern it composes (recursively, depth
 * first), each once. The visited set also stops cycles in `composes`.
 */
function composedPatterns(pattern: Pattern, patterns: Pattern[]): Pattern[] {
  const ordered: Pattern[] = []

  const visit = (current: Pattern) => {
    if (ordered.includes(current)) {
      return
    }

    ordered.push(current)

    for (const slug of current.data.composes) {
      visit(findPattern(patterns, slug))
    }
  }

  visit(pattern)

  return ordered
}

/** Every registration a pattern needs at runtime, its own first. */
export function resolveRegistrations(pattern: Pattern, patterns: Pattern[]): Registration[] {
  const names = new Set(
    composedPatterns(pattern, patterns).flatMap(({ data }) => data.registrations),
  )

  return [...names].map((name) => ({ name, source: getRegistrationSource(name) }))
}

/** Alpine plugins a pattern needs, including those of the patterns it composes. */
export function resolveRequires(pattern: Pattern, patterns: Pattern[]): string[] {
  return [...new Set(composedPatterns(pattern, patterns).flatMap(({ data }) => data.requires))]
}

/** The first fenced HTML block under `## Quick Start` in a pattern's MDX body. */
export function extractQuickStartHtml(pattern: Pattern): string | null {
  const body = pattern.body ?? ''
  const quickStart = body.split(/^## Quick Start\s*$/m)[1]

  if (!quickStart) {
    return null
  }

  const section = quickStart.split(/^## /m)[0] ?? ''
  const html = section.match(/```html\n([\s\S]*?)\n```/)?.[1]

  return html ? html.trim() : null
}

export function patternUrl(slug: string): string {
  return `${SITE_URL}/patterns/${slug}`
}

export function registryItemUrl(slug: string): string {
  return `${SITE_URL}/r/${slug}.json`
}

export function installCommand(slug: string): string {
  return `npx shadcn@latest add ${registryItemUrl(slug)}`
}
