import { describe, expect, it } from 'vitest'
import {
  formatFileSize,
  parseCloudRelease,
  parseDesktopRelease,
  parseExtensionRelease,
  parseMobileMetadata,
  parseMobileRelease,
} from '../.vitepress/components/downloadCenter'

const releaseBase = 'https://github.com/JavdBviewed/JavdBviewed-release/releases/download'
const desktopNotes = 'https://github.com/JavdBviewed/JavdBviewed-release/blob/main/releases/desktop/v1.0.0.md'
const mobileNotes = 'https://github.com/JavdBviewed/JavdBviewed-release/blob/main/releases/mobile/v1.0.3.md'

const desktopManifest = {
  schemaVersion: 1,
  product: 'javdbviewed-desktop',
  channel: 'stable',
  releaseStatus: 'released',
  latest: {
    version: '1.0.0',
    tag: 'desktop-v1.0.0',
    releaseNotesUrl: desktopNotes,
    artifacts: [
      {
        path: 'JavdBviewed-desktop-1.0.0-win-x64.exe.blockmap',
        size: 97_727,
        downloadUrl: `${releaseBase}/desktop-v1.0.0/JavdBviewed-desktop-1.0.0-win-x64.exe.blockmap`,
      },
      {
        path: 'JavdBviewed-desktop-1.0.0-win-x64.exe',
        size: 92_663_081,
        downloadUrl: `${releaseBase}/desktop-v1.0.0/JavdBviewed-desktop-1.0.0-win-x64.exe`,
      },
      {
        path: 'latest.yml',
        size: 370,
        downloadUrl: `${releaseBase}/desktop-v1.0.0/latest.yml`,
      },
    ],
  },
}

const mobileManifest = {
  schemaVersion: 1,
  product: 'javdbviewed-mobile',
  channel: 'stable',
  releaseStatus: 'released',
  latest: {
    version: '1.0.3',
    versionCode: 42,
    tag: 'mobile-v42',
    releaseNotesUrl: mobileNotes,
    artifacts: [
      { path: 'app-arm64-v8a-release.apk', size: 61_404_869, downloadUrl: `${releaseBase}/mobile-v42/app-arm64-v8a-release.apk` },
      { path: 'app-armeabi-v7a-release.apk', size: 46_631_947, downloadUrl: `${releaseBase}/mobile-v42/app-armeabi-v7a-release.apk` },
      { path: 'app-x86_64-release.apk', size: 69_625_836, downloadUrl: `${releaseBase}/mobile-v42/app-x86_64-release.apk` },
      { path: 'app-universal-release.apk', size: 217_066_091, downloadUrl: `${releaseBase}/mobile-v42/app-universal-release.apk` },
    ],
  },
}

