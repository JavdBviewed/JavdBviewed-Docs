# 安装 Windows 桌面端

本文适用于 **JavdBviewed 桌面端 1.0.0、Windows x64**。桌面端是独立应用，不依赖浏览器扩展；安装后可以先扫描本机影片，也可以按需接入自建 Cloud 和媒体源。

## 安装前确认

- 使用 Windows x64 电脑，并确认有权限安装和运行桌面应用。
- 从正式发布入口获取安装包。桌面端 1.0.0 的稳定发布清单没有 macOS、Linux 安装包；不要用其他平台文件或未核实的第三方打包代替。
- 如果打算跨设备同步，准备一个自己部署、从这台电脑可访问的 [Cloud 实例](/cloud/deployment)及其 `admin` 管理员密码。仅在本机整理影片时可暂不连接 Cloud。
- 如果打算浏览 Emby/Jellyfin，准备媒体服务器地址及该服务所需的登录信息；媒体源与 Cloud 是两种不同的连接。

## 下载安装包

1. 打开[正式发布仓库的桌面端 1.0.0 Release](https://github.com/JavdBviewed/JavdBviewed-release/releases/tag/desktop-v1.0.0)。
2. 下载 [Windows x64 安装程序 `JavdBviewed-desktop-1.0.0-win-x64.exe`](https://github.com/JavdBviewed/JavdBviewed-release/releases/download/desktop-v1.0.0/JavdBviewed-desktop-1.0.0-win-x64.exe)。请确认文件名与版本号，勿从陌生的镜像站下载。
3. 保留安装程序到这台电脑可访问的目录，核对下面的 SHA-256，再运行它。

| 发布资产 | 用途 | 手动安装时要下载吗 |
| --- | --- | --- |
| `JavdBviewed-desktop-1.0.0-win-x64.exe` | Windows x64 安装程序 | 是 |
| `JavdBviewed-desktop-1.0.0-win-x64.exe.blockmap` | 更新程序使用的差异数据 | 否 |
| `latest.yml` | 更新程序读取的版本信息 | 否 |

发布说明与文件信息可见[桌面端 1.0.0 发布记录](https://github.com/JavdBviewed/JavdBviewed-release/blob/main/releases/desktop/v1.0.0.md)。不要双击 `.blockmap` 或 `latest.yml`，它们不是应用安装入口。

## 核对 SHA-256

下载完成后，在**安装包所在的文件夹**打开 PowerShell，运行：

```powershell
$file = '.\JavdBviewed-desktop-1.0.0-win-x64.exe'
$expected = 'a8c0ac9b25cd10f3ea7ce6600047e74f61b5b103b4086a66836a2ed70340344c'
$actual = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $expected) { throw "SHA-256 不匹配；不要运行安装包。实际值：$actual" }
'SHA-256 与桌面端 1.0.0 稳定发布清单一致。'
```

这串预期值对应发布仓库 `manifests/desktop/stable.json` 中的 **1.0.0 安装程序**，不是 `.blockmap` 或 `latest.yml` 的校验值。如果把安装包保存到了别的目录，请把 `$file` 改为它的实际路径。

之后如果安装其他版本，应重新查看[正式稳定发布清单](https://github.com/JavdBviewed/JavdBviewed-release/blob/main/manifests/desktop/stable.json)中的该版本文件名和哈希；不要复用上面 1.0.0 的预期值。清单读取失败时，先暂停版本判断，不要凭本页的固定链接推测“当前最新版”。

**校验不通过就不要安装。**先确认下载的是对应版本的 `.exe`，删除损坏的下载文件后从正式 Release 重新下载；若再次不符，暂停使用并从发布入口核对清单。SHA-256 校验能发现文件内容不同，但不能替代对下载来源和系统安全提示的核查。

## 安装并首次打开

1. 运行已核对的 `.exe`，按安装程序提示完成安装。
2. 打开 JavdBviewed 桌面端，确认应用窗口正常显示。无需把 `.exe` 解压成浏览器扩展，也无需先访问扩展管理页。
3. 先决定要从哪里看影片：整理这台电脑上的目录，从 **本地影片** 开始；浏览媒体服务器，从设置中的 **媒体源连接** 开始。
4. 若使用 Cloud 跨设备同步，再按下一节连接；没有 Cloud 的用户可以先完成本机目录扫描，之后再登录同步。

本地影片中的扫描结果不会自动变成 Emby/Jellyfin 的媒体库条目。对扫描条目使用 **确认入库** 后，未登录 Cloud 时先保存本机映射，登录后再同步；具体操作见[本地影片整理](/desktop/local-library)。

首次启动后可以只核对与你的使用方式有关的结果：

- **本机影片**：打开“本地影片”，确认可以添加当前电脑上的目录。此时没有扫描结果是正常的，添加目录后再核对文件列表。
- **媒体服务器**：打开设置里的“媒体源连接”，先查看是否已经有保存的媒体源；首次安装为空时，需要自行添加或稍后从 Cloud 同步。
- **跨设备使用**：只有在连接自己部署的 Cloud 并完成同步后，才检查另一台设备能否看到对应记录；首次安装本身不代表已经建立云连接。

## 首次连接 Cloud（可选）

在设置中打开 **Cloud 同步**，填写你自己的服务器地址和**本机设备名**。下面只是地址格式示例，不是可用的公共 Cloud 服务：

```text
https://cloud.example.com
```

使用该实例的 `admin` 账号和管理员密码登录，再查看页面反馈；需要时点 **立即同步**。不要把密码写入 URL，也不要在公开问题描述、截图或仓库文件中粘贴密码。公网连接应通过 HTTPS 反向代理；本机/内网部署及首次账号设置见[Cloud 部署指南](/cloud/deployment)，设备与连接问题见[Cloud 连接说明](/cloud/connections)。

登录 Cloud 不等于已经接入 Emby/Jellyfin。想通过媒体服务器播放，还需在 **媒体源连接** 中添加服务器，或查看从 Cloud 同步来的媒体源配置；接下来读[媒体源与播放](/desktop/sources)。

## 安装或启动失败

| 表现 | 先检查 | 下一步 |
| --- | --- | --- |
| Release 打不开或文件下载不完整 | 网络能否访问正式发布页、文件名是否为对应的 `.exe` | 从正式 Release 重新下载，完成后再算 SHA-256 |
| PowerShell 提示找不到文件 | 是否在安装包所在目录打开 PowerShell，文件名及扩展名是否完整 | 用实际绝对路径修改 `$file`，不要拿 `.blockmap` 校验 |
| SHA-256 不匹配 | 文件是否下载完整、是否拿错版本或下载来源 | 停止安装；回正式发布页重新下载，不要忽略报错 |
| Windows 显示来源或安全警告 | 下载来源、文件哈希以及系统提供的文件信息 | 不要为了安装关闭防护；无法确认来源时先停止运行 |
| 安装后窗口无法打开 | 系统是否为 Windows x64、安装过程是否报错 | 记录错误文本和版本号，重新核对包；避免公开个人路径和凭据 |
| 应用能打开但 Cloud 登录失败 | 自建服务是否可访问、地址和管理员密码是否正确 | 参考[Cloud 连接说明](/cloud/connections)，无需重新安装桌面端 |

安装成功后，从[桌面端使用指南](/desktop/)继续；先整理本地影片看[本地影片整理](/desktop/local-library)，连接和播放媒体服务器看[媒体源与播放](/desktop/sources)。桌面端 1.0.0 的内置更新检查默认关闭，更新方式见[更新桌面端](/desktop/updates)。
