import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadJavScribeReleases, selectJavScribeReleases } from '../.vitepress/components/javscribeReleases'

const releaseBase = 'https://github.com/JavdBviewed/JavScribe/releases/tag/'

function release(tag: string, overrides: Record<string, unknown> = {}) {
  return {
    tag_name: tag,
    html_url: `${releaseBase}${tag}`,
    draft: false,
    prerelease: false,
    ...overrides,
  }
}

describe('JavScribe public releases', () => {
  it('selects the client and serve releases independently from a mixed list', () => {
    const result = selectJavScribeReleases([
      release('serve-v0.4.2', { prerelease: true }),
      release('client-v1.2.0'),
      release('desktop-v8.0.0'),
      release('client-v1.1.9'),
      release('serve-v0.4.1'),
    ])

    expect(result).toEqual({
      client: {
        version: '1.2.0',
        prerelease: false,
        releaseUrl: 'https://github.com/JavdBviewed/JavScribe/releases/tag/client-v1.2.0',
      },
      serve: {
        version: '0.4.2',
        prerelease: true,
        releaseUrl: 'https://github.com/JavdBviewed/JavScribe/releases/tag/serve-v0.4.2',
      },
    })
  })

  it.each([
    ['1.0.9', '1.0.10'],
    ['1.9.99', '1.10.0'],
    ['9.99.99', '10.0.0'],
  ])('orders %s before %s numerically for both components', (older, newer) => {
    const result = selectJavScribeReleases([
      release(`client-v${older}`, { published_at: '2026-11-07T01:00:00Z' }),
      release(`serve-v${newer}`, { published_at: '2026-11-06T01:00:00Z' }),
      release(`client-v${newer}`, { published_at: '2026-11-06T01:00:00Z' }),
      release(`serve-v${older}`, { published_at: '2026-11-07T01:00:00Z' }),
    ])

    expect(result.client?.version).toBe(newer)
    expect(result.serve?.version).toBe(newer)
  })

  it('excludes drafts even when they have the highest version and a valid release URL', () => {
    const result = selectJavScribeReleases([
      release('client-v9.0.0', { draft: true }),
      release('serve-v9.0.0', { draft: true, prerelease: true }),
      release('client-v1.0.0'),
      release('serve-v2.0.0'),
    ])

    expect(result.client?.version).toBe('1.0.0')
    expect(result.serve?.version).toBe('2.0.0')
  })

  it.each(['client', 'serve'] as const)('retains the newest %s prerelease and its explicit status', (component) => {
    const result = selectJavScribeReleases([
      release(`${component}-v1.0.0`),
      release(`${component}-v1.1.0`, { prerelease: true }),
    ])

    expect(result[component]).toEqual({
      version: '1.1.0',
      prerelease: true,
      releaseUrl: `${releaseBase}${component}-v1.1.0`,
    })
  })

  it('does not require installer assets to show a verified public release', () => {
    const result = selectJavScribeReleases([release('client-v1.0.0', { assets: [] })])

    expect(result.client).toEqual({
      version: '1.0.0',
      prerelease: false,
      releaseUrl: 'https://github.com/JavdBviewed/JavScribe/releases/tag/client-v1.0.0',
    })
    expect(result.serve).toBeNull()
  })

  it.each([
    'v1.0.0',
    'desktop-v1.0.0',
    'web-v1.0.0',
    'client-v1.0',
    'client-v1.0.0-extra',
    'serve-v1.0.0/other',
  ])('rejects the unknown or malformed tag %s', (tag) => {
    expect(selectJavScribeReleases([release(tag)])).toEqual({ client: null, serve: null })
  })

  it.each([
    'https://github.com.evil.example/JavdBviewed/JavScribe/releases/tag/client-v1.0.0',
    'https://github.com@evil.example/JavdBviewed/JavScribe/releases/tag/client-v1.0.0',
    'https://attacker@github.com/JavdBviewed/JavScribe/releases/tag/client-v1.0.0',
    'https://github.com/other/JavScribe/releases/tag/client-v1.0.0',
    'https://github.com/JavdBviewed/other/releases/tag/client-v1.0.0',
    'https://github.com/JavdBviewed/JavScribe/releases/tag/client-v2.0.0',
    'https://github.com/JavdBviewed/JavScribe/releases/tag/serve-v1.0.0',
    'https://github.com/JavdBviewed/JavScribe/releases/latest',
    'https://github.com/JavdBviewed/JavScribe/releases/tag/client-v1.0.0/extra',
    'http://github.com/JavdBviewed/JavScribe/releases/tag/client-v1.0.0',
    'javascript:alert(1)',
    '/JavdBviewed/JavScribe/releases/tag/client-v1.0.0',
  ])('rejects an untrusted or mismatched release URL: %s', (releaseUrl) => {
    const result = selectJavScribeReleases([
      release('client-v1.0.0', { html_url: releaseUrl }),
      release('serve-v2.0.0'),
    ])

    expect(result.client).toBeNull()
    expect(result.serve?.version).toBe('2.0.0')
  })

  it('rejects a mismatched serve URL without hiding the valid client release', () => {
    const result = selectJavScribeReleases([
      release('client-v1.0.0'),
      release('serve-v2.0.0', { html_url: `${releaseBase}serve-v1.0.0` }),
    ])

    expect(result.client?.version).toBe('1.0.0')
    expect(result.serve).toBeNull()
  })

  it('returns no selected versions when there are no matching public releases', () => {
    expect(selectJavScribeReleases([])).toEqual({ client: null, serve: null })
    expect(selectJavScribeReleases([
      release('desktop-v1.0.0'),
      release('client-v1.0.0', { draft: true }),
      release('serve-v1.0.0', { draft: true }),
    ])).toEqual({ client: null, serve: null })
  })

  it('ignores malformed records without discarding a valid component', () => {
    const result = selectJavScribeReleases([
      null,
      42,
      {},
      { tag_name: 'client-v1.0.0' },
      release('serve-v2.0.0'),
    ])

    expect(result.client).toBeNull()
    expect(result.serve?.version).toBe('2.0.0')
  })
})

