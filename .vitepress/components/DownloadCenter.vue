<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import JavScribeVersions from './JavScribeVersions.vue'
import {
  formatFileSize,
  parseCloudRelease,
  parseDesktopRelease,
  parseExtensionRelease,
  parseMobileMetadata,
  parseMobileRelease,
  type CloudRelease,
  type DesktopRelease,
  type ExtensionRelease,
  type MobileMetadata,
  type MobileRelease,
} from './downloadCenter'

const RELEASES_URL = 'https://github.com/JavdBviewed/JavdBviewed-release/releases'
const EXTENSION_RELEASES_URL = 'https://github.com/JavdBviewed/JavdBviewed/releases'
const EXTENSION_API_URL = 'https://api.github.com/repos/JavdBviewed/JavdBviewed/releases'
const RELEASE_API_URL = 'https://api.github.com/repos/JavdBviewed/JavdBviewed-release/releases/tags'
const MANIFEST_BASE = 'https://raw.githubusercontent.com/JavdBviewed/JavdBviewed-release/main/manifests'
const DESKTOP_MANIFEST_URL = `${MANIFEST_BASE}/desktop/stable.json`
const MOBILE_MANIFEST_URL = `${MANIFEST_BASE}/mobile/stable.json`
const CLOUD_MANIFEST_URL = `${MANIFEST_BASE}/cloud/stable.json`
const JAVSCRIBE_RELEASES_URL = 'https://github.com/JavdBviewed/JavScribe/releases'

type LoadState = 'loading' | 'ready' | 'failed'
const extension = ref<ExtensionRelease | null>(null)
const desktop = ref<DesktopRelease | null>(null)
const mobileMetadata = ref<MobileMetadata | null>(null)
const mobile = ref<MobileRelease | null>(null)
const cloud = ref<CloudRelease | null>(null)
const extensionState = ref<LoadState>('loading')
const desktopState = ref<LoadState>('loading')
const mobileState = ref<LoadState>('loading')
const mobileDownloadState = ref<LoadState>('loading')
const cloudState = ref<LoadState>('loading')

let disposed = false
const activeRequests = new Set<AbortController>()

