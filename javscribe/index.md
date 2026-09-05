# JavScribe 字幕服务

JavScribe 是 JavdBviewed 系列下的**日语→中文字幕生成组件**：ja→zh 一步翻译（ASR+翻译合一）、
`.zh.srt` 原位落位、下载目录监听、进度查询、远端只传音频处理。

> **JavScribe 仓库只含代码与配置，不内置任何模型权重。** 需要什么模型、去哪下载、放到哪里，
> 见 [部署指南](./deployment)。

## 它解决什么问题

影片（BT/PT 下载、网盘落地等）进库后通常没有中文字幕。JavScribe 把这条链路自动化：

```
 下载落盘目录 (mkv/ts/mp4/...)
      │  目录监听（文件大小稳定才接手，避免半截下载）
      ▼
 JavScribe 流水线
   ├─ 预检: 已有 <影片名>.zh.srt → 跳过
   ├─ [可选] JASNA 马赛克修复
   ├─ 字幕引擎: ChickenRice「海南鸡」Whisper (ja→zh 一步到位, CTranslate2, CUDA/CPU)
   ├─ 落位: <影片名>.zh.srt 写到影片同目录 → Emby/Jellyfin/Plex 扫描即用
   ├─ [可选] LLM 润色第二遍 (任意 OpenAI 兼容端点)
   └─ [可选] Emby Refresh API 联动
      │
      ▼
 进度接口 /health /jobs (HTTP)  +  远端处理: 只传音频(30~80MB)，不传整片
```

## 特性

- **一步 ja→zh**：直接用「海南鸡」（TransWithAI ChickenRice）日转中专用模型 + 为这类素材调过的 VAD，不经过「通用 ASR + LLM」两遍
- **媒体库友好**：输出固定 `<影片名>.zh.srt`（可配 ja/en/none），与影片同目录；Emby/Jellyfin/Plex 自动挂载，多分卷按各自基名匹配
- **下载目录监听**：文件大小稳定检测（下载未完成不接手）、存量文件可一次追平、已生成字幕自动跳过
- **进度可见**：进度精确到影片时间轴（"已翻到 47:12 / 共 150:20"），HTTP 接口随时查询；批量一次加载模型
- **本地 / 服务器一套代码**：一份配置两份 `profiles`（`--profile local|server`）——本地 GUI 拖拽批处理或 `watch` 常驻；服务器 `serve` 常驻 + 进度接口，Docker 一条命令起
- **远端处理**：本地算力不够时，`jav-scribe upload 影片.mkv --remote http://<服务器>:8300` → 本地 ffmpeg 只抽 16kHz opus 音频（2.5h 影片约 30–80MB）上传 → 服务器跑完 → SRT 回传落到本地影片同目录
- **Web 工作台**：浏览器看板看进度、页面生成字幕（浏览器本地提音轨、只把音轨发给服务）、批量文件夹扫描入队、页面上管理服务端设置项

## 两个组件

| 组件 | 跑在哪 | 端口 | 职责 |
|---|---|---|---|
| 字幕服务（JavScribe `serve`） | GPU 服务器 | 8300 | 目录监听、ASR 生成、进度/上传/设置/扫描 API |
| 字幕工作台（JavScribe-Web） | 任意一台内网机器（可与服务同机） | 8400 | 聚合 N 个服务的看板、页面生成字幕、下载 srt、管理服务设置 |

工作台是**无状态聚合器**：任务状态以服务内存为准，工作台只持久化服务登记表（数据卷，含各服务的 API Key）。

## 与 JavdBviewed 的关系

- JavScribe 产出的 `.zh.srt` 落在影片同目录，Emby 扫描后即可在看片端直接使用；
  配置了 `emby` 段的服务会在每个任务完成后自动触发 Emby Refresh
- 也可以完全脱离 JavdBviewed 独立使用（Jellyfin/Plex 或纯目录消费）
- 代码与许可：JavScribe 本体 MIT；仓库 [github.com/JavdBviewed/JavScribe](https://github.com/JavdBviewed/JavScribe)

## 下一步

- 第一台 GPU 服务器怎么部署 → [部署指南](./deployment)
- 浏览器工作台怎么用（上传 / 文件夹 / 扫描 / 设置）→ [字幕工作台](./workbench)
- 接口清单与安全边界 → [API 参考](./api)

![字幕工作台界面预览](./web-ui.png)
