<template>
  <section class="home-paths" aria-labelledby="home-paths-title">
    <div class="home-paths__heading">
      <p class="home-paths__kicker">按目标开始</p>
      <h2 id="home-paths-title">从你现在最需要的地方进入</h2>
    </div>
    <div class="home-paths__grid">
      <a class="home-path home-path--start" href="/guide/quick-start">
        <span class="home-path__marker" aria-hidden="true"></span>
        <h3>开始使用</h3>
        <p>安装扩展，完成首次配置，并在 JavDB 页面上开始记录。</p>
        <span class="home-path__link">查看快速开始</span>
      </a>
      <a class="home-path home-path--connect" href="/guide/webdav-sync">
        <span class="home-path__marker" aria-hidden="true"></span>
        <h3>同步与连接</h3>
        <p>配置 WebDAV、115、Emby/Jellyfin 等服务，让数据和资源保持可用。</p>
        <span class="home-path__link">查看同步说明</span>
      </a>
      <a class="home-path home-path--library" href="/guide/data-management">
        <span class="home-path__marker" aria-hidden="true"></span>
        <h3>影片整理与媒体库</h3>
        <p>管理状态、清单、演员和新作品，把日常浏览逐步整理成自己的资料库。</p>
        <span class="home-path__link">查看数据管理</span>
      </a>
    </div>
  </section>

  <section class="home-capabilities" aria-labelledby="home-capabilities-title">
    <div>
      <p class="home-capabilities__kicker">更多能力</p>
      <h2 id="home-capabilities-title">按需要扩展你的使用方式</h2>
    </div>
    <p>
      页面增强、磁力搜索、演员订阅、AI 翻译和数据分析等功能，都可以在完成基础配置后按需要启用。
    </p>
    <a href="/reference/features">浏览功能总览</a>
  </section>

  <nav class="home-secondary" aria-label="更多 JavdBviewed 入口">
    <a href="/download/#cloud-deploy">Cloud 部署</a>
    <a href="/reference/changelog">版本发布</a>
    <a href="/developer/">开发文档</a>
    <a href="https://github.com/JavdBviewed/JavdBviewed" target="_blank" rel="noreferrer">GitHub</a>
    <a href="https://github.com/JavdBviewed/JavdBviewed/issues" target="_blank" rel="noreferrer">问题反馈</a>
  </nav>
</template>

<style scoped>
.home-paths {
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 32px;
}

.home-paths__heading h2,
.home-capabilities h2 {
  margin: 0;
  border: 0;
  padding: 0;
  color: var(--vp-c-text-1);
  font-size: clamp(23px, 2.8vw, 32px);
  line-height: 1.3;
  letter-spacing: 0;
}

.home-paths__kicker,
.home-capabilities__kicker {
  margin: 0 0 8px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 700;
}

.home-paths__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 22px;
}

.home-path {
  display: flex;
  min-width: 0;
  min-height: 218px;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 160ms ease, transform 160ms ease;
}

.home-path:hover {
  border-color: var(--home-path-accent);
  color: var(--vp-c-text-1);
  transform: translateY(-2px);
}

.home-path:focus-visible,
.home-capabilities a:focus-visible,
.home-secondary a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}

.home-path--start { --home-path-accent: #3971b7; }
.home-path--connect { --home-path-accent: #16836f; }
.home-path--library { --home-path-accent: #c47d16; }

.home-path__marker {
  display: block;
  width: 30px;
  height: 3px;
  background: var(--home-path-accent);
}

.home-path h3 {
  margin: 18px 0 8px;
  color: var(--vp-c-text-1);
  font-size: 18px;
}

.home-path p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.65;
}

.home-path__link {
  margin-top: auto;
  padding-top: 18px;
  color: var(--home-path-accent);
  font-size: 13px;
  font-weight: 700;
}

.home-capabilities {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr) auto;
  align-items: end;
  gap: 24px;
  margin-top: 68px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 30px;
}

.home-capabilities p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.7;
}

.home-capabilities a,
.home-secondary a {
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.home-capabilities a:hover,
.home-secondary a:hover {
  color: var(--vp-c-brand-2);
  text-decoration: underline;
}

.home-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin: 34px 0 4px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 20px;
}

.home-secondary a {
  color: var(--vp-c-text-2);
  font-size: 13px;
}

@media (max-width: 760px) {
  .home-paths__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .home-path {
    min-height: 0;
  }

  .home-capabilities {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    margin-top: 52px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-path {
    transition: none;
  }
}
</style>