async function readJson(url: string, headers?: HeadersInit): Promise<unknown> {
  const controller = new AbortController()
  activeRequests.add(controller)
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(url, { headers, cache: 'no-cache', signal: controller.signal })
    if (!response.ok) throw new Error(`Release lookup failed: ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timeout)
    activeRequests.delete(controller)
  }
}

function manifestTag(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('latest' in payload)) return null
  const latest = payload.latest
  return latest && typeof latest === 'object' && 'tag' in latest && typeof latest.tag === 'string'
    ? latest.tag
    : null
}

async function matchesPublicRelease(tag: string, assets: { name: string; downloadUrl: string; size: number }[]): Promise<boolean> {
  const payload = await readJson(`${RELEASE_API_URL}/${encodeURIComponent(tag)}`, {
    Accept: 'application/vnd.github+json',
  })
  if (
    !payload || typeof payload !== 'object'
    || !('tag_name' in payload) || payload.tag_name !== tag
    || !('draft' in payload) || payload.draft !== false
    || !('prerelease' in payload) || payload.prerelease !== false
    || !('assets' in payload) || !Array.isArray(payload.assets)
  ) return false

  return assets.every((expected) => payload.assets.some((asset: unknown) =>
    asset !== null && typeof asset === 'object'
    && 'name' in asset && asset.name === expected.name
    && 'browser_download_url' in asset && asset.browser_download_url === expected.downloadUrl
    && 'size' in asset && asset.size === expected.size,
  ))
}

async function loadExtensionRelease(): Promise<void> {
  try {
    let found: ExtensionRelease | null = null
    // The mixed-product feed is bounded; an unmatched page is not proof of no release.
    for (let page = 1; page <= 2 && !found; page++) {
      if (disposed) return
      const payload = await readJson(`${EXTENSION_API_URL}?per_page=30&page=${page}`, {
        Accept: 'application/vnd.github+json',
      })
      if (!Array.isArray(payload)) throw new Error('Invalid release list')
      found = payload.map(parseExtensionRelease).find((item): item is ExtensionRelease => item !== null) ?? null
      if (payload.length < 30) break
    }
    if (!disposed) {
      extension.value = found
      extensionState.value = found ? 'ready' : 'failed'
    }
  } catch {
    if (!disposed) extensionState.value = 'failed'
  }
}

async function loadManifest<T>(
  url: string,
  parse: (payload: unknown) => T | null,
  onReady: (release: T) => void,
  onFailed: () => void,
  verify?: (release: T, payload: unknown) => Promise<boolean>,
): Promise<void> {
  try {
    const payload = await readJson(url)
    const release = parse(payload)
    if (!release) throw new Error('Invalid release data')
    if (verify && !(await verify(release, payload))) throw new Error('Release assets are not available')
    if (!disposed) onReady(release)
  } catch {
    if (!disposed) onFailed()
  }
}

async function loadMobileRelease(): Promise<void> {
  try {
    const payload = await readJson(MOBILE_MANIFEST_URL)
    const metadata = parseMobileMetadata(payload)
    if (!metadata) throw new Error('Invalid Android metadata')
    if (disposed) return
    mobileMetadata.value = metadata
    mobileState.value = 'ready'

    try {
      const release = parseMobileRelease(payload)
      if (!release || !(await matchesPublicRelease(metadata.tag, release.assets))) {
        throw new Error('Android release assets are not available')
      }
      if (!disposed) {
        mobile.value = release
        mobileDownloadState.value = 'ready'
      }
    } catch {
      if (!disposed) mobileDownloadState.value = 'failed'
    }
  } catch {
    if (!disposed) mobileState.value = 'failed'
  }
}

onMounted(() => {
  void loadExtensionRelease()
  void loadManifest(DESKTOP_MANIFEST_URL, parseDesktopRelease,
    (release) => { desktop.value = release; desktopState.value = 'ready' },
    () => { desktopState.value = 'failed' },
    (release, payload) => {
      const tag = manifestTag(payload)
      return tag ? matchesPublicRelease(tag, [release.asset]) : Promise.resolve(false)
    })
  void loadMobileRelease()
  void loadManifest(CLOUD_MANIFEST_URL, parseCloudRelease,
    (release) => { cloud.value = release; cloudState.value = 'ready' },
    () => { cloudState.value = 'failed' })
})

onUnmounted(() => {
  disposed = true
  activeRequests.forEach((controller) => controller.abort())
})
</script>

<template>
  <section class="download-center" aria-labelledby="download-products-title">
    <div class="download-heading">
      <div>
        <p class="download-kicker">发布中心</p>
        <h2 id="download-products-title">选择使用方式</h2>
      </div>
    </div>

    <div class="product-grid">
      <article class="product-card product-card--extension">
        <div class="product-topline">
          <span class="product-mark" aria-hidden="true">EX</span>
          <span :class="['status', extensionState === 'ready' ? 'status--released' : 'status--preview']" aria-live="polite">
            {{ extensionState === 'ready' ? '已发布' : extensionState === 'loading' ? '查询中' : '暂不可验证' }}
          </span>
        </div>
        <h3>浏览器扩展</h3>
        <p v-if="extension">v{{ extension.version }} · {{ extension.asset.name }} · {{ formatFileSize(extension.asset.size) }}</p>
        <p v-else-if="extensionState === 'loading'">正在查询正式发布的扩展 ZIP。</p>
        <p v-else>暂时无法确认可下载的扩展版本，请前往发布页选择扩展 ZIP。</p>
        <div class="product-actions">
          <a v-if="extension" class="primary-action" :href="extension.asset.downloadUrl" target="_blank" rel="noopener noreferrer">下载 ZIP</a>
          <a v-if="extension" class="secondary-action" :href="extension.releaseUrl" target="_blank" rel="noopener noreferrer">版本说明</a>
          <a v-else class="secondary-action" :href="EXTENSION_RELEASES_URL" target="_blank" rel="noopener noreferrer">查看发布页</a>
        </div>
      </article>

      <article class="product-card product-card--desktop">
        <div class="product-topline">
          <span class="product-mark" aria-hidden="true">PC</span>
          <span :class="['status', desktopState === 'ready' ? 'status--released' : 'status--preview']" aria-live="polite">
            {{ desktopState === 'ready' ? '已发布' : desktopState === 'loading' ? '查询中' : '暂不可验证' }}
          </span>
        </div>
        <h3>桌面端 · Windows x64</h3>
        <p v-if="desktop">v{{ desktop.version }} · Windows 安装包 · {{ formatFileSize(desktop.asset.size) }}</p>
        <p v-else-if="desktopState === 'loading'">正在查询 Windows 安装包。</p>
        <p v-else>暂时无法确认安装包版本，请在发布页查看桌面端版本。</p>
        <div class="product-actions">
          <a v-if="desktop" class="primary-action" :href="desktop.asset.downloadUrl" target="_blank" rel="noopener noreferrer">下载 Windows 安装包</a>
          <a v-if="desktop" class="secondary-action" :href="desktop.releaseNotesUrl" target="_blank" rel="noopener noreferrer">版本说明</a>
          <a v-else class="secondary-action" :href="RELEASES_URL" target="_blank" rel="noopener noreferrer">查看发布页</a>
          <a v-if="desktop" class="secondary-action" :href="DESKTOP_MANIFEST_URL" target="_blank" rel="noopener noreferrer">版本数据</a>
        </div>
      </article>

      <article class="product-card product-card--android">
        <div class="product-topline">
          <span class="product-mark" aria-hidden="true">AN</span>
          <span :class="['status', mobileDownloadState === 'ready' ? 'status--released' : 'status--preview']" aria-live="polite">
            {{ mobileState === 'loading' ? '版本查询中' : mobileState === 'failed' ? '版本查询失败' : mobileDownloadState === 'ready' ? '安装包已核实' : mobileDownloadState === 'loading' ? '安装包核实中' : '安装包待核实' }}
          </span>
        </div>
        <h3>Android</h3>
        <p v-if="mobileMetadata">v{{ mobileMetadata.version }} · 构建 {{ mobileMetadata.versionCode }}</p>
        <p v-else-if="mobileState === 'loading'">正在查询 Android 版本清单。</p>
        <p v-else>Android 版本查询失败，请在发布页查看版本信息。</p>
        <p v-if="mobileMetadata && mobileDownloadState === 'loading'">正在核实公开发布的 Android 安装包，核实后提供下载。</p>
        <p v-else-if="mobileMetadata && mobileDownloadState === 'failed'">安装包待核实，暂不提供直接下载，请在发布页确认。</p>
        <p v-else-if="mobile">按设备架构选择 APK；不确定时选通用版。</p>
        <ul v-if="mobile" class="apk-list" aria-label="Android 安装包">
          <li v-for="asset in mobile.assets" :key="asset.abi">
            <span>{{ asset.abi === 'universal' ? '通用版' : asset.abi }} <small>{{ formatFileSize(asset.size) }}</small></span>
            <a :href="asset.downloadUrl" target="_blank" rel="noopener noreferrer" :aria-label="`下载 ${asset.abi} APK`">下载 APK</a>
          </li>
        </ul>
        <div class="product-actions">
          <a v-if="mobileMetadata" class="secondary-action" :href="mobileMetadata.releaseNotesUrl" target="_blank" rel="noopener noreferrer">版本说明</a>
          <a v-if="!mobile" class="secondary-action" :href="RELEASES_URL" target="_blank" rel="noopener noreferrer">查看发布页</a>
          <a v-if="mobileMetadata" class="secondary-action" :href="MOBILE_MANIFEST_URL" target="_blank" rel="noopener noreferrer">版本数据</a>
        </div>
      </article>

      <article class="product-card product-card--cloud">
        <div class="product-topline">
          <span class="product-mark" aria-hidden="true">CL</span>
          <span :class="['status', cloudState === 'ready' ? cloud?.releaseStatus === 'released' ? 'status--released' : 'status--preparing' : 'status--preview']" aria-live="polite">
            {{ cloudState === 'loading' ? '查询中' : cloudState === 'failed' ? '暂不可验证' : cloud?.releaseStatus === 'released' ? '已发布' : '发布准备中' }}
          </span>
        </div>
        <h3>Cloud · 自部署</h3>
        <p v-if="cloud && cloud.releaseStatus === 'released'">v{{ cloud.version }} · Docker 容器镜像</p>
        <p v-else-if="cloud && cloud.releaseStatus === 'preparing'">当前版本尚在发布准备中，暂不建议拉取或部署。</p>
        <p v-else-if="cloudState === 'loading'">正在读取 Cloud 发布状态。</p>
        <p v-else>暂时无法确认 Cloud 发布状态，请先查看发布页。</p>
        <code v-if="cloud?.releaseStatus === 'released'">{{ cloud.image }}</code>
        <div class="product-actions">
          <a v-if="cloud?.releaseStatus === 'released'" class="primary-action" href="#cloud-deploy">查看部署指南</a>
          <a v-else-if="cloudState === 'ready'" class="secondary-action" href="#cloud-deploy">查看部署说明</a>
          <a v-else class="secondary-action" :href="RELEASES_URL" target="_blank" rel="noopener noreferrer">查看发布页</a>
          <a v-if="cloud" class="secondary-action" :href="cloud.releaseNotesUrl" target="_blank" rel="noopener noreferrer">版本说明</a>
          <a v-if="cloud" class="secondary-action" :href="CLOUD_MANIFEST_URL" target="_blank" rel="noopener noreferrer">版本数据</a>
        </div>
      </article>

      <article class="product-card product-card--javscribe">
        <div class="product-topline"><span class="product-mark" aria-hidden="true">JS</span><span class="status status--preview">独立发布</span></div>
        <h3>JavScribe · 字幕工具</h3>
        <JavScribeVersions />
        <div class="product-actions">
          <a class="secondary-action" href="/javscribe/">使用文档</a>
          <a class="secondary-action" :href="JAVSCRIBE_RELEASES_URL" target="_blank" rel="noopener noreferrer">查看发布页</a>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.download-center {
  margin: 24px 0 40px;
}

.download-heading,
.product-topline,
.product-actions {
  display: flex;
  align-items: center;
}

.download-heading {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.download-heading h2 {
  margin: 2px 0 0;
  border: 0;
  padding: 0;
  font-size: 22px;
}

.download-kicker {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 700;
}

.secondary-action {
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 600;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.product-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 238px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 18px;
  background: var(--vp-c-bg-soft);
  box-shadow: inset 3px 0 0 var(--product-accent);
}

.product-card--extension { --product-accent: #d97706; }
.product-card--cloud { --product-accent: #16836f; }
.product-card--desktop { --product-accent: #3971b7; }
.product-card--android { --product-accent: #7a5c9e; }
.product-card--javscribe { --product-accent: #776047; }

.product-topline {
  justify-content: space-between;
  gap: 12px;
}

.product-mark {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--product-accent) 45%, var(--vp-c-divider));
  border-radius: 6px;
  color: var(--product-accent);
  font-size: 12px;
  font-weight: 800;
}

.status {
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.status--released {
  background: color-mix(in srgb, #16836f 13%, transparent);
  color: #11705f;
}

.status--preparing {
  background: color-mix(in srgb, #d97706 14%, transparent);
  color: #a45105;
}

:global(.dark) .status--released { color: #83d8b1; }
:global(.dark) .status--preparing { color: #f4b76b; }

.status--preview {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}

.product-card h3 {
  margin: 18px 0 8px;
  font-size: 18px;
}

.product-card p {
  min-height: 48px;
  margin: 0 0 14px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.product-card code {
  display: block;
  margin: -4px 0 14px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.apk-list {
  display: grid;
  gap: 0;
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
}

.apk-list li {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 14px;
}

.apk-list li span { min-width: 0; overflow-wrap: anywhere; }
.apk-list small { color: var(--vp-c-text-2); }
.apk-list a { flex: none; font-weight: 600; }

.product-actions {
  flex-wrap: wrap;
  gap: 12px;
  margin-top: auto;
}

.primary-action {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 0 15px;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.primary-action:hover {
  background: var(--vp-c-brand-2);
  color: var(--vp-c-white);
}

.primary-action:focus-visible,
.secondary-action:focus-visible,
.apk-list a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .download-heading {
    align-items: flex-end;
  }

  .product-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .product-card {
    min-height: 0;
  }

  .product-card p {
    min-height: 0;
  }
}

@media (max-width: 360px) {
  .apk-list li { align-items: flex-start; flex-direction: column; gap: 0; padding: 8px 0; }
}

@media (prefers-reduced-motion: reduce) {
  .primary-action {
    transition: none;
  }
}
</style>
