# JavdBviewed 项目概览

JavdBviewed 文档中心覆盖浏览器扩展、Windows 桌面端、Android 客户端、自建 Cloud 服务和 JavScribe 字幕工具。它们各有安装方式和使用范围；先从[选择产品](/start/)找到对应指南，不要把扩展的浏览器操作直接套用到客户端。

## 产品与用途

| 产品 | 主要用途 | 从哪里开始 |
| --- | --- | --- |
| 浏览器扩展 | 在受支持的网页标记影片，整理番号、演员与清单，并使用页面增强、115 任务及扩展媒体库 | [扩展使用指南](/guide/) |
| Windows 桌面端 | 在 Windows x64 上扫描本地影片目录、整理媒体库，也可连接媒体服务 | [桌面端指南](/desktop/) |
| Android 客户端 | 在 Android 设备上连接媒体源、浏览及播放 | [Android 指南](/mobile/) |
| JavdBviewed-Cloud | 自行部署的服务，供支持的客户端连接及同步记录；不等于把影片上传到 Cloud | [Cloud 部署与连接](/cloud/) |
| JavScribe | 独立的字幕生成与处理工具，区分客户端工作台与服务端 | [JavScribe 指南](/javscribe/) |

浏览器扩展的 [WebDAV 备份](/guide/webdav-sync)与[自建 Cloud 记录同步](/guide/cloud-sync)是不同功能。扩展[媒体库](/guide/media-library)索引 Emby、Jellyfin 和 115 来源；桌面端[本地媒体库扫描](/desktop/local-library)读取设备上的影片文件，不能用同一套步骤操作。

JavdBviewed-Server 是开发方使用的配置、遥测等运维服务，**不是**使用扩展或客户端时必须自行安装的同步服务。需要自己的记录同步服务时，应查看 [JavdBviewed-Cloud](/cloud/)；产品之间的职责另见[产品与服务关系](/developer/ecosystem)。

## 下载与发布来源

- **浏览器扩展**：从 [JavdBviewed 源仓 Releases](https://github.com/JavdBviewed/JavdBviewed/releases) 选择正式扩展 ZIP，按对应发布说明安装；操作见[快速开始](/guide/quick-start)。不要在集中发布仓寻找扩展安装包。
- **Windows 桌面端、Android、Cloud**：在 [JavdBviewed 集中发布仓 Releases](https://github.com/JavdBviewed/JavdBviewed-release/releases) 分别查找对应产品的发布。桌面端公开安装形态为 Windows x64；Android 下载时需按可获取的公开 Release 和设备架构选择 APK，不能只凭版本清单推定安装包已可下载。
- **JavScribe**：到 [JavScribe 自身仓库 Releases](https://github.com/JavdBviewed/JavScribe/releases) 分别核对客户端与服务端的公开发布状态；源码 tag 不等于现成安装包。

按产品查看已核对的下载入口和安装说明，请使用[下载与更新](/download/)。Cloud 的已核实稳定版为 `1.2.9`；升级前需将数据库所在的完整数据目录与 `vault.key` **一起备份**。升级后首次登录可能迁移旧会话，回退旧版不能读取 v2 密文，具体步骤见[Cloud 备份与升级](/cloud/backup-upgrade)。

## 常用入口

- [选择产品与首次使用](/start/)：按设备和任务找到正确的安装路径。
- [浏览器扩展快速开始](/guide/quick-start)：安装扩展并确认基础标记功能。
- [功能总览](/reference/features)：按产品核对能力边界。
- [版本发布](/reference/changelog)：查看版本记录及发布说明。
- [隐私政策](/reference/privacy-policy)：了解文档适用范围及数据处理说明。
- [开发文档](/developer/)与[二次开发指南](/developer/development)：阅读源码结构及开发说明。
