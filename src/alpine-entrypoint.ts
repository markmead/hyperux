import type { Alpine } from 'alpinejs'

import focus from '@alpinejs/focus'

// Registered through @astrojs/alpinejs (see astro.config.ts) so plugins are
// bundled with Alpine and installed before it starts.
export default (Alpine: Alpine) => {
  Alpine.plugin(focus)
}
