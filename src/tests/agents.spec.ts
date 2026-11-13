import { readFileSync, readdirSync } from 'node:fs'

import { expect, test } from '@playwright/test'

const PATTERN_DIRECTORY = 'src/content/patterns'
const REGISTRATION_DIRECTORY = 'src/components/patterns'

const patternSlugs = readdirSync(PATTERN_DIRECTORY)
  .filter((fileName) => fileName.endsWith('.mdx'))
  .map((fileName) => readFileSync(`${PATTERN_DIRECTORY}/${fileName}`, 'utf8'))
  .map((source) => source.match(/^slug: (.+)$/m)?.[1]?.trim())
  .filter((slug): slug is string => Boolean(slug))

function registrationSource(name: string): string {
  return `${readFileSync(`${REGISTRATION_DIRECTORY}/${name}.js`, 'utf8').trim()}\n`
}

test.describe('Markdown for agents', () => {
  test('serves the home page as Markdown', async ({ request }) => {
    const response = await request.get('/index.md')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/markdown')

    const body = await response.text()

    expect(body.startsWith('---\n')).toBe(true)
    expect(body).toContain('# Free Alpine.js UI Patterns for Developers')

    for (const slug of patternSlugs) {
      expect(body).toContain(`https://js.hyperui.dev/patterns/${slug})`)
    }
  })

  for (const slug of patternSlugs) {
    test(`serves /patterns/${slug}.md without MDX leftovers`, async ({ request }) => {
      const response = await request.get(`/patterns/${slug}.md`)

      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('text/markdown')

      const body = await response.text()

      expect(response.headers()['x-robots-tag']).toBe('noindex')
      expect(body).toContain(`url: "https://js.hyperui.dev/patterns/${slug}"`)
      expect(body).toContain('## Setup')
      expect(body).toContain('## Behavior Contract')
      expect(body).toContain('## Registration Source')
      expect(body).toContain("document.addEventListener('alpine:init'")
      expect(body).not.toContain('{frontmatter.')
      expect(body).not.toMatch(/^import /m)
      expect(body).not.toMatch(/<[A-Z]\w*[^>]*\/>/)
      expect(body).not.toMatch(/^<div class="prose/m)
    })
  }

  test('links every HTML page to its Markdown version', async ({ page }) => {
    await page.goto('/patterns/dialog')

    await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
      'href',
      '/patterns/dialog.md',
    )

    await page.goto('/')

    await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
      'href',
      '/index.md',
    )
  })

  test('serves llms.txt with a link to every pattern', async ({ request }) => {
    const response = await request.get('/llms.txt')

    expect(response.status()).toBe(200)

    const body = await response.text()

    expect(body.startsWith('# HyperUX\n\n> ')).toBe(true)

    for (const slug of patternSlugs) {
      expect(body).toContain(`https://js.hyperui.dev/patterns/${slug}.md`)
    }
  })

  test('serves llms-full.txt with every pattern', async ({ request }) => {
    const body = await (await request.get('/llms-full.txt')).text()

    for (const slug of patternSlugs) {
      expect(body).toContain(`url: "https://js.hyperui.dev/patterns/${slug}"`)
    }
  })
})

test.describe('Registry', () => {
  test('lists every pattern in registry.json', async ({ request }) => {
    const response = await request.get('/r/registry.json')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/json')

    const registry = await response.json()

    expect(registry.$schema).toBe('https://ui.shadcn.com/schema/registry.json')
    expect(registry.name).toBe('hyperux')
    expect(registry.items.map((item: { name: string }) => item.name).sort()).toEqual(
      [...patternSlugs].sort(),
    )
  })

  for (const slug of patternSlugs) {
    test(`serves /r/${slug}.json with the shipped registration source`, async ({ request }) => {
      const response = await request.get(`/r/${slug}.json`)

      expect(response.status()).toBe(200)

      const item = await response.json()

      expect(response.headers()['access-control-allow-origin']).toBe('*')
      expect(item.$schema).toBe('https://ui.shadcn.com/schema/registry-item.json')
      expect(item.name).toBe(slug)
      expect(item.type).toBe('registry:item')
      expect(item.docs).toContain('alpine:init')

      // Universal items: every file has an explicit target and inline content.
      for (const file of item.files) {
        expect(file.target).toBe(file.path)
        expect(file.content.length).toBeGreaterThan(0)
      }

      for (const name of item.meta.registrations) {
        const file = item.files.find(({ path }: { path: string }) => path === `hyperux/${name}.js`)

        expect(file?.content).toBe(registrationSource(name))
      }
    })
  }

  test('bundles composed registrations into the command palette item', async ({ request }) => {
    const item = await (await request.get('/r/command-palette.json')).json()

    expect(item.meta.registrations).toEqual(['huxCommandPalette', 'huxDialog', 'huxCombobox'])
    expect(item.meta.requires).toContain('@alpinejs/focus')
  })

  test('points setup docs at the bundled focus plugin version', async ({ request }) => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
    const bundledVersion = packageJson.dependencies['@alpinejs/focus'].replace(/^[\^~]/, '')
    const item = await (await request.get('/r/dialog.json')).json()

    expect(item.docs).toContain(`@alpinejs/focus@${bundledVersion}/dist/cdn.min.js`)
  })
})

test.describe('Agent skill', () => {
  test('lists every pattern and registration', () => {
    const skill = readFileSync('skills/hyperux/SKILL.md', 'utf8')

    expect(skill).toMatch(/^---\nname: hyperux\ndescription: /)

    for (const slug of patternSlugs) {
      expect(skill).toContain(`| \`${slug}\``)
    }

    for (const fileName of readdirSync(REGISTRATION_DIRECTORY)) {
      expect(skill).toContain(`\`${fileName.replace(/\.js$/, '')}\``)
    }
  })
})

test.describe('Use with AI panel', () => {
  test('copies the Markdown docs and the install command', async ({ page }) => {
    await page.goto('/patterns/tabs')
    await page.waitForFunction(() => 'Alpine' in globalThis)

    const panel = page.getByRole('region', { name: 'Use with AI' })

    await panel.getByRole('button', { name: 'Copy for AI' }).click()

    const copiedMarkdown = await page.evaluate(() => navigator.clipboard.readText())

    expect(copiedMarkdown).toContain('# Alpine.js Tabs Pattern')
    expect(copiedMarkdown).toContain("Alpine.data('huxTabPanel'")

    await panel.getByRole('button', { name: 'Copy command' }).click()

    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'npx shadcn@latest add https://js.hyperui.dev/r/tabs.json',
    )
  })
})
