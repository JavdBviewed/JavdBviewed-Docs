# API 参考

两个 HTTP 面：字幕服务端（`serve`，默认 8300）与客户端（Web 形态，默认 8400）。
Serve 是推理任务的状态真源；`client-v0.2.66` 的 Web 工作台还在**客户端部署机**
本地扫描目录、维护本地扫描管线任务，并通过 `/api/jobs` 汇总本地与各 Serve 的任务。
任务不全在服务端内存：**仅对 `serve-v0.2.16` 源码/自行构建版本**，启用持久数据目录后
已完成的终态历史可写入 `jobs.json` 并在重启后恢复；未完成、在途任务不恢复执行。
该源码 tag 未核到对应公开安装包，不应把其行为当成旧版 Serve 的共同保证。

## 1. 字幕服务（8300）

| 接口 | 鉴权 | 说明 |
|---|---|---|
| `GET /health` | 无 | 服务存活 |
| `GET /jobs` | 无 | 服务端当前返回的任务列表；不包括客户端尚在本地扫描管线中的任务 |
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

Serve 跑在 Docker 里时，服务端 `/scan` 与 `/scan/submit` 只能访问 **Serve 容器**
实际挂载、允许读取的路径；Serve Compose 的宿主机根只读挂载到 `/hostfs` 时，
`JAVSCRIBE_HOST_ROOT=/hostfs` 可供该容器在原路径不存在时回退解析。此设置不让
Web 工作台自动读取 Serve 主机的目录。Web 客户端本地扫描在**自己的容器**执行，
需在 Web 容器另行挂载目标目录，必要时独立设置 `JAVSCRIBE_HOST_ROOT`；
仅只读映射无法将生成的字幕写回该目录，写回前须核对目标目录的读写权限。
浏览器「选择文件/文件夹」则读取浏览器所在电脑，不使用上述容器扫描路径。
不要为修复路径错误直接把整个宿主机根目录暴露给 Web 容器。

## 2. 客户端（8400）

| 接口 | 说明 |
|---|---|
| `GET /api/health` | 客户端存活（含版本号） |
| `GET /api/update` | 更新检查（比对 GitHub Release，客户端 + 服务端） |
| `GET /api/engines` | 服务登记表 |
| `POST /api/engines` / `PUT /api/engines/{name}` / `DELETE /api/engines/{name}` | 增改删服务（`{name, url, api_key}`） |
| `/api/scan/local` | `client-v0.2.66` 工作台在客户端部署机本地扫描可访问目录，不是服务端 `/scan` |
| `/api/scan/local/tasks` | 客户端本地扫描管线的任务入口；不等同于 Serve 推理队列 |
| `GET /api/jobs` | 汇总各 Serve 的任务与本地扫描管线任务（看板数据源）；`local` 区分本工作台派发与他端提交 |
| `GET /api/jobs/summary` | 看板终态累计计数；重启后历史能否恢复取决于实际 Serve 版本与持久数据目录 |
| `GET/PUT /api/client-config` | 客户端本机设置（音轨提取并发等，不经服务端） |
| `POST /api/pause` | 全局暂停/继续（本机管线闸 + 代理所有在线服务队列，服务端级操作） |
| `POST /api/upload` | 整片上传（回退链路，202 `{upload_id, duration_s}`，上限 `JAV_UPLOAD_MAX_GB`） |
| `POST /api/upload-audio` | 本地提取的 opus 音轨上传（主链路，202） |
| `GET /api/uploads/{upload_id}` | 上传阶段：`extracting(0-1 进度) → dispatching → done(job_id)/error` |
| `GET /api/jobs/{engine}/{job_id}/result` | 代理服务 srt 下载 |
| `POST /api/jobs/{engine}/{job_id}/retry` / `cancel` / `pause` / `resume` | 任务级操作（代理服务端队列） |
| `POST /api/local/{task_id}/pause` / `rerun` / `reassign` | 本机管线任务操作（暂停/重试/改派） |
| `POST /api/jobs/bulk` | 批量操作（`{action, tasks, jobs, engine}`；暂停/继续/重试/取消/改派） |
| `GET /api/engines/{name}/metrics` | 代理 GPU/队列监控（卡片趋势图数据源） |
| `GET /api/engines/{name}/config` / `PUT` | 代理 `/config`，Key 自动携带 |
| `GET /api/engines/{name}/scan?path=` | 代理 `/scan`，Key 自动携带 |
| `POST /api/engines/{name}/scan/submit` | 代理 `/scan/submit`，Key 自动携带 |

代理路由的错误映射：服务 `403`（未设 Key）/ `401`（Key 不符）/ `404`（旧镜像无端点）
统一映射为客户端 `400` + 中文提示；路径非法为 `400`。

## 3. 安全边界（务必读）

- **8300 全端口只应暴露给内网 / VPN**：`PUT /upload` 可向 GPU 机器派发任务，
  `GET /jobs` 暴露任务与文件路径，二者均无鉴权（v0.1）
- **`/scan` 可列举服务机器上的任意目录**（文件名 + 大小）并把任意本地路径入队处理，
  敏感性等同 `/config`，**切勿对外暴露**；泄露 `/scan` 等于交出该机的媒体库清单
- 必须对外时：在 8300/8400 前面加一层**带鉴权的反向代理**（或仅暴露 8400 + 代理层鉴权）
- 各服务的 `X-Api-Key` 保存在**客户端本地**（Web 形态为 `JAV_WEB_DATA_DIR` 对应的数据卷），接口不回显明文；
  但它仍是服务级共享密钥，备份/迁移数据卷时按密钥对待
