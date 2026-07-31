# 文档站说明

本仓库是 JavdBviewed 的 `VitePress` 文档站源码。

## 本地开发

```bash
pnpm install
pnpm run dev
```

## 构建与预览

```bash
pnpm run build
pnpm run preview
```

文档源码位于仓库根目录，构建输出目录为 `.vitepress/dist/`。

## 文档迁移范围

- 根目录 `README.md` 中适合进入文档中心的技术说明
- `FEATURES.md` 功能总览
- `PRIVACY_POLICY.md` 隐私政策
- `src/` 下部分模块级技术 README

## 维护建议

- 用户面向内容优先放在 `guide/`
- 汇总/制度类内容放在 `reference/`
- 面向开发者的说明放在 `developer/`
