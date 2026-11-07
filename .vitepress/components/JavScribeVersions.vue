<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { loadJavScribeReleases, type JavScribeReleaseQuery, type JavScribeReleases } from './javscribeReleases'

const releases = ref<JavScribeReleases>({ client: null, serve: null })
const state = ref<JavScribeReleaseQuery['state'] | 'loading'>('loading')
const rows = computed(() => [
  { key: 'client', label: '客户端', release: releases.value.client },
  { key: 'serve', label: '服务端', release: releases.value.serve },
])
const emptyMessage = computed(() => state.value === 'loading'
  ? '正在查询版本'
  : state.value === 'failed' ? '查询失败' : '未查到公开版本')
let controller: AbortController | undefined

onMounted(async () => {
  const requestController = new AbortController()
  controller = requestController
  const result = await loadJavScribeReleases(requestController.signal)
  if (requestController.signal.aborted) return
  releases.value = { client: result.client, serve: result.serve }
  state.value = result.state
})

onUnmounted(() => controller?.abort())
</script>

<template>
  <div class="javscribe-versions" aria-live="polite" :aria-busy="state === 'loading'">
    <div v-for="row in rows" :key="row.key" class="javscribe-version-row">
      <strong class="javscribe-component">{{ row.label }}</strong>
      <template v-if="row.release">
        <span class="javscribe-version">v{{ row.release.version }}</span>
        <span class="javscribe-release-status">{{ row.release.prerelease ? '预发布' : '正式发布' }}</span>
        <a
          class="javscribe-release-link"
          :href="row.release.releaseUrl"
          :aria-label="`查看${row.label} ${row.release.version} 发布页`"
          target="_blank"
          rel="noopener noreferrer"
        >查看发布</a>
      </template>
      <span v-else class="javscribe-empty">{{ emptyMessage }}</span>
    </div>
    <div v-if="state === 'failed'" class="javscribe-query-note">
      查询失败，结果可能不完整，请到下方发布页核对。
    </div>
    <div v-else-if="state === 'limited'" class="javscribe-query-note">
      已查询前两页，结果可能不完整，请到下方发布页核对。
    </div>
  </div>
</template>

<style scoped>
.javscribe-versions {
  min-width: 0;
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.6;
}

.javscribe-version-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 8px;
  min-width: 0;
  padding: 10px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  overflow-wrap: anywhere;
}

.javscribe-component { flex-shrink: 0; }
.javscribe-version { min-width: 0; font-weight: 600; }
.javscribe-release-status {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.javscribe-release-link { margin-left: auto; font-weight: 600; }
.javscribe-empty { color: var(--vp-c-text-2); }
.javscribe-query-note {
  margin-top: 8px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  overflow-wrap: anywhere;
}
</style>
