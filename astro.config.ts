import { defineConfig, fontProviders } from 'astro/config'

import alpinejs from '@astrojs/alpinejs'
import cloudflare from '@astrojs/cloudflare'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://js.hyperui.dev',

  integrations: [mdx(), sitemap(), alpinejs({ entrypoint: '/src/alpine-entrypoint' })],

  markdown: {
    // The default github-dark comment colour fails WCAG AA contrast.
    shikiConfig: { theme: 'github-dark-high-contrast' },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  fonts: [
    {
      cssVariable: '--font-google-sans-flex',
      name: 'Google Sans Flex',
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700, 800],
    },
  ],

  adapter: cloudflare(),
})