describe('download center release data', () => {
  it('selects the extension ZIP from the latest GitHub release', () => {
    const release = parseExtensionRelease({
      tag_name: 'v1.21.4',
      html_url: 'https://github.com/JavdBviewed/JavdBviewed/releases/tag/v1.21.4',
      assets: [
        {
          name: 'checksums.txt',
          browser_download_url: 'https://github.com/example/checksums.txt',
          size: 120,
        },
        {
          name: 'javdb-extension-v1.21.4-build-27.zip',
          browser_download_url: 'https://github.com/example/extension.zip',
          size: 3_049_327,
        },
      ],
    })

    expect(release).toEqual({
      version: '1.21.4',
      releaseUrl: 'https://github.com/JavdBviewed/JavdBviewed/releases/tag/v1.21.4',
      asset: {
        name: 'javdb-extension-v1.21.4-build-27.zip',
        downloadUrl: 'https://github.com/example/extension.zip',
        size: 3_049_327,
      },
    })
    expect(formatFileSize(3_049_327)).toBe('2.9 MB')
  })

  it('rejects a latest release without a downloadable extension ZIP', () => {
    expect(parseExtensionRelease({
      tag_name: 'v1.21.4',
      html_url: 'https://github.com/JavdBviewed/JavdBviewed/releases/tag/v1.21.4',
      assets: [],
    })).toBeNull()
  })

  it.each(['draft', 'prerelease'] as const)('does not offer %s extension assets as stable downloads', (status) => {
    const release = {
      tag_name: 'v2.1.3',
      html_url: 'https://github.com/JavdBviewed/JavdBviewed/releases/tag/v2.1.3',
      assets: [{ name: 'javdb-extension-v2.1.3.zip', browser_download_url: 'https://github.com/example/extension.zip', size: 3_049_327 }],
    }

    expect(parseExtensionRelease({ ...release, [status]: true })).toBeNull()
  })

  it('rejects a desktop release even if its assets contain an extension-named ZIP', () => {
    expect(parseExtensionRelease({
      tag_name: 'desktop-v1.0.0',
      html_url: 'https://github.com/JavdBviewed/JavdBviewed-release/releases/tag/desktop-v1.0.0',
      assets: [{ name: 'desktop-extension-support.zip', browser_download_url: 'https://github.com/example/support.zip', size: 100 }],
    })).toBeNull()
  })

  it('skips extension assets with non-finite or non-positive byte sizes', () => {
    const release = {
      tag_name: 'v2.1.3',
      html_url: 'https://github.com/JavdBviewed/JavdBviewed/releases/tag/v2.1.3',
      assets: [
        { name: 'javdb-extension-infinite.zip', browser_download_url: 'https://github.com/example/infinite.zip', size: Infinity },
        { name: 'javdb-extension-nan.zip', browser_download_url: 'https://github.com/example/nan.zip', size: NaN },
        { name: 'javdb-extension-empty.zip', browser_download_url: 'https://github.com/example/empty.zip', size: 0 },
        { name: 'javdb-extension-v2.1.3.zip', browser_download_url: 'https://github.com/example/valid.zip', size: 3_049_327 },
      ],
    }

    expect(parseExtensionRelease(release)?.asset).toEqual({
      name: 'javdb-extension-v2.1.3.zip',
      downloadUrl: 'https://github.com/example/valid.zip',
      size: 3_049_327,
    })
    expect(parseExtensionRelease({ ...release, assets: release.assets.slice(0, 3) })).toBeNull()
  })

  it('accepts only known Cloud release states', () => {
    const manifest = {
      product: 'javdbviewed-cloud',
      channel: 'stable',
      releaseStatus: 'preparing',
      latest: {
        version: '1.0.0',
        image: 'ghcr.io/javdbviewed/javdbviewed-cloud:latest',
        releaseNotesUrl: 'https://github.com/JavdBviewed/JavdBviewed-release/blob/main/releases/cloud/v1.0.0.md',
      },
    }

    expect(parseCloudRelease(manifest)?.releaseStatus).toBe('preparing')
    expect(parseCloudRelease({ ...manifest, releaseStatus: 'draft' })).toBeNull()
  })

  it.each([
    { problem: 'empty version', latest: { version: '  ' } },
    { problem: 'invalid image name', latest: { image: 'not-an-image' } },
  ])('rejects Cloud releases with an $problem', ({ latest }) => {
    const manifest = {
      product: 'javdbviewed-cloud',
      channel: 'stable',
      releaseStatus: 'released',
      latest: {
        version: '1.2.8',
        image: 'ghcr.io/javdbviewed/javdbviewed-cloud:1.2.8',
        releaseNotesUrl: 'https://github.com/JavdBviewed/JavdBviewed-release/blob/main/releases/cloud/v1.2.8.md',
      },
    }

    expect(parseCloudRelease({ ...manifest, latest: { ...manifest.latest, ...latest } })).toBeNull()
  })

  it('selects the Windows installer, excluding desktop update metadata', () => {
    expect(parseDesktopRelease(desktopManifest)).toEqual({
      version: '1.0.0',
      releaseStatus: 'released',
      releaseNotesUrl: desktopNotes,
      asset: {
        name: 'JavdBviewed-desktop-1.0.0-win-x64.exe',
        downloadUrl: `${releaseBase}/desktop-v1.0.0/JavdBviewed-desktop-1.0.0-win-x64.exe`,
        size: 92_663_081,
      },
    })
  })

  it('does not claim a desktop download without a Windows installer', () => {
    expect(parseDesktopRelease({
      ...desktopManifest,
      latest: { ...desktopManifest.latest, artifacts: desktopManifest.latest.artifacts.filter(({ path }) => !path.endsWith('.exe')) },
    })).toBeNull()
  })

  it('keeps all four Android APKs labeled by their device ABI', () => {
    expect(parseMobileRelease(mobileManifest)).toEqual({
      version: '1.0.3',
      releaseStatus: 'released',
      releaseNotesUrl: mobileNotes,
      assets: [
        { abi: 'arm64-v8a', name: 'app-arm64-v8a-release.apk', size: 61_404_869, downloadUrl: `${releaseBase}/mobile-v42/app-arm64-v8a-release.apk` },
        { abi: 'armeabi-v7a', name: 'app-armeabi-v7a-release.apk', size: 46_631_947, downloadUrl: `${releaseBase}/mobile-v42/app-armeabi-v7a-release.apk` },
        { abi: 'x86_64', name: 'app-x86_64-release.apk', size: 69_625_836, downloadUrl: `${releaseBase}/mobile-v42/app-x86_64-release.apk` },
        { abi: 'universal', name: 'app-universal-release.apk', size: 217_066_091, downloadUrl: `${releaseBase}/mobile-v42/app-universal-release.apk` },
      ],
    })
  })

  it('reads Android version metadata independently of download availability', () => {
    expect(parseMobileMetadata(mobileManifest)).toEqual({
      version: '1.0.3',
      versionCode: 42,
      tag: 'mobile-v42',
      releaseNotesUrl: mobileNotes,
    })
  })

  it.each([
    { problem: 'empty version', latest: { version: '  ' } },
    { problem: 'invalid version', latest: { version: 'not-a-version' } },
    { problem: 'mismatched tag', latest: { tag: 'mobile-v41' } },
    { problem: 'non-mobile tag', latest: { tag: 'desktop-v42' } },
    { problem: 'zero build number', latest: { versionCode: 0 } },
    { problem: 'fractional build number', latest: { versionCode: 42.5 } },
    { problem: 'unsafe build number', latest: { versionCode: Number.MAX_SAFE_INTEGER + 1 } },
    { problem: 'invalid release notes URL', latest: { releaseNotesUrl: 'javascript:alert(1)' } },
  ])('rejects Android metadata with $problem even when all APKs exist', ({ latest }) => {
    const manifest = { ...mobileManifest, latest: { ...mobileManifest.latest, ...latest } }

    expect(parseMobileMetadata(manifest)).toBeNull()
    expect(parseMobileRelease(manifest)).toBeNull()
  })

  it.each([
    { problem: 'unsupported schema', patch: { schemaVersion: 2 } },
    { problem: 'different product', patch: { product: 'javdbviewed-desktop' } },
    { problem: 'non-stable channel', patch: { channel: 'beta' } },
    { problem: 'unreleased manifest', patch: { releaseStatus: 'preparing' } },
    { problem: 'missing metadata', patch: { latest: null } },
  ])('rejects Android metadata from a manifest with $problem', ({ patch }) => {
    expect(parseMobileMetadata({ ...mobileManifest, ...patch })).toBeNull()
  })

  it.each([
    { problem: 'missing assets', artifacts: undefined },
    { problem: 'empty assets', artifacts: [] },
    { problem: 'partial ABI list', artifacts: mobileManifest.latest.artifacts.slice(0, 3) },
    { problem: 'invalid asset', artifacts: mobileManifest.latest.artifacts.map((asset) => ({ ...asset, size: 0 })) },
    { problem: 'duplicate ABI', artifacts: [...mobileManifest.latest.artifacts, mobileManifest.latest.artifacts[0]] },
  ])('retains Android metadata with $problem without accepting the downloads', ({ artifacts }) => {
    const manifest = { ...mobileManifest, latest: { ...mobileManifest.latest, artifacts } }

    expect(parseMobileRelease(manifest)).toBeNull()
    expect(parseMobileMetadata(manifest)).toEqual({
      version: '1.0.3',
      versionCode: 42,
      tag: 'mobile-v42',
      releaseNotesUrl: mobileNotes,
    })
  })

  it('does not present a partial Android ABI list as a complete release', () => {
    expect(parseMobileRelease({
      ...mobileManifest,
      latest: { ...mobileManifest.latest, artifacts: mobileManifest.latest.artifacts.slice(0, 3) },
    })).toBeNull()
  })
})
