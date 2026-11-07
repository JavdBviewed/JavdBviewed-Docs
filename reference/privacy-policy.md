# 数据与隐私说明 / Data and Privacy

**核对日期 / Reviewed:** 2026-11-07. 本页按已核实的浏览器扩展 `v2.1.3` 和自建 Cloud `1.2.9` 说明数据流；不将扩展的存储、遥测或控制方式推断为桌面端、Android 或 JavScribe 的实现。后续版本可能变化，请以相应版本的发布说明为准。

## 中文

### 浏览器扩展：本地业务数据

扩展将观看标记、番号和演员记录、清单、设置及部分运行数据保存在浏览器本地，包括 Chrome Storage 和 IndexedDB；**并非所有数据都只存在 Chrome Storage**。本地保存不意味着绝不发送网络请求。备份文件可能包含连接配置或凭据，应当像密码一样妥善保管，不要上传到公开 Issues。

使用者主动配置或使用下列功能时，扩展会与对应服务通信：

- [WebDAV 备份与恢复](/guide/webdav-sync)会向你配置的 WebDAV 服务传输备份数据；[Cloud 记录同步](/guide/cloud-sync)会与所连接的自建 Cloud 交换扩展支持的记录和设置。两条路径相互独立，不会因浏览器本地存储而自动停止。
- [115 网盘](/guide/115-drive)、[Emby / Jellyfin 媒体库](/guide/media-library)和网页增强依赖相应的网站或媒体服务器；搜索、AI 翻译等功能在启用和使用时可能向所配置的外部服务发送完成请求所需的数据。具体发送范围取决于所选功能与服务设置。
- Cloud 同步的是支持的记录和设置，不会把本地视频文件自动上传到 Cloud；媒体服务器取流是另一条连接链路。

### 浏览器扩展：后台遥测

已发布 `v2.1.3` 的扩展实现了启动、定期心跳和受限错误上报，成功发送取决于网络和报告端点是否可用；**不能描述为“不收集或传输任何数据”**。报告字段包括安装标识、可选设备标识、事件及会话标识、扩展版本与构建号、浏览器/平台及其版本、语言和时区、活动时间与时长、功能是否启用、作品/演员/订阅等数量**区间**，以及部分设置的计数区间。这些标识和环境信息不应被称为“完全匿名”。

错误事件可包含组件、错误代码、错误类别、是否严重以及由预处理后堆栈生成的哈希；不是直接上传完整原始堆栈。所核对的遥测构造器按区间统计记录数量，不把作品标题或观看记录正文作为这些计数字段发送。**旧版设置中的 `telemetry.enabled` 不再是 `v2.1.3` 的发送门禁**；不要将关闭该旧开关写成停止上报的方法。本页不承诺未核实的遥测关闭方式、服务端实际留存期限或已发送事件可由本地删除操作撤回。

### 自建 Cloud 与其他产品

自建 Cloud `1.2.9` 在实例内保存其账号、设备、同步数据与运行信息，由实例运营者管理；Cloud 另向开发方服务发送低频实例健康上报，包括稳定实例标识、版本、健康状态与实例级设备数量，不是同步业务记录或媒体文件。**Cloud 健康上报与客户端业务数据同步是两条不同的数据流。** 升级 Cloud 时，数据库与 `vault.key` 必须一起备份和恢复；见[备份与升级](/cloud/backup-upgrade)。

本页没有核实开发方 Server 当前生产部署的保留期限，也不为桌面、Android 或 JavScribe 作“仅本地保存”“完全匿名”或“不会遥测”的统一承诺。分别阅读[产品入口](/start/)与相应产品文档。提交问题时请移除账号、令牌、备份及私人记录：[扩展 Issues](https://github.com/JavdBviewed/JavdBviewed/issues)。

## English

**Scope:** This page describes the verified browser extension `v2.1.3` and self-hosted Cloud `1.2.9` as reviewed on November 7, 2026. It does not claim that the desktop, Android, or JavScribe products use the same storage, telemetry, or controls. Check the release notes of the version you use.

### Extension: local data and external services

The extension stores watch marks, video and actor records, lists, settings, and some operational data locally in the browser, using both Chrome Storage and IndexedDB. **Not all data is stored only in Chrome Storage, and local storage does not mean that the extension never communicates with a server.** Exported backups may contain connection settings or credentials; do not post them publicly.

- If configured, [WebDAV backup and restore](/guide/webdav-sync) transfers backups to the selected WebDAV service. [Cloud record sync](/guide/cloud-sync) exchanges supported records and settings with the self-hosted Cloud instance. These are separate workflows.
- [115 Drive](/guide/115-drive), [Emby/Jellyfin media libraries](/guide/media-library), and website enhancements contact their respective services. Search and AI translation may send the data required for a request to configured providers when used. The data involved depends on the enabled feature and service settings.
- Cloud record synchronization does not automatically upload local video files. Streaming from a media server is a separate connection.

### Extension: background telemetry

The released extension `v2.1.3` implements startup, periodic heartbeat, and limited error reporting; delivery depends on network and endpoint availability. Payload fields include an installation identifier, optional device identifier, event and session identifiers, extension version and build, browser and platform details, locale and timezone, activity timestamps and duration, feature-enabled flags, **bucketed** counts of video records, actors and subscriptions, and other bucketed configuration counts. Because identifiers and environment details are included, this should **not** be described as fully anonymous.

Error reports may include component, code, error class, fatal flag, and a hash derived from a sanitized stack, **not the full raw stack**. The reviewed telemetry builder uses bucketed record counts rather than sending video titles or watch-record bodies as those metrics. In `v2.1.3`, the legacy `telemetry.enabled` setting is **not** a sending gate; disabling that old setting must not be presented as an opt-out. This page does not claim an unverified opt-out, production retention period, or that deleting local data retracts reports already sent.

### Self-hosted Cloud and other products

A self-hosted Cloud `1.2.9` instance stores its own account, device, synchronization, and operational data under the instance operator's control. It separately sends low-frequency instance health reports to a developer-operated service, including a stable instance identifier, version, health status, and instance-level device counts; this is **not** the synchronized business data or video files. The Cloud database and `vault.key` must be backed up and restored together when upgrading; see [backup and upgrade](/cloud/backup-upgrade).

Production retention on the developer-operated Server has not been verified here. This page makes no blanket “local only,” “fully anonymous,” or “no telemetry” claim for desktop, Android, or JavScribe; use the [product guide](/start/) for the relevant product. Remove credentials, tokens, backups, and private records before posting to [extension Issues](https://github.com/JavdBviewed/JavdBviewed/issues).
