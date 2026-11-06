# 产品与服务关系

JavdBviewed 文档覆盖五种面向用户的产品：浏览器扩展、Windows 桌面端、Android 客户端、自建 Cloud 与 JavScribe 字幕工具。它们可以按需要组合使用，**不要求安装全套**。从[文档首页](/)选择适合设备和任务的入口。

| 产品 | 你在哪里使用 | 主要职责 | 使用指南 |
| --- | --- | --- | --- |
| 浏览器扩展 | Chromium 浏览器 | 在支持的网页标记与整理记录；按需连接 Emby、Jellyfin、115 等媒体来源 | [扩展指南](/guide/) |
| Windows 桌面端 | Windows x64 电脑 | 扫描本地影片、整理媒体库，或直接连接媒体服务播放 | [桌面端指南](/desktop/) |
| Android 客户端 | Android 设备 | 配置媒体来源、浏览与播放；以可获取的公开版本为准 | [Android 指南](/mobile/) |
| JavdBviewed-Cloud | 你自行部署的服务 | 在支持的客户端之间同步记录和设置，管理连接设备 | [Cloud 指南](/cloud/) |
| JavScribe | 本地电脑或自部署的字幕工作台与推理服务 | 从影片提取音轨、生成和写回字幕；不充当播放器或 Cloud 同步服务 | [字幕工具指南](/javscribe/) |

## 连接时分清地址和数据

- **同步记录：**需要跨设备使用支持的记录时，可[自行部署 Cloud](/cloud/deployment)，并按[设备连接指南](/cloud/connections)配置可达的 Cloud 地址。扩展还提供独立的 [WebDAV 备份与恢复](/guide/webdav-sync)；它不是 Cloud 服务的别名。
- **浏览或播放影片：**Emby、Jellyfin 和 115 是各自的媒体来源；客户端仍需访问相应的服务器或账号。Cloud 同步记录或媒体源配置，不会因此托管、上传或直接提供影片文件。扩展的[媒体库](/guide/media-library)和桌面端[本地扫描](/desktop/local-library)也不是同一入口。
- **处理字幕：**JavScribe 有用户侧工作台和字幕推理服务两种角色，扫描目录的位置取决于使用本机客户端还是部署机上的 Web 工作台；按[JavScribe 工作台说明](/javscribe/workbench)选择，不要把 Cloud 或 JavdBviewed-Server 当成字幕推理服务。

## Cloud 与开发方 Server

**JavdBviewed-Cloud** 是用户可以自建的服务，保存该实例内的账号、连接设备及支持的同步数据。实例运营者负责访问控制和数据备份；升级时须连同数据库保存 `vault.key`，详情见 [Cloud 备份与升级](/cloud/backup-upgrade)。

**JavdBviewed-Server** 是开发方使用的遥测与配置运维后台，**不是 Cloud 的替代安装包、媒体服务器或用户必须部署的组件**。已发布扩展实现启动、心跳与受限错误遥测；已发布 Cloud 实现低频实例健康上报。这些上报与用户自建 Cloud 内的业务记录同步是不同的数据流。具体字段及适用产品见[数据与隐私说明](/reference/privacy-policy)；不要将开发方 Server 地址填进 Cloud、Emby 或 WebDAV 的连接表单。

本页不提供开发方 Server 的管理员入口、部署方法或内部接口。需要了解扩展源码结构，可从[开发文档](/developer/)和[架构说明](/developer/architecture)继续阅读；安装与发布状态则以各产品[下载中心](/download/)及对应公开发布说明为准。
