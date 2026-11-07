# 部署 Cloud

本文适用于 **JavdBviewed Cloud 1.2.9** 的 Docker Compose 自部署。集中发布仓 stable 清单、公开 Release 和 GHCR manifest 均已核实；镜像为 `ghcr.io/javdbviewed/javdbviewed-cloud:1.2.9`，digest 为 `sha256:4cef4e8319426664eaf25960bf794d3c1ed64b254b5d286f6bdeb1fca43ab495`。

Cloud 是你自己管理的数据服务。它不会替换 Emby/Jellyfin 等媒体服务器，也不会自动升级或重启正在运行的容器。公网部署还需要你自己配置 HTTPS 反向代理；不要把下面的示例地址、密码或密钥直接用于生产。

## 最小目录

创建一个新的部署目录，并在其中保存 `compose.yaml` 和 `.env`。下面的 Compose **仅绑定宿主机的回环地址**，保留持久化数据目录，同时启用只读根文件系统、丢弃额外 capabilities 和禁止提权：

```yaml
services:
  cloud:
    image: ${CLOUD_IMAGE_NAME:-ghcr.io/javdbviewed/javdbviewed-cloud:1.2.9}
    container_name: javdbviewed-cloud
    restart: unless-stopped
    ports:
      - "127.0.0.1:18080:8080"
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

创建 `.env`，只在本机保存真实值：

```dotenv
CLOUD_IMAGE_NAME=ghcr.io/javdbviewed/javdbviewed-cloud:1.2.9
CLOUD_JWT_SECRET=替换为至少16位的强随机值

# 可选：不填写时，首次启动日志只输出一次 temporaryPassword
# 已有数据库中的管理员密码不会被此变量覆盖
CLOUD_ADMIN_PASSWORD=

# 可选：多个 Origin 用英文逗号分隔
CLOUD_CORS_ORIGINS=

