# 已发布功能范围

各产品的能力不能从浏览器扩展的功能清单推断。本页按已核实的正式 Release、发布说明和对应版本源码划分；是否能下载安装以[下载与更新](/download/)所列公开资产为准。

| 产品 | 本页核对基准 | 入口 |
| --- | --- | --- |
| 浏览器扩展 | 源仓正式 Release `v2.1.3` | [扩展指南](/guide/) |
| Windows 桌面端 | `desktop-v1.0.0`，Windows x64 安装包 | [桌面端指南](/desktop/) |
| Android | 已核可获取 `mobile-v39` / `1.0.2` 安装包 | [Android 指南](/mobile/) |
| JavdBviewed-Cloud | 已核正式版 `1.2.9` | [Cloud 指南](/cloud/) |
| JavScribe | 客户端 `client-v0.2.66` 已公开；服务端发布状态独立核对 | [字幕工具指南](/javscribe/) |

## 浏览器扩展

- **网页与记录：**在支持的站点对影片标记「已浏览 / 已看 / 想看」，在[番号库与清单](/guide/data-management)整理记录，在[演员管理](/guide/actor-management)收藏、订阅或过滤演员；可使用[新作品监控](/guide/new-works)及[数据分析与报告](/guide/data-insights)。
- **页面增强：**列表与详情页显示状态、预览及信息增强；磁力搜索、[AI 翻译](/guide/ai-translation)和[隐私保护](/guide/privacy-protection)分别按设置启用，具体入口见[设置导航](/guide/settings-index)。
- **115：**在 `设置 → 115网盘` 完成 v2 授权后，可在详情页推送磁力、管理 115 任务；可配置片库目录供扩展媒体库索引。授权与离线任务见 [115 指南](/guide/115-drive)。
- **媒体库：**从 Emby、Jellyfin 和 115 同步扩展本地索引，按来源与状态浏览、在可取流时播放；不扫描本机文件。见[扩展媒体库](/guide/media-library)及[Emby 联动](/guide/emby-integration)。
- **备份与记录同步：**本地导入导出、[WebDAV 备份与恢复](/guide/webdav-sync)和[自建 Cloud 记录同步](/guide/cloud-sync)属于不同流程；Cloud 不代替媒体文件存储。历史跨扩展 ID 升级另见[数据迁移](/guide/upgrade-v2)。

## Windows 桌面端

`desktop-v1.0.0` 公开安装包适用于 **Windows x64**；未核实 macOS、Linux 的对应稳定安装包。

- [本地媒体库](/desktop/local-library)：添加或重扫本地目录，识别视频与番号，按已配置引擎刮削元数据，确认后入库并按番号去重。
- [播放与媒体源](/desktop/sources)：本地播放进度同步，看完标记为真实已看；Emby 等媒体源支持直连播放。媒体文件本身不是 Cloud 同步的记录。
- [更新](/desktop/updates)：内置更新检查**默认关闭**，需按客户端说明启用，不能当作默认自动升级功能。安装步骤见[桌面端安装](/desktop/install)。

## Android

目前已核实公开可获取的安装包为 `mobile-v39` / `1.0.2`；这是原生 Android 客户端，不是在手机浏览器中加载的扩展。已有媒体源入口、媒体库与播放器；按[安装与设备架构](/mobile/install)、[添加媒体源](/mobile/sources)、[播放](/mobile/playback)和[媒体库](/mobile/library)分别操作。播放是否可用取决于媒体源授权与设备支持。

`mobile-v42` / `1.0.3` 的发布说明与源码列出「全部影片」聚合已有视频文件的本地下载源；剧集、继续看、最新入口不包含这些内容。但核对时该版本的公开 Release / APK 不可获取，**不能将这一变更作为当前可下载安装的 `1.0.2` 能力**；待公开安装包核实后再按对应版本说明使用。

客户端仓中的 TV 骨架不是已公开可用产品；不提供 TV 下载入口。

## 自建 Cloud

正式版 `1.2.9` 提供设备连接、支持的记录与设置同步、管理台数据与快照、扫描状态检查；客户端仍需自行连接实际媒体源，Cloud 不会上传视频文件。参阅[部署](/cloud/deployment)及[连接设备](/cloud/connections)。

升级 `1.2.9` 前备份完整数据目录和部署配置；数据库与 `vault.key` 必须一起保存。升级后登录管理台一次以迁移旧会话；旧版不能读取 v2 密文，回退应使用升级前完整备份。详见[备份、升级与回滚](/cloud/backup-upgrade)。

## JavScribe 字幕工具

JavScribe 的客户端工作台和推理服务是**不同组件、分别发布**：客户端 `client-v0.2.66` 的公开 Release 已核实；`serve-v0.2.16` 仅有源码 tag，不能据此承诺现成安装包。公开服务端 `serve-v0.2.15` 是预发布版本，不应称稳定版；下载前在[项目 Releases](https://github.com/JavdBviewed/JavScribe/releases)核对具体状态。

已发布的客户端工作台可查看字幕任务与进度、从本地或部署机选取影片并提取音轨；服务端接收音轨、运行字幕生成并返回字幕。它不是视频播放器，也不随 Cloud 自动安装。操作与服务依赖见[工作台](/javscribe/workbench)、[部署](/javscribe/deployment)和[常见问题](/javscribe/faq)。
