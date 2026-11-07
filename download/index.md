<script setup>
import DownloadCenter from '../.vitepress/components/DownloadCenter.vue'
</script>

# 下载与更新

<DownloadCenter />

请按产品分别选择下载或部署入口。发布清单中的版本号与实际可获取的 Release 资产可能暂时不同步；安装前请打开对应 Release 页面，确认所需安装包存在，并核对文件名、版本与系统架构。

## 浏览器扩展

浏览器扩展的正式 Release 发布在[扩展源仓 Releases](https://github.com/JavdBviewed/JavdBviewed/releases)，不在集中发布仓的桌面或 Android 下载列表中。已核实的正式版本为 v2.1.3；安装或升级前仍请以该页面实际提供的资产和发布说明为准。

第一次使用请从[入门指南](/start/)开始。扩展与桌面、Android 应用是不同的客户端，不能互用安装包。

## Windows 桌面客户端

Windows x64 版 1.0.0 已发布。请从[desktop-v1.0.0 正式发布页](https://github.com/JavdBviewed/JavdBviewed-release/releases/tag/desktop-v1.0.0)获取 `.exe` 安装程序，按[桌面安装指南](/desktop/install)核对文件和完成首次启动。`latest.yml` 与 `.blockmap` 是更新元数据，不是手动安装包。

桌面客户端的媒体库、媒体源和更新说明分别见[本地媒体库](/desktop/local-library)、[媒体源](/desktop/sources)和[升级指南](/desktop/updates)。目前不要将主分支功能说明视为 1.0.0 的已发布能力；未核实 macOS 或 Linux 的稳定安装包。

## Android 客户端

目前已核实可获取的公开安装包是 [mobile-v39（1.0.2）](https://github.com/JavdBviewed/JavdBviewed-release/releases/tag/mobile-v39)。请按[Android 安装指南](/mobile/install)选择设备架构对应的 APK；无法判断架构时可使用该版本提供的 universal 包。

发布清单虽列出 1.0.3/mobile-v42，但核对时该 Release 与 APK 资产返回 404，因此这里不将它列为可下载版本，也不提供不可用的资产链接。安装后可依次阅读[媒体源](/mobile/sources)、[播放与下载](/mobile/playback)、[媒体库](/mobile/library)。这里没有经核实的 iOS 或 TV 正式下载入口。

## Cloud 部署指南 {#cloud-deploy}

Cloud 是自行部署的服务，不是客户端安装包。已核实的公开稳定版本为 1.2.9；请从[Cloud 部署指南](/cloud/deployment)获取容器配置、持久化与首次登录步骤，不要把页面中的下载卡片当作容器部署命令。

升级前请阅读[备份与升级](/cloud/backup-upgrade)：数据库及 `vault.key` 必须一起备份，镜像回滚不等于数据回滚。既有指向 `#cloud-deploy` 的链接继续落在此节；具体部署步骤已移至独立页面。

## JavScribe 字幕工具

JavScribe 的客户端和服务端独立发布。上方卡片分别显示两个组件查询到的公开版本及正式发布或预发布状态；请进入各组件对应的发布页核对实际提供的包，并按[JavScribe 指南](/javscribe/)选择组件与部署方式。查询失败或结果不完整时，可到[JavScribe 自有 Releases](https://github.com/JavdBviewed/JavScribe/releases)核对；未查到公开版本不代表该组件未发布。

## 下载或更新遇到问题

1. 返回对应产品的正式 Release 页面，确认资产实际存在，并核对版本、架构和校验信息；不要仅凭清单版本号判断可安装。
2. 升级前备份已有数据。桌面客户端按[升级指南](/desktop/updates)操作；Android 不要为了覆盖升级先卸载旧版；Cloud 按[备份与升级](/cloud/backup-upgrade)保留数据库与密钥。
3. 下载链接不可用时，先查看同一产品上一个已核实的公开版本，不要从来源不明的镜像下载或把其他产品的安装包混用。
