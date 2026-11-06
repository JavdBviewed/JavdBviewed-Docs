# 备份、升级与回滚 Cloud

本文以已公开发布的 **Cloud 1.2.9** 为目标版本，沿用[部署指南](/cloud/deployment)的 `compose.yaml`、`.env` 与宿主机 `./data:/data` 布局。操作前先确认自己的部署目录和挂载位置；本文的命令只适用于该布局，不要在不明数据目录上直接覆盖或清理文件。

集中发布仓的 [Cloud stable 清单](https://github.com/JavdBviewed/JavdBviewed-release/blob/main/manifests/cloud/stable.json) 标记 `releaseStatus=released`、`requiresBackup=true`、`minCurrentVersion=1.0.0`；镜像为 `ghcr.io/javdbviewed/javdbviewed-cloud:1.2.9`，digest 为 `sha256:4cef4e8319426664eaf25960bf794d3c1ed64b254b5d286f6bdeb1fca43ab495`。**低于 1.0.0 的部署不要照此直接升级**，先确认适用的历史迁移路径。Cloud 的更新检查只会提示，**不会自动拉取镜像、替换或重启容器**。

## 升级前：记录状态并备份

1. 在现有管理台的 **数据** 页面创建快照，记录创建时间和当前版本；快照可辅助恢复数据库，但**不能代替完整宿主机数据目录备份**。
2. 从部署主机访问 `/health` 和 `/version`，记录当前版本、构建号、Cloud 镜像 tag 或 digest，确认当前实例可用。确定升级窗口，通知正在使用 Cloud 的设备暂缓同步。
3. 在部署目录先确认 `compose.yaml`、`.env` 和 `data/` 的实际位置，以及宿主机剩余空间；不要只备份容器层、Docker 镜像或数据库单文件。
4. 停止 Cloud 后离线归档**完整数据目录与部署配置**。以下示例在使用本指南部署布局的目录中执行，不会删除现有数据：

```bash
umask 077
docker compose stop cloud
BACKUP="../cloud-before-1.2.9-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP" compose.yaml .env data
tar -tzf "$BACKUP" > /dev/null
```

如果打包或完整读取归档失败，先排查磁盘空间或文件权限，**不要继续升级**；恢复原服务并重新制作可验证备份。核对归档实际包含 `data/cloud.db`，将归档离线保存到受控位置，记录归档路径、时间和当前镜像版本。归档含管理员认证信息、媒体源凭据、密钥和 `.env` 中的 JWT secret，不要上传公共网盘、代码仓库或公开问题帖。若使用自定义目录或外部配置，按实际挂载一起备份。

**从 1.2.9 起，数据库 `data/cloud.db` 与 `data/vault.key` 必须作为同一套数据备份和恢复。** 首次启动 1.2.9 后生成的 `vault.key` 为 32 字节、权限 0600；升级前的旧目录可能还没有此文件。升级完成并核验正常后，重新离线备份完整 `data/`，确保今后的备份包含新生成的密钥。不要把旧数据库与另一套新密钥拼接。

## 升级到固定版本

1. 查看 [1.2.9 发布说明](https://github.com/JavdBviewed/JavdBviewed-release/blob/main/releases/cloud/v1.2.9.md) 和 stable 清单，核对版本、发布状态、镜像 digest、是否需要备份；不要仅凭源仓 `main` 或容器的提示判断已发布。
2. 确认上一步归档存在且可读取，再将 `.env` 中的 `CLOUD_IMAGE_NAME` 设为已核的固定 tag（本指南不自动追踪 `latest`）：

```dotenv
CLOUD_IMAGE_NAME=ghcr.io/javdbviewed/javdbviewed-cloud:1.2.9
```

3. 在上述部署目录中拉取并重新创建服务，**保留同一个 `./data` 挂载**：

```bash
docker compose pull cloud
docker compose up -d cloud
docker compose ps
docker compose logs --tail 100 cloud
curl -fsS http://127.0.0.1:18080/health
curl -fsS http://127.0.0.1:18080/version
```

`/version` 应显示 `version=1.2.9`、`buildNumber=git-4b477f028824`，提交对应 `4b477f028824b3857a4fe23446db339716f75630`。示例端口 `127.0.0.1:18080` 仅在部署主机可访问；远端设备使用自己配置的 HTTPS 域名核对。镜像拉取失败时不要删旧数据目录或修改镜像来源来碰运气，先检查 GHCR 可达性和 tag/digest。

4. **升级后登录管理台一次**，使已有 v1 扫描会话密文逐项迁移为 v2；然后核对设备与同步会话、新作品扫描状态，必要时让客户端执行一次同步。登录后检查数据目录中 `vault.key` 已生成且权限正确，随后安排短暂停机，对 `data/` 和配置做一份新的离线备份，确认它包含 `cloud.db` 和 `vault.key`，再恢复服务。

更改 `.env` 中的 `CLOUD_ADMIN_PASSWORD` 不会重置已有数据库里的管理员密码；不要为了排障清空或重新初始化数据目录。如果升级后扫描处于暂停态，先看[Cloud 排错](/cloud/troubleshooting)中的具体原因，而不是反复重启或更换镜像。

## 失败时如何回退

**回滚镜像不等于回滚数据库。** 1.2.9 登录迁移过的 v2 会话密文无法由旧版二进制读取；旧版镜像直接挂载升级后的 `data/`，不能保证会话、扫描或数据正常。丢失原 `vault.key` 后由新容器自动生成的 key 也无法解密旧 v2 会话。

1. 先停止 Cloud，记录错误、当前镜像版本和当前 `data/` 状态；不要覆盖或删除升级后目录。若需要留存升级后数据，另作隔离归档，谨慎处理其中密钥。
2. 优先检查是否能在 **1.2.9** 修复配置、网络或权限问题；只有确认必须回到旧版本时，才选择**升级前的完整数据目录及对应配置**作为一组进行恢复。回退镜像需使用先前已验证的固定 tag，不能凭空猜版本。
3. 恢复前将服务保持停止，把当前数据目录隔离保留，然后从升级前归档还原当时的 `data/`、`compose.yaml` 和 `.env`；核对文件权限、挂载及目录位置，再用对应旧镜像启动。不要只把旧数据库覆盖到新 `vault.key` 旁，也不要把旧版管理台快照当成含密钥的全量备份。
4. 启动后检查 `/health`、`/version`、管理员登录、设备同步和会话/扫描状态。若保留了新版本但会话密钥丢失，只能按[发布说明](https://github.com/JavdBviewed/JavdBviewed-release/blob/main/releases/cloud/v1.2.9.md)让扩展重新推送会话并重新登录管理台；不能从镜像标签找回旧 key。

管理台的整库快照可用于当前实例内的数据库恢复，但快照与 `data/` 外部归档职责不同：恢复数据库之前确认它与现有 `vault.key` 属于同一批数据；需要**跨版本回滚**时，以升级前完整目录备份为准。恢复会更改现有记录，先确保当前数据另有可回退副本。

## 更新清单和镜像拉取不是一条通道

Cloud 内置 stable 更新清单地址；普通自部署无需配置检查开关或改成 beta/dev。`CLOUD_UPDATE_MANIFEST_MIRRORS` 仅允许填返回同一 stable 清单 JSON 的完整 HTTPS 镜像 URL，多个地址用逗号分隔；镜像全部失败时回退官方清单。它**只影响版本检查**，不会加速 `docker compose pull`，也不会使其他源的镜像自动变得可信。例如：

```dotenv
CLOUD_UPDATE_MANIFEST_MIRRORS=https://mirror.example.com/JavdBviewed/JavdBviewed-release/main/manifests/cloud/stable.json
```

此地址仅为占位示例；不需要镜像时留空。镜像应保持官方版本、tag 与 digest 一致。若 GHCR 拉取受限，镜像拉取加速属于宿主机 Docker/registry 配置，应只使用自己信任的服务；不要将 registry 地址填入更新清单变量，也不要因为镜像站显示了新 tag 就绕过正式发布状态核查。

阅读[Cloud 部署指南](/cloud/deployment)和[设备连接](/cloud/connections)可核对数据目录布局及升级后的客户端连接状态。
