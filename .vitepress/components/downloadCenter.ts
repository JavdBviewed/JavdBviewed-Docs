type DownloadAsset = {
  name: string
  downloadUrl: string
  size: number
}

export type ExtensionRelease = {
  version: string
  releaseUrl: string
  asset: DownloadAsset
}

export type DesktopRelease = {
  version: string
  releaseStatus: 'released'
  releaseNotesUrl: string
  asset: DownloadAsset
}

export type MobileMetadata = {
  version: string
  versionCode: number
  tag: string
  releaseNotesUrl: string
}

export type MobileRelease = {
  version: string
  releaseStatus: 'released'
  releaseNotesUrl: string
  assets: (DownloadAsset & { abi: 'arm64-v8a' | 'armeabi-v7a' | 'x86_64' | 'universal' })[]
}

export type CloudRelease = {
  version: string
  releaseStatus: 'preparing' | 'released'
  image: string
  releaseNotesUrl: string
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

function isValidSize(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function parseAsset(value: unknown): DownloadAsset | null {
  if (
    !isRecord(value)
    || typeof value.path !== 'string'
    || !isHttpUrl(value.downloadUrl)
    || !isValidSize(value.size)
  ) return null
  return { name: value.path, downloadUrl: value.downloadUrl, size: value.size }
}

function parseStableManifest(value: unknown, product: string): { latest: JsonRecord; version: string; releaseNotesUrl: string; artifacts: unknown[] } | null {
  if (
    !isRecord(value)
    || value.schemaVersion !== 1
    || value.product !== product
    || value.channel !== 'stable'
    || value.releaseStatus !== 'released'
    || !isRecord(value.latest)
  ) return null

  const latest = value.latest
  if (
    typeof latest.version !== 'string'
    || !/^\d+\.\d+\.\d+$/.test(latest.version)
    || !isHttpUrl(latest.releaseNotesUrl)
    || !Array.isArray(latest.artifacts)
  ) return null

  return { latest, version: latest.version, releaseNotesUrl: latest.releaseNotesUrl, artifacts: latest.artifacts }
}

export function parseExtensionRelease(value: unknown): ExtensionRelease | null {
  if (
    !isRecord(value)
    || typeof value.tag_name !== 'string'
    || !/^v\d+\.\d+\.\d+(?:\.\d+)?$/.test(value.tag_name)
    || value.draft === true
    || value.prerelease === true
    || !isHttpUrl(value.html_url)
  ) {
    return null
  }

  const assets = Array.isArray(value.assets) ? value.assets : []
  const candidates = assets.flatMap((asset): ExtensionRelease['asset'][] => {
    if (
      !isRecord(asset)
      || typeof asset.name !== 'string'
      || !isHttpUrl(asset.browser_download_url)
      || !isValidSize(asset.size)
    ) {
      return []
    }

    const normalizedName = asset.name.toLowerCase()
    const isExtensionZip = /^javdb(?:viewed)?[-_](?:extension|chrome|chromium)(?:[-_.].*)?\.zip$/.test(normalizedName)

    return isExtensionZip
      ? [{ name: asset.name, downloadUrl: asset.browser_download_url, size: asset.size }]
      : []
  })

  const asset = candidates[0]
  if (!asset) return null

  return {
    version: value.tag_name.replace(/^v/i, ''),
    releaseUrl: value.html_url,
    asset,
  }
}

export function parseDesktopRelease(value: unknown): DesktopRelease | null {
  const manifest = parseStableManifest(value, 'javdbviewed-desktop')
  if (!manifest || manifest.latest.tag !== `desktop-v${manifest.version}`) return null

  const filename = `JavdBviewed-desktop-${manifest.version}-win-x64.exe`
  const matches = manifest.artifacts.filter((artifact) => isRecord(artifact) && artifact.path === filename)
  if (matches.length !== 1) return null
  const asset = parseAsset(matches[0])
  if (!asset) return null

  return {
    version: manifest.version,
    releaseStatus: 'released',
    releaseNotesUrl: manifest.releaseNotesUrl,
    asset,
  }
}

export function parseMobileMetadata(value: unknown): MobileMetadata | null {
  if (
    !isRecord(value)
    || value.schemaVersion !== 1
    || value.product !== 'javdbviewed-mobile'
    || value.channel !== 'stable'
    || value.releaseStatus !== 'released'
    || !isRecord(value.latest)
  ) return null

  const latest = value.latest
  if (
    typeof latest.version !== 'string'
    || !/^\d+\.\d+\.\d+$/.test(latest.version)
    || typeof latest.versionCode !== 'number'
    || !Number.isSafeInteger(latest.versionCode)
    || latest.versionCode <= 0
    || latest.tag !== `mobile-v${latest.versionCode}`
    || !isHttpUrl(latest.releaseNotesUrl)
  ) return null

  return {
    version: latest.version,
    versionCode: latest.versionCode,
    tag: latest.tag,
    releaseNotesUrl: latest.releaseNotesUrl,
  }
}

export function parseMobileRelease(value: unknown): MobileRelease | null {
  const manifest = parseStableManifest(value, 'javdbviewed-mobile')
  if (!manifest || !parseMobileMetadata(value)) return null

  const abis = ['arm64-v8a', 'armeabi-v7a', 'x86_64', 'universal'] as const
  const assets: MobileRelease['assets'] = []
  for (const abi of abis) {
    const filename = `app-${abi}-release.apk`
    const matches = manifest.artifacts.filter((artifact) => isRecord(artifact) && artifact.path === filename)
    if (matches.length !== 1) return null
    const asset = parseAsset(matches[0])
    if (!asset) return null
    assets.push({ abi, ...asset })
  }

  return {
    version: manifest.version,
    releaseStatus: 'released',
    releaseNotesUrl: manifest.releaseNotesUrl,
    assets,
  }
}

export function parseCloudRelease(value: unknown): CloudRelease | null {
  if (
    !isRecord(value)
    || value.product !== 'javdbviewed-cloud'
    || value.channel !== 'stable'
    || (value.releaseStatus !== 'preparing' && value.releaseStatus !== 'released')
    || !isRecord(value.latest)
    || typeof value.latest.version !== 'string'
    || !value.latest.version.trim()
    || typeof value.latest.image !== 'string'
    || !/^ghcr\.io\/javdbviewed\/javdbviewed-cloud:[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value.latest.image)
    || !isHttpUrl(value.latest.releaseNotesUrl)
  ) {
    return null
  }

  return {
    version: value.latest.version,
    releaseStatus: value.releaseStatus,
    image: value.latest.image,
    releaseNotesUrl: value.latest.releaseNotesUrl,
  }
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
