export interface JavScribeRelease {
  version: string
  prerelease: boolean
  releaseUrl: string
}

export interface JavScribeReleases {
  client: JavScribeRelease | null
  serve: JavScribeRelease | null
}

export interface JavScribeReleaseQuery extends JavScribeReleases {
  state: 'complete' | 'limited' | 'failed'
}

const releaseBase = 'https://github.com/JavdBviewed/JavScribe/releases/tag/'
const releaseApi = 'https://api.github.com/repos/JavdBviewed/JavScribe/releases'

function isNewer(version: string, previous: string): boolean {
  const previousParts = previous.split('.').map(Number)
  for (const [index, part] of version.split('.').map(Number).entries()) {
    if (part !== previousParts[index]) return part > previousParts[index]
  }
  return false
}

export function selectJavScribeReleases(payload: unknown): JavScribeReleases {
  const selected: JavScribeReleases = { client: null, serve: null }
  if (!Array.isArray(payload)) return selected

  for (const entry of payload) {
    if (
      !entry || typeof entry !== 'object'
      || typeof entry.tag_name !== 'string'
      || entry.draft !== false
      || typeof entry.prerelease !== 'boolean'
    ) continue

    const match = /^(client|serve)-v((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))$/.exec(entry.tag_name)
    if (!match || entry.html_url !== `${releaseBase}${entry.tag_name}`) continue

    const component = match[1] as keyof JavScribeReleases
    const version = match[2]
    if (!version.split('.').every(part => Number.isSafeInteger(Number(part)))) continue
    const previous = selected[component]
    if (!previous || isNewer(version, previous.version)) {
      selected[component] = { version, prerelease: entry.prerelease, releaseUrl: entry.html_url }
    }
  }

  return selected
}

async function readReleasePage(page: number, signal: AbortSignal, request: typeof fetch): Promise<unknown[]> {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  signal.addEventListener('abort', cancel, { once: true })
  const timeout = setTimeout(cancel, 10_000)

  try {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    const response = await request(`${releaseApi}?per_page=100&page=${page}`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('Release query failed')
    const payload: unknown = await response.json()
    if (!Array.isArray(payload)) throw new Error('Invalid release list')
    return payload
  } finally {
    clearTimeout(timeout)
    signal.removeEventListener('abort', cancel)
  }
}

export async function loadJavScribeReleases(signal: AbortSignal, request: typeof fetch = fetch): Promise<JavScribeReleaseQuery> {
  const entries: unknown[] = []
  try {
    for (let page = 1; page <= 2; page++) {
      const payload = await readReleasePage(page, signal, request)
      entries.push(...payload)
      if (payload.length < 100) return { ...selectJavScribeReleases(entries), state: 'complete' }
    }
    return { ...selectJavScribeReleases(entries), state: 'limited' }
  } catch {
    return { ...selectJavScribeReleases(entries), state: 'failed' }
  }
}
