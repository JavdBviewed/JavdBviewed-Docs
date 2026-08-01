<template>
  <section class="home-dashboard" aria-labelledby="home-dashboard-title">
    <div class="home-dashboard__content">
      <p class="home-dashboard__kicker">浏览、记录、整理</p>
      <h1 id="home-dashboard-title">JavdBviewed</h1>
      <p class="home-dashboard__summary">让影片浏览、记录与整理更顺手。</p>
      <p class="home-dashboard__description">
        在浏览器内管理影片状态、清单和常用资源；按需要连接网盘、媒体库与同步服务。
      </p>
      <div class="home-dashboard__actions" aria-label="开始使用 JavdBviewed">
        <a class="home-dashboard__action home-dashboard__action--primary" href="/download/">安装扩展</a>
        <a class="home-dashboard__action home-dashboard__action--secondary" href="/guide/quick-start">快速开始</a>
      </div>
    </div>
    <figure class="home-dashboard__preview">
      <img
        src="/home-dashboard.png"
        alt="JavdBviewed Dashboard 总览"
        width="1440"
        height="900"
        decoding="async"
      >
      <figcaption>浏览器扩展 Dashboard 总览</figcaption>
    </figure>
  </section>
</template>

<style scoped>
.home-dashboard {
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
  align-items: center;
  gap: clamp(28px, 5vw, 72px);
  margin: 48px 0 68px;
}

.home-dashboard__content {
  min-width: 0;
}

.home-dashboard__kicker {
  margin: 0 0 14px;
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 700;
}

.home-dashboard h1 {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: clamp(40px, 5vw, 64px);
  line-height: 1.08;
  letter-spacing: 0;
}

.home-dashboard__summary {
  margin: 16px 0 0;
  color: var(--vp-c-text-1);
  font-size: clamp(21px, 2.4vw, 30px);
  font-weight: 650;
  line-height: 1.36;
}

.home-dashboard__description {
  max-width: 460px;
  margin: 16px 0 0;
  color: var(--vp-c-text-2);
  font-size: 16px;
  line-height: 1.7;
}

.home-dashboard__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.home-dashboard__action {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
}

.home-dashboard__action--primary {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

.home-dashboard__action--primary:hover {
  border-color: var(--vp-c-brand-2);
  background: var(--vp-c-brand-2);
  color: var(--vp-c-white);
}

.home-dashboard__action--secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.home-dashboard__action--secondary:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.home-dashboard__action:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}

.home-dashboard__preview {
  min-width: 0;
  margin: 0;
}

.home-dashboard__preview img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  object-fit: cover;
  object-position: top center;
  box-shadow: 0 18px 42px color-mix(in srgb, var(--vp-c-text-1) 10%, transparent);
}

.home-dashboard__preview figcaption {
  margin-top: 9px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  text-align: right;
}

@media (max-width: 840px) {
  .home-dashboard {
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
    margin-top: 36px;
  }

  .home-dashboard__description {
    max-width: 620px;
  }
}

@media (max-width: 480px) {
  .home-dashboard {
    margin-bottom: 48px;
  }

  .home-dashboard__actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .home-dashboard__action {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-dashboard__action {
    transition: none;
  }
}
</style>
