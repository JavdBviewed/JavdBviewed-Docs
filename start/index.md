# 从这里开始

JavdBviewed 有浏览器扩展、Windows 桌面端、Android 应用和自建 Cloud；JavScribe 是另行部署的字幕工具。按你要使用的设备和任务选入口，不需要把所有组件都装一遍。

| 你想做什么 | 从哪里开始 | 下一步 |
| --- | --- | --- |
| 在浏览器中管理作品记录、使用网页增强 | [浏览器扩展](#浏览器扩展) | [扩展快速上手](/guide/quick-start) |
| 整理 Windows 电脑上的视频，连接媒体服务器播放 | [Windows 桌面端](#windows-桌面端) | [本地影片整理](/desktop/local-library) |
| 在 Android 手机上浏览媒体源、播放或下载 | [Android 应用](#android-应用) | [连接媒体源](/mobile/sources) |
| 让自己的设备连接同一数据中枢 | [Cloud](#自建-cloud) | [连接设备](/cloud/connections) |
| 为影片生成中文字幕 | [JavScribe](#javscribe-字幕工具) | [字幕工作台](/javscribe/workbench) |

所有产品的下载入口集中在[下载与更新](/download/)；安装前请到相应的正式 Release 页面核对实际可获取的文件。

## 浏览器扩展

**适合**在浏览器里使用 JavdBviewed 的用户。扩展的网页功能与独立桌面、Android 应用不同，不要使用客户端安装包来安装扩展。

1. 从[扩展源仓 Releases](https://github.com/JavdBviewed/JavdBviewed/releases)查看正式发布与安装说明。已核实 v2.1.3 有正式 Release；扩展不从集中发布仓的桌面或 Android 列表下载。
2. 按发布说明完成安装，再从[扩展快速上手](/guide/quick-start)熟悉浏览器里的操作。
3. 需要跨设备共享记录时，再阅读[Cloud 部署](/cloud/deployment)和[设备连接](/cloud/connections)。不需要为了使用扩展先安装 Windows 桌面端。

## Windows 桌面端

**适合**在 Windows x64 电脑上整理本地影片，或从电脑连接自己的媒体服务器浏览和播放的用户。桌面端是独立应用，不依赖浏览器扩展。

1. 在[桌面端 1.0.0 正式发布页](https://github.com/JavdBviewed/JavdBviewed-release/releases/tag/desktop-v1.0.0)取得 Windows x64 `.exe`，按[安装与校验](/desktop/install)操作；`latest.yml` 和 `.blockmap` 不是手动安装包。
2. 本机有视频文件时，先按[本地影片整理](/desktop/local-library)添加目录、核对识别结果、刮削并确认入库。
3. 影片在 Emby、Jellyfin 等媒体服务器上时，走[媒体源与播放](/desktop/sources)；本地目录扫描与连接媒体源是两条不同入口。
4. 只有需要共享记录和配置时才连接自己部署的 Cloud，见[桌面端指南](/desktop/)与[连接设备](/cloud/connections)。

已核实的稳定安装包是 Windows x64 1.0.0；不要将源仓主分支后续功能当成这个版本已有的界面，也不要据此推定存在 macOS 或 Linux 稳定安装包。

## Android 应用

**适合**希望在 Android 手机上连接自己的 Cloud、浏览媒体源、播放或管理下载的用户。这是原生 Android 应用，不是桌面端安装包。

1. 目前已核实可获取的是[mobile-v39（1.0.2）正式发布页](https://github.com/JavdBviewed/JavdBviewed-release/releases/tag/mobile-v39)的 APK。按[安装与首次登录](/mobile/install)选择设备架构；不确定架构时选同版 universal APK，并核对同版校验文件。
2. 1.0.2 首次进入需要登录自己的 Cloud 实例。还没有实例时先看[部署 Cloud](/cloud/deployment)；Cloud 登录与媒体服务器账号是两回事。
3. 登录后依次阅读[连接媒体源](/mobile/sources)、[播放与下载](/mobile/playback)和[媒体库与本地文件](/mobile/library)。Cloud 里的记录不等于影片已下载到手机。

发布清单虽列出 1.0.3/mobile-v42，但核查时其公开 Release 与 APK 不可获取；这里不将它作为安装入口。没有已核实的 iOS 或 TV 正式下载包。

## 自建 Cloud

**适合**想让扩展、桌面和手机连接同一自建实例、管理记录与同步状态的用户。Cloud 是你自己部署的数据中枢，**不是**用来播放或托管影片的视频服务器；普通用户不需要另装开发方 Server。

1. 查看[Cloud 1.2.9 部署指南](/cloud/deployment)，准备持久化数据目录和管理员凭据，再按指南部署容器。
2. 完成登录后，从[连接设备](/cloud/connections)为实际使用的客户端填写自建实例地址；媒体源仍使用它自身的服务器地址与凭据。
3. 升级前阅读[备份与升级](/cloud/backup-upgrade)。1.2.9 的数据库和 `vault.key` 需要一起备份；镜像回滚不能替代数据恢复。

有部署或同步故障时先看[Cloud 排错](/cloud/troubleshooting)，不要公开分享管理员密码、数据快照或密钥。

## JavScribe 字幕工具

**适合**需要给影片生成中文字幕、维护字幕任务的用户。JavScribe 的客户端工作台负责选择或扫描影片、提交任务和落位字幕；独立 Serve 负责推理。Web 工作台运行在客户端部署机，桌面版则运行在用户电脑上；处理前要确认文件实际在哪台机器。

1. 先看[JavScribe 概览](/javscribe/)和[部署指南](/javscribe/deployment)，选 Web 工作台或桌面客户端，并核对 Serve 的部署条件。
2. 到[JavScribe 自有 Releases](https://github.com/JavdBviewed/JavScribe/releases)核对可下载资产。已核实 `client-v0.2.66` 有公开 Release；`serve-v0.2.16` 只核实到源码标签，不能据此承诺存在对应的现成服务端包。
3. 配好可访问的 Serve 后，按[字幕工作台](/javscribe/workbench)选择文件、提交任务并检查输出位置。Web 与桌面客户端同属 client 版本体系，没有独立 `web-v*` 标签。

如果只使用扩展、桌面端或 Android 播放影片，不需要为此安装 JavScribe，也无需安装开发方 Server。
