import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const attributes = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
const tags = /<([a-z][\w:-]*)\b([^>]*?)>/gi

function collectHtml(directory) {
  if (!existsSync(directory)) throw new Error(`Built site not found: ${directory}`)
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...collectHtml(file))
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(file)
  }
  return files.sort()
}

function parseAttributes(raw) {
  const result = new Map()
  for (const match of raw.matchAll(attributes)) {
    result.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4])
  }
  return result
}

function extractReferences(html) {
  const ids = new Set()
  const links = []
  for (const match of html.matchAll(tags)) {
    const tag = match[1].toLowerCase()
    const attrs = parseAttributes(match[2])
    if (attrs.has('id')) ids.add(attrs.get('id'))
    if (tag === 'a' && attrs.has('name')) ids.add(attrs.get('name'))
    if (tag === 'a' && attrs.has('href')) links.push({ target: attrs.get('href'), kind: 'page' })
    if (tag === 'img' && attrs.has('src')) links.push({ target: attrs.get('src'), kind: 'image' })
  }
  return { ids, links }
}

function decode(value) {
  try { return decodeURIComponent(value) } catch { return null }
}

function lookupTarget(root, source, raw) {
  if (!raw || raw.startsWith('//') || /^[a-z][\w+.-]*:/i.test(raw)) return null
  const hash = raw.indexOf('#')
  const withoutFragment = hash < 0 ? raw : raw.slice(0, hash)
  const fragment = hash < 0 ? '' : decode(raw.slice(hash + 1))
  const path = decode(withoutFragment.split('?')[0])
  if (path === null || fragment === null || path.includes('\0') || path.includes('\\')) return { invalid: true }
  const sourceUrl = `https://docs.invalid/${relative(root, source).split(sep).join('/')}`
  const resolved = new URL(path || '', sourceUrl)
  const decodedPath = decode(resolved.pathname)
  if (decodedPath === null) return { invalid: true }
  const target = resolve(root, `.${decodedPath}`)
  if (target !== root && !target.startsWith(root + sep)) return { invalid: true }
  return { target, fragment }
}

function findPage(target, root, source, raw) {
  if (raw.startsWith('#') || raw.startsWith('?') || raw === '') return source
  const options = extname(target)
    ? [target]
    : [target + '.html', join(target, 'index.html')]
  if (target === root) options.unshift(join(root, 'index.html'))
  return options.find((file) => existsSync(file) && statSync(file).isFile())
}

export function checkDocLinks(distDir) {
  const root = resolve(distDir)
  const htmlFiles = collectHtml(root)
  const pages = new Map(htmlFiles.map((file) => [file, extractReferences(readFileSync(file, 'utf8'))]))
  const errors = []

  for (const [source, { links }] of pages) {
    for (const { target, kind } of links) {
      const result = lookupTarget(root, source, target)
      if (result === null) continue
      const fail = (errorKind) => errors.push({ source: relative(root, source).split(sep).join('/'), target, kind: errorKind })
      if (result.invalid) { fail(kind); continue }
      if (kind === 'image') {
        if (!existsSync(result.target) || !statSync(result.target).isFile()) fail('image')
        continue
      }
      const destination = findPage(result.target, root, source, target)
      if (!destination) { fail('page'); continue }
      if (result.fragment && !pages.get(destination)?.ids.has(result.fragment)) fail('anchor')
    }
  }

  return { pages: htmlFiles.length, errors }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { pages, errors } = checkDocLinks(process.argv[2] ?? '.vitepress/dist')
    for (const { source, target, kind } of errors) console.error(`${kind}: ${source} -> ${target}`)
    console.log(`Checked ${pages} pages; ${errors.length} link errors`)
    if (errors.length) process.exitCode = 1
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
