import { getCollection, type CollectionEntry } from 'astro:content'

export const SITE_URL = 'https://js.hyperui.dev'

export const SITE_DESCRIPTION = 'Behavior-first Alpine.js patterns you can copy, adapt, and ship.'

export type Pattern = CollectionEntry<'patterns'>

export type Registration = {
  /** `Alpine.data()` name, for example `huxDialog`. */
  registrationName: string
  /** The registration script, exactly as the site ships it. */
  registrationSource: string
}

const registrationSources = import.meta.glob<string>('../components/patterns/*.js', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export async function getPatterns(): Promise<Pattern[]> {
  const patterns = await getCollection('patterns')

  return [...patterns].sort((a, b) => a.data.title.localeCompare(b.data.title))
}

export function patternUrl(slug: string): string {
  return `${SITE_URL}/patterns/${slug}`
}

/** Every registration a pattern needs at runtime, in the order its frontmatter lists them. */
export function resolveRegistrations(pattern: Pattern): Registration[] {
  return pattern.data.registrations.map((registrationName) => {
    const registrationSource = registrationSources[`../components/patterns/${registrationName}.js`]

    if (registrationSource === undefined) {
      throw new Error(
        `[hyperux] "${pattern.data.slug}" lists registration "${registrationName}" but src/components/patterns/${registrationName}.js does not exist`,
      )
    }

    return { registrationName, registrationSource: registrationSource.trim() }
  })
}
