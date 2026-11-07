import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import config from '../.vitepress/config.mts'

const projectRoot = resolve(import.meta.dirname, '..')

function readProjectFile(relativePath: string): string {
  const filePath = resolve(projectRoot, relativePath)
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
}

describe('documentation homepage product entry', () => {
  it('makes product selection the primary homepage action while retaining extension shortcuts', () => {
    const homepage = readProjectFile('index.md')
    const dashboard = readProjectFile('.vitepress/components/HomeDashboard.vue')

    expect(homepage).toContain('<HomeDashboard />')
    expect(dashboard).toMatch(/home-dashboard__action--primary" href="\/start\/">选择产品<\/a>/)
    expect(dashboard).toMatch(/home-dashboard__action--secondary" href="\/download\/">查看下载<\/a>/)
    expect(dashboard).toContain('href="/download/"')
    expect(dashboard).toContain('>安装扩展<')
    expect(dashboard).toContain('href="/guide/quick-start"')
    expect(dashboard).toContain('>快速开始<')
  })

  it('offers each product a dedicated homepage route', () => {
    const dashboard = readProjectFile('.vitepress/components/HomeDashboard.vue')
    const panel = dashboard.split('<nav class="home-dashboard__products"')[1]?.split('</nav>')[0]
    const routes = [...(panel ?? '').matchAll(/<a href="([^"]+)">/g)].map((match) => match[1])

    expect(routes).toEqual(['/guide/', '/desktop/', '/mobile/', '/cloud/', '/javscribe/'])
  })

  it('groups the navigation by task and keeps the brand link pointed home', () => {
    const theme = config.themeConfig

    expect(theme.logoLink).toBe('/')
    expect(theme.nav?.map((item) => item.text)).toEqual([
      '开始使用', '使用指南', '部署与连接', '下载与更新', '开发参考',
    ])
    expect(theme.nav?.[0]).toMatchObject({ link: '/start/' })
    expect(theme.nav?.[1]).toMatchObject({
      items: [
        { link: '/guide/' }, { link: '/desktop/' },
        { link: '/mobile/' }, { link: '/javscribe/' },
      ],
    })
    expect(theme.nav?.[2]).toMatchObject({ items: expect.arrayContaining([expect.objectContaining({ link: '/cloud/' })]) })
    expect(theme.nav?.[3]).toMatchObject({ items: expect.arrayContaining([expect.objectContaining({ link: '/download/' })]) })
    expect(theme.nav?.[4]).toMatchObject({ items: expect.arrayContaining([expect.objectContaining({ link: '/developer/' })]) })
  })

  it('keeps each sidebar target unique within its section', () => {
    const sidebar = config.themeConfig.sidebar
    expect(sidebar).toBeDefined()

    function collectLinks(items: ReadonlyArray<{ link?: string; items?: unknown }>): string[] {
      return items.flatMap(({ link, items: children }) => [
        ...(link ? [link] : []),
        ...(Array.isArray(children) ? collectLinks(children) : []),
      ])
    }

    for (const [section, groups] of Object.entries(sidebar ?? {})) {
      expect(Array.isArray(groups), section).toBe(true)
      const routes = collectLinks(groups as ReadonlyArray<{ link?: string; items?: unknown }>)
      expect(routes.length, section).toBeGreaterThan(0)
      expect(new Set(routes).size, section).toBe(routes.length)
    }
  })

  it('uses dedicated dashboard and path components instead of repeated directory content', () => {
    const homepage = readProjectFile('index.md')

    expect(homepage).toContain('<HomeDashboard />')
    expect(homepage).toContain('<HomePaths />')
    expect(homepage).not.toContain('features:')
    expect(homepage).not.toContain('## 我可以用它做什么？')
    expect(homepage).not.toContain('## 推荐阅读路线')
  })

  it('labels the extension screenshot as a Preview example and lets readers inspect the full image', () => {
    const dashboard = readProjectFile('.vitepress/components/HomeDashboard.vue')

    expect(dashboard).toContain('src="/home-dashboard.png"')
    expect(dashboard).toMatch(/<a href="\/home-dashboard\.png"[^>]*aria-label="[^"]*Preview 示例[^"]*"/)
    expect(dashboard).toMatch(/<figcaption>[^<]*Preview 示例，非当前正式界面[^<]*<\/figcaption>/)
    expect(dashboard).toContain('alt="浏览器扩展 Dashboard Preview 示例界面，展示数据概览"')
  })

  it('keeps the extension image readable across screen widths without cropping it', () => {
    const dashboard = readProjectFile('.vitepress/components/HomeDashboard.vue')
    const extension = dashboard.split('.home-dashboard__extension {')[1]?.split('}')[0]
    const preview = dashboard.split('.home-dashboard__preview {')[1]?.split('}')[0]
    const image = dashboard.split('.home-dashboard__preview img {')[1]?.split('}')[0]
    const mobile = dashboard.split('@media (max-width: 840px)')[1]

    expect(extension).toMatch(/display:\s*grid/)
    expect(extension).toMatch(/grid-template-columns:\s*minmax\(220px,\s*0\.65fr\)\s+minmax\(0,\s*1\.35fr\)/)
    expect(preview).not.toMatch(/flex:\s*0\s+0\s+156px/)
    expect(image).toMatch(/width:\s*100%/)
    expect(image).toMatch(/height:\s*auto/)
    expect(image).not.toMatch(/object-fit:\s*cover/)
    expect(mobile).toMatch(/\.home-dashboard__extension\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
    expect(mobile).not.toMatch(/\.home-dashboard__preview\s*\{[^}]*flex-basis:\s*94px/)
  })

  it('keeps public task-path links in their dedicated component', () => {
    const paths = readProjectFile('.vitepress/components/HomePaths.vue')

    expect(paths).toContain('href="/guide/quick-start"')
    expect(paths).toContain('href="/guide/webdav-sync"')
    expect(paths).toContain('href="/guide/data-management"')
    expect(paths).toContain('href="/download/#cloud-deploy"')
    expect(paths).toContain('https://github.com/JavdBviewed/JavdBviewed/issues')
  })

  it('keeps the footer focused on the product rather than the documentation generator', () => {
    const config = readProjectFile('.vitepress/config.mts')

    expect(config).toContain("message: 'JavdBviewed 文档中心'")
    expect(config).not.toContain("message: '使用 VitePress 构建'")
  })
})
