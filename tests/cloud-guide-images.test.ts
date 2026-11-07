import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function section(path: string, heading: string): string {
  const markdown = readFileSync(resolve(root, path), 'utf8')
  const start = markdown.indexOf(heading)
  expect(start, `${path}: missing ${heading}`).toBeGreaterThanOrEqual(0)
  const remainder = markdown.slice(start + heading.length)
  const next = remainder.search(/^## /m)
  return remainder.slice(0, next === -1 ? undefined : next)
}

function image(path: string): void {
  const file = resolve(root, path)
  expect(existsSync(file), `missing image ${path}`).toBe(true)
  const bytes = readFileSync(file)
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  expect(bytes.readUInt32BE(16)).toBeGreaterThan(800)
  expect(bytes.readUInt32BE(20)).toBeGreaterThan(400)
}

describe('Cloud operation screenshots', () => {
  it.each([
    ['cloud/deployment.md', '## 拉取和首次启动', 'admin-login-test.png', '打开登录页原图'],
    ['cloud/connections.md', '## 怎么确认连接完成', 'admin-devices-test.png', '打开设备页原图'],
    ['cloud/backup-upgrade.md', '## 升级前：记录状态并备份', 'admin-snapshots-test.png', '打开快照页原图'],
  ])('places %s image near its actual Cloud operation', (path, heading, filename, linkText) => {
    const content = section(path, heading)
    const imagePath = `/cloud-v1.2.9/${filename}`
    const caption = content.split(`](${imagePath})\n\n`)[1]?.split('\n')[0]
    expect(caption, `${filename}: image must have an adjacent caption`).toBeDefined()
    expect(caption).toContain('cloud-v1.2.9')
    expect(caption).toContain('本地测试')
    expect(caption).toContain('不是已发布镜像实拍')
    expect(caption).toContain('测试数据')
    expect(content).toContain(`[${linkText}](${imagePath})`)
    image(`public${imagePath}`)
  })
})
