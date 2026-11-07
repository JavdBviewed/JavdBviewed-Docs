import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function doc(path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

function section(markdown: string, heading: string): string {
  const start = markdown.indexOf(heading)
  expect(start, `${heading} must exist`).toBeGreaterThanOrEqual(0)
  const remaining = markdown.slice(start + heading.length)
  const nextHeading = remaining.search(/^#{1,3} /m)
  return remaining.slice(0, nextHeading === -1 ? undefined : nextHeading)
}

function png(path: string): void {
  const file = resolve(root, path)
  expect(existsSync(file), `${path} must exist`).toBe(true)
  const bytes = readFileSync(file)
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  expect(bytes.readUInt32BE(16)).toBeGreaterThan(0)
  expect(bytes.readUInt32BE(20)).toBeGreaterThan(0)
}

describe('operation guide screenshots', () => {
  it.each([
    ['guide/quick-start.md', '### 2. 打开仪表盘'],
    ['guide/interface.md', '## 仪表盘'],
  ])('shows the Preview dashboard near the dashboard instructions in %s', (path, heading) => {
    const content = section(doc(path), heading)
    expect(content).toContain('![扩展仪表盘')
    expect(content).toContain('](/home-dashboard.png)')
    expect(content).toMatch(/Preview/)
    expect(content).toMatch(/仅作示例/)
    expect(content).toMatch(/顶部导航.*(?:不是|不代表).*正式版本/)
    png('public/home-dashboard.png')
  })

  it('removes the old JavScribe screenshot and all public references to it', () => {
    expect(existsSync(resolve(root, 'javscribe/web-ui.png'))).toBe(false)
    for (const path of ['javscribe/index.md', 'javscribe/workbench.md']) {
      expect(doc(path)).not.toContain('web-ui.png')
    }
  })

  it.each([
    ['## 1. 登记字幕服务', 'service-example.png'],
    ['### 方式三：扫描目录（客户端部署机，批量）', 'scan-example.png'],
    ['## 4. 任务看板', 'tasks-example.png'],
  ])('places a tagged E2E example next to %s', (heading, image) => {
    const content = section(doc('javscribe/workbench.md'), heading)
    const caption = content.split(`](./${image})\n\n`)[1]?.split('\n')[0]
    expect(caption, `${image} needs an adjacent caption`).toBeDefined()
    expect(caption).toContain('测试界面示例')
    expect(caption).toContain('不是发布包实拍')
    expect(caption).toContain('`v0.0.0` 为测试标识')
    expect(caption).toContain(image === 'service-example.png' ? '图里' : '同批截图中')
    png(`javscribe/${image}`)
  })
})
