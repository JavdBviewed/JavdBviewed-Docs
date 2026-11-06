# JavdBviewed 文档站

本仓库是 JavdBviewed 系列产品的 VitePress 文档站源码。按使用的产品选择对应指南，不要将浏览器扩展的操作步骤套用到桌面端或 Android。

## 文档入口

- [选择产品](index.md)：按设备与用途找到首次使用路径。
- [浏览器扩展](guide/index.md)：网页标记、记录整理、媒体库及扩展设置。
- [Windows 桌面端](desktop/index.md)：安装、本地媒体库和媒体源。
- [Android](mobile/index.md)：安装、连接媒体源和播放。
- [自建 Cloud](cloud/index.md)：部署、连接、备份与排查。
- [JavScribe 字幕工具](javscribe/index.md)：字幕处理工作台和服务端。

各产品的公开版本和安装资产可能不同；下载前请查阅[版本发布](reference/changelog.md)及对应产品的正式 Release。

## 本地开发

```bash
pnpm install
pnpm run dev
```

## 校验与预览

```bash
pnpm run test
pnpm run build
pnpm run check:links
pnpm run preview
```

`check:links` 检查构建产物，须在 `build` 之后运行。文档源码位于仓库根目录，构建输出目录为 `.vitepress/dist/`。

## 内容目录

- 产品使用说明放在 `guide/`、`desktop/`、`mobile/`、`cloud/` 和 `javscribe/`。
- 功能总览、版本记录与隐私说明放在 `reference/`；这部分内容包含从旧版功能与隐私文档迁移的资料。
- 源码结构与二次开发说明放在 `developer/`。

## 维护建议

- 保持产品指南分区，链接到现有页面；新增产品功能前核对对应版本的公开发布。
- 面向用户的总览放在 `reference/`，面向开发者的说明放在 `developer/`。
