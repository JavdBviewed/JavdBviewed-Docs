<template>
  <section class="home-dashboard" aria-labelledby="home-dashboard-title">
    <div class="home-dashboard__intro">
      <div class="home-dashboard__content">
        <p class="home-dashboard__kicker">产品与使用指南</p>
        <h1 id="home-dashboard-title">JavdBviewed 文档中心</h1>
        <p class="home-dashboard__summary">从正在使用的产品开始。</p>
        <p class="home-dashboard__description">
          浏览器扩展、桌面与 Android 客户端、Cloud 和字幕工具的安装与使用文档。
          按产品查找连接、整理媒体和排查问题的方法。
        </p>
        <div class="home-dashboard__actions" aria-label="文档入口">
          <a class="home-dashboard__action home-dashboard__action--primary" href="/start/">选择产品</a>
          <a class="home-dashboard__action home-dashboard__action--secondary" href="/download/">查看下载</a>
        </div>
      </div>

      <nav class="home-dashboard__products" aria-labelledby="home-products-title">
        <h2 id="home-products-title">选择使用的产品</h2>
        <ul>
          <li>
            <a href="/guide/">
              <span class="home-dashboard__product-name">浏览器扩展</span>
              <span class="home-dashboard__product-description">在 JavDB 页面记录影片与管理清单</span>
            </a>
          </li>
          <li>
            <a href="/desktop/">
              <span class="home-dashboard__product-name">桌面端</span>
              <span class="home-dashboard__product-description">扫描本地目录，整理与播放媒体</span>
            </a>
          </li>
          <li>
            <a href="/mobile/">
              <span class="home-dashboard__product-name">Android</span>
              <span class="home-dashboard__product-description">连接媒体源，在手机上播放与管理</span>
            </a>
          </li>
          <li>
            <a href="/cloud/">
              <span class="home-dashboard__product-name">Cloud</span>
              <span class="home-dashboard__product-description">部署自有服务，连接与同步数据</span>
            </a>
          </li>
          <li>
            <a href="/javscribe/">
              <span class="home-dashboard__product-name">JavScribe</span>
              <span class="home-dashboard__product-description">处理字幕任务，了解客户端与服务端</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <div class="home-dashboard__extension">
      <div class="home-dashboard__extension-content">
        <h2>从浏览器扩展开始</h2>
        <p>在 JavDB 页面记录影片、整理清单，按需连接其他服务。</p>
        <div class="home-dashboard__extension-links">
          <a href="/download/">安装扩展</a>
          <a href="/guide/quick-start">快速开始</a>
        </div>
      </div>
      <figure class="home-dashboard__preview">
        <a href="/extension-v2.1.3/dashboard.png" target="_blank" rel="noopener" aria-label="打开浏览器扩展 v2.1.3 仪表盘原图">
          <img
            src="/extension-v2.1.3/dashboard.png"
            alt="浏览器扩展 v2.1.3 仪表盘：顶部导航与空态数据概览"
            width="1440"
            height="1569"
            decoding="async"
          >
        </a>
        <figcaption>v2.1.3 源码本地测试界面 · 隔离测试数据（空态）· 非发布包实拍；Unknown 表示离线时未能检查更新，点击图片查看原图</figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.home-dashboard { margin: 32px 0 48px; }
.home-dashboard__intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
  align-items: start;
  gap: clamp(28px, 4vw, 64px);
}
.home-dashboard__content, .home-dashboard__products { min-width: 0; }
.home-dashboard__content { padding: 40px 0 24px; }
.home-dashboard__kicker {
  margin: 0 0 16px;
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 700;
}
.home-dashboard h1 {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 48px;
  line-height: 1.22;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}
.home-dashboard__summary {
  margin: 24px 0 0;
  color: var(--vp-c-text-1);
  font-size: 26px;
  font-weight: 650;
  line-height: 1.42;
}
.home-dashboard__description {
  max-width: 42ch;
  margin: 14px 0 0;
  color: var(--vp-c-text-2);
  font-size: 16px;
  line-height: 1.75;
}
.home-dashboard__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}
.home-dashboard__action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 0 18px;
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: border-color 160ms ease, background-color 160ms ease;
}
.home-dashboard__action--primary {
  border-color: var(--vp-c-brand-3);
  background: var(--vp-c-brand-3);
  color: var(--vp-c-white);
}
.home-dashboard__action--primary:hover {
  border-color: var(--vp-button-brand-hover-bg);
  background: var(--vp-button-brand-hover-bg);
  color: var(--vp-c-white);
}
.home-dashboard__action--secondary:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.home-dashboard__products {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 18px 22px 8px;
  background: var(--vp-c-bg);
}
.home-dashboard__products h2 {
  margin: 0 0 8px;
  border: 0;
  padding: 0;
  color: var(--vp-c-text-1);
  font-size: 17px;
  line-height: 1.5;
}
.home-dashboard__products ul { margin: 0; padding: 0; list-style: none; }
.home-dashboard__products li + li { border-top: 1px solid var(--vp-c-divider); }
.home-dashboard__products a {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 12px;
  align-items: baseline;
  min-width: 0;
  padding: 12px 0;
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.home-dashboard__products a::after {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--vp-c-brand-1);
  content: '→';
}
.home-dashboard__products a:hover .home-dashboard__product-name { color: var(--vp-c-brand-1); }
.home-dashboard__product-name { min-width: 0; font-size: 15px; font-weight: 700; }
.home-dashboard__product-description {
  grid-column: 1;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.home-dashboard__extension {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: clamp(24px, 4vw, 48px);
  margin-top: 40px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 32px;
}
.home-dashboard__preview { min-width: 0; margin: 0; }
.home-dashboard__preview a { display: block; }
.home-dashboard__preview img {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
}
.home-dashboard__preview figcaption {
  margin-top: 8px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.5;
}
.home-dashboard__extension-content { min-width: 0; }
.home-dashboard__extension h2 {
  margin: 0;
  border: 0;
  padding: 0;
  color: var(--vp-c-text-1);
  font-size: 22px;
  line-height: 1.4;
}
.home-dashboard__extension p {
  margin: 12px 0 20px;
  color: var(--vp-c-text-2);
  font-size: 15px;
  line-height: 1.7;
}
.home-dashboard__extension-links { display: flex; flex-wrap: wrap; gap: 8px 18px; }
.home-dashboard__extension-links a {
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}
.home-dashboard__extension-links a:hover { text-decoration: underline; }
.home-dashboard a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}
@media (max-width: 840px) {
  .home-dashboard__intro { grid-template-columns: minmax(0, 1fr); gap: 22px; }
  .home-dashboard__content { padding: 0; }
  .home-dashboard__products { padding: 16px 18px 6px; }
  .home-dashboard__extension { grid-template-columns: minmax(0, 1fr); gap: 22px; }
}
@media (max-width: 480px) {
  .home-dashboard { margin-top: 24px; }
  .home-dashboard__summary { margin-top: 14px; }
  .home-dashboard__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 20px;
  }
  .home-dashboard__action { padding: 0 10px; }
  .home-dashboard__extension { margin-top: 28px; padding-top: 24px; }
}
@media (prefers-reduced-motion: reduce) {
  .home-dashboard__action { transition: none; }
}
</style>
