# API 参考

两个 HTTP 面：字幕服务（`serve`，默认 8300）与字幕工作台（默认 8400）。
工作台不产生任务状态，只做聚合与转发；真正干活的接口都在服务侧。

## 1. 字幕服务（8300）

| 接口 | 鉴权 | 说明 |
|---|---|---|
| `GET /health` | 无 | 服务存活 |
| `GET /jobs` | 无 | 所有任务 |
| `GET /jobs/<id>` | 无 | 单任务，逐文件：状态 / 进度 / 已翻到第几分钟 |
| `GET /jobs/<id>/result` | 无 | 下载该任务的 SRT |
| `PUT /upload` | 无 | 接收 16kHz opus 音频并提交处理 |
| `GET /config` | `X-Api-Key` | 读白名单设置项（敏感项打码） |
| `PUT /config` | `X-Api-Key` | `{"values": {...}}`；类型校验 → 写回配置文件活动 profile 段 + 内存热更 |
| `GET /scan?path=<绝对目录>` | `X-Api-Key` | 按活动 profile 的 `scan.*` 规则列出视频：`{path, name, size, has_subtitle, subtitle}`；上限 5000 项，超出返回 `truncated: true` |
| `POST /scan/submit` | `X-Api-Key` | `{"files": [绝对路径...]}` 校验后入队为一个任务；`201 {ok, job_id, files}` |

### 鉴权语义

- Key 来源：env `JAVSCRIBE_API_KEY`（推荐），或配置文件
  `profiles.<活动profile>.api.key`
- 服务端**未设置** Key → 相关请求返回 `403`；**不匹配** → `401`
- Key 是**服务级共享密钥**，不要随意指派给不可信方

### 容器化路径映射

服务跑在 Docker 里时，`/scan` 与 `/scan/submit` 只能看到容器内路径。
compose 默认把宿主机根**只读**挂载在容器 `/hostfs`（仅 `/scan` 链路可达）；
设置 `JAVSCRIBE_HOST_ROOT=/hostfs` 后，对「容器内不存在」的绝对路径会透明映射
到 `/hostfs/<路径>`。字面可见的路径永远优先，不做映射。

## 2. 字幕工作台（8400）

| 接口 | 说明 |
|---|---|
| `GET /api/health` | 工作台存活 |
| `GET /api/engines` | 服务登记表 |
| `POST /api/engines` / `PUT /api/engines/{name}` / `DELETE /api/engines/{name}` | 增改删服务（`{name, url, api_key}`） |
| `GET /api/jobs` | 汇总所有服务的任务（看板数据源，5s 轮询） |
| `POST /api/upload` | 整片上传（回退链路，202 `{upload_id, duration_s}`，上限 `JAV_UPLOAD_MAX_GB`） |
| `POST /api/upload-audio` | 浏览器本地提取的 opus 音轨上传（主链路，202） |
| `GET /api/uploads/{upload_id}` | 上传阶段：`extracting(0-1 进度) → dispatching → done(job_id)/error` |
| `GET /api/jobs/{engine}/{job_id}/result` | 代理服务 srt 下载 |
| `POST /api/jobs/{engine}/{job_id}/retry` | 跳过任务重新生成 |
| `GET /api/engines/{name}/config` / `PUT` | 代理 `/config`，Key 自动携带 |
| `GET /api/engines/{name}/scan?path=` | 代理 `/scan`，Key 自动携带 |
| `POST /api/engines/{name}/scan/submit` | 代理 `/scan/submit`，Key 自动携带 |

代理路由的错误映射：服务 `403`（未设 Key）/ `401`（Key 不符）/ `404`（旧镜像无端点）
统一映射为工作台 `400` + 中文提示；路径非法为 `400`。

## 3. 安全边界（务必读）

- **8300 全端口只应暴露给内网 / VPN**：`PUT /upload` 可向 GPU 机器派发任务，
  `GET /jobs` 暴露任务与文件路径，二者均无鉴权（v0.1）
- **`/scan` 可列举服务机器上的任意目录**（文件名 + 大小）并把任意本地路径入队处理，
  敏感性等同 `/config`，**切勿对外暴露**；泄露 `/scan` 等于交出该机的媒体库清单
- 必须对外时：在 8300/8400 前面加一层**带鉴权的反向代理**（或仅暴露 8400 + 代理层鉴权）
- 工作台的 `X-Api-Key` 只存在服务端数据卷（`JAV_DATA_DIR`），接口不回显明文；
  但它仍是服务级共享密钥，备份/迁移数据卷时按密钥对待
