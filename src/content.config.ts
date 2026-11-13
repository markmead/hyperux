import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const patterns = defineCollection({
  loader: glob({
    base: './src/content/patterns',
    pattern: '**/*.{md,mdx}',
    retainBody: true,
  }),
  schema: () =>
    z.object({
      slug: z.string(),
      title: z.string(),
      description: z.string(),
      terms: z.array(z.string()),
      // Alpine.data() names this pattern registers (its own files in src/components/patterns).
      registrations: z.array(z.string()).min(1),
      // Slugs of other patterns whose registrations this pattern needs.
      composes: z.array(z.string()).default([]),
      // Alpine plugins the documented markup relies on (e.g. `@alpinejs/focus` for `x-trap`).
      requires: z.array(z.string()).default([]),
      pubDate: z.coerce.date(),
      modDate: z.coerce.date(),
    }),
})

export const collections = {
  patterns,
}
