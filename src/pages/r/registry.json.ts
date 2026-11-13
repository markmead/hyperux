import type { APIRoute } from 'astro'

import { buildRegistry, jsonResponse } from '../../utils/registry'

/** Registry index in the shadcn `registry.json` format (items without file contents). */
export const GET: APIRoute = async () => jsonResponse(await buildRegistry())
