<template>
  <section class="home-paths" aria-labelledby="home-paths-title">
    <div class="home-paths__heading">
      <p class="home-paths__kicker">按任务查找</p>
      <h2 id="home-paths-title">接下来要做什么？</h2>
    </div>

    <div class="home-paths__list">
      <section class="home-path" aria-labelledby="home-path-install">
        <div class="home-path__copy">
          <h3 id="home-path-install">安装与首次使用</h3>
          <p>选择使用的设备，从安装到第一次打开产品。</p>
        </div>
        <nav class="home-path__links" aria-label="安装与首次使用指南">
          <a href="/guide/quick-start">浏览器扩展快速开始</a>
          <a href="/desktop/install">桌面端安装</a>
          <a href="/mobile/install">Android 安装</a>
        </nav>
      </section>

      <section class="home-path" aria-labelledby="home-path-connect">
        <div class="home-path__copy">
          <h3 id="home-path-connect">同步与连接</h3>
          <p>区分 WebDAV 备份、Cloud 连接和移动端媒体源。</p>
        </div>
        <nav class="home-path__links" aria-label="同步与连接指南">
          <a href="/guide/webdav-sync">WebDAV 备份</a>
          <a href="/cloud/connections">连接 Cloud</a>
          <a href="/mobile/sources">Android 媒体源</a>
        </nav>
      </section>

      <section class="home-path" aria-labelledby="home-path-media">
        <div class="home-path__copy">
          <h3 id="home-path-media">媒体库与播放</h3>
          <p>整理浏览记录，或在客户端扫描媒体并播放。</p>
        </div>
        <nav class="home-path__links" aria-label="媒体库与播放指南">
          <a href="/guide/data-management">扩展数据管理</a>
          <a href="/desktop/local-library">桌面端本地媒体库</a>
          <a href="/mobile/playback">Android 播放</a>
        </nav>
      </section>

      <section class="home-path" aria-labelledby="home-path-subtitles">
        <div class="home-path__copy">
          <h3 id="home-path-subtitles">字幕处理</h3>
          <p>了解 JavScribe 客户端和服务端的不同使用方式。</p>
        </div>
        <nav class="home-path__links" aria-label="字幕处理指南">
          <a href="/javscribe/workbench">字幕客户端</a>
          <a href="/javscribe/deployment">服务端部署</a>
        </nav>
      </section>

      <section class="home-path" aria-labelledby="home-path-help">
        <div class="home-path__copy">
          <h3 id="home-path-help">排查问题</h3>
          <p>从对应产品的常见问题和排错步骤继续。</p>
        </div>
        <nav class="home-path__links" aria-label="排查问题指南">
          <a href="/guide/faq">扩展常见问题</a>
          <a href="/cloud/troubleshooting">Cloud 排错</a>
          <a href="/javscribe/faq">字幕常见问题</a>
        </nav>
      </section>
    </div>
  </section>

  <nav class="home-secondary" aria-label="更多文档与支持">
    <a href="/download/#cloud-deploy">Cloud 部署</a>
    <a href="/reference/features">功能总览</a>
    <a href="/reference/changelog">版本发布</a>
    <a href="/developer/">开发文档</a>
    <a href="https://github.com/JavdBviewed/JavdBviewed" target="_blank" rel="noopener noreferrer">GitHub</a>
    <a href="https://github.com/JavdBviewed/JavdBviewed/issues" target="_blank" rel="noopener noreferrer">问题反馈</a>
  </nav>
</template>

<style scoped>
.home-paths {
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 30px;
}

.home-paths__kicker {
  margin: 0 0 6px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 700;
}

.home-paths__heading h2 {
  margin: 0;
  border: 0;
  padding: 0;
  color: var(--vp-c-text-1);
  font-size: 26px;
  line-height: 1.4;
  letter-spacing: 0;
}

.home-paths__list {
  margin-top: 22px;
}

.home-path {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  align-items: center;
  column-gap: 36px;
  min-width: 0;
  border-top: 1px solid var(--vp-c-divider);
  padding: 19px 0;
}

.home-path__copy { min-width: 0; }

.home-path h3 {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 17px;
  line-height: 1.4;
}

.home-path p {
  margin: 6px 0 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.65;
}

.home-path__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  min-width: 0;
}

.home-path__links a {
  display: inline-block;
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
  overflow-wrap: anywhere;
  text-decoration: none;
}

.home-path__links a:hover,
.home-secondary a:hover { text-decoration: underline; }

.home-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin: 24px 0 4px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 20px;
}

.home-secondary a {
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.home-paths a:focus-visible,
.home-secondary a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .home-path { grid-template-columns: minmax(0, 1fr); row-gap: 10px; }
  .home-paths__heading h2 { font-size: 23px; }
}

@media (max-width: 400px) {
  .home-path__links { gap: 7px 14px; }
  .home-path__links a { font-size: 13px; }
}

@media (prefers-reduced-motion: reduce) {
  .home-paths a,
  .home-secondary a { transition: none; }
}
</style>