# 可选：完整 stable.json 镜像地址；不改变发布通道
CLOUD_UPDATE_MANIFEST_MIRRORS=
```

`CLOUD_JWT_SECRET` 用于签发登录和设备令牌，生产环境必须使用强随机值，首次部署后不要随意更换。不要设置 `CLOUD_ALLOW_INSECURE_DEV`；那是本地开发的降级开关，不是生产部署配置。`CLOUD_ADDR`、`CLOUD_DATA_DIR` 和 `CLOUD_ADMIN_USER` 已由示例固定为容器内 `:8080`、`/data` 和 `admin`，通常不需要改动。

## 拉取和首次启动

在部署目录执行：

```bash
docker compose pull cloud
docker compose up -d cloud
docker compose ps
docker compose logs --tail 100 cloud
```

如果没有设置 `CLOUD_ADMIN_PASSWORD`，只从首次启动日志取得一次性临时密码。管理账号固定为 `admin`；首次登录后按管理台提示修改密码。初始化完毕后管理台密码在数据目录的数据库中管理，改动 `.env` 中的 `CLOUD_ADMIN_PASSWORD` **不会重设已有账号密码**；不要将新的管理台密码长期写进配置文件，也不要把临时密码、JWT secret 或管理密码粘贴到公开问题、截图或仓库。

管理页面默认地址为：

```text
http://127.0.0.1:18080/
http://127.0.0.1:18080/admin/
```

![Cloud 管理台登录页，密码输入框为空](/cloud-v1.2.9/admin-login-test.png)

图为 `cloud-v1.2.9` tag 源码构建的本地测试界面，不是已发布镜像实拍；使用全新隔离实例和测试数据，截图时密码框为空。登录时填写自己实例的管理密码；使用临时密码首次登录后，按提示完成改密。

[打开登录页原图](/cloud-v1.2.9/admin-login-test.png)

此默认配置**无法被其他设备直接访问**。如果客户端运行在另一台设备，不能使用 `127.0.0.1` 作为它的 Cloud 地址；需先按下方“网络暴露限制”有意识地配置反向代理或受限局域网监听，再填可达的 HTTPS 域名。Cloud 登录地址和 Emby/Jellyfin 媒体源地址是两套地址，不要混填。

## 启动后核对

先从部署主机执行健康和版本检查：

```bash
curl -fsS http://127.0.0.1:18080/health
curl -fsS http://127.0.0.1:18080/version
```

`/health` 应返回成功状态；`/version` 应显示 `version=1.2.9`、`buildNumber=git-4b477f028824`、发布提交 `4b477f028824b3857a4fe23446db339716f75630` 对应的构建信息和协议版本。管理台登录后检查：

- 管理员账号能登录，且首次密码修改已完成；
- **系统 → 设备**页可以看到客户端或扩展的接入状态；
- **同步数据 → 快照管理**页可以创建快照；
- 客户端登录后能执行一次同步；
- 若使用新作品扫描，扫描状态和后台任务页能正常加载。

如果接口返回 `disk I/O error`、`database is locked`、`readonly` 或 `unable to open database`，先检查宿主机 `data/` 是否为真实目录、容器用户是否有读写权限、磁盘空间是否足够，以及 `./data:/data` 是否确实指向当前部署目录。

## 持久化数据与密钥

裸服务的 `CLOUD_DATA_DIR` 默认是 `./data`；本页 Compose 将**部署目录的 `./data`** 挂载到容器 `/data`，并显式设置 `CLOUD_DATA_DIR=/data`。当前数据库为 `/data/cloud.db`；快照目录为 `/data/snapshots/`。旧版 `store.json` 首次升级时可能被迁移，并在 `migration-backup/` 保留迁移前备份；它不再是当前 live 数据库。

从 1.2.9 起，首次启动还会在数据目录生成 `vault.key`（32 字节、权限 0600）。从旧版升级时，**先备份宿主机完整 `data/` 目录和部署配置**，更新容器后**登录管理台一次**，让已有 v1 会话密文逐项迁移至 v2；再核查会话与扫描状态，以及 `vault.key` 长度和权限。**数据库和 `vault.key` 必须一起备份和恢复**；丢失旧密钥后新生成的 key 不能解密旧 v2 会话，只能让扩展重新推送会话并重新登录管理台。回滚旧版二进制无法读取 v2 密文，须恢复升级前的完整数据备份或重新推送旧版会话。不要把 `vault.key` 提交到 Git 或放在公开存储中；完整步骤见[备份、升级与回滚](/cloud/backup-upgrade)。

Cloud 数据目录可能包含管理员认证材料、设备、同步实体、媒体源凭据和密钥库内容。任何能读取数据目录或管理密码的人都可能读取这些受保护业务数据；备份文件应放在受控位置。

## 网络暴露限制

- 默认 `127.0.0.1:18080:8080` **仅接受部署主机本机连接**。同机安装 Caddy/nginx 时保留此绑定，让反向代理转发到 `http://127.0.0.1:18080`，只向客户端开放代理的 HTTPS 地址（例如 `https://cloud.example.com`）；证书、反代上游和防火墙需要自行配置。
- 如果反向代理运行在**另一台机器**，本机回环地址不可作为远端上游。须明确把 Compose 的 `ports` 宿主机地址改为部署主机实际的**受限内网 IP**（例如将 `127.0.0.1:18080:8080` 中的 `127.0.0.1` 换成该 IP），并用防火墙只允许代理主机访问 `18080`；客户端仍使用代理的 HTTPS 地址，不应直连 HTTP 端口。
- 仅在可信局域网直连时，也需明确修改绑定地址、限制可访问设备，并认识到 HTTP 会传输管理与媒体源凭据；跨设备使用优先启用 HTTPS 反代。**禁止改为 `18080:8080` 或 `0.0.0.0:18080:8080` 后直接暴露公网。**
- 生产环境使用强管理员密码，并根据浏览器访问需求收紧 `CLOUD_CORS_ORIGINS`；不要把 `CLOUD_UPDATE_MANIFEST_MIRRORS` 当成代理或新发布通道。任何客户端设备都必须能从自身网络访问 Cloud；Cloud 可达不代表媒体源可达，媒体源仍需单独配置和授权。

## 版本取舍

本页固定示例使用已核稳定的 `1.2.9`，便于复现和回滚。不要无审查地把镜像改成 `latest`；如果选择 `latest`，升级前仍必须先查看 stable 清单的 `releaseStatus`、版本、digest 和 `requiresBackup`，并按[备份、升级与回滚](/cloud/backup-upgrade)执行。发布仓清单与发布说明优先于源仓 `main` 的未发布改动。

下一步阅读[连接设备](/cloud/connections)、[备份、升级与回滚](/cloud/backup-upgrade)和[排查 Cloud](/cloud/troubleshooting)。
