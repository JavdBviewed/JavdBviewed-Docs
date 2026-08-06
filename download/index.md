<script setup>
import DownloadCenter from '../.vitepress/components/DownloadCenter.vue'
</script>

# 下载与更新

浏览器扩展已提供正式下载。Cloud 以 Docker 容器交付；桌面端和 Android 客户端将在准备完成后开放。

<DownloadCenter />

## 扩展安装

1. 下载最新扩展 ZIP 并解压到固定目录。
2. 在 Chromium 浏览器打开扩展管理页，例如 Chrome 的 `chrome://extensions/`。
3. 开启“开发者模式”，选择“加载已解压的扩展程序”，然后选中解压目录。
4. 后续更新时下载新的 ZIP、替换目录内容，再在扩展管理页重新加载。

下载卡片会从正式发布仓库的 Release 列表中寻找包含扩展 ZIP 的版本，并直达下载。GitHub API 暂时不可用时，入口会自动回退到 [Releases 页面](https://github.com/JavdBviewed/JavdBviewed-release/releases)。

## Cloud 部署指南 {#cloud-deploy}

> [!IMPORTANT]
> 部署前请确认上方 Cloud 状态。只有 stable 清单显示“已发布”时才执行拉取；“发布准备中”表示镜像、摘要或发布说明仍可能调整。

Cloud 只提供容器镜像，不提供桌面安装包，也不会自行替换或重启正在运行的容器。下面的 Compose 配置将数据保存在当前目录的 `data/`，并启用只读根文件系统、无额外 capabilities 和禁止提权。

### 1. 准备目录

新建一个独立部署目录，并在其中创建 `compose.yaml`：

```yaml
services:
  cloud:
    image: ${CLOUD_IMAGE_NAME:-ghcr.io/javdbviewed/javdbviewed-cloud:latest}
    container_name: javdbviewed-cloud
    restart: unless-stopped
    ports:
      - "18080:8080"
    environment:
      CLOUD_ADDR: ":8080"
      CLOUD_DATA_DIR: /data
      CLOUD_ADMIN_USER: admin
      CLOUD_JWT_SECRET: ${CLOUD_JWT_SECRET}
      CLOUD_ADMIN_PASSWORD: ${CLOUD_ADMIN_PASSWORD:-}
      CLOUD_CORS_ORIGINS: ${CLOUD_CORS_ORIGINS:-}
      CLOUD_UPDATE_MANIFEST_MIRRORS: ${CLOUD_UPDATE_MANIFEST_MIRRORS:-}
    volumes:
      - ./data:/data
    read_only: true
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:size=64m,mode=1777,noexec,nosuid,nodev
    healthcheck:
      test: ["CMD", "/app/cloud", "healthcheck"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
```

同目录创建 `.env`。`CLOUD_JWT_SECRET` 必须使用至少 16 位的强随机值；可以用 `openssl rand -hex 32` 生成：

```dotenv
CLOUD_IMAGE_NAME=ghcr.io/javdbviewed/javdbviewed-cloud:latest
CLOUD_JWT_SECRET=请替换为强随机值

# 可选：至少 16 位且包含大小写字母、数字、符号中的三类。
# 留空时，首次启动日志会输出一次性 temporaryPassword。
CLOUD_ADMIN_PASSWORD=

# 可选：GitHub Raw 访问困难时填写完整的 stable.json 镜像地址。
# 多个地址使用英文逗号分隔。
CLOUD_UPDATE_MANIFEST_MIRRORS=
```

### 容器环境变量

| 变量 | 是否需要填写 | 说明 |
| --- | --- | --- |
| `CLOUD_IMAGE_NAME` | 可选 | 默认 `ghcr.io/javdbviewed/javdbviewed-cloud:latest`。日常执行 `docker compose pull` 会获取最新正式镜像；回滚时改为已验证的固定版本 tag。 |
| `CLOUD_JWT_SECRET` | 必填 | 至少 16 位的强随机值，用于签发登录与设备令牌。首次部署前生成，后续不要随意更换。 |
| `CLOUD_ADMIN_PASSWORD` | 可选 | 设置后作为首次管理员密码。留空时日志仅在首次启动输出一次临时密码；管理员账号固定为 `admin`。 |
| `CLOUD_CORS_ORIGINS` | 可选 | 限制允许访问服务的浏览器 Origin，多个值用英文逗号分隔。扩展接入可填写 `chrome-extension://扩展ID`。 |
| `CLOUD_UPDATE_MANIFEST_MIRRORS` | 可选 | 更新清单镜像地址，多个地址用英文逗号分隔；只影响版本检查，不影响 GHCR 镜像拉取。 |

`CLOUD_ADDR`、`CLOUD_DATA_DIR` 与 `CLOUD_ADMIN_USER` 已由 Compose 固定为容器内监听 `:8080`、数据目录 `/data` 和管理员 `admin`，通常不需要修改。不要设置 `CLOUD_ALLOW_INSECURE_DEV`，它仅用于本地开发，会降低生产环境的配置门槛。

### 2. 拉取并启动

stable 清单标记为已发布后，在部署目录执行：

```bash
docker compose pull cloud
docker compose up -d cloud
docker compose ps
```

若没有设置 `CLOUD_ADMIN_PASSWORD`，从首次启动日志取得临时密码：

```bash
docker compose logs --tail 100 cloud
```

管理员账号固定为 `admin`。首次登录后按提示修改密码。

### 3. 核对服务与版本

```bash
curl -fsS http://127.0.0.1:18080/health
curl -fsS http://127.0.0.1:18080/version
```

管理页面位于 `http://127.0.0.1:18080/`。`/version` 返回的 `version`、`commit`、`buildNumber` 和 `releaseChannel` 应与 [stable 清单](https://raw.githubusercontent.com/JavdBviewed/JavdBviewed-release/main/manifests/cloud/stable.json)一致。公网部署请在 Cloud 前增加 Caddy 或 nginx，并只通过 HTTPS 对外提供服务。

### 4. 升级

1. 在管理台创建快照，并额外备份部署目录下的 `data/`。
2. 确认 stable 清单已标记为 `released`，记录目标镜像 digest。
3. 保持 `CLOUD_IMAGE_NAME` 为 `:latest`，拉取镜像并重新创建容器，然后核对健康、版本和管理员登录。

```bash
docker compose pull cloud
docker compose up -d cloud
docker compose logs --tail 100 cloud
```

升级时始终保留原 `data/` 目录。Cloud 的更新检查只负责提示，不会自动执行上述操作。

### 5. 回滚

把 `.env` 中的 `CLOUD_IMAGE_NAME` 从 `:latest` 改为上一个已验证的固定版本 tag，再执行：

```bash
docker compose pull cloud
docker compose up -d cloud
```

镜像回滚不会自动回滚数据。若升级涉及数据迁移并出现异常，应停止容器，再从升级前快照或 `data/` 备份恢复；不要删除或重新初始化原数据目录。

## 更新通道

| 通道 | 状态 | 用途 |
| --- | --- | --- |
| `stable` | 当前使用 | 普通自部署用户的唯一更新通道 |
| `beta` | 预留 | 未来测试版本，暂不提供部署清单 |
| `dev` | 预留 | 本地开发或内部验证，暂不提供部署清单 |

Cloud 内置 stable 官方清单地址，不需要配置主地址、检查开关或通道。文档站域名变化不会影响容器检查更新。

## 网络加速

`CLOUD_UPDATE_MANIFEST_MIRRORS` 只用于加速读取更新清单。填写一个或多个完整的 `stable.json` 地址，Cloud 会按顺序尝试，全部失败后回退到官方主源：

```dotenv
CLOUD_UPDATE_MANIFEST_MIRRORS=https://mirror.example.com/JavdBviewed/JavdBviewed-release/main/manifests/cloud/stable.json,https://another.example.com/JavdBviewed/JavdBviewed-release/main/manifests/cloud/stable.json
```

镜像地址必须返回与官方清单兼容的 JSON，不能修改版本、镜像 tag 或摘要。它不是新的更新通道，也不会改变可信发布源。GHCR 镜像拉取加速属于 Docker 守护进程配置，应在宿主机使用自己信任的 registry mirror；不要把 registry 地址填入这个变量。