describe('JavScribe release queries', () => {
  afterEach(() => vi.useRealTimers())

  function fullPage(tag: string) {
    return Array.from({ length: 100 }, () => release(tag))
  }

  function response(payload: unknown) {
    return new Response(JSON.stringify(payload), { status: 200 })
  }

  it('stops at an exhausted page and reports no matching public versions', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response([]))
    const result = await loadJavScribeReleases(new AbortController().signal, request)

    expect(result).toEqual({ client: null, serve: null, state: 'complete' })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('checks the second page even when both components were found on the first', async () => {
    const firstPage = fullPage('client-v1.0.0')
    firstPage[0] = release('serve-v1.0.0')
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response(firstPage))
      .mockResolvedValueOnce(response([release('serve-v1.10.0', { prerelease: true })]))

    const result = await loadJavScribeReleases(new AbortController().signal, request)

    expect(result.state).toBe('complete')
    expect(result.client?.version).toBe('1.0.0')
    expect(result.serve?.version).toBe('1.10.0')
    expect(result.serve?.prerelease).toBe(true)
    expect(request.mock.calls.map(([url]) => url)).toEqual([
      'https://api.github.com/repos/JavdBviewed/JavScribe/releases?per_page=100&page=1',
      'https://api.github.com/repos/JavdBviewed/JavScribe/releases?per_page=100&page=2',
    ])
  })

  it('keeps both components and marks the result incomplete at the two-page limit', async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response(fullPage('client-v1.0.0')))
      .mockResolvedValueOnce(response(fullPage('serve-v2.0.0')))

    const result = await loadJavScribeReleases(new AbortController().signal, request)

    expect(result.state).toBe('limited')
    expect(result.client?.version).toBe('1.0.0')
    expect(result.serve?.version).toBe('2.0.0')
    expect(request).toHaveBeenCalledTimes(2)
  })

  it.each(['http', 'invalid-json', 'not-a-list'])('keeps a verified component after a second-page %s failure', async (failure) => {
    const failedResponse = failure === 'http'
      ? new Response('{}', { status: 403 })
      : failure === 'invalid-json'
        ? new Response('{')
        : response({ message: 'unexpected response' })
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response(fullPage('client-v1.0.0')))
      .mockResolvedValueOnce(failedResponse)

    const result = await loadJavScribeReleases(new AbortController().signal, request)

    expect(result.state).toBe('failed')
    expect(result.client?.version).toBe('1.0.0')
    expect(result.serve).toBeNull()
  })

  it('reports an initial network failure without claiming either component is unpublished', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Network error'))
    expect(await loadJavScribeReleases(new AbortController().signal, request)).toEqual({
      client: null,
      serve: null,
      state: 'failed',
    })
  })

  it('aborts a request after ten seconds', async () => {
    vi.useFakeTimers()
    const request = vi.fn<typeof fetch>().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    }))
    const pending = loadJavScribeReleases(new AbortController().signal, request)

    await vi.advanceTimersByTimeAsync(10_000)

    expect(await pending).toEqual({ client: null, serve: null, state: 'failed' })
    expect(request.mock.calls[0][1]?.signal?.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels the in-flight request when its owner is disposed', async () => {
    vi.useFakeTimers()
    const owner = new AbortController()
    const request = vi.fn<typeof fetch>().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    }))
    const pending = loadJavScribeReleases(owner.signal, request)
    owner.abort()

    expect((await pending).state).toBe('failed')
    expect(request.mock.calls[0][1]?.signal?.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    expect(request).toHaveBeenCalledTimes(1)
  })
})
