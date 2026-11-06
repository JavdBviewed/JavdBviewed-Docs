import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkDocLinks } from '../scripts/check-doc-links.mjs'

let distDir: string

function page(relativePath: string, body: string): void {
  const file = join(distDir, relativePath)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `<!doctype html><html><body>${body}</body></html>`, 'utf8')
}

function asset(relativePath: string): void {
  const file = join(distDir, relativePath)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, Buffer.from([0x89, 0x50, 0x4e, 0x47]))
}

describe('built documentation links', () => {
  beforeEach(() => {
    const fixtures = resolve(process.cwd(), '.trellis', 'doc-links-fixtures')
    mkdirSync(fixtures, { recursive: true })
    distDir = mkdtempSync(join(fixtures, 'site-'))
  })

  afterEach(() => {
    rmSync(distDir, { recursive: true, force: true })
  })

  it('accepts clean URLs, directory indexes, and existing image assets', () => {
    page('index.html', '<a href="/guide/">Guide</a><a href="/guide/quick-start">Start</a><img src="/assets/logo.png">')
    page('guide/index.html', '<h1 id="guide">Guide</h1>')
    page('guide/quick-start.html', '<h1 id="install">Start</h1>')
    asset('assets/logo.png')

    expect(checkDocLinks(distDir)).toEqual({ pages: 3, errors: [] })
  })

  it('reports a missing page instead of silently accepting a link', () => {
    page('index.html', '<a href="/missing/">Missing</a>')

    expect(checkDocLinks(distDir)).toEqual({
      pages: 1,
      errors: [expect.objectContaining({ source: expect.stringContaining('index.html'), target: '/missing/', kind: 'page' })],
    })
  })

  it('reports an image whose src is absent from the built assets', () => {
    page('index.html', '<img src="/assets/missing.png" alt="Missing">')

    expect(checkDocLinks(distDir)).toEqual({
      pages: 1,
      errors: [expect.objectContaining({ source: expect.stringContaining('index.html'), target: '/assets/missing.png', kind: 'image' })],
    })
  })

  it('checks fragment targets on the same page', () => {
    page('index.html', '<h1 id="present">Present</h1><a href="#absent">Missing</a>')

    expect(checkDocLinks(distDir)).toEqual({
      pages: 1,
      errors: [expect.objectContaining({ source: expect.stringContaining('index.html'), target: '#absent', kind: 'anchor' })],
    })
  })

  it('decodes encoded fragments before matching destination IDs', () => {
    page('index.html', '<a href="/guide/#%E5%AE%89%E8%A3%85">Install</a>')
    page('guide/index.html', '<h1 id="安装">Install</h1>')

    expect(checkDocLinks(distDir)).toEqual({ pages: 2, errors: [] })
  })

  it('reports an encoded fragment when the decoded ID is absent', () => {
    page('index.html', '<a href="/guide/#%E7%BC%BA%E5%A4%B1">Missing</a>')
    page('guide/index.html', '<h1 id="安装">Install</h1>')

    expect(checkDocLinks(distDir)).toEqual({
      pages: 2,
      errors: [expect.objectContaining({ source: expect.stringContaining('index.html'), target: '/guide/#%E7%BC%BA%E5%A4%B1', kind: 'anchor' })],
    })
  })

  it('skips external, protocol-relative, mail, and telephone targets', () => {
    page('index.html', '<a href="https://example.org/">External</a><a href="//cdn.example.org/file">CDN</a><a href="mailto:docs@example.org">Mail</a><a href="tel:+10000000000">Phone</a>')

    expect(checkDocLinks(distDir)).toEqual({ pages: 1, errors: [] })
  })

  it('resolves relative paths and same-page hashes from their source page', () => {
    page('guide/intro.html', '<h1 id="intro">Intro</h1><a href="#intro">Here</a><a href="../download/#cloud-deploy">Cloud</a><img src="../assets/logo.png">')
    page('download/index.html', '<h1 id="cloud-deploy">Cloud</h1>')
    asset('assets/logo.png')

    expect(checkDocLinks(distDir)).toEqual({ pages: 2, errors: [] })
  })
})
