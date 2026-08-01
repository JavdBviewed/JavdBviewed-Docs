import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = resolve(import.meta.dirname, '..')

function readProjectFile(relativePath: string): string {
  const filePath = resolve(projectRoot, relativePath)
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
}

describe('documentation homepage product entry', () => {
  it('makes extension installation the primary homepage action', () => {
    const homepage = readProjectFile('index.md')
    const dashboard = readProjectFile('.vitepress/components/HomeDashboard.vue')

    expect(homepage).toContain('<HomeDashboard />')
    expect(dashboard).toContain('href="/download/"')
    expect(dashboard).toContain('>安装扩展<')
    expect(dashboard).toContain('href="/guide/quick-start"')
    expect(dashboard).toContain('>快速开始<')
  })

  it('uses dedicated dashboard and path components instead of repeated directory content', () => {
    const homepage = readProjectFile('index.md')

    expect(homepage).toContain('<HomeDashboard />')
    expect(homepage).toContain('<HomePaths />')
    expect(homepage).not.toContain('features:')
    expect(homepage).not.toContain('## 我可以用它做什么？')
    expect(homepage).not.toContain('## 推荐阅读路线')
  })

  it('keeps the dashboard image and public task-path links in their dedicated components', () => {
    const dashboard = readProjectFile('.vitepress/components/HomeDashboard.vue')
    const paths = readProjectFile('.vitepress/components/HomePaths.vue')

    expect(dashboard).toContain('src="/home-dashboard.png"')
    expect(dashboard).toContain('alt="JavdBviewed Dashboard 总览"')
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
