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

function png(path: string, minWidth = 1, minHeight = 1): void {
  const file = resolve(root, path)
  expect(existsSync(file), `${path} must exist`).toBe(true)
  const bytes = readFileSync(file)
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  expect(bytes.readUInt32BE(16)).toBeGreaterThanOrEqual(minWidth)
  expect(bytes.readUInt32BE(20)).toBeGreaterThanOrEqual(minHeight)
}

describe('operation guide screenshots', () => {
  it.each([
    ['guide/quick-start.md', '### 2. 打开仪表盘'],
    ['guide/interface.md', '## 仪表盘'],
  ])('shows the v2.1.3 local-build dashboard near the instructions in %s', (path, heading) => {
    const content = section(doc(path), heading)
    expect(content).toContain('](/extension-v2.1.3/dashboard.png)')
    expect(content).toContain('v2.1.3 源码本地测试界面')
    expect(content).toContain('隔离测试数据')
    expect(content).toContain('非发布包实拍')
    expect(content).not.toContain('Preview')
    png('public/extension-v2.1.3/dashboard.png', 1000, 600)
  })

  it.each([
    ['guide/quick-start.md', '### 1. 打开扩展弹窗'],
    ['guide/interface.md', '## 扩展弹窗'],
  ])('places a real popup screenshot near the popup instructions in %s', (path, heading) => {
    const content = section(doc(path), heading)
    expect(content).toContain('](/extension-v2.1.3/popup.png)')
    expect(content).toContain('v2.1.3 源码本地测试界面')
    expect(content).toContain('隔离测试数据')
    expect(content).toContain('非发布包实拍')
    png('public/extension-v2.1.3/popup.png', 320, 400)
  })

  it('places the Cloud connection screenshot near the matching setup steps', () => {
    const content = section(doc('guide/cloud-sync.md'), '## 连接自建 Cloud')
    expect(content).toContain('](/extension-v2.1.3/cloud-sync.png)')
    expect(content).toContain('[打开连接表单原图](/extension-v2.1.3/cloud-sync.png)')
    expect(content).toContain('v2.1.3 源码本地测试界面')
    expect(content).toContain('隔离测试数据')
    expect(content).toContain('非发布包实拍')
    png('public/extension-v2.1.3/cloud-sync.png', 600, 400)
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
