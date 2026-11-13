import type { APIRoute, GetStaticPaths } from 'astro'

import { getPatterns } from '../../utils/patterns'
import { buildRegistryItem, jsonResponse } from '../../utils/registry'

/** One shadcn registry item per pattern, with file contents: `/r/{slug}.json`. */
export const getStaticPaths = (async () => {
  const patterns = await getPatterns()

  return patterns.map((pattern) => ({
    params: { slug: pattern.data.slug },
    props: { item: buildRegistryItem(pattern, patterns, { withContent: true }) },
  }))
}) satisfies GetStaticPaths

export const GET: APIRoute = ({ props }) => jsonResponse(props.item)
