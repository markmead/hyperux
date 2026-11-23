import { defineConfig, fontProviders } from 'astro/config'

import alpinejs from '@astrojs/alpinejs'
import cloudflare from '@astrojs/cloudflare'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://js.hyperui.dev',

  integrations: [mdx(), sitemap(), alpinejs()],

  markdown: {
    shikiConfig: {
      // The default github-dark comment colour (#6a737d on #24292e) is 3.04:1.
      theme: 'github-dark-high-contrast',
      transformers: [
        {
          // Scrollable code blocks must be reachable by keyboard.
          pre(node) {
            node.properties.tabindex = '0'
          },
        },
      ],
    },
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
