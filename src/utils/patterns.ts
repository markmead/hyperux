import { getCollection, type CollectionEntry } from 'astro:content'

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

const PLUGIN_CDN_URLS: Record<string, string> = {
  '@alpinejs/focus': 'https://cdn.jsdelivr.net/npm/@alpinejs/focus@3.15/dist/cdn.min.js',
}

export function getRegistrationSource(name: string): string {
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
 * Every registration a pattern needs at runtime: its own first, then those of
 * the patterns it composes (recursively), without duplicates.
 */
export function resolveRegistrations(pattern: Pattern, patterns: Pattern[]): Registration[] {
  const names: string[] = []
  const visited = new Set<string>()

  const visit = (current: Pattern) => {
    if (visited.has(current.data.slug)) {
      return
    }

    visited.add(current.data.slug)

    for (const name of current.data.registrations) {
      if (!names.includes(name)) {
        names.push(name)
      }
    }

    for (const slug of current.data.composes) {
      visit(findPattern(patterns, slug))
    }
  }

  visit(pattern)

  return names.map((name) => ({ name, source: getRegistrationSource(name) }))
}

/** Alpine plugins a pattern needs, including those of the patterns it composes. */
export function resolveRequires(pattern: Pattern, patterns: Pattern[]): string[] {
  const plugins = new Set(pattern.data.requires)

  for (const slug of pattern.data.composes) {
    for (const plugin of resolveRequires(findPattern(patterns, slug), patterns)) {
      plugins.add(plugin)
    }
  }

  return [...plugins]
}

/** The first fenced HTML block under `## Quick Start` in a pattern's MDX body. */
export function extractQuickStartHtml(pattern: Pattern): string | null {
  const body = pattern.body ?? ''
  const quickStart = body.split(/^## Quick Start\s*$/m)[1]

  if (!quickStart) {
    return null
  }

  const section = quickStart.split(/^## /m)[0]
  const match = section.match(/```html\n([\s\S]*?)\n```/)

  return match ? match[1].trim() : null
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
